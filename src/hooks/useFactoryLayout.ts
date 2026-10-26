import { useEffect, useState } from 'react';

/* Which cards the factory owner wants on the factory home page AND in what
   order. The layout is a short document ({ order, visible }) kept in
   localStorage so it survives reloads, and broadcast with a window event so
   the home view and the custom-dashboard view always stay in sync. */
export type FactoryCardKey = 'stats' | 'todayOrders' | 'readiness' | 'countries' | 'rfq' | 'alerts';
export type FactoryMoveDir = 'up' | 'down';

export const FACTORY_CARD_KEYS: FactoryCardKey[] = ['stats', 'alerts', 'todayOrders', 'readiness', 'countries', 'rfq'];

const STORAGE_KEY = 'sta-factory-layout';
const EVT = 'sta-factory-layout-change';

type Layout = { order: FactoryCardKey[]; visible: FactoryCardKey[] };

const DEFAULT_ORDER: FactoryCardKey[] = [...FACTORY_CARD_KEYS];
const DEFAULT_VISIBLE: FactoryCardKey[] = [...FACTORY_CARD_KEYS];

const isKey = (k: unknown): k is FactoryCardKey => FACTORY_CARD_KEYS.includes(k as FactoryCardKey);

/* Keeps a saved order valid: drops unknown keys and appends any card that is
   missing so newly added cards never disappear from the list. */
function normalizeOrder(input: unknown): FactoryCardKey[] {
  const list = Array.isArray(input) ? input.filter(isKey) : [];
  FACTORY_CARD_KEYS.forEach((k) => { if (!list.includes(k)) list.push(k); });
  return list;
}

function readLayout(): Layout {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { order: [...DEFAULT_ORDER], visible: [...DEFAULT_VISIBLE] };
    const parsed = JSON.parse(raw);
    /* Backwards compatible with the older array-only format. */
    if (Array.isArray(parsed)) {
      return { order: [...DEFAULT_ORDER], visible: parsed.filter(isKey) };
    }
    if (parsed && typeof parsed === 'object') {
      return {
        order: normalizeOrder((parsed as Layout).order),
        visible: Array.isArray((parsed as Layout).visible)
          ? (parsed as Layout).visible.filter(isKey)
          : [...DEFAULT_VISIBLE],
      };
    }
  } catch {
    /* ignore malformed or unavailable storage */
  }
  return { order: [...DEFAULT_ORDER], visible: [...DEFAULT_VISIBLE] };
}

function writeLayout(layout: Layout): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    /* ignore quota errors */
  }
  window.dispatchEvent(new Event(EVT));
}

export function useFactoryLayout() {
  const [layout, setLayout] = useState<Layout>(readLayout);

  useEffect(() => {
    const sync = () => setLayout(readLayout());
    window.addEventListener(EVT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const apply = (next: Layout) => { setLayout(next); writeLayout(next); };

  const toggle = (key: FactoryCardKey) => {
    const visible = layout.visible.includes(key)
      ? layout.visible.filter((k) => k !== key)
      : [...layout.visible, key];
    apply({ ...layout, visible });
  };

  const move = (key: FactoryCardKey, dir: FactoryMoveDir) => {
    const idx = layout.order.indexOf(key);
    if (idx < 0) return;
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= layout.order.length) return;
    const order = [...layout.order];
    [order[idx], order[target]] = [order[target], order[idx]];
    apply({ ...layout, order });
  };

  const reset = () => apply({ order: [...DEFAULT_ORDER], visible: [...DEFAULT_VISIBLE] });

  return { order: layout.order, visible: layout.visible, toggle, move, reset };
}