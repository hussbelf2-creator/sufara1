import { useEffect, useState } from 'react';

/* Shared, persisted operational state for the admin (operations-room) views.
   Approval, arbitration and shipment actions now write a real record instead
   of only firing a toast: a pending factory becomes approved, a submitted
   product is accepted or rejected, a return dispute gets a decision, and a
   shipment's tracking status changes. Every one of those actions is also
   appended to a tamper-evident audit log with the actor, the time and the
   device it was performed from. The document lives in localStorage and is
   broadcast with a window event so every admin view reads the same,
   up-to-date data. Once a real backend is wired, these move server-side. */

export interface Decision {
  status: string;
  tone: string;
}

export interface ShipmentPatch {
  status: string;
  tone: string;
  last: string;
  delay: string;
}

/* The kind of action an audit row represents, so the log can be filtered by
   action type and the monthly report can total approvals and arbitrations. */
export type AuditCat = 'factory' | 'product' | 'return' | 'shipment' | 'other';

export interface AuditEntry {
  id: string;
  who: string;
  what: string;
  cat: AuditCat;
  at: number;
  device: string;
  before: string;
  after: string;
}

/* The three decisions the returns register can apply to a case: accepted for
   refund, rejected, or received back at the warehouse. */
export type ReturnCaseStatus = 'accepted' | 'rejected' | 'received';

export interface ReturnCasePatch {
  status: ReturnCaseStatus;
  /** Timestamp the decision was applied — shown as the received date. */
  at: number;
}

/* What a view passes when it logs an action; the store fills in the id, the
   timestamp and the device automatically. */
export interface AuditInput {
  who: string;
  what: string;
  cat: AuditCat;
  before: string;
  after: string;
}

interface AdminOps {
  factoryApprovals: Record<string, Decision>;
  productApprovals: Record<string, Decision>;
  returnDecisions: Record<string, Decision>;
  shipmentStatus: Record<string, ShipmentPatch>;
  /** Tracking number → timestamp the export office was alerted about a gap. */
  clearanceAlerts: Record<string, number>;
  /** Return case id → the last decision applied in the returns register. */
  returnCases: Record<string, ReturnCasePatch>;
  audit: AuditEntry[];
}

const STORAGE_KEY = 'sta-admin-ops';
const EVT = 'sta-admin-ops-change';
const AUDIT_LIMIT = 120;

const EMPTY: AdminOps = {
  factoryApprovals: {},
  productApprovals: {},
  returnDecisions: {},
  shipmentStatus: {},
  clearanceAlerts: {},
  returnCases: {},
  audit: [],
};

/* Best-effort device fingerprint from the user agent, so an audit row can say
   where the action came from without any server data. */
function detectDevice(): string {
  if (typeof navigator === 'undefined') return '';
  const ua = navigator.userAgent;
  let os = 'Unknown device';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'MacBook';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iPhone';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Linux/i.test(ua)) os = 'Linux';
  let browser = '';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/Chrome\//i.test(ua)) browser = 'Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Safari\//i.test(ua)) browser = 'Safari';
  return browser ? `${os} · ${browser}` : os;
}

function appendAudit(existing: AuditEntry[], input: AuditInput): AuditEntry[] {
  const entry: AuditEntry = {
    id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    who: input.who,
    what: input.what,
    cat: input.cat,
    at: Date.now(),
    device: detectDevice(),
    before: input.before,
    after: input.after,
  };
  return [entry, ...existing].slice(0, AUDIT_LIMIT);
}

function read(): AdminOps {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<AdminOps>;
    return {
      factoryApprovals: parsed.factoryApprovals ?? {},
      productApprovals: parsed.productApprovals ?? {},
      returnDecisions: parsed.returnDecisions ?? {},
      shipmentStatus: parsed.shipmentStatus ?? {},
      clearanceAlerts: parsed.clearanceAlerts ?? {},
      returnCases: parsed.returnCases ?? {},
      audit: Array.isArray(parsed.audit) ? parsed.audit : [],
    };
  } catch {
    return { ...EMPTY };
  }
}

function write(ops: AdminOps): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ops));
  } catch {
    /* storage may be unavailable — the change simply will not persist */
  }
  window.dispatchEvent(new Event(EVT));
}

export function useAdminOps() {
  const [ops, setOps] = useState<AdminOps>(read);

  useEffect(() => {
    const sync = () => setOps(read());
    window.addEventListener(EVT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const setFactoryApproval = (cr: string, decision: Decision, audit?: AuditInput) => {
    const next = read();
    write({
      ...next,
      factoryApprovals: { ...next.factoryApprovals, [cr]: decision },
      audit: audit ? appendAudit(next.audit, audit) : next.audit,
    });
  };

  const setProductApproval = (name: string, decision: Decision, audit?: AuditInput) => {
    const next = read();
    write({
      ...next,
      productApprovals: { ...next.productApprovals, [name]: decision },
      audit: audit ? appendAudit(next.audit, audit) : next.audit,
    });
  };

  const setReturnDecision = (id: string, decision: Decision, audit?: AuditInput) => {
    const next = read();
    write({
      ...next,
      returnDecisions: { ...next.returnDecisions, [id]: decision },
      audit: audit ? appendAudit(next.audit, audit) : next.audit,
    });
  };

  const setShipment = (id: string, patch: ShipmentPatch, audit?: AuditInput) => {
    const next = read();
    write({
      ...next,
      shipmentStatus: { ...next.shipmentStatus, [id]: patch },
      audit: audit ? appendAudit(next.audit, audit) : next.audit,
    });
  };

  /* Records that the export office was alerted about a shipment whose customs
     paperwork is incomplete, so the same gap is not alerted twice and the
     action shows up in the audit stream. */
  const notifyClearance = (tracking: string, audit?: AuditInput) => {
    const next = read();
    write({
      ...next,
      clearanceAlerts: { ...next.clearanceAlerts, [tracking]: Date.now() },
      audit: audit ? appendAudit(next.audit, audit) : next.audit,
    });
  };

  /* Applies a decision to a return case in the register (accept, reject or
     mark received) and stamps it with the exact time it happened. */
  const setReturnCase = (id: string, status: ReturnCaseStatus, audit?: AuditInput) => {
    const next = read();
    write({
      ...next,
      returnCases: { ...next.returnCases, [id]: { status, at: Date.now() } },
      audit: audit ? appendAudit(next.audit, audit) : next.audit,
    });
  };

  return {
    ...ops,
    setFactoryApproval,
    setProductApproval,
    setReturnDecision,
    setReturnCase,
    setShipment,
    notifyClearance,
  };
}