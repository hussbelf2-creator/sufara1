import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createTicket } from '@/pages/support/lib/ticketStore';

const FORM_ENDPOINT = 'https://readdy.ai/api/form/db9fvk8kk00l6eltrrhg';
const MESSAGE_LIMIT = 500;

interface Topic {
  value: string;
  label: string;
}

interface RelatedLink {
  label: string;
  to: string;
}

type Status = 'idle' | 'sending' | 'ok' | 'error';

interface ApiReply {
  code?: string;
  message?: string;
  meta?: { message?: string; detail?: string };
}

export default function ContactForm() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<Status>('idle');
  const [errorText, setErrorText] = useState('');
  const [length, setLength] = useState(0);
  const [ticketRef, setTicketRef] = useState('');

  const topicsValue = t('legal.contact.topics', { returnObjects: true });
  const topics = Array.isArray(topicsValue) ? (topicsValue as unknown as Topic[]) : [];

  const relatedValue = t('legal.relatedLinks', { returnObjects: true });
  const related = Array.isArray(relatedValue) ? (relatedValue as unknown as RelatedLink[]) : [];
  const privacyLink = related.find((item) => item.to === '/privacy');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'sending') return;

    /* Build the payload from the live form so browser autofill is included. */
    const form = event.currentTarget;
    const formData = new FormData(form);
    const trap = String(formData.get('contact_alt') ?? '').trim();

    if (trap) {
      setStatus('ok');
      form.reset();
      setLength(0);
      return;
    }

    const payload = new URLSearchParams();
    formData.forEach((value, key) => {
      if (key === 'contact_alt') return;
      if (typeof value === 'string') payload.append(key, value);
    });

    setStatus('sending');
    setErrorText('');

    try {
      const response = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload.toString(),
      });

      const responseText = await response.text();
      let parsed: ApiReply | null = null;
      try {
        parsed = JSON.parse(responseText) as ApiReply;
      } catch {
        parsed = null;
      }

      const serverMessage =
        parsed?.meta?.message ||
        parsed?.meta?.detail ||
        parsed?.message ||
        (responseText || '').slice(0, 180);

      const looksLikeSpam = /spam/i.test(serverMessage || '');
      const accepted = response.ok && parsed?.code === 'OK' && !looksLikeSpam;

      if (accepted) {
        const topic = String(formData.get('topic') ?? 'other');
        const message = String(formData.get('message') ?? '');
        const orderRef = String(formData.get('order_number') ?? '');
        const name = String(formData.get('name') ?? '');
        const ticket = createTicket({ topic, message, orderRef, name });
        setTicketRef(ticket.id);
        setStatus('ok');
        form.reset();
        setLength(0);
      } else {
        setStatus('error');
        setErrorText(serverMessage || t('legal.contact.formError'));
      }
    } catch {
      setStatus('error');
      setErrorText(t('legal.contact.formError'));
    }
  };

  if (status === 'ok') {
    return (
      <div className="st-sup-form-card" id="contact">
        <div className="st-sup-sent">
          <span className="ic" aria-hidden="true">
            <i className="ri-checkbox-circle-fill" />
          </span>
          <div>
            <b>{t('legal.contact.successTitle')}</b>
            {ticketRef && (
              <span className="st-sup-ticket-ref">
                <i className="ri-ticket-2-line" />
                {t('legal.contact.ticketRef')}: <strong>{ticketRef}</strong>
              </span>
            )}
            <p>{t('legal.contact.successText')}</p>
            <div className="st-sup-sent-actions">
              <button type="button" onClick={() => setStatus('idle')}>
                <i className="ri-mail-add-line" />
                {t('legal.contact.sendAnother')}
              </button>
              <Link to="/dashboard?view=tickets">
                <i className="ri-customer-service-2-line" />
                {t('legal.contact.trackTicket')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="st-sup-form-card" id="contact">
      <div className="st-sup-form-head">
        <h2>{t('legal.contact.formTitle')}</h2>
        <p>{t('legal.contact.formSub')}</p>
      </div>

      <form
        id="sia-support-form"
        data-readdy-form
        onSubmit={handleSubmit}
        className="st-form-grid"
        noValidate={false}
      >
        <div className="st-field">
          <label htmlFor="sup-name">
            {t('legal.contact.fields.name')} <span className="req">*</span>
          </label>
          <input
            id="sup-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder={t('legal.contact.fields.namePh')}
          />
        </div>

        <div className="st-field">
          <label htmlFor="sup-email">
            {t('legal.contact.fields.email')} <span className="req">*</span>
          </label>
          <input
            id="sup-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={t('legal.contact.fields.emailPh')}
          />
        </div>

        <div className="st-field">
          <label htmlFor="sup-phone">{t('legal.contact.fields.phone')}</label>
          <input
            id="sup-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder={t('legal.contact.fields.phonePh')}
          />
          <span className="hint">
            <i className="ri-information-line" />
            {t('legal.contact.fields.phoneHint')}
          </span>
        </div>

        <div className="st-field">
          <label htmlFor="sup-topic">
            {t('legal.contact.fields.topic')} <span className="req">*</span>
          </label>
          <select id="sup-topic" name="topic" required defaultValue="order">
            {topics.map((topic) => (
              <option key={topic.value} value={topic.value}>
                {topic.label}
              </option>
            ))}
          </select>
        </div>

        <div className="st-field full">
          <label htmlFor="sup-order">{t('legal.contact.fields.order')}</label>
          <input
            id="sup-order"
            name="order_number"
            type="text"
            placeholder={t('legal.contact.fields.orderPh')}
          />
          <span className="hint">
            <i className="ri-file-list-3-line" />
            {t('legal.contact.fields.orderHint')}
          </span>
        </div>

        <div className="st-field full">
          <label htmlFor="sup-message">
            {t('legal.contact.fields.message')} <span className="req">*</span>
          </label>
          <textarea
            id="sup-message"
            name="message"
            required
            maxLength={MESSAGE_LIMIT}
            placeholder={t('legal.contact.fields.messagePh')}
            onChange={(event) => setLength(event.target.value.length)}
          />
          <span className="hint">
            <i className="ri-text-wrap" />
            {t('legal.contact.fields.messageHint')} · {length}/{MESSAGE_LIMIT}
          </span>
        </div>

        <label className="st-sup-consent">
          <input type="checkbox" name="consent" value="yes" required />
          <span>
            {t('legal.contact.fields.consent')}{' '}
            <Link to="/privacy">{privacyLink?.label ?? t('legal.privacy.crumb')}</Link>
          </span>
        </label>

        {/* anti-spam field, kept out of the visual flow */}
        <div className="st-sup-hp" aria-hidden="true">
          <input
            type="text"
            name="contact_alt"
            tabIndex={-1}
            autoComplete="off"
            readOnly
          />
        </div>

        {status === 'error' && (
          <div className="st-form-status err" role="alert">
            <i className="ri-error-warning-line" />
            <span>{errorText || t('legal.contact.formError')}</span>
          </div>
        )}

        <div className="st-sup-actions">
          <button type="submit" className="st-btn primary" disabled={status === 'sending'}>
            <i className={status === 'sending' ? 'ri-loader-4-line' : 'ri-send-plane-2-line'} />
            {status === 'sending' ? t('legal.contact.sending') : t('legal.contact.submit')}
          </button>
          <span className="note">
            <i className="ri-shield-check-line" />
            {t('legal.contact.formNote')}
          </span>
        </div>
      </form>
    </div>
  );
}