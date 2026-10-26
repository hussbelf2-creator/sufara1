/* Contract revision history helpers.
   Every save pushes a snapshot (buildRevision) so the user can later view the
   version list, compare a version against the current contract (diffContract),
   and restore an older version. Snapshots strip their own revision list so the
   history stays flat instead of nesting copies forever. */

import { cloneContract } from './types';
import type { Contract, ContractRevision, ContractRole } from './types';

type TFunc = (key: string) => string;

/* A human-readable local timestamp for a version entry. */
export const nowStamp = (lang?: string): string => {
  try {
    return new Date().toLocaleString(lang || undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return new Date().toLocaleString();
  }
};

/* Builds the snapshot of a contract that becomes one version in the history. */
export const buildRevision = (c: Contract, by: ContractRole, note: string): ContractRevision => {
  const snapshot = cloneContract(c);
  snapshot.revisions = [];
  return {
    id: `RV-${Date.now().toString().slice(-7)}-${Math.floor(Math.random() * 1000)}`,
    time: nowStamp(),
    by,
    note,
    data: snapshot,
  };
};

export type DiffRow = { label: string; before: string; after: string };

/* Shows a placeholder dash for empty values so a cleared field is visible. */
const val = (v: unknown): string => (v === undefined || v === null || v === '' ? '—' : String(v));

/* Compares two contract states field by field and returns only the rows that
   actually changed — this is the "compare versions" output. */
export const diffContract = (a: Contract, b: Contract, t: TFunc): DiffRow[] => {
  const rows: DiffRow[] = [];
  const push = (label: string, before: unknown, after: unknown) => {
    const bx = val(before);
    const by = val(after);
    if (bx !== by) rows.push({ label, before: bx, after: by });
  };

  const yesNo = (v: boolean) => (v ? t('dashboard.contracts.docYes') : t('dashboard.contracts.docNo'));
  const listKey = (items: string[]) => items.join(' | ');

  push(t('dashboard.contracts.thStatus'), t(`dashboard.contracts.status.${a.status}`), t(`dashboard.contracts.status.${b.status}`));
  push(t('dashboard.contracts.fieldStage'), t(`dashboard.contracts.stage.${a.stage}`), t(`dashboard.contracts.stage.${b.stage}`));
  push(t('dashboard.contracts.buyerCompany'), a.buyerCompany, b.buyerCompany);
  push(t('dashboard.contracts.buyerCountry'), a.buyerCountry, b.buyerCountry);
  push(t('dashboard.contracts.factoryLabel'), a.factory, b.factory);
  push(t('dashboard.contracts.factoryCity'), a.factoryCity, b.factoryCity);
  push(t('dashboard.contracts.productLabel'), a.product, b.product);
  push(t('dashboard.contracts.quantityLabel'), a.quantity, b.quantity);
  push(t('dashboard.contracts.unitPriceLabel'), a.unitPrice, b.unitPrice);
  push(t('dashboard.contracts.totalLabel'), a.total, b.total);
  push(t('dashboard.contracts.currencyLabel'), a.currency, b.currency);
  push(t('dashboard.contracts.paymentLabel'), a.payment, b.payment);
  push(t('dashboard.contracts.incotermLabel'), a.incoterm, b.incoterm);
  push(t('dashboard.contracts.portLabel'), a.port, b.port);
  push(t('dashboard.contracts.leadLabel'), a.leadDays, b.leadDays);
  push(t('dashboard.contracts.deliveryDateLabel'), a.deliveryDate, b.deliveryDate);
  push(t('dashboard.contracts.startDateLabel'), a.startDate, b.startDate);
  push(t('dashboard.contracts.endDateLabel'), a.endDate, b.endDate);
  push(t('dashboard.contracts.durationLabel'), a.duration, b.duration);
  push(t('dashboard.contracts.autoRenewLabel'), yesNo(a.autoRenew), yesNo(b.autoRenew));
  push(t('dashboard.contracts.penaltyLabel'), a.penalty, b.penalty);
  push(t('dashboard.contracts.notesLabel'), a.notes, b.notes);

  push(
    t('dashboard.contracts.sectionSpecs'),
    listKey((a.specs ?? []).map((s) => `${s.label}:${s.value}`)),
    listKey((b.specs ?? []).map((s) => `${s.label}:${s.value}`)),
  );
  push(
    t('dashboard.contracts.sectionObligations'),
    listKey((a.obligations ?? []).map((o) => `${o.party}:${o.text}`)),
    listKey((b.obligations ?? []).map((o) => `${o.party}:${o.text}`)),
  );
  push(
    t('dashboard.contracts.sectionDues'),
    listKey((a.payments ?? []).map((p) => `${p.label}|${p.date}|${p.amount}|${p.status}`)),
    listKey((b.payments ?? []).map((p) => `${p.label}|${p.date}|${p.amount}|${p.status}`)),
  );
  push(t('dashboard.contracts.sectionClauses'), listKey(a.clauses ?? []), listKey(b.clauses ?? []));

  return rows;
};