import { createContext, useContext, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, demoAllowed } from './AuthProvider';
import type { PanelKey } from './lib/panels';

const ALL: PanelKey[] = ['buyer', 'ambassador', 'factory', 'admin'];

type Access = {
  /** Panels this visitor may open. */
  allowed: PanelKey[];
  demo: boolean;
};

const AccessCtx = createContext<Access>({ allowed: [], demo: false });

export const useAccess = () => useContext(AccessCtx);

/* Route guard for /dashboard.

   - No session (and no permitted demo) → sent to sign-in, nothing rendered.
   - Panels come from the server's user_roles via my_access(); the ?mode=
     query string can only pick among them, never add one.
   - An admin sees every panel. Database RLS enforces the same rules again on
     every query, so this guard is the first wall, not the only one. */
export default function RequireAccess({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, roles, loading, accessReady, demoRole } = useAuth();

  const demo = !user && !!demoRole && demoAllowed();

  if (loading || (user && !accessReady)) {
    return (
      <div className="dash-scope">
        <div className="dash-gate" role="status" aria-live="polite">
          <i className="ri-loader-4-line" />
          <span>{t('platform.gate.checking')}</span>
        </div>
      </div>
    );
  }

  if (!user && !demo) {
    const requested = new URLSearchParams(location.search).get('mode');
    const panel = requested && ALL.includes(requested as PanelKey) ? requested : 'buyer';
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/auth/${panel}?next=${next}`} replace />;
  }

  const allowed: PanelKey[] = demo
    ? ALL
    : roles.includes('admin')
      ? ALL
      : roles.length ? roles : ['buyer'];

  return <AccessCtx.Provider value={{ allowed, demo }}>{children}</AccessCtx.Provider>;
}
