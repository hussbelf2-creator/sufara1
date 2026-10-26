import { useTranslation } from 'react-i18next';
import { formatSAR } from '@/pages/shop/lib/format';
import { useCart } from '@/pages/shop/components/CartProvider';
import PromoBox from '@/pages/shop/components/PromoBox';

interface Props {
  count: number;
  subtotal: number;
  savings: number;
  onCheckout: () => void;
}

/* The order summary beside the cart lines. */
export default function CartSummary({ count, subtotal, savings, onCheckout }: Props) {
  const { t } = useTranslation();
  const { discount, freeShipping } = useCart();
  const total = Math.max(0, subtotal - discount);

  return (
    <div className="st-sum-card">
      <h3>{t('shop.cart.summaryTitle')}</h3>

      <div className="row">
        <span>{t('shop.cart.pieces')}</span>
        <b>{count.toLocaleString('en-US')}</b>
      </div>
      <div className="row">
        <span>{t('shop.cart.subtotal')}</span>
        <b>{formatSAR(subtotal)}</b>
      </div>
      {savings > 0 && (
        <div className="row save">
          <span>{t('shop.cart.wholesaleSavings')}</span>
          <b>- {formatSAR(savings)}</b>
        </div>
      )}
      {discount > 0 && (
        <div className="row save">
          <span>{t('shop.cart.promoDiscount')}</span>
          <b>- {formatSAR(discount)}</b>
        </div>
      )}

      <PromoBox />

      <div className="sep" />

      <div className="row">
        <span>{t('shop.cart.shippingCustoms')}</span>
        <b>{freeShipping ? t('shop.cart.freeShip') : t('shop.cart.calcAtCheckout')}</b>
      </div>

      <div className="row">
        <span>{t('shop.cart.vat')}</span>
        <b>{t('shop.cart.vatAtCheckout')}</b>
      </div>
      <p className="hint">
        <i className="ri-percent-line" /> {t('shop.cart.vatNote')}
      </p>

      <div className="sep" />

      <div className="row total">
        <span>{t('shop.cart.total')}</span>
        <b>{formatSAR(total)}</b>
      </div>

      <button type="button" className="st-btn primary block" onClick={onCheckout}>
        <i className="ri-send-plane-line" /> {t('shop.cart.checkout')}
      </button>
      <p className="hint">
        {t('shop.cart.hint')}
      </p>

      <ul className="trust">
        <li><i className="ri-shield-check-line" /> {t('shop.cart.trustEscrow')}</li>
        <li><i className="ri-truck-line" /> {t('shop.cart.trustUnified')}</li>
        <li><i className="ri-refund-2-line" /> {t('shop.cart.trustReplace')}</li>
      </ul>
    </div>
  );
}