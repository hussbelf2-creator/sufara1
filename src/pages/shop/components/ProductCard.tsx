import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Product } from '@/pages/shop/types';
import { useCatalog } from '@/hooks/useCatalog';
import { formatSAR, discountPct } from '@/pages/shop/lib/format';
import { useShopModals } from '@/pages/shop/components/ShopModals';
import { useCompare } from '@/pages/shop/components/CompareProvider';
import { useCart } from '@/pages/shop/components/CartProvider';
import { useFavorites } from '@/pages/shop/components/FavoritesProvider';

export default function ProductCard({ product }: { product: Product }) {
  const { t } = useTranslation();
  const { factories } = useCatalog();
  const { openQuickView } = useShopModals();
  const { has, toggle } = useCompare();
  const { add } = useCart();
  const { has: isFav, toggle: toggleFav } = useFavorites();
  const fav = isFav(product.id);
  const inCompare = has(product.id);
  const factory = factories.find((f) => f.id === product.factoryId);
  const off = discountPct(product.price, product.compareAt);
  const to = `/products/${product.id}`;

  return (
    <div className="st-card">
      <div className="st-card-media">
        <img
          src={product.image}
          alt={product.name}
          title={t('shop.card.titleAttr', { name: product.name })}
          width={900}
          height={900}
        />
        <div className="st-card-flags">
          {off > 0 && <span className="st-flag sale">{t('shop.card.save', { off })}</span>}
          {product.isNew && <span className="st-flag new">{t('shop.card.new')}</span>}
          {product.bestseller && <span className="st-flag">{t('shop.card.bestseller')}</span>}
        </div>
        <button
          type="button"
          className={`fav${fav ? ' is-on' : ''}`}
          aria-label={t('shop.card.fav')}
          aria-pressed={fav}
          onClick={() => toggleFav(product.id)}
        >
          <i className={fav ? 'ri-heart-fill' : 'ri-heart-line'} />
        </button>
        <button
          type="button"
          className={`st-cmp-toggle${inCompare ? ' is-on' : ''}`}
          aria-pressed={inCompare}
          aria-label={inCompare ? t('shop.card.compareRemove') : t('shop.card.compareAdd')}
          title={inCompare ? t('shop.card.inCompare') : t('shop.card.compareAdd')}
          onClick={() => toggle(product)}
        >
          <i className={inCompare ? 'ri-checkbox-multiple-fill' : 'ri-bar-chart-grouped-line'} />
        </button>
        <button
          type="button"
          className="st-quick"
          onClick={() => openQuickView(product)}
          aria-label={t('shop.card.quickViewAria', { name: product.name })}
        >
          <i className="ri-eye-line" /> {t('shop.card.quickView')}
        </button>
        <Link className="st-card-hit" to={to} aria-label={product.name} />
      </div>

      <div className="st-card-body">
        {factory && (
          <span className="st-card-fac">
            <i className="ri-store-2-line" />
            {factory.name}
          </span>
        )}
        <Link className="st-card-titlink" to={to}>
          <h3 className="st-card-name">{product.name}</h3>
        </Link>
        <div className="st-rating">
          <i className="ri-star-fill" />
          {product.rating}
          <span>({product.reviews})</span>
        </div>
        {product.wholesale && (
          <span className="st-card-moq">
            <i className="ri-stack-line" /> {t('shop.card.wholesaleFrom', { moq: product.wholesale.moq })}
          </span>
        )}
        <div className="st-card-foot">
          <div className="st-price">
            {formatSAR(product.price)}
            {product.compareAt && <del>{formatSAR(product.compareAt)}</del>}
            <small>{t('shop.card.priceNote')}</small>
          </div>
          <button
            type="button"
            className="st-add"
            aria-label={t('shop.card.addToCart')}
            onClick={() => add(product, 1)}
          >
            <i className="ri-shopping-bag-3-line" />
          </button>
        </div>
      </div>
    </div>
  );
}