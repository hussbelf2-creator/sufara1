import { backendReady, supabase } from '@/lib/supabase';

/* Front-end error reporting.

   Every uncaught error and rejected promise is sent to log_client_error (one
   row per distinct error and release, counted), and appears in the admin's
   "System health" screen. Optional: set VITE_SENTRY_DSN and load Sentry in
   main.tsx — this reporter keeps working alongside it.

   Nothing personal is sent: message, stack, page path (no query string) and
   the release. At most 20 reports per page load, and the same error once. */

const RELEASE = (import.meta.env.VITE_RELEASE as string | undefined) || 'dev';
const sent = new Set<string>();
let budget = 20;

export function reportError(error: unknown, context = '') {
  if (!backendReady || budget <= 0) return;
  const err = error instanceof Error ? error : new Error(typeof error === 'string' ? error : JSON.stringify(error));
  const message = `${context ? `${context}: ` : ''}${err.name}: ${err.message}`.slice(0, 500);
  if (sent.has(message)) return;
  sent.add(message);
  budget -= 1;
  void supabase.rpc('log_client_error', {
    p_message: message,
    p_stack: (err.stack ?? '').slice(0, 4000),
    p_url: window.location.pathname,
    p_release: RELEASE,
    p_user_agent: navigator.userAgent.slice(0, 300),
  }).then(() => undefined, () => undefined);
}

let installed = false;
export function installErrorReporting() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('error', (e) => {
    /* resource load errors (images, scripts) carry no error object */
    if (e.error) reportError(e.error);
  });
  window.addEventListener('unhandledrejection', (e) => reportError(e.reason, 'unhandledrejection'));
}
