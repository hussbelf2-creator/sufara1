import { useState } from 'react';
import type { FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthShell from '@/pages/auth/components/AuthShell';
import { AuthError, AuthOk } from '@/pages/auth/components/AuthBits';
import { resolvePanel } from '@/pages/auth/lib/panels';
import { errorKey, requestPasswordReset } from '@/pages/auth/lib/authApi';
import { absoluteUrl } from '@/lib/supabase';

export default function AuthForgotPage() {
  const { t } = useTranslation();
  const { panel: panelParam } = useParams();
  const panel = resolvePanel(panelParam);

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setOk('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError(t('dashboard.auth.errors.email'));
      return;
    }
    setBusy(true);
    try {
      const { error: resetError } = await requestPasswordReset(
        email,
        absoluteUrl(`/auth/${panel.key}/reset`),
      );
      if (resetError) {
        setError(t(`dashboard.auth.errors.${errorKey(resetError.message)}`));
        return;
      }
      setSent(true);
      setOk(t('dashboard.auth.forgotSentBody', { email: email.trim() }));
    } catch {
      setError(t('dashboard.auth.errors.generic'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      panel={panel}
      eyebrow={t('dashboard.auth.forgotEyebrow')}
      title={sent ? t('dashboard.auth.forgotSentTitle') : t('dashboard.auth.forgotTitle')}
      subtitle={sent
        ? t('dashboard.auth.forgotSentSub')
        : t('dashboard.auth.forgotSub')}
      footer={(
        <p className="au-switchline">
          <a href={`/auth/${panel.key}`}>{t('dashboard.auth.backToLogin')}</a>
        </p>
      )}
    >
      {sent ? (
        <div className="au-form">
          <AuthOk message={ok} />
          <a
            className="au-submit as-link"
            href={`/auth/${panel.key}/verify?email=${encodeURIComponent(email.trim())}&mode=recovery`}
          >
            <i className="ri-key-2-line" />
            {t('dashboard.auth.openVerify')}
          </a>
          <p className="au-hint center">
            <i className="ri-mail-check-line" />
            {t('dashboard.auth.forgotCheckSpam')}
          </p>
          <button type="button" className="au-ghost" onClick={() => { setSent(false); setOk(''); }}>
            <i className="ri-arrow-go-back-line" />
            {t('dashboard.auth.tryAnother')}
          </button>
        </div>
      ) : (
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

          <button type="submit" className="au-submit" disabled={busy}>
            {busy ? <i className="ri-loader-4-line spin" /> : <i className="ri-send-plane-line" />}
            {busy ? t('dashboard.auth.working') : t('dashboard.auth.submitForgot')}
          </button>

          <p className="au-hint center">
            <i className="ri-information-line" />
            {t('dashboard.auth.forgotHint')}
          </p>
        </form>
      )}
    </AuthShell>
  );
}