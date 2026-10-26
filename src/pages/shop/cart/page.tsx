import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StoreNav from '@/components/feature/StoreNav';
import StoreFooter from '@/components/feature/StoreFooter';
import { useCart } from '@/pages/shop/components/CartProvider';
import CartRow from '@/pages/shop/cart/components/CartRow';
import CartSummary from '@/pages/shop/cart/components/CartSummary';
import { initPanels } from '@/pages/home/lib/panels';

export default function CartPage() {
  const { t } = useTranslation();
  const { items, count, subtotal, savings, setQty, remove, clear } = useCart();
  const navigate = useNavigate();

  useEffect(() => initPanels(), []);

  const onCheckout = () => navigate('/checkout');

  return (
    <div className="st-shell">
      <StoreNav />

      <main className="st-cart">
        <div className="st-wrap">
          <nav className="st-crumbs" aria-label={t('shop.crumbs.cart')}>
            <Link to="/">{t('shop.crumbs.home')}</Link>
            <i className="ri-arrow-left-s-line" />
            <Link to="/products">{t('shop.crumbs.shop')}</Link>
            <i className="ri-arrow-left-s-line" />
            <span>{t('shop.crumbs.cart')}</span>
          </nav>

          <div className="st-head">
            <div>
              <p className="eyebrow">{t('shop.cart.eyebrow')}</p>
              <h1>
                {t('shop.cart.title')}
                {count > 0 && <span className="accent">{t('shop.cart.titlePieces', { count })}</span>}
              </h1>
            </div>
            {items.length > 0 && (
              <button type="button" className="st-cart-clear" onClick={clear}>
                <i className="ri-delete-bin-2-line" /> {t('shop.cart.clear')}
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="st-empty">
              <i className="ri-shopping-bag-3-line" />
              <div className="t">{t('shop.cart.emptyTitle')}</div>
              <p>{t('shop.cart.emptyText')}</p>
              <Link className="st-btn primary" to="/products" style={{ marginTop: 18 }}>
                <i className="ri-store-2-line" /> {t('shop.cart.browse')}
              </Link>
            </div>
          ) : (
            <div className="st-cart-grid">
              <div className="st-cart-lines">
                {items.map((item) => (
                  <CartRow
                    key={item.id}
                    item={item}
                    onQty={(qty) => setQty(item.id, qty)}
                    onRemove={() => remove(item.id)}
                  />
                ))}

                <div className="st-cart-cont">
                  <Link className="st-btn ghost" to="/products">
                    <i className="ri-arrow-right-line" /> {t('shop.cart.continue')}
                  </Link>
                  <p className="hint">{t('shop.cart.note')}</p>
                </div>
              </div>

              <aside>
                <CartSummary
                  count={count}
                  subtotal={subtotal}
                  savings={savings}
                  onCheckout={onCheckout}
                />
              </aside>
            </div>
          )}
        </div>
      </main>

      <StoreFooter />
    </div>
  );
}