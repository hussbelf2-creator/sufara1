import { useEffect, useMemo, useState, type FunctionComponent, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { Card, Modal, PageHead, Pill, Stat, Toast } from '@/pages/dashboard/components/ui';
import { useMoney, useRows } from './useLive';

/* Logistics, warehouses, factory documents (KYB) and group orders.

   The warehouse flow is the same whichever site handles it (Jeddah, Dammam,
   Riyadh, or a third-party hub abroad):
     paid → factory hands over → received → inspected → packed into a
     shipment → label (aggregator or manual) → carrier events
   and every carrier event moves the sub-orders on (dispatch, delivery →
   return window → commissions and factory settlement). */

const ok = ['passed', 'approved', 'verified', 'delivered', 'ready', 'active'];
const bad = ['inactive', 'failed', 'rejected', 'exception', 'returned', 'cancelled'];
const tone = (s: string) => (ok.includes(s) ? 'ok' : bad.includes(s) ? 'danger' : 'warn');

function useL() {
  const { t } = useTranslation();
  return (key: string, opts?: Record<string, unknown>) => t(`platform.logi.${key}`, opts);
}
function useFlash() {
  const [toast, setToast] = useState('');
  return { toast, flash: (m: string) => { setToast(m); window.setTimeout(() => setToast(''), 3200); } };
}
function Empty({ text }: { text: string }) {
  return <div className="empty"><i className="ri-inbox-2-line" />{text}</div>;
}
function Err({ error }: { error: string }) {
  return error ? <div className="note mb"><i className="ri-error-warning-line" /><span>{error}</span></div> : null;
}
function St({ value }: { value: string }) {
  const L = useL();
  return <Pill tone={tone(value)}>{L(`s_${value}`, { defaultValue: value })}</Pill>;
}

async function invokeShipping(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('shipping', { body });
  if (error) {
    /* functions.invoke wraps non-2xx bodies; surface the server message */
    const ctx = (error as { context?: Response }).context;
    const payload = ctx ? await ctx.json().catch(() => null) : null;
    return { data: null, error: (payload?.error as string) ?? error.message, manual: Boolean(payload?.manual) };
  }
  return { data: data as Record<string, unknown>, error: '', manual: false };
}

/* ═══════════════════════════ admin · warehouses ═══════════════════════════ */

interface Wh { id: string; name_ar: string; name_en: string; country: string; city: string; address: string; contact_phone: string | null; active: boolean; is_default: boolean }
interface QueueRow {
  id: string; order_id: string; factory_id: string; factory_name: string; warehouse_id: string | null; goods: number; units: number;
  handover_at: string | null; handover_ref: string | null; received_at: string | null; inspection: string; inspection_note: string | null;
  shipment_id: string | null; country: string; channel: string; ship_method: string | null; group_order_id: string | null;
}
interface Carrier { code: string; name_ar: string; name_en: string; services: string[]; mode: string; tracking_url: string | null; active: boolean }

function AdminWarehouses() {
  const L = useL();
  const m = useMoney();
  const { toast, flash } = useFlash();
  const whs = useRows<Wh>(() => supabase.from('warehouses').select('*').order('is_default', { ascending: false }));
  const queue = useRows<QueueRow>(() => supabase.from('admin_warehouse_queue').select('*').limit(1000));
  const carriers = useRows<Carrier>(() => supabase.from('carriers').select('*').eq('active', true));
  const [site, setSite] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [pack, setPack] = useState({ carrier: '', service: '', weight: '' });
  const [rates, setRates] = useState<{ carrier: string; service: string; amount: number; etaDays: number[]; source: string }[]>([]);
  const [newWh, setNewWh] = useState({ id: '', name_ar: '', city: '', country: 'sa', address: '' });
  const [inspect, setInspect] = useState<QueueRow | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!site && whs.rows.length) setSite(whs.rows.find((w) => w.is_default)?.id ?? whs.rows[0].id);
  }, [whs.rows, site]);

  const rows = queue.rows.filter((r) => r.warehouse_id === site && !r.shipment_id);
  const stage = {
    awaiting: rows.filter((r) => !r.handover_at && !r.received_at),
    inbound: rows.filter((r) => r.handover_at && !r.received_at),
    toInspect: rows.filter((r) => r.received_at && r.inspection === 'pending'),
    failed: rows.filter((r) => r.inspection === 'failed'),
    ready: rows.filter((r) => r.inspection === 'passed'),
  };
  const byCountry = useMemo(() => {
    const map = new Map<string, QueueRow[]>();
    stage.ready.forEach((r) => map.set(r.country, [...(map.get(r.country) ?? []), r]));
    return [...map.entries()];
  }, [stage.ready]);

  const rpc = async (fn: string, args: Record<string, unknown>, msg: string) => {
    const { error } = await supabase.rpc(fn, args);
    flash(error ? error.message : msg);
    if (!error) queue.reload();
    return !error;
  };

  const pickedRows = stage.ready.filter((r) => picked.includes(r.id));
  const pickedCountry = pickedRows[0]?.country;

  const quote = async () => {
    if (!pickedRows.length) return;
    const res = await invokeShipping({ action: 'rates', warehouse: site, country: pickedCountry, weightKg: Number(pack.weight) || pickedRows.reduce((s, r) => s + Number(r.units) * 0.6, 0), parcels: 1 });
    if (res.error) flash(res.error);
    else setRates((res.data?.rates as typeof rates) ?? []);
  };

  const createShipment = async () => {
    if (!pack.carrier || !pack.service) { flash(L('pickCarrier')); return; }
    const { data, error } = await supabase.rpc('wh_create_shipment', { p_warehouse: site, p_subs: picked, p_carrier: pack.carrier, p_service: pack.service });
    if (error) { flash(error.message); return; }
    setPicked([]);
    setRates([]);
    setPack({ carrier: '', service: '', weight: '' });
    queue.reload();
    /* The scale weight is checked against the catalogue; a gap over 20% is
       sent to the admins with the products to correct. */
    let gapNote = '';
    if (Number(pack.weight) > 0) {
      const gap = await supabase.rpc('record_measured_weight', { p_shipment: data, p_kg: Number(pack.weight) });
      if (!gap.error && gap.data != null && Math.abs(Number(gap.data)) > 0.2) gapNote = ` · ${L('weightGap', { pct: Math.round(Number(gap.data) * 100) })}`;
    }
    const label = await invokeShipping({ action: 'label', shipment: data, weightKg: Number(pack.weight) || undefined });
    flash((label.error ? (label.manual ? L('manualLabel') : label.error) : L('labelCreated', { no: String(label.data?.trackingNo ?? '') })) + gapNote);
  };

  const addWarehouse = async () => {
    const { error } = await supabase.from('warehouses').insert({ ...newWh, id: newWh.id.toLowerCase(), name_en: newWh.name_ar });
    flash(error ? error.message : L('warehouseAdded'));
    if (!error) { setNewWh({ id: '', name_ar: '', city: '', country: 'sa', address: '' }); whs.reload(); }
  };
  const updateWh = async (w: Wh, patch: Partial<Wh>) => {
    if (patch.is_default) await supabase.from('warehouses').update({ is_default: false }).eq('is_default', true);
    const { error } = await supabase.from('warehouses').update(patch).eq('id', w.id);
    flash(error ? error.message : L('saved'));
    if (!error) whs.reload();
  };

  const Column = ({ title, icon, list, action }: { title: string; icon: string; list: QueueRow[]; action?: (r: QueueRow) => ReactElement | null }) => (
    <Card title={`${title} (${list.length})`}>
      {!list.length ? <Empty text={L('none')} /> : (
        <div className="list">
          {list.map((r) => (
            <div className="list-row" key={r.id}>
              <div className="ic"><i className={icon} /></div>
              <div className="body">
                <div className="t" dir="ltr">{r.id}</div>
                <div className="s">{r.factory_name} · {m.num(r.units)} {L('units')} · {r.country.toUpperCase()} · {L(`ch_${r.channel}`)}{r.handover_ref ? ` · ${r.handover_ref}` : ''}</div>
                {r.inspection_note && <div className="s">{r.inspection_note}</div>}
              </div>
              <div className="end">{action?.(r)}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );

  const current = whs.rows.find((w) => w.id === site);
  return (
    <>
      <PageHead eyebrow={L('eyebrow')} title={L('whTitle')} sub={L('whSub')} />
      <Err error={queue.error || whs.error} />
      <div className="row-between wrap mb" style={{ gap: 10 }}>
        <div className="seg compact" role="tablist" aria-label={L('warehouse')}>
          {whs.rows.filter((w) => w.active).map((w) => (
            <button key={w.id} type="button" role="tab" aria-selected={site === w.id} className={site === w.id ? 'is-on' : ''} onClick={() => { setSite(w.id); setPicked([]); }}>
              <i className="ri-building-line" /> {w.name_ar}
            </button>
          ))}
        </div>
        {current && <span className="small muted">{current.city} · {current.address}</span>}
      </div>
      <div className="grid c4 mb">
        <Stat icon="ri-time-line" num={String(stage.awaiting.length)} lbl={L('stAwaiting')} />
        <Stat icon="ri-truck-line" num={String(stage.inbound.length)} lbl={L('stInbound')} />
        <Stat icon="ri-search-eye-line" num={String(stage.toInspect.length)} lbl={L('stInspect')} />
        <Stat icon="ri-box-3-line" num={String(stage.ready.length)} lbl={L('stReady')} />
      </div>

      <div className="grid c2 mb">
        <Column title={L('stInbound')} icon="ri-truck-line" list={[...stage.inbound, ...stage.awaiting]} action={(r) => (
          r.handover_at
            ? <button type="button" className="btn primary sm" onClick={() => rpc('wh_receive', { p_sub_order: r.id }, L('received'))}>{L('receive')}</button>
            : <Pill tone="mute">{L('waitingFactory')}</Pill>
        )} />
        <Column title={L('stInspect')} icon="ri-search-eye-line" list={[...stage.toInspect, ...stage.failed]} action={(r) => (
          <button type="button" className="btn ghost sm" onClick={() => { setInspect(r); setNote(r.inspection_note ?? ''); }}>
            {r.inspection === 'failed' ? L('reinspect') : L('inspect')}
          </button>
        )} />
      </div>

      <Card className="mb" title={L('packTitle')} sub={L('packSub')}>
        {!byCountry.length ? <Empty text={L('nothingToPack')} /> : byCountry.map(([country, list]) => (
          <div key={country} style={{ marginBottom: 14 }}>
            <div className="strong" style={{ marginBottom: 6 }}>{country.toUpperCase()} · {list.length}</div>
            {list.map((r) => (
              <label key={r.id} className="list-row" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={picked.includes(r.id)}
                  disabled={!!pickedCountry && pickedCountry !== r.country}
                  onChange={(e) => setPicked((p) => (e.target.checked ? [...p, r.id] : p.filter((x) => x !== r.id)))}
                />
                <div className="body">
                  <div className="t" dir="ltr">{r.id}</div>
                  <div className="s">{r.factory_name} · {m.money(r.goods)} · {r.group_order_id ? L('groupParcel') : L(`ch_${r.channel}`)}</div>
                </div>
              </label>
            ))}
          </div>
        ))}
        {picked.length > 0 && (
          <div className="grid c3" style={{ alignItems: 'end', marginTop: 10 }}>
            <div className="field">
              <label htmlFor="pk-w">{L('actualWeight')}</label>
              <input id="pk-w" type="number" min={0} step="0.1" dir="ltr" placeholder={L('weightPh')} value={pack.weight} onChange={(e) => setPack({ ...pack, weight: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="pk-c">{L('carrier')}</label>
              <select id="pk-c" value={pack.carrier} onChange={(e) => setPack({ ...pack, carrier: e.target.value, service: '' })}>
                <option value="">—</option>
                {carriers.rows.map((c) => <option key={c.code} value={c.code}>{c.name_ar}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="pk-s">{L('service')}</label>
              <select id="pk-s" value={pack.service} onChange={(e) => setPack({ ...pack, service: e.target.value })}>
                <option value="">—</option>
                {(carriers.rows.find((c) => c.code === pack.carrier)?.services ?? []).map((s) => <option key={s} value={s}>{L(`svc_${s}`, { defaultValue: s })}</option>)}
              </select>
            </div>
            <div className="field"><button type="button" className="btn ghost" onClick={quote}><i className="ri-price-tag-3-line" /> {L('getRates')}</button></div>
            <div className="field"><button type="button" className="btn primary" onClick={createShipment}><i className="ri-box-3-line" /> {L('packAndLabel', { n: picked.length })}</button></div>
          </div>
        )}
        {rates.length > 0 && (
          <div className="tbl-wrap" style={{ marginTop: 10 }}>
            <table className="tbl">
              <thead><tr><th>{L('carrier')}</th><th>{L('service')}</th><th>{L('price')}</th><th>{L('eta')}</th><th>{L('source')}</th></tr></thead>
              <tbody>
                {rates.map((r, i) => (
                  <tr key={i}><td>{r.carrier}</td><td>{r.service}</td><td className="strong">{m.money(r.amount)}</td><td>{r.etaDays.join('–')} {L('days')}</td><td><Pill tone={r.source === 'aggregator' ? 'ok' : 'warn'}>{L(`src_${r.source}`)}</Pill></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title={L('sitesTitle')} sub={L('sitesSub')}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>{L('warehouse')}</th><th>{L('location')}</th><th>{L('status')}</th><th /></tr></thead>
            <tbody>
              {whs.rows.map((w) => (
                <tr key={w.id}>
                  <td className="strong">{w.name_ar}<div className="s small muted" dir="ltr">{w.id}</div></td>
                  <td>{w.country.toUpperCase()} · {w.city}<div className="s small muted">{w.address}</div></td>
                  <td>{w.is_default && <Pill tone="info">{L('default')}</Pill>} <St value={w.active ? 'active' : 'inactive'} /></td>
                  <td><div className="row-actions">
                    {!w.is_default && w.active && <button type="button" className="btn ghost sm" onClick={() => updateWh(w, { is_default: true })}>{L('makeDefault')}</button>}
                    {!w.is_default && <button type="button" className="btn ghost sm" onClick={() => updateWh(w, { active: !w.active })}>{w.active ? L('deactivate') : L('activate')}</button>}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid c4" style={{ alignItems: 'end', marginTop: 12 }}>
          <div className="field"><label htmlFor="w-id">{L('code')}</label><input id="w-id" dir="ltr" placeholder="ruh-1" value={newWh.id} onChange={(e) => setNewWh({ ...newWh, id: e.target.value })} /></div>
          <div className="field"><label htmlFor="w-n">{L('name')}</label><input id="w-n" value={newWh.name_ar} onChange={(e) => setNewWh({ ...newWh, name_ar: e.target.value })} /></div>
          <div className="field"><label htmlFor="w-c">{L('city')}</label><input id="w-c" value={newWh.city} onChange={(e) => setNewWh({ ...newWh, city: e.target.value })} /></div>
          <div className="field"><label htmlFor="w-co">{L('country')}</label><input id="w-co" dir="ltr" maxLength={2} value={newWh.country} onChange={(e) => setNewWh({ ...newWh, country: e.target.value.toLowerCase() })} /></div>
          <div className="field" style={{ gridColumn: 'span 3' }}><label htmlFor="w-a">{L('address')}</label><input id="w-a" value={newWh.address} onChange={(e) => setNewWh({ ...newWh, address: e.target.value })} /></div>
          <div className="field"><button type="button" className="btn primary" disabled={!newWh.id || !newWh.name_ar || !newWh.city} onClick={addWarehouse}><i className="ri-add-line" /> {L('addWarehouse')}</button></div>
        </div>
      </Card>

      <Modal open={!!inspect} onClose={() => setInspect(null)} title={L('inspectTitle', { id: inspect?.id ?? '' })} sub={L('inspectSub')}>
        <div className="field">
          <label htmlFor="in-note">{L('inspectNote')}</label>
          <textarea id="in-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder={L('inspectPh')} />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn primary" onClick={async () => { if (inspect && await rpc('wh_inspect', { p_sub_order: inspect.id, p_passed: true, p_note: note || null }, L('passed'))) setInspect(null); }}>
            <i className="ri-check-line" /> {L('pass')}
          </button>
          <button type="button" className="btn ghost" onClick={async () => { if (inspect && await rpc('wh_inspect', { p_sub_order: inspect.id, p_passed: false, p_note: note }, L('failedMsg'))) setInspect(null); }}>
            <i className="ri-close-line" /> {L('fail')}
          </button>
        </div>
      </Modal>
      <Toast message={toast} />
    </>
  );
}

/* ═══════════════════════════ admin · logistics ═══════════════════════════ */

interface ShipmentRow {
  id: string; warehouse_id: string; carrier_code: string; service: string; kind: string; destination_country: string;
  tracking_no: string | null; label_url: string | null; provider_ref: string | null; cost: number | null; status: string; created_at: string;
  shipment_items: { sub_order_id: string }[];
  shipment_events: { status: string; description: string | null; location: string | null; occurred_at: string; source: string }[];
}

function AdminLogistics() {
  const L = useL();
  const m = useMoney();
  const { toast, flash } = useFlash();
  const [driver, setDriver] = useState<{ driver: string; live: boolean } | null>(null);
  const [filter, setFilter] = useState('active');
  const [open, setOpen] = useState<string | null>(null);
  const carriers = useRows<Carrier>(() => supabase.from('carriers').select('*').order('code'));
  const ships = useRows<ShipmentRow>(() => supabase.from('shipments')
    .select('*, shipment_items(sub_order_id), shipment_events(status, description, location, occurred_at, source)')
    .order('created_at', { ascending: false }).limit(300));

  useEffect(() => {
    invokeShipping({ action: 'status' }).then((r) => setDriver(r.error ? { driver: 'unreachable', live: false } : (r.data as { driver: string; live: boolean })));
  }, []);

  const rpc = async (fn: string, args: Record<string, unknown>, msg: string) => {
    const { error } = await supabase.rpc(fn, args);
    flash(error ? error.message : msg);
    if (!error) ships.reload();
  };
  const shown = ships.rows.filter((s) => (filter === 'active' ? !['delivered', 'cancelled', 'returned'].includes(s.status) : filter === 'all' || s.status === filter));
  const live = !!driver?.live;
  const trackUrl = (s: ShipmentRow) => {
    const tpl = carriers.rows.find((c) => c.code === s.carrier_code)?.tracking_url;
    return tpl && s.tracking_no ? tpl.replace('{tracking}', encodeURIComponent(s.tracking_no)) : null;
  };

  return (
    <>
      <PageHead eyebrow={L('eyebrow')} title={L('logTitle')} sub={L('logSub')} />
      <Card className="mb" title={L('integration')} action={<Pill tone={live ? 'ok' : 'warn'}>{live ? L('connected') : L('manualMode')}</Pill>}>
        <div className="grid c3">
          <div className="list-row"><div className="ic"><i className="ri-plug-line" /></div><div className="body"><div className="t">{L('driver')}</div><div className="s" dir="ltr">{driver?.driver ?? '…'}</div></div></div>
          <div className="list-row"><div className="ic"><i className="ri-price-tag-3-line" /></div><div className="body"><div className="t">{L('ratesFrom')}</div><div className="s">{live ? L('ratesLive') : L('ratesTariff')}</div></div></div>
          <div className="list-row"><div className="ic"><i className="ri-route-line" /></div><div className="body"><div className="t">{L('trackingFrom')}</div><div className="s">{live ? L('trackingLive') : L('trackingManual')}</div></div></div>
        </div>
        <div className="note" style={{ marginTop: 12 }}><i className="ri-information-line" /><span>{live ? L('afterNote') : L('beforeNote')}</span></div>
      </Card>

      <div className="seg compact mb" role="tablist" aria-label={L('status')}>
        {['active', 'label_created', 'in_transit', 'exception', 'delivered', 'all'].map((s) => (
          <button key={s} type="button" role="tab" aria-selected={filter === s} className={filter === s ? 'is-on' : ''} onClick={() => setFilter(s)}>
            {L(`f_${s}`)} ({s === 'all' ? ships.rows.length : s === 'active' ? ships.rows.filter((x) => !['delivered', 'cancelled', 'returned'].includes(x.status)).length : ships.rows.filter((x) => x.status === s).length})
          </button>
        ))}
      </div>
      <Err error={ships.error} />
      <Card className="mb" title={L('shipments')}>
        {!shown.length ? <Empty text={L('none')} /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>{L('tracking')}</th><th>{L('carrier')}</th><th>{L('route')}</th><th>{L('items')}</th><th>{L('status')}</th><th /></tr></thead>
              <tbody>
                {shown.map((s) => {
                  const url = trackUrl(s);
                  const events = [...s.shipment_events].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
                  return (
                    <tr key={s.id}>
                      <td className="strong" dir="ltr">
                        {s.tracking_no ? (url ? <a href={url} target="_blank" rel="noreferrer">{s.tracking_no}</a> : s.tracking_no) : '—'}
                        <div className="s small muted">{m.date(s.created_at)}{s.cost ? ` · ${m.money(s.cost)}` : ''}</div>
                      </td>
                      <td>{s.carrier_code}<div className="s small muted">{L(`svc_${s.service}`, { defaultValue: s.service })} · {L(`k_${s.kind}`)}</div></td>
                      <td>{s.warehouse_id} → {s.destination_country.toUpperCase()}</td>
                      <td>{s.shipment_items.length}</td>
                      <td>
                        <St value={s.status} />
                        {events[0] && <div className="s small muted">{events[0].description ?? ''} {events[0].location ? `· ${events[0].location}` : ''}</div>}
                      </td>
                      <td><div className="row-actions">
                        <button type="button" className="btn ghost sm" onClick={() => setOpen(s.id)}><i className="ri-route-line" /> {L('timeline')}</button>
                        {s.status === 'draft' && (
                          <>
                            <button type="button" className="btn primary sm" onClick={async () => {
                              const r = await invokeShipping({ action: 'label', shipment: s.id });
                              flash(r.error ? (r.manual ? L('manualLabel') : r.error) : L('labelCreated', { no: String(r.data?.trackingNo ?? '') }));
                              ships.reload();
                            }}>{L('bookLabel')}</button>
                            <button type="button" className="btn ghost sm" onClick={() => {
                              const no = window.prompt(L('trackingPrompt')) ?? '';
                              if (no) rpc('shipment_label', { p_shipment: s.id, p_tracking: no, p_label_url: null, p_provider_ref: null, p_cost: null }, L('saved'));
                            }}>{L('manualTracking')}</button>
                          </>
                        )}
                        {s.provider_ref && !['delivered', 'cancelled'].includes(s.status) && (
                          <button type="button" className="btn ghost sm" onClick={async () => {
                            const r = await invokeShipping({ action: 'track', shipment: s.id });
                            flash(r.error || L('synced', { n: Number(r.data?.added ?? 0) }));
                            ships.reload();
                          }}><i className="ri-refresh-line" /> {L('sync')}</button>
                        )}
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title={L('carriersTitle')} sub={L('carriersSub')}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>{L('carrier')}</th><th>{L('services')}</th><th>{L('mode')}</th><th>{L('status')}</th><th /></tr></thead>
            <tbody>
              {carriers.rows.map((c) => (
                <tr key={c.code}>
                  <td className="strong">{c.name_ar}<div className="s small muted" dir="ltr">{c.code}</div></td>
                  <td className="small">{c.services.map((x) => L(`svc_${x}`, { defaultValue: x })).join(' · ')}</td>
                  <td><Pill tone={c.mode === 'aggregator' ? 'ok' : 'mute'}>{L(`mode_${c.mode}`)}</Pill></td>
                  <td><St value={c.active ? 'active' : 'inactive'} /></td>
                  <td>
                    <button type="button" className="btn ghost sm" onClick={async () => {
                      const { error } = await supabase.from('carriers').update({ active: !c.active }).eq('code', c.code);
                      flash(error ? error.message : L('saved'));
                      carriers.reload();
                    }}>{c.active ? L('deactivate') : L('activate')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={!!open} onClose={() => setOpen(null)} title={L('timeline')} sub={ships.rows.find((s) => s.id === open)?.tracking_no ?? ''}>
        {(() => {
          const s = ships.rows.find((x) => x.id === open);
          if (!s) return null;
          const events = [...s.shipment_events].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
          return (
            <>
              <div className="tl">
                {events.map((e, i) => (
                  <div className="tl-item done" key={i}>
                    
                    <div><div className="t">{L(`s_${e.status}`, { defaultValue: e.status })} {e.location ? `· ${e.location}` : ''}</div>
                      <div className="s">{e.description ?? ''} · {new Date(e.occurred_at).toLocaleString(m.locale)} · {L(`src_${e.source}`)}</div></div>
                  </div>
                ))}
              </div>
              {!['draft', 'delivered', 'cancelled'].includes(s.status) && (
                <div className="modal-actions" style={{ flexWrap: 'wrap' }}>
                  <span className="small muted" style={{ width: '100%' }}>{live ? L('manualOverrideLive') : L('manualOverride')}</span>
                  {['in_transit', 'out_for_delivery', 'delivered', 'exception'].map((st) => (
                    <button key={st} type="button" className="btn ghost sm" onClick={() => {
                      const desc = window.prompt(L('eventPrompt')) ?? '';
                      rpc('record_shipment_event', { p_shipment: s.id, p_status: st, p_description: desc || null }, L('saved'));
                    }}>{L(`s_${st}`)}</button>
                  ))}
                </div>
              )}
            </>
          );
        })()}
      </Modal>
      <Toast message={toast} />
    </>
  );
}

/* ═══════════════════════════ admin · compliance (KYB) ═══════════════════════════ */

interface DocType { code: string; name_ar: string; name_en: string; description: string | null; required: boolean; needs_expiry: boolean; active: boolean; sort_order: number }
interface DocRow { id: number; factory_id: string; type_code: string; storage_path: string; file_name: string; expires_on: string | null; status: string; note: string | null; uploaded_at: string }

async function openSigned(path: string) {
  const { data, error } = await supabase.storage.from('kyb').createSignedUrl(path, 300);
  if (!error && data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener');
  return error?.message ?? '';
}

function AdminCompliance() {
  const L = useL();
  const m = useMoney();
  const { toast, flash } = useFlash();
  const types = useRows<DocType>(() => supabase.from('document_types').select('*').order('sort_order'));
  const docs = useRows<DocRow>(() => supabase.from('factory_documents').select('*').order('uploaded_at', { ascending: false }).limit(500));
  const factories = useRows<{ id: string; name_ar: string; kyb_status: string; missing: string[]; pending_docs: number; next_expiry: string | null }>(
    () => supabase.from('admin_factory_kyb').select('*').order('name_ar'));
  const [tab, setTab] = useState<'queue' | 'factories' | 'types'>('queue');
  const [newType, setNewType] = useState({ code: '', name_ar: '', name_en: '', required: false, needs_expiry: true });

  const typeName = (code: string) => types.rows.find((x) => x.code === code)?.name_ar ?? code;
  const review = async (d: DocRow, decision: string) => {
    const note = decision === 'rejected' ? window.prompt(L('rejectReason')) ?? '' : null;
    if (decision === 'rejected' && !note) return;
    const { data, error } = await supabase.rpc('admin_review_document', { p_id: d.id, p_decision: decision, p_note: note });
    flash(error ? error.message : L('kybNow', { state: L(`s_${String(data)}`) }));
    if (!error) { docs.reload(); factories.reload(); }
  };
  const saveType = async (t: DocType, patch: Partial<DocType>) => {
    const { error } = await supabase.from('document_types').update(patch).eq('code', t.code);
    flash(error ? error.message : L('saved'));
    if (!error) { types.reload(); factories.reload(); }
  };
  const addType = async () => {
    const code = newType.code.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const { error } = await supabase.from('document_types').insert({ ...newType, code, sort_order: types.rows.length + 1 });
    flash(error ? error.message : L('typeAdded'));
    if (!error) { setNewType({ code: '', name_ar: '', name_en: '', required: false, needs_expiry: true }); types.reload(); }
  };

  const pending = docs.rows.filter((d) => d.status === 'pending');
  const expSoon = docs.rows.filter((d) => d.status === 'approved' && d.expires_on && new Date(d.expires_on).getTime() < Date.now() + 30 * 86400000);
  return (
    <>
      <PageHead eyebrow={L('eyebrow')} title={L('kybTitle')} sub={L('kybSub')} />
      <div className="grid c3 mb">
        <Stat icon="ri-file-search-line" num={String(pending.length)} lbl={L('pendingDocs')} />
        <Stat icon="ri-error-warning-line" num={String(factories.rows.filter((f) => f.kyb_status !== 'verified').length)} lbl={L('unverifiedFactories')} />
        <Stat icon="ri-calendar-close-line" num={String(expSoon.length)} lbl={L('expiringSoon')} />
      </div>
      <div className="seg compact mb" role="tablist" aria-label={L('kybTitle')}>
        {(['queue', 'factories', 'types'] as const).map((k) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'is-on' : ''} onClick={() => setTab(k)}>{L(`tab_${k}`)}</button>
        ))}
      </div>
      <Err error={docs.error || types.error} />

      {tab === 'queue' && (
        <Card>
          {!docs.rows.length ? <Empty text={L('none')} /> : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>{L('factory')}</th><th>{L('document')}</th><th>{L('expires')}</th><th>{L('status')}</th><th /></tr></thead>
                <tbody>
                  {[...pending, ...docs.rows.filter((d) => d.status !== 'pending')].map((d) => (
                    <tr key={d.id}>
                      <td className="strong">{factories.rows.find((f) => f.id === d.factory_id)?.name_ar ?? d.factory_id}<div className="s small muted">{m.date(d.uploaded_at)}</div></td>
                      <td>{typeName(d.type_code)}<div className="s small muted" dir="ltr">{d.file_name}</div></td>
                      <td>{d.expires_on ? m.date(d.expires_on) : '—'}</td>
                      <td><St value={d.status} />{d.note && <div className="s small muted">{d.note}</div>}</td>
                      <td><div className="row-actions">
                        <button type="button" className="btn ghost sm" onClick={async () => { const e = await openSigned(d.storage_path); if (e) flash(e); }}><i className="ri-eye-line" /> {L('view')}</button>
                        {d.status === 'pending' && (
                          <>
                            <button type="button" className="btn primary sm" onClick={() => review(d, 'approved')}>{L('approve')}</button>
                            <button type="button" className="btn ghost sm" onClick={() => review(d, 'rejected')}>{L('reject')}</button>
                          </>
                        )}
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === 'factories' && (
        <Card>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>{L('factory')}</th><th>{L('status')}</th><th>{L('missingDocs')}</th><th>{L('pendingDocs')}</th><th>{L('nextExpiry')}</th></tr></thead>
              <tbody>
                {factories.rows.map((f) => (
                  <tr key={f.id}>
                    <td className="strong">{f.name_ar}</td>
                    <td><St value={f.kyb_status} />{f.kyb_status === 'verified' && f.missing.length > 0 && <div className="s small muted">{L('inGrace')}</div>}</td>
                    <td className="small">{f.missing.map(typeName).join(' · ') || '—'}</td>
                    <td>{f.pending_docs}</td>
                    <td>{f.next_expiry ? m.date(f.next_expiry) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="note" style={{ marginTop: 12 }}><i className="ri-information-line" /><span>{L('recomputeNote')}</span></div>
        </Card>
      )}

      {tab === 'types' && (
        <Card title={L('typesTitle')} sub={L('typesSub')}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>{L('document')}</th><th>{L('required')}</th><th>{L('needsExpiry')}</th><th>{L('status')}</th></tr></thead>
              <tbody>
                {types.rows.map((t) => (
                  <tr key={t.code}>
                    <td className="strong">{t.name_ar}<div className="s small muted">{t.name_en} · <span dir="ltr">{t.code}</span></div></td>
                    <td><label className="switch"><input type="checkbox" checked={t.required} onChange={(e) => saveType(t, { required: e.target.checked })} /><span className="track" /></label></td>
                    <td><label className="switch"><input type="checkbox" checked={t.needs_expiry} onChange={(e) => saveType(t, { needs_expiry: e.target.checked })} /><span className="track" /></label></td>
                    <td><button type="button" className="btn ghost sm" onClick={() => saveType(t, { active: !t.active })}>{t.active ? L('deactivate') : L('activate')}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid c4" style={{ alignItems: 'end', marginTop: 12 }}>
            <div className="field"><label htmlFor="dt-c">{L('code')}</label><input id="dt-c" dir="ltr" placeholder="gmp" value={newType.code} onChange={(e) => setNewType({ ...newType, code: e.target.value })} /></div>
            <div className="field"><label htmlFor="dt-a">{L('nameAr')}</label><input id="dt-a" value={newType.name_ar} onChange={(e) => setNewType({ ...newType, name_ar: e.target.value })} /></div>
            <div className="field"><label htmlFor="dt-e">{L('nameEn')}</label><input id="dt-e" dir="ltr" value={newType.name_en} onChange={(e) => setNewType({ ...newType, name_en: e.target.value })} /></div>
            <div className="field" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <label className="switch"><input type="checkbox" checked={newType.required} onChange={(e) => setNewType({ ...newType, required: e.target.checked })} /><span className="track" /><span className="small">{L('required')}</span></label>
            </div>
          </div>
          <button type="button" className="btn primary" disabled={!newType.code || !newType.name_ar || !newType.name_en} onClick={addType}><i className="ri-add-line" /> {L('addType')}</button>
          <div className="note" style={{ marginTop: 12 }}><i className="ri-information-line" /><span>{L('typesNote')}</span></div>
        </Card>
      )}
      <Toast message={toast} />
    </>
  );
}

/* ═══════════════════════════ admin · group orders ═══════════════════════════ */

interface GroupRow { id: string; code: string; country: string; city: string | null; participants: number; min_participants: number; closes_at: string; status: string; decision: string | null; organiser: string | null; paid_orders: number; paid_total: number; messages: number }

function AdminGroups() {
  const L = useL();
  const m = useMoney();
  const { toast, flash } = useFlash();
  const { rows, error, reload } = useRows<GroupRow>(() => supabase.from('admin_groups').select('*').order('closes_at'));
  const [filter, setFilter] = useState('awaiting_decision');
  const [act, setAct] = useState<{ g: GroupRow; mode: 'message' | 'decide' } | null>(null);
  const [form, setForm] = useState({ action: 'extend', days: 5, title: '', body: '' });

  const templates = (g: GroupRow, action: string, days: number) => ({
    message: { title: L('tplMsgTitle', { code: g.code }), body: L('tplMsgBody', { n: g.participants, min: g.min_participants }) },
    extend: { title: L('tplExtendTitle', { code: g.code }), body: L('tplExtendBody', { days }) },
    ship_anyway: { title: L('tplShipTitle', { code: g.code }), body: L('tplShipBody') },
    cancel: { title: L('tplCancelTitle', { code: g.code }), body: L('tplCancelBody') },
  }[action] ?? { title: '', body: '' });

  const openAct = (g: GroupRow, mode: 'message' | 'decide') => {
    const t = templates(g, mode === 'message' ? 'message' : 'extend', 5);
    setForm({ action: 'extend', days: 5, title: t.title, body: t.body });
    setAct({ g, mode });
  };

  const submit = async () => {
    if (!act) return;
    const { data, error: e } = act.mode === 'message'
      ? await supabase.rpc('admin_group_message', { p_group: act.g.id, p_title: form.title, p_body: form.body })
      : await supabase.rpc('admin_resolve_group', { p_group: act.g.id, p_action: form.action, p_days: form.action === 'extend' ? form.days : null, p_title: form.title, p_body: form.body });
    flash(e ? e.message : L('sentTo', { n: Number(data) }));
    if (!e) { setAct(null); reload(); }
  };

  const shown = rows.filter((g) => filter === 'all' || g.status === filter);
  return (
    <>
      <PageHead eyebrow={L('eyebrow')} title={L('groupsTitle')} sub={L('groupsSub')} />
      <div className="grid c3 mb">
        <Stat icon="ri-alarm-warning-line" num={String(rows.filter((g) => g.status === 'awaiting_decision').length)} lbl={L('s_awaiting_decision')} />
        <Stat icon="ri-group-line" num={String(rows.filter((g) => g.status === 'open').length)} lbl={L('s_open')} />
        <Stat icon="ri-box-3-line" num={String(rows.filter((g) => g.status === 'ready').length)} lbl={L('s_ready')} />
      </div>
      <div className="seg compact mb" role="tablist" aria-label={L('status')}>
        {['awaiting_decision', 'open', 'ready', 'cancelled', 'all'].map((s) => (
          <button key={s} type="button" role="tab" aria-selected={filter === s} className={filter === s ? 'is-on' : ''} onClick={() => setFilter(s)}>{L(s === 'all' ? 'f_all' : `s_${s}`)}</button>
        ))}
      </div>
      <Err error={error} />
      <Card>
        {!shown.length ? <Empty text={L('none')} /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>{L('code')}</th><th>{L('destination')}</th><th>{L('participantsCol')}</th><th>{L('deadline')}</th><th>{L('paid')}</th><th>{L('status')}</th><th /></tr></thead>
              <tbody>
                {shown.map((g) => (
                  <tr key={g.id}>
                    <td className="strong" dir="ltr">{g.code}<div className="s small muted">{g.organiser ?? ''}</div></td>
                    <td>{g.country.toUpperCase()} {g.city ?? ''}</td>
                    <td className={g.participants < g.min_participants ? 'strong' : ''}>{g.participants} / {g.min_participants}</td>
                    <td>{m.date(g.closes_at)}</td>
                    <td>{g.paid_orders} · {m.money(g.paid_total)}</td>
                    <td><St value={g.status} />{g.decision && <div className="s small muted">{L(`d_${g.decision}`)}</div>}<div className="s small muted">{L('messagesSent', { n: g.messages })}</div></td>
                    <td><div className="row-actions">
                      <button type="button" className="btn ghost sm" onClick={() => openAct(g, 'message')}><i className="ri-mail-send-line" /> {L('message')}</button>
                      {['open', 'awaiting_decision'].includes(g.status) && <button type="button" className="btn primary sm" onClick={() => openAct(g, 'decide')}>{L('decide')}</button>}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="note" style={{ marginTop: 12 }}><i className="ri-information-line" /><span>{L('groupsNote')}</span></div>
      </Card>

      <Modal open={!!act} onClose={() => setAct(null)} title={act?.mode === 'message' ? L('messageTitle', { code: act?.g.code ?? '' }) : L('decideTitle', { code: act?.g.code ?? '' })} sub={act?.mode === 'message' ? L('messageSub') : L('decideSub')}>
        {act?.mode === 'decide' && (
          <div className="grid c2">
            <div className="field">
              <label htmlFor="gd-a">{L('action')}</label>
              <select id="gd-a" value={form.action} onChange={(e) => { const tp = templates(act.g, e.target.value, form.days); setForm({ ...form, action: e.target.value, title: tp.title, body: tp.body }); }}>
                <option value="extend">{L('d_extend')}</option>
                <option value="ship_anyway">{L('d_ship_anyway')}</option>
                <option value="cancel">{L('d_cancel')}</option>
              </select>
            </div>
            {form.action === 'extend' && (
              <div className="field"><label htmlFor="gd-d">{L('days')}</label><input id="gd-d" type="number" min={1} max={30} dir="ltr" value={form.days} onChange={(e) => setForm({ ...form, days: Number(e.target.value) })} /></div>
            )}
          </div>
        )}
        <div className="field"><label htmlFor="gd-t">{L('msgTitle')}</label><input id="gd-t" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div className="field"><label htmlFor="gd-b">{L('msgBody')}</label><textarea id="gd-b" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
        {act?.mode === 'decide' && form.action === 'cancel' && <div className="note"><i className="ri-error-warning-line" /><span>{L('cancelWarn')}</span></div>}
        <div className="modal-actions">
          <button type="button" className="btn primary" disabled={!form.title || !form.body} onClick={submit}><i className="ri-send-plane-line" /> {act?.mode === 'message' ? L('send') : L('applyAndSend')}</button>
        </div>
      </Modal>
      <Toast message={toast} />
    </>
  );
}

/* ═══════════════════════════ factory ═══════════════════════════ */

function useMyFactory() {
  return useRows<{ id: string; name_ar: string; kyb_status: string; default_warehouse_id: string | null }>(async () => {
    const { data: s } = await supabase.auth.getSession();
    return supabase.from('factories').select('id, name_ar, kyb_status, default_warehouse_id').eq('owner_id', s.session?.user.id ?? '');
  });
}

function FactoryJoin() {
  const L = useL();
  const m = useMoney();
  const { toast, flash } = useFlash();
  const fac = useMyFactory();
  const f = fac.rows[0];
  const types = useRows<DocType>(() => supabase.from('document_types').select('*').eq('active', true).order('sort_order'));
  const docs = useRows<DocRow>(() => (f ? supabase.from('factory_documents').select('*').eq('factory_id', f.id).order('uploaded_at', { ascending: false }) : Promise.resolve({ data: [], error: null })), [f?.id]);
  const [expiry, setExpiry] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState('');

  const upload = async (t: DocType, file: File | undefined) => {
    if (!f || !file) return;
    if (file.size > 10 * 1024 * 1024) { flash(L('tooLarge')); return; }
    if (t.needs_expiry && !expiry[t.code]) { flash(L('expiryRequired')); return; }
    setBusy(t.code);
    const ext = (file.name.split('.').pop() ?? 'pdf').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${f.id}/${t.code}-${Date.now()}.${ext}`;
    const up = await supabase.storage.from('kyb').upload(path, file, { contentType: file.type, upsert: false });
    if (up.error) { setBusy(''); flash(up.error.message); return; }
    const { data: s } = await supabase.auth.getSession();
    const { error } = await supabase.from('factory_documents').insert({
      factory_id: f.id, type_code: t.code, storage_path: path, file_name: file.name.slice(0, 120),
      expires_on: t.needs_expiry ? expiry[t.code] : null, uploaded_by: s.session?.user.id,
    });
    setBusy('');
    flash(error ? error.message : L('uploaded'));
    if (!error) docs.reload();
  };

  const latest = (code: string) => docs.rows.find((d) => d.type_code === code);
  return (
    <>
      <PageHead eyebrow={L('eyebrowFactory')} title={L('joinTitle')} sub={L('joinSub')} />
      {!f && !fac.loading && <div className="note mb"><i className="ri-information-line" /><span>{L('noFactory')}</span></div>}
      {f && (
        <Card className="mb" title={f.name_ar} action={<St value={f.kyb_status} />}>
          <div className="small muted">{f.kyb_status === 'verified' ? L('verifiedNote') : L('pendingNote')}</div>
        </Card>
      )}
      <Card>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>{L('document')}</th><th>{L('lastUpload')}</th><th>{L('status')}</th><th>{L('upload')}</th></tr></thead>
            <tbody>
              {types.rows.map((t) => {
                const d = latest(t.code);
                return (
                  <tr key={t.code}>
                    <td className="strong">{t.name_ar} {t.required ? <Pill tone="warn">{L('required')}</Pill> : <Pill tone="mute">{L('optional')}</Pill>}<div className="s small muted">{t.description ?? ''}</div></td>
                    <td className="small">{d ? <>{d.file_name}<div className="muted">{m.date(d.uploaded_at)}{d.expires_on ? ` · ${L('expires')} ${m.date(d.expires_on)}` : ''}</div></> : '—'}</td>
                    <td>{d ? <St value={d.status} /> : <Pill tone="mute">{L('notUploaded')}</Pill>}{d?.note && <div className="s small muted">{d.note}</div>}</td>
                    <td>
                      <div style={{ display: 'grid', gap: 6 }}>
                        {t.needs_expiry && (
                          <label className="small muted" style={{ display: 'grid', gap: 2 }}>
                            {L('expiryDate')}
                            <input type="date" dir="ltr" value={expiry[t.code] ?? ''} onChange={(e) => setExpiry({ ...expiry, [t.code]: e.target.value })} />
                          </label>
                        )}
                        <label className="btn ghost sm" style={{ cursor: f ? 'pointer' : 'not-allowed' }}>
                          <i className={busy === t.code ? 'ri-loader-4-line' : 'ri-upload-2-line'} /> {d ? L('replace') : L('upload')}
                          <input type="file" accept="application/pdf,image/jpeg,image/png" hidden disabled={!f || !!busy} onChange={(e) => upload(t, e.target.files?.[0])} />
                        </label>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="note" style={{ marginTop: 12 }}><i className="ri-lock-line" /><span>{L('privateNote')}</span></div>
      </Card>
      <Toast message={toast} />
    </>
  );
}

interface FSub { id: string; order_id: string; goods: number; status: string; warehouse_id: string | null; handover_at: string | null; handover_ref: string | null; received_at: string | null; inspection: string; inspection_note: string | null; tracking_no: string | null; delivered_at: string | null }

function FactoryShipping() {
  const L = useL();
  const m = useMoney();
  const { toast, flash } = useFlash();
  const subs = useRows<FSub>(() => supabase.from('sub_orders')
    .select('id, order_id, goods, status, warehouse_id, handover_at, handover_ref, received_at, inspection, inspection_note, tracking_no, delivered_at')
    .in('status', ['paid', 'dispatched', 'delivered']).order('id', { ascending: false }).limit(300));
  const whs = useRows<Wh>(() => supabase.from('warehouses').select('*'));
  const wh = (id: string | null) => whs.rows.find((w) => w.id === id);
  const step = (s: FSub) => (s.delivered_at ? 'delivered' : s.status === 'dispatched' ? 'dispatched'
    : s.inspection === 'failed' ? 'failed' : s.inspection === 'passed' ? 'passed' : s.received_at ? 'received' : s.handover_at ? 'handed' : 'prepare');
  const handover = async (s: FSub) => {
    const ref = window.prompt(L('handoverPrompt')) ?? '';
    if (!ref) return;
    const { error } = await supabase.rpc('factory_handover', { p_sub_order: s.id, p_reference: ref });
    flash(error ? error.message : L('handedOver'));
    if (!error) subs.reload();
  };
  return (
    <>
      <PageHead eyebrow={L('eyebrowFactory')} title={L('fShipTitle')} sub={L('fShipSub')} />
      <Err error={subs.error} />
      <Card>
        {!subs.rows.length ? <Empty text={L('none')} /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>{L('order')}</th><th>{L('deliverTo')}</th><th>{L('stage')}</th><th /></tr></thead>
              <tbody>
                {subs.rows.map((s) => {
                  const w = wh(s.warehouse_id);
                  const st = step(s);
                  return (
                    <tr key={s.id}>
                      <td className="strong" dir="ltr">{s.id}<div className="s small muted">{m.money(s.goods)}</div></td>
                      <td>{w ? <>{w.name_ar}<div className="s small muted">{w.city} · {w.address}{w.contact_phone ? ` · ${w.contact_phone}` : ''}</div></> : '—'}</td>
                      <td><St value={st} />{s.inspection_note && <div className="s small muted">{s.inspection_note}</div>}{s.tracking_no && <div className="s small muted" dir="ltr">{s.tracking_no}</div>}</td>
                      <td>{st === 'prepare' && <button type="button" className="btn primary sm" onClick={() => handover(s)}><i className="ri-truck-line" /> {L('handover')}</button>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="note" style={{ marginTop: 12 }}><i className="ri-information-line" /><span>{L('fShipNote')}</span></div>
      </Card>
      <Toast message={toast} />
    </>
  );
}

/* ═══════════════════════════ buyer · tracking & messages ═══════════════════════════ */

interface Notif { id: number; kind: string; title: string; body: string; link: string | null; read_at: string | null; created_at: string; audience: string }

function BuyerMessages() {
  const L = useL();
  const m = useMoney();
  const { rows, reload } = useRows<Notif>(() => supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(200));
  const unread = rows.filter((n) => !n.read_at).map((n) => n.id);
  return (
    <>
      <PageHead eyebrow={L('eyebrowBuyer')} title={L('msgsTitle')} sub={L('msgsSub')} actions={unread.length ? (
        <button type="button" className="btn ghost sm" onClick={async () => { await supabase.rpc('mark_notifications_read', { p_ids: unread }); reload(); }}>{L('markAllRead')}</button>
      ) : undefined} />
      <Card>
        {!rows.length ? <Empty text={L('noMessages')} /> : (
          <div className="list">
            {rows.map((n) => (
              <div className="list-row" key={n.id} style={{ opacity: n.read_at ? 0.7 : 1 }}>
                <div className="ic"><i className={n.kind.startsWith('group') ? 'ri-group-line' : n.kind.startsWith('order') ? 'ri-truck-line' : 'ri-notification-3-line'} /></div>
                <div className="body">
                  <div className="t">{n.title} {!n.read_at && <Pill tone="info">{L('new')}</Pill>}</div>
                  <div className="s">{n.body}</div>
                  <div className="s small muted">{new Date(n.created_at).toLocaleString(m.locale)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

/** Tracking timeline for one order, shown from the buyer's orders screen. */
export function OrderTracking({ orderId }: { orderId: string }) {
  const L = useL();
  const m = useMoney();
  const subs = useRows<{ id: string; shipment_id: string | null }>(() => supabase.from('sub_orders').select('id, shipment_id').eq('order_id', orderId), [orderId]);
  const ids = [...new Set(subs.rows.map((s) => s.shipment_id).filter(Boolean))] as string[];
  const ships = useRows<ShipmentRow>(
    () => (ids.length ? supabase.from('shipments').select('*, shipment_items(sub_order_id), shipment_events(status, description, location, occurred_at, source)').in('id', ids) : Promise.resolve({ data: [], error: null })),
    [ids.join(',')],
  );
  const carriers = useRows<Carrier>(() => supabase.from('carriers').select('*'));
  if (!ids.length) return <div className="small muted">{L('notShippedYet')}</div>;
  return (
    <>
      {ships.rows.map((s) => {
        const tpl = carriers.rows.find((c) => c.code === s.carrier_code)?.tracking_url;
        const url = tpl && s.tracking_no ? tpl.replace('{tracking}', encodeURIComponent(s.tracking_no)) : null;
        return (
          <div key={s.id} style={{ marginBottom: 12 }}>
            <div className="strong">{s.carrier_code} · {url ? <a href={url} target="_blank" rel="noreferrer" dir="ltr">{s.tracking_no}</a> : <span dir="ltr">{s.tracking_no ?? '—'}</span>} <St value={s.status} /></div>
            <div className="tl">
              {[...s.shipment_events].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at)).map((e, i) => (
                <div className="tl-item done" key={i}>
                  
                  <div><div className="t">{L(`s_${e.status}`, { defaultValue: e.status })}{e.location ? ` · ${e.location}` : ''}</div><div className="s">{e.description ?? ''} · {new Date(e.occurred_at).toLocaleString(m.locale)}</div></div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

export const liveLogisticsViews: Record<string, Record<string, FunctionComponent>> = {
  admin: { 'admin-warehouses': AdminWarehouses, 'admin-logistics': AdminLogistics, 'admin-compliance': AdminCompliance, 'admin-groups': AdminGroups },
  factory: { 'f-join': FactoryJoin, 'f-shipping': FactoryShipping },
  buyer: { messages: BuyerMessages },
};
