import {
  createContext, useCallback, useContext, useMemo, useState, type ReactNode,
} from 'react';
import type { Product } from '@/pages/shop/types';
import QuickViewModal from './QuickViewModal';
import RfqModal from './RfqModal';

interface RfqTarget {
  product?: Product | null;
  factoryName?: string;
  items?: { name: string; qty: number }[];
}

interface ShopModalsApi {
  openQuickView: (product: Product) => void;
  openRfq: (target?: RfqTarget) => void;
}

const ShopModalsCtx = createContext<ShopModalsApi>({
  openQuickView: () => {},
  openRfq: () => {},
});

export function useShopModals() {
  return useContext(ShopModalsCtx);
}

/* Hosts the Quick View and RFQ modals once for the whole app, so any product
   card or page can open them without leaving the current page. */
export function ShopModalsProvider({ children }: { children: ReactNode }) {
  const [quick, setQuick] = useState<Product | null>(null);
  const [rfq, setRfq] = useState<RfqTarget | null>(null);

  const openQuickView = useCallback((product: Product) => setQuick(product), []);
  const openRfq = useCallback((target?: RfqTarget) => {
    setQuick(null);
    setRfq(target ?? {});
  }, []);
  const closeQuick = useCallback(() => setQuick(null), []);
  const closeRfq = useCallback(() => setRfq(null), []);

  const value = useMemo(
    () => ({ openQuickView, openRfq }),
    [openQuickView, openRfq],
  );

  return (
    <ShopModalsCtx.Provider value={value}>
      {children}
      <QuickViewModal
        product={quick}
        open={!!quick}
        onClose={closeQuick}
        onRfq={(p) => openRfq({ product: p })}
      />
      <RfqModal
        open={!!rfq}
        onClose={closeRfq}
        product={rfq?.product ?? null}
        factoryName={rfq?.factoryName}
        items={rfq?.items}
      />
    </ShopModalsCtx.Provider>
  );
}