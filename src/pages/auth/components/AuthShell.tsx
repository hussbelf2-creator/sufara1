import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import BrandMark from '@/components/feature/BrandMark';
import { PANEL_ORDER, PANELS } from '@/pages/auth/lib/panels';
import type { PanelDef } from '@/pages/auth/lib/panels';

type Props = {
  panel: PanelDef;
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  demo?: ReactNode;
};

export default function AuthShell({
  panel, eyebrow, title, subtitle, children, footer, demo,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="au-scope">
      <div className="au-wrap">
        <aside className="au-aside">
          <a className="au-brand" href="/">
            <BrandMark size={38} label={t('common.brandMark')} />
            <span>
              {t('dashboard.auth.brandName')}
              <small>{t('dashboard.auth.brandSub')}</small>
            </span>
          </a>

          <div className="au-aside-body">
            <span className="au-aside-mark">
              <i className={panel.mark} />
            </span>
            <p className="au-aside-eyebrow">{t('dashboard.auth.brandNote')}</p>
            <h2>{t(`dashboard.group.${panel.key}`)}</h2>
            <ul className="au-bullets">
              <li><i className="ri-checkbox-circle-line" />{t('dashboard.auth.bullet1')}</li>
              <li><i className="ri-checkbox-circle-line" />{t('dashboard.auth.bullet2')}</li>
              <li><i className="ri-checkbox-circle-line" />{t('dashboard.auth.bullet3')}</li>
            </ul>
          </div>

          <div className="au-aside-foot">
            <i className="ri-shield-check-line" />
            <span>{t('dashboard.auth.secure')}</span>
          </div>
        </aside>

        <main className="au-main">
          <div className="au-topline">
            <a href="/" className="au-back">
              <i className="ri-arrow-right-line" />
              {t('dashboard.auth.backToSite')}
            </a>
            <span className="au-panel-tag">
              <i className={panel.icon} />
              {t(`dashboard.group.${panel.key}`)}
            </span>
          </div>

          <div className="au-card">
            <nav className="au-switch" aria-label={t('dashboard.auth.switchPanel')}>
              {PANEL_ORDER.map((key) => (
                <a
                  key={key}
                  href={`/auth/${key}`}
                  className={key === panel.key ? 'is-on' : ''}
                  aria-current={key === panel.key ? 'page' : undefined}
                >
                  <i className={PANELS[key].icon} />
                  <span>{t(`dashboard.group.${key}`)}</span>
                </a>
              ))}
            </nav>

            <header className="au-head">
              <p className="au-eyebrow">{eyebrow}</p>
              <h1>{title}</h1>
              <p className="au-sub">{subtitle}</p>
            </header>

            {children}

            {demo}

            {footer && <div className="au-foot">{footer}</div>}
          </div>

          <p className="au-legal">
            <i className="ri-lock-2-line" />
            {t('dashboard.auth.legalNote')}
          </p>
        </main>
      </div>
    </div>
  );
}