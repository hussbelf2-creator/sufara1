/* Buyer-side return cases and the tax credit note they generate.
   There is no backend yet, so a submitted return is stored locally per order
   id and layered over the order record — which is all the order documents
   screen needs to print the credit note. Each return gets its own case number,
   a sequential-looking credit note number and a restocking fee, so the credit
   total matches the printed note exactly. */

import type { Order, OrderReturn } from '@/pages/shop/types';
import { domesticVatRate } from '@/pages/shop/lib/tax';

const KEY = 'sta_returns_v1';

/** Restocking / return handling deducted from the buyer's credit. */
export const RESTOCKING_RATE = 0.05;

type Book = Record<string, OrderReturn>;

function readBook(): Book {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Book) : {};
  } catch {
    return {};
  }
}

function writeBook(book: Book): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(book));
  } catch {
    /* storage unavailable — the return simply will not survive a reload */
  }
}

export function loadReturns(): Book {
  return readBook();
}

export function loadReturn(orderId: string): OrderReturn | undefined {
  const saved = readBook()[orderId];
  return saved && typeof saved === 'object' ? saved : undefined;
}

export function saveReturn(orderId: string, ret: OrderReturn): void {
  const book = readBook();
  book[orderId] = ret;
  writeBook(book);
}

/** Layers a locally submitted return over the order's seeded one. */
export function applyLocalReturn(order: Order): Order {
  if (order.returnInfo) return order;
  const local = loadReturn(order.id);
  return local ? { ...order, returnInfo: local } : order;
}

function stamp(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function tail(len: number): string {
  let out = '';
  const alphabet = '0123456789';
  for (let i = 0; i < len; i += 1) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export function createReturnNo(): string {
  return `RET-${tail(3)}`;
}

/** Credit note numbers follow the invoice series: CN-YYYYMM-XXXX. */
export function createCreditNoteNo(): string {
  return `CN-${stamp()}-${tail(4)}`;
}

export function vatRateOf(order: Order): number {
  if (typeof order.vatRate === 'number') return order.vatRate;
  return (order.vat ?? 0) > 0 ? domesticVatRate() : 0;
}

export interface CreditTotals {
  /** Goods value of the returned units, in SAR. */
  goods: number;
  /** VAT reversed at the order's rate. */
  vat: number;
  /** Restocking fee deducted from the credit. */
  fee: number;
  /** Final credit the buyer receives. */
  total: number;
  rate: number;
}

/** The exact numbers a credit note must show for a chosen set of units. */
export function creditTotals(
  order: Order,
  items: { id: string; qty: number }[],
): CreditTotals {
  const goods = items.reduce((sum, it) => {
    const line = order.lines.find((l) => l.id === it.id);
    return line ? sum + line.unit * Math.max(0, it.qty) : sum;
  }, 0);
  const rate = vatRateOf(order);
  const vat = Math.round(goods * rate);
  const fee = Math.round(goods * RESTOCKING_RATE);
  return { goods, vat, fee, total: Math.max(0, goods + vat - fee), rate };
}

/** Builds the return record a submitted request turns into. */
export function buildReturn(
  order: Order,
  items: { id: string; qty: number }[],
  reason: string,
  note?: string,
): OrderReturn {
  const clean = items.filter((it) => it.qty > 0);
  const totals = creditTotals(order, clean);
  return {
    id: createReturnNo(),
    requestedAt: Date.now(),
    reason,
    creditNoteNo: createCreditNoteNo(),
    items: clean,
    restockingFee: totals.fee,
    note: note?.trim() ? note.trim() : undefined,
  };
}