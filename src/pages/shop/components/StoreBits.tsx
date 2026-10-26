import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { storeStats, verifiedBadges } from '@/mocks/shop';
import { useCatalog } from '@/hooks/useCatalog';

const bandLabelKeys = ['sectors', 'verifiedProducts', 'markets', 'escrow'];

/* Global product search — submits to the standalone, shareable results page. */
export function StoreSearch({ placeholder }: { placeholder?: string }) {
  const { t } = useTranslation();
  const [term, setTerm] = useState('');
  const navigate = useNavigate();

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = term.trim();
    navigate(value ? `/search?q=${encodeURIComponent(value)}` : '/search');
  };

  return (
    <form className="st-searchbar" onSubmit={submit} role="search">
      <i className="ri-search-line" aria-hidden="true" />
      <input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder={placeholder ?? t('shop.search.placeholder')}
        aria-label={t('shop.search.aria')}
        name="store_search"
        className="text-sm"
      />
      <button type="submit" className="text-sm">
        <i className="ri-search-line" /> {t('shop.search.btn')}
      </button>
    </form>
  );
}

/* Third-party inspection & certification marks — the storefront trust bar. */
export function VerifiedBar() {
  const { t } = useTranslation();
  return (
    <div className="st-badges" aria-label={t('shop.verified.aria')}>
      <span className="lead"><i className="ri-shield-check-line" /> {t('shop.verified.lead')}</span>
      {verifiedBadges.map((b) => (
        <span className="st-badge" key={b}>{b === 'شهادة حلال' ? t('shop.verified.halal') : b}</span>
      ))}
    </div>
  );
}

/* Quick category navigation across the whole catalogue. */
export function CategoryNav({ active }: { active?: string }) {
  const { t } = useTranslation();
  const { categories } = useCatalog();
  return (
    <nav className="st-catnav" aria-label={t('shop.catnav.aria')}>
      {categories.map((c) => (
        <Link
          key={c.id}
          to={`/products?category=${c.id}`}
          className={`st-cattile${active === c.id ? ' is-on' : ''}`}
        >
          <span className="ic"><i className={c.icon} /></span>
          <span className="t">{c.name}</span>
        </Link>
      ))}
    </nav>
  );
}

/* Headline numbers for the storefront band. */
export function StoreBandStats() {
  const { t } = useTranslation();
  return (
    <div className="st-band-stats">
      {storeStats.map((s, i) => (
        <div className="s" key={s.label}>
          <b>{s.value}</b>
          <span>{t(`shop.bandStats.${bandLabelKeys[i] ?? 'sectors'}`)}</span>
        </div>
      ))}
    </div>
  );
}