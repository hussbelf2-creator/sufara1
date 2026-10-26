import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { Product } from '@/pages/shop/types';
import { useCatalog } from '@/hooks/useCatalog';
import { formatSAR, discountPct } from '@/pages/shop/lib/format';
import { useCompare } from './CompareProvider';
import { useShopModals } from './ShopModals';

interface Row {
  key: string;
  best?: (items: Product[]) => string | null;
  render: (p: Product, isBest: boolean, t: TFunction) => ReactNode;
}

/* The side-by-side board merchants use to weigh price, MOQ and specs. */
export default function CompareBoard({ items }: { items: Product[] }) {
  const { t } = useTranslation();
  const { factories, categories } = useCatalog();
  const { remove } = useCompare();
  const { openRfq } = useShopModals();

  const facName = (p: Product) => factories.find((f) => f.id === p.factoryId)?.name ?? '—';
  const catName = (p: Product) => categories.find((c) => c.id === p.categoryId)?.name ?? '—';
  const bestTier = (p: Product) => (p.wholesale ? Math.min(...p.wholesale.tiers.map((t) => t.price)) : null);

  const lowest = (items: Product[], pick: (p: Product) => number | null): string | null => {
    let id: string | null = null;
    let val = Infinity;
    items.forEach((p) => {
      const v = pick(p);
      if (v != null && v < val) {
        val = v;
        id = p.id;
      }
    });
    return id;
  };

  const highest = (items: Product[], pick: (p: Product) => number | null): string | null => {
    let id: string | null = null;
    let val = -Infinity;
    items.forEach((p) => {
      const v = pick(p);
      if (v != null && v > val) {
        val = v;
        id = p.id;
      }
    });
    return id;
  };

  const rows: Row[] = [
    {
      key: 'rowUnitPrice',
      best: (items) => lowest(items, (p) => p.price),
      render: (p, isBest) => <b className={isBest ? 'p now best' : 'now'}>{formatSAR(p.price)}</b>,
    },
    {
      key: 'rowBeforeDiscount',
      render: (p) => (p.compareAt ? <del className="was">{formatSAR(p.compareAt)}</del> : <span className="dash">—</span>),
    },
    {
      key: 'rowSavePct',
      render: (p, _isBest, t) => {
        const off = discountPct(p.price, p.compareAt);
        return off > 0 ? <span className="save">{t('shop.compareBoard.save', { off })}</span> : <span className="dash">—</span>;
      },
    },
    {
      key: 'rowRating',
      best: (items) => highest(items, (p) => p.rating),
      render: (p, isBest) => (
        <span className={`rate${isBest ? ' best' : ''}`}>
          <i className="ri-star-fill" /> {p.rating} <em>({p.reviews})</em>
        </span>
      ),
    },
    {
      key: 'rowMoq',
      best: (items) => lowest(items, (p) => p.wholesale?.moq ?? null),
      render: (p, isBest, t) =>
        p.wholesale ? (
          <span className={isBest ? 'moq best' : 'moq'}>
            <i className="ri-stack-line" /> {t('shop.compareBoard.moqPieces', { count: p.wholesale.moq })}
          </span>
        ) : (
          <span className="dash">{t('shop.compareBoard.retailOnly')}</span>
        ),
    },
    {
      key: 'rowBestTier',
      best: (items) => lowest(items, (p) => bestTier(p)),
      render: (p, isBest) => {
        const tier = bestTier(p);
        return tier != null ? <b className={isBest ? 'p best' : 'p'}>{formatSAR(tier)}</b> : <span className="dash">—</span>;
      },
    },
    { key: 'rowWeight', render: (p) => p.weight },
    { key: 'rowOrigin', render: (p) => p.origin },
    { key: 'rowHs', render: (p) => <span className="mono">{p.hs}</span> },
    { key: 'rowCategory', render: (p) => catName(p) },
    {
      key: 'rowStock',
      render: (p, _isBest, t) => t('shop.compareBoard.stockValue', { count: p.stock }),
    },
    {
      key: 'rowTags',
      render: (p) => (
        <span className="st-cmp-tags">
          {p.tags.map((tag) => (
            <span className="st-tag" key={tag}>{tag}</span>
          ))}
        </span>
      ),
    },
    { key: 'rowFactory', render: (p) => facName(p) },
  ];

  return (
    <div className="st-cmp-scroll">
      <table className="st-cmp-table">
        <thead>
          <tr>
            <th className="rowhead head">
              <span>{t('shop.compareBoard.headerTitle')}</span>
              <small>{t('shop.compareBoard.headerSub', { count: items.length })}</small>
            </th>
            {items.map((p) => (
              <th key={p.id} scope="col">
                <div className="st-cmp-head">
                  <button
                    type="button"
                    className="rm"
                    onClick={() => remove(p.id)}
                    aria-label={t('shop.compareBoard.removeAria', { name: p.name })}
                  >
                    <i className="ri-close-line" />
                  </button>
                  <Link className="pic" to={`/products/${p.id}`}>
                    <img src={p.image} alt={p.name} title={p.name} width={200} height={200} />
                  </Link>
                  <Link className="nm" to={`/products/${p.id}`}>{p.name}</Link>
                  <div className="fac">
                    <i className="ri-store-2-line" /> {facName(p)}
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const bestId = row.best ? row.best(items) : null;
            return (
              <tr key={row.key}>
                <th className="rowhead" scope="row">{t(`shop.compareBoard.${row.key}`)}</th>
                {items.map((p) => (
                  <td key={p.id} className={bestId === p.id ? 'is-best' : ''}>
                    {row.render(p, bestId === p.id, t)}
                  </td>
                ))}
              </tr>
            );
          })}
          <tr>
            <th className="rowhead" scope="row">{t('shop.compareBoard.rowActions')}</th>
            {items.map((p) => (
              <td key={p.id}>
                <div className="st-cmp-acts">
                  <Link className="st-btn primary sm" to={`/products/${p.id}`}>
                    <i className="ri-eye-line" /> {t('shop.compareBoard.viewProduct')}
                  </Link>
                  <button
                    type="button"
                    className="st-btn ghost sm"
                    onClick={() => openRfq({ product: p })}
                  >
                    <i className="ri-file-list-3-line" /> {t('shop.compareBoard.quote')}
                  </button>
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}