import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getConfig } from '@/config/store';
import { fetchMyAccess } from './lib/authApi';
import type { PanelKey } from './lib/panels';

/* Demo sign-in exists for local development and the sales demo only. A
   production build has it off unless VITE_ENABLE_DEMO=true is set explicitly,
   and the admin can switch it off from the platform settings either way. */
export const DEMO_ENV = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO === 'true';
export const demoAllowed = () => DEMO_ENV && getConfig().security.demoLogin;

const ROLE_PRIORITY: PanelKey[] = ['admin', 'factory', 'ambassador', 'buyer'];

type AuthValue = {
  user: User | null;
  /** Primary role, from the server-side user_roles table. */
  role: PanelKey | null;
  /** Every role the server granted. Never read from user_metadata. */
  roles: PanelKey[];
  verification: string;
  /** True once the session has passed a second factor (aal2). */
  mfa: boolean;
  /** False until the roles query has answered. */
  accessReady: boolean;
  /** Re-reads roles / assurance level, e.g. after completing a second factor. */
  refreshAccess: () => void;
  fullName: string;
  loading: boolean;
  demoRole: PanelKey | null;
  setDemo: (role: PanelKey) => void;
  clearDemo: () => void;
  signOut: () => Promise<void>;
};

const DEMO_KEY = 'sta-demo-panel';

const AuthContext = createContext<AuthValue>({
  user: null,
  role: null,
  roles: [],
  verification: 'unverified',
  mfa: false,
  accessReady: false,
  refreshAccess: () => {},
  fullName: '',
  loading: true,
  demoRole: null,
  setDemo: () => {},
  clearDemo: () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

function readDemo(): PanelKey | null {
  if (!demoAllowed()) return null;
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    if (raw === 'buyer' || raw === 'ambassador' || raw === 'factory' || raw === 'admin') return raw;
    return null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<PanelKey | null>(null);
  const [roles, setRoles] = useState<PanelKey[]>([]);
  const [verification, setVerification] = useState('unverified');
  const [mfa, setMfa] = useState(false);
  const [accessReady, setAccessReady] = useState(false);
  const [accessTick, setAccessTick] = useState(0);
  const refreshAccess = useCallback(() => setAccessTick((n) => n + 1), []);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [demoRole, setDemoRole] = useState<PanelKey | null>(readDemo);

  useEffect(() => {
    let alive = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!alive) return;
        setUser(data.session?.user ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (alive) setLoading(false);
      });

    /* The callback only stores local state — never awaits database calls. */
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setRoles([]);
      setVerification('unverified');
      setMfa(false);
      setFullName('');
      setAccessReady(!loading);
      return;
    }
    let alive = true;
    setAccessReady(false);
    const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
    /* The display name may come from metadata; the role may not. */
    setFullName(meta.full_name ?? '');

    (async () => {
      try {
        const access = await fetchMyAccess();
        if (!alive) return;
        const granted = access.roles.length ? access.roles : (['buyer'] as PanelKey[]);
        setRoles(granted);
        setRole(ROLE_PRIORITY.find((r) => granted.includes(r)) ?? 'buyer');
        setVerification(access.verification);
        setMfa(access.mfa);
      } catch {
        if (!alive) return;
        setRoles(['buyer']);
        setRole('buyer');
      } finally {
        if (alive) setAccessReady(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, [user, loading, accessTick]);

  const setDemo = useCallback((next: PanelKey) => {
    if (!demoAllowed()) return;
    try {
      localStorage.setItem(DEMO_KEY, next);
    } catch {
      /* private mode — the session still works in memory */
    }
    setDemoRole(next);
  }, []);

  const clearDemo = useCallback(() => {
    try {
      localStorage.removeItem(DEMO_KEY);
    } catch {
      /* ignore */
    }
    setDemoRole(null);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      /* already signed out */
    }
    clearDemo();
  }, [clearDemo]);

  const value = useMemo<AuthValue>(
    () => ({
      user, role, roles, verification, mfa, accessReady, refreshAccess, fullName, loading, demoRole, setDemo, clearDemo, signOut,
    }),
    [user, role, roles, verification, mfa, accessReady, refreshAccess, fullName, loading, demoRole, setDemo, clearDemo, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}