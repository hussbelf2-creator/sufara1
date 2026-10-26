import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '@/pages/shop/components/CartProvider';
import { useFavorites } from '@/pages/shop/components/FavoritesProvider';
import { useAuth } from '@/pages/auth/AuthProvider';
import LanguageSwitcher from './LanguageSwitcher';
import BrandMark from './BrandMark';

const navItems = [
  { key: 'common.nav.home', to: '/' },
  { key: 'common.nav.shop', to: '/products' },
  { key: 'common.nav.factories', to: '/factories' },
  { key: 'common.nav.compare', to: '/compare' },
  { key: 'common.nav.ambassadors', to: '/#ambassadors' },
  { key: 'common.nav.how', to: '/#story' },
];

interface QuickQuestion {
  q: string;
  to: string;
}

export default function StoreNav() {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const faqRef = useRef<HTMLDivElement | null>(null);
  const { count } = useCart();
  const { count: favCount } = useFavorites();
  const { t } = useTranslation();
  const { user } = useAuth();

  /* Signed-in visitors land on their dashboard; everyone else is taken to the
     account screens first, where the demo access is also offered. */
  const accountTo = user ? '/dashboard' : '/auth/buyer';

  const quickValue = t('common.faqQuick.items', { returnObjects: true });
  const quick = Array.isArray(quickValue) ? (quickValue as unknown as QuickQuestion[]) : [];

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* The quick-answers panel closes on an outside click or Escape, so it never
     stays hanging over the page while the visitor reads the store. */
  useEffect(() => {
    if (!faqOpen) return undefined;
    const onDown = (event: MouseEvent) => {
      if (!faqRef.current) return;
      if (!faqRef.current.contains(event.target as Node)) setFaqOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFaqOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [faqOpen]);

  const closeAll = () => {
    setFaqOpen(false);
    setOpen(false);
  };

  /* One block, two surfaces: the desktop dropdown and the mobile menu render the
     exact same quick-answers card, so the panel never changes shape when the
     visitor switches from desktop to phone. */
  const quickBlock = (
    <>
      <div className="fq-head">
        <span className="eyebrow">{t('common.faqQuick.eyebrow')}</span>
        <b>{t('common.faqQuick.title')}</b>
      </div>

      <ul className="fq-list">
        {quick.map((item) => (
          <li key={item.to}>
            <Link to={item.to} onClick={closeAll}>
              <i className="ri-question-line" aria-hidden="true" />
              <span>{item.q}</span>
              <i className="ri-arrow-left-line go" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>

      <Link className="fq-all" to="/faq" onClick={closeAll}>
        <i className="ri-book-open-line" aria-hidden="true" />
        <span>
          {t('common.faqQuick.all')}
          <small>{t('common.faqQuick.note')}</small>
        </span>
      </Link>
    </>
  );

  return (
    <>
      <nav className={`site-nav ${solid ? 'is-solid' : ''}`}>
        <Link className="brand" to="/" onClick={closeAll}>
          <BrandMark size={34} label={t('common.brandMark')} />
          <span>{t('common.brand')}</span>
        </Link>

        <div className="links">
          {navItems.map((l) => (
            <Link key={l.to} to={l.to}>{t(l.key)}</Link>
          ))}

          <div className={`nav-faq${faqOpen ? ' is-open' : ''}`} ref={faqRef}>
            <button
              type="button"
              className="nav-faq-btn"
              aria-expanded={faqOpen}
              aria-haspopup="true"
              onClick={() => setFaqOpen((value) => !value)}
            >
              {t('common.nav.faq')}
              <i className={faqOpen ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} aria-hidden="true" />
            </button>

            <div className="nav-faq-panel is-card" role="dialog" aria-label={t('common.nav.faq')}>
              {quickBlock}
            </div>
          </div>
        </div>

        <div className="nav-actions">
          <LanguageSwitcher />

          <Link className="nav-cart" to="/orders" aria-label={t('common.nav.orders')} onClick={() => setOpen(false)}>
            <i className="ri-file-list-3-line" />
          </Link>

          <Link className="nav-cart" to="/favorites" aria-label={t('common.nav.favorites')} onClick={() => setOpen(false)}>
            <i className="ri-heart-3-line" />
            {favCount > 0 && <span className="nav-cart-count">{favCount > 99 ? '99+' : favCount}</span>}
          </Link>

          <Link className="nav-cart" to="/cart" aria-label={t('common.nav.cart')} onClick={() => setOpen(false)}>
            <i className="ri-shopping-bag-3-line" />
            {count > 0 && <span className="nav-cart-count">{count > 99 ? '99+' : count}</span>}
          </Link>

          <Link className="nav-cta" to={accountTo} onClick={() => setOpen(false)}>{t('common.nav.account')}</Link>

          <button
            type="button"
            className="burger"
            aria-label={t('common.nav.menu')}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <i className={open ? 'ri-close-line' : 'ri-menu-line'} />
          </button>
        </div>
      </nav>

      {open && (
        <div className="mobile-menu">
          <div className="mm-links">
            {navItems.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>{t(l.key)}</Link>
            ))}
            <Link to="/support" onClick={() => setOpen(false)}>{t('legal.contact.crumb')}</Link>
          </div>

          <div className="mm-card">{quickBlock}</div>

          <div className="mm-links">
            <Link to="/orders" onClick={() => setOpen(false)}>{t('common.nav.orders')}</Link>
            <Link to="/favorites" onClick={() => setOpen(false)}>
              {t('common.nav.favorites')}{favCount > 0 ? ` (${favCount})` : ''}
            </Link>
            <Link to="/cart" onClick={() => setOpen(false)}>
              {t('common.nav.cart')}{count > 0 ? ` (${count})` : ''}
            </Link>
            <Link className="mm-account" to={accountTo} onClick={() => setOpen(false)}>
              <i className="ri-user-3-line" aria-hidden="true" />
              <span>{t('common.nav.account')}</span>
            </Link>
          </div>

          <LanguageSwitcher className="in-menu" />
        </div>
      )}
    </>
  );
}