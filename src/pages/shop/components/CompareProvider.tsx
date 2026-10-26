import {
  createContext, useCallback, useContext, useMemo, useState, type ReactNode,
} from 'react';
import type { Product } from '@/pages/shop/types';
import CompareBar from './CompareBar';

/* Maximum number of products a merchant can line up side by side. */
export const COMPARE_MAX = 4;

interface CompareApi {
  ids: string[];
  max: number;
  has: (id: string) => boolean;
  toggle: (product: Product) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const CompareCtx = createContext<CompareApi>({
  ids: [],
  max: COMPARE_MAX,
  has: () => false,
  toggle: () => {},
  remove: () => {},
  clear: () => {},
});

export function useCompare() {
  return useContext(CompareCtx);
}

/* Holds the products a merchant has queued for comparison, once for the whole
   app, so any product card or page can push a product into the line-up. */
export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback((product: Product) => {
    setIds((cur) => {
      if (cur.includes(product.id)) return cur.filter((x) => x !== product.id);
      if (cur.length >= COMPARE_MAX) return [...cur.slice(1), product.id];
      return [...cur, product.id];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setIds((cur) => cur.filter((x) => x !== id));
  }, []);

  const clear = useCallback(() => setIds([]), []);

  const value = useMemo(
    () => ({ ids, max: COMPARE_MAX, has, toggle, remove, clear }),
    [ids, has, toggle, remove, clear],
  );

  return (
    <CompareCtx.Provider value={value}>
      {children}
      <CompareBar />
    </CompareCtx.Provider>
  );
}