/* Month-close proof.

   A fingerprint computed in the browser proves nothing — anyone can recompute
   it over edited numbers. The close is therefore recorded by the
   `close_ledger_period` database function: it re-reads the ledger entries of
   the period from the append-only ledger, computes the totals and a SHA-256
   over (period, totals, entry ids, previous close hash), and stores the row in
   `ledger_closes`, which no client role can update or delete.

   The PDF prints the server hash and close id; verification means looking
   the id up in the close log. Without a backend the sheet is stamped
   "review only". */

import { supabase, backendReady } from '@/lib/supabase';

export interface ServerClose {
  closeId: string;
  hash: string;
  previousHash: string;
  closedAt: string;
}

export async function closePeriodOnServer(input: { from: string; to: string }): Promise<ServerClose | null> {
  if (!backendReady) return null;
  try {
    const { data, error } = await supabase.rpc('close_ledger_period', { p_from: input.from, p_to: input.to });
    if (error || !data) return null;
    const row = data as { id: string; hash: string; previous_hash: string; closed_at: string };
    return { closeId: row.id, hash: row.hash, previousHash: row.previous_hash, closedAt: row.closed_at };
  } catch {
    return null;
  }
}
