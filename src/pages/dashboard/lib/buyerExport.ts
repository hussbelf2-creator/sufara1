/* Builds one complete Excel package for the buyer's account: support tickets,
   orders (both the dashboard order history and the real storefront orders saved
   from checkout) and return requests. Each table is written to its own
   worksheet, so the file opens in Excel / Numbers / Google Sheets with three
   clean tabs instead of titled blocks stacked in a single sheet. */

import type { TFunction } from 'i18next';
import type { SupportTicket } from '@/pages/support/lib/ticketStore';
import { mergeTickets } from '@/pages/support/lib/ticketStore';
import type { Order } from '@/pages/shop/types';
import { loadOrders } from '@/pages/shop/lib/ordersStore';
import { loadJson } from '@/pages/dashboard/lib/persist';
import { downloadWorkbook } from '@/pages/dashboard/lib/xlsx';
import type { SheetSpec } from '@/pages/dashboard/lib/xlsx';

export interface PackageOrderRow {
  id: string;
  date: string;
  factory: string;
  items: number;
  value: string;
  status: string;
}

export interface PackageReturnRow {
  id: string;
  order: string;
  item: string;
  reason: string;
  amount: string;
  status: string;
}

export interface BuyerPackageRange {
  from?: string;
  to?: string;
}

export interface BuyerPackageInput extends BuyerPackageRange {
  t: TFunction;
  isEn: boolean;
  ticketsSeed: SupportTicket[];
  orders: PackageOrderRow[];
  returnsFallback: PackageReturnRow[];
}

export interface ExportCounts {
  tickets: number;
  orders: number;
  returns: number;
}

export interface ExportMeta {
  at: string;
  count: number;
  counts: ExportCounts;
}

const RETURNS_KEY = 'sta-buyer-returns';
const META_KEY = 'sta-buyer-export-meta';

/* The last package a buyer generated, remembered on this device so the home
   card can say exactly when it happened and how many records it carried. */
export function readExportMeta(): ExportMeta | null {
  try {
    const raw = window.localStorage.getItem(META_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExportMeta;
    if (!parsed || typeof parsed.at !== 'string' || typeof parsed.count !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeExportMeta(meta: ExportMeta): void {
  try {
    window.localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    /* storage may be unavailable — the export itself still succeeds */
  }
}

function isoDate(value: number | string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

/* Ticket timestamps are ISO strings, so the calendar day is the first 10
   characters — compared as text to stay independent from time zones. */
function inRange(iso: string | null, from?: string, to?: string): boolean {
  if (!iso) return true;
  const day = iso.slice(0, 10);
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

function storeOrderStatus(order: Order, t: TFunction): string {
  const label = t(`orders.steps.${order.status}`, { defaultValue: order.status });
  return typeof label === 'string' ? label : order.status;
}

/* Real checkout orders live in IndexedDB, the dashboard history in mocks.
   Both are folded into the same sheet so one file tells the whole story. */
function orderSheet(
  t: TFunction,
  orders: PackageOrderRow[],
  stored: Order[],
): SheetSpec {
  const historyRows = orders.map((order) => [
    order.id,
    order.date,
    order.factory,
    order.items,
    order.value,
    order.status,
    '',
  ]);

  const storeRows = stored.map((order) => [
    order.id,
    isoDate(order.createdAt),
    order.lines[0]?.factoryName ?? '',
    order.count,
    order.total.toFixed(2),
    storeOrderStatus(order, t),
    order.tracking,
  ]);

  return {
    name: t('dashboard.buyerExport.orderSheet'),
    headers: [
      t('dashboard.buyerExport.thOrder'),
      t('dashboard.buyerExport.thDate'),
      t('dashboard.buyerExport.thFactory'),
      t('dashboard.buyerExport.thItems'),
      t('dashboard.buyerExport.thValue'),
      t('dashboard.buyerExport.thStatus'),
      t('dashboard.buyerExport.thTracking'),
    ],
    rows: [...historyRows, ...storeRows],
  };
}

export async function exportBuyerPackage(input: BuyerPackageInput): Promise<ExportMeta> {
  const {
    t, isEn, ticketsSeed, orders, returnsFallback, from, to,
  } = input;

  const allTickets = mergeTickets(ticketsSeed);
  const tickets = allTickets.filter((ticket) => inRange(ticket.createdAt, from, to));
  const returns = loadJson<PackageReturnRow[]>(RETURNS_KEY, returnsFallback);
  let storedOrders: Order[] = [];
  try {
    storedOrders = await loadOrders();
  } catch {
    storedOrders = [];
  }

  const rawTopics = t('legal.contact.topics', { returnObjects: true }) as unknown;
  const topics = Array.isArray(rawTopics) ? (rawTopics as { value: string; label: string }[]) : [];
  const topicLabel = (value: string) => topics.find((topic) => topic.value === value)?.label ?? value;

  const dateLabel = (iso: string | null) => {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(isEn ? 'en-GB' : 'ar-EG', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const statusLabel = (status: SupportTicket['status']) => {
    if (status === 'replied') return t('dashboard.buyerTickets.statusReplied');
    if (status === 'closed') return t('dashboard.buyerTickets.statusClosed');
    return t('dashboard.buyerTickets.statusOpen');
  };

  const ticketSheet: SheetSpec = {
    name: t('dashboard.buyerExport.ticketSheet'),
    headers: [
      t('dashboard.buyerTickets.thId'),
      t('dashboard.buyerTickets.thTopic'),
      t('dashboard.buyerTickets.orderLabel'),
      t('dashboard.buyerTickets.thSent'),
      t('dashboard.buyerTickets.thStatus'),
      t('dashboard.buyerTickets.thReply'),
      t('dashboard.buyerTickets.replyLabel'),
      t('dashboard.buyerTickets.messageLabel'),
    ],
    rows: tickets.map((ticket) => [
      ticket.id,
      topicLabel(ticket.topic),
      ticket.orderRef || '',
      dateLabel(ticket.createdAt),
      statusLabel(ticket.status),
      ticket.repliedAt ? dateLabel(ticket.repliedAt) : '',
      ticket.reply || '',
      ticket.message,
    ]),
  };

  const returnSheet: SheetSpec = {
    name: t('dashboard.buyerExport.returnSheet'),
    headers: [
      t('dashboard.buyerReturns.thId'),
      t('dashboard.buyerReturns.thOrder'),
      t('dashboard.buyerReturns.thItem'),
      t('dashboard.buyerReturns.thReason'),
      t('dashboard.buyerReturns.thAmount'),
      t('dashboard.buyerReturns.thStatus'),
    ],
    rows: returns.map((row) => [
      row.id,
      row.order,
      row.item,
      row.reason,
      row.amount,
      row.status,
    ]),
  };

  const sheets: SheetSpec[] = [
    ticketSheet,
    orderSheet(t, orders, storedOrders),
    returnSheet,
  ];

  downloadWorkbook(
    `sia-account-package-${new Date().toISOString().slice(0, 10)}.xlsx`,
    sheets,
  );

  const meta: ExportMeta = {
    at: new Date().toISOString(),
    count: sheets.reduce((total, sheet) => total + sheet.rows.length, 0),
    counts: {
      tickets: ticketSheet.rows.length,
      orders: sheets[1].rows.length,
      returns: returnSheet.rows.length,
    },
  };
  writeExportMeta(meta);

  return meta;
}