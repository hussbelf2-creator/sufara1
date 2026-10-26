import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StoreNav from '@/components/feature/StoreNav';
import StoreFooter from '@/components/feature/StoreFooter';
import type { Order, OrderReturn } from '@/pages/shop/types';
import { useCatalog } from '@/hooks/useCatalog';
import { loadOrders } from '@/pages/shop/lib/ordersStore';
import { formatDate, formatSAR } from '@/pages/shop/lib/format';
import {
  applyLocalReturn, buildReturn, creditTotals, RESTOCKING_RATE, saveReturn,
} from '@/pages/shop/lib/returns';
import { initPanels } from '@/pages/home/lib/panels';

const REASONS = ['damaged', 'size', 'notAsDescribed', 'other'];

/* Buyer-facing return request. The shopper picks the units going back and a
   reason, sees the exact credit before submitting, and on submit the case is
   recorded together with an automatically issued tax credit note — the same
   note that then appears under the order's documents. */
export default function ReturnRequestPage() {
  const { t } = useTranslation();
  const { sampleOrders } = useCatalog();
  const { id = '' } = useParams();

  const [order, setOrder] = useState<Order | null>(null);
  const [ready, setReady] = useState(false);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('damaged');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [issued, setIssued] = useState<OrderReturn | null>(null);

  useEffect(() => initPanels(), []);

  useEffect(() => {
    let alive = true;
    window.scrollTo(0, 0);
    loadOrders()
      .then((stored) => {
        if (!alive) return;
        const all = [...stored, ...(sampleOrders as Order[])].map(applyLocalReturn);
        setOrder(all.find((o) => o.id === id) ?? null);
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, [id, sampleOrders]);

  const selected = useMemo(
    () => Object.entries(qty)
      .filter(([, n]) => n > 0)
      .map(([lineId, n]) => ({ id: lineId, qty: n })),
    [qty],
  );
  const totals = useMemo(
    () => (order ? creditTotals(order, selected) : { goods: 0, vat: 0, fee: 0, total: 0, rate: 0 }),
    [order, selected],
  );

  const step = (lineId: string, max: number, delta: number) => {
    setError('');
    setQty((prev) => {
      const next = Math.max(0, Math.min(max, (prev[lineId] ?? 0) + delta));
      return { ...prev, [lineId]: next };
    });
  };

  const submit = () => {
    if (!order) return;
    if (selected.length === 0) {
      setError(t('orders.returns.errNoItems'));
      return;
    }
    const ret = buildReturn(order, selected, reason, note);
    saveReturn(order.id, ret);
    setIssued(ret);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const existing = issued ?? order?.returnInfo ?? null;

  return (
    <div className="st-shell">
      <StoreNav />

      <main className="st-ret">
        <div className="st-wrap">
          <nav className="st-crumbs" aria-label={t('orders.crumbs.aria')}>
            <Link to="/">{t('orders.crumbs.home')}</Link>
            <i className="ri-arrow-left-s-line" />
            <Link to="/orders">{t('orders.crumbs.orders')}</Link>
            <i className="ri-arrow-left-s-line" />
            {order && (
              <>
                <Link to={`/orders/${order.id}`}>{order.id}</Link>
                <i className="ri-arrow-left-s-line" />
              </>
            )}
            <span>{t('orders.returns.crumb')}</span>
          </nav>

          {!ready ? (
            <div className="st-empty">
              <i className="ri-loader-4-line" />
              <div className="t">{t('orders.detail.loading')}</div>
            </div>
          ) : !order ? (
            <div className="st-empty">
              <i className="ri-file-warning-line" />
              <div className="t">{t('orders.detail.notFoundTitle')}</div>
              <p>{t('orders.detail.notFoundText')}</p>
              <Link className="st-btn primary" to="/orders" style={{ marginTop: 18 }}>
                <i className="ri-file-list-3-line" /> {t('orders.detail.allOrders')}
              </Link>
            </div>
          ) : existing ? (
            <section className="st-ret-done">
              <span className="ic"><i className="ri-refund-2-line" /></span>
              <p className="eyebrow">{t('orders.returns.alreadyEyebrow')}</p>
              <h1>{t('orders.returns.alreadyTitle')}</h1>
              <p className="sub">{t('orders.returns.alreadyText', { no: existing.creditNoteNo })}</p>

              <div className="st-ret-donegrid">
                <div><span>{t('orders.returns.caseNo')}</span><b>{existing.id}</b></div>
                <div><span>{t('orders.returns.creditNo')}</span><b>{existing.creditNoteNo}</b></div>
                <div><span>{t('orders.returns.requestedAt')}</span><b>{formatDate(existing.requestedAt)}</b></div>
                <div><span>{t('orders.returns.units')}</span><b>{existing.items.reduce((s, it) => s + it.qty, 0)}</b></div>
              </div>

              <div className="st-ret-doneacts">
                <Link className="st-btn primary" to={`/orders/${order.id}`}>
                  <i className="ri-printer-line" /> {t('orders.returns.viewCredit')}
                </Link>
                <Link className="st-btn ghost" to="/orders">
                  <i className="ri-arrow-right-line" /> {t('orders.returns.backToOrders')}
                </Link>
              </div>
              <p className="fine">{t('orders.returns.doneFine')}</p>
            </section>
          ) : (
            <>
              <div className="st-head">
                <div>
                  <p className="eyebrow">{t('orders.returns.eyebrow')}</p>
                  <h1>
                    {t('orders.returns.title')} <span className="accent">{order.id}</span>
                  </h1>
                  <p className="sub">{t('orders.returns.sub')}</p>
                </div>
                <Link className="st-btn ghost" to={`/orders/${order.id}`}>
                  <i className="ri-arrow-right-line" /> {t('orders.returns.backToOrder')}
                </Link>
              </div>

              <div className="st-ret-grid">
                <div className="st-ret-main">
                  <section className="st-ret-card">
                    <header className="st-ret-head">
                      <div>
                        <h3>{t('orders.returns.itemsTitle')}</h3>
                        <p className="sub">{t('orders.returns.itemsSub')}</p>
                      </div>
                      <span className="st-ret-count">
                        {t('orders.returns.selected', { count: selected.reduce((s, it) => s + it.qty, 0) })}
                      </span>
                    </header>

                    <ul className="st-ret-items">
                      {order.lines.map((line) => {
                        const n = qty[line.id] ?? 0;
                        return (
                          <li key={line.id} className={n > 0 ? 'is-on' : ''}>
                            <span className="pic">
                              <img src={line.image} alt={line.name} width={64} height={64} />
                            </span>
                            <div className="body">
                              <b>{line.name}</b>
                              <span className="fac"><i className="ri-store-3-line" /> {line.factoryName}</span>
                              <span className="meta">
                                {formatSAR(line.unit)} · {t('orders.returns.ordered', { count: line.qty })}
                              </span>
                            </div>
                            <div className="st-ret-qty">
                              <button
                                type="button"
                                aria-label={t('orders.returns.decrease')}
                                onClick={() => step(line.id, line.qty, -1)}
                                disabled={n === 0}
                              >
                                <i className="ri-subtract-line" />
                              </button>
                              <span>{n}</span>
                              <button
                                type="button"
                                aria-label={t('orders.returns.increase')}
                                onClick={() => step(line.id, line.qty, 1)}
                                disabled={n >= line.qty}
                              >
                                <i className="ri-add-line" />
                              </button>
                            </div>
                            <span className="amt">{n > 0 ? formatSAR(line.unit * n) : '—'}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </section>

                  <section className="st-ret-card">
                    <h3>{t('orders.returns.reasonTitle')}</h3>
                    <p className="sub">{t('orders.returns.reasonSub')}</p>
                    <div className="st-ret-reasons" role="radiogroup" aria-label={t('orders.returns.reasonTitle')}>
                      {REASONS.map((r) => (
                        <button
                          key={r}
                          type="button"
                          role="radio"
                          aria-checked={reason === r}
                          className={`st-ret-reason${reason === r ? ' is-on' : ''}`}
                          onClick={() => setReason(r)}
                        >
                          <i className={reason === r ? 'ri-radio-button-line' : 'ri-checkbox-blank-circle-line'} />
                          <span>{t(`orders.credit.reason${r.charAt(0).toUpperCase()}${r.slice(1)}`)}</span>
                        </button>
                      ))}
                    </div>

                    <label className="st-ret-note">
                      <span>{t('orders.returns.noteTitle')}</span>
                      <textarea
                        value={note}
                        maxLength={500}
                        rows={4}
                        placeholder={t('orders.returns.notePlaceholder')}
                        onChange={(e) => setNote(e.target.value)}
                      />
                      <em>{t('orders.returns.noteHint', { count: note.length })}</em>
                    </label>
                  </section>
                </div>

                <aside className="st-ret-aside">
                  <section className="st-ret-card is-sum">
                    <h3>{t('orders.returns.summaryTitle')}</h3>
                    <p className="sub">{t('orders.returns.summarySub')}</p>

                    <div className="st-ret-rows">
                      <div className="row"><span>{t('orders.returns.goods')}</span><b>{formatSAR(totals.goods)}</b></div>
                      <div className="row">
                        <span>{t('orders.returns.vat', { rate: Math.round(totals.rate * 100) })}</span>
                        <b>{totals.vat > 0 ? formatSAR(totals.vat) : t('orders.invoice.vatZero')}</b>
                      </div>
                      <div className="row">
                        <span>{t('orders.returns.restocking', { pct: Math.round(RESTOCKING_RATE * 100) })}</span>
                        <b className="neg">{totals.fee > 0 ? `- ${formatSAR(totals.fee)}` : '—'}</b>
                      </div>
                      <div className="row total"><span>{t('orders.returns.total')}</span><b>{formatSAR(totals.total)}</b></div>
                    </div>

                    {error && (
                      <p className="st-ret-err" role="alert">
                        <i className="ri-error-warning-line" /> {error}
                      </p>
                    )}

                    <button type="button" className="st-btn primary block" onClick={submit}>
                      <i className="ri-refund-2-line" /> {t('orders.returns.submit')}
                    </button>

                    <p className="st-ret-policy">
                      <i className="ri-information-line" /> {t('orders.returns.policy')}
                    </p>
                  </section>

                  <section className="st-ret-card">
                    <h3>{t('orders.returns.whatNext')}</h3>
                    <ul className="st-ret-steps">
                      <li><i className="ri-file-text-line" /><span>{t('orders.returns.next1')}</span></li>
                      <li><i className="ri-shield-check-line" /><span>{t('orders.returns.next2')}</span></li>
                      <li><i className="ri-truck-line" /><span>{t('orders.returns.next3')}</span></li>
                    </ul>
                  </section>
                </aside>
              </div>
            </>
          )}
        </div>
      </main>

      <StoreFooter />
    </div>
  );
}