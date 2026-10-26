import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StoreNav from '@/components/feature/StoreNav';
import StoreFooter from '@/components/feature/StoreFooter';
import ProductCard from '@/pages/shop/components/ProductCard';
import type { Product } from '@/pages/shop/types';
import { galleryExtras } from '@/mocks/shop';
import { useCatalog } from '@/hooks/useCatalog';
import { formatSAR, discountPct } from '@/pages/shop/lib/format';
import { initPanels } from '@/pages/home/lib/panels';
import { useShopModals } from '@/pages/shop/components/ShopModals';
import { useCart } from '@/pages/shop/components/CartProvider';

export default function ProductDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { products, factories, categories } = useCatalog();
  const product = (products as Product[]).find((p) => p.id === id);
  const { openRfq } = useShopModals();
  const { add: addToCart } = useCart();
  const [shot, setShot] = useState(0);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setShot(0);
    setQty(1);
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => initPanels(), []);

  if (!product) {
    return (
      <div className="st-shell">
        <StoreNav />
        <main style={{ paddingTop: 140, paddingBottom: 120 }}>
          <div className="st-wrap">
            <div className="st-empty">
              <i className="ri-ghost-2-line" />
              <div className="t">{t('shop.detail.notFoundTitle')}</div>
              <p>{t('shop.detail.notFoundText')}</p>
              <Link className="st-btn primary" to="/products" style={{ marginTop: 18 }}>
                <i className="ri-arrow-right-line" /> {t('shop.detail.backToStore')}
              </Link>
            </div>
          </div>
        </main>
        <StoreFooter />
      </div>
    );
  }

  const factory = factories.find((f) => f.id === product.factoryId);
  const category = categories.find((c) => c.id === product.categoryId);
  const off = discountPct(product.price, product.compareAt);
  const gallery = product.images?.length ? product.images : [product.image, ...galleryExtras];
  const related = (products as Product[])
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, 4);

  const add = () => {
    addToCart(product, qty);
  };

  return (
    <div className="st-shell">
      <StoreNav />

      <main className="st-detail">
        <div className="st-wrap">
          <div className="st-pd">
            {/* ------------------------------------------- gallery */}
            <div className="st-gallery">
              <div className="main">
                <img
                  src={gallery[shot]}
                  alt={product.name}
                  title={t('shop.detail.titleAttr', { name: product.name })}
                  width={900}
                  height={900}
                />
              </div>
              <div className="st-thumbs">
                {gallery.map((g, i) => (
                  <button
                    key={g}
                    type="button"
                    className={shot === i ? 'is-on' : ''}
                    onClick={() => setShot(i)}
                    aria-label={t('shop.detail.shotAria', { n: i + 1 })}
                  >
                    <img src={g} alt="" />
                  </button>
                ))}
              </div>
            </div>

            {/* ------------------------------------------- info */}
            <div className="st-info">
              <nav className="st-crumbs" aria-label={t('shop.crumbs.shop')}>
                <Link to="/">{t('shop.crumbs.home')}</Link>
                <i className="ri-arrow-left-s-line" />
                <Link to="/products">{t('shop.crumbs.shop')}</Link>
                <i className="ri-arrow-left-s-line" />
                <Link to={`/products?category=${product.categoryId}`}>{category?.name}</Link>
              </nav>

              <h1>{product.name}</h1>

              <div className="fac-line">
                <i className="ri-store-2-line" />
                <span>{t('shop.detail.from')}</span>
                <Link to="/products">{factory?.name}</Link>
                {factory && <span>· {factory.city}</span>}
                <span className="st-rating" style={{ marginInlineStart: 6 }}>
                  <i className="ri-star-fill" />
                  {product.rating} ({t('shop.detail.reviews', { count: product.reviews })})
                </span>
              </div>

              <div className="st-tagrow">
                {product.tags.map((tag) => (
                  <span className="st-tag" key={tag}>{tag}</span>
                ))}
              </div>

              <div className="st-buybox">
                <div className="priceline">
                  <span className="now">
                    {formatSAR(product.price)}
                    <small> / {product.weight}</small>
                  </span>
                  {product.compareAt && (
                    <>
                      <span className="was">{formatSAR(product.compareAt)}</span>
                      <span className="save">{t('shop.card.save', { off })}</span>
                    </>
                  )}
                </div>
                <p className="note">
                  <i className="ri-shield-check-line" />
                  {t('shop.detail.priceNote')}
                </p>

                <div className="st-actions">
                  <div className="st-qty" role="group" aria-label={t('shop.detail.qtyAria')}>
                    <button type="button" onClick={() => setQty((v) => Math.min(product.stock, v + 1))} aria-label={t('shop.detail.increase')}>
                      <i className="ri-add-line" />
                    </button>
                    <span>{qty}</span>
                    <button type="button" onClick={() => setQty((v) => Math.max(1, v - 1))} aria-label={t('shop.detail.decrease')}>
                      <i className="ri-subtract-line" />
                    </button>
                  </div>

                  <button type="button" className="st-btn primary" onClick={add}>
                    <i className="ri-shopping-bag-3-line" /> {t('shop.detail.addToCart')}
                  </button>

                  <button
                    type="button"
                    className="st-btn ghost"
                    onClick={() => openRfq({ product })}
                  >
                    <i className="ri-file-list-3-line" /> {t('shop.detail.requestQuote')}
                  </button>
                </div>

                <div className="st-notice">
                  <i className="ri-truck-line" />
                  {t('shop.detail.shipNotice')}
                </div>
              </div>

              <div className="st-panel">
                <h3>{t('shop.detail.about')}</h3>
                <p className="desc">{product.description}</p>
              </div>

              <div className="st-panel">
                <h3>{t('shop.detail.specs')}</h3>
                <div className="st-specs">
                  <div className="row"><span className="k">{t('shop.detail.specWeight')}</span><span className="v">{product.weight}</span></div>
                  <div className="row"><span className="k">{t('shop.detail.specOrigin')}</span><span className="v">{product.origin}</span></div>
                  <div className="row"><span className="k">{t('shop.detail.specHs')}</span><span className="v">{product.hs}</span></div>
                  <div className="row"><span className="k">{t('shop.detail.specStock')}</span><span className="v">{t('shop.detail.piecesValue', { count: product.stock })}</span></div>
                  <div className="row"><span className="k">{t('shop.detail.specCategory')}</span><span className="v">{category?.name}</span></div>
                  <div className="row"><span className="k">{t('shop.detail.specDelivery')}</span><span className="v">{t('shop.detail.deliveryValue')}</span></div>
                </div>
              </div>

              {product.wholesale && (
                <div className="st-panel">
                  <h3>{t('shop.detail.wholesaleTitle')}</h3>
                  <p className="small muted" style={{ marginBottom: 12 }}>
                    {t('shop.detail.wholesaleNote', { moq: product.wholesale.moq })}
                  </p>
                  <table className="st-tiers">
                    <thead>
                      <tr>
                        <th>{t('shop.detail.colQty')}</th>
                        <th>{t('shop.detail.colUnit')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.wholesale.tiers.map((tier) => (
                        <tr key={`${tier.min}-${tier.max}`}>
                          <td>
                            {tier.max === 0
                              ? t('shop.detail.tierPlus', { min: tier.min })
                              : t('shop.detail.tierRange', { min: tier.min, max: tier.max })}
                          </td>
                          <td className="p">{formatSAR(tier.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {factory && (
                <div className="st-panel">
                  <h3>{t('shop.detail.factoryTitle')}</h3>
                  <div className="st-fac-card">
                    <div className="logo">{factory.name.slice(0, 2)}</div>
                    <div>
                      <div className="t">
                        {factory.name}
                        {factory.verified && <i className="ri-verified-badge-fill" title={t('shop.detail.verifiedFactory')} />}
                      </div>
                      <div className="m">
                        {t('shop.detail.factoryMeta', {
                          city: factory.city,
                          since: factory.since,
                          rating: factory.rating,
                          products: factory.products,
                        })}
                      </div>
                      <p className="b">{factory.blurb}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {related.length > 0 && (
            <section style={{ marginTop: 'clamp(48px, 6vw, 88px)' }}>
              <div className="st-head">
                <div>
                  <p className="eyebrow">{t('shop.detail.relatedEyebrow')}</p>
                  <h2>{t('shop.detail.relatedTitle')} <em className="accent">{t('shop.detail.relatedAccent')}</em></h2>
                </div>
                <Link className="st-link" to="/products">
                  {t('shop.detail.browseAll')} <i className="ri-arrow-left-line" />
                </Link>
              </div>
              <div className="st-grid">
                {related.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <StoreFooter />
    </div>
  );
}