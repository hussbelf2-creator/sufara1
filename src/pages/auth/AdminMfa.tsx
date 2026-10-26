import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';

/* Second factor for the operations room. An admin session must reach
   assurance level aal2 (TOTP) before any admin view renders; the database
   policies on admin tables check the same claim (auth.jwt()->>'aal'). */
export default function AdminMfa() {
  const { t } = useTranslation();
  const { refreshAccess } = useAuth();
  const [factorId, setFactorId] = useState('');
  const [qr, setQr] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.mfa.listFactors();
      const verified = data?.totp?.find((f) => f.status === 'verified');
      if (verified) {
        if (alive) setFactorId(verified.id);
        return;
      }
      const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (!alive) return;
      if (enrollError || !enrolled) {
        setError(t('platform.gate.mfaError'));
        return;
      }
      setFactorId(enrolled.id);
      setQr(enrolled.totp.qr_code);
      setSecret(enrolled.totp.secret);
    })();
    return () => {
      alive = false;
    };
  }, [t]);

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    if (!factorId || code.trim().length < 6) return;
    setBusy(true);
    setError('');
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
    setBusy(false);
    if (verifyError) {
      setError(t('platform.gate.mfaWrong'));
      return;
    }
    refreshAccess();
  };

  return (
    <div className="card dash-mfa">
      <div className="dash-mfa-head">
        <i className="ri-shield-keyhole-line" />
        <div>
          <h3>{t('platform.gate.mfaTitle')}</h3>
          <p className="muted small">{qr ? t('platform.gate.mfaEnroll') : t('platform.gate.mfaPrompt')}</p>
        </div>
      </div>
      {qr && (
        <div className="dash-mfa-qr">
          <img src={qr} alt={t('platform.gate.mfaQrAlt')} width={180} height={180} />
          <code dir="ltr">{secret}</code>
        </div>
      )}
      <form onSubmit={verify} className="dash-mfa-form">
        <label htmlFor="mfa-code" className="small">{t('platform.gate.mfaCode')}</label>
        <input
          id="mfa-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          dir="ltr"
        />
        <button type="submit" className="btn primary" disabled={busy || code.length < 6}>
          <i className={busy ? 'ri-loader-4-line' : 'ri-lock-unlock-line'} /> {t('platform.gate.mfaVerify')}
        </button>
        {error && <p className="small" role="alert" style={{ color: 'var(--danger, #c0392b)' }}>{error}</p>}
      </form>
    </div>
  );
}
