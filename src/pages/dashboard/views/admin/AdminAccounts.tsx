import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/pages/auth/AuthProvider';
import { useAccess } from '@/pages/auth/RequireAccess';
import { useDashboard } from '@/hooks/useDashboard';
import { Card, Modal, PageHead, Pill, Stat, Toast } from '@/pages/dashboard/components/ui';

/* Every registration that comes through the four account screens lands here:
   one row per profile, with the full dossier and the verification decision. */

type Account = {
  id: string;
  email: string | null;
  full_name: string | null;
  panel: string;
  company: string | null;
  country: string | null;
  city: string | null;
  phone: string | null;
  verification_status: string | null;
  verification_method: string | null;
  verification_ref: string | null;
  created_at: string | null;
  [key: string]: unknown;
};

const PANELS = ['all', 'factory', 'ambassador', 'buyer', 'admin'] as const;
const STATUSES = ['all', 'pending', 'verified', 'rejected'] as const;

const DETAIL_FIELDS = [
  'email', 'phone', 'country', 'city', 'company', 'entity_type', 'industry',
  'job_title', 'national_id', 'cr_number', 'vat_number', 'employees',
  'factory_area', 'annual_capacity', 'categories', 'monthly_volume',
  'promo_channel', 'audience_size', 'experience', 'payout_method', 'iban', 'website',
] as const;

const TONE: Record<string, string> = {
  pending: 'warn',
  verified: 'ok',
  rejected: 'danger',
  unverified: 'mute',
};

/* Demo mode has no signed-in account, so the panel shows the same shape of
   dossier from sample rows instead of an empty table. */
const DEMO_ACCOUNTS: Account[] = [
  {
    id: 'demo-1', email: 'ops@elite-plastics.sa', full_name: 'عبدالله الشمري', panel: 'factory',
    company: 'مصنع النخبة للبلاستيك', country: 'sa', city: 'الدمام', phone: '+966 55 214 8890',
    entity_type: 'company', job_title: 'مالك المصنع', national_id: '1048821990',
    cr_number: '2050114477', vat_number: '300112233400003', industry: 'packaging',
    employees: 'e_50_200', factory_area: '12,000 م²',
    verification_status: 'pending', verification_method: 'nafath', verification_ref: 'NF-9K2L7781',
    created_at: '2026-10-16T09:12:00Z',
  },
  {
    id: 'demo-2', email: 'hello@nusaj-abayas.sa', full_name: 'منال القحطاني', panel: 'factory',
    company: 'نُسج للعبايات', country: 'sa', city: 'الرياض', phone: '+966 50 771 3302',
    entity_type: 'company', job_title: 'مديرة التصدير', cr_number: '1010449921',
    vat_number: '300445566700003', industry: 'fashion', employees: 'e_10_50',
    verification_status: 'verified', verification_method: 'cr', verification_ref: 'VR-M41P2230',
    created_at: '2026-10-09T14:40:00Z',
  },
  {
    id: 'demo-3', email: 'fahad.h@outlook.com', full_name: 'فهد الحربي', panel: 'ambassador', company: null,
    country: 'sa', city: 'جدة', phone: '+966 56 900 1122', national_id: '1092213455',
    categories: 'تمور، عطور، قهوة', promo_channel: 'social', audience_size: 'a_10_50k',
    experience: 'x_1_3', payout_method: 'wallet',
    verification_status: 'pending', verification_method: 'nafath', verification_ref: 'NF-5T8R4410',
    created_at: '2026-10-15T20:05:00Z',
  },
  {
    id: 'demo-4', email: 'sara.otaibi@gmail.com', full_name: 'سارة العتيبي', panel: 'buyer',
    company: 'متجر الياسمين', country: 'jo', city: 'عمّان', phone: '+962 79 555 1212',
    entity_type: 'company', industry: 'food', monthly_volume: 'v_10_50k',
    verification_status: 'verified', verification_method: 'manual', verification_ref: 'VR-D77N1180',
    created_at: '2026-10-04T11:22:00Z',
  },
  {
    id: 'demo-5', email: 'khaled.alaz@gmail.com', full_name: 'خالد العز', panel: 'ambassador', company: null,
    country: 'eg', city: 'القاهرة', phone: '+20 100 555 3344', national_id: '2881100990',
    categories: 'عطور، عبايات', promo_channel: 'whatsapp', audience_size: 'a_1_10k',
    experience: 'x_new', payout_method: 'bank',
    verification_status: 'rejected', verification_method: 'manual', verification_ref: 'VR-Q23Z9021',
    created_at: '2026-09-28T16:48:00Z',
  },
];

export default function AdminAccounts() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { demo } = useAccess();
  const d = useDashboard();
  const L = d.adminLabels.accounts;
  const C = d.adminLabels.common;
  const lang = (i18n.resolvedLanguage || i18n.language || 'ar').toLowerCase();
  const locale = lang.match(/^(en|ur|id)/) !== null ? 'en-US' : 'ar-EG';

  const [rows, setRows] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [panel, setPanel] = useState<(typeof PANELS)[number]>('all');
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Account | null>(null);
  const [toast, setToast] = useState('');
  const [savingId, setSavingId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    if (!user || demo) {
      setRows(DEMO_ACCOUNTS);
      setLoading(false);
      return;
    }
    try {
      /* admin_accounts is a security-barrier view: readable by admins only,
         with national ID and IBAN masked to their last 4 characters. */
      const { data, error: dbError } = await supabase
        .from('admin_accounts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300);
      if (dbError) {
        setError(dbError.message);
        setRows([]);
        return;
      }
      setRows((data ?? []) as Account[]);
    } catch {
      setError(L.loadError);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [L.loadError, user, demo]);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  };

  const optionLabel = (value: string) => {
    const key = `dashboard.auth.option.${value}`;
    const translated = t(key);
    return translated === key ? value : translated;
  };

  const fieldLabel = (key: string) => {
    const k = `dashboard.auth.field.${key}`;
    const translated = t(k);
    return translated === k ? key : translated;
  };

  const statusLabel = (value: string) => {
    if (value === 'verified') return L.statusVerified;
    if (value === 'rejected') return L.statusRejected;
    if (value === 'pending') return L.statusPending;
    return L.statusUnverified;
  };

  const counts = useMemo(() => ({
    total: rows.length,
    pending: rows.filter((r) => r.verification_status === 'pending').length,
    verified: rows.filter((r) => r.verification_status === 'verified').length,
    factories: rows.filter((r) => r.panel === 'factory').length,
  }), [rows]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (panel !== 'all' && row.panel !== panel) return false;
      if (status !== 'all' && (row.verification_status ?? 'unverified') !== status) return false;
      if (!needle) return true;
      return [row.full_name, row.email, row.company, row.city, row.phone, row.cr_number]
        .some((value) => String(value ?? '').toLowerCase().includes(needle));
    });
  }, [rows, panel, status, query]);

  const decide = async (row: Account, next: 'verified' | 'rejected') => {
    setSavingId(row.id);
    if (!user || demo || row.id.startsWith('demo-')) {
      setRows((prev) => prev.map((item) => (
        item.id === row.id ? { ...item, verification_status: next } : item
      )));
      setSelected((prev) => (prev && prev.id === row.id ? { ...prev, verification_status: next } : prev));
      flash(next === 'verified'
        ? L.approveDone.replace('{{name}}', row.full_name ?? row.email ?? '')
        : L.rejectDone.replace('{{name}}', row.full_name ?? row.email ?? ''));
      setSavingId('');
      return;
    }
    try {
      /* Server-side decision: checks the caller's admin role, grants the
         requested panel role on approval and writes the audit log. */
      const { error: dbError } = await supabase.rpc('admin_set_verification', {
        p_user_id: row.id,
        p_status: next,
      });
      if (dbError) {
        flash(L.saveError);
        return;
      }
      setRows((prev) => prev.map((item) => (
        item.id === row.id ? { ...item, verification_status: next } : item
      )));
      setSelected((prev) => (prev && prev.id === row.id ? { ...prev, verification_status: next } : prev));
      flash(next === 'verified'
        ? L.approveDone.replace('{{name}}', row.full_name ?? row.email ?? '')
        : L.rejectDone.replace('{{name}}', row.full_name ?? row.email ?? ''));
    } catch {
      flash(L.saveError);
    } finally {
      setSavingId('');
    }
  };

  const joined = (value: string | null) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <>
      <PageHead
        eyebrow={d.adminLabels.meta.eyebrow}
        title={L.title}
        sub={L.sub}
        actions={(
          <button type="button" className="btn ghost" onClick={load} disabled={loading}>
            <i className="ri-refresh-line" /> {L.refresh}
          </button>
        )}
      />

      <div className="grid c4 mb">
        <Stat icon="ri-user-follow-line" num={String(counts.total)} lbl={L.statTotal} />
        <Stat icon="ri-timer-line" num={String(counts.pending)} lbl={L.statPending} />
        <Stat icon="ri-shield-check-line" num={String(counts.verified)} lbl={L.statVerified} />
        <Stat icon="ri-building-2-line" num={String(counts.factories)} lbl={L.statFactories} />
      </div>

      {!user && (
        <div className="note mb">
          <i className="ri-flask-line" />
          <span>{L.demoNote}</span>
        </div>
      )}

      <Card
        title={L.title}
        sub={`${visible.length} / ${counts.total}`}
        action={(
          <div className="seg compact" role="tablist" aria-label={L.thPanel}>
            {PANELS.map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={panel === key}
                className={panel === key ? 'is-on' : ''}
                onClick={() => setPanel(key)}
              >
                {key === 'all' ? L.filterAll : t(`dashboard.group.${key}`)}
              </button>
            ))}
          </div>
        )}
      >
        <div className="row-between wrap mb" style={{ gap: 10 }}>
          <div className="acct-search" style={{ minWidth: 240, flex: 1 }}>
            <i className="ri-search-line" />
            <input
              type="search"
              value={query}
              placeholder={L.searchPh}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="seg compact" role="tablist" aria-label={L.thVerification}>
            {STATUSES.map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={status === key}
                className={status === key ? 'is-on' : ''}
                onClick={() => setStatus(key)}
              >
                {key === 'all' ? L.filterAll : statusLabel(key)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="empty">
            <i className="ri-loader-4-line spin" />
            <div>{L.loading}</div>
          </div>
        ) : error ? (
          <div className="empty">
            <i className="ri-error-warning-line" />
            <div>{error}</div>
            <button type="button" className="btn sm primary" onClick={load}>
              <i className="ri-refresh-line" /> {L.retry}
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className="empty">
            <i className="ri-user-search-line" />
            <div>{L.empty}</div>
            <div className="small muted">{L.emptyHint}</div>
          </div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{L.thAccount}</th>
                  <th>{L.thPanel}</th>
                  <th>{L.thEntity}</th>
                  <th>{L.thLocation}</th>
                  <th>{L.thVerification}</th>
                  <th>{L.thJoined}</th>
                  <th>{C.actions}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <button
                        type="button"
                        className="link-btn strong"
                        onClick={() => setSelected(row)}
                      >
                        {row.full_name || row.email || '—'}
                      </button>
                      <div className="s muted small" dir="ltr">{row.email || '—'}</div>
                    </td>
                    <td><Pill tone="info">{t(`dashboard.group.${row.panel}`)}</Pill></td>
                    <td>
                      {row.company || '—'}
                      <div className="s muted small">{row.cr_number ? `CR ${row.cr_number}` : row.industry ? optionLabel(String(row.industry)) : ''}</div>
                    </td>
                    <td>
                      {row.city || '—'}
                      <div className="s muted small">
                        {row.country ? optionLabel(String(row.country)) : ''}
                      </div>
                    </td>
                    <td>
                      <Pill tone={TONE[row.verification_status ?? 'unverified'] ?? 'mute'}>
                        {statusLabel(row.verification_status ?? 'unverified')}
                      </Pill>
                      {row.verification_ref ? (
                        <div className="s muted small" dir="ltr">{row.verification_ref}</div>
                      ) : null}
                    </td>
                    <td className="muted small">{joined(row.created_at)}</td>
                    <td>
                      <div className="row-between wrap" style={{ gap: 6 }}>
                        <button
                          type="button"
                          className="btn sm primary"
                          disabled={savingId === row.id || row.verification_status === 'verified'}
                          onClick={() => decide(row, 'verified')}
                        >
                          <i className="ri-check-line" /> {L.approve}
                        </button>
                        <button
                          type="button"
                          className="btn sm ghost"
                          disabled={savingId === row.id || row.verification_status === 'rejected'}
                          onClick={() => decide(row, 'rejected')}
                        >
                          <i className="ri-close-line" /> {L.reject}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="divider" />
        <div className="note">
          <i className="ri-information-line" />
          <span>{L.hint}</span>
        </div>
      </Card>

      <Modal
        open={Boolean(selected)}
        title={selected?.full_name || selected?.email || ''}
        sub={selected ? `${t(`dashboard.group.${selected.panel}`)} · ${statusLabel(selected.verification_status ?? 'unverified')}` : ''}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <>
            <div className="kv">
              {DETAIL_FIELDS.map((key) => {
                const raw = selected[key];
                if (typeof raw !== 'string' || !raw.trim()) return null;
                return (
                  <div className="kv-row" key={key}>
                    <span>{fieldLabel(key)}</span>
                    <b dir="auto">{optionLabel(raw)}</b>
                  </div>
                );
              })}
              {selected.verification_method ? (
                <div className="kv-row">
                  <span>{L.thMethod}</span>
                  <b>{L.methods[selected.verification_method as keyof typeof L.methods] ?? selected.verification_method}</b>
                </div>
              ) : null}
            </div>
            <div className="row-between wrap" style={{ gap: 8, marginTop: 14 }}>
              <button
                type="button"
                className="btn primary"
                disabled={savingId === selected.id}
                onClick={() => decide(selected, 'verified')}
              >
                <i className="ri-shield-check-line" /> {L.approve}
              </button>
              <button
                type="button"
                className="btn ghost"
                disabled={savingId === selected.id}
                onClick={() => decide(selected, 'rejected')}
              >
                <i className="ri-close-line" /> {L.reject}
              </button>
            </div>
          </>
        )}
      </Modal>

      <Toast message={toast} />
    </>
  );
}