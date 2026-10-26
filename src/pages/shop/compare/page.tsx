import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StoreNav from '@/components/feature/StoreNav';
import StoreFooter from '@/components/feature/StoreFooter';
import CompareBoard from '@/pages/shop/components/CompareBoard';
import { useCompare } from '@/pages/shop/components/CompareProvider';
import type { Product } from '@/pages/shop/types';
import { useCatalog } from '@/hooks/useCatalog';
import { formatSAR } from '@/pages/shop/lib/format';
import { initPanels } from '@/pages/home/lib/panels';

export default function CompareProducts() {
  const { t } = useTranslation();
  const { products } = useCatalog();
  const { ids, has, toggle, clear, max } = useCompare();

  useEffect(() => initPanels(), []);

  const items = ids
    .map((id) => (products as Product[]).find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));

  const suggestions = (products as Product[]).filter((p) => !has(p.id)).slice(0, 4);
  const room = max - items.length;

  return (
    <div className="st-shell">
      <StoreNav />

      <main>
        <header className="st-hero">
          <div className="st-wrap">
            <nav className="st-crumbs" aria-label={t('shop.crumbs.compare')}>
              <Link to="/">{t('shop.crumbs.home')}</Link>
              <i className="ri-arrow-left-s-line" />
              <Link to="/products">{t('shop.crumbs.shop')}</Link>
              <i className="ri-arrow-left-s-line" />
              <span>{t('shop.crumbs.compare')}</span>
            </nav>

            <h1>
              {t('shop.compare.titleLead')} <em className="accent">{t('shop.compare.titleAccent')}</em>
            </h1>
            <p className="lead">{t('shop.compare.lead', { max })}</p>
          </div>
        </header>

        <section className="st-section" style={{ paddingTop: 'clamp(34px, 4vw, 56px)' }}>
          <div className="st-wrap">
            {items.length > 0 ? (
              <>
                <div className="st-head" style={{ marginBottom: 20 }}>
                  <div>
                    <p className="eyebrow">{t('shop.compare.boardEyebrow')}</p>
                    <h2>
                      {t('shop.compare.boardTitle', { count: items.length, max })} <em className="accent">{t('shop.compare.boardAccent')}</em>
                    </h2>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button type="button" className="st-reset" style={{ width: 'auto', margin: 0, padding: '10px 20px' }} onClick={clear}>
                      <i className="ri-delete-bin-6-line" /> {t('shop.compare.clear')}
                    </button>
                    <Link className="st-btn ghost sm" to="/products">
                      <i className="ri-add-line" /> {t('shop.compare.addProducts')}
                    </Link>
                  </div>
                </div>

                <CompareBoard items={items} />

                <p className="st-cmp-hint">
                  <i className="ri-lightbulb-line" />
                  {t('shop.compare.hint')}
                  {room > 0 && ` ${t('shop.compare.hintRoom', { count: room })}`}
                </p>
              </>
            ) : (
              <div className="st-empty" style={{ padding: '80px 24px' }}>
                <i className="ri-bar-chart-grouped-line" />
                <div className="t">{t('shop.compare.emptyTitle')}</div>
                <p>{t('shop.compare.emptyText')}</p>
                <Link className="st-btn primary" to="/products" style={{ marginTop: 18 }}>
                  <i className="ri-store-3-line" /> {t('shop.compare.browse')}
                </Link>
              </div>
            )}
          </div>
        </section>

        {items.length < max && (
          <section className="st-section alt">
            <div className="st-wrap">
              <div className="st-head">
                <div>
                  <p className="eyebrow">{t('shop.compare.sugEyebrow')}</p>
                  <h2>{t('shop.compare.sugTitle')} <em className="accent">{t('shop.compare.sugAccent')}</em></h2>
                </div>
                <Link className="st-link" to="/products">
                  {t('shop.compare.browseAll')} <i className="ri-arrow-left-line" />
                </Link>
              </div>

              <div className="st-cmp-add">
                {suggestions.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`st-cmp-addcard${has(p.id) ? ' is-on' : ''}`}
                    onClick={() => toggle(p)}
                    aria-pressed={has(p.id)}
                  >
                    <img src={p.image} alt={p.name} title={p.name} width={160} height={160} />
                    <span className="nm">{p.name}</span>
                    <span className="pr">{formatSAR(p.price)}</span>
                    <span className="cta">
                      <i className={has(p.id) ? 'ri-checkbox-circle-fill' : 'ri-add-circle-line'} />
                      {has(p.id) ? t('shop.compare.inCompare') : t('shop.compare.addToCompare')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <StoreFooter />
    </div>
  );
}