import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Order } from '@/pages/shop/types';
import { formatSAR, formatDateTime } from '@/pages/shop/lib/format';
import { ORDER_STEPS, stepIndex } from '@/pages/shop/lib/ordersStore';

const statusTone: Record<string, string> = {
  confirmed: 'tone-confirmed',
  processing: 'tone-processing',
  shipped: 'tone-shipped',
  transit: 'tone-transit',
  delivered: 'tone-delivered',
};

/* A single order in the "My Orders" list: status, tracking number, the
   fulfilment progress and a collapsible cost breakdown. */
export default function OrderCard({ order }: { order: Order }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const activeStep = stepIndex(order.status);
  const tone = statusTone[order.status] ?? 'tone-processing';
  const extra = order.lines.length > 4 ? order.lines.length - 4 : 0;

  const copyTracking = async () => {
    try {
      await navigator.clipboard.writeText(order.tracking);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <article className="st-order">
      <header className="st-order-head">
        <div className="id">
          <span className="lbl">{t('orders.card.orderNo')}</span>
          <b>{order.id}</b>
          <span className="date">{formatDateTime(order.createdAt)}</span>
        </div>
        <span className={`st-order-status ${tone}`}>
          <i className={ORDER_STEPS[activeStep].icon} /> {t(`orders.steps.${ORDER_STEPS[activeStep].id}`)}
        </span>
      </header>

      <div className="st-order-track">
        <div className="box">
          <span className="lbl"><i className="ri-barcode-line" /> {t('orders.card.trackingNo')}</span>
          <b>{order.tracking}</b>
        </div>
        <button type="button" className="copy" onClick={copyTracking}>
          <i className={copied ? 'ri-check-line' : 'ri-file-copy-line'} />
          {copied ? t('orders.card.copied') : t('orders.card.copy')}
        </button>
        <div className="box">
          <span className="lbl"><i className="ri-truck-line" /> {t('orders.card.method')}</span>
          <b>{order.shippingMethod}</b>
        </div>
        <div className="box">
          <span className="lbl"><i className="ri-map-pin-2-line" /> {t('orders.card.destination')}</span>
          <b>{order.country} · {order.city}</b>
        </div>
      </div>

      <ol className="st-order-steps">
        {ORDER_STEPS.map((s, i) => (
          <li key={s.id} className={i < activeStep ? 'done' : i === activeStep ? 'now' : ''}>
            <span className="dot"><i className={s.icon} /></span>
            <span className="t">{t(`orders.steps.${s.id}`)}</span>
            {i < ORDER_STEPS.length - 1 && <span className="bar" />}
          </li>
        ))}
      </ol>

      <div className="st-order-items">
        {order.lines.slice(0, 4).map((l) => (
          <Link className="thumb" key={l.id} to={`/products/${l.id}`} title={l.name}>
            <img src={l.image} alt={l.name} width={64} height={64} />
            <span className="q">{l.qty}</span>
          </Link>
        ))}
        {extra > 0 && <span className="more">+{extra}</span>}
        <div className="meta">
          <span>{t('orders.card.pieces', { count: order.count, lines: order.lines.length })}</span>
        </div>
      </div>

      {open && (
        <div className="st-order-details">
          <ul className="items">
            {order.lines.map((l) => (
              <li key={l.id}>
                <span className="nm">{l.name}</span>
                <span className="qty">× {l.qty.toLocaleString('en-US')}</span>
                <span className="pr">{formatSAR(l.total)}</span>
              </li>
            ))}
          </ul>
          <div className="totals">
            <div className="row"><span>{t('orders.card.subtotal')}</span><b>{formatSAR(order.subtotal)}</b></div>
            {order.discount > 0 && (
              <div className="row save"><span>{t('orders.card.discount')}{order.promoCode ? ` (${order.promoCode})` : ''}</span><b>- {formatSAR(order.discount)}</b></div>
            )}
            <div className="row"><span>{t('orders.card.shipping')}</span><b>{order.shippingCost === 0 ? t('orders.card.free') : formatSAR(order.shippingCost)}</b></div>
            <div className="row"><span>{t('orders.card.customs')}</span><b>{formatSAR(order.customs)}</b></div>
            <div className="row total"><span>{t('orders.card.total')}</span><b>{formatSAR(order.total)}</b></div>
          </div>
          <div className="ship">
            <i className="ri-information-line" /> {t('orders.card.portLine', { port: order.port, incoterm: order.incoterm })}
          </div>
        </div>
      )}

      <footer className="st-order-foot">
        <div className="amts">
          <span>{t('orders.card.total')}</span>
          <b>{formatSAR(order.total)}</b>
        </div>
        <div className="st-order-acts">
          <button type="button" className="st-btn ghost sm" onClick={() => setOpen((v) => !v)}>
            {open ? t('orders.card.hide') : t('orders.card.show')}
            <i className={open ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} />
          </button>
          {order.status === 'delivered' && !order.returnInfo && (
            <Link className="st-btn ghost sm" to={`/orders/${order.id}/return`}>
              <i className="ri-refund-2-line" /> {t('orders.card.requestReturn')}
            </Link>
          )}
          {order.returnInfo && (
            <Link className="st-btn ghost sm" to={`/orders/${order.id}`}>
              <i className="ri-file-shield-2-line" /> {t('orders.card.creditIssued', { no: order.returnInfo.creditNoteNo })}
            </Link>
          )}
          <Link className="st-btn primary sm" to={`/orders/${order.id}`}>
            <i className="ri-truck-line" /> {t('orders.card.track')}
          </Link>
        </div>
      </footer>
    </article>
  );
}