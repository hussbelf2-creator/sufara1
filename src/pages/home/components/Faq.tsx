import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface FaqItem { q: string; a: string; }

/* The title carries one *accent* word, styled like the rest of the page. */
function renderAccent(text: string): ReactNode[] {
  return text.split(/(\*[^*]+\*)/g).filter(Boolean).map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em className="accent" key={i}>{part.slice(1, -1)}</em>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function Faq() {
  const { t } = useTranslation();
  const faq = t('home.faq.items', { returnObjects: true }) as unknown as FaqItem[];
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" style={{ background: 'var(--bg)', padding: 'clamp(56px,8vw,110px) clamp(20px,4vw,56px)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <p className="stamp" data-reveal>{t('home.faq.stamp')}</p>
        <h2
          data-reveal
          style={{ fontSize: 'clamp(28px,4vw,50px)', lineHeight: 1.25, fontWeight: 600, margin: '10px 0 8px' }}
        >
          {renderAccent(t('home.faq.title'))}
        </h2>
        <p className="sub" data-reveal style={{ color: 'var(--muted)', maxWidth: '50ch', marginBottom: 26 }}>
          {t('home.faq.sub')}
        </p>

        <div className="faq-list">
          {faq.map((item, i) => (
            /* The reveal lives on this outer wrapper whose class is constant, so
               React re-rendering the row below can never wipe the `is-in` state. */
            <div className="faq-item" data-reveal key={i}>
              <div className={`faq-row${open === i ? ' open' : ''}`}>
                <button type="button" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                  <span>{item.q}</span>
                  <i className={open === i ? 'ri-subtract-line' : 'ri-add-line'} />
                </button>
                <div className="faq-body">
                  <p>{item.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}