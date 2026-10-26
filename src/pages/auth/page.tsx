import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthShell from './components/AuthShell';
import { AuthError, DemoBox } from './components/AuthBits';
import { demoAllowed, useAuth } from './AuthProvider';
import { resolvePanel } from './lib/panels';
import { ensureProfile, errorKey, signInWithPassword } from './lib/authApi';

export default function AuthLoginPage() {
  const { t } = useTranslation();
  const { panel: panelParam } = useParams();
  const panel = resolvePanel(panelParam);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { clearDemo } = useAuth();
  /* Only same-site dashboard paths are honoured — no open redirect. */
  const nextRaw = params.get('next') ?? '';
  const next = nextRaw.startsWith('/dashboard') ? nextRaw : `/dashboard?mode=${panel.key}`;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError(t('dashboard.auth.errors.required'));
      return;
    }
    setBusy(true);
    try {
      const { data, error: authError } = await signInWithPassword(email, password);
      if (authError) {
        const key = errorKey(authError.message);
        if (key === 'notConfirmed') {
          navigate(`/auth/${panel.key}/verify?email=${encodeURIComponent(email.trim())}`);
          return;
        }
        setError(t(`dashboard.auth.errors.${key}`));
        return;
      }
      await ensureProfile(data.user, panel.key);
      clearDemo();
      navigate(next);
    } catch {
      setError(t('dashboard.auth.errors.generic'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      panel={panel}
      eyebrow={t('dashboard.auth.loginEyebrow')}
      title={t('dashboard.auth.loginTitle')}
      subtitle={t('dashboard.auth.loginSub', { panel: t(`dashboard.group.${panel.key}`) })}
      demo={demoAllowed() ? <DemoBox panel={panel} compact /> : undefined}
      footer={panel.key === 'admin' ? (
        <p className="au-switchline">{t('platform.auth.adminInviteOnly')}</p>
      ) : (
        <p className="au-switchline">
          {t('dashboard.auth.noAccount')}
          <a href={`/auth/${panel.key}/register`}>{t('dashboard.auth.createOne')}</a>
        </p>
      )}
    >
      <form className="au-form" onSubmit={submit} noValidate>
        <AuthError message={error} />

        <label className="au-field">
          <span>{t('dashboard.auth.email')}</span>
          <div className="au-input">
            <i className="ri-mail-line" />
            <input
              type="email"
              name="email"
              autoComplete="email"
              dir="ltr"
              value={email}
              placeholder={t('dashboard.auth.emailPh')}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </label>

        <label className="au-field">
          <span>{t('dashboard.auth.password')}</span>
          <div className="au-input">
            <i className="ri-lock-line" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              dir="ltr"
              value={password}
              placeholder={t('dashboard.auth.passwordPh')}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="au-eye"
              aria-label={showPassword ? t('dashboard.auth.hide') : t('dashboard.auth.show')}
              onClick={() => setShowPassword((v) => !v)}
            >
              <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} />
            </button>
          </div>
        </label>

        <div className="au-row">
          <label className="au-check">
            <input type="checkbox" defaultChecked />
            <span>{t('dashboard.auth.remember')}</span>
          </label>
          <a className="au-link" href={`/auth/${panel.key}/forgot`}>
            {t('dashboard.auth.forgot')}
          </a>
        </div>

        <button type="submit" className="au-submit" disabled={busy}>
          {busy ? <i className="ri-loader-4-line spin" /> : <i className="ri-login-box-line" />}
          {busy ? t('dashboard.auth.working') : t('dashboard.auth.submitLogin')}
        </button>
      </form>
    </AuthShell>
  );
}