import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StoreNav from '@/components/feature/StoreNav';
import StoreFooter from '@/components/feature/StoreFooter';
import type { Order } from '@/pages/shop/types';
import { useCart } from '@/pages/shop/components/CartProvider';
import CheckoutForm from '@/pages/shop/checkout/components/CheckoutForm';
import CheckoutSuccess from '@/pages/shop/checkout/components/CheckoutSuccess';
import { initPanels } from '@/pages/home/lib/panels';

export default function CheckoutPage() {
  const { t } = useTranslation();
  const { items, count, subtotal, savings } = useCart();
  const [placed, setPlaced] = useState<Order | null>(null);

  useEffect(() => initPanels(), []);

  const onDone = (order: Order) => {
    setPlaced(order);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="st-shell">
      <StoreNav />

      <main className="st-co">
        <div className="st-wrap">
          <nav className="st-crumbs" aria-label={t('shop.crumbs.checkout')}>
            <Link to="/">{t('shop.crumbs.home')}</Link>
            <i className="ri-arrow-left-s-line" />
            <Link to="/products">{t('shop.crumbs.shop')}</Link>
            <i className="ri-arrow-left-s-line" />
            <Link to="/cart">{t('shop.crumbs.cart')}</Link>
            <i className="ri-arrow-left-s-line" />
            <span>{t('shop.crumbs.checkout')}</span>
          </nav>

          <div className="st-head">
            <div>
              <p className="eyebrow">{t('shop.checkout.eyebrow')}</p>
              <h1>{t('shop.checkout.title')}</h1>
            </div>
          </div>

          {placed ? (
            <CheckoutSuccess order={placed} />
          ) : items.length === 0 ? (
            <div className="st-empty">
              <i className="ri-shopping-bag-3-line" />
              <div className="t">{t('shop.checkout.emptyTitle')}</div>
              <p>{t('shop.checkout.emptyText')}</p>
              <Link className="st-btn primary" to="/products">
                <i className="ri-store-2-line" /> {t('shop.checkout.browse')}
              </Link>
            </div>
          ) : (
            <CheckoutForm
              items={items}
              count={count}
              subtotal={subtotal}
              savings={savings}
              onDone={onDone}
            />
          )}
        </div>
      </main>

      <StoreFooter />
    </div>
  );
}