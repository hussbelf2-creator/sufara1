import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { sortOptions } from '@/mocks/shop';
import { useCatalog } from '@/hooks/useCatalog';
import ProductCard from './ProductCard';

const PAGE = 9;

type Only = 'all' | 'best' | 'new' | 'wholesale';

const quickChips: { id: Only; key: string; icon: string }[] = [
  { id: 'all', key: 'chipAll', icon: 'ri-apps-2-line' },
  { id: 'best', key: 'chipBest', icon: 'ri-fire-line' },
  { id: 'new', key: 'chipNew', icon: 'ri-sparkling-2-line' },
  { id: 'wholesale', key: 'chipWholesale', icon: 'ri-stack-line' },
];

const sortKeys: Record<string, string> = {
  featured: 'sortFeatured',
  new: 'sortNew',
  'price-asc': 'sortPriceAsc',
  'price-desc': 'sortPriceDesc',
  rating: 'sortRating',
};

export default function CatalogView({ q, setQ }: { q: string; setQ: (v: string) => void }) {
  const { t } = useTranslation();
  const { products, categories, factories } = useCatalog();
  const [params] = useSearchParams();
  const [cats, setCats] = useState<string[]>(() => {
    const c = params.get('category');
    return c ? [c] : [];
  });
  const [facs, setFacs] = useState<string[]>(() => {
    const f = params.get('factory');
    return f ? [f] : [];
  });
  const [minP, setMinP] = useState('');
  const [maxP, setMaxP] = useState('');
  const [only, setOnly] = useState<Only>('all');
  const [sort, setSort] = useState('featured');
  const [visible, setVisible] = useState(PAGE);
  const [drawer, setDrawer] = useState(false);

  const list = useMemo(() => {
    const term = q.trim();
    const out = products.filter((p) => {
      if (cats.length && !cats.includes(p.categoryId)) return false;
      if (facs.length && !facs.includes(p.factoryId)) return false;
      if (minP && p.price < Number(minP)) return false;
      if (maxP && p.price > Number(maxP)) return false;
      if (only === 'new' && !p.isNew) return false;
      if (only === 'best' && !p.bestseller) return false;
      if (only === 'wholesale' && !p.wholesale) return false;
      if (term) {
        const hay = `${p.name} ${p.shortDesc} ${p.tags.join(' ')}`;
        if (!hay.includes(term)) return false;
      }
      return true;
    });
    const sorted = [...out];
    if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') sorted.sort((a, b) => b.rating - a.rating);
    else if (sort === 'new') sorted.sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew));
    else sorted.sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
    return sorted;
  }, [products, cats, facs, minP, maxP, only, sort, q]);

  useEffect(() => {
    const c = params.get('category');
    const f = params.get('factory');
    setCats(c ? [c] : []);
    setFacs(f ? [f] : []);
  }, [params]);

  useEffect(() => {
    setVisible(PAGE);
  }, [cats, facs, minP, maxP, only, sort, q]);

  const toggle = (arr: string[], set: (v: string[]) => void, id: string) => {
    set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  };

  const catCount = (id: string) => products.filter((p) => p.categoryId === id).length;
  const facCount = (id: string) => products.filter((p) => p.factoryId === id).length;

  const reset = () => {
    setCats([]);
    setFacs([]);
    setMinP('');
    setMaxP('');
    setOnly('all');
    setQ('');
  };

  const shown = list.slice(0, visible);

  return (
    <section className="st-section">
      <div className="st-wrap">
        <div className="st-catalog">
          {/* ------------------------------------------------ filters */}
          <aside className={`st-sidebar${drawer ? ' is-open' : ''}`}>
            <div className="fgroup">
              <h4>{t('shop.catalog.category')}</h4>
              {categories.map((c) => (
                <label key={c.id} className={`st-opt${cats.includes(c.id) ? ' is-on' : ''}`}>
                  <input
                    type="checkbox"
                    checked={cats.includes(c.id)}
                    onChange={() => toggle(cats, setCats, c.id)}
                  />
                  <span>{c.name}</span>
                  <em>{catCount(c.id)}</em>
                </label>
              ))}
            </div>

            <div className="fgroup">
              <h4>{t('shop.catalog.factory')}</h4>
              {factories.map((f) => (
                <label key={f.id} className={`st-opt${facs.includes(f.id) ? ' is-on' : ''}`}>
                  <input
                    type="checkbox"
                    checked={facs.includes(f.id)}
                    onChange={() => toggle(facs, setFacs, f.id)}
                  />
                  <span>{f.name.replace('مصنع ', '')}</span>
                  <em>{facCount(f.id)}</em>
                </label>
              ))}
            </div>

            <div className="fgroup">
              <h4>{t('shop.catalog.price')}</h4>
              <div className="st-range">
                <input
                  type="number"
                  min={0}
                  placeholder={t('shop.catalog.from')}
                  value={minP}
                  onChange={(e) => setMinP(e.target.value)}
                  aria-label={t('shop.catalog.minAria')}
                />
                <span style={{ color: 'var(--muted)' }}>—</span>
                <input
                  type="number"
                  min={0}
                  placeholder={t('shop.catalog.to')}
                  value={maxP}
                  onChange={(e) => setMaxP(e.target.value)}
                  aria-label={t('shop.catalog.maxAria')}
                />
              </div>
            </div>

            <button type="button" className="st-reset" onClick={reset}>{t('shop.catalog.reset')}</button>
          </aside>

          {/* ------------------------------------------------ results */}
          <div>
            <div className="st-chips">
              {quickChips.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`st-chip${only === c.id ? ' is-on' : ''}`}
                  onClick={() => setOnly(c.id)}
                >
                  <i className={c.icon} />
                  {t(`shop.catalog.${c.key}`)}
                </button>
              ))}
            </div>

            <div className="st-toolbar">
              <button
                type="button"
                className="st-filter-toggle"
                onClick={() => setDrawer((v) => !v)}
                aria-expanded={drawer}
              >
                <i className="ri-equalizer-line" />
                {t('shop.catalog.filters')}
              </button>

              <div className="st-mini-search">
                <i className="ri-search-line" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t('shop.catalog.searchInResults')}
                  aria-label={t('shop.catalog.searchInResultsAria')}
                />
              </div>

              <div className="grow" />

              <span className="count"><b>{list.length}</b> {t('shop.catalog.resultsUnit')}</span>

              <select
                className="st-select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label={t('shop.catalog.sortAria')}
              >
                {sortOptions.map((s) => (
                  <option key={s.value} value={s.value}>{t(`shop.catalog.${sortKeys[s.value] ?? 'sortFeatured'}`)}</option>
                ))}
              </select>
            </div>

            {shown.length > 0 ? (
              <>
                <div className="st-grid">
                  {shown.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
                {visible < list.length && (
                  <div className="st-loadmore">
                    <button type="button" onClick={() => setVisible((v) => v + PAGE)}>
                      {t('shop.catalog.loadMore', { count: list.length - visible })}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="st-empty">
                <i className="ri-search-eye-line" />
                <div className="t">{t('shop.catalog.emptyTitle')}</div>
                <p>{t('shop.catalog.emptyText')}</p>
                <button type="button" className="st-reset" onClick={reset} style={{ maxWidth: 240, margin: '18px auto 0' }}>
                  {t('shop.catalog.reset')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}