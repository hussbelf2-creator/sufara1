/* Ready-made contract templates (supply / wholesale / distribution) and the
   factory-file autofill. Applying a template fills the clauses, the party
   obligations and the entitlements schedule in a single click, while keeping
   anything the user already typed. */

import type {
  Contract, ContractObligation, ContractPayment, ContractSpec, FactoryProfile, ObligationParty, PaymentStatus,
} from './types';

export type ContractTemplateId = 'supply' | 'wholesale' | 'distribution';

export const CONTRACT_TEMPLATES: ContractTemplateId[] = ['supply', 'wholesale', 'distribution'];

type TFunc = (key: string) => string;

type TemplateDef = {
  incoterm: string;
  /* Clause texts reuse the existing clause library so the wording stays consistent. */
  clauseKeys: string[];
  obligations: { party: ObligationParty; key: string }[];
  dues: { key: string; ratio: number; status: PaymentStatus }[];
};

const TEMPLATE_DEFS: Record<ContractTemplateId, TemplateDef> = {
  supply: {
    incoterm: 'CIF',
    clauseKeys: ['quality', 'packing', 'delivery', 'payment', 'inspection'],
    obligations: [
      { party: 'factory', key: 'ob1' },
      { party: 'factory', key: 'ob2' },
      { party: 'buyer', key: 'ob3' },
    ],
    dues: [
      { key: 'due1', ratio: 0.3, status: 'due' },
      { key: 'due2', ratio: 0.7, status: 'scheduled' },
    ],
  },
  wholesale: {
    incoterm: 'FOB',
    clauseKeys: ['quality', 'delivery', 'payment', 'arbitration'],
    obligations: [
      { party: 'factory', key: 'ob1' },
      { party: 'factory', key: 'ob2' },
      { party: 'buyer', key: 'ob3' },
    ],
    dues: [
      { key: 'due1', ratio: 0.4, status: 'due' },
      { key: 'due2', ratio: 0.3, status: 'scheduled' },
      { key: 'due3', ratio: 0.3, status: 'scheduled' },
    ],
  },
  distribution: {
    incoterm: 'EXW',
    clauseKeys: ['delivery', 'payment', 'arbitration'],
    obligations: [
      { party: 'buyer', key: 'ob1' },
      { party: 'buyer', key: 'ob2' },
      { party: 'factory', key: 'ob3' },
    ],
    dues: [
      { key: 'due1', ratio: 0.5, status: 'due' },
      { key: 'due2', ratio: 0.5, status: 'scheduled' },
    ],
  },
};

/* Parses the numeric part of the contract total so the dues can be split. */
const numericTotal = (total: string): number => Number(String(total).replace(/[^\d.]/g, '')) || 0;

/* Keeps the spec rows the user actually filled, then appends the factory's own
   technical specs, skipping duplicates by label. */
const mergeSpecs = (current: ContractSpec[], incoming: ContractSpec[]): ContractSpec[] => {
  const kept = (current ?? []).filter((s) => s.label.trim() || s.value.trim()).map((s) => ({ ...s }));
  incoming.forEach((s) => {
    if (!kept.some((k) => k.label.trim() === s.label.trim())) kept.push({ ...s });
  });
  return kept.length ? kept : [{ label: '', value: '' }];
};

/* Appends clause texts without ever duplicating an existing clause. */
const addClauses = (current: string[], texts: string[]): string[] => {
  const out = [...current];
  texts.forEach((text) => {
    if (text && !out.includes(text)) out.push(text);
  });
  return out;
};

/* The factory's own default clause texts, resolved in the active language. */
const profileClauses = (profile: FactoryProfile, t: TFunc): string[] => (
  (profile.clauseKeys ?? []).map((k) => t(`dashboard.contracts.clauseLibrary.${k}`))
);

const profileObligations = (profile: FactoryProfile): ContractObligation[] => (
  profile.obligations.map((o) => ({ party: o.party, text: o.text }))
);

/* Splits the factory's entitlement schedule over the contract total. */
const profilePayments = (c: Contract, profile: FactoryProfile): ContractPayment[] => {
  const total = numericTotal(c.total);
  return profile.dues.map((d) => ({
    label: d.label,
    date: '',
    amount: total ? Math.round(total * d.ratio) : 0,
    status: d.status,
  }));
};

/* Keeps the entitlements schedule in step with the contract total. Every time
   the total changes, each installment is re-split by the proportion it already
   had (its share of the previous total), so the ratios the user or a factory
   file established are preserved. Rounding residue lands on the last unsettled
   installment, so the schedule still adds up to the new total exactly. */
export const rescalePayments = (c: Contract, nextTotal: string): Contract => {
  const prevTotal = numericTotal(c.total);
  const target = numericTotal(nextTotal);
  const rows = c.payments ?? [];
  if (!rows.length || !prevTotal || !target) return { ...c, total: nextTotal };

  const amounts = rows.map((p) => Math.round(((Number(p.amount) || 0) / prevTotal) * target));
  /* Residue from rounding is only pushed onto the last unsettled installment
     when the schedule was a complete split of the old total; a partial schedule
     (extra or optional installments) keeps its own figures untouched. */
  const prevSum = rows.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const fullSplit = Math.abs(prevSum - prevTotal) <= Math.max(1, prevTotal * 0.005);
  const residue = fullSplit ? target - amounts.reduce((sum, n) => sum + n, 0) : 0;
  if (residue !== 0) {
    let idx = -1;
    for (let i = rows.length - 1; i >= 0; i -= 1) {
      if (rows[i].status !== 'paid') { idx = i; break; }
    }
    if (idx < 0) idx = rows.length - 1;
    amounts[idx] += residue;
  }

  return { ...c, total: nextTotal, payments: rows.map((p, i) => ({ ...p, amount: amounts[i] })) };
};

const terms = (current: string, next: string): string => (current && current.trim() ? current : next);

/* Applies a factory file on its own, before any template: it stamps the factory
   identity and commercial terms and — on a fresh contract — its obligations,
   entitlements, technical specs and default clauses, so parties and dues are
   filled from the very first moment without any manual entry. */
export const applyProfile = (c: Contract, profile: FactoryProfile, t: TFunc): Contract => {
  const hasObligations = (c.obligations ?? []).some((o) => o.text.trim());
  const hasPayments = (c.payments ?? []).some((p) => p.label.trim());
  return {
    ...c,
    factory: profile.name,
    factoryCity: profile.city,
    incoterm: profile.incoterm,
    port: terms(c.port, profile.port),
    leadDays: terms(c.leadDays, profile.leadDays),
    duration: terms(c.duration, profile.duration),
    payment: terms(c.payment, profile.payment),
    penalty: terms(c.penalty, profile.penalty),
    obligations: hasObligations ? c.obligations : profileObligations(profile),
    payments: hasPayments ? c.payments : profilePayments(c, profile),
    specs: mergeSpecs(c.specs, profile.specs ?? []),
    clauses: addClauses(c.clauses, profileClauses(profile, t)),
  };
};

/* Applies a template to a contract and returns the updated contract. Clause
   texts, obligations and dues are appended (deduplicated) rather than wiping
   whatever the user already added. When a factory file is chosen, its own
   obligations, entitlements, technical specs and default clauses are pulled in
   automatically — the template only supplies the commercial structure. */
export const applyTemplate = (c: Contract, id: ContractTemplateId, t: TFunc, profile?: FactoryProfile): Contract => {
  const def = TEMPLATE_DEFS[id];
  const base = `dashboard.contracts.templates.${id}`;
  const total = numericTotal(c.total);

  const templateClauses = def.clauseKeys.map((k) => t(`dashboard.contracts.clauseLibrary.${k}`));
  const clauses = addClauses(c.clauses, [
    ...templateClauses,
    ...(profile ? profileClauses(profile, t) : []),
  ]);

  const wantedObligations = profile
    ? profileObligations(profile)
    : def.obligations.map((o) => ({ party: o.party, text: t(`${base}.${o.key}`) }));
  const obligations = wantedObligations.filter(
    (o) => !c.obligations.some((x) => x.text.trim() === o.text.trim()),
  );

  const wantedPayments: ContractPayment[] = profile
    ? profilePayments(c, profile)
    : def.dues.map((d) => ({
      label: t(`${base}.${d.key}`),
      date: '',
      amount: total ? Math.round(total * d.ratio) : 0,
      status: d.status,
    }));
  const payments = wantedPayments.filter(
    (p) => !c.payments.some((x) => x.label.trim() === p.label.trim()),
  );

  return {
    ...c,
    incoterm: profile?.incoterm || def.incoterm,
    port: profile?.port || c.port,
    payment: profile?.payment || t(`${base}.payment`),
    duration: c.duration || profile?.duration || t(`${base}.duration`),
    leadDays: c.leadDays || profile?.leadDays || t(`${base}.lead`),
    penalty: c.penalty || profile?.penalty || t(`${base}.penalty`),
    clauses,
    obligations: [...c.obligations.filter((o) => o.text.trim()), ...obligations],
    payments: [...c.payments.filter((p) => p.label.trim()), ...payments],
    specs: profile ? mergeSpecs(c.specs, profile.specs ?? []) : c.specs,
  };
};

/* The i18n key that holds the display name of a template. */
export const templateNameKey = (id: ContractTemplateId): string => {
  if (id === 'supply') return 'dashboard.contracts.templateSupply';
  if (id === 'wholesale') return 'dashboard.contracts.templateWholesale';
  return 'dashboard.contracts.templateDistribution';
};