import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { demoAllowed, useAuth } from '@/pages/auth/AuthProvider';
import type { PanelDef } from '@/pages/auth/lib/panels';

export function AuthError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="au-alert is-bad" role="alert">
      <i className="ri-error-warning-line" />
      <span>{message}</span>
    </div>
  );
}

export function AuthOk({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="au-alert is-good" role="status">
      <i className="ri-checkbox-circle-line" />
      <span>{message}</span>
    </div>
  );
}

type DemoProps = { panel: PanelDef; compact?: boolean };

export function DemoBox({ panel, compact }: DemoProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setDemo } = useAuth();

  /* Hidden entirely in production builds (see demoAllowed). */
  if (!demoAllowed()) return null;

  const enter = () => {
    setDemo(panel.key);
    navigate(`/dashboard?mode=${panel.key}`);
  };

  if (compact) {
    return (
      <div className="au-demo is-compact">
        <div className="au-demo-text">
          <b>{t('dashboard.auth.demoTitle')}</b>
          <span>{t('dashboard.auth.demoShort')}</span>
        </div>
        <button type="button" className="au-demo-btn" onClick={enter}>
          <i className="ri-play-circle-line" />
          {t('dashboard.auth.demoBtn')}
        </button>
      </div>
    );
  }

  return (
    <div className="au-demo">
      <div className="au-demo-text">
        <b>{t('dashboard.auth.demoTitle')}</b>
        <span>{t('dashboard.auth.demoBody')}</span>
      </div>
      <div className="au-demo-row">
        <span className="au-demo-who">
          <i className="ri-user-star-line" />
          {panel.demoName}
        </span>
        <span className="au-demo-sub">{panel.demoSub}</span>
      </div>
      <button type="button" className="au-demo-btn block" onClick={enter}>
        <i className="ri-play-circle-line" />
        {t('dashboard.auth.demoBtn')}
      </button>
    </div>
  );
}