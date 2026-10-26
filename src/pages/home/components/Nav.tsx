import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/feature/LanguageSwitcher';

interface NavLink { label: string; href: string; }

export default function Nav() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const navLinks = t('home.navLinks', { returnObjects: true }) as unknown as NavLink[];

  return (
    <>
      <nav className="site-nav">
        <a className="brand" href="#top" onClick={() => setOpen(false)}>
          <span className="mark">{t('common.brandMark')}</span>
          <span>{t('common.brand')}</span>
        </a>

        <div className="links">
          <Link to="/products">{t('common.nav.shop')}</Link>
          <Link to="/factories">{t('common.nav.factories')}</Link>
          {navLinks.map((l) => (
            <a key={l.href} href={l.href}>{l.label}</a>
          ))}
        </div>

        <div className="nav-actions">
          <LanguageSwitcher />
          <Link className="nav-cta" to="/dashboard">{t('common.nav.account')}</Link>
        </div>

        <button
          type="button"
          className="burger"
          aria-label={t('common.nav.menu')}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <i className={open ? 'ri-close-line' : 'ri-menu-line'} />
        </button>
      </nav>

      {open && (
        <div className="mobile-menu">
          <Link to="/products" onClick={() => setOpen(false)}>{t('common.nav.shop')}</Link>
          <Link to="/factories" onClick={() => setOpen(false)}>{t('common.nav.factories')}</Link>
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
          ))}
          <Link to="/dashboard" onClick={() => setOpen(false)}>{t('common.nav.account')}</Link>
          <LanguageSwitcher className="in-menu" />
        </div>
      )}
    </>
  );
}