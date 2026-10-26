import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthShell from '@/pages/auth/components/AuthShell';
import OtpInput from '@/pages/auth/components/OtpInput';
import { AuthError, AuthOk, DemoBox } from '@/pages/auth/components/AuthBits';
import { resolvePanel } from '@/pages/auth/lib/panels';
import {
  confirmCode, ensureProfile, errorKey, resendConfirmation,
} from '@/pages/auth/lib/authApi';

const RESEND_SECONDS = 45;

export default function AuthVerifyPage() {
  const { t } = useTranslation();
  const { panel: panelParam } = useParams();
  const panel = resolvePanel(panelParam);
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const mode = params.get('mode') === 'recovery' ? 'recovery' : 'signup';
  const email = params.get('email') ?? '';

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const sentOnce = useRef(false);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const timer = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);

  const finish = async (token: string) => {
    setError('');
    setOk('');
    if (token.length !== 6) {
      setError(t('dashboard.auth.errors.code'));
      return;
    }
    setBusy(true);
    try {
      const { data, error: authError } = await confirmCode(email, token, mode);
      if (authError) {
        setError(t(`dashboard.auth.errors.${errorKey(authError.message)}`));
        return;
      }
      await ensureProfile(data.user, panel.key);
      if (mode === 'recovery') {
        navigate(`/auth/${panel.key}/reset`);
        return;
      }
      setOk(t('dashboard.auth.verified'));
      navigate(`/dashboard?mode=${panel.key}`);
    } catch {
      setError(t('dashboard.auth.errors.generic'));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (seconds > 0 || !email) return;
    setError('');
    setOk('');
    try {
      const { error: resendError } = await resendConfirmation(email);
      if (resendError) {
        setError(t(`dashboard.auth.errors.${errorKey(resendError.message)}`));
        return;
      }
      sentOnce.current = true;
      setSeconds(RESEND_SECONDS);
      setOk(t('dashboard.auth.resent'));
    } catch {
      setError(t('dashboard.auth.errors.generic'));
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    finish(code);
  };

  return (
    <AuthShell
      panel={panel}
      eyebrow={t('dashboard.auth.verifyEyebrow')}
      title={mode === 'recovery' ? t('dashboard.auth.recoveryCodeTitle') : t('dashboard.auth.verifyTitle')}
      subtitle={t('dashboard.auth.verifySub', { email })}
      demo={<DemoBox panel={panel} compact />}
      footer={(
        <p className="au-switchline">
          <a href={`/auth/${panel.key}`}>{t('dashboard.auth.backToLogin')}</a>
        </p>
      )}
    >
      <form className="au-form" onSubmit={submit} noValidate>
        <AuthError message={error} />
        <AuthOk message={ok} />

        <div className="au-otp-wrap">
          <span className="au-field-label">{t('dashboard.auth.codeLabel')}</span>
          <OtpInput
            value={code}
            onChange={setCode}
            disabled={busy}
            invalid={Boolean(error)}
            label={t('dashboard.auth.codeLabel')}
            onComplete={(value) => finish(value)}
          />
          <p className="au-hint">
            <i className="ri-time-line" />
            {t('dashboard.auth.codeHint')}
          </p>
        </div>

        <button type="submit" className="au-submit" disabled={busy}>
          {busy ? <i className="ri-loader-4-line spin" /> : <i className="ri-shield-check-line" />}
          {busy ? t('dashboard.auth.working') : t('dashboard.auth.submitVerify')}
        </button>

        <div className="au-resend">
          {mode === 'signup' ? (
            <button type="button" onClick={resend} disabled={seconds > 0}>
              <i className="ri-refresh-line" />
              {seconds > 0
                ? t('dashboard.auth.resendIn', { s: seconds })
                : t('dashboard.auth.resend')}
            </button>
          ) : (
            <a className="au-link" href={`/auth/${panel.key}/forgot`}>
              {t('dashboard.auth.requestNew')}
            </a>
          )}
          <a className="au-link" href={`/auth/${panel.key}`}>{t('dashboard.auth.changeEmail')}</a>
        </div>
      </form>
    </AuthShell>
  );
}