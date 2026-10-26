import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthShell from '@/pages/auth/components/AuthShell';
import RegFieldInput from '@/pages/auth/components/RegField';
import { AuthError, DemoBox } from '@/pages/auth/components/AuthBits';
import { resolvePanel } from '@/pages/auth/lib/panels';
import { CONTACT_FIELDS, fieldsFor, isSaudi } from '@/pages/auth/lib/registerFields';
import { createAccount, ensureProfile, errorKey } from '@/pages/auth/lib/authApi';

type VerifyMethod = 'nafath' | 'cr' | 'manual';

export default function AuthRegisterPage() {
  const { t } = useTranslation();
  const { panel: panelParam } = useParams();
  const panel = resolvePanel(panelParam);
  const navigate = useNavigate();
  /* Invite links from a leader ambassador (?leader=CODE) attach the new
     ambassador to that leader's one-level team; pilgrims are the default
     acquisition channel for those invites. */
  const [search] = useSearchParams();
  const leaderCode = (search.get('leader') ?? '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 40);

  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [verifyMethod, setVerifyMethod] = useState<VerifyMethod>('nafath');
  const [terms, setTerms] = useState(false);
  const [agreement, setAgreement] = useState(false);
  const needsAgreement = panel.key === 'ambassador' || panel.key === 'factory';
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const panelFields = useMemo(() => fieldsFor(panel.key), [panel.key]);
  const saudia = isSaudi(form.country ?? '');

  const setValue = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const stepOneValid = () => {
    if (!fullName.trim() || !email.trim() || !password || !confirm) return 'required';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'email';
    if (!/^[+\d][\d\s-]{7,}$/.test((form.phone ?? '').trim())) return 'phone';
    if (password.length < 8) return 'short';
    if (password !== confirm) return 'mismatch';
    return '';
  };

  const stepTwoValid = () => {
    if (!form.country || !form.city?.trim()) return 'required';
    const missing = panelFields.some((field) => field.required && !form[field.name]?.trim());
    return missing ? 'panel' : '';
  };

  const goNext = () => {
    const problem = step === 0 ? stepOneValid() : stepTwoValid();
    if (problem) {
      setError(t(`dashboard.auth.errors.${problem}`));
      return;
    }
    setError('');
    setStep((s) => Math.min(2, s + 1));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step < 2) {
      goNext();
      return;
    }
    setError('');
    if (!terms || (needsAgreement && !agreement)) {
      setError(t('dashboard.auth.errors.terms'));
      return;
    }
    const method: VerifyMethod = saudia ? verifyMethod : 'manual';

    setBusy(true);
    try {
      const { data, error: authError } = await createAccount({
        email,
        password,
        fullName,
        panel: panel.key,
        company: form.company ?? '',
        /* verification status is set by the server, never sent from here */
        profile: {
          ...form,
          verification_method: method,
          ...(leaderCode ? { leader_code: leaderCode, acquisition_channel: 'pilgrims' } : {}),
        },
      });
      if (authError) {
        setError(t(`dashboard.auth.errors.${errorKey(authError.message)}`));
        return;
      }
      if (data.session) {
        await ensureProfile(data.user, panel.key);
        navigate(`/dashboard?mode=${panel.key}`);
        return;
      }
      navigate(`/auth/${panel.key}/verify?email=${encodeURIComponent(email.trim())}&mode=signup`);
    } catch {
      setError(t('dashboard.auth.errors.generic'));
    } finally {
      setBusy(false);
    }
  };

  const reviewRows: Array<{ label: string; value: string }> = [
    { label: t('dashboard.auth.field.fullName'), value: fullName },
    { label: t('dashboard.auth.field.email'), value: email },
    { label: t('dashboard.auth.field.phone'), value: form.phone ?? '' },
    {
      label: t('dashboard.auth.field.country'),
      value: form.country ? t(`dashboard.auth.option.${form.country}`) : '',
    },
    { label: t('dashboard.auth.field.city'), value: form.city ?? '' },
    ...panelFields
      .filter((field) => form[field.name])
      .map((field) => ({
        label: t(`dashboard.auth.field.${field.name}`),
        value: field.kind === 'select'
          ? t(`dashboard.auth.option.${form[field.name]}`)
          : form[field.name],
      })),
  ].filter((row) => row.value);

  return (
    <AuthShell
      panel={panel}
      eyebrow={t('dashboard.auth.registerEyebrow')}
      title={t('dashboard.auth.registerTitle')}
      subtitle={t('dashboard.auth.registerSub', { panel: t(`dashboard.group.${panel.key}`) })}
      demo={<DemoBox panel={panel} compact />}
      footer={(
        <p className="au-switchline">
          {t('dashboard.auth.haveAccount')}
          <a href={`/auth/${panel.key}`}>{t('dashboard.auth.signIn')}</a>
        </p>
      )}
    >
      <ol className="au-steps">
        {[0, 1, 2].map((index) => (
          <li key={index} className={index === step ? 'is-on' : index < step ? 'is-done' : ''}>
            <span className="au-step-dot">
              {index < step ? <i className="ri-check-line" /> : index + 1}
            </span>
            <span className="au-step-label">{t(`dashboard.auth.reg.step${index + 1}`)}</span>
          </li>
        ))}
      </ol>

      <form className="au-form" onSubmit={submit} noValidate>
        <AuthError message={error} />

        {step === 0 && (
          <>
            <label className="au-field is-full">
              <span>{t('dashboard.auth.field.fullName')}<em className="au-req">*</em></span>
              <div className="au-input">
                <i className="ri-user-line" />
                <input
                  type="text"
                  name="full_name"
                  autoComplete="name"
                  value={fullName}
                  placeholder={t('dashboard.auth.fullNamePh')}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </label>

            <label className="au-field is-full">
              <span>{t('dashboard.auth.field.email')}<em className="au-req">*</em></span>
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

            <div>
              {CONTACT_FIELDS.filter((f) => f.name === 'phone').map((field) => (
                <RegFieldInput
                  key={field.name}
                  field={{ ...field, half: false }}
                  value={form[field.name] ?? ''}
                  onChange={(v) => setValue(field.name, v)}
                />
              ))}
            </div>

            <div className="au-grid2">
              <label className="au-field">
                <span>{t('dashboard.auth.password')}<em className="au-req">*</em></span>
                <div className="au-input">
                  <i className="ri-lock-line" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="new-password"
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

              <label className="au-field">
                <span>{t('dashboard.auth.confirmPassword')}<em className="au-req">*</em></span>
                <div className="au-input">
                  <i className="ri-shield-check-line" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirm_password"
                    autoComplete="new-password"
                    dir="ltr"
                    value={confirm}
                    placeholder={t('dashboard.auth.passwordPh')}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
              </label>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <p className="au-step-hint">
              <i className="ri-information-line" />
              {t(`dashboard.auth.reg.hint_${panel.key}`)}
            </p>
            <div className="au-field-grid">
              {CONTACT_FIELDS.filter((f) => f.name !== 'phone').map((field) => (
                <RegFieldInput
                  key={field.name}
                  field={field}
                  value={form[field.name] ?? ''}
                  onChange={(v) => setValue(field.name, v)}
                />
              ))}
              {panelFields.map((field) => (
                <RegFieldInput
                  key={field.name}
                  field={field}
                  value={form[field.name] ?? ''}
                  onChange={(v) => setValue(field.name, v)}
                />
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <section className="au-verify">
              <header>
                <h3>{t('dashboard.auth.reg.verifyTitle')}</h3>
                <p>{t('dashboard.auth.reg.verifySub')}</p>
              </header>

              {saudia ? (
                <div className="au-verify-options">
                  <button
                    type="button"
                    className={`au-verify-card ${verifyMethod === 'nafath' ? 'is-on' : ''}`}
                    onClick={() => setVerifyMethod('nafath')}
                  >
                    <span className="au-verify-icon"><i className="ri-shield-user-line" /></span>
                    <b>{t('dashboard.auth.reg.nafathTitle')}</b>
                    <small>{t('dashboard.auth.reg.nafathBody')}</small>
                  </button>
                  <button
                    type="button"
                    className={`au-verify-card ${verifyMethod === 'cr' ? 'is-on' : ''}`}
                    onClick={() => setVerifyMethod('cr')}
                  >
                    <span className="au-verify-icon"><i className="ri-file-shield-2-line" /></span>
                    <b>{t('dashboard.auth.reg.crTitle')}</b>
                    <small>{t('dashboard.auth.reg.crBody')}</small>
                  </button>
                </div>
              ) : (
                <p className="au-hint">
                  <i className="ri-global-line" />
                  {t('dashboard.auth.reg.intlNote')}
                </p>
              )}

              <p className="au-note">
                <i className="ri-time-line" />
                {t('dashboard.auth.reg.pendingNote')}
              </p>
            </section>

            <section className="au-review">
              <h3>{t('dashboard.auth.reg.reviewTitle')}</h3>
              <ul>
                {reviewRows.map((row) => (
                  <li key={row.label}>
                    <span>{row.label}</span>
                    <b dir="auto">{row.value}</b>
                  </li>
                ))}
              </ul>
              <button type="button" className="au-link au-review-edit" onClick={() => setStep(1)}>
                <i className="ri-pencil-line" />
                {t('dashboard.auth.reg.editData')}
              </button>
            </section>

            <label className="au-check">
              <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
              <span>
                {t('dashboard.auth.terms')}
                {' '}
                <a href="/terms" className="au-link">{t('dashboard.auth.termsLink')}</a>
                {' · '}
                <a href="/privacy" className="au-link">{t('dashboard.auth.privacyLink')}</a>
              </span>
            </label>

            {needsAgreement && (
              <label className="au-check">
                <input type="checkbox" checked={agreement} onChange={(e) => setAgreement(e.target.checked)} />
                <span>
                  {t('dashboard.auth.agreementLead')}{' '}
                  <a href={panel.key === 'factory' ? '/legal/factory' : '/legal/ambassador'} className="au-link" target="_blank" rel="noreferrer">
                    {t(panel.key === 'factory' ? 'dashboard.auth.factoryAgreement' : 'dashboard.auth.ambassadorAgreement')}
                  </a>
                </span>
              </label>
            )}

            {panel.key === 'admin' && (
              <div className="au-note">
                <i className="ri-information-line" />
                {t('dashboard.auth.verifyAdminNote')}
              </div>
            )}
          </>
        )}

        <div className="au-actions">
          {step > 0 && (
            <button type="button" className="au-ghost" onClick={() => { setError(''); setStep((s) => s - 1); }}>
              <i className="ri-arrow-right-line" />
              {t('dashboard.auth.reg.back')}
            </button>
          )}
          <button type="submit" className="au-submit" disabled={busy}>
            {busy
              ? <i className="ri-loader-4-line spin" />
              : <i className={step === 2 ? 'ri-user-add-line' : 'ri-arrow-left-line'} />}
            {busy
              ? t('dashboard.auth.working')
              : step === 2
                ? t('dashboard.auth.submitRegister')
                : t('dashboard.auth.reg.next')}
          </button>
        </div>
      </form>
    </AuthShell>
  );
}