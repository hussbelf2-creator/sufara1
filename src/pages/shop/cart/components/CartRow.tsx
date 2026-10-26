import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCatalog } from '@/hooks/useCatalog';
import { formatSAR } from '@/pages/shop/lib/format';
import type { CartItem } from '@/pages/shop/components/CartProvider';

interface Props {
  item: CartItem;
  onQty: (qty: number) => void;
  onRemove: () => void;
}

/* A single line inside the cart: the product, its factory, the unit price
   (with the wholesale tier applied) and the quantity controls. */
export default function CartRow({ item, onQty, onRemove }: Props) {
  const { t } = useTranslation();
  const { factories } = useCatalog();
  const { product, qty, unit, total } = item;
  const factory = factories.find((f) => f.id === product.factoryId);
  const min = product.wholesale?.moq ?? 1;
  const isWholesale = !!product.wholesale && qty >= min;
  const to = `/products/${product.id}`;

  return (
    <div className="st-cart-line">
      <Link className="pic" to={to} aria-label={product.name}>
        <img
          src={product.image}
          alt={product.name}
          title={t('shop.cart.titleAttr', { name: product.name })}
          width={220}
          height={220}
        />
      </Link>

      <div className="body">
        <div className="top">
          <Link className="nm" to={to}>{product.name}</Link>
          <button type="button" className="rm" onClick={onRemove} aria-label={t('shop.cart.removeAria', { name: product.name })}>
            <i className="ri-delete-bin-6-line" />
          </button>
        </div>

        {factory && (
          <span className="fac">
            <i className="ri-store-2-line" /> {factory.name}
          </span>
        )}

        <div className="meta">
          <span className="unit">
            {formatSAR(unit)} <small>{t('shop.cart.unit')}</small>
          </span>
          {product.wholesale && (
            <span className="moq">
              <i className="ri-stack-line" /> {isWholesale ? t('shop.cart.wholesaleOn') : t('shop.cart.wholesale', { min })}
            </span>
          )}
        </div>

        <div className="bottom">
          <div className="st-qty" role="group" aria-label={t('shop.cart.qtyAria', { name: product.name })}>
            <button
              type="button"
              onClick={() => onQty(qty + 1)}
              disabled={qty >= product.stock}
              aria-label={t('shop.cart.increase')}
            >
              <i className="ri-add-line" />
            </button>
            <span>{qty}</span>
            <button
              type="button"
              onClick={() => onQty(qty - 1)}
              disabled={qty <= 1}
              aria-label={t('shop.cart.decrease')}
            >
              <i className="ri-subtract-line" />
            </button>
          </div>

          <span className="line-total">{formatSAR(total)}</span>
        </div>
      </div>
    </div>
  );
}