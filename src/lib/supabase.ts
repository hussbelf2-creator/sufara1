import { createClient } from '@supabase/supabase-js';

/* One client for the whole site. Readdy Backend speaks the Supabase protocol,
   so the same client works for auth, database and storage. */
const url = (import.meta.env.VITE_PUBLIC_SUPABASE_URL as string | undefined) ?? '';
const anonKey = (import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ?? '';

export const backendReady = Boolean(url && anonKey);

/* Without a configured backend (tests, a fresh clone) the client still has
   to exist, so it points at an unreachable placeholder and every caller
   checks backendReady before relying on it. */
export const supabase = createClient(url || 'http://localhost:54321', anonKey || 'public-anon-placeholder', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'sta-auth',
  },
});

/* Builds an absolute URL that respects the published sub-path. */
export function absoluteUrl(path: string) {
  const base = String(__BASE_PATH__ ?? '/').replace(/\/+$/, '');
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${window.location.origin}${base}${clean}`;
}