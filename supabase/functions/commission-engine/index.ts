import { json, safeEqual } from '../_shared/http.ts';
import { serviceClient } from '../_shared/auth.ts';
import { runJob } from '../_shared/observe.ts';

/* Nightly job (Supabase cron → POST with header x-cron-secret).
   run_nightly(): settles sub-orders whose destination return window closed,
   unlocks commissions, re-tiers ambassadors, and closes group orders past
   their deadline (short groups go to the admins for a decision). */

Deno.serve(async (req) => {
  const secret = Deno.env.get('CRON_SECRET') ?? '';
  if (!secret || !safeEqual(req.headers.get('x-cron-secret') ?? '', secret)) return json({ error: 'unauthorized' }, 401);
  const db = serviceClient();
  return runJob(db, 'nightly', async () => {
    const { data, error } = await db.rpc('run_nightly');
    if (error) throw new Error(error.message);
    return data;
  });
});
