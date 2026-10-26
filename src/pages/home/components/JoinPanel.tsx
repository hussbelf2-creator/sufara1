import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import Panel from './Panel';
import { formEndpoint, joinPanel } from '@/mocks/home';
import { useCms } from '@/hooks/useCms';

type Status = 'idle' | 'sending' | 'ok' | 'error';

export default function JoinPanel() {
  const { t } = useTranslation();
  const cms = useCms();
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    // Anti-spam: a filled honeypot never reaches the server, and the bot is told nothing.
    const trap = String(fd.get('website_alt') || '').trim();
    if (trap) {
      setStatus('ok');
      setMessage(t('home.join.okTrap'));
      form.reset();
      return;
    }
    fd.delete('website_alt');

    const body = new URLSearchParams();
    fd.forEach((value, key) => body.append(key, String(value)));

    setStatus('sending');
    setMessage('');

    try {
      const response = await fetch(formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      const responseText = await response.text();
      let parsed: { code?: string; message?: string; meta?: { message?: string; detail?: string } } | null = null;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = null;
      }
      const code = parsed?.code;
      const serverMsg = parsed?.meta?.message || parsed?.message || parsed?.meta?.detail || responseText;
      const looksSpam = typeof serverMsg === 'string' && serverMsg.toLowerCase().includes('spam');

      if (response.ok && code === 'OK' && !looksSpam) {
        setStatus('ok');
        setMessage(t('home.join.ok'));
        form.reset();
      } else {
        setStatus('error');
        setMessage(typeof serverMsg === 'string' && serverMsg ? serverMsg : t('home.join.err'));
      }
    } catch {
      setStatus('error');
      setMessage(t('home.join.errNet'));
    }
  }

  return (
    <Panel
      id={joinPanel.id}
      side="left"
      image={joinPanel.image}
      alt={t('home.join.alt')}
      stamp={cms.get('home.join.stamp', t('home.join.stamp'))}
      title={cms.get('home.join.title', t('home.join.title'))}
      sub={cms.get('home.join.sub', t('home.join.sub'))}
    >
      <form
        id="sta-join-form"
        className="join-form"
        data-readdy-form
        method="post"
        action={formEndpoint}
        onSubmit={handleSubmit}
      >
        <div className="row">
          <div data-reveal>
            <label htmlFor="sta-name">{t('home.join.name')}</label>
            <input id="sta-name" name="name" type="text" autoComplete="name" required placeholder={t('home.join.namePh')} />
          </div>
          <div data-reveal>
            <label htmlFor="sta-email">{t('home.join.email')}</label>
            <input id="sta-email" name="email" type="email" autoComplete="email" required placeholder="name@example.com" />
          </div>
        </div>

        <div className="row">
          <div data-reveal>
            <label htmlFor="sta-phone">{t('home.join.phone')}</label>
            <input id="sta-phone" name="phone" type="tel" autoComplete="tel" placeholder={t('home.join.phonePh')} />
          </div>
          <div data-reveal>
            <label htmlFor="sta-country">{t('home.join.country')}</label>
            <input id="sta-country" name="country" type="text" autoComplete="country-name" placeholder={t('home.join.countryPh')} />
          </div>
        </div>

        <div data-reveal>
          <label htmlFor="sta-type">{t('home.join.type')}</label>
          <select id="sta-type" name="account_type" defaultValue="ambassador">
            <option value="ambassador">{t('home.join.optAmbassador')}</option>
            <option value="factory">{t('home.join.optFactory')}</option>
            <option value="buyer">{t('home.join.optBuyer')}</option>
          </select>
        </div>

        <div data-reveal>
          <label htmlFor="sta-message">{t('home.join.message')}</label>
          <textarea id="sta-message" name="message" maxLength={500} placeholder={t('home.join.messagePh')} />
        </div>

        {/* صيد الروبوتات — مخفي بأنماط الصفحة، وليس مطلوبًا ولا يُملأ تلقائيًا */}
        <input
          className="extras-field"
          type="text"
          name="website_alt"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          readOnly
        />

        <div data-reveal>
          <button className="submit" type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? t('home.join.sending') : t('home.join.submit')}
          </button>
        </div>

        {message && (
          <p className={`form-note ${status === 'error' ? 'error' : 'ok'}`} role="status">{message}</p>
        )}
      </form>
    </Panel>
  );
}