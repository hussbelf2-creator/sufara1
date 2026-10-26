import { useEffect, useMemo, useState, type FunctionComponent } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '@/hooks/useDashboard';
import { usePlatformConfig } from '@/config/store';
import { tierFor } from '@/config/platform';
import { supabase, backendReady, absoluteUrl } from '@/lib/supabase';
import { useAccess } from '@/pages/auth/RequireAccess';
import { useIsLive, useRows } from '@/pages/dashboard/views/live/useLive';
import { Card, PageHead, Pill, Stat, Toast } from '@/pages/dashboard/components/ui';
import { QrCode, qrDataUrl } from '@/pages/dashboard/components/QrCode';
import { downloadWorkbook } from '@/pages/dashboard/lib/xlsx';
import type { LeaderMember } from '@/mocks/leader';

/* The leader ambassador's room — the highest-value role in the model: one
   Umrah agent brings hundreds of ambassadors (the pilgrims of each trip).

   - Team: one level only. The leader earns the configured override on the
     direct team's commissionable sales, never on anyone further down.
   - QR batches: one printed card per pilgrim, each with its own registered
     referral code, so every sale is attributed to the right member.
   - Reports: per-member performance exported to Excel. */

interface BatchCard {
  code: string;
  url: string;
}

function LeaderTeam() {
  const { t, i18n } = useTranslation();
  const d = useDashboard();
  const config = usePlatformConfig();
  const { demo } = useAccess();
  const isAr = (i18n.resolvedLanguage || i18n.language || 'ar').startsWith('ar');
  const locale = isAr ? 'ar-EG' : 'en-US';
  const nf = (n: number) => n.toLocaleString(locale, { maximumFractionDigits: 0 });
  const L = (key: string, opts?: Record<string, unknown>) => t(`platform.leader.${key}`, opts);
  const currency = t('dashboard.charts.currency');

  /* A real leader reads the one-level team from my_team(); the demo keeps
     the illustrative team. */
  const live = useIsLive();
  const me = useRows<{ code: string; is_leader: boolean }>(async () => {
    if (!live) return { data: [], error: null };
    const { data: sess } = await supabase.auth.getSession();
    return supabase.from('ambassadors').select('code, is_leader').eq('user_id', sess.session?.user.id ?? '');
  }, [live]);
  const liveTeam = useRows<{ user_id: string; name: string; country: string | null; status: string; clicks: number; delivered_orders: number; sales: number; commission: number; leader_bonus: number; joined: string }>(async () => {
    if (!live) return { data: [], error: null };
    const r = await supabase.rpc('my_team');
    return { data: r.data ?? [], error: r.error };
  }, [live]);
  const leaderCode = live ? (me.rows[0]?.code ?? '') : d.leaderProfile.code;
  const notLeader = live && !me.loading && !me.rows[0]?.is_leader;

  const [team, setTeam] = useState<LeaderMember[]>(d.leaderTeam);
  const [liveBonus, setLiveBonus] = useState<Record<string, number>>({});
  const [groupId, setGroupId] = useState(d.leaderGroups[0]?.id ?? '');
  const [tripLabel, setTripLabel] = useState('');
  const [count, setCount] = useState(20);
  const [batch, setBatch] = useState<BatchCard[]>([]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!live) {
      setTeam(d.leaderTeam);
      return;
    }
    setTeam(liveTeam.rows.map((m) => ({
      id: m.user_id, name: m.name, initials: m.name.slice(0, 2), country: m.country?.toUpperCase() ?? '', group: '—',
      joined: m.joined, clicks: Number(m.clicks), deliveredOrders: Number(m.delivered_orders), sales: Number(m.sales),
      commission: Number(m.commission), active: m.status === 'active',
    })));
    setLiveBonus(Object.fromEntries(liveTeam.rows.map((m) => [m.user_id, Number(m.leader_bonus)])));
  }, [live, d.leaderTeam, liveTeam.rows]);
  useEffect(() => {
    if (!toast) return undefined;
    const id = window.setTimeout(() => setToast(''), 3000);
    return () => window.clearTimeout(id);
  }, [toast]);

  const rows = useMemo(() => team.map((m) => {
    const tier = tierFor(config, m.deliveredOrders);
    return { ...m, tier, bonus: live ? (liveBonus[m.id] ?? 0) : Math.round(m.sales * config.ambassador.leaderBonus) };
  }), [team, config, live, liveBonus]);

  const totals = useMemo(() => ({
    members: rows.length,
    active: rows.filter((r) => r.active).length,
    sales: rows.reduce((s, r) => s + r.sales, 0),
    bonus: rows.reduce((s, r) => s + (r.active ? r.bonus : 0), 0),
  }), [rows]);

  const inviteUrl = absoluteUrl(`/auth/ambassador/register?leader=${encodeURIComponent(leaderCode)}`);
  const group = d.leaderGroups.find((g) => g.id === groupId);

  const toggle = (id: string) => setTeam((list) => list.map((m) => (m.id === id ? { ...m, active: !m.active } : m)));

  /* Codes are registered on the server (create_qr_batch) so they exist in
     referral_links and attribute. In the demo they are a local preview. */
  const generate = async () => {
    const n = Math.max(1, Math.min(200, Math.floor(count)));
    setBusy(true);
    let codes: string[] = [];
    if (backendReady && !demo) {
      const { data, error } = await supabase.rpc('create_qr_batch', { p_group: (live ? tripLabel : groupId) || 'TRIP', p_count: n });
      if (!error && Array.isArray(data)) codes = (data as { code: string }[]).map((r) => r.code);
      else setToast(L('batchFailed'));
    }
    if (!codes.length) {
      const prefix = `${leaderCode.split('-')[0]}-${groupId.replace(/[^A-Z0-9]/gi, '')}`;
      codes = Array.from({ length: n }, (_, i) => `${prefix}-${String(i + 1).padStart(3, '0')}`);
      if (!backendReady || demo) setToast(L('batchPreview'));
    }
    setBatch(codes.map((code) => ({ code, url: absoluteUrl(`/r/${encodeURIComponent(code)}`) })));
    setBusy(false);
  };

  const printBatch = async () => {
    if (!batch.length) return;
    const images = await Promise.all(batch.map((b) => qrDataUrl(b.url, 360)));
    const w = window.open('', '_blank');
    if (!w) return;
    const cards = batch.map((b, i) => `
      <div class="c"><img src="${images[i]}" alt=""/><b>${b.code}</b><span>${group?.name ?? ''}</span><small>${L('cardFooter')}</small></div>`).join('');
    w.document.write(`<!doctype html><html dir="${isAr ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><title>${L('printTitle')}</title>
      <style>body{font-family:Tajawal,system-ui,sans-serif;margin:16px;color:#0f2a1d}
      .g{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
      .c{border:1px dashed #9fb8a8;border-radius:12px;padding:10px;text-align:center;break-inside:avoid}
      .c img{width:150px;height:150px}.c b{display:block;font-size:13px;letter-spacing:.04em}
      .c span{display:block;font-size:11px;color:#4a5f53}.c small{display:block;font-size:10px;color:#7a8b80;margin-top:4px}
      @media print{body{margin:0}}</style></head><body><div class="g">${cards}</div>
      <script>window.onload=()=>setTimeout(()=>window.print(),300)<\/script></body></html>`);
    w.document.close();
  };

  const exportReport = () => {
    downloadWorkbook(`safeer-leader-team-${new Date().toISOString().slice(0, 10)}.xlsx`, [
      {
        name: L('reportSheet'),
        headers: [L('member'), L('country'), L('group'), L('tier'), L('clicks'), L('orders'), L('sales'), L('commission'), L('bonus'), L('status')],
        rows: rows.map((r) => [
          r.name, r.country, r.group, isAr ? r.tier.labelAr : r.tier.labelEn, r.clicks, r.deliveredOrders, r.sales, r.commission,
          r.active ? r.bonus : 0, r.active ? L('active') : L('paused'),
        ]),
      },
    ], isAr);
    setToast(L('exported'));
  };

  return (
    <>
      <PageHead eyebrow={L('eyebrow')} title={L('title')} sub={live ? L('subLive') : L('sub', { agency: d.leaderProfile.agency })} />
      {notLeader && <div className="note mb"><i className="ri-information-line" /><span>{L('notLeader')}</span></div>}
      <div className="grid c4 mb">
        <Stat icon="ri-team-line" num={nf(totals.members)} lbl={L('statMembers')} />
        <Stat icon="ri-user-star-line" num={nf(totals.active)} lbl={L('statActive')} />
        <Stat icon="ri-shopping-bag-3-line" num={`${nf(totals.sales)} ${currency}`} lbl={L('statSales')} />
        <Stat icon="ri-hand-coin-line" num={`${nf(totals.bonus)} ${currency}`} lbl={L('statBonus', { rate: (config.ambassador.leaderBonus * 100).toFixed(1) })} />
      </div>

      <Card
        className="mb"
        title={L('teamTitle')}
        sub={L('teamSub', { rate: (config.ambassador.leaderBonus * 100).toFixed(1) })}
        action={(
          <button type="button" className="btn ghost sm" onClick={exportReport}>
            <i className="ri-file-excel-2-line" /> {L('export')}
          </button>
        )}
      >
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{L('member')}</th><th>{L('group')}</th><th>{L('tier')}</th><th>{L('clicks')}</th>
                <th>{L('orders')}</th><th>{L('sales')}</th><th>{L('commission')}</th><th>{L('bonus')}</th><th>{L('status')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="tbl-name">
                      <span className="mini">{r.initials}</span>
                      <div><div className="t">{r.name}</div><div className="s">{r.country}</div></div>
                    </div>
                  </td>
                  <td className="small">{r.group}</td>
                  <td><Pill tone="info">{isAr ? r.tier.labelAr : r.tier.labelEn} · {(r.tier.rate * 100).toFixed(0)}%</Pill></td>
                  <td>{nf(r.clicks)}</td>
                  <td>{nf(r.deliveredOrders)}</td>
                  <td className="strong">{nf(r.sales)}</td>
                  <td>{nf(r.commission)}</td>
                  <td className="strong accent">{r.active ? nf(r.bonus) : '—'}</td>
                  <td>
                    {live ? <Pill tone={r.active ? 'ok' : 'mute'}>{r.active ? L('active') : L('paused')}</Pill> : (
                      <button type="button" className="btn ghost sm" onClick={() => toggle(r.id)} aria-pressed={r.active}>
                        <i className={r.active ? 'ri-pause-circle-line' : 'ri-play-circle-line'} /> {r.active ? L('active') : L('paused')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="note" style={{ marginTop: 12 }}>
          <i className="ri-node-tree" />
          <span>{L('oneLevel')}</span>
        </div>
      </Card>

      <div className="grid c2 mb">
        <Card title={L('inviteTitle')} sub={L('inviteSub')}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <QrCode value={inviteUrl} size={150} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <div className="small muted">{L('inviteLink')}</div>
              <div className="strong" dir="ltr" style={{ wordBreak: 'break-all' }}>{inviteUrl}</div>
              <button
                type="button"
                className="btn primary sm"
                style={{ marginTop: 10 }}
                onClick={async () => {
                  try { await navigator.clipboard.writeText(inviteUrl); } catch { /* ignore */ }
                  setToast(L('copied'));
                }}
              >
                <i className="ri-file-copy-line" /> {L('copy')}
              </button>
            </div>
          </div>
        </Card>

        <Card title={L('batchTitle')} sub={L('batchSub')}>
          <div className="grid c2">
            <div className="field">
              <label htmlFor="qr-group">{L('group')}</label>
              {live ? (
                <input id="qr-group" value={tripLabel} onChange={(e) => setTripLabel(e.target.value)} placeholder={L('tripPh')} />
              ) : (
                <select id="qr-group" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
                  {d.leaderGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              )}
            </div>
            <div className="field">
              <label htmlFor="qr-count">{L('cards')}</label>
              <input id="qr-count" type="number" dir="ltr" min={1} max={200} value={count} onChange={(e) => setCount(Number(e.target.value))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn primary sm" onClick={generate} disabled={busy}>
              <i className={busy ? 'ri-loader-4-line' : 'ri-qr-code-line'} /> {L('generate')}
            </button>
            <button type="button" className="btn ghost sm" onClick={printBatch} disabled={!batch.length}>
              <i className="ri-printer-line" /> {L('print', { count: batch.length })}
            </button>
          </div>
          {batch.length > 0 && (
            <div className="small muted" style={{ marginTop: 10 }}>
              {L('batchReady', { count: batch.length, first: batch[0].code, last: batch[batch.length - 1].code })}
            </div>
          )}
        </Card>
      </div>

      <Toast message={toast} />
    </>
  );
}

export const leaderViews: Record<string, FunctionComponent> = {
  leader: LeaderTeam,
};
