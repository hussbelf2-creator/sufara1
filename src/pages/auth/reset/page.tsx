import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthShell from '@/pages/auth/components/AuthShell';
import { AuthError, AuthOk } from '@/pages/auth/components/AuthBits';
import { useAuth } from '@/pages/auth/AuthProvider';
import { resolvePanel } from '@/pages/auth/lib/panels';
import { errorKey, saveNewPassword } from '@/pages/auth/lib/authApi';

export default function AuthResetPage() {
  const { t } = useTranslation();
  const { panel: panelParam } = useParams();
  const panel = resolvePanel(panelParam);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setOk('');
    if (!password || !confirm) {
      setError(t('dashboard.auth.errors.required'));
      return;
    }
    if (password.length < 8) {
      setError(t('dashboard.auth.errors.short'));
      return;
    }
    if (password !== confirm) {
      setError(t('dashboard.auth.errors.mismatch'));
      return;
    }
    setBusy(true);
    try {
      const { error: resetError } = await saveNewPassword(password);
      if (resetError) {
        setError(t(`dashboard.auth.errors.${errorKey(resetError.message)}`));
        return;
      }
      setOk(t('dashboard.auth.resetDoneBody'));
      window.setTimeout(() => navigate(`/dashboard?mode=${panel.key}`), 1200);
    } catch {
      setError(t('dashboard.auth.errors.generic'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      panel={panel}
      eyebrow={t('dashboard.auth.resetEyebrow')}
      title={t('dashboard.auth.resetTitle')}
      subtitle={t('dashboard.auth.resetSub')}
      footer={(
        <p className="au-switchline">
          <a href={`/auth/${panel.key}`}>{t('dashboard.auth.backToLogin')}</a>
        </p>
      )}
    >
      {loading ? (
        <div className="au-loading">
          <i className="ri-loader-4-line spin" />
          {t('dashboard.auth.working')}
        </div>
      ) : !user ? (
        <div className="au-form">
          <div className="au-alert is-bad" role="alert">
            <i className="ri-link-unlink" />
            <span>{t('dashboard.auth.noSession')}</span>
          </div>
          <a className="au-submit as-link" href={`/auth/${panel.key}/forgot`}>
            <i className="ri-send-plane-line" />
            {t('dashboard.auth.requestNew')}
          </a>
        </div>
      ) : (
        <form className="au-form" onSubmit={submit} noValidate>
          <AuthError message={error} />
          <AuthOk message={ok} />

          <label className="au-field">
            <span>{t('dashboard.auth.newPassword')}</span>
            <div className="au-input">
              <i className="ri-lock-line" />
              <input
                type={show ? 'text' : 'password'}
                name="new_password"
                autoComplete="new-password"
                dir="ltr"
                value={password}
                placeholder={t('dashboard.auth.passwordPh')}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="au-eye"
                aria-label={show ? t('dashboard.auth.hide') : t('dashboard.auth.show')}
                onClick={() => setShow((v) => !v)}
              >
                <i className={show ? 'ri-eye-off-line' : 'ri-eye-line'} />
              </button>
            </div>
          </label>

          <label className="au-field">
            <span>{t('dashboard.auth.confirmPassword')}</span>
            <div className="au-input">
              <i className="ri-shield-check-line" />
              <input
                type={show ? 'text' : 'password'}
                name="confirm_password"
                autoComplete="new-password"
                dir="ltr"
                value={confirm}
                placeholder={t('dashboard.auth.passwordPh')}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
          </label>

          <button type="submit" className="au-submit" disabled={busy || Boolean(ok)}>
            {busy ? <i className="ri-loader-4-line spin" /> : <i className="ri-check-double-line" />}
            {busy ? t('dashboard.auth.working') : t('dashboard.auth.submitReset')}
          </button>
        </form>
      )}
    </AuthShell>
  );
}