/* Keeps the storefront's prices, tiers, stock and availability equal to the
   `products` table — the same rows create-order prices from — so the buyer
   is never shown one price and charged another. Descriptive copy still comes
   from the bundled catalogue; images do too unless the factory uploaded its own. Without a backend nothing changes. */

import { useSyncExternalStore } from 'react';
import { supabase, backendReady } from '@/lib/supabase';

export interface ProductLive {
  factory_id: string;
  category_id: string;
  name_ar: string;
  name_en: string;
  short_ar: string;
  short_en: string;
  image_url: string | null;
  /** Images the factory uploaded (first = cover); empty for bundled products. */
  images: string[];
  weight_kg: number;
  hs_code: string | null;
  price: number;
  stock: number;
  moq: number | null;
  tiers: { min: number; max: number; price: number }[];
  active: boolean;
}

export interface FactoryLive { id: string; name_ar: string; name_en: string; city: string; created_at: string }

let live: Record<string, ProductLive> | null = null;
let liveFactories: Record<string, FactoryLive> = {};
const listeners = new Set<() => void>();

export async function loadCatalogLive(): Promise<void> {
  if (!backendReady) return;
  try {
    const [{ data, error }, fac] = await Promise.all([
      supabase.from('products').select('id, factory_id, category_id, name_ar, name_en, short_ar, short_en, image_url, images, weight_kg, hs_code, price, stock, moq, tiers, active'),
      supabase.from('factories').select('id, name_ar, name_en, city, created_at'),
    ]);
    if (error || !data || !data.length) return;
    liveFactories = {};
    (fac.data ?? []).forEach((f) => { liveFactories[f.id as string] = f as FactoryLive; });
    const next: Record<string, ProductLive> = {};
    data.forEach((r) => {
      next[r.id as string] = {
        factory_id: r.factory_id as string, category_id: r.category_id as string,
        name_ar: (r.name_ar as string) ?? '', name_en: (r.name_en as string) ?? '',
        short_ar: (r.short_ar as string) ?? '', short_en: (r.short_en as string) ?? '',
        image_url: (r.image_url as string | null) ?? null, images: Array.isArray(r.images) ? (r.images as string[]) : [], weight_kg: Number(r.weight_kg), hs_code: (r.hs_code as string | null) ?? null,
        price: Number(r.price), stock: Number(r.stock), moq: r.moq == null ? null : Number(r.moq),
        tiers: Array.isArray(r.tiers) ? r.tiers : [], active: Boolean(r.active),
      };
    });
    live = next;
    listeners.forEach((fn) => fn());
  } catch {
    /* keep bundled prices */
  }
}

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
let snap: { products: Record<string, ProductLive>; factories: Record<string, FactoryLive> } | null = null;
const snapshot = () => {
  if (!live) return null;
  if (!snap || snap.products !== live || snap.factories !== liveFactories) snap = { products: live, factories: liveFactories };
  return snap;
};

export function useCatalogLive() {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}
