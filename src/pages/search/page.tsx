import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StoreNav from '@/components/feature/StoreNav';
import StoreFooter from '@/components/feature/StoreFooter';
import ProductCard from '@/pages/shop/components/ProductCard';
import { sortOptions } from '@/mocks/shop';
import { useCatalog } from '@/hooks/useCatalog';
import { initPanels } from '@/pages/home/lib/panels';

const sortKeys: Record<string, string> = {
  featured: 'sortFeatured',
  new: 'sortNew',
  'price-asc': 'sortPriceAsc',
  'price-desc': 'sortPriceDesc',
  rating: 'sortRating',
};

/* Standalone, shareable search results page. The query lives in the URL
   (?q=…), so any result link can be copied, bookmarked or sent to someone.
   The results can be narrowed further by category, factory and price range. */
export default function SearchPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { products, categories, factories } = useCatalog();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const [term, setTerm] = useState(q);
  const [sort, setSort] = useState('featured');

  const [cats, setCats] = useState<string[]>([]);
  const [facs, setFacs] = useState<string[]>([]);
  const [minP, setMinP] = useState('');
  const [maxP, setMaxP] = useState('');
  const [drawer, setDrawer] = useState(false);

  useEffect(() => { setTerm(q); }, [q]);
  useEffect(() => initPanels(), []);

  /* Filters reset whenever the search term itself changes. */
  useEffect(() => {
    setCats([]);
    setFacs([]);
    setMinP('');
    setMaxP('');
  }, [q]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? '';
    const facName = (id: string) => factories.find((f) => f.id === id)?.name ?? '';
    const out = products.filter((p) => {
      const hay = `${p.name} ${p.shortDesc} ${p.description} ${p.tags.join(' ')} ${catName(p.categoryId)} ${facName(p.factoryId)}`.toLowerCase();
      if (!hay.includes(needle)) return false;
      if (cats.length && !cats.includes(p.categoryId)) return false;
      if (facs.length && !facs.includes(p.factoryId)) return false;
      if (minP && p.price < Number(minP)) return false;
      if (maxP && p.price > Number(maxP)) return false;
      return true;
    });
    const sorted = [...out];
    if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') sorted.sort((a, b) => b.rating - a.rating);
    else if (sort === 'new') sorted.sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew));
    else sorted.sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
    return sorted;
  }, [products, categories, factories, q, sort, cats, facs, minP, maxP]);

  const toggle = (arr: string[], set: (v: string[]) => void, id: string) => {
    set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  };

  const resetFilters = () => {
    setCats([]);
    setFacs([]);
    setMinP('');
    setMaxP('');
  };

  const catCount = (id: string) => products.filter((p) => p.categoryId === id).length;
  const facCount = (id: string) => products.filter((p) => p.factoryId === id).length;

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = term.trim();
    if (value) setParams({ q: value });
    else navigate('/search', { replace: true });
  };

  const hasQuery = q.trim().length > 0;

  return (
    <div className="st-shell">
      <StoreNav />

      <main>
        <header className="st-hero">
          <div className="st-wrap">
            <nav className="st-crumbs" aria-label={t('shop.searchPage.eyebrow')}>
              <Link to="/">{t('shop.crumbs.home')}</Link>
              <i className="ri-arrow-left-s-line" />
              <Link to="/products">{t('shop.crumbs.shop')}</Link>
              <i className="ri-arrow-left-s-line" />
              <span>{t('shop.searchPage.eyebrow')}</span>
            </nav>

            <h1>
              {t('shop.searchPage.titleLead')} <em className="accent">{t('shop.searchPage.titleAccent')}</em>
            </h1>
            <p className="lead">{t('shop.searchPage.sub')}</p>

            <form className="st-search" onSubmit={submit} role="search">
              <i className="ri-search-line" aria-hidden="true" />
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder={t('shop.searchPage.placeholder')}
                aria-label={t('shop.searchPage.aria')}
                name="search_query"
              />
              <button type="submit">{t('shop.searchPage.btn')}</button>
            </form>
          </div>
        </header>

        <section className="st-section alt">
          <div className="st-wrap">
            {hasQuery ? (
              <div className="st-catalog" style={{ padding: 0 }}>
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

                  <button type="button" className="st-reset" onClick={resetFilters}>{t('shop.catalog.reset')}</button>
                </aside>

                {/* ------------------------------------------------ results */}
                <div>
                  <div className="st-head" style={{ marginBottom: 16 }}>
                    <div>
                      <div className="strong" style={{ fontSize: 18 }}>{t('shop.searchPage.resultsFor', { q })}</div>
                      <span className="muted text-sm">{t('shop.searchPage.resultCount', { count: results.length })}</span>
                    </div>
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

                    <div className="grow" />

                    <select
                      className="st-select"
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      aria-label={t('shop.searchPage.sortAria')}
                    >
                      {sortOptions.map((s) => (
                        <option key={s.value} value={s.value}>{t(`shop.catalog.${sortKeys[s.value] ?? 'sortFeatured'}`)}</option>
                      ))}
                    </select>
                  </div>

                  {results.length > 0 ? (
                    <div className="st-grid" data-product-shop>
                      {results.map((p) => (
                        <ProductCard key={p.id} product={p} />
                      ))}
                    </div>
                  ) : (
                    <div className="st-empty">
                      <i className="ri-search-eye-line" />
                      <div className="t">{t('shop.searchPage.emptyTitle', { q })}</div>
                      <p>{t('shop.searchPage.emptyText')}</p>
                      <button type="button" className="st-reset" onClick={resetFilters} style={{ maxWidth: 240, margin: '18px auto 0' }}>
                        {t('shop.catalog.reset')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="st-empty">
                <i className="ri-search-line" />
                <div className="t">{t('shop.searchPage.noQueryTitle')}</div>
                <p>{t('shop.searchPage.noQueryText')}</p>
                <Link className="btn primary" to="/products" style={{ display: 'inline-flex', marginTop: 18 }}>
                  <i className="ri-store-2-line" /> {t('shop.searchPage.browseAll')}
                </Link>
              </div>
            )}

            <p className="muted text-sm" style={{ marginTop: 26, textAlign: 'center' }}>
              <i className="ri-link" /> {t('shop.searchPage.shareHint')}
            </p>
          </div>
        </section>
      </main>

      <StoreFooter />
    </div>
  );
}