export type TicketStatus = 'open' | 'replied' | 'closed';

export interface SupportTicket {
  id: string;
  topic: string;
  message: string;
  orderRef: string;
  createdAt: string;
  status: TicketStatus;
  repliedAt: string | null;
  reply: string;
}

const STORAGE_KEY = 'sia-support-tickets';

export function readStoredTickets(): SupportTicket[] | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SupportTicket[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeStoredTickets(list: SupportTicket[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* storage can be unavailable in private mode — the page still works */
  }
}

/* Real submissions saved on this device come first; until they exist the
   sample tickets keep the section realistic. */
export function mergeTickets(seed: SupportTicket[]): SupportTicket[] {
  const stored = readStoredTickets();
  return stored ? [...stored] : seed.map((ticket) => ({ ...ticket }));
}

function nextId() {
  const year = new Date().getFullYear();
  const tail = String(Math.floor(1000 + Math.random() * 9000));
  return `TKT-${year}-${tail}`;
}

export function createTicket(input: {
  topic: string;
  message: string;
  orderRef?: string;
  name?: string;
}): SupportTicket {
  const ticket: SupportTicket = {
    id: nextId(),
    topic: input.topic,
    message: input.message.trim(),
    orderRef: (input.orderRef ?? '').trim(),
    createdAt: new Date().toISOString(),
    status: 'open',
    repliedAt: null,
    reply: '',
  };

  const stored = readStoredTickets() ?? [];
  writeStoredTickets([ticket, ...stored]);

  return ticket;
}