import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { backendReady } from '@/lib/supabase';
import { useAuth } from '@/pages/auth/AuthProvider';
import { useAccess } from '@/pages/auth/RequireAccess';

/* A real session against a configured backend — the only case where a
   dashboard may show database rows. The demo always shows illustrative data. */
export function useIsLive(): boolean {
  const { user } = useAuth();
  const { demo } = useAccess();
  return backendReady && !!user && !demo;
}

type Result = { data: unknown; error: { message: string } | null };

/** Loads rows once (and on reload); RLS on the server decides what comes back. */
export function useRows<T>(load: () => PromiseLike<Result>, deps: unknown[] = []) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: e } = await load();
      if (e) setError(e.message);
      setRows((Array.isArray(data) ? data : []) as T[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { reload(); }, [reload]);
  return { rows, loading, error, reload };
}

export function useMoney() {
  const { t, i18n } = useTranslation();
  const isAr = (i18n.resolvedLanguage || i18n.language || 'ar').startsWith('ar');
  const locale = isAr ? 'ar-EG' : 'en-US';
  const currency = t('dashboard.charts.currency');
  return {
    locale,
    money: (n: number | string | null | undefined) => `${Number(n ?? 0).toLocaleString(locale, { maximumFractionDigits: 2 })} ${currency}`,
    num: (n: number | string | null | undefined) => Number(n ?? 0).toLocaleString(locale, { maximumFractionDigits: 2 }),
    date: (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' }) : '—'),
  };
}
