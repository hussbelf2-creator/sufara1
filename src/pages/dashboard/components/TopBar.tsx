import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/pages/auth/AuthProvider';
import NotificationBell from './NotificationBell';

export type Mode = 'buyer' | 'ambassador' | 'admin' | 'factory';

type Props = {
  mode: Mode;
  /** Panels the signed-in account may open — server roles, never the URL. */
  allowed: Mode[];
  onMode: (m: Mode) => void;
  onMenu: () => void;
  title: string;
};

export default function TopBar({ mode, allowed, onMode, onMenu, title }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, role, fullName, demoRole, signOut } = useAuth();

  /* The account screens open on the panel the visitor is looking at. */
  const signInPanel = role ?? demoRole ?? mode;

  const logout = async () => {
    await signOut();
    navigate(`/auth/${signInPanel}`);
  };

  return (
    <header className="dash-top">
      <button type="button" className="burger" aria-label={t('dashboard.topbar.menu')} onClick={onMenu}>
        <i className="ri-menu-2-line" />
      </button>

      {allowed.length > 1 && <div className="seg" role="tablist" aria-label={t('dashboard.topbar.modeSwitch')}>
        {allowed.includes('buyer') && (
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'buyer'}
            className={mode === 'buyer' ? 'is-on' : ''}
            onClick={() => onMode('buyer')}
          >
            <i className="ri-shopping-bag-3-line" />
            <span>{t('dashboard.topbar.buyerMode')}</span>
          </button>
        )}
        {allowed.includes('ambassador') && (
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'ambassador'}
            className={mode === 'ambassador' ? 'is-on' : ''}
            onClick={() => onMode('ambassador')}
          >
            <i className="ri-share-forward-2-line" />
            <span>{t('dashboard.topbar.ambassadorMode')}</span>
          </button>
        )}
        {allowed.includes('admin') && (
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'admin'}
            className={mode === 'admin' ? 'is-on' : ''}
            onClick={() => onMode('admin')}
          >
            <i className="ri-shield-user-line" />
            <span>{t('dashboard.topbar.adminMode')}</span>
          </button>
        )}
        {allowed.includes('factory') && (
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'factory'}
            className={mode === 'factory' ? 'is-on' : ''}
            onClick={() => onMode('factory')}
          >
            <i className="ri-store-3-line" />
            <span>{t('dashboard.topbar.factoryMode')}</span>
          </button>
        )}
      </div>}

      <div className="top-tools">
        <label className="top-search">
          <i className="ri-search-line" />
          <input type="text" placeholder={t('dashboard.topbar.searchPlaceholder')} aria-label={t('dashboard.topbar.searchAria')} />
        </label>
        <NotificationBell />
        <button type="button" className="icon-btn" aria-label={t('dashboard.topbar.help')}>
          <i className="ri-question-line" />
        </button>
        <span className="pill info" title={title}>
          <i className="ri-user-smile-line" />
          {title}
        </span>

        {user ? (
          <div className="top-account">
            <span className="pill ok" title={fullName || user.email || ''}>
              <i className="ri-account-circle-line" />
              {fullName || user.email}
            </span>
            <button
              type="button"
              className="icon-btn"
              aria-label={t('dashboard.sidebar.logout')}
              onClick={logout}
            >
              <i className="ri-logout-box-r-line" />
            </button>
          </div>
        ) : (
          <a className="top-signin" href={`/auth/${signInPanel}`}>
            <i className="ri-user-line" />
            <span>{t('dashboard.topbar.signIn')}</span>
          </a>
        )}
      </div>
    </header>
  );
}