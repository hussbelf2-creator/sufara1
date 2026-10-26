import { useMemo, useState, type FunctionComponent } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { Card, Modal, PageHead, Pill, Stat, Toast } from '@/pages/dashboard/components/ui';
import FinanceLedger from '@/pages/dashboard/views/admin/FinanceLedger';
import { useMoney, useRows } from './useLive';
import { OrderTracking } from './LiveLogistics';

/* Screens that read the database for a real, signed-in account. Row-level
   security decides what each role sees; these components only render it.
   The mock versions of the same screens remain for the demo. */

const tone = (s: string) => (['paid', 'delivered', 'closed', 'eligible', 'sent', 'accepted', 'awarded'].includes(s)
  ? 'ok'
  : ['refunded', 'cancelled', 'void', 'rejected', 'late'].includes(s) ? 'danger' : 'warn');

function useL() {
  const { t } = useTranslation();
  return (key: string, opts?: Record<string, unknown>) => t(`platform.live.${key}`, opts);
}

function Empty({ text }: { text: string }) {
  return <div className="empty"><i className="ri-inbox-2-line" />{text}</div>;
}

function Status({ value }: { value: string }) {
  const L = useL();
  return <Pill tone={tone(value)}>{L(`st_${value}`, { defaultValue: value })}</Pill>;
}

function useFlash() {
  const [toast, setToast] = useState('');
  const flash = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(''), 3000);
  };
  return { toast, flash };
}

/* ── buyer ──────────────────────────────────────────────────────────── */

interface OrderRow {
  id: string; created_at: string; status: string; channel: string; total: number; invoice_no: string | null;
  country: string; ship_method: string; sub_orders: { id: string; status: string; tracking_no: string | null }[];
}

function BuyerOrders() {
  const L = useL();
  const m = useMoney();
  const { rows, loading, error } = useRows<OrderRow>(() => supabase.from('orders')
    .select('id, created_at, status, channel, total, invoice_no, country, ship_method, sub_orders(id, status, tracking_no)')
    .order('created_at', { ascending: false }).limit(100));
  const [track, setTrack] = useState<string | null>(null);
  return (
    <>
      <PageHead eyebrow={L('liveEyebrow')} title={L('ordersTitle')} sub={L('ordersSub')} />
      <Modal open={!!track} onClose={() => setTrack(null)} title={L('tracking')} sub={track ?? ''}>
        {track && <OrderTracking orderId={track} />}
      </Modal>
      <Card>
        {error && <div className="note"><i className="ri-error-warning-line" /><span>{error}</span></div>}
        {!loading && !rows.length ? <Empty text={L('ordersEmpty')} /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>{L('order')}</th><th>{L('date')}</th><th>{L('channel')}</th><th>{L('total')}</th><th>{L('invoice')}</th><th>{L('tracking')}</th><th>{L('status')}</th></tr></thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id}>
                    <td className="strong" dir="ltr">{o.id}</td>
                    <td className="small">{m.date(o.created_at)}</td>
                    <td>{L(`ch_${o.channel}`)}</td>
                    <td className="strong">{m.money(o.total)}</td>
                    <td className="small" dir="ltr">{o.invoice_no ?? L('proforma')}</td>
                    <td className="small" dir="ltr">
                      {o.sub_orders.map((s) => s.tracking_no).filter(Boolean).join(' · ') || '—'}
                      {['paid', 'dispatched', 'delivered'].includes(o.status) && (
                        <div><button type="button" className="btn ghost sm" onClick={() => setTrack(o.id)}><i className="ri-route-line" /> {L('trackShipment')}</button></div>
                      )}
                    </td>
                    <td><Status value={o.status} /></td>
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

interface QuoteRow { id: string; factory_id: string; unit_price: number; lead_days: number; terms: string; valid_until: string; status: string }
interface RfqRow {
  id: string; qty: number; country: string; incoterm: string; status: string; created_at: string;
  product_id: string | null; category_id: string | null; quotes: QuoteRow[];
}

const PLANS: Record<string, { days: number; share: number }[]> = {
  '30-70': [{ days: 0, share: 0.3 }, { days: 30, share: 0.7 }],
  '50-50': [{ days: 0, share: 0.5 }, { days: 45, share: 0.5 }],
  '100': [{ days: 0, share: 1 }],
};

function BuyerQuotes() {
  const L = useL();
  const m = useMoney();
  const { toast, flash } = useFlash();
  const [plan, setPlan] = useState('30-70');
  const { rows, loading, error, reload } = useRows<RfqRow>(() => supabase.from('rfqs')
    .select('id, qty, country, incoterm, status, created_at, product_id, category_id, quotes(id, factory_id, unit_price, lead_days, terms, valid_until, status)')
    .order('created_at', { ascending: false }));

  const accept = async (q: QuoteRow) => {
    const { error: e } = await supabase.rpc('accept_quote', { p_quote: q.id, p_plan: PLANS[plan] });
    flash(e ? e.message : L('dealCreated'));
    if (!e) reload();
  };

  return (
    <>
      <PageHead eyebrow={L('liveEyebrow')} title={L('quotesTitle')} sub={L('quotesSub')} />
      <div className="row-between wrap mb" style={{ gap: 8 }}>
        <span className="small muted">{L('planLabel')}</span>
        <div className="seg compact" role="tablist" aria-label={L('planLabel')}>
          {Object.keys(PLANS).map((k) => (
            <button key={k} type="button" role="tab" aria-selected={plan === k} className={plan === k ? 'is-on' : ''} onClick={() => setPlan(k)}>
              {L(`plan_${k.replace('-', '_')}`)}
            </button>
          ))}
        </div>
      </div>
      {error && <div className="note mb"><i className="ri-error-warning-line" /><span>{error}</span></div>}
      {!loading && !rows.length && <Card><Empty text={L('quotesEmpty')} /></Card>}
      {rows.map((r) => {
        const valid = r.quotes.filter((q) => q.status === 'submitted' && q.valid_until >= new Date().toISOString().slice(0, 10));
        const best = valid.reduce<QuoteRow | null>((b, q) => (!b || q.unit_price < b.unit_price ? q : b), null);
        const fastest = valid.reduce<QuoteRow | null>((b, q) => (!b || q.lead_days < b.lead_days ? q : b), null);
        return (
          <Card key={r.id} className="mb" title={`${r.product_id ?? r.category_id ?? ''} · ${m.num(r.qty)} ${L('units')}`} sub={`${r.country.toUpperCase()} · ${r.incoterm} · ${m.date(r.created_at)}`} action={<Status value={r.status} />}>
            {!r.quotes.length ? <Empty text={L('waitingQuotes')} /> : (
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>{L('factory')}</th><th>{L('unit')}</th><th>{L('dealTotal')}</th><th>{L('lead')}</th><th>{L('validUntil')}</th><th>{L('terms')}</th><th /></tr></thead>
                  <tbody>
                    {r.quotes.map((q) => (
                      <tr key={q.id}>
                        <td className="strong">{q.factory_id}</td>
                        <td>
                          {m.money(q.unit_price)}
                          {best?.id === q.id && <div><Pill tone="ok">{L('bestPrice')}</Pill></div>}
                        </td>
                        <td className="strong">{m.money(q.unit_price * r.qty)}</td>
                        <td>
                          {L('days', { n: q.lead_days })}
                          {fastest?.id === q.id && <div><Pill tone="info">{L('fastest')}</Pill></div>}
                        </td>
                        <td className="small">{m.date(q.valid_until)}</td>
                        <td className="small">{q.terms || '—'}</td>
                        <td>
                          {r.status !== 'awarded' && q.status === 'submitted' ? (
                            <button type="button" className="btn primary sm" onClick={() => accept(q)}>
                              <i className="ri-handshake-line" /> {L('accept')}
                            </button>
                          ) : <Status value={q.status} />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        );
      })}
      <Toast message={toast} />
    </>
  );
}

interface DealRow {
  id: string; total: number; created_at: string;
  quote: { factory_id: string; unit_price: number } | null;
  deal_installments: { seq: number; due_on: string; amount: number; status: string; share: number }[];
}

function BuyerDeals() {
  const L = useL();
  const m = useMoney();
  const { rows, loading, error } = useRows<DealRow>(() => supabase.from('deals')
    .select('id, total, created_at, quote:quotes(factory_id, unit_price), deal_installments(seq, due_on, amount, status, share)')
    .order('created_at', { ascending: false }));
  return (
    <>
      <PageHead eyebrow={L('liveEyebrow')} title={L('dealsTitle')} sub={L('dealsSub')} />
      {error && <div className="note mb"><i className="ri-error-warning-line" /><span>{error}</span></div>}
      {!loading && !rows.length && <Card><Empty text={L('dealsEmpty')} /></Card>}
      {rows.map((d) => (
        <Card key={d.id} className="mb" title={`${d.quote?.factory_id ?? ''} · ${m.money(d.total)}`} sub={m.date(d.created_at)}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>#</th><th>{L('due')}</th><th>{L('share')}</th><th>{L('amount')}</th><th>{L('status')}</th></tr></thead>
              <tbody>
                {[...d.deal_installments].sort((a, b) => a.seq - b.seq).map((i) => (
                  <tr key={i.seq}>
                    <td>{i.seq}</td>
                    <td>{m.date(i.due_on)}</td>
                    <td>{Math.round(i.share * 100)}%</td>
                    <td className="strong">{m.money(i.amount)}</td>
                    <td><Status value={i.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </>
  );
}

/* ── ambassador ─────────────────────────────────────────────────────── */

interface Wallet { pending: number; eligible: number; in_payout: number; paid: number; min_payout: number }
interface PayoutRow { id: number; amount: number; method: string; status: string; requested_at: string }
interface CommissionRow { id: number; sub_order_id: string; kind: string; rate: number; base: number; amount: number; state: string; unlock_at: string | null; created_at: string }

function AmbWallet() {
  const L = useL();
  const m = useMoney();
  const { toast, flash } = useFlash();
  const [method, setMethod] = useState('bank');
  const wallet = useRows<Wallet>(async () => {
    const r = await supabase.rpc('my_wallet');
    return { data: r.data ? [r.data as Wallet] : [], error: r.error };
  });
  const payouts = useRows<PayoutRow>(() => supabase.from('payouts').select('id, amount, method, status, requested_at').order('requested_at', { ascending: false }));
  const w = wallet.rows[0];

  const request = async () => {
    const { error } = await supabase.rpc('request_payout', { p_method: method });
    flash(error ? error.message : L('payoutRequested'));
    if (!error) {
      wallet.reload();
      payouts.reload();
    }
  };

  return (
    <>
      <PageHead eyebrow={L('liveEyebrow')} title={L('walletTitle')} sub={L('walletSub')} />
      <div className="grid c4 mb">
        <Stat icon="ri-time-line" num={m.money(w?.pending)} lbl={L('wPending')} />
        <Stat icon="ri-wallet-3-line" num={m.money(w?.eligible)} lbl={L('wEligible')} />
        <Stat icon="ri-loader-4-line" num={m.money(w?.in_payout)} lbl={L('wInPayout')} />
        <Stat icon="ri-check-double-line" num={m.money(w?.paid)} lbl={L('wPaid')} />
      </div>
      <Card className="mb" title={L('withdrawTitle')} sub={L('withdrawSub', { min: m.money(w?.min_payout ?? 200) })}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="field" style={{ marginBottom: 0, minWidth: 220 }}>
            <label htmlFor="po-method">{L('method')}</label>
            <select id="po-method" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="bank">{L('m_bank')}</option>
              <option value="wallet">{L('m_wallet')}</option>
            </select>
          </div>
          <button type="button" className="btn primary" onClick={request} disabled={!w || Number(w.eligible) < Number(w.min_payout)}>
            <i className="ri-bank-line" /> {L('withdraw')}
          </button>
        </div>
      </Card>
      <Card title={L('payoutsTitle')}>
        {!payouts.rows.length ? <Empty text={L('payoutsEmpty')} /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>#</th><th>{L('date')}</th><th>{L('amount')}</th><th>{L('method')}</th><th>{L('status')}</th></tr></thead>
              <tbody>
                {payouts.rows.map((p) => (
                  <tr key={p.id}><td>{p.id}</td><td>{m.date(p.requested_at)}</td><td className="strong">{m.money(p.amount)}</td><td>{L(`m_${p.method}`)}</td><td><Status value={p.status} /></td></tr>
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

function AmbCommissions() {
  const L = useL();
  const m = useMoney();
  const { rows, loading, error } = useRows<CommissionRow>(() => supabase.from('commissions')
    .select('id, sub_order_id, kind, rate, base, amount, state, unlock_at, created_at').order('created_at', { ascending: false }).limit(200));
  return (
    <>
      <PageHead eyebrow={L('liveEyebrow')} title={L('commissionsTitle')} sub={L('commissionsSub')} />
      <Card>
        {error && <div className="note"><i className="ri-error-warning-line" /><span>{error}</span></div>}
        {!loading && !rows.length ? <Empty text={L('commissionsEmpty')} /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>{L('order')}</th><th>{L('kind')}</th><th>{L('base')}</th><th>{L('rate')}</th><th>{L('amount')}</th><th>{L('unlock')}</th><th>{L('status')}</th></tr></thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td className="strong" dir="ltr">{c.sub_order_id}</td>
                    <td>{L(`k_${c.kind}`)}</td>
                    <td>{m.money(c.base)}</td>
                    <td>{(Number(c.rate) * 100).toFixed(1)}%</td>
                    <td className="strong accent">{m.money(c.amount)}</td>
                    <td className="small">{c.unlock_at ? m.date(c.unlock_at) : L('afterDelivery')}</td>
                    <td><Status value={c.state} /></td>
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

/* ── factory ────────────────────────────────────────────────────────── */

interface SubRow {
  id: string; order_id: string; goods: number; take: number; status: string; tracking_no: string | null; delivered_at: string | null; settled: boolean;
  order_items: { product_id: string; qty: number; unit_price: number; line_total: number }[];
}

function FactoryOrders() {
  const L = useL();
  const m = useMoney();
  const { rows, loading, error } = useRows<SubRow>(() => supabase.from('sub_orders')
    .select('id, order_id, goods, take, status, tracking_no, delivered_at, settled, order_items(product_id, qty, unit_price, line_total)')
    .order('id', { ascending: false }).limit(200));
  const owed = rows.filter((r) => r.settled).reduce((s, r) => s + Number(r.goods) - Number(r.take), 0);
  const held = rows.filter((r) => !r.settled && r.status !== 'refunded').reduce((s, r) => s + Number(r.goods) - Number(r.take), 0);
  return (
    <>
      <PageHead eyebrow={L('liveEyebrow')} title={L('fOrdersTitle')} sub={L('fOrdersSub')} />
      <div className="grid c2 mb">
        <Stat icon="ri-safe-2-line" num={m.money(held)} lbl={L('fHeld')} />
        <Stat icon="ri-bank-line" num={m.money(owed)} lbl={L('fReleased')} />
      </div>
      <Card>
        {error && <div className="note"><i className="ri-error-warning-line" /><span>{error}</span></div>}
        {!loading && !rows.length ? <Empty text={L('ordersEmpty')} /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>{L('order')}</th><th>{L('items')}</th><th>{L('goods')}</th><th>{L('take')}</th><th>{L('net')}</th><th>{L('tracking')}</th><th>{L('status')}</th></tr></thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td className="strong" dir="ltr">{s.id}</td>
                    <td className="small">{s.order_items.map((i) => `${i.product_id} × ${i.qty}`).join(' · ')}</td>
                    <td>{m.money(s.goods)}</td>
                    <td>−{m.num(s.take)}</td>
                    <td className="strong">{m.money(Number(s.goods) - Number(s.take))}</td>
                    <td className="small" dir="ltr">{s.tracking_no ?? '—'}</td>
                    <td><Status value={s.settled ? 'closed' : s.status} /></td>
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

function FactoryRfq() {
  const L = useL();
  const m = useMoney();
  const { toast, flash } = useFlash();
  const factories = useRows<{ id: string; name_ar: string; name_en: string; owner_id: string | null }>(async () => {
    const { data: s } = await supabase.auth.getSession();
    return supabase.from('factories').select('id, name_ar, name_en, owner_id').eq('owner_id', s.session?.user.id ?? '');
  });
  const rfqs = useRows<RfqRow>(() => supabase.from('rfqs')
    .select('id, qty, country, incoterm, status, created_at, product_id, category_id, quotes(id, factory_id, unit_price, lead_days, terms, valid_until, status)')
    .in('status', ['open', 'quoted']).order('created_at', { ascending: false }));
  const myFactory = factories.rows[0]?.id ?? '';
  const [draft, setDraft] = useState<Record<string, { unit: string; lead: string; terms: string; valid: string }>>({});
  const inTwoWeeks = useMemo(() => new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10), []);

  const submit = async (r: RfqRow) => {
    const d = draft[r.id] ?? { unit: '', lead: '', terms: '', valid: inTwoWeeks };
    const { error } = await supabase.rpc('submit_quote', {
      p_rfq: r.id, p_factory: myFactory, p_unit: Number(d.unit), p_lead: Number(d.lead), p_terms: d.terms, p_valid: d.valid || inTwoWeeks,
    });
    flash(error ? error.message : L('quoteSent'));
    if (!error) rfqs.reload();
  };

  const set = (id: string, k: 'unit' | 'lead' | 'terms' | 'valid', v: string) => setDraft((all) => ({
    ...all, [id]: { unit: '', lead: '', terms: '', valid: inTwoWeeks, ...all[id], [k]: v },
  }));

  return (
    <>
      <PageHead eyebrow={L('liveEyebrow')} title={L('fRfqTitle')} sub={L('fRfqSub')} />
      {!myFactory && !factories.loading && <div className="note mb"><i className="ri-information-line" /><span>{L('noFactory')}</span></div>}
      {!rfqs.loading && !rfqs.rows.length && <Card><Empty text={L('rfqEmpty')} /></Card>}
      {rfqs.rows.map((r) => {
        const mine = r.quotes.find((q) => q.factory_id === myFactory);
        return (
          <Card key={r.id} className="mb" title={`${r.product_id ?? r.category_id ?? ''} · ${m.num(r.qty)} ${L('units')}`} sub={`${r.country.toUpperCase()} · ${r.incoterm} · ${m.date(r.created_at)}`} action={mine ? <Pill tone="ok">{L('quoted', { price: m.money(mine.unit_price) })}</Pill> : undefined}>
            <div className="grid c4" style={{ alignItems: 'end' }}>
              <div className="field"><label htmlFor={`u-${r.id}`}>{L('unit')}</label><input id={`u-${r.id}`} type="number" dir="ltr" value={draft[r.id]?.unit ?? ''} onChange={(e) => set(r.id, 'unit', e.target.value)} /></div>
              <div className="field"><label htmlFor={`l-${r.id}`}>{L('lead')}</label><input id={`l-${r.id}`} type="number" dir="ltr" value={draft[r.id]?.lead ?? ''} onChange={(e) => set(r.id, 'lead', e.target.value)} /></div>
              <div className="field"><label htmlFor={`v-${r.id}`}>{L('validUntil')}</label><input id={`v-${r.id}`} type="date" dir="ltr" value={draft[r.id]?.valid ?? inTwoWeeks} onChange={(e) => set(r.id, 'valid', e.target.value)} /></div>
              <div className="field"><label htmlFor={`t-${r.id}`}>{L('terms')}</label><input id={`t-${r.id}`} value={draft[r.id]?.terms ?? ''} onChange={(e) => set(r.id, 'terms', e.target.value)} placeholder={L('termsPh')} /></div>
            </div>
            <button type="button" className="btn primary sm" disabled={!myFactory} onClick={() => submit(r)}>
              <i className="ri-send-plane-line" /> {mine ? L('updateQuote') : L('sendQuote')}
            </button>
          </Card>
        );
      })}
      <Toast message={toast} />
    </>
  );
}

/* ── admin ──────────────────────────────────────────────────────────── */

interface AdminPayoutRow { id: number; amount: number; method: string; status: string; requested_at: string; name: string; country: string | null; destination: string | null }

function AdminFinance() {
  const L = useL();
  const m = useMoney();
  const { toast, flash } = useFlash();
  const { rows, reload } = useRows<AdminPayoutRow>(() => supabase.from('admin_payouts').select('*').order('requested_at', { ascending: false }).limit(100));
  const decide = async (id: number, decision: string) => {
    const { error } = await supabase.rpc('admin_decide_payout', { p_id: id, p_decision: decision });
    flash(error ? error.message : L('payoutUpdated'));
    if (!error) reload();
  };
  return (
    <>
      <FinanceLedger />
      <Card className="mb" title={L('payoutQueue')} sub={L('payoutQueueSub')}>
        {!rows.length ? <Empty text={L('payoutsEmpty')} /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>#</th><th>{L('ambassador')}</th><th>{L('amount')}</th><th>{L('method')}</th><th>{L('date')}</th><th>{L('status')}</th><th /></tr></thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.name}<div className="s small muted">{p.country ?? ''}</div></td>
                    <td className="strong">{m.money(p.amount)}</td>
                    <td>{L(`m_${p.method}`)}<div className="s small muted" dir="ltr">{p.destination ?? L('noDestination')}</div></td>
                    <td className="small">{m.date(p.requested_at)}</td>
                    <td><Status value={p.status} /></td>
                    <td><div className="row-actions">
                      {p.status === 'requested' && <button type="button" className="btn primary sm" onClick={() => decide(p.id, 'approved')}>{L('approve')}</button>}
                      {p.status === 'approved' && <button type="button" className="btn primary sm" onClick={() => decide(p.id, 'sent')}>{L('markSent')}</button>}
                      {(p.status === 'requested' || p.status === 'approved') && <button type="button" className="btn ghost sm" onClick={() => decide(p.id, 'rejected')}>{L('reject')}</button>}
                    </div></td>
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

/* Live screens by panel and view key. */
export const liveViews: Record<string, Record<string, FunctionComponent>> = {
  buyer: { orders: BuyerOrders, quotes: BuyerQuotes, deals: BuyerDeals },
  ambassador: { wallet: AmbWallet, attributed: AmbCommissions },
  factory: { 'f-orders': FactoryOrders, 'f-rfq': FactoryRfq },
  admin: { 'admin-finance': AdminFinance },
};

/* Views that already read the database themselves. */
/* (tickets are the buyer's own submissions kept in this browser.) */
export const selfLiveViews = new Set(['admin-accounts', 'admin-content', 'admin-platform', 'leader', 'tickets']);

export function IllustrativeNote() {
  const L = useL();
  return (
    <div className="note mb" role="note">
      <i className="ri-flask-line" />
      <span>{L('illustrative')}</span>
    </div>
  );
}
