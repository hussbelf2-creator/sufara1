/* Promo / discount code logic shared by the cart and the checkout.

   Rules (Decision Log §4):
   - A code is accepted only when it matches a registered code exactly.
     There is no prefix matching: "AHMAD-anything" is rejected, so codes
     cannot be guessed, invented or scraped into coupon sites.
   - Every discount is funded by the platform and capped at
     PlatformConfig.promo.capRate of the goods value, whatever the code says.
   - Codes apply only to the channels listed in promo.channels (retail).
   The server (create-order) re-validates the code; this file only shows the
   buyer the same answer early. */

import type { Promo } from '@/pages/shop/types';
import { promoCodes } from '@/mocks/shop';
import { getConfig } from '@/config/store';

/* ── Ambassador discount codes ──────────────────────────────────────────
   Every published ambassador marketing page carries a code that gives the
   customer a discount and attributes the order to its ambassador. The list
   is language-independent (only the display name differs per language, and
   that name is resolved in the UI from the registry by slug). */
export interface AmbPromo {
  code: string;
  slug: string;
  factoryId: string;
  discount: number;
}

/* Discount is stored in percent for display; the effective value is always
   min(discount, cap). A new page code must be registered (referral_links) to
   exist at all — generating a page on the client does not create a code. */
export const ambPromoCodes: AmbPromo[] = [
  { code: 'AHMAD-TAMR4', slug: 'ahmad-jo-2481', factoryId: 'hasa', discount: 4 },
  { code: 'AHMAD-OUD4', slug: 'ahmad-jo-2481', factoryId: 'oud', discount: 4 },
  { code: 'REEM-TAMR4', slug: 'reem-eg-3012', factoryId: 'hasa', discount: 4 },
  { code: 'YOUSEF-TAMR4', slug: 'yousef-tr-2044', factoryId: 'hasa', discount: 4 },
  { code: 'KHALED-COF4', slug: 'khaled-jo-1190', factoryId: 'fifa', discount: 4 },
  { code: 'REEM-ROSE4', slug: 'reem-eg-3012', factoryId: 'taif', discount: 4 },
];

const registered = new Map<string, AmbPromo>();

/** Adds server-issued referral codes (loaded from referral_links) to the lookup. */
export function registerAmbPromos(list: AmbPromo[]): void {
  list.forEach((p) => registered.set(p.code.trim().toUpperCase(), { ...p, code: p.code.trim().toUpperCase() }));
}

/* Resolves an ambassador code by exact match only. */
export function findAmbPromo(code: string): AmbPromo | undefined {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return undefined;
  return ambPromoCodes.find((p) => p.code === normalized) ?? registered.get(normalized);
}

/* The canonical code shown on / shared from a given ambassador + factory page. */
export function findAmbPromoByPage(slug: string, factoryId: string): AmbPromo | undefined {
  return ambPromoCodes.find((p) => p.slug === slug && p.factoryId === factoryId);
}

/* ── Code remembered from a landing page ────────────────────────────────
   Visiting a marketing page remembers its code so the checkout can apply it
   automatically and keep the attribution airtight. */
export const AMB_CODE_KEY = 'sta_amb_pending_code';

export function rememberAmbCode(code: string): void {
  try {
    window.localStorage.setItem(AMB_CODE_KEY, code);
  } catch {
    /* storage unavailable */
  }
}

export function readRememberedAmbCode(): string {
  try {
    return window.localStorage.getItem(AMB_CODE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function clearRememberedAmbCode(): void {
  try {
    window.localStorage.removeItem(AMB_CODE_KEY);
  } catch {
    /* storage unavailable */
  }
}

/** Percent value of a code after the platform cap is applied. */
export function cappedPercent(value: number): number {
  const capPct = getConfig().promo.capRate * 100;
  return Math.max(0, Math.min(value, capPct));
}

function buildAmbPromo(code: string, amb: AmbPromo): Promo {
  return {
    code,
    label: '',
    description: '',
    kind: 'percent',
    value: cappedPercent(Math.min(amb.discount, getConfig().promo.ambassadorCodeRate * 100)),
    minSubtotal: 0,
    ambassadorSlug: amb.slug,
    factoryId: amb.factoryId || undefined,
  };
}

/* Codes published by the admin (public_promo_codes RPC) join the built-in
   list on start-up; the server still re-validates on every order. */
let serverCodes: Promo[] = [];
export function registerPromoCodes(list: { code: string; kind: string; value: number; min_subtotal: number }[]): void {
  serverCodes = list
    .filter((p) => p.kind === 'percent' || p.kind === 'fixed')
    .map((p) => ({
      code: p.code.toUpperCase(), label: '', description: '', kind: p.kind as Promo['kind'], value: Number(p.value), minSubtotal: Number(p.min_subtotal),
    }));
}

export async function loadPromoCodes(): Promise<void> {
  try {
    const { supabase, backendReady } = await import('@/lib/supabase');
    if (!backendReady) return;
    const { data } = await supabase.rpc('public_promo_codes');
    if (Array.isArray(data)) registerPromoCodes(data);
  } catch {
    /* built-in list only */
  }
}

export function findPromo(code: string): Promo | undefined {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return undefined;
  const standard = serverCodes.find((p) => p.code === normalized) ?? (promoCodes as Promo[]).find((p) => p.code === normalized);
  if (standard) return standard.kind === 'percent' ? { ...standard, value: cappedPercent(standard.value) } : standard;
  const amb = findAmbPromo(normalized);
  return amb ? buildAmbPromo(normalized, amb) : undefined;
}

export interface PromoResult {
  ok: boolean;
  messageKey: string;
  messageParams?: Record<string, string | number>;
  promo?: Promo;
}

/* Validates a code against the current subtotal and returns a translatable
   message key so the UI can render it in the active language. */
export function validatePromo(code: string, subtotal: number, channel: 'retail' | 'wholesale' = 'retail'): PromoResult {
  const promo = findPromo(code);
  if (!promo) {
    return { ok: false, messageKey: 'shop.promo.msgInvalid' };
  }
  if (!getConfig().promo.channels.includes(channel)) {
    return { ok: false, messageKey: 'shop.promo.msgChannel' };
  }
  if (subtotal < promo.minSubtotal) {
    return {
      ok: false,
      messageKey: 'shop.promo.msgMin',
      messageParams: { min: promo.minSubtotal.toLocaleString('en-US') },
    };
  }
  return {
    ok: true,
    messageKey: 'shop.promo.msgApplied',
    messageParams: { code: promo.code },
    promo,
  };
}

/* Discount in SAR, never above the platform cap. Shipping-type promos are
   resolved at checkout (they zero the freight), so they contribute 0 here. */
export function computeDiscount(promo: Promo | null, subtotal: number): number {
  if (!promo || subtotal <= 0 || subtotal < promo.minSubtotal) return 0;
  const cap = Math.floor(subtotal * getConfig().promo.capRate);
  let raw = 0;
  if (promo.kind === 'percent') raw = Math.round((subtotal * promo.value) / 100);
  else if (promo.kind === 'fixed') raw = Math.min(promo.value, subtotal);
  return Math.max(0, Math.min(raw, cap));
}

export function isFreeShippingPromo(promo: Promo | null, subtotal: number): boolean {
  return !!promo && promo.kind === 'shipping' && subtotal >= promo.minSubtotal;
}