import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StoreNav from '@/components/feature/StoreNav';
import StoreFooter from '@/components/feature/StoreFooter';
import CatalogView from './components/CatalogView';
import { CategoryNav, VerifiedBar } from './components/StoreBits';
import { products, factories } from '@/mocks/shop';
import { initPanels } from '@/pages/home/lib/panels';

const trustItems = [
  { key: 'shipping', icon: 'ri-truck-line' },
  { key: 'escrow', icon: 'ri-shield-check-line' },
  { key: 'final', icon: 'ri-price-tag-3-line' },
  { key: 'factory', icon: 'ri-verified-badge-line' },
];

export default function Products() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [q, setQ] = useState(() => params.get('q') ?? '');

  useEffect(() => initPanels(), []);

  const runSearch = () => {
    const value = q.trim();
    navigate(value ? `/search?q=${encodeURIComponent(value)}` : '/search');
  };

  return (
    <div className="st-shell">
      <StoreNav />

      <main>
        <header className="st-hero">
          <div className="st-wrap">
            <nav className="st-crumbs" aria-label={t('shop.crumbs.shop')}>
              <Link to="/">{t('shop.crumbs.home')}</Link>
              <i className="ri-arrow-left-s-line" />
              <span>{t('shop.crumbs.shop')}</span>
            </nav>

            <h1>
              {t('shop.hero.titleLead')} <em className="accent">{t('shop.hero.titleAccent')}</em> {t('shop.hero.titleTail')}
            </h1>
            <p className="lead">{t('shop.hero.sub')}</p>

            <form className="st-search" onSubmit={(e) => { e.preventDefault(); runSearch(); }} role="search">
              <i className="ri-search-line" aria-hidden="true" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('shop.hero.searchPlaceholder')}
                aria-label={t('shop.hero.searchAria')}
                name="store_search"
              />
              <button type="submit">{t('shop.hero.searchBtn')}</button>
            </form>

            <p style={{ marginTop: 18, fontSize: 14, color: 'var(--muted)' }}>
              {t('shop.hero.meta', { products: products.length, factories: factories.length })}
            </p>
          </div>
        </header>

        <section className="st-section" style={{ paddingTop: 'clamp(26px,3.2vw,42px)', paddingBottom: 'clamp(4px,1vw,10px)' }}>
          <div className="st-wrap">
            <VerifiedBar />
            <CategoryNav />
          </div>
        </section>

        <section className="st-section alt" style={{ paddingBottom: 'clamp(28px,4vw,44px)' }}>
          <div className="st-wrap">
            <div className="st-trust">
              {trustItems.map((item) => (
                <div className="st-trust-item" key={item.key} data-reveal>
                  <div className="ic"><i className={item.icon} /></div>
                  <div>
                    <div className="t">{t(`shop.trust.${item.key}.title`)}</div>
                    <div className="x">{t(`shop.trust.${item.key}.text`)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <CatalogView q={q} setQ={setQ} />
      </main>

      <StoreFooter />
    </div>
  );
}