import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Order } from '@/pages/shop/types';
import { formatSAR } from '@/pages/shop/lib/format';

/* Confirmation screen shown right after an order is placed. */
export default function CheckoutSuccess({ order }: { order: Order }) {
  const { t } = useTranslation();

  return (
    <div className="st-co-done">
      <div className="ic"><i className="ri-checkbox-circle-line" /></div>
      <h2>{t('shop.checkout.successTitle')}</h2>
      <p>
        {t('shop.checkout.successBody1')} <strong>{order.count.toLocaleString('en-US')} {t('shop.checkout.successBody2')}</strong>{' '}
        {t('shop.checkout.successBody3')} <strong>{order.id}</strong>{t('shop.checkout.successBody4')}
      </p>

      {order.paymentMode === 'transfer' && (
        <div className="st-co-note warn" role="status">
          <i className="ri-bank-line" />
          <span>{t('shop.checkout.transferNote', { id: order.id, amount: formatSAR(order.chargedSar ?? order.total) })}</span>
        </div>
      )}

      <div className="st-done-track">
        <div className="k"><i className="ri-barcode-line" /> {t('shop.checkout.trackingLabel')}</div>
        <div className="v">{order.tracking}</div>
        <div className="s">
          <i className="ri-truck-line" /> {order.shippingMethod} · {order.country}
        </div>
      </div>

      {order.ambassadorName && (
        <div className="st-co-attr">
          <span className="ic"><i className="ri-user-star-line" /></span>
          <div className="body">
            <div className="t">{t('shop.checkout.attrBadgeTitle')}</div>
            <div className="s">{t('shop.checkout.attrBadgeText', { name: order.ambassadorName })}</div>
          </div>
          {order.promoCode && (
            <span className="code"><i className="ri-coupon-3-line" /> {order.promoCode}</span>
          )}
        </div>
      )}

      <div className="st-done-summary">
        <div className="row"><span>{t('shop.checkout.sProducts')}</span><b>{formatSAR(order.subtotal)}</b></div>
        {order.discount > 0 && (
          <div className="row save"><span>{t('shop.checkout.sDiscount')}</span><b>- {formatSAR(order.discount)}</b></div>
        )}
        <div className="row"><span>{t('shop.checkout.sShipping')}</span><b>{order.shippingCost === 0 ? t('shop.checkout.sFree') : formatSAR(order.shippingCost)}</b></div>
        <div className="row"><span>{t('shop.checkout.sCustoms')}</span><b>{formatSAR(order.customs)}</b></div>
        {order.vat ? (
          <div className="row"><span>{t('shop.checkout.sVat')}</span><b>{formatSAR(order.vat)}</b></div>
        ) : (
          <div className="row"><span>{t('shop.checkout.sVat')}</span><b>{t('shop.checkout.rVatZero')}</b></div>
        )}
        <div className="row total"><span>{t('shop.checkout.sTotal')}</span><b>{formatSAR(order.total)}</b></div>
      </div>

      <div className="st-co-note">
        <i className="ri-file-text-line" />
        <span>
          {t('shop.checkout.invNo', { no: order.invoiceNo ?? '—' })}
          {order.incoterm ? ` · ${order.incoterm}` : ''}
          {order.customsParty ? ` — ${order.customsParty}` : ''}
        </span>
      </div>

      <div className="st-co-note">
        <i className="ri-shield-check-line" />
        <span>{t('shop.checkout.successNote')}</span>
      </div>

      <div className="acts">
        <Link className="st-btn primary" to={`/orders/${order.id}`}>
          <i className="ri-truck-line" /> {t('shop.checkout.trackBtn')}
        </Link>
        <Link className="st-btn ghost" to="/orders">
          <i className="ri-file-list-3-line" /> {t('shop.checkout.ordersBtn')}
        </Link>
        <Link className="st-btn ghost" to="/products">
          <i className="ri-store-2-line" /> {t('shop.checkout.shopBtn')}
        </Link>
      </div>
    </div>
  );
}