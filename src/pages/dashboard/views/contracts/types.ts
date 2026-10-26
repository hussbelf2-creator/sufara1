/* Shared types for the supplier-contract workspace used by every dashboard role. */
export type ContractStatus = 'draft' | 'pending' | 'active' | 'rejected' | 'closed';

/* The lifecycle a supply contract walks through: it is drafted, reviewed by the
   factory, signed by both parties, supplied, then delivered. */
export type ContractStage = 'draft' | 'review' | 'signing' | 'supply' | 'delivery';

export const CONTRACT_STAGES: ContractStage[] = ['draft', 'review', 'signing', 'supply', 'delivery'];

/* Position of a stage inside the pipeline (0 = draft … 4 = delivery). */
export const stageIndex = (s: ContractStage): number => CONTRACT_STAGES.indexOf(s);

export type ContractSpec = { label: string; value: string };
export type ContractAttachment = { name: string; size: string };

/* An obligation undertaken by one of the two parties (delivery, quality, support…). */
export type ObligationParty = 'buyer' | 'factory';
export type ContractObligation = { party: ObligationParty; text: string };

/* A single due/installment in the financial entitlements schedule of the contract. */
export type PaymentStatus = 'paid' | 'due' | 'scheduled';
export type ContractPayment = {
  label: string;
  date: string;
  amount: number;
  status: PaymentStatus;
};

/* A reminder the platform sent to the factory about this contract. The send
   time lives on the contract itself, so the notice log travels with the record
   and is also written into the revision history as its own version. */
export type ContractNotice = {
  id: string;
  time: string;
  by: ContractRole;
  note: string;
};

export type ContractComment = {
  by: 'buyer' | 'factory' | 'admin';
  name: string;
  text: string;
  time: string;
};

/* A factory's operational profile. It carries the factory's commercial defaults
   (delivery terms, payment, penalty) along with its own party obligations and
   entitlements schedule — so a contract template can be filled straight from
   the chosen factory's file without any manual entry. */
export type FactoryProfile = {
  id: string;
  name: string;
  city: string;
  incoterm: string;
  port: string;
  leadDays: string;
  duration: string;
  payment: string;
  penalty: string;
  certs: string;
  obligations: ContractObligation[];
  dues: { label: string; ratio: number; status: PaymentStatus }[];
  /* The factory's own technical specifications and its default clause set —
     both are stamped into a contract automatically once the factory file is
     chosen, so no manual entry is needed. */
  specs: ContractSpec[];
  clauseKeys: string[];
};

export type Contract = {
  id: string;
  status: ContractStatus;
  stage: ContractStage;
  awaitingHours: number;
  signBuyer: boolean;
  signFactory: boolean;
  buyer: string;
  buyerCompany: string;
  buyerCountry: string;
  factory: string;
  factoryCity: string;
  product: string;
  quantity: string;
  unitPrice: string;
  total: string;
  currency: string;
  payment: string;
  incoterm: string;
  port: string;
  leadDays: string;
  deliveryDate: string;
  createdAt: string;
  updatedAt: string;

  /* Contract duration / validity period. */
  startDate: string;
  endDate: string;
  duration: string;
  autoRenew: boolean;

  /* Obligations of each party and the financial entitlement schedule. */
  obligations: ContractObligation[];
  payments: ContractPayment[];

  /* Extra commercial details: late-delivery penalty and free-form notes. */
  penalty: string;
  notes: string;

  specs: ContractSpec[];
  clauses: string[];
  images: string[];
  attachments: ContractAttachment[];
  comments: ContractComment[];

  /* Factory reminders sent from the list/detail screens, newest first. */
  notices?: ContractNotice[];

  /* Full revision history: one snapshot per save, so any version can be
     compared or restored. Optional so older/mock records stay valid. */
  revisions?: ContractRevision[];
};

export type ContractRole = 'buyer' | 'factory' | 'admin';

/* A saved snapshot of a contract. Every save pushes one, giving a restorable,
   comparable version history. The snapshot never contains its own revisions,
   so the history stays a flat list instead of nesting forever. */
export type ContractRevision = {
  id: string;
  time: string;
  by: ContractRole;
  note: string;
  data: Contract;
};

/* Maps a contract status to the dashboard pill tone. */
export const statusTone = (s: ContractStatus): string => {
  switch (s) {
    case 'active':
      return 'ok';
    case 'pending':
      return 'warn';
    case 'rejected':
      return 'danger';
    case 'closed':
      return 'info';
    default:
      return 'mute';
  }
};

/* Deep-clones a contract so edits never mutate the shared mock objects. */
export const cloneContract = (c: Contract): Contract => ({
  ...c,
  specs: c.specs.map((s) => ({ ...s })),
  obligations: (c.obligations ?? []).map((o) => ({ ...o })),
  payments: (c.payments ?? []).map((p) => ({ ...p })),
  clauses: [...c.clauses],
  images: [...c.images],
  attachments: c.attachments.map((a) => ({ ...a })),
  comments: c.comments.map((m) => ({ ...m })),
  notices: (c.notices ?? []).map((n) => ({ ...n })),
  revisions: (c.revisions ?? []).map((r) => ({ ...r, data: cloneContract(r.data) })),
});

/* Financial summary of the entitlement schedule: how much is settled and what
   remains outstanding, computed from the payment rows (not from a text total). */
export const duesSummary = (c: Contract): { paid: number; remaining: number } => {
  const rows = c.payments ?? [];
  const paid = rows.filter((p) => p.status === 'paid').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const remaining = rows.filter((p) => p.status !== 'paid').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  return { paid, remaining };
};