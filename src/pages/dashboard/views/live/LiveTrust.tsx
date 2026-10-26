import { useState, type FunctionComponent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { LEGAL_DOCS, type LegalDocKey } from '@/config/legal';
import { Card, Modal, PageHead, Pill, Stat, Toast } from '@/pages/dashboard/components/ui';
import { useMoney, useRows } from './useLive';

/* Trust & operations: legal acceptance gate, PDPL self-service and the
   admin queue, and the system-health screen. */

function useT() {
  const { t } = useTranslation();
  return (key: string, opts?: Record<string, unknown>) => t(`platform.trust.${key}`, opts);
}
function useFlash() {
  const [toast, setToast] = useState('');
  return { toast, flash: (m: string) => { setToast(m); window.setTimeout(() => setToast(''), 3200); } };
}
const tone = (s: string) => (s === 'ok' || s === 'done' ? 'ok' : s === 'fail' || s === 'rejected' ? 'danger' : 'warn');

/* ═══════════ legal acceptance gate ═══════════ */

/** Shown instead of the panel while the account has documents to accept. */
export function LegalGate({ children }: { children: ReactNode }) {
  const T = useT();
  const { t } = useTranslation();
  const pending = useRows<{ key: LegalDocKey; version: string; effective_from: string }>(() => supabase.rpc('my_pending_legal'));
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  if (pending.loading || !pending.rows.length) return <>{children}</>;
  const accept = async () => {
    setBusy(true);
    await supabase.rpc('accept_legal', { p_keys: pending.rows.map((d) => d.key), p_user_agent: navigator.userAgent });
    setBusy(false);
    pending.reload();
  };
  return (
    <>
      <PageHead eyebrow={T('legalEyebrow')} title={T('legalTitle')} sub={T('legalSub')} />
      <Card>
        <div className="list">
          {pending.rows.map((d) => (
            <div className="list-row" key={d.key}>
              <div className="ic"><i className="ri-file-text-line" /></div>
              <div className="body">
                <div className="t">{t(`legal.${d.key}.crumb`)}</div>
                <div className="s">{T('versionOf', { version: d.version, date: d.effective_from })}</div>
              </div>
              <div className="end">
                <a className="btn ghost sm" href={LEGAL_DOCS[d.key]?.path ?? '/terms'} target="_blank" rel="noreferrer"><i className="ri-external-link-line" /> {T('read')}</a>
              </div>
            </div>
          ))}
        </div>
        <label className="switch" style={{ marginTop: 14 }}>
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
          <span className="track" />
          <span>{T('acceptAll')}</span>
        </label>
        <div className="modal-actions">
          <button type="button" className="btn primary" disabled={!checked || busy} onClick={accept}><i className="ri-check-double-line" /> {T('accept')}</button>
        </div>
        <div className="note" style={{ marginTop: 12 }}><i className="ri-information-line" /><span>{T('legalNote')}</span></div>
      </Card>
    </>
  );
}

/* ═══════════ PDPL self-service (in the account screen) ═══════════ */

export function PrivacyCard() {
  const T = useT();
  const m = useMoney();
  const { toast, flash } = useFlash();
  const mine = useRows<{ id: number; kind: string; status: string; created_at: string; due_at: string; resolution: string | null }>(
    () => supabase.from('data_requests').select('id, kind, status, created_at, due_at, resolution').order('created_at', { ascending: false }));
  const [ask, setAsk] = useState<'correction' | 'deletion' | null>(null);
  const [details, setDetails] = useState('');

  const download = async () => {
    const { data, error } = await supabase.rpc('export_my_data');
    if (error) { flash(error.message); return; }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `safeer-my-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    flash(T('downloaded'));
  };
  const send = async () => {
    if (!ask) return;
    const { error } = await supabase.rpc('request_data_action', { p_kind: ask, p_details: details || null });
    flash(error ? error.message : T('requestSent'));
    if (!error) { setAsk(null); setDetails(''); mine.reload(); }
  };

  return (
    <Card className="mb" title={T('privacyTitle')} sub={T('privacySub')}>
      <div className="row-actions">
        <button type="button" className="btn ghost sm" onClick={download}><i className="ri-download-2-line" /> {T('download')}</button>
        <button type="button" className="btn ghost sm" onClick={() => setAsk('correction')}><i className="ri-edit-line" /> {T('askCorrection')}</button>
        <button type="button" className="btn ghost sm" onClick={() => setAsk('deletion')}><i className="ri-delete-bin-line" /> {T('askDeletion')}</button>
      </div>
      {mine.rows.length > 0 && (
        <div className="list" style={{ marginTop: 10 }}>
          {mine.rows.map((r) => (
            <div className="list-row" key={r.id}>
              <div className="body">
                <div className="t">{T(`kind_${r.kind}`)} <Pill tone={tone(r.status)}>{T(`st_${r.status}`)}</Pill></div>
                <div className="s">{m.date(r.created_at)} · {T('dueBy', { date: m.date(r.due_at) })}{r.resolution ? ` · ${r.resolution}` : ''}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={!!ask} onClose={() => setAsk(null)} title={ask ? T(`kind_${ask}`) : ''} sub={ask === 'deletion' ? T('deletionSub') : T('correctionSub')}>
        <div className="field">
          <label htmlFor="pr-d">{T('details')}</label>
          <textarea id="pr-d" value={details} onChange={(e) => setDetails(e.target.value)} />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn primary" disabled={ask === 'correction' && !details.trim()} onClick={send}><i className="ri-send-plane-line" /> {T('send')}</button>
        </div>
      </Modal>
      <Toast message={toast} />
    </Card>
  );
}

/* ═══════════ admin · privacy requests ═══════════ */

interface DataReq { id: number; kind: string; status: string; details: string | null; email: string | null; full_name: string | null; created_at: string; due_at: string; overdue: boolean; resolution: string | null }

function AdminPrivacy() {
  const T = useT();
  const m = useMoney();
  const { toast, flash } = useFlash();
  const { rows, error, reload } = useRows<DataReq>(() => supabase.from('admin_data_requests').select('*').order('due_at'));
  const [act, setAct] = useState<{ r: DataReq; status: 'in_progress' | 'done' | 'rejected' } | null>(null);
  const [note, setNote] = useState('');
  const open = rows.filter((r) => ['open', 'in_progress'].includes(r.status));
  const submit = async () => {
    if (!act) return;
    const { error: e } = await supabase.rpc('admin_resolve_data_request', { p_id: act.r.id, p_status: act.status, p_resolution: note || null });
    flash(e ? e.message : T('saved'));
    if (!e) { setAct(null); setNote(''); reload(); }
  };
  return (
    <>
      <PageHead eyebrow={T('opsEyebrow')} title={T('adminPrivacyTitle')} sub={T('adminPrivacySub')} />
      <div className="grid c3 mb">
        <Stat icon="ri-inbox-line" num={String(open.length)} lbl={T('openRequests')} />
        <Stat icon="ri-alarm-warning-line" num={String(rows.filter((r) => r.overdue).length)} lbl={T('overdue')} />
        <Stat icon="ri-check-line" num={String(rows.filter((r) => r.status === 'done').length)} lbl={T('st_done')} />
      </div>
      {error && <div className="note mb"><i className="ri-error-warning-line" /><span>{error}</span></div>}
      <Card>
        {!rows.length ? <div className="empty"><i className="ri-inbox-2-line" />{T('none')}</div> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>{T('person')}</th><th>{T('kind')}</th><th>{T('details')}</th><th>{T('due')}</th><th>{T('status')}</th><th /></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="strong">{r.full_name ?? '—'}<div className="s small muted" dir="ltr">{r.email ?? ''}</div></td>
                    <td>{T(`kind_${r.kind}`)}</td>
                    <td className="small" style={{ maxWidth: 260 }}>{r.details ?? '—'}{r.resolution && <div className="muted">{r.resolution}</div>}</td>
                    <td>{m.date(r.due_at)}{r.overdue && <div><Pill tone="danger">{T('overdue')}</Pill></div>}</td>
                    <td><Pill tone={tone(r.status)}>{T(`st_${r.status}`)}</Pill></td>
                    <td>
                      {['open', 'in_progress'].includes(r.status) && (
                        <div className="row-actions">
                          {r.status === 'open' && <button type="button" className="btn ghost sm" onClick={() => { setAct({ r, status: 'in_progress' }); }}>{T('start')}</button>}
                          <button type="button" className="btn primary sm" onClick={() => setAct({ r, status: 'done' })}>{r.kind === 'deletion' ? T('anonymize') : T('complete')}</button>
                          <button type="button" className="btn ghost sm" onClick={() => setAct({ r, status: 'rejected' })}>{T('reject')}</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="note" style={{ marginTop: 12 }}><i className="ri-information-line" /><span>{T('adminPrivacyNote')}</span></div>
      </Card>
      <Modal open={!!act} onClose={() => setAct(null)} title={act ? T(`do_${act.status}`) : ''} sub={act?.r.kind === 'deletion' && act.status === 'done' ? T('anonymizeWarn') : ''}>
        <div className="field">
          <label htmlFor="ap-n">{T('resolution')}</label>
          <textarea id="ap-n" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn primary" disabled={act?.status === 'rejected' && !note.trim()} onClick={submit}>{T('confirm')}</button>
        </div>
      </Modal>
      <Toast message={toast} />
    </>
  );
}

/* ═══════════ admin · system health ═══════════ */

interface Health { checked_at: string; overall: string; checks: { key: string; status: string; value: unknown }[] }

function AdminHealth() {
  const T = useT();
  const m = useMoney();
  const health = useRows<Health>(async () => {
    const r = await supabase.rpc('system_health');
    return { data: r.data ? [r.data] : [], error: r.error };
  });
  const jobs = useRows<{ id: number; job: string; status: string; finished_at: string; error: string | null; details: Record<string, unknown> }>(
    () => supabase.from('job_runs').select('*').order('finished_at', { ascending: false }).limit(30));
  const hooks = useRows<{ id: number; source: string; event_id: string | null; status: string; http_status: number | null; error: string | null; received_at: string }>(
    () => supabase.from('webhook_events').select('*').neq('status', 'ok').order('received_at', { ascending: false }).limit(30));
  const errors = useRows<{ id: number; message: string; url: string | null; release: string | null; occurrences: number; last_seen: string }>(
    () => supabase.from('client_errors').select('id, message, url, release, occurrences, last_seen').order('last_seen', { ascending: false }).limit(30));
  const h = health.rows[0];
  const show = (v: unknown) => (v == null ? '—' : typeof v === 'string' && /^\d{4}-\d\d-\d\dT/.test(v) ? new Date(v).toLocaleString(m.locale) : String(v));

  return (
    <>
      <PageHead eyebrow={T('opsEyebrow')} title={T('healthTitle')} sub={T('healthSub')}
        actions={<button type="button" className="btn ghost sm" onClick={() => { health.reload(); jobs.reload(); hooks.reload(); errors.reload(); }}><i className="ri-refresh-line" /> {T('refresh')}</button>} />
      {health.error && <div className="note mb"><i className="ri-error-warning-line" /><span>{health.error}</span></div>}
      {h && (
        <Card className="mb" title={T('checks')} action={<Pill tone={tone(h.overall)}>{T(`ov_${h.overall}`)}</Pill>}>
          <div className="grid c3">
            {h.checks.map((c) => (
              <div className="list-row" key={c.key}>
                <div className="ic"><i className={c.status === 'ok' ? 'ri-checkbox-circle-line' : c.status === 'warn' ? 'ri-error-warning-line' : 'ri-close-circle-line'} /></div>
                <div className="body">
                  <div className="t">{T(`chk_${c.key}`)} <Pill tone={tone(c.status)}>{T(`ov_${c.status}`)}</Pill></div>
                  <div className="s">{T(`chkHint_${c.key}`)} · {show(c.value)}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="note" style={{ marginTop: 12 }}><i className="ri-information-line" /><span>{T('healthNote')}</span></div>
        </Card>
      )}
      <div className="grid c2 mb">
        <Card title={T('jobs')}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>{T('job')}</th><th>{T('when')}</th><th>{T('status')}</th></tr></thead>
              <tbody>
                {jobs.rows.map((j) => (
                  <tr key={j.id}><td dir="ltr">{j.job}</td><td className="small">{show(j.finished_at)}</td><td><Pill tone={tone(j.status)}>{j.status}</Pill>{j.error && <div className="s small muted">{j.error}</div>}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title={T('webhookFailures')}>
          {!hooks.rows.length ? <div className="empty"><i className="ri-shield-check-line" />{T('none')}</div> : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>{T('source')}</th><th>{T('when')}</th><th>{T('error')}</th></tr></thead>
                <tbody>
                  {hooks.rows.map((w) => (
                    <tr key={w.id}><td>{w.source}<div className="s small muted" dir="ltr">{w.event_id ?? ''}</div></td><td className="small">{show(w.received_at)}</td><td className="small">{w.status} {w.http_status ?? ''} {w.error ?? ''}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
      <Card title={T('clientErrors')}>
        {!errors.rows.length ? <div className="empty"><i className="ri-bug-line" />{T('none')}</div> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>{T('error')}</th><th>{T('page')}</th><th>{T('count')}</th><th>{T('when')}</th></tr></thead>
              <tbody>
                {errors.rows.map((e) => (
                  <tr key={e.id}><td className="small" dir="ltr" style={{ maxWidth: 380 }}>{e.message}<div className="muted">{e.release}</div></td><td className="small" dir="ltr">{e.url}</td><td className="strong">{e.occurrences}</td><td className="small">{show(e.last_seen)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

export const liveTrustViews: Record<string, Record<string, FunctionComponent>> = {
  admin: { 'admin-privacy': AdminPrivacy, 'admin-health': AdminHealth },
};
