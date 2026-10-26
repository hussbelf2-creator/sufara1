/* Server order + payment.

   When the backend and a payment provider are configured
   (VITE_PAYMENTS_ENABLED=true), the checkout never trusts its own numbers:
   it sends product ids, quantities and choices to the `create-order` Edge
   Function, which re-prices everything from the database, validates the
   promo code against the cap, resolves the ambassador attribution from the
   server-side click record, writes Order + SubOrders, and opens a payment with
   manual capture (authorise now, capture on dispatch, settle after the
   destination's return window). The browser only gets back a hosted payment
   URL for mada / Apple Pay / cards. */

import { supabase, backendReady } from '@/lib/supabase';
import type { ShipMethod } from './shipping';
import type { CustomsParty } from './tax';

export const PAYMENTS_ENABLED = backendReady && import.meta.env.VITE_PAYMENTS_ENABLED === 'true';

export interface ServerOrderInput {
  lines: { productId: string; qty: number }[];
  buyer: { name: string; company: string; email: string; phone: string; vatNo?: string; whatsapp?: boolean };
  destination: { country: string; city: string; port: string; address: string };
  method: ShipMethod;
  incoterm: string;
  customsParty: CustomsParty;
  promoCode?: string;
  /** Code of the group order the buyer joins (method 'group' only). */
  groupCode?: string;
  /** Click id issued by track-click when the visitor landed on an ambassador page. */
  clickId?: string;
  displayCurrency: string;
  notes?: string;
  successUrl: string;
  cancelUrl: string;
}

export interface ServerOrderResult {
  ok: boolean;
  orderId?: string;
  paymentUrl?: string;
  /** 'transfer' when no card gateway is configured: pay by bank transfer. */
  mode?: 'gateway' | 'transfer';
  /** Total as priced by the server (SAR). */
  total?: number;
  error?: string;
}

export async function createServerOrder(input: ServerOrderInput): Promise<ServerOrderResult> {
  try {
    const { data, error } = await supabase.functions.invoke('create-order', { body: input });
    if (error) return { ok: false, error: error.message };
    const res = data as { order_id?: string; payment_url?: string | null; mode?: string; total?: number; error?: string };
    if (res.error) return { ok: false, error: res.error };
    return {
      ok: true, orderId: res.order_id, paymentUrl: res.payment_url ?? undefined,
      mode: res.payment_url ? 'gateway' : 'transfer', total: res.total,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'network' };
  }
}

/* ── Referral click id ─────────────────────────────────────────────────
   track-click returns an opaque click id; it is the only attribution proof
   the server accepts (a typed code alone does not prove a visit). */
const CLICK_KEY = 'safeer_click_id';

export async function trackReferralClick(slug: string, factoryId: string, code?: string): Promise<void> {
  if (!backendReady) return;
  try {
    const { data } = await supabase.functions.invoke('track-click', {
      body: { slug, factory_id: factoryId, code, referrer: document.referrer || null },
    });
    const id = (data as { click_id?: string } | null)?.click_id;
    if (id) localStorage.setItem(CLICK_KEY, id);
  } catch {
    /* attribution falls back to the code on the order */
  }
}

export function readClickId(): string | undefined {
  try {
    return localStorage.getItem(CLICK_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}
