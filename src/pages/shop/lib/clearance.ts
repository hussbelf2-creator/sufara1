/* Buyer-side destination clearance file.
   When the Incoterm leaves clearance with the buyer (CIF / FOB), the tracking
   page asks them to upload the customs paperwork and confirm the destination
   duties were paid. There is no backend yet, so the file names and the payment
   confirmation are kept locally per tracking number — enough to show a real,
   persistent checklist on the page until the export desk reviews it. */

export interface ClearanceDoc {
  name: string;
  size: number;
  at: number;
}

export interface ClearanceState {
  docs: ClearanceDoc[];
  paid: boolean;
  paidAt?: number;
}

const KEY = 'sta_clearance_v1';

export const EMPTY_CLEARANCE: ClearanceState = { docs: [], paid: false };

type Book = Record<string, ClearanceState>;

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

export function loadClearance(tracking: string): ClearanceState {
  const saved = readBook()[tracking];
  if (!saved || typeof saved !== 'object') return { ...EMPTY_CLEARANCE };
  return {
    docs: Array.isArray(saved.docs) ? saved.docs : [],
    paid: Boolean(saved.paid),
    paidAt: saved.paidAt,
  };
}

export function saveClearance(tracking: string, state: ClearanceState): void {
  try {
    const book = readBook();
    book[tracking] = state;
    window.localStorage.setItem(KEY, JSON.stringify(book));
  } catch {
    /* Storage unavailable — the checklist simply will not survive a reload. */
  }
}