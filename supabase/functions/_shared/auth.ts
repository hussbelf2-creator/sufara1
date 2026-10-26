import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export function serviceClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
    auth: { persistSession: false },
  });
}

/** Resolves the caller from their own access token (never the anon key). */
export async function callerOf(req: Request): Promise<{ userId: string; aal: string } | null> {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await serviceClient().auth.getUser(token);
  if (error || !data.user) return null;
  let aal = 'aal1';
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    aal = payload.aal ?? 'aal1';
  } catch {
    aal = 'aal1';
  }
  return { userId: data.user.id, aal };
}

/** Admin role from user_roles, plus the second factor when settings require it. */
export async function requireAdmin(req: Request): Promise<{ userId: string } | { error: string; status: number }> {
  const caller = await callerOf(req);
  if (!caller) return { error: 'unauthorized', status: 401 };
  const db = serviceClient();
  const { data: role } = await db.from('user_roles').select('role').eq('user_id', caller.userId).eq('role', 'admin').maybeSingle();
  if (!role) return { error: 'forbidden', status: 403 };
  const { data: settings } = await db.rpc('active_settings');
  const needMfa = (settings as { security?: { requireMfaForAdmin?: boolean } } | null)?.security?.requireMfaForAdmin ?? true;
  if (needMfa && caller.aal !== 'aal2') return { error: 'second factor required', status: 403 };
  return { userId: caller.userId };
}
