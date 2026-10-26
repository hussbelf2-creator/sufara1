import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Product } from '@/pages/shop/types';
import { useCatalog } from '@/hooks/useCatalog';
import { formatSAR, discountPct } from '@/pages/shop/lib/format';
import { useCompare } from './CompareProvider';
import { useCart } from './CartProvider';
import { useFavorites } from './FavoritesProvider';

interface Props {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onRfq: (product: Product) => void;
}

export default function QuickViewModal({ product, open, onClose, onRfq }: Props) {
  const { t } = useTranslation();
  const { factories } = useCatalog();
  const [qty, setQty] = useState(1);
  const { has, toggle } = useCompare();
  const { add } = useCart();
  const { has: isFav, toggle: toggleFav } = useFavorites();

  useEffect(() => {
    if (!open) return;
    setQty(1);
  }, [open, product?.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !product) return null;

  const factory = factories.find((f) => f.id === product.factoryId);
  const off = discountPct(product.price, product.compareAt);

  return (
    <div className="st-modal-overlay" role="dialog" aria-modal="true" aria-label={product.name} onClick={onClose}>
      <div className="st-modal" onClick={(e) => e.stopPropagation()}>
        <div className="st-modal-head">
          <div>
            <h3>{t('shop.quickView.title')}</h3>
            <p className="sub">{factory?.name} · {factory?.city}</p>
          </div>
          <button type="button" className="st-modal-close" onClick={onClose} aria-label={t('shop.quickView.close')}>
            <i className="ri-close-line" />
          </button>
        </div>

        <div className="st-modal-body">
          <div className="st-qv-grid">
            <div className="st-qv-media">
              <img
                src={product.image}
                alt={product.name}
                title={t('shop.quickView.titleAttr', { name: product.name })}
                width={900}
                height={900}
              />
              <button
                type="button"
                className={`fav${isFav(product.id) ? ' is-on' : ''}`}
                aria-label={t('shop.quickView.fav')}
                aria-pressed={isFav(product.id)}
                onClick={() => toggleFav(product.id)}
              >
                <i className={isFav(product.id) ? 'ri-heart-fill' : 'ri-heart-line'} />
              </button>
            </div>

            <div className="st-qv-info">
              <div className="st-qv-tags">
                {product.tags.map((tag) => (
                  <span className="st-tag" key={tag}>{tag}</span>
                ))}
              </div>

              <h2 className="st-qv-name">{product.name}</h2>

              <div className="st-rating">
                <i className="ri-star-fill" />
                {product.rating} <span>({t('shop.quickView.reviews', { count: product.reviews })})</span>
              </div>

              <p className="st-qv-desc">{product.shortDesc}</p>

              <div className="st-qv-price">
                <span className="now">
                  {formatSAR(product.price)}
                  <small> / {product.weight}</small>
                </span>
                {product.compareAt && (
                  <>
                    <del>{formatSAR(product.compareAt)}</del>
                    <span className="save">{t('shop.card.save', { off })}</span>
                  </>
                )}
              </div>

              <div className="st-qv-list">
                <div className="row"><span className="k">{t('shop.quickView.origin')}</span><span className="v">{product.origin}</span></div>
                <div className="row"><span className="k">{t('shop.quickView.weight')}</span><span className="v">{product.weight}</span></div>
                <div className="row"><span className="k">{t('shop.quickView.stock')}</span><span className="v">{product.stock.toLocaleString('en-US')}</span></div>
                <div className="row">
                  <span className="k">{t('shop.quickView.wholesale')}</span>
                  <span className="v">{product.wholesale ? t('shop.quickView.wholesaleValue', { moq: product.wholesale.moq }) : '—'}</span>
                </div>
              </div>

              <div className="st-qv-actions">
                <div className="st-qty" role="group" aria-label={t('shop.quickView.qtyAria')}>
                  <button type="button" onClick={() => setQty((v) => Math.min(product.stock, v + 1))} aria-label={t('shop.quickView.increase')}>
                    <i className="ri-add-line" />
                  </button>
                  <span>{qty}</span>
                  <button type="button" onClick={() => setQty((v) => Math.max(1, v - 1))} aria-label={t('shop.quickView.decrease')}>
                    <i className="ri-subtract-line" />
                  </button>
                </div>

                <button
                  type="button"
                  className="st-btn primary"
                  onClick={() => add(product, qty)}
                >
                  <i className="ri-shopping-bag-3-line" /> {t('shop.quickView.addToCart')}
                </button>

                <button type="button" className="st-btn ghost" onClick={() => onRfq(product)}>
                  <i className="ri-file-list-3-line" /> {t('shop.quickView.requestQuote')}
                </button>

                <button
                  type="button"
                  className={`st-btn ghost${has(product.id) ? ' is-on' : ''}`}
                  onClick={() => toggle(product)}
                  aria-pressed={has(product.id)}
                >
                  <i className={has(product.id) ? 'ri-checkbox-multiple-fill' : 'ri-bar-chart-grouped-line'} />
                  {has(product.id) ? t('shop.quickView.inCompare') : t('shop.quickView.compareAdd')}
                </button>
              </div>

              <Link className="st-link" to={`/products/${product.id}`}>
                {t('shop.quickView.fullPage')} <i className="ri-arrow-left-line" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}