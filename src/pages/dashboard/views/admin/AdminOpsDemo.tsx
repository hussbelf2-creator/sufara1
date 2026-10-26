import type { FunctionComponent } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, PageHead, Pill, Stat } from '@/pages/dashboard/components/ui';

/* Demo versions of the warehouse and group-order screens. The live versions
   (views/live/LiveLogistics) replace them for a real admin session. */

function useL() {
  const { t } = useTranslation();
  return (key: string, opts?: Record<string, unknown>) => t(`platform.logi.${key}`, opts);
}

const SITES = [
  { id: 'jed-1', name: 'مستودع جدة', city: 'جدة', def: true },
  { id: 'dmm-1', name: 'مستودع الدمام', city: 'الدمام', def: false },
];
const QUEUE = [
  { id: 'SFR-20611-hasa', factory: 'مصنع تمور الأحساء', units: 120, country: 'id', stage: 'handed' },
  { id: 'SFR-20614-oud', factory: 'بيت عود الرياض', units: 40, country: 'pk', stage: 'received' },
  { id: 'SFR-20598-fifa', factory: 'مزارع قهوة فيفا', units: 60, country: 'id', stage: 'passed' },
  { id: 'SFR-20590-hasa', factory: 'مصنع تمور الأحساء', units: 30, country: 'id', stage: 'failed' },
];

function AdminWarehousesDemo() {
  const L = useL();
  return (
    <>
      <PageHead eyebrow={L('eyebrow')} title={L('whTitle')} sub={L('whSub')} />
      <div className="seg compact mb" role="tablist" aria-label={L('warehouse')}>
        {SITES.map((w) => (
          <button key={w.id} type="button" role="tab" aria-selected={w.def} className={w.def ? 'is-on' : ''}><i className="ri-building-line" /> {w.name}</button>
        ))}
      </div>
      <div className="grid c4 mb">
        <Stat icon="ri-time-line" num="3" lbl={L('stAwaiting')} />
        <Stat icon="ri-truck-line" num="1" lbl={L('stInbound')} />
        <Stat icon="ri-search-eye-line" num="1" lbl={L('stInspect')} />
        <Stat icon="ri-box-3-line" num="1" lbl={L('stReady')} />
      </div>
      <Card title={L('shipments')}>
        <div className="list">
          {QUEUE.map((r) => (
            <div className="list-row" key={r.id}>
              <div className="ic"><i className="ri-box-3-line" /></div>
              <div className="body">
                <div className="t" dir="ltr">{r.id}</div>
                <div className="s">{r.factory} · {r.units} {L('units')} · {r.country.toUpperCase()}</div>
              </div>
              <div className="end"><Pill tone={r.stage === 'passed' ? 'ok' : r.stage === 'failed' ? 'danger' : 'warn'}>{L(`s_${r.stage}`)}</Pill></div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

const GROUPS = [
  { code: 'GRP-JKT-14', dest: 'ID Jakarta', n: 9, min: 15, status: 'awaiting_decision', msgs: 1 },
  { code: 'GRP-KHI-07', dest: 'PK Karachi', n: 22, min: 20, status: 'ready', msgs: 0 },
  { code: 'GRP-CAI-03', dest: 'EG Cairo', n: 6, min: 12, status: 'open', msgs: 0 },
];

function AdminGroupsDemo() {
  const L = useL();
  return (
    <>
      <PageHead eyebrow={L('eyebrow')} title={L('groupsTitle')} sub={L('groupsSub')} />
      <div className="grid c3 mb">
        <Stat icon="ri-alarm-warning-line" num="1" lbl={L('s_awaiting_decision')} />
        <Stat icon="ri-group-line" num="1" lbl={L('s_open')} />
        <Stat icon="ri-box-3-line" num="1" lbl={L('s_ready')} />
      </div>
      <Card>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>{L('code')}</th><th>{L('destination')}</th><th>{L('participantsCol')}</th><th>{L('status')}</th><th /></tr></thead>
            <tbody>
              {GROUPS.map((g) => (
                <tr key={g.code}>
                  <td className="strong" dir="ltr">{g.code}</td>
                  <td>{g.dest}</td>
                  <td>{g.n} / {g.min}</td>
                  <td><Pill tone={g.status === 'ready' ? 'ok' : 'warn'}>{L(`s_${g.status}`)}</Pill><div className="s small muted">{L('messagesSent', { n: g.msgs })}</div></td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button type="button" className="btn ghost sm"><i className="ri-mail-send-line" /> {L('message')}</button>
                    {g.status !== 'ready' && <button type="button" className="btn primary sm">{L('decide')}</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="note" style={{ marginTop: 12 }}><i className="ri-information-line" /><span>{L('groupsNote')}</span></div>
      </Card>
    </>
  );
}

const WA = [
  { kind: 'order.paid', name: 'safeer_order_paid', on: true },
  { kind: 'order.shipped', name: 'safeer_order_shipped', on: true },
  { kind: 'order.delivered', name: 'safeer_order_delivered', on: false },
  { kind: 'group.message', name: 'safeer_group_update', on: false },
];

function AdminWhatsAppDemo() {
  const { t } = useTranslation();
  const W = (k: string, o?: Record<string, unknown>) => t(`platform.wa.${k}`, o);
  return (
    <>
      <PageHead eyebrow={W('eyebrow')} title={W('title')} sub={W('sub')} />
      <div className="note mb"><i className="ri-information-line" /><span>{W('howNote')}</span></div>
      <Card>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>{W('kind')}</th><th>{W('template')}</th><th>{W('status')}</th></tr></thead>
            <tbody>
              {WA.map((r) => (
                <tr key={r.kind}>
                  <td className="strong">{W(`k_${r.kind.replace('.', '_')}`)}</td>
                  <td dir="ltr">{r.name}</td>
                  <td><Pill tone={r.on ? 'ok' : 'mute'}>{r.on ? W('on') : W('off')}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

const HEALTH = [
  ['nightly', 'ok'], ['notify_dispatch', 'ok'], ['backup', 'ok'], ['webhooks', 'warn'], ['email_backlog', 'ok'], ['client_errors', 'ok'],
  ['stuck_payments', 'warn'], ['late_handover', 'ok'], ['ledger_balance', 'ok'], ['invoice_chain', 'ok'], ['privacy_deadlines', 'ok'],
];

function AdminHealthDemo() {
  const { t } = useTranslation();
  const T = (k: string) => t(`platform.trust.${k}`);
  return (
    <>
      <PageHead eyebrow={T('opsEyebrow')} title={T('healthTitle')} sub={T('healthSub')} />
      <Card title={T('checks')} action={<Pill tone="warn">{T('ov_warn')}</Pill>}>
        <div className="grid c3">
          {HEALTH.map(([k, st]) => (
            <div className="list-row" key={k}>
              <div className="body">
                <div className="t">{T(`chk_${k}`)} <Pill tone={st === 'ok' ? 'ok' : 'warn'}>{T(`ov_${st}`)}</Pill></div>
                <div className="s">{T(`chkHint_${k}`)}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="note" style={{ marginTop: 12 }}><i className="ri-information-line" /><span>{T('healthNote')}</span></div>
      </Card>
    </>
  );
}

function AdminPrivacyDemo() {
  const { t } = useTranslation();
  const T = (k: string) => t(`platform.trust.${k}`);
  const rows = [['خالد ع.', 'deletion', 'open'], ['Siti R.', 'access', 'done'], ['Ahmed K.', 'correction', 'in_progress']];
  return (
    <>
      <PageHead eyebrow={T('opsEyebrow')} title={T('adminPrivacyTitle')} sub={T('adminPrivacySub')} />
      <Card>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>{T('person')}</th><th>{T('kind')}</th><th>{T('status')}</th></tr></thead>
            <tbody>
              {rows.map(([n, k, st]) => (
                <tr key={n}><td className="strong">{n}</td><td>{T(`kind_${k}`)}</td><td><Pill tone={st === 'done' ? 'ok' : 'warn'}>{T(`st_${st}`)}</Pill></td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="note" style={{ marginTop: 12 }}><i className="ri-information-line" /><span>{T('adminPrivacyNote')}</span></div>
      </Card>
    </>
  );
}

export const adminOpsDemoViews: Record<string, FunctionComponent> = {
  'admin-health': AdminHealthDemo,
  'admin-privacy': AdminPrivacyDemo,
  'admin-warehouses': AdminWarehousesDemo,
  'admin-groups': AdminGroupsDemo,
  'admin-whatsapp': AdminWhatsAppDemo,
};
