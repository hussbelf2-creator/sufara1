import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Product } from '@/pages/shop/types';
import { useCatalog } from '@/hooks/useCatalog';
import { useCompare } from './CompareProvider';

/* Floating bar that shows the merchant's comparison line-up from any page. */
export default function CompareBar() {
  const { t } = useTranslation();
  const { products } = useCatalog();
  const { ids, max, remove, clear } = useCompare();
  const { pathname } = useLocation();

  if (pathname === '/compare' || ids.length === 0) return null;

  const items = ids
    .map((id) => (products as Product[]).find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));

  if (items.length === 0) return null;

  return (
    <div className="st-cmpbar" role="region" aria-label={t('shop.compareBar.aria')}>
      <div className="st-cmpbar-inner">
        <div className="lead">
          <i className="ri-bar-chart-grouped-line" />
          <span>
            {t('shop.compareBar.lead')} <b>{items.length}</b>/{max}
          </span>
        </div>

        <div className="thumbs">
          {items.map((p) => (
            <div className="thumb" key={p.id}>
              <img src={p.image} alt={p.name} title={p.name} width={80} height={80} />
              <button
                type="button"
                className="x"
                onClick={() => remove(p.id)}
                aria-label={t('shop.compareBar.removeAria', { name: p.name })}
              >
                <i className="ri-close-line" />
              </button>
            </div>
          ))}
        </div>

        <div className="acts">
          <button type="button" className="clear" onClick={clear}>
            <i className="ri-delete-bin-6-line" /> {t('shop.compareBar.clear')}
          </button>
          <Link className="go" to="/compare">
            <i className="ri-bar-chart-grouped-line" /> {t('shop.compareBar.go')}
          </Link>
        </div>
      </div>
    </div>
  );
}