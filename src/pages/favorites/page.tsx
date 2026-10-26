import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StoreNav from '@/components/feature/StoreNav';
import StoreFooter from '@/components/feature/StoreFooter';
import ProductCard from '@/pages/shop/components/ProductCard';
import { useCatalog } from '@/hooks/useCatalog';
import { useFavorites } from '@/pages/shop/components/FavoritesProvider';
import { formatSAR } from '@/pages/shop/lib/format';
import { initPanels } from '@/pages/home/lib/panels';

/* Standalone wishlist page. Resolves the saved product ids (kept in the
   browser by FavoritesProvider) against the live catalogue, so every saved
   heart shows its current price, stock and image — plus a one-tap add to cart. */
export default function FavoritesPage() {
  const { t } = useTranslation();
  const { products } = useCatalog();
  const { ids, clear } = useFavorites();

  useEffect(() => initPanels(), []);

  const items = useMemo(
    () => ids
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is (typeof products)[number] => Boolean(p)),
    [ids, products],
  );

  const total = useMemo(
    () => items.reduce((sum, p) => sum + p.price * (p.wholesale?.moq ?? 1), 0),
    [items],
  );

  return (
    <div className="st-shell">
      <StoreNav />

      <main>
        <header className="st-hero">
          <div className="st-wrap">
            <nav className="st-crumbs" aria-label={t('shop.favorites.eyebrow')}>
              <Link to="/">{t('shop.crumbs.home')}</Link>
              <i className="ri-arrow-left-s-line" />
              <Link to="/products">{t('shop.crumbs.shop')}</Link>
              <i className="ri-arrow-left-s-line" />
              <span>{t('shop.favorites.eyebrow')}</span>
            </nav>

            <h1>
              {t('shop.favorites.titleLead')} <em className="accent">{t('shop.favorites.titleAccent')}</em>
            </h1>
            <p className="lead">{t('shop.favorites.sub')}</p>

            {items.length > 0 && (
              <div className="st-orders-stats" style={{ marginTop: 26, marginBottom: 0 }}>
                <div className="s" style={{ flex: '0 1 220px' }}>
                  <b>{items.length}</b>
                  <span>{t('shop.favorites.countLabel')}</span>
                </div>
                <div className="s" style={{ flex: '0 1 260px' }}>
                  <b>{formatSAR(total)}</b>
                  <span>{t('shop.favorites.valueLabel')}</span>
                </div>
              </div>
            )}
          </div>
        </header>

        <section className="st-section alt">
          <div className="st-wrap">
            {items.length > 0 ? (
              <>
                <div className="st-head">
                  <div>
                    <p className="eyebrow">{t('shop.favorites.eyebrow')}</p>
                    <h2>{t('shop.favorites.titleLead')} <em className="accent">{t('shop.favorites.titleAccent')}</em></h2>
                  </div>
                  <button type="button" className="st-cart-clear" onClick={clear}>
                    <i className="ri-delete-bin-6-line" /> {t('shop.favorites.clear')}
                  </button>
                </div>

                <div className="st-grid" data-product-shop>
                  {items.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </>
            ) : (
              <div className="st-empty">
                <i className="ri-heart-line" />
                <div className="t">{t('shop.favorites.emptyTitle')}</div>
                <p>{t('shop.favorites.emptyText')}</p>
                <Link className="btn primary" to="/products" style={{ display: 'inline-flex', marginTop: 18 }}>
                  <i className="ri-store-2-line" /> {t('shop.favorites.browse')}
                </Link>
              </div>
            )}

            <p className="muted text-sm" style={{ marginTop: 26, textAlign: 'center' }}>
              <i className="ri-heart-3-line" /> {t('shop.favorites.shareHint')}
            </p>
          </div>
        </section>
      </main>

      <StoreFooter />
    </div>
  );
}