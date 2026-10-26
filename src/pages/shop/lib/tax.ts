/* VAT + tax-invoice metadata for the storefront.
   The platform exports from Jeddah, so a cross-border sale is zero-rated (0%) with the
   export evidence kept on file, while a domestic Saudi sale carries 15% VAT.
   Keeping this in one place means the cart, checkout, order and printed
   invoice all read the exact same numbers. */

import { getConfig } from '@/config/store';

/* Rates and the seller identifiers are read from PlatformConfig. ZATCA
   requires the seller's VAT registration number (and the commercial
   registration) on every tax invoice. */
export const SELLER_PROFILE = {
  get vatNo() { return getConfig().tax.sellerVatNo; },
  get crn() { return getConfig().tax.sellerCrn; },
};

export type TaxReason = 'export' | 'domestic';

export interface TaxBreakdown {
  /** Applied rate, 0 or 0.15. */
  rate: number;
  /** VAT amount in SAR. */
  amount: number;
  /** True when the sale is zero-rated because it leaves the Kingdom. */
  exempt: boolean;
  reason: TaxReason;
}

/* Saudi Arabia is the only domestic destination; everything else is export. */
export function taxForCountry(countryCode: string, netGoods: number): TaxBreakdown {
  const domestic = (countryCode || '').toLowerCase() === 'sa';
  const { domesticVat, exportVat } = getConfig().tax;
  const rate = domestic ? domesticVat : exportVat;
  const base = Math.max(0, netGoods);
  return {
    rate,
    amount: domestic ? Math.round(base * rate) : 0,
    exempt: !domestic,
    reason: domestic ? 'domestic' : 'export',
  };
}

/* ── Invoice numbering (ZATCA «فاتورة») ─────────────────────────────────
   A tax invoice number must be sequential with no gaps, carry an invoice
   counter (ICV) and chain to the previous invoice through its hash (PIH).
   Only the server can guarantee that, so the browser never invents one:

   - Before payment the checkout shows a pro-forma reference (PRO-…), which is
     explicitly not a tax invoice.
   - After payment capture, the `issue_invoice` database function assigns the
     next number from a locked counter, hashes the canonical invoice payload
     with the previous hash and stores it append-only (see migrations). */

export function proformaRef(now = new Date()): string {
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const bytes = new Uint8Array(4);
  try {
    crypto.getRandomValues(bytes);
  } catch {
    bytes.forEach((_, i) => { bytes[i] = Math.floor(Math.random() * 256); });
  }
  const tail = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `PRO-${stamp}-${tail}`;
}

/** True only for a number issued by the server sequence (INV-YYYY-NNNNNNN). */
export function isIssuedInvoiceNo(no: string | undefined): boolean {
  return !!no && /^INV-\d{4}-\d{7}$/.test(no);
}

export function formatInvoiceNo(year: number, counter: number): string {
  return `INV-${year}-${String(counter).padStart(7, '0')}`;
}

export interface IssuedInvoice {
  invoiceNo: string;
  icv: number;
  hash: string;
  previousHash: string;
}

/** Asks the server to issue the tax invoice for a paid order. */
export async function issueInvoice(orderId: string): Promise<IssuedInvoice | null> {
  try {
    const { supabase, backendReady } = await import('@/lib/supabase');
    if (!backendReady) return null;
    const { data, error } = await supabase.rpc('issue_invoice', { p_order_id: orderId });
    if (error || !data) return null;
    const row = data as { invoice_no: string; icv: number; hash: string; previous_hash: string };
    return { invoiceNo: row.invoice_no, icv: row.icv, hash: row.hash, previousHash: row.previous_hash };
  } catch {
    return null;
  }
}

export type CustomsParty = 'platform' | 'buyer' | 'agent';

/* Default clearing party for each Incoterm. DDP means the platform acts as the
   importer of record; every other term leaves clearance with the buyer side. */
export function defaultCustomsParty(incoterm: string): CustomsParty {
  return incoterm === 'DDP' ? 'platform' : 'buyer';
}

/** Current domestic VAT rate from the active config. */
export function domesticVatRate(): number {
  return getConfig().tax.domesticVat;
}
