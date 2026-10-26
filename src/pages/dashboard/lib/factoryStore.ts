import { useEffect, useState } from 'react';
import { pushShipmentRecord } from '@/hooks/useShipmentFeed';

/* Shared, persisted operational state for the factory dashboard. It lets the
   factory owner's action buttons actually DO something instead of only firing
   a toast: every order moves through a real workflow with a timestamped
   timeline, shipments get real tracking numbers, uploaded documents are
   remembered, added products appear, inventory edits stick, and invited team
   members stay. The document lives in localStorage and is broadcast with a
   window event so every factory view reads the same, up-to-date data. Once a
   real backend is wired, these records move server-side. */

export type OrderStage =
  | 'awaiting' | 'accepted' | 'processing' | 'ready' | 'shipped' | 'delivered' | 'cancelled';

/* The forward workflow an order travels through (cancellation is off-track). */
export const ORDER_FLOW: OrderStage[] = ['awaiting', 'accepted', 'processing', 'ready', 'shipped', 'delivered'];

export interface TimelineEvent {
  key: string;
  at: number;
}

export interface OrderRecord {
  stage: OrderStage;
  timeline: TimelineEvent[];
  note?: string;
  tracking?: string;
  courier?: string;
}

export interface CustomProduct {
  name: string;
  statusKey: string;
  price: string;
  stock: string;
  sales: string;
  img: string;
}

/* An edit the owner made to a product's essentials (name, price, stock).
   Keyed by the product's original name so the same row stays addressable even
   after it is renamed. */
export interface ProductEdit {
  name?: string;
  price?: string;
  stock?: string;
}

export interface StockPatch {
  available: string;
  jeddah: string;
}

export interface TeamMember {
  name: string;
  email: string;
  role: string;
  active: boolean;
}

export type ShipmentStatus = 'scheduled' | 'picked' | 'delivered';

export interface ShipmentEvent {
  key: string;
  at: number;
}

export interface ShipmentPatch {
  status: ShipmentStatus;
  tracking: string;
  courier: string;
  events: ShipmentEvent[];
}

export interface CreatedShipment {
  id: string;
  orderId: string;
  carrier: string;
  country: string;
  tracking: string;
  status: ShipmentStatus;
  createdAt: number;
  events: ShipmentEvent[];
}

/* The stage a wholesale deal travels through, from the deposit to delivery. */
export const DEAL_FLOW = ['deposit', 'production', 'packing', 'shipping', 'delivered'] as const;
export type DealStage = typeof DEAL_FLOW[number];

/* Persisted wholesale-deal state: the current stage, how many deal documents
   have been generated, and a timestamped history of stage moves. */
export interface DealState {
  stageIdx: number;
  docs: number;
  docKeys: string[];
  events: ShipmentEvent[];
}

export interface DocFile {
  name: string;
  ref: string;
  at: number;
}

export interface DocRecord {
  files: DocFile[];
}

/* A payout request the owner raised. Stored with a timestamp so the history
   list can order it and show how recently it was made. */
export interface Withdrawal {
  id: string;
  amount: string;
  method: string;
  at: number;
  statusKey: 'pending' | 'processed';
}

/* A quote the owner submitted against a quote request. Keeps the full history
   of replies so the RFQ page can show what was offered and when. */
export interface RfqResponse {
  id: string;
  buyer: string;
  product: string;
  price: string;
  lead: string;
  terms: string;
  at: number;
}

/* A recorded action for the factory audit log. Every product edit, product
   status change and wholesale-deal stage move is captured together with WHO
   made it and WHEN, so the owner can always trace what changed and by whom. */
export type AuditKind = 'product' | 'deal';
export type AuditAction = 'productEdit' | 'productStatus' | 'productAdd' | 'dealStage';

export interface AuditEntry {
  id: string;
  kind: AuditKind;
  action: AuditAction;
  actor: string;
  ref: string;
  value: string;
  at: number;
}

interface Ops {
  orders: Record<string, OrderRecord>;
  productStatus: Record<string, string>;
  productEdits: Record<string, ProductEdit>;
  customProducts: CustomProduct[];
  stock: Record<string, StockPatch>;
  team: TeamMember[] | null;
  shipmentPatches: Record<string, ShipmentPatch>;
  createdShipments: CreatedShipment[];
  docs: Record<string, DocRecord>;
  withdrawals: Withdrawal[];
  rfqResponses: RfqResponse[];
  deals: Record<string, DealState>;
  audit: AuditEntry[];
}

const STORAGE_KEY = 'sta-factory-ops';
const EVT = 'sta-factory-ops-change';

const EMPTY: Ops = {
  orders: {},
  productStatus: {},
  productEdits: {},
  customProducts: [],
  stock: {},
  team: null,
  shipmentPatches: {},
  createdShipments: [],
  docs: {},
  withdrawals: [],
  rfqResponses: [],
  deals: {},
  audit: [],
};

/* Older browsers may still hold the first version, which stored a flat
   `orderStatus` map of strings. Convert it to the richer order records so
   nothing the owner already did is lost. */
function migrateLegacyOrderStatus(legacy: unknown): Record<string, OrderRecord> {
  const out: Record<string, OrderRecord> = {};
  if (legacy && typeof legacy === 'object') {
    Object.entries(legacy as Record<string, string>).forEach(([id, stage]) => {
      out[id] = { stage: stage as OrderStage, timeline: [{ key: stage, at: 0 }] };
    });
  }
  return out;
}

function read(): Ops {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<Ops> & { orderStatus?: unknown };
    const orders = parsed.orders && typeof parsed.orders === 'object'
      ? (parsed.orders as Record<string, OrderRecord>)
      : migrateLegacyOrderStatus(parsed.orderStatus);
    return {
      orders,
      productStatus: parsed.productStatus ?? {},
      productEdits: parsed.productEdits ?? {},
      customProducts: Array.isArray(parsed.customProducts) ? parsed.customProducts : [],
      stock: parsed.stock ?? {},
      team: Array.isArray(parsed.team) ? parsed.team : null,
      shipmentPatches: parsed.shipmentPatches ?? {},
      createdShipments: Array.isArray(parsed.createdShipments) ? parsed.createdShipments : [],
      docs: parsed.docs ?? {},
      withdrawals: Array.isArray(parsed.withdrawals) ? parsed.withdrawals : [],
      rfqResponses: Array.isArray(parsed.rfqResponses) ? parsed.rfqResponses : [],
      deals: parsed.deals ?? {},
      audit: Array.isArray(parsed.audit) ? parsed.audit : [],
    };
  } catch {
    return { ...EMPTY };
  }
}

function write(ops: Ops): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ops));
  } catch {
    /* storage may be unavailable — the change simply will not persist */
  }
  window.dispatchEvent(new Event(EVT));
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/* Prepends an audit entry to the log (newest first) and keeps the list bounded
   so it never grows without limit. */
function withAudit(list: AuditEntry[], entry: Omit<AuditEntry, 'id' | 'at'>): AuditEntry[] {
  const rec: AuditEntry = {
    ...entry,
    id: `AU-${Date.now().toString(36)}-${Math.floor(Math.random() * 900 + 100)}`,
    at: Date.now(),
  };
  return [rec, ...list].slice(0, 300);
}

/* Builds a real-looking, unique tracking number: SFR-YYMM-XXXXXX. */
export function makeTracking(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  let rand = '';
  for (let i = 0; i < 6; i += 1) {
    rand += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `SFR-${yy}${mm}-${rand}`;
}

/* Maps an order stage to the pill colour used across the factory views. */
export function orderTone(key: string): string {
  switch (key) {
    case 'ready':
    case 'accepted':
    case 'delivered':
      return 'ok';
    case 'shipped':
    case 'processing':
      return 'info';
    case 'awaiting':
      return 'warn';
    case 'cancelled':
      return 'mute';
    default:
      return 'info';
  }
}

export function shipmentTone(status: ShipmentStatus): string {
  switch (status) {
    case 'delivered':
      return 'ok';
    case 'picked':
      return 'info';
    default:
      return 'warn';
  }
}

/* Maps a product status key to the pill colour used in the products table. */
export function productTone(key: string): string {
  switch (key) {
    case 'published': return 'ok';
    case 'pending': return 'warn';
    case 'rejected': return 'danger';
    case 'draft': return 'mute';
    default: return 'info';
  }
}

/* Formats a stored timestamp in the active language (empty when unknown). */
export function formatWhen(at: number, lang: string): string {
  if (!at) return '';
  const locale = (lang || 'ar').match(/^(en|ur|id)/) !== null ? 'en-GB' : 'ar-EG';
  try {
    return new Date(at).toLocaleString(locale, {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function useFactoryOps() {
  const [ops, setOps] = useState<Ops>(read);

  useEffect(() => {
    const sync = () => setOps(read());
    window.addEventListener(EVT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const patchOrder = (id: string, mut: (rec: OrderRecord) => OrderRecord) => {
    const next = read();
    const prev = next.orders[id] ?? { stage: 'awaiting', timeline: [] };
    write({ ...next, orders: { ...next.orders, [id]: mut(prev) } });
  };

  /* Moves an order to a new stage and appends a timestamped timeline event. */
  const setOrderStatus = (id: string, key: OrderStage, note?: string) => {
    patchOrder(id, (rec) => ({
      ...rec,
      stage: key,
      note: note !== undefined ? note : rec.note,
      timeline: [...rec.timeline, { key, at: Date.now() }],
    }));
  };

  const setOrderNote = (id: string, note: string) => {
    patchOrder(id, (rec) => ({ ...rec, note }));
  };

  /* Creates a real shipment for an order: a tracking number is generated, the
     order is marked shipped, and the shipment is registered so it also shows
     up on the shipping desk. */
  const createOrderShipment = (order: { id: string; carrier: string; country: string }): string => {
    const tracking = makeTracking();
    const now = Date.now();
    const shipment: CreatedShipment = {
      id: `SHP-${Math.floor(1000 + Math.random() * 8999)}`,
      orderId: order.id,
      carrier: order.carrier,
      country: order.country,
      tracking,
      status: 'scheduled',
      createdAt: now,
      events: [{ key: 'created', at: now }],
    };
    patchOrder(order.id, (rec) => ({
      ...rec,
      stage: 'shipped',
      tracking,
      courier: order.carrier,
      timeline: [...rec.timeline, { key: 'shipped', at: now }],
    }));
    const next = read();
    write({ ...next, createdShipments: [shipment, ...next.createdShipments] });
    pushShipmentRecord({
      tracking,
      carrier: order.carrier,
      statusLabel: tracking,
      orderStatus: 'shipped',
      event: tracking,
    });
    return tracking;
  };

  /* Schedules a pickup for a mock desk shipment: assigns a tracking number. */
  const scheduleShipment = (id: string, courier: string) => {
    const next = read();
    const prev = next.shipmentPatches[id];
    const now = Date.now();
    const tracking = prev?.tracking || makeTracking();
    const patch: ShipmentPatch = {
      status: 'scheduled',
      tracking,
      courier: prev?.courier || courier,
      events: [...(prev?.events ?? []), { key: 'scheduled', at: now }],
    };
    write({ ...next, shipmentPatches: { ...next.shipmentPatches, [id]: patch } });
    pushShipmentRecord({ tracking, carrier: patch.courier, statusLabel: tracking, orderStatus: 'shipped', event: tracking });
  };

  const deliverShipment = (id: string) => {
    const next = read();
    const prev = next.shipmentPatches[id];
    const now = Date.now();
    const patch: ShipmentPatch = {
      status: 'delivered',
      tracking: prev?.tracking || makeTracking(),
      courier: prev?.courier || '',
      events: [...(prev?.events ?? []), { key: 'delivered', at: now }],
    };
    write({ ...next, shipmentPatches: { ...next.shipmentPatches, [id]: patch } });
    pushShipmentRecord({ tracking: patch.tracking, carrier: patch.courier, statusLabel: patch.tracking, orderStatus: 'delivered', event: patch.tracking });
  };

  /* Advances a shipment that was created from an order. */
  const advanceCreatedShipment = (id: string, status: ShipmentStatus) => {
    const next = read();
    const now = Date.now();
    const created = next.createdShipments.map((s) => (
      s.id === id
        ? { ...s, status, events: [...s.events, { key: status, at: now }] }
        : s
    ));
    const target = next.createdShipments.find((s) => s.id === id);
    let orders = next.orders;
    if (target && status === 'delivered') {
      const rec = orders[target.orderId];
      if (rec) {
        orders = {
          ...orders,
          [target.orderId]: { ...rec, stage: 'delivered', timeline: [...rec.timeline, { key: 'delivered', at: now }] },
        };
      }
    }
    write({ ...next, createdShipments: created, orders });
  };

  const setProductStatus = (name: string, key: string, actor = '') => {
    const next = read();
    write({
      ...next,
      productStatus: { ...next.productStatus, [name]: key },
      audit: withAudit(next.audit, { kind: 'product', action: 'productStatus', actor, ref: name, value: key }),
    });
  };

  /* Saves an edit to a product's name, price and stock. Keyed by the product's
     original name so renamed products stay addressable. Every save is also
     written to the audit log with the acting user and the new values. */
  const setProductEdit = (key: string, patch: ProductEdit, actor = '') => {
    const next = read();
    const prev = next.productEdits[key] ?? {};
    const merged = { ...prev, ...patch };
    const summary = [merged.price, merged.stock].filter(Boolean).join(' · ') || merged.name || '';
    write({
      ...next,
      productEdits: { ...next.productEdits, [key]: merged },
      audit: withAudit(next.audit, { kind: 'product', action: 'productEdit', actor, ref: merged.name ?? key, value: summary }),
    });
  };

  /* Moves a wholesale deal to a new stage and logs the move with a time.
     The stage change is also recorded in the audit log with the acting user. */
  const setDealStage = (buyer: string, stageIdx: number, actor = '') => {
    const next = read();
    const prev = next.deals[buyer] ?? { stageIdx: 0, docs: 0, docKeys: [], events: [] };
    const key = DEAL_FLOW[Math.max(0, Math.min(DEAL_FLOW.length - 1, stageIdx))];
    write({
      ...next,
      deals: { ...next.deals, [buyer]: { ...prev, stageIdx, events: [...prev.events, { key, at: Date.now() }] } },
      audit: withAudit(next.audit, { kind: 'deal', action: 'dealStage', actor, ref: buyer, value: key }),
    });
  };

  /* Marks a deal document as generated. Re-generating the same document does
     not inflate the counter — only a first-time generation does. */
  const addDealDoc = (buyer: string, docKey: string) => {
    const next = read();
    const prev = next.deals[buyer] ?? { stageIdx: 0, docs: 0, docKeys: [], events: [] };
    if (prev.docKeys.includes(docKey)) return;
    write({
      ...next,
      deals: { ...next.deals, [buyer]: { ...prev, docs: prev.docs + 1, docKeys: [...prev.docKeys, docKey] } },
    });
  };

  const addProduct = (product: CustomProduct, actor = '') => {
    const next = read();
    write({
      ...next,
      customProducts: [product, ...next.customProducts],
      audit: withAudit(next.audit, { kind: 'product', action: 'productAdd', actor, ref: product.name, value: product.price }),
    });
  };

  const setStock = (sku: string, value: StockPatch) => {
    const next = read();
    write({ ...next, stock: { ...next.stock, [sku]: value } });
  };

  const setTeam = (team: TeamMember[]) => {
    const next = read();
    write({ ...next, team });
  };

  /* Records a document the owner uploaded against a required document id. */
  const addDocFile = (docId: string, file: DocFile) => {
    const next = read();
    const prev = next.docs[docId]?.files ?? [];
    write({ ...next, docs: { ...next.docs, [docId]: { files: [file, ...prev] } } });
  };

  /* Raises a new payout request and stores it at the top of the history. */
  const addWithdrawal = (amount: string, method: string) => {
    const next = read();
    const id = `WD-${Math.floor(2200 + Math.random() * 799)}`;
    const rec: Withdrawal = { id, amount, method, at: Date.now(), statusKey: 'pending' };
    write({ ...next, withdrawals: [rec, ...next.withdrawals] });
  };

  /* Logs a quote the owner submitted so it appears in the RFQ reply history. */
  const addRfqResponse = (resp: Omit<RfqResponse, 'id' | 'at'>) => {
    const next = read();
    const rec: RfqResponse = { ...resp, id: `RP-${Math.floor(100 + Math.random() * 899)}`, at: Date.now() };
    write({ ...next, rfqResponses: [rec, ...next.rfqResponses] });
  };

  /* Backward-compatible flat map of order id → stage. */
  const orderStatus: Record<string, OrderStage> = {};
  Object.entries(ops.orders).forEach(([id, rec]) => { orderStatus[id] = rec.stage; });

  return {
    ...ops,
    orderStatus,
    setOrderStatus,
    setOrderNote,
    createOrderShipment,
    scheduleShipment,
    deliverShipment,
    advanceCreatedShipment,
    setProductStatus,
    setProductEdit,
    addProduct,
    setStock,
    setTeam,
    addDocFile,
    addWithdrawal,
    addRfqResponse,
    setDealStage,
    addDealDoc,
  };
}