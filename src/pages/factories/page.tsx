import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StoreNav from '@/components/feature/StoreNav';
import StoreFooter from '@/components/feature/StoreFooter';
import type { Factory, Product } from '@/pages/shop/types';
import { useCatalog } from '@/hooks/useCatalog';
import { initPanels } from '@/pages/home/lib/panels';

export default function FactoriesDirectory() {
  const { t } = useTranslation();
  const { factories, factoryExtra, products } = useCatalog();
  const [q, setQ] = useState('');
  const [city, setCity] = useState('all');

  useEffect(() => initPanels(), []);

  const list = factories as Factory[];
  const all = products as Product[];

  const cities = useMemo(
    () => ['all', ...Array.from(new Set(list.map((f) => f.city)))],
    [list],
  );

  const shown = list.filter((f) => {
    if (city !== 'all' && f.city !== city) return false;
    const term = q.trim();
    if (term) {
      const hay = `${f.name} ${f.city} ${f.blurb}`;
      if (!hay.includes(term)) return false;
    }
    return true;
  });

  const totalProducts = all.length;
  const sectors = new Set(all.map((p) => p.categoryId)).size;

  return (
    <div className="st-shell">
      <StoreNav />

      <main>
        <header className="st-hero">
          <div className="st-wrap">
            <nav className="st-crumbs" aria-label={t('factories.crumbs.aria')}>
              <Link to="/">{t('factories.crumbs.home')}</Link>
              <i className="ri-arrow-left-s-line" />
              <span>{t('factories.crumbs.factories')}</span>
            </nav>

            <h1>
              {t('factories.hero.titleLead')} <em className="accent">{t('factories.hero.titleAccent')}</em> {t('factories.hero.titleTail')}
            </h1>
            <p className="lead">{t('factories.hero.lead')}</p>

            <div className="st-fdir-stats">
              <div className="s"><b>{list.length}</b><span>{t('factories.stats.verified')}</span></div>
              <div className="s"><b>{totalProducts}</b><span>{t('factories.stats.products')}</span></div>
              <div className="s"><b>{sectors}</b><span>{t('factories.stats.sectors')}</span></div>
              <div className="s"><b>{new Set(list.map((f) => f.city)).size}</b><span>{t('factories.stats.cities')}</span></div>
            </div>
          </div>
        </header>

        <section className="st-section">
          <div className="st-wrap">
            <div className="st-fdir-tools">
              <div className="st-mini-search" style={{ maxWidth: 340 }}>
                <i className="ri-search-line" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t('factories.search.placeholder')}
                  aria-label={t('factories.search.aria')}
                />
              </div>

              <div style={{ flex: 1 }} />

              <div className="st-chips" style={{ margin: 0 }}>
                {cities.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`st-chipx${city === c ? ' is-on' : ''}`}
                    onClick={() => setCity(c)}
                  >
                    {c === 'all' ? t('factories.allCities') : c}
                  </button>
                ))}
              </div>
            </div>

            {shown.length > 0 ? (
              <div className="st-fgrid">
                {shown.map((f) => {
                  const extra = factoryExtra[f.id];
                  return (
                    <article className="st-fcardx" key={f.id} data-reveal>
                      <div className="cover">
                        {extra && (
                          <img
                            src={extra.cover}
                            alt={t('factories.card.coverAlt', { name: f.name, city: f.city })}
                            title={t('factories.card.coverTitle', { name: f.name })}
                            width={1400}
                            height={900}
                          />
                        )}
                        {f.verified && (
                          <span className="badge"><i className="ri-verified-badge-fill" /> {t('factories.card.verified')}</span>
                        )}
                      </div>
                      <div className="body">
                        <div className="logo"><i className="ri-building-4-line" /></div>
                        <div className="t">
                          {f.name}
                          {f.verified && <i className="ri-verified-badge-fill" title={t('factories.card.verifiedTitle')} />}
                        </div>
                        <div className="m">
                          {t('factories.card.meta', { city: f.city, since: f.since, rating: f.rating, products: f.products })}
                        </div>
                        <p className="b">{f.blurb}</p>

                        {extra && (
                          <div className="st-certs">
                            {extra.certifications.slice(0, 3).map((c) => (
                              <span className="st-cert" key={c}><i className="ri-shield-star-line" />{c}</span>
                            ))}
                          </div>
                        )}

                        <div className="acts">
                          <Link className="st-btn ghost" to={`/factories/${f.id}`} style={{ padding: '10px 18px' }}>
                            <i className="ri-file-user-line" /> {t('factories.card.profile')}
                          </Link>
                          <Link className="st-btn ghost" to={`/products?factory=${f.id}`} style={{ padding: '10px 18px' }}>
                            <i className="ri-shopping-bag-3-line" /> {t('factories.card.products')}
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="st-empty">
                <i className="ri-search-eye-line" />
                <div className="t">{t('factories.empty.title')}</div>
                <p>{t('factories.empty.text')}</p>
              </div>
            )}
          </div>
        </section>

        <section className="st-section alt">
          <div className="st-wrap" style={{ maxWidth: 860, textAlign: 'center' }}>
            <p className="eyebrow" style={{ color: 'var(--accent2)', fontSize: 12, fontWeight: 600, margin: 0 }}>{t('factories.join.eyebrow')}</p>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', margin: '10px 0 12px' }}>
              {t('factories.join.titleLead')} <em className="accent">{t('factories.join.titleAccent')}</em>
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.8, maxWidth: '60ch', margin: '0 auto 24px' }}>
              {t('factories.join.lead')}
            </p>
            <Link className="st-btn primary" to="/#join">
              <i className="ri-add-circle-line" /> {t('factories.join.cta')}
            </Link>
          </div>
        </section>
      </main>

      <StoreFooter />
    </div>
  );
}