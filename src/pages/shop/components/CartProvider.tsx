import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react';
import type { Product, Promo } from '@/pages/shop/types';
import { useCatalog } from '@/hooks/useCatalog';
import { loadCart, saveCart, type CartLine } from '@/pages/shop/lib/cartStore';
import { tierUnitPrice } from '@/pages/shop/lib/format';
import { computeDiscount, findPromo, isFreeShippingPromo, validatePromo, clearRememberedAmbCode, readRememberedAmbCode, type PromoResult } from '@/pages/shop/lib/promo';
import { cartChannel } from '@/pages/shop/lib/channel';
import type { SalesChannel } from '@/config/platform';
import { usePlatformConfig } from '@/config/store';
import CartToast from './CartToast';

export interface CartItem extends CartLine {
  product: Product;
  unit: number;
  total: number;
}

interface CartApi {
  items: CartItem[];
  count: number;
  subtotal: number;
  savings: number;
  /** retail (single parcel) or wholesale (a line reached its MOQ). */
  channel: SalesChannel;
  promo: Promo | null;
  discount: number;
  freeShipping: boolean;
  applyPromo: (code: string) => PromoResult;
  removePromo: () => void;
  add: (product: Product, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
  qtyOf: (id: string) => number;
}

const PROMO_KEY = 'sta_promo_code';

const noop = () => {};
const CartCtx = createContext<CartApi>({
  items: [],
  count: 0,
  subtotal: 0,
  savings: 0,
  channel: 'retail',
  promo: null,
  discount: 0,
  freeShipping: false,
  applyPromo: () => ({ ok: false, messageKey: '' }),
  removePromo: noop,
  add: noop,
  setQty: noop,
  remove: noop,
  clear: noop,
  has: () => false,
  qtyOf: () => 0,
});

export function useCart() {
  return useContext(CartCtx);
}

/* Holds the shopper's cart once for the whole app, keeps it in sync with
   browser storage, and exposes the add / remove / quantity actions every
   product surface needs. */
export function CartProvider({ children }: { children: ReactNode }) {
  const { products } = useCatalog();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [promo, setPromo] = useState<Promo | null>(null);
  const [toast, setToast] = useState<{ id: number; name: string; qty: number } | null>(null);
  const linesRef = useRef<CartLine[]>([]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(PROMO_KEY);
      if (saved) {
        setPromo(findPromo(saved) ?? null);
        return;
      }
      /* No code applied yet — honour the code of the last marketing page
         the visitor landed on, so the ambassador keeps the attribution. */
      const remembered = readRememberedAmbCode();
      const fromPage = remembered ? findPromo(remembered) : undefined;
      if (fromPage) {
        setPromo(fromPage);
        window.localStorage.setItem(PROMO_KEY, fromPage.code);
      }
    } catch {
      /* localStorage unavailable: the promo simply is not restored. */
    }
  }, []);

  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);

  useEffect(() => {
    let alive = true;
    loadCart().then((stored) => {
      if (!alive) return;
      setLines(stored);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveCart(lines);
  }, [lines, ready]);

  /* Retail starts at one unit; the wholesale tier price kicks in by itself
     once a line reaches the MOQ (see tierUnitPrice / cartChannel). */
  const add = useCallback((product: Product, qty = 1) => {
    const stock = product.stock || 9999;
    const min = 1;
    const step = Math.max(1, Math.floor(qty));
    const current = linesRef.current;
    const found = current.find((l) => l.id === product.id);
    const nextQty = found
      ? Math.min(stock, found.qty + step)
      : Math.min(stock, Math.max(min, step));

    setLines(found
      ? current.map((l) => (l.id === product.id ? { ...l, qty: nextQty } : l))
      : [...current, { id: product.id, qty: nextQty }]);
    setToast({ id: Date.now(), name: product.name, qty: nextQty });
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setLines((current) => current.map((l) => {
      if (l.id !== id) return l;
      const product = (products as Product[]).find((p) => p.id === id);
      const min = 1;
      const stock = product?.stock || 9999;
      const safe = Math.max(min, Math.min(stock, Math.floor(qty)));
      return { ...l, qty: Number.isFinite(safe) ? safe : min };
    }));
  }, [products]);

  const remove = useCallback((id: string) => {
    setLines((current) => current.filter((l) => l.id !== id));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const has = useCallback((id: string) => lines.some((l) => l.id === id), [lines]);
  const qtyOf = useCallback(
    (id: string) => lines.find((l) => l.id === id)?.qty ?? 0,
    [lines],
  );

  const items = useMemo<CartItem[]>(() => lines.reduce<CartItem[]>((acc, line) => {
    const product = (products as Product[]).find((p) => p.id === line.id);
    if (!product) return acc;
    const unit = tierUnitPrice(product, line.qty);
    acc.push({ ...line, product, unit, total: unit * line.qty });
    return acc;
  }, []), [lines, products]);

  const count = useMemo(() => lines.reduce((sum, l) => sum + l.qty, 0), [lines]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.total, 0), [items]);
  const savings = useMemo(
    () => items.reduce((sum, i) => sum + Math.max(0, i.product.price - i.unit) * i.qty, 0),
    [items],
  );

  const config = usePlatformConfig();
  const channel = useMemo(() => cartChannel(items), [items]);
  const promoAllowed = config.promo.channels.includes(channel);
  const discount = useMemo(
    () => (promoAllowed ? computeDiscount(promo, subtotal) : 0),
    // config is a dependency so a newly published cap applies immediately
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [promo, subtotal, promoAllowed, config],
  );
  const freeShipping = useMemo(() => promoAllowed && isFreeShippingPromo(promo, subtotal), [promo, subtotal, promoAllowed]);

  const applyPromo = useCallback((code: string): PromoResult => {
    const result = validatePromo(code, subtotal, channel);
    if (result.ok && result.promo) {
      setPromo(result.promo);
      try {
        window.localStorage.setItem(PROMO_KEY, result.promo.code);
      } catch {
        /* ignore persistence failure */
      }
    }
    return result;
  }, [subtotal, channel]);

  const removePromo = useCallback(() => {
    setPromo(null);
    clearRememberedAmbCode();
    try {
      window.localStorage.removeItem(PROMO_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const value = useMemo<CartApi>(() => ({
    items, count, subtotal, savings, channel, promo, discount, freeShipping,
    applyPromo, removePromo, add, setQty, remove, clear, has, qtyOf,
  }), [
    items, count, subtotal, savings, channel, promo, discount, freeShipping,
    applyPromo, removePromo, add, setQty, remove, clear, has, qtyOf,
  ]);

  return (
    <CartCtx.Provider value={value}>
      {children}
      <CartToast toast={toast} onDone={dismissToast} />
    </CartCtx.Provider>
  );
}