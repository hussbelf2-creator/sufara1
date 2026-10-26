import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface Hours {
  d: string;
  v: string;
}

interface Faq {
  q: string;
  a: string;
}

export default function SupportAside() {
  const { t } = useTranslation();
  const [open, setOpen] = useState<number | null>(0);

  const hoursValue = t('legal.contact.aside.hours', { returnObjects: true });
  const hours = Array.isArray(hoursValue) ? (hoursValue as unknown as Hours[]) : [];

  const responseValue = t('legal.contact.aside.response', { returnObjects: true });
  const response = Array.isArray(responseValue) ? (responseValue as unknown as string[]) : [];

  const faqValue = t('legal.contact.aside.faqs', { returnObjects: true });
  const faqs = Array.isArray(faqValue) ? (faqValue as unknown as Faq[]) : [];

  return (
    <aside className="st-sup-aside">
      <div className="st-sup-card">
        <h3>
          <i className="ri-time-line" />
          {t('legal.contact.aside.hoursTitle')}
        </h3>
        <ul className="st-sup-hours">
          {hours.map((row) => (
            <li key={row.d}>
              <span className="d">{row.d}</span>
              <span className="v">{row.v}</span>
            </li>
          ))}
        </ul>
        <p className="st-sup-hint">
          <i className="ri-global-line" />
          {t('legal.contact.aside.hint')}
        </p>
      </div>

      <div className="st-sup-card">
        <h3>
          <i className="ri-timer-flash-line" />
          {t('legal.contact.aside.responseTitle')}
        </h3>
        <ul className="st-sup-list">
          {response.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <div className="st-sup-card">
        <h3>
          <i className="ri-question-line" />
          {t('legal.contact.aside.faqTitle')}
        </h3>
        <div className="st-sup-faq">
          {faqs.map((faq, index) => (
            <div
              className={`st-sup-faq-item${open === index ? ' is-open' : ''}`}
              key={faq.q}
            >
              <button
                type="button"
                onClick={() => setOpen(open === index ? null : index)}
                aria-expanded={open === index}
              >
                {faq.q}
                <i className={open === index ? 'ri-subtract-line' : 'ri-add-line'} />
              </button>
              {open === index && <p className="a">{faq.a}</p>}
            </div>
          ))}
        </div>
        <Link className="st-sup-faq-all" to="/faq">
          <i className="ri-question-answer-line" />
          {t('faq.crumb')}
          <i className="ri-arrow-left-line" />
        </Link>
      </div>
    </aside>
  );
}