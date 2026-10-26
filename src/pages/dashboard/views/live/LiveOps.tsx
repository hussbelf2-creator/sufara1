import { useMemo, useState, type FunctionComponent } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { Card, PageHead, Pill, Stat, Toast } from '@/pages/dashboard/components/ui';
import { QrCode } from '@/pages/dashboard/components/QrCode';
import { absoluteUrl } from '@/lib/supabase';
import { PrivacyCard } from './LiveTrust';
import { useMoney, useRows } from './useLive';

/* Operational screens that close the loop between the four dashboards:
   what the factory publishes, the admin approves; what the ambassador
   shares, the buyer buys; what the carrier delivers, the engine settles;
   and what is settled, the admin pays out. */

const tone = (s: string) => (['paid', 'delivered', 'closed', 'verified', 'active', 'approved', 'received', 'sent', 'eligible'].includes(s)
  ? 'ok'
  : ['refunded', 'cancelled', 'rejected', 'suspended', 'void'].includes(s) ? 'danger' : 'warn');

function useL() {
  const { t } = useTranslation();
  return (key: string, opts?: Record<string, unknown>) => t(`platform.live.${key}`, opts);
}

function Status({ value }: { value: string }) {
  const L = useL();
  return <Pill tone={tone(value)}>{L(`st_${value}`, { defaultValue: value })}</Pill>;
}

function Empty({ text }: { text: string }) {
  return <div className="empty"><i className="ri-inbox-2-line" />{text}</div>;
}

function useFlash() {
  const [toast, setToast] = useState('');
  return {
    toast,
    flash: (m: string) => {
      setToast(m);
      window.setTimeout(() => setToast(''), 3200);
    },
  };
}

function ErrorNote({ error }: { error: string }) {
  if (!error) return null;
  return <div className="note mb"><i className="ri-error-warning-line" /><span>{error}</span></div>;
}

/* ═════════════════════════════ admin ═════════════════════════════ */

interface SubJson { id: string; factory_id: string; goods: number; status: string; tracking_no: string | null; delivered_at: string | null; settled: boolean; returned: boolean }
interface AdminOrder {
  id: string; created_at: string; paid_at: string | null; status: string; channel: string; country: string; ship_method: string | null;
  goods: number; discount: number; shipping: number; total: number; invoice_no: string | null; buyer_name: string; ambassador: string | null; subs: SubJson[] | null;
}
interface DealAdmin {
  id: string; total: number; order_id: string | null; paid_at: string | null; created_at: string;
  quote: { factory_id: string } | null;
  deal_installments: { seq: number; due_on: string; amount: number; status: string }[];
}

function AdminOrders() {
  const L = useL();
  const m = useMoney();
  const { toast, flash } = useFlash();
  const [filter, setFilter] = useState('all');
  const orders = useRows<AdminOrder>(() => supabase.from('admin_orders').select('*').order('created_at', { ascending: false }).limit(300));
  const deals = useRows<DealAdmin>(() => supabase.from('deals')
    .select('id, total, order_id, paid_at, created_at, quote:quotes(factory_id), deal_installments(seq, due_on, amount, status)')
    .order('created_at', { ascending: false }).limit(100));

  const run = async (fn: string, args: Record<string, unknown>, ok: string) => {
    const { error } = await supabase.rpc(fn, args);
    flash(error ? error.message : ok);
    if (!error) {
      orders.reload();
      deals.reload();
    }
  };

  const shown = orders.rows.filter((o) => filter === 'all' || o.status === filter);
  const dealOrders = new Set(deals.rows.map((d) => d.order_id).filter(Boolean) as string[]);
  const count = (s: string) => orders.rows.filter((o) => o.status === s).length;

  return (
    <>
      <PageHead eyebrow={L('liveEyebrow')} title={L('aOrdersTitle')} sub={L('aOrdersSub')} />
      <div className="grid c4 mb">
        <Stat icon="ri-time-line" num={String(count('pending_payment'))} lbl={L('st_pending_payment')} />
        <Stat icon="ri-bank-card-line" num={String(count('paid'))} lbl={L('st_paid')} />
        <Stat icon="ri-truck-line" num={String(count('dispatched'))} lbl={L('st_dispatched')} />
        <Stat icon="ri-home-smile-line" num={String(count('delivered'))} lbl={L('st_delivered')} />
      </div>
      <div className="seg compact mb" role="tablist" aria-label={L('status')}>
        {['all', 'pending_payment', 'paid', 'dispatched', 'delivered', 'refunded'].map((s) => (
          <button key={s} type="button" role="tab" aria-selected={filter === s} className={filter === s ? 'is-on' : ''} onClick={() => setFilter(s)}>
            {s === 'all' ? L('all') : L(`st_${s}`)}
          </button>
        ))}
      </div>
      <ErrorNote error={orders.error} />
      <Card className="mb" title={L('aOrdersList')} sub={L('aOrdersListSub')}>
        {!orders.loading && !shown.length ? <Empty text={L('ordersEmpty')} /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>{L('order')}</th><th>{L('buyer')}</th><th>{L('total')}</th><th>{L('subOrders')}</th><th>{L('status')}</th><th /></tr></thead>
              <tbody>
                {shown.map((o) => (
                  <tr key={o.id}>
                    <td className="strong" dir="ltr">{o.id}<div className="s small muted">{m.date(o.created_at)} · {L(`ch_${o.channel}`)}{o.ambassador ? ` · ${o.ambassador}` : ''}</div></td>
                    <td>{o.buyer_name || '—'}<div className="s small muted">{o.country.toUpperCase()}</div></td>
                    <td className="strong">{m.money(o.total)}<div className="s small muted">{o.invoice_no ?? L('proforma')}</div></td>
                    <td>
                      {(o.subs ?? []).map((s) => (
                        <div key={s.id} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                          <span className="small" dir="ltr">{s.factory_id} · {m.num(s.goods)}</span>
                          <Status value={s.settled ? 'closed' : s.returned ? 'refunded' : s.status} />
                          {o.paid_at && !s.settled && !s.returned && s.status === 'paid' && (
                            <button type="button" className="btn ghost sm" onClick={() => {
                              const tracking = window.prompt(L('trackingPrompt')) ?? '';
                              if (tracking) run('record_shipment', { p_sub_order: s.id, p_status: 'dispatched', p_tracking: tracking }, L('updated'));
                            }}>{L('markDispatched')}</button>
                          )}
                          {o.paid_at && !s.delivered_at && s.status === 'dispatched' && (
                            <button type="button" className="btn ghost sm" onClick={() => run('record_shipment', { p_sub_order: s.id, p_status: 'delivered' }, L('updated'))}>{L('markDelivered')}</button>
                          )}
                        </div>
                      ))}
                    </td>
                    <td><Status value={o.status} /></td>
                    <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {o.status === 'pending_payment' && !dealOrders.has(o.id) && (
                        <button type="button" className="btn primary sm" onClick={() => {
                          const ref = window.prompt(L('transferRef')) ?? '';
                          if (ref) run('admin_confirm_transfer', { p_order_id: o.id, p_reference: ref }, L('transferConfirmed'));
                        }}>{L('confirmTransfer')}</button>
                      )}
                      {['paid', 'dispatched'].includes(o.status) && !(o.subs ?? []).some((s) => s.settled) && (
                        <button type="button" className="btn ghost sm" onClick={() => {
                          if (window.confirm(L('refundConfirm', { id: o.id }))) run('refund_order', { p_order_id: o.id }, L('refunded'));
                        }}>{L('refund')}</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="note" style={{ marginTop: 12 }}><i className="ri-information-line" /><span>{L('carrierNote')}</span></div>
      </Card>

      <Card title={L('aDealsTitle')} sub={L('aDealsSub')}>
        {!deals.rows.length ? <Empty text={L('dealsEmpty')} /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>{L('deal')}</th><th>{L('factory')}</th><th>{L('total')}</th><th>{L('instalments')}</th><th>{L('status')}</th></tr></thead>
              <tbody>
                {deals.rows.map((d) => (
                  <tr key={d.id}>
                    <td className="small" dir="ltr">{d.order_id ?? d.id.slice(0, 8)}<div className="s muted">{m.date(d.created_at)}</div></td>
                    <td>{d.quote?.factory_id ?? '—'}</td>
                    <td className="strong">{m.money(d.total)}</td>
                    <td>
                      {[...d.deal_installments].sort((a, b) => a.seq - b.seq).map((i) => (
                        <div key={i.seq} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                          <span className="small">#{i.seq} · {m.money(i.amount)} · {m.date(i.due_on)}</span>
                          {i.status === 'paid' ? <Status value="paid" /> : (
                            <button type="button" className="btn ghost sm" onClick={() => {
                              const ref = window.prompt(L('transferRef')) ?? '';
                              if (ref) run('admin_record_instalment', { p_deal: d.id, p_seq: i.seq, p_ref: ref }, L('updated'));
                            }}>{L('recordPayment')}</button>
                          )}
                        </div>
                      ))}
                    </td>
                    <td><Status value={d.paid_at ? 'paid' : 'pending_payment'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Toast message={toast} />
    </>
  );
}

interface ProductAdmin { id: string; factory_id: string; category_id: string; name_ar: string; name_en: string; price: number; stock: number; moq: number | null; active: boolean; image_url: string | null; images: string[] | null }

function AdminProducts() {
  const L = useL();
  const m = useMoney();
  const { toast, flash } = useFlash();
  const [tab, setTab] = useState<'review' | 'live'>('review');
  const { rows, error, reload } = useRows<ProductAdmin>(() => supabase.from('products')
    .select('id, factory_id, category_id, name_ar, name_en, price, stock, moq, active, image_url, images').order('created_at', { ascending: false }));
  const weights = useRows<{ id: string; weight_kg: number; category_median: number | null; outlier: boolean; weight_checked_at: string | null }>(
    () => supabase.from('admin_product_weights').select('*'));
  const [wEdit, setWEdit] = useState<Record<string, string>>({});
  const w = (id: string) => weights.rows.find((x) => x.id === id);
  const saveWeight = async (p: ProductAdmin) => {
    const { error: e } = await supabase.from('products').update({ weight_kg: Number(wEdit[p.id]) }).eq('id', p.id);
    flash(e ? e.message : L('weightSaved'));
    if (!e) { setWEdit({ ...wEdit, [p.id]: '' }); weights.reload(); }
  };
  const shown = rows.filter((p) => (tab === 'review' ? !p.active : p.active));
  const toggle = async (p: ProductAdmin) => {
    const { error: e } = await supabase.rpc('admin_publish_product', { p_id: p.id, p_active: !p.active });
    flash(e ? e.message : L('updated'));
    if (!e) reload();
  };
  return (
    <>
      <PageHead eyebrow={L('liveEyebrow')} title={L('aProductsTitle')} sub={L('aProductsSub')} />
      <div className="seg compact mb" role="tablist" aria-label={L('aProductsTitle')}>
        <button type="button" role="tab" aria-selected={tab === 'review'} className={tab === 'review' ? 'is-on' : ''} onClick={() => setTab('review')}>
          {L('awaitingReview')} ({rows.filter((p) => !p.active).length})
        </button>
        <button type="button" role="tab" aria-selected={tab === 'live'} className={tab === 'live' ? 'is-on' : ''} onClick={() => setTab('live')}>
          {L('published')} ({rows.filter((p) => p.active).length})
        </button>
      </div>
      <ErrorNote error={error} />
      <Card>
        {!shown.length ? <Empty text={L('nothingHere')} /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>{L('product')}</th><th>{L('factory')}</th><th>{L('category')}</th><th>{L('price')}</th><th>{L('packedWeight')}</th><th>{L('moq')}</th><th>{L('stock')}</th><th /></tr></thead>
              <tbody>
                {shown.map((p) => (
                  <tr key={p.id}>
                    <td className="strong"><div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>{p.image_url ? <img src={p.image_url} alt="" width={44} height={44} style={{ objectFit: 'cover', borderRadius: 8 }} /> : <i className="ri-image-line muted" style={{ fontSize: 28 }} />}<div>{p.name_ar}<div className="s small muted" dir="ltr">{p.id} · {(p.images ?? []).length} img</div></div></div></td>
                    <td>{p.factory_id}</td>
                    <td>{p.category_id}</td>
                    <td>{m.money(p.price)}</td>
                    <td style={{ minWidth: 150 }}>
                      <div className="row-actions">
                        <input aria-label={L('packedWeight')} type="number" step="0.01" min={0.01} max={70} dir="ltr" style={{ width: 80 }}
                          value={wEdit[p.id] || String(w(p.id)?.weight_kg ?? '')} onChange={(e) => setWEdit({ ...wEdit, [p.id]: e.target.value })} />
                        {wEdit[p.id] && <button type="button" className="btn ghost sm" onClick={() => saveWeight(p)}>{L('save')}</button>}
                      </div>
                      {w(p.id)?.outlier && <div className="s small"><Pill tone="warn">{L('weightOutlier', { median: m.num(w(p.id)?.category_median) })}</Pill></div>}
                    </td>
                    <td>{p.moq ?? '—'}</td>
                    <td>{m.num(p.stock)}</td>
                    <td>
                      <button type="button" className={`btn ${p.active ? 'ghost' : 'primary'} sm`} onClick={() => toggle(p)}>
                        {p.active ? L('unpublish') : L('publish')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="note" style={{ marginTop: 12 }}><i className="ri-information-line" /><span>{L('reviewNote')}</span></div>
      </Card>
      <Toast message={toast} />
    </>
  );
}

interface FactoryAdmin {
  id: string; name_ar: string; city: string; kyb_status: string; cr_number: string | null; owner_email: string | null;
  products: number; active_products: number; balance: { held: number; released: number; paid: number; due: number } | null;
}

function AdminFactories() {
  const L = useL();
  const m = useMoney();
  const { toast, flash } = useFlash();
  const { rows, error, reload } = useRows<FactoryAdmin>(() => supabase.from('admin_factories').select('*').order('name_ar'));
  const pay = async (f: FactoryAdmin) => {
    const ref = window.prompt(L('transferRef')) ?? '';
    if (!ref) return;
    const { data, error: e } = await supabase.rpc('admin_pay_factory', { p_factory: f.id, p_reference: ref });
    flash(e ? e.message : L('factoryPaid', { amount: m.money(Number(data)) }));
    if (!e) reload();
  };
  const due = rows.reduce((s, f) => s + Number(f.balance?.due ?? 0), 0);
  const held = rows.reduce((s, f) => s + Number(f.balance?.held ?? 0), 0);
  return (
    <>
      <PageHead eyebrow={L('liveEyebrow')} title={L('aFactoriesTitle')} sub={L('aFactoriesSub')} />
      <div className="grid c3 mb">
        <Stat icon="ri-building-2-line" num={String(rows.length)} lbl={L('factories')} />
        <Stat icon="ri-safe-2-line" num={m.money(held)} lbl={L('fHeld')} />
        <Stat icon="ri-bank-line" num={m.money(due)} lbl={L('dueToFactories')} />
      </div>
      <ErrorNote error={error} />
      <Card>
        {!rows.length ? <Empty text={L('nothingHere')} /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>{L('factory')}</th><th>{L('kyb')}</th><th>{L('products')}</th><th>{L('fHeld')}</th><th>{L('paidOut')}</th><th>{L('due')}</th><th /></tr></thead>
              <tbody>
                {rows.map((f) => (
                  <tr key={f.id}>
                    <td className="strong">{f.name_ar}<div className="s small muted">{f.city} · {f.owner_email ?? L('noOwner')}</div></td>
                    <td><Status value={f.kyb_status} /></td>
                    <td>{f.active_products} / {f.products}</td>
                    <td>{m.money(f.balance?.held)}</td>
                    <td>{m.money(f.balance?.paid)}</td>
                    <td className="strong">{m.money(f.balance?.due)}</td>
                    <td>
                      {Number(f.balance?.due ?? 0) > 0 && (
                        <button type="button" className="btn primary sm" onClick={() => pay(f)}>{L('payFactory')}</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="note" style={{ marginTop: 12 }}><i className="ri-information-line" /><span>{L('factoryApprovalNote')}</span></div>
      </Card>
      <Toast message={toast} />
    </>
  );
}

interface AmbAdmin {
  user_id: string; slug: string; code: string; tier: string; is_leader: boolean; status: string; acquisition_channel: string;
  full_name: string; country: string | null; email: string; leader_code: string | null; team_size: number; earned: number;
}

function AdminAmbassadors() {
  const L = useL();
  const m = useMoney();
  const { toast, flash } = useFlash();
  const { rows, error, reload } = useRows<AmbAdmin>(() => supabase.from('admin_ambassadors').select('*').order('created_at', { ascending: false }));
  const run = async (fn: string, args: Record<string, unknown>) => {
    const { error: e } = await supabase.rpc(fn, args);
    flash(e ? e.message : L('updated'));
    if (!e) reload();
  };
  return (
    <>
      <PageHead eyebrow={L('liveEyebrow')} title={L('aAmbTitle')} sub={L('aAmbSub')} />
      <div className="grid c3 mb">
        <Stat icon="ri-user-star-line" num={String(rows.filter((r) => r.status === 'active').length)} lbl={L('activeAmbassadors')} />
        <Stat icon="ri-vip-crown-2-line" num={String(rows.filter((r) => r.is_leader).length)} lbl={L('leaders')} />
        <Stat icon="ri-hand-coin-line" num={m.money(rows.reduce((s, r) => s + Number(r.earned), 0))} lbl={L('totalEarned')} />
      </div>
      <ErrorNote error={error} />
      <Card>
        {!rows.length ? <Empty text={L('nothingHere')} /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>{L('ambassador')}</th><th>{L('tier')}</th><th>{L('team')}</th><th>{L('channel')}</th><th>{L('earned')}</th><th>{L('status')}</th><th /></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.user_id}>
                    <td className="strong">{r.full_name}<div className="s small muted" dir="ltr">{r.code} · {r.email}</div></td>
                    <td>{L(`tier_${r.tier}`, { defaultValue: r.tier })}{r.is_leader && <div><Pill tone="info">{L('leader')}</Pill></div>}</td>
                    <td className="small">{r.is_leader ? L('members', { n: r.team_size }) : r.leader_code ? L('underLeader', { code: r.leader_code }) : '—'}</td>
                    <td className="small">{r.acquisition_channel}</td>
                    <td>{m.money(r.earned)}</td>
                    <td><Status value={r.status} /></td>
                    <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {!r.leader_code && (
                        <button type="button" className="btn ghost sm" onClick={() => run('admin_set_leader', { p_user_id: r.user_id, p_is_leader: !r.is_leader })}>
                          {r.is_leader ? L('removeLeader') : L('makeLeader')}
                        </button>
                      )}
                      <button type="button" className="btn ghost sm" onClick={() => run('admin_set_ambassador_status', { p_user_id: r.user_id, p_status: r.status === 'active' ? 'suspended' : 'active' })}>
                        {r.status === 'active' ? L('suspend') : L('activate')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Toast message={toast} />
    </>
  );
}

interface ReturnAdmin { id: number; sub_order_id: string; reason: string; note: string | null; status: string; created_at: string; goods: number; discount: number; factory_id: string; settled: boolean; order_id: string; buyer_name: string; country: string }

function AdminReturns() {
  const L = useL();
  const m = useMoney();
  const { toast, flash } = useFlash();
  const { rows, error, reload } = useRows<ReturnAdmin>(() => supabase.from('admin_returns').select('*').order('created_at', { ascending: false }));
  const decide = async (r: ReturnAdmin, d: string) => {
    const { error: e } = await supabase.rpc('admin_decide_return', { p_id: r.id, p_decision: d });
    flash(e ? e.message : L('updated'));
    if (!e) reload();
  };
  return (
    <>
      <PageHead eyebrow={L('liveEyebrow')} title={L('aReturnsTitle')} sub={L('aReturnsSub')} />
      <ErrorNote error={error} />
      <Card>
        {!rows.length ? <Empty text={L('nothingHere')} /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>#</th><th>{L('order')}</th><th>{L('reason')}</th><th>{L('amount')}</th><th>{L('status')}</th><th /></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}<div className="s small muted">{m.date(r.created_at)}</div></td>
                    <td className="small" dir="ltr">{r.sub_order_id}<div className="s muted">{r.buyer_name} · {r.country.toUpperCase()}</div></td>
                    <td>{L(`reason_${r.reason}`)}{r.note && <div className="s small muted">{r.note}</div>}</td>
                    <td className="strong">{m.money(Number(r.goods) - Number(r.discount))}</td>
                    <td><Status value={r.status} /></td>
                    <td><div className="row-actions">
                      {r.status === 'requested' && (
                        <>
                          <button type="button" className="btn primary sm" onClick={() => decide(r, 'approved')}>{L('approve')}</button>
                          <button type="button" className="btn ghost sm" onClick={() => decide(r, 'rejected')}>{L('reject')}</button>
                        </>
                      )}
                      {r.status === 'approved' && (
                        <button type="button" className="btn primary sm" onClick={() => decide(r, 'received')}>{L('receivedRefund')}</button>
                      )}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="note" style={{ marginTop: 12 }}><i className="ri-information-line" /><span>{L('returnsNote')}</span></div>
      </Card>
      <Toast message={toast} />
    </>
  );
}

interface AuditRow { id: number; actor_id: string | null; action: string; entity: string; entity_id: string | null; details: Record<string, unknown>; created_at: string }

function AdminAudit() {
  const L = useL();
  const m = useMoney();
  const [q, setQ] = useState('');
  const { rows, error } = useRows<AuditRow>(() => supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(300));
  const shown = useMemo(() => rows.filter((r) => !q || `${r.action} ${r.entity} ${r.entity_id}`.toLowerCase().includes(q.toLowerCase())), [rows, q]);
  return (
    <>
      <PageHead eyebrow={L('liveEyebrow')} title={L('auditTitle')} sub={L('auditSub')} />
      <ErrorNote error={error} />
      <Card>
        <div className="field" style={{ maxWidth: 320 }}>
          <label htmlFor="audit-q">{L('search')}</label>
          <input id="audit-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="payout, order.paid, settings…" dir="ltr" />
        </div>
        {!shown.length ? <Empty text={L('nothingHere')} /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>{L('date')}</th><th>{L('action')}</th><th>{L('entity')}</th><th>{L('details')}</th></tr></thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id}>
                    <td className="small">{m.date(r.created_at)} {new Date(r.created_at).toLocaleTimeString(m.locale, { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="strong" dir="ltr">{r.action}</td>
                    <td className="small" dir="ltr">{r.entity} · {r.entity_id}</td>
                    <td className="small" dir="ltr" style={{ maxWidth: 360, wordBreak: 'break-all' }}>{JSON.stringify(r.details)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

/* ═════════════════════════════ factory ═════════════════════════════ */

interface MyProduct { id: string; name_ar: string; name_en: string; category_id: string; price: number; stock: number; moq: number | null; weight_kg: number; active: boolean; image_url: string | null; images: string[] | null }

function FactoryProducts() {
  const L = useL();
  const m = useMoney();
  const { toast, flash } = useFlash();
  const factory = useRows<{ id: string; kyb_status: string }>(async () => {
    const { data: s } = await supabase.auth.getSession();
    return supabase.from('factories').select('id, kyb_status').eq('owner_id', s.session?.user.id ?? '');
  });
  const fid = factory.rows[0]?.id ?? '';
  const cats = useRows<{ id: string; name_ar: string }>(() => supabase.from('categories').select('id, name_ar').order('sort_order'));
  const products = useRows<MyProduct>(
    () => (fid ? supabase.from('products').select('id, name_ar, name_en, category_id, price, stock, moq, weight_kg, active, image_url, images').eq('factory_id', fid) : Promise.resolve({ data: [], error: null })),
    [fid],
  );
  const [draft, setDraft] = useState({ name: '', category: '', price: '', weight: '', moq: '', stock: '' });
  const [edit, setEdit] = useState<Record<string, { price: string; stock: string }>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState('');

  /* Images go to the public product-images bucket under the factory's folder;
     the first one is the cover. Any image change sends the product back to
     review like a price change. */
  const uploadImages = async (productId: string, list: File[], keep: string[] = []) => {
    const urls: string[] = [...keep];
    for (const [i, f] of list.entries()) {
      if (f.size > 5 * 1024 * 1024) { flash(L('imgTooLarge')); continue; }
      const ext = (f.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
      const path = `${fid}/${productId}/${Date.now()}-${i}.${ext}`;
      const up = await supabase.storage.from('product-images').upload(path, f, { contentType: f.type });
      if (up.error) { flash(up.error.message); continue; }
      urls.push(supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl);
    }
    const imgs = urls.slice(0, 8);
    return supabase.from('products').update({ images: imgs, image_url: imgs[0] ?? null, active: false }).eq('id', productId);
  };

  const addImages = async (p: MyProduct, list: FileList | null) => {
    if (!list?.length) return;
    setBusy(p.id);
    const { error } = await uploadImages(p.id, [...list], p.images ?? []);
    setBusy('');
    flash(error ? error.message : L('imagesUpdated'));
    if (!error) products.reload();
  };
  const removeImage = async (p: MyProduct, url: string) => {
    const imgs = (p.images ?? []).filter((u) => u !== url);
    const { error } = await supabase.from('products').update({ images: imgs, image_url: imgs[0] ?? null, active: false }).eq('id', p.id);
    flash(error ? error.message : L('imagesUpdated'));
    if (!error) products.reload();
  };

  const add = async () => {
    if (!fid || !draft.name.trim() || !draft.category || Number(draft.price) <= 0) {
      flash(L('fillRequired'));
      return;
    }
    const kg = Number(draft.weight);
    if (!(kg >= 0.01 && kg <= 70)) {
      flash(L('weightRequired'));
      return;
    }
    const id = `${fid}-${draft.name.trim().toLowerCase().replace(/[^a-z0-9؀-ۿ]+/g, '-').slice(0, 30)}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabase.from('products').insert({
      id, factory_id: fid, category_id: draft.category, name_ar: draft.name.trim(), price: Number(draft.price),
      weight_kg: kg, moq: draft.moq ? Number(draft.moq) : null, stock: Number(draft.stock) || 0, active: false,
    });
    if (!error && files.length) {
      setBusy('new');
      const img = await uploadImages(id, files);
      setBusy('');
      if (img.error) flash(img.error.message);
    }
    flash(error ? error.message : L('productSubmitted'));
    if (!error) {
      setDraft({ name: '', category: '', price: '', weight: '', moq: '', stock: '' });
      setFiles([]);
      products.reload();
    }
  };

  const save = async (p: MyProduct) => {
    const e = edit[p.id];
    if (!e) return;
    /* Owners may only change unpublished rows; a price or stock change on a
       live product sends it back to review (RLS enforces the same rule). */
    const { error } = await supabase.from('products')
      .update({ price: Number(e.price) || p.price, stock: Number(e.stock) || 0, active: false }).eq('id', p.id);
    flash(error ? error.message : L('productResubmitted'));
    if (!error) products.reload();
  };

  return (
    <>
      <PageHead eyebrow={L('liveEyebrow')} title={L('fProductsTitle')} sub={L('fProductsSub')} />
      {!fid && !factory.loading && <div className="note mb"><i className="ri-information-line" /><span>{L('noFactory')}</span></div>}
      <Card className="mb" title={L('addProduct')} sub={L('addProductSub')}>
        <div className="grid c3">
          <div className="field"><label htmlFor="np-name">{L('productName')}</label><input id="np-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
          <div className="field"><label htmlFor="np-cat">{L('category')}</label>
            <select id="np-cat" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
              <option value="">—</option>
              {cats.rows.map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
            </select>
          </div>
          <div className="field"><label htmlFor="np-price">{L('retailPrice')}</label><input id="np-price" type="number" dir="ltr" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} /></div>
          <div className="field"><label htmlFor="np-w">{L('packedWeight')} *</label><input id="np-w" type="number" step="0.01" min={0.01} max={70} dir="ltr" placeholder={L('packedWeightPh')} value={draft.weight} onChange={(e) => setDraft({ ...draft, weight: e.target.value })} /></div>
          <div className="field"><label htmlFor="np-moq">{L('moq')}</label><input id="np-moq" type="number" dir="ltr" value={draft.moq} onChange={(e) => setDraft({ ...draft, moq: e.target.value })} /></div>
          <div className="field"><label htmlFor="np-stock">{L('stock')}</label><input id="np-stock" type="number" dir="ltr" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: e.target.value })} /></div>
        </div>
        <div className="field">
          <span className="small strong">{L('productImages')}</span>
          <label className="btn ghost" style={{ cursor: 'pointer', justifyContent: 'center', borderStyle: 'dashed' }}>
            <i className="ri-image-add-line" /> {files.length ? L('imagesChosen', { n: files.length }) : L('chooseImages')}
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => setFiles([...(e.target.files ?? [])].slice(0, 8))} />
          </label>
          <div className="small muted">{L('imagesHint')}</div>
          {files.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {files.map((f, i) => (
                <img key={i} src={URL.createObjectURL(f)} alt="" width={64} height={64} style={{ objectFit: 'cover', borderRadius: 10, outline: i === 0 ? '2px solid var(--accent)' : 'none' }} />
              ))}
            </div>
          )}
        </div>
        <button type="button" className="btn primary" disabled={!fid || busy === 'new'} onClick={add}><i className="ri-add-line" /> {L('submitForReview')}</button>
      </Card>
      <Card title={L('myProducts')}>
        {!products.rows.length ? <Empty text={L('nothingHere')} /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>{L('product')}</th><th>{L('price')}</th><th>{L('stock')}</th><th>{L('status')}</th><th /></tr></thead>
              <tbody>
                {products.rows.map((p) => (
                  <tr key={p.id}>
                    <td className="strong">
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {p.image_url ? <img src={p.image_url} alt="" width={44} height={44} style={{ objectFit: 'cover', borderRadius: 8 }} /> : <i className="ri-image-line muted" style={{ fontSize: 28 }} />}
                        <div>{p.name_ar}<div className="s small muted">{p.category_id} · {L('moq')}: {p.moq ?? '—'}</div></div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                        {(p.images ?? []).map((u) => (
                          <span key={u} style={{ position: 'relative' }}>
                            <img src={u} alt="" width={36} height={36} style={{ objectFit: 'cover', borderRadius: 6 }} />
                            <button type="button" aria-label={L('removeImage')} onClick={() => removeImage(p, u)} style={{ position: 'absolute', top: -6, insetInlineEnd: -6, border: 0, borderRadius: 99, width: 18, height: 18, fontSize: 11, cursor: 'pointer' }}>×</button>
                          </span>
                        ))}
                        <label className="btn ghost sm" style={{ cursor: 'pointer' }}>
                          <i className={busy === p.id ? 'ri-loader-4-line' : 'ri-image-add-line'} /> {L('addImages')}
                          <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => addImages(p, e.target.files)} />
                        </label>
                      </div>
                    </td>
                    <td className="field" style={{ marginBottom: 0 }}><input aria-label={L('price')} type="number" dir="ltr" value={edit[p.id]?.price ?? String(p.price)} onChange={(e) => setEdit({ ...edit, [p.id]: { price: e.target.value, stock: edit[p.id]?.stock ?? String(p.stock) } })} /></td>
                    <td className="field" style={{ marginBottom: 0 }}><input aria-label={L('stock')} type="number" dir="ltr" value={edit[p.id]?.stock ?? String(p.stock)} onChange={(e) => setEdit({ ...edit, [p.id]: { stock: e.target.value, price: edit[p.id]?.price ?? String(p.price) } })} /></td>
                    <td><Pill tone={p.active ? 'ok' : 'warn'}>{p.active ? L('published') : L('awaitingReview')}</Pill></td>
                    <td>{edit[p.id] && <button type="button" className="btn ghost sm" onClick={() => save(p)}>{L('saveForReview')}</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="note" style={{ marginTop: 12 }}><i className="ri-information-line" /><span>{L('reviewNote')}</span></div>
      </Card>
      <Toast message={toast} />
    </>
  );
}

function FactoryFinance() {
  const L = useL();
  const m = useMoney();
  const factory = useRows<{ id: string }>(async () => {
    const { data: s } = await supabase.auth.getSession();
    return supabase.from('factories').select('id').eq('owner_id', s.session?.user.id ?? '');
  });
  const fid = factory.rows[0]?.id ?? '';
  const balance = useRows<{ held: number; released: number; paid: number; due: number }>(
    async () => {
      if (!fid) return { data: [], error: null };
      const r = await supabase.rpc('factory_balance', { p_factory: fid });
      return { data: r.data ? [r.data] : [], error: r.error };
    },
    [fid],
  );
  const payouts = useRows<{ id: number; amount: number; reference: string | null; paid_at: string }>(
    () => (fid ? supabase.from('factory_payouts').select('id, amount, reference, paid_at').eq('factory_id', fid).order('paid_at', { ascending: false }) : Promise.resolve({ data: [], error: null })),
    [fid],
  );
  const b = balance.rows[0];
  return (
    <>
      <PageHead eyebrow={L('liveEyebrow')} title={L('fFinanceTitle')} sub={L('fFinanceSub')} />
      {!fid && !factory.loading && <div className="note mb"><i className="ri-information-line" /><span>{L('noFactory')}</span></div>}
      <div className="grid c4 mb">
        <Stat icon="ri-safe-2-line" num={m.money(b?.held)} lbl={L('fHeld')} />
        <Stat icon="ri-checkbox-circle-line" num={m.money(b?.released)} lbl={L('released')} />
        <Stat icon="ri-bank-line" num={m.money(b?.paid)} lbl={L('paidOut')} />
        <Stat icon="ri-wallet-3-line" num={m.money(b?.due)} lbl={L('due')} />
      </div>
      <Card title={L('settlements')}>
        {!payouts.rows.length ? <Empty text={L('nothingHere')} /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>#</th><th>{L('date')}</th><th>{L('amount')}</th><th>{L('reference')}</th></tr></thead>
              <tbody>
                {payouts.rows.map((p) => (
                  <tr key={p.id}><td>{p.id}</td><td>{m.date(p.paid_at)}</td><td className="strong">{m.money(p.amount)}</td><td dir="ltr">{p.reference ?? '—'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

function FactoryDeals() {
  const L = useL();
  const m = useMoney();
  const { rows, error } = useRows<DealAdmin>(() => supabase.from('deals')
    .select('id, total, order_id, paid_at, created_at, quote:quotes(factory_id), deal_installments(seq, due_on, amount, status)')
    .order('created_at', { ascending: false }));
  return (
    <>
      <PageHead eyebrow={L('liveEyebrow')} title={L('fDealsTitle')} sub={L('fDealsSub')} />
      <ErrorNote error={error} />
      {!rows.length && <Card><Empty text={L('dealsEmpty')} /></Card>}
      {rows.map((d) => (
        <Card key={d.id} className="mb" title={`${d.order_id ?? ''} · ${m.money(d.total)}`} sub={m.date(d.created_at)} action={<Status value={d.paid_at ? 'paid' : 'pending_payment'} />}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>#</th><th>{L('due')}</th><th>{L('amount')}</th><th>{L('status')}</th></tr></thead>
              <tbody>
                {[...d.deal_installments].sort((a, b) => a.seq - b.seq).map((i) => (
                  <tr key={i.seq}><td>{i.seq}</td><td>{m.date(i.due_on)}</td><td>{m.money(i.amount)}</td><td><Status value={i.status === 'paid' ? 'paid' : 'pending_payment'} /></td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="note" style={{ marginTop: 10 }}><i className="ri-information-line" /><span>{L('produceAfterPaid')}</span></div>
        </Card>
      ))}
    </>
  );
}

function FactoryReturns() {
  const L = useL();
  const m = useMoney();
  const { rows, error } = useRows<{ id: number; sub_order_id: string; reason: string; note: string | null; status: string; created_at: string }>(
    () => supabase.from('return_requests').select('id, sub_order_id, reason, note, status, created_at').order('created_at', { ascending: false }),
  );
  return (
    <>
      <PageHead eyebrow={L('liveEyebrow')} title={L('fReturnsTitle')} sub={L('fReturnsSub')} />
      <ErrorNote error={error} />
      <Card>
        {!rows.length ? <Empty text={L('nothingHere')} /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>#</th><th>{L('order')}</th><th>{L('reason')}</th><th>{L('date')}</th><th>{L('status')}</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}><td>{r.id}</td><td dir="ltr">{r.sub_order_id}</td><td>{L(`reason_${r.reason}`)}{r.note && <div className="s small muted">{r.note}</div>}</td><td>{m.date(r.created_at)}</td><td><Status value={r.status} /></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

/* ═════════════════════════════ ambassador ═════════════════════════════ */

function AmbLinks() {
  const L = useL();
  const { toast, flash } = useFlash();
  const me = useRows<{ slug: string; code: string; status: string }>(async () => {
    const { data: s } = await supabase.auth.getSession();
    return supabase.from('ambassadors').select('slug, code, status').eq('user_id', s.session?.user.id ?? '');
  });
  const factories = useRows<{ id: string; name_ar: string }>(() => supabase.from('factories').select('id, name_ar').eq('kyb_status', 'verified').order('name_ar'));
  const links = useRows<{ code: string; factory_id: string; discount_pct: number; clicks: number; orders: number }>(async () => {
    const r = await supabase.rpc('my_links');
    return { data: r.data ?? [], error: r.error };
  });
  const [factory, setFactory] = useState('');
  const amb = me.rows[0];

  const create = async () => {
    if (!factory) return;
    const { error } = await supabase.rpc('create_referral_link', { p_factory: factory });
    flash(error ? error.message : L('linkCreated'));
    if (!error) links.reload();
  };
  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch { /* ignore */ }
    flash(L('copied'));
  };

  return (
    <>
      <PageHead eyebrow={L('liveEyebrow')} title={L('linksTitle')} sub={L('linksSub')} />
      {!amb && !me.loading && <div className="note mb"><i className="ri-information-line" /><span>{L('notAmbassador')}</span></div>}
      <Card className="mb" title={L('newLink')} sub={L('newLinkSub')}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="field" style={{ marginBottom: 0, minWidth: 240 }}>
            <label htmlFor="ln-f">{L('factory')}</label>
            <select id="ln-f" value={factory} onChange={(e) => setFactory(e.target.value)}>
              <option value="">—</option>
              {factories.rows.map((f) => <option key={f.id} value={f.id}>{f.name_ar}</option>)}
            </select>
          </div>
          <button type="button" className="btn primary" disabled={!amb || !factory} onClick={create}><i className="ri-link" /> {L('createLink')}</button>
        </div>
      </Card>
      {!links.rows.length ? <Card><Empty text={L('linksEmpty')} /></Card> : (
        <div className="grid c2">
          {links.rows.map((l) => {
            const url = absoluteUrl(`/f/${amb?.slug ?? ''}/${l.factory_id ?? ''}`);
            return (
              <Card key={l.code} title={l.factory_id ?? L('batchCard')} sub={`${l.code} · ${L('discountPct', { n: l.discount_pct })}`}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                  <QrCode value={url} size={130} />
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div className="small muted">{L('clicks')}: {l.clicks} · {L('paidOrders')}: {l.orders}</div>
                    <div className="small" dir="ltr" style={{ wordBreak: 'break-all', margin: '6px 0' }}>{url}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" className="btn ghost sm" onClick={() => copy(url)}><i className="ri-file-copy-line" /> {L('copyLink')}</button>
                      <button type="button" className="btn ghost sm" onClick={() => copy(l.code)}><i className="ri-coupon-3-line" /> {L('copyCode')}</button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <Toast message={toast} />
    </>
  );
}

function AmbGroup() {
  const L = useL();
  const m = useMoney();
  const { toast, flash } = useFlash();
  const [country, setCountry] = useState('pk');
  const [city, setCity] = useState('');
  const [days, setDays] = useState('10');
  const groups = useRows<{ id: string; code: string; country: string; city: string | null; participants: number; min_participants: number; closes_at: string; status: string }>(async () => {
    const { data: s } = await supabase.auth.getSession();
    return supabase.from('group_orders').select('id, code, country, city, participants, min_participants, closes_at, status')
      .eq('organiser_ambassador_id', s.session?.user.id ?? '').order('created_at', { ascending: false });
  });
  const create = async () => {
    const { data, error } = await supabase.rpc('create_group_order', { p_country: country, p_city: city, p_days: Number(days) || 10 });
    flash(error ? error.message : L('groupCreated', { code: String(data) }));
    if (!error) groups.reload();
  };
  return (
    <>
      <PageHead eyebrow={L('liveEyebrow')} title={L('groupTitle')} sub={L('groupSub')} />
      <Card className="mb" title={L('newGroup')}>
        <div className="grid c4" style={{ alignItems: 'end' }}>
          <div className="field"><label htmlFor="g-c">{L('countryCode')}</label><input id="g-c" dir="ltr" maxLength={2} value={country} onChange={(e) => setCountry(e.target.value.toLowerCase())} /></div>
          <div className="field"><label htmlFor="g-city">{L('city')}</label><input id="g-city" value={city} onChange={(e) => setCity(e.target.value)} /></div>
          <div className="field"><label htmlFor="g-d">{L('openDays')}</label><input id="g-d" type="number" dir="ltr" value={days} onChange={(e) => setDays(e.target.value)} /></div>
          <div className="field"><button type="button" className="btn primary" onClick={create}><i className="ri-group-line" /> {L('createGroup')}</button></div>
        </div>
      </Card>
      <Card title={L('myGroups')}>
        {!groups.rows.length ? <Empty text={L('nothingHere')} /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>{L('code')}</th><th>{L('destination')}</th><th>{L('participants')}</th><th>{L('closes')}</th><th>{L('status')}</th></tr></thead>
              <tbody>
                {groups.rows.map((g) => (
                  <tr key={g.id}>
                    <td className="strong" dir="ltr">{g.code}</td>
                    <td>{g.country.toUpperCase()} {g.city ?? ''}</td>
                    <td>{g.participants} / {g.min_participants}</td>
                    <td>{m.date(g.closes_at)}</td>
                    <td><Status value={g.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Toast message={toast} />
    </>
  );
}

function AmbKyc() {
  const L = useL();
  const { toast, flash } = useFlash();
  const [nid, setNid] = useState('');
  const [iban, setIban] = useState('');
  const [walletProvider, setWalletProvider] = useState('jazzcash');
  const [walletNumber, setWalletNumber] = useState('');
  const saveWallet = async () => {
    const { error } = await supabase.rpc('submit_wallet', { p_provider: walletProvider, p_number: walletNumber.replace(/[\s-]/g, '') });
    flash(error ? error.message : L('walletSaved'));
    if (!error) setWalletNumber('');
  };
  const access = useRows<{ verification_status: string }>(async () => {
    const r = await supabase.rpc('my_access');
    return { data: r.data ? [r.data] : [], error: r.error };
  });
  const submit = async () => {
    const { error } = await supabase.rpc('submit_kyc', {
      p_national_id: nid.replace(/\s+/g, '').toUpperCase() || null,
      p_iban: iban.replace(/\s+/g, '').toUpperCase() || null,
    });
    flash(error ? error.message : L('kycSent'));
    if (!error) {
      setNid('');
      setIban('');
      access.reload();
    }
  };
  const status = access.rows[0]?.verification_status ?? 'unverified';
  return (
    <>
      <PageHead eyebrow={L('liveEyebrow')} title={L('kycTitle')} sub={L('kycSub')} />
      <Card className="mb" title={L('verification')} action={<Status value={status} />}>
        <div className="grid c2">
          <div className="field"><label htmlFor="k-id">{L('nationalId')}</label><input id="k-id" dir="ltr" autoComplete="off" value={nid} onChange={(e) => setNid(e.target.value)} /></div>
          <div className="field"><label htmlFor="k-iban">{L('iban')}</label><input id="k-iban" dir="ltr" autoComplete="off" value={iban} onChange={(e) => setIban(e.target.value)} placeholder="SA00 0000 0000 0000 0000 0000" /></div>
        </div>
        <button type="button" className="btn primary" onClick={submit} disabled={!nid && !iban}><i className="ri-shield-check-line" /> {L('submitKyc')}</button>
        <div className="note" style={{ marginTop: 12 }}><i className="ri-lock-line" /><span>{L('kycPrivacy')}</span></div>
      </Card>
      <Card className="mb" title={L('walletTitleKyc')} sub={L('walletSubKyc')}>
        <div className="grid c2">
          <div className="field">
            <label htmlFor="w-p">{L('walletProvider')}</label>
            <select id="w-p" value={walletProvider} onChange={(e) => setWalletProvider(e.target.value)}>
              {['jazzcash', 'easypaisa', 'gopay', 'ovo', 'dana', 'vodafone_cash', 'stcpay', 'other'].map((w) => <option key={w} value={w}>{L(`w_${w}`)}</option>)}
            </select>
          </div>
          <div className="field"><label htmlFor="w-n">{L('walletNumber')}</label><input id="w-n" dir="ltr" inputMode="tel" value={walletNumber} onChange={(e) => setWalletNumber(e.target.value)} placeholder="+92 300 0000000" /></div>
        </div>
        <button type="button" className="btn primary" onClick={saveWallet} disabled={!walletNumber}><i className="ri-wallet-3-line" /> {L('saveWallet')}</button>
      </Card>
      <Toast message={toast} />
    </>
  );
}

/* ═════════════════════════════ buyer ═════════════════════════════ */

interface BuyerSub { id: string; order_id: string; goods: number; discount: number; delivered_at: string | null; status: string; returned: boolean }

function BuyerReturns() {
  const L = useL();
  const m = useMoney();
  const { toast, flash } = useFlash();
  const subs = useRows<BuyerSub>(() => supabase.from('sub_orders').select('id, order_id, goods, discount, delivered_at, status, returned').not('delivered_at', 'is', null).order('delivered_at', { ascending: false }));
  const requests = useRows<{ id: number; sub_order_id: string; reason: string; status: string; created_at: string }>(() => supabase.from('return_requests').select('id, sub_order_id, reason, status, created_at'));
  const [reason, setReason] = useState<Record<string, string>>({});
  const [note, setNote] = useState<Record<string, string>>({});
  const request = async (s: BuyerSub) => {
    const { error } = await supabase.rpc('request_return', { p_sub_order: s.id, p_reason: reason[s.id] ?? 'damaged', p_note: note[s.id] ?? '' });
    flash(error ? error.message : L('returnRequested'));
    if (!error) requests.reload();
  };
  const byId = new Map(requests.rows.map((r) => [r.sub_order_id, r]));
  return (
    <>
      <PageHead eyebrow={L('liveEyebrow')} title={L('bReturnsTitle')} sub={L('bReturnsSub')} />
      <Card>
        {!subs.rows.length ? <Empty text={L('bReturnsEmpty')} /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>{L('order')}</th><th>{L('deliveredOn')}</th><th>{L('amount')}</th><th>{L('reason')}</th><th /></tr></thead>
              <tbody>
                {subs.rows.map((s) => {
                  const r = byId.get(s.id);
                  return (
                    <tr key={s.id}>
                      <td className="strong" dir="ltr">{s.id}</td>
                      <td>{m.date(s.delivered_at)}</td>
                      <td>{m.money(Number(s.goods) - Number(s.discount))}</td>
                      <td>
                        {r ? L(`reason_${r.reason}`) : (
                          <div style={{ display: 'grid', gap: 6 }}>
                            <select aria-label={L('reason')} value={reason[s.id] ?? 'damaged'} onChange={(e) => setReason({ ...reason, [s.id]: e.target.value })}>
                              {['damaged', 'size', 'notAsDescribed', 'other'].map((k) => <option key={k} value={k}>{L(`reason_${k}`)}</option>)}
                            </select>
                            <input aria-label={L('note')} placeholder={L('note')} value={note[s.id] ?? ''} onChange={(e) => setNote({ ...note, [s.id]: e.target.value })} />
                          </div>
                        )}
                      </td>
                      <td>{r ? <Status value={r.status} /> : <button type="button" className="btn primary sm" onClick={() => request(s)}>{L('requestReturn')}</button>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="note" style={{ marginTop: 12 }}><i className="ri-information-line" /><span>{L('returnWindowNote')}</span></div>
      </Card>
      <Toast message={toast} />
    </>
  );
}

function BuyerAccount() {
  const L = useL();
  const access = useRows<{ roles: string[]; verification_status: string }>(async () => {
    const r = await supabase.rpc('my_access');
    return { data: r.data ? [r.data] : [], error: r.error };
  });
  const profile = useRows<{ id: string; full_name: string; email: string; country: string | null; phone: string | null; requested_panel: string; whatsapp_opt_in: boolean }>(async () => {
    const { data: s } = await supabase.auth.getSession();
    return supabase.from('profiles').select('id, full_name, email, country, phone, requested_panel, whatsapp_opt_in').eq('id', s.session?.user.id ?? '');
  });
  const { toast, flash } = useFlash();
  const [phone, setPhone] = useState<string | null>(null);
  const a = access.rows[0];
  const p = profile.rows[0];
  const saveContact = async (patch: { phone?: string; whatsapp_opt_in?: boolean }) => {
    if (!p) return;
    const { error } = await supabase.from('profiles').update(patch).eq('id', p.id);
    flash(error ? error.message : L('updated'));
    if (!error) { setPhone(null); profile.reload(); }
  };
  return (
    <>
      <PageHead eyebrow={L('liveEyebrow')} title={L('accountTitle')} sub={L('accountSub')} />
      <Card>
        <div className="grid c2">
          <div><div className="small muted">{L('name')}</div><div className="strong">{p?.full_name || '—'}</div></div>
          <div><div className="small muted">{L('email')}</div><div className="strong" dir="ltr">{p?.email}</div></div>
          <div><div className="small muted">{L('roles')}</div><div>{(a?.roles ?? []).map((r) => <Pill key={r} tone="info">{L(`role_${r}`, { defaultValue: r })}</Pill>)}</div></div>
          <div><div className="small muted">{L('verification')}</div><Status value={a?.verification_status ?? 'unverified'} /></div>
        </div>
        {p && (
          <div className="grid c2" style={{ marginTop: 14, alignItems: 'end' }}>
            <div className="field">
              <label htmlFor="acc-phone">{L('waPhone')}</label>
              <div className="row-actions">
                <input id="acc-phone" type="tel" dir="ltr" placeholder="+62 812 …" value={phone ?? p.phone ?? ''} onChange={(e) => setPhone(e.target.value)} />
                {phone !== null && <button type="button" className="btn ghost sm" onClick={() => saveContact({ phone: phone.trim() })}>{L('save')}</button>}
              </div>
            </div>
            <label className="switch">
              <input type="checkbox" checked={p.whatsapp_opt_in} disabled={!p.phone} onChange={(e) => saveContact({ whatsapp_opt_in: e.target.checked })} />
              <span className="track" />
              <span className="small">{L('waOptIn')}</span>
            </label>
          </div>
        )}
        {p && p.requested_panel !== 'buyer' && !(a?.roles ?? []).includes(p.requested_panel) && (
          <div className="note" style={{ marginTop: 12 }}><i className="ri-time-line" /><span>{L('panelPending', { panel: L(`role_${p.requested_panel}`) })}</span></div>
        )}
      </Card>
      <PrivacyCard />
      <Toast message={toast} />
    </>
  );
}

export const liveOpsViews: Record<string, Record<string, FunctionComponent>> = {
  buyer: { returns: BuyerReturns, account: BuyerAccount },
  ambassador: { links: AmbLinks, group: AmbGroup, kyc: AmbKyc },
  factory: { 'f-products': FactoryProducts, 'f-finance': FactoryFinance, 'f-deals': FactoryDeals, 'f-returns': FactoryReturns },
  admin: {
    'admin-orders': AdminOrders, 'admin-products': AdminProducts, 'admin-factories': AdminFactories,
    'admin-ambassadors': AdminAmbassadors, 'admin-returns': AdminReturns, 'admin-support': AdminAudit,
  },
};
