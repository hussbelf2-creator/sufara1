import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StoreNav from '@/components/feature/StoreNav';
import StoreFooter from '@/components/feature/StoreFooter';
import type { Order } from '@/pages/shop/types';
import { useCatalog } from '@/hooks/useCatalog';
import { loadOrders, ORDER_STEPS, stepIndex } from '@/pages/shop/lib/ordersStore';
import { applyLocalReturn } from '@/pages/shop/lib/returns';
import { formatSAR, formatDateTime } from '@/pages/shop/lib/format';
import { cartonCount, isAir } from '@/pages/shop/lib/tracking';
import { useShipmentFeed } from '@/hooks/useShipmentFeed';
import TrackingPanel from '../components/TrackingPanel';
import OrderDocuments from '../components/OrderDocuments';
import { initPanels } from '@/pages/home/lib/panels';

const statusTone: Record<string, string> = {
  confirmed: 'tone-confirmed',
  processing: 'tone-processing',
  shipped: 'tone-shipped',
  transit: 'tone-transit',
  delivered: 'tone-delivered',
};

/* Full order detail: live shipment tracking, the itemised order, and the
   printable commercial invoice + shipping documents. */
export default function OrderDetailPage() {
  const { t } = useTranslation();
  const { sampleOrders } = useCatalog();
  const { id = '' } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);

  const feed = useShipmentFeed();
  const shipment = order ? feed[order.tracking] : undefined;

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

  const activeStep = useMemo(() => (order ? stepIndex(order.status) : 1), [order]);

  const copyTracking = async () => {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(order.tracking);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="st-shell">
      <StoreNav />

      <main className="st-od">
        <div className="st-wrap">
          <nav className="st-crumbs" aria-label={t('orders.crumbs.aria')}>
            <Link to="/">{t('orders.crumbs.home')}</Link>
            <i className="ri-arrow-left-s-line" />
            <Link to="/orders">{t('orders.crumbs.orders')}</Link>
            <i className="ri-arrow-left-s-line" />
            <span>{order ? order.id : t('orders.crumbs.order')}</span>
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
          ) : (
            <>
              <div className="st-head">
                <div>
                  <p className="eyebrow">{t('orders.detail.eyebrow')}</p>
                  <h1>
                    {t('orders.detail.titleOrder')} <span className="accent">{order.id}</span>
                  </h1>
                  <div className="st-od-sub">
                    <span className={`st-order-status ${statusTone[order.status] ?? 'tone-processing'}`}>
                      <i className={ORDER_STEPS[activeStep].icon} /> {t(`orders.steps.${ORDER_STEPS[activeStep].id}`)}
                    </span>
                    <span className="date"><i className="ri-calendar-line" /> {formatDateTime(order.createdAt)}</span>
                  </div>
                </div>
                <div className="st-od-acts">
                  {order.status === 'delivered' && (
                    <Link className="st-btn ghost" to={`/orders/${order.id}/return`}>
                      <i className="ri-refund-2-line" /> {t('orders.detail.requestReturn')}
                    </Link>
                  )}
                  <Link className="st-btn ghost" to="/orders">
                    <i className="ri-arrow-right-line" /> {t('orders.detail.back')}
                  </Link>
                </div>
              </div>

              <div className="st-od-grid">
                <div className="st-od-main">
                  <TrackingPanel order={order} />

                  <section className="st-od-card">
                    <h3>{t('orders.detail.itemsTitle')} <span className="n">({order.lines.length})</span></h3>
                    <ul className="st-od-items">
                      {order.lines.map((l) => (
                        <li key={l.id}>
                          <Link className="pic" to={`/products/${l.id}`} title={l.name}>
                            <img src={l.image} alt={l.name} width={64} height={64} />
                          </Link>
                          <div className="body">
                            <Link className="nm" to={`/products/${l.id}`}>{l.name}</Link>
                            <span className="fac"><i className="ri-store-3-line" /> {l.factoryName}</span>
                          </div>
                          <div className="qty">
                            <span className="u">{formatSAR(l.unit)}</span>
                            <span className="q">× {l.qty.toLocaleString('en-US')}</span>
                          </div>
                          <span className="pr">{formatSAR(l.total)}</span>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <OrderDocuments order={order} />
                </div>

                <aside className="st-od-aside">
                  <section className="st-od-card">
                    <h3>{t('orders.detail.deliveryTitle')}</h3>
                    <div className="st-od-kv"><span className="k">{t('orders.detail.recipient')}</span><span className="v">{order.customerName}</span></div>
                    <div className="st-od-kv"><span className="k">{t('orders.detail.destination')}</span><span className="v">{order.city}، {order.country}</span></div>
                    <div className="st-od-kv"><span className="k">{t('orders.detail.port')}</span><span className="v">{order.port}</span></div>
                    <div className="st-od-kv"><span className="k">{t('orders.detail.method')}</span><span className="v">{order.shippingMethod}</span></div>
                    {shipment && (
                      <div className="st-od-kv"><span className="k">{t('orders.detail.carrier')}</span><span className="v">{shipment.carrier}</span></div>
                    )}
                    <div className="st-od-kv"><span className="k">{t('orders.detail.incoterm')}</span><span className="v">{order.incoterm}</span></div>
                    {order.customsParty && (
                      <div className="st-od-kv"><span className="k">{t('orders.detail.customsParty')}</span><span className="v">{order.customsParty}</span></div>
                    )}
                    <div className="st-od-kv"><span className="k">{t('orders.detail.eta')}</span><span className="v">{order.eta || '—'}</span></div>
                    <div className="st-od-kv"><span className="k">{t('orders.detail.weight')}</span><span className="v">{t('orders.detail.weightValue', { value: order.weightKg.toLocaleString('en-US') })}</span></div>
                    <div className="st-od-kv"><span className="k">{t('orders.detail.cartons')}</span><span className="v">{t('orders.detail.cartonsValue', { count: cartonCount(order), kind: isAir(order.shippingMethod) ? t('orders.detail.kindAir') : t('orders.detail.kindSea') })}</span></div>
                  </section>

                  <section className="st-od-card">
                    <h3>{t('orders.detail.trackingTitle')}</h3>
                    <div className="st-od-track">
                      <i className="ri-barcode-line" />
                      <b>{order.tracking}</b>
                    </div>
                    <button type="button" className="st-btn ghost block" onClick={copyTracking}>
                      <i className={copied ? 'ri-check-line' : 'ri-file-copy-line'} />
                      {copied ? t('orders.detail.copiedTracking') : t('orders.detail.copyTracking')}
                    </button>
                  </section>

                  <section className="st-od-card">
                    <h3>{t('orders.detail.valueTitle')}</h3>
                    <div className="st-od-totals">
                      <div className="row"><span>{t('orders.card.subtotal')}</span><b>{formatSAR(order.subtotal)}</b></div>
                      {order.discount > 0 && (
                        <div className="row save"><span>{t('orders.card.discount')}{order.promoCode ? ` (${order.promoCode})` : ''}</span><b>- {formatSAR(order.discount)}</b></div>
                      )}
                      <div className="row"><span>{t('orders.card.shipping')}</span><b>{order.shippingCost === 0 ? t('orders.card.free') : formatSAR(order.shippingCost)}</b></div>
                      <div className="row"><span>{t('orders.card.customs')}</span><b>{formatSAR(order.customs)}</b></div>
                      {typeof order.vat === 'number' && order.vat > 0 && (
                        <div className="row"><span>{t('orders.card.vat')}</span><b>{formatSAR(order.vat)}</b></div>
                      )}
                      <div className="row total"><span>{t('orders.card.total')}</span><b>{formatSAR(order.total)}</b></div>
                    </div>
                    {order.invoiceNo && (
                      <p className="st-od-paynote">
                        <i className="ri-file-text-line" /> {t('orders.card.taxInvoice', { no: order.invoiceNo })}
                      </p>
                    )}
                  </section>

                  <section className="st-od-card pay">
                    <h3><i className="ri-bank-card-line" /> {t('orders.detail.paymentTitle')}</h3>
                    <p className="st-od-paynote">{t('orders.detail.paymentNote')}</p>
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