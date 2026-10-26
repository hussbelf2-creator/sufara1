import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StoreNav from '@/components/feature/StoreNav';
import StoreFooter from '@/components/feature/StoreFooter';
import ProductCard from '@/pages/shop/components/ProductCard';
import { useShopModals } from '@/pages/shop/components/ShopModals';
import type { Product } from '@/pages/shop/types';
import { useCatalog } from '@/hooks/useCatalog';
import { initPanels } from '@/pages/home/lib/panels';

export default function FactoryProfile() {
  const { t } = useTranslation();
  const { factories, factoryExtra, products } = useCatalog();
  const { id } = useParams();
  const { openRfq } = useShopModals();

  const factory = factories.find((f) => f.id === id);
  const extra = id ? factoryExtra[id] : undefined;
  const list = (products as Product[]).filter((p) => p.factoryId === id);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => initPanels(), []);

  if (!factory || !extra) {
    return (
      <div className="st-shell">
        <StoreNav />
        <main style={{ paddingTop: 140, paddingBottom: 120 }}>
          <div className="st-wrap">
            <div className="st-empty">
              <i className="ri-building-4-line" />
              <div className="t">{t('factories.profile.notFoundTitle')}</div>
              <p>{t('factories.profile.notFoundText')}</p>
              <Link className="st-btn primary" to="/factories" style={{ marginTop: 18 }}>
                <i className="ri-arrow-right-line" /> {t('factories.profile.back')}
              </Link>
            </div>
          </div>
        </main>
        <StoreFooter />
      </div>
    );
  }

  const onTime = 92 + Math.round(factory.rating);
  const returnRate = (1.2 + (5 - factory.rating) * 0.5).toFixed(1);
  const readiness = Math.min(100, 82 + Math.round((factory.rating - 4.5) * 20));

  return (
    <div className="st-shell">
      <StoreNav />

      <main>
        <header className="st-fprof-hero">
          <img
            src={extra.cover}
            alt={t('factories.profile.coverAlt', { name: factory.name, city: factory.city })}
            title={t('factories.profile.coverTitle', { name: factory.name })}
            width={1400}
            height={900}
          />
          <div className="st-wrap inner">
            <div className="meta">
              <nav className="st-crumbs" aria-label={t('factories.profile.aria')}>
                <Link to="/">{t('factories.crumbs.home')}</Link>
                <i className="ri-arrow-left-s-line" />
                <Link to="/factories">{t('factories.crumbs.factories')}</Link>
                <i className="ri-arrow-left-s-line" />
                <span style={{ color: '#fff' }}>{factory.city}</span>
              </nav>

              <h1>
                <span className="logo-big"><i className="ri-building-4-line" /></span>
                {factory.name}
                {factory.verified && <i className="ri-verified-badge-fill" title={t('factories.profile.verifiedTitle')} />}
              </h1>

              <div className="line">
                <span><i className="ri-map-pin-line" /> {factory.city}</span>
                <span><i className="ri-calendar-line" /> {t('factories.profile.lineSince', { since: factory.since })}</span>
                <span><i className="ri-star-fill" /> {t('factories.profile.lineRating', { rating: factory.rating })}</span>
                <span><i className="ri-shopping-bag-3-line" /> {t('factories.profile.lineProducts', { count: list.length })}</span>
                <span><i className="ri-time-line" /> {t('factories.profile.lineResponds', { time: extra.responseTime })}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="st-wrap">
          <div className="st-fprof-grid">
            {/* --------------------------------------------- main */}
            <div className="st-fprof-main">
              <section className="block">
                <h2>{t('factories.profile.aboutTitle')}</h2>
                <p>{factory.blurb}</p>
                <p>{t('factories.profile.aboutExtra')}</p>
                <figure>
                  <img
                    src={extra.workshop}
                    alt={t('factories.profile.workshopAlt', { name: factory.name })}
                    title={t('factories.profile.workshopTitle', { name: factory.name })}
                    width={1200}
                    height={800}
                  />
                </figure>
              </section>

              <section className="block">
                <h2>{t('factories.profile.certsTitle')}</h2>
                <div className="st-certs">
                  {extra.certifications.map((c) => (
                    <span className="st-cert" key={c}><i className="ri-shield-star-line" />{c}</span>
                  ))}
                </div>
              </section>

              <section className="block">
                <h2>{t('factories.profile.marketsTitle')}</h2>
                <div className="st-certs">
                  {extra.markets.map((m) => (
                    <span className="st-cert" key={m}><i className="ri-earth-line" />{m}</span>
                  ))}
                </div>
              </section>

              <section className="block">
                <h2>{t('factories.profile.perfTitle')}</h2>
                <div className="st-statbig">
                  <div className="s"><b>{onTime}%</b><span>{t('factories.profile.perfOnTime')}</span></div>
                  <div className="s"><b>{returnRate}%</b><span>{t('factories.profile.perfReturn')}</span></div>
                  <div className="s"><b>{extra.responseTime}</b><span>{t('factories.profile.perfResponse')}</span></div>
                </div>
              </section>

              <section className="block">
                <div className="st-head" style={{ marginBottom: 22 }}>
                  <div>
                    <p className="eyebrow">{t('factories.profile.productsEyebrow')}</p>
                    <h2 style={{ margin: 0 }}>
                      {t('factories.profile.productsTitleLead')} <em className="accent">{t('factories.profile.productsTitleAccent')}</em> {t('factories.profile.productsTitleTail')}
                    </h2>
                  </div>
                  <Link className="st-link" to={`/products?factory=${factory.id}`}>
                    {t('factories.profile.browseAll')} <i className="ri-arrow-left-line" />
                  </Link>
                </div>

                {list.length > 0 ? (
                  <div className="st-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                    {list.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                ) : (
                  <div className="st-empty">
                    <i className="ri-shopping-bag-3-line" />
                    <div className="t">{t('factories.profile.noProductsTitle')}</div>
                    <p>{t('factories.profile.noProductsText')}</p>
                  </div>
                )}
              </section>
            </div>

            {/* --------------------------------------------- side */}
            <aside className="st-fprof-side">
              <div className="st-sidecard">
                <h4>{t('factories.profile.dataTitle')}</h4>
                <div className="st-kv"><span className="k">{t('factories.profile.city')}</span><span className="v">{factory.city}</span></div>
                <div className="st-kv"><span className="k">{t('factories.profile.since')}</span><span className="v">{factory.since}</span></div>
                <div className="st-kv"><span className="k">{t('factories.profile.employees')}</span><span className="v">{extra.employees}</span></div>
                <div className="st-kv"><span className="k">{t('factories.profile.area')}</span><span className="v">{extra.area}</span></div>
                <div className="st-kv"><span className="k">{t('factories.profile.status')}</span><span className="v" style={{ color: 'var(--accent)' }}>{t('factories.profile.statusValue')}</span></div>
                <div className="st-kv"><span className="k">{t('factories.profile.address')}</span><span className="v">{extra.address}</span></div>

                <Link className="st-btn ghost block" to={`/products?factory=${factory.id}`}>
                  <i className="ri-shopping-bag-3-line" /> {t('factories.profile.browseProducts')}
                </Link>

                <button
                  type="button"
                  className="st-btn primary block"
                  onClick={() => openRfq({ factoryName: factory.name })}
                >
                  <i className="ri-file-list-3-line" /> {t('factories.profile.requestRfq')}
                </button>
              </div>

              <div className="st-sidecard">
                <h4>{t('factories.profile.readinessTitle')}</h4>
                <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.7, margin: '0 0 6px' }}>
                  {t('factories.profile.readinessDesc')}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600 }}>
                  <span>{t('factories.profile.readinessScore')}</span>
                  <span style={{ color: 'var(--accent)' }}>{readiness} / 100</span>
                </div>
                <div className="st-progress"><i style={{ width: `${readiness}%` }} /></div>
              </div>

              <div className="st-sidecard">
                <h4>{t('factories.profile.guaranteeTitle')}</h4>
                <div className="st-notice" style={{ margin: 0 }}>
                  <i className="ri-shield-check-line" />
                  {t('factories.profile.guaranteeText')}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <StoreFooter />
    </div>
  );
}