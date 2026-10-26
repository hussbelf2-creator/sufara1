import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProductCard from '@/pages/shop/components/ProductCard';
import {
  CategoryNav, StoreBandStats, StoreSearch, VerifiedBar,
} from '@/pages/shop/components/StoreBits';
import type { Product } from '@/pages/shop/types';
import { useCatalog } from '@/hooks/useCatalog';

const trustItems = [
  { key: 'shipping', icon: 'ri-truck-line' },
  { key: 'escrow', icon: 'ri-shield-check-line' },
  { key: 'final', icon: 'ri-price-tag-3-line' },
  { key: 'factory', icon: 'ri-verified-badge-line' },
];

/* The storefront, dropped right under the film: a searchable store band,
   category navigation, the best of the catalogue and the verified factories. */
export default function StoreSections() {
  const { t } = useTranslation();
  const { products, categories, factories } = useCatalog();
  const featured = (products as Product[]).filter((p) => p.featured).slice(0, 4);
  const unit = t('home.store.unitProducts');

  return (
    <>
      {/* Store band — the store's own header: search, promise and headline numbers */}
      <section className="st-band" id="store">
        <div className="st-wrap">
          <p className="eyebrow" data-reveal>{t('home.store.bandEyebrow')}</p>
          <h2 data-reveal>
            {t('home.store.bandTitle1')}{' '}<em className="accent">{t('home.store.bandTitle2')}</em>{' '}{t('home.store.bandTitle3')}
          </h2>
          <p className="sub" data-reveal>{t('home.store.bandSub')}</p>
          <div data-reveal><StoreSearch /></div>
          <div data-reveal><StoreBandStats /></div>
        </div>
      </section>

      <section className="st-section" style={{ paddingTop: 'clamp(30px, 3.6vw, 46px)', paddingBottom: 'clamp(24px, 3vw, 38px)' }}>
        <div className="st-wrap">
          <div data-reveal><VerifiedBar /></div>
          <div data-reveal><CategoryNav /></div>
        </div>
      </section>

      <section className="st-section alt">
        <div className="st-wrap">
          <div className="st-head">
            <div>
              <p className="eyebrow">{t('home.store.whyEyebrow')}</p>
              <h2>{t('home.store.whyTitle1')}{' '}<em className="accent">{t('home.store.whyTitle2')}</em>{' '}{t('home.store.whyTitle3')}</h2>
            </div>
            <Link className="st-link" to="/factories">
              {t('home.store.factoriesLink')} <i className="ri-arrow-left-line" />
            </Link>
          </div>

          <div className="st-trust">
            {trustItems.map((tItem) => (
              <div className="st-trust-item" key={tItem.key} data-reveal>
                <div className="ic"><i className={tItem.icon} /></div>
                <div>
                  <div className="t">{t(`shop.trust.${tItem.key}.title`)}</div>
                  <div className="x">{t(`shop.trust.${tItem.key}.text`)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="st-section">
        <div className="st-wrap">
          <div className="st-head">
            <div>
              <p className="eyebrow">{t('home.store.catsEyebrow')}</p>
              <h2>{t('home.store.catsTitle1')}{' '}<em className="accent">{t('home.store.catsTitle2')}</em>{' '}{t('home.store.catsTitle3')}</h2>
            </div>
            <Link className="st-link" to="/products">
              {t('home.store.allProducts')} <i className="ri-arrow-left-line" />
            </Link>
          </div>

          <div className="st-cats">
            {categories.map((c) => (
              <Link className="st-cat" key={c.id} to={`/products?category=${c.id}`} data-reveal>
                <img src={c.image} alt={c.name} title={`${c.name} — ${t('home.store.bandEyebrow')}`} width={800} height={600} />
                <div className="body">
                  <div className="ic"><i className={c.icon} /></div>
                  <div className="t">{c.name}</div>
                  <div className="c">{c.count} {unit} · {c.blurb}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="st-section alt">
        <div className="st-wrap">
          <div className="st-head">
            <div>
              <p className="eyebrow">{t('home.store.featEyebrow')}</p>
              <h2>{t('home.store.featTitle1')}{' '}<em className="accent">{t('home.store.featTitle2')}</em>{' '}{t('home.store.featTitle3')}</h2>
            </div>
            <Link className="st-link" to="/products">
              {t('home.store.allProducts')} <i className="ri-arrow-left-line" />
            </Link>
          </div>

          <div className="st-grid">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      <section className="st-section">
        <div className="st-wrap">
          <div className="st-head">
            <div>
              <p className="eyebrow">{t('home.store.facsEyebrow')}</p>
              <h2>{t('home.store.facsTitle1')}{' '}<em className="accent">{t('home.store.facsTitle2')}</em>{' '}{t('home.store.facsTitle3')}</h2>
              <p className="sub">{t('home.store.facsSub')}</p>
            </div>
            <Link className="st-link" to="/factories">
              {t('home.store.factoriesLink')} <i className="ri-arrow-left-line" />
            </Link>
          </div>

          <div className="st-facs">
            {factories.map((f) => (
              <article className="st-fac" key={f.id} data-reveal>
                <div className="logo"><i className="ri-building-4-line" /></div>
                <div className="t">
                  {f.name}
                  {f.verified && <i className="ri-verified-badge-fill" title={t('home.store.verifiedFactory')} />}
                </div>
                <div className="m">
                  {f.city} · {t('home.store.established')} {f.since} · {t('home.store.rating')} {f.rating} · {f.products} {unit}
                </div>
                <p className="b">{f.blurb}</p>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <Link className="go" to={`/factories/${f.id}`}>
                    {t('home.store.facProfile')} <i className="ri-arrow-left-line" />
                  </Link>
                  <Link className="go" to={`/products?factory=${f.id}`}>
                    {t('home.store.facProducts')} <i className="ri-arrow-left-line" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}