/* Unit economics for the settlement ledger.

   Every rate comes from the active PlatformConfig (src/config/platform.ts);
   none is written here. Per order:

     take      = goods × take rate of the channel (retail / wholesale)
     discount  = promo discount, capped at the platform-funded cap
     ambassador= tier rate (retail, first order of a new customer only)
                 or wholesale rate (recurring for N months on the same buyer)
     leader    = leader override on the direct team member's commission base
     net       = take − discount − ambassador − leader − payment fee − reserve

   The discount is a real cost: the buyer paid less, so the platform keeps
   less. Leaving it out is how a ledger shows a profit that does not exist. */

import { getConfig } from '@/config/store';
import { tierById, type PlatformConfig, type SalesChannel } from '@/config/platform';

export interface LedgerOrder {
  id: string;
  buyer: string;
  country: string;
  /** Goods value in SAR after wholesale pricing, before discount, shipping and customs. */
  gross: number;
  /** 'new' = first order of a newly acquired customer, otherwise 'repeat'. */
  segment: string;
  /** Ambassador code that brought the order, empty when unattributed. */
  ambassador: string;
  status: string;
  tone: string;
  /** ISO date (YYYY-MM-DD) the order was settled in. */
  date?: string;
  /** Retail (single parcel, spread) or wholesale (deal, profit). Defaults to retail. */
  channel?: SalesChannel;
  /** Promo discount the buyer actually received, in SAR. */
  discount?: number;
  /** Ambassador's tier id at the time of the order (retail). */
  ambassadorTier?: string;
  /** Leader ambassador above the attributing ambassador, if any. */
  leader?: string;
  /** Wholesale: months since the buyer's first attributed deal. */
  monthsSinceFirstDeal?: number;
}

export interface SettledOrder extends LedgerOrder {
  channel: SalesChannel;
  takeRate: number;
  take: number;
  discount: number;
  /** Part of the requested discount above the cap, refused at checkout. */
  discountOverCap: number;
  ambassadorRate: number;
  ambassadorCommission: number;
  leaderBonus: number;
  paymentFee: number;
  returnReserve: number;
  net: number;
  /** Net platform margin as a ratio of the goods value. */
  margin: number;
  /** True when the margin is below the configured floor. */
  belowFloor: boolean;
}

const round = (n: number): number => Math.round(n);

/** Commission rate the attributing ambassador earns on this order (0 when none). */
export function ambassadorRateFor(order: LedgerOrder, cfg: PlatformConfig = getConfig()): number {
  if (!order.ambassador) return 0;
  const channel = order.channel ?? 'retail';
  if (channel === 'wholesale') {
    const months = order.monthsSinceFirstDeal ?? 0;
    return months < cfg.ambassador.wholesaleRecurringMonths ? cfg.ambassador.wholesale.value : 0;
  }
  /* Retail: paid on the first order of a newly acquired customer only, so an
     ambassador cannot claim a buyer the factory already had. */
  if (cfg.ambassador.retailScope === 'first_order' && order.segment === 'repeat') return 0;
  return tierById(cfg, order.ambassadorTier).rate;
}

export function settleOrder(order: LedgerOrder, cfg: PlatformConfig = getConfig()): SettledOrder {
  const channel: SalesChannel = order.channel ?? 'retail';
  const gross = Math.max(0, order.gross);
  const takeRate = cfg.take[channel].value;
  const take = round(gross * takeRate);

  const promoAllowed = cfg.promo.channels.includes(channel);
  const cap = promoAllowed ? round(gross * cfg.promo.capRate) : 0;
  const requested = Math.max(0, order.discount ?? 0);
  const discount = Math.min(requested, cap);

  const ambassadorRate = ambassadorRateFor(order, cfg);
  const ambassadorCommission = round(gross * ambassadorRate);
  const leaderBonus = ambassadorCommission > 0 && order.leader ? round(gross * cfg.ambassador.leaderBonus) : 0;

  /* The gateway charges on what the buyer actually paid for the goods. */
  const paymentFee = round((gross - discount) * cfg.costs.paymentFee[channel]);
  const returnReserve = round(gross * cfg.costs.returnReserve[channel]);
  const net = take - discount - ambassadorCommission - leaderBonus - paymentFee - returnReserve;
  const margin = gross > 0 ? net / gross : 0;

  return {
    ...order,
    channel,
    takeRate,
    take,
    discount,
    discountOverCap: requested - discount,
    ambassadorRate,
    ambassadorCommission,
    leaderBonus,
    paymentFee,
    returnReserve,
    net,
    margin,
    belowFloor: gross > 0 && margin < cfg.costs.netFloor,
  };
}

export function totalsOf(rows: SettledOrder[]) {
  const sum = (pick: (r: SettledOrder) => number) => rows.reduce((acc, r) => acc + pick(r), 0);
  const gross = sum((r) => r.gross);
  const net = sum((r) => r.net);
  return {
    gross,
    take: sum((r) => r.take),
    discount: sum((r) => r.discount),
    ambassador: sum((r) => r.ambassadorCommission),
    leader: sum((r) => r.leaderBonus),
    paymentFee: sum((r) => r.paymentFee),
    reserve: sum((r) => r.returnReserve),
    net,
    margin: gross > 0 ? net / gross : 0,
    belowFloor: rows.filter((r) => r.belowFloor).length,
  };
}

/* ------------------------------------------------------------ period filter
   Closing the month happens on this page, so the ledger can be sliced by the
   current calendar month (the closing window), the last 30 / 90 days, or the
   whole book. Dates are ISO day strings so the comparison is timezone-safe. */

export type LedgerPeriod = 'month' | 'd30' | 'd90' | 'all';

export const LEDGER_PERIODS: LedgerPeriod[] = ['month', 'd30', 'd90', 'all'];

/** Start of the selected window as a UTC timestamp, or null for "all". */
export function periodStart(period: LedgerPeriod, now = new Date()): number | null {
  if (period === 'all') return null;
  if (period === 'month') return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const days = period === 'd30' ? 30 : 90;
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - days * 86400000;
}

export function inPeriod(date: string | undefined, period: LedgerPeriod, now = new Date()): boolean {
  const start = periodStart(period, now);
  if (start === null) return true;
  if (!date) return false;
  const at = Date.parse(`${date}T00:00:00Z`);
  return Number.isFinite(at) && at >= start;
}

/** The label YYYY-MM used in the exported file name. */
export function monthStamp(now = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function filterByPeriod(rows: LedgerOrder[], period: LedgerPeriod, now = new Date()): LedgerOrder[] {
  return rows.filter((r) => inPeriod(r.date, period, now));
}

/* ------------------------------------------------- commission lifecycle
   pending  → the order is paid but not yet delivered, or still inside the
              destination's return window
   eligible → delivered and the return window has closed: payable
   paid     → included in a payout batch
   void     → order cancelled or fully returned before eligibility        */

export type CommissionState = 'pending' | 'eligible' | 'paid' | 'void';

export function commissionState(input: {
  deliveredAt?: string | null;
  returnDays: number;
  returned?: boolean;
  paidOut?: boolean;
  now?: Date;
}): CommissionState {
  if (input.returned) return 'void';
  if (input.paidOut) return 'paid';
  if (!input.deliveredAt) return 'pending';
  const delivered = Date.parse(input.deliveredAt);
  if (!Number.isFinite(delivered)) return 'pending';
  const unlock = delivered + input.returnDays * 86400000;
  return (input.now ?? new Date()).getTime() >= unlock ? 'eligible' : 'pending';
}
