import { useCallback, useEffect, useState } from 'react';
import {
  loadClearance, saveClearance, type ClearanceDoc, type ClearanceState,
} from '@/pages/shop/lib/clearance';

/* Local, per-shipment clearance checklist state (uploaded paper names and the
   duty-payment confirmation). Keeping it in one hook means the tracking card
   stays a pure view and the storage detail never leaks into the page. */
export function useClearance(tracking: string) {
  const [state, setState] = useState<ClearanceState>(() => loadClearance(tracking));

  useEffect(() => {
    setState(loadClearance(tracking));
  }, [tracking]);

  const persist = useCallback(
    (next: ClearanceState) => {
      setState(next);
      saveClearance(tracking, next);
    },
    [tracking],
  );

  const addDocs = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      const added: ClearanceDoc[] = files.map((f) => ({ name: f.name, size: f.size, at: Date.now() }));
      const current = loadClearance(tracking);
      const merged = [...current.docs, ...added].slice(-8);
      persist({ ...current, docs: merged });
    },
    [persist, tracking],
  );

  const removeDoc = useCallback(
    (name: string) => {
      const current = loadClearance(tracking);
      persist({ ...current, docs: current.docs.filter((d) => d.name !== name) });
    },
    [persist, tracking],
  );

  const confirmPaid = useCallback(() => {
    const current = loadClearance(tracking);
    persist({ ...current, paid: true, paidAt: Date.now() });
  }, [persist, tracking]);

  const reset = useCallback(() => {
    persist({ docs: [], paid: false });
  }, [persist]);

  return { state, addDocs, removeDoc, confirmPaid, reset };
}