import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StoreNav from '@/components/feature/StoreNav';
import StoreFooter from '@/components/feature/StoreFooter';
import JsonLd from '@/components/feature/JsonLd';
import { initPanels } from '@/pages/home/lib/panels';
import { breadcrumbSchema } from '@/lib/seo';
import { usePlatformConfig } from '@/config/store';
import { LEGAL_DOCS, legalValues, type LegalDocKey } from '@/config/legal';

export interface LegalSection {
  id: string;
  title: string;
  body: string;
  points?: string[];
}

interface RelatedLink {
  label: string;
  to: string;
}

interface LegalPageProps {
  doc: LegalDocKey;
}

/* Shared shell for the legal documents and agreements: hero, sticky contents
   rail, numbered sections and cross-links to the sibling documents. Figures
   (commission, platform share, return windows) are interpolated from the live
   commercial settings, so a contract never quotes a stale number. */
export default function LegalPage({ doc }: LegalPageProps) {
  const { t, i18n } = useTranslation();
  const cfg = usePlatformConfig();
  const values = useMemo(() => legalValues(cfg), [cfg]);
  const meta = LEGAL_DOCS[doc];

  const sections = useMemo(() => {
    const value = t(`legal.${doc}.sections`, { returnObjects: true, ...values });
    return Array.isArray(value) ? (value as unknown as LegalSection[]) : [];
  }, [doc, t, values]);

  /* Return window per destination, straight from the shipping zones. */
  const zones = useMemo(() => {
    if (doc !== 'returns') return [];
    let names: Intl.DisplayNames | null = null;
    try { names = new Intl.DisplayNames([i18n.language], { type: 'region' }); } catch { names = null; }
    const byZone = new Map<string, string[]>();
    Object.entries(cfg.shipping.countryZone).forEach(([cc, zone]) => {
      byZone.set(zone, [...(byZone.get(zone) ?? []), names?.of(cc.toUpperCase()) ?? cc.toUpperCase()]);
    });
    return Object.entries(cfg.shipping.express)
      .filter(([zone]) => byZone.has(zone))
      .map(([zone, z]) => ({ zone, days: z.returnDays, countries: byZone.get(zone) ?? [] }))
      .sort((a, b) => a.days - b.days);
  }, [doc, cfg, i18n.language]);

  const related = useMemo(() => {
    const value = t('legal.relatedLinks', { returnObjects: true });
    return Array.isArray(value) ? (value as unknown as RelatedLink[]) : [];
  }, [t]);

  const [active, setActive] = useState('');

  const title = t(`legal.${doc}.crumb`);

  useEffect(() => initPanels(), []);

  useEffect(() => {
    const previous = document.title;
    document.title = `${title} — Safeer`;
    return () => {
      document.title = previous;
    };
  }, [title]);

  useEffect(() => {
    if (!sections.length) return;
    setActive(sections[0].id);

    if (typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: '-120px 0px -62% 0px', threshold: 0 },
    );

    sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  const currentPath = meta.path;

  const crumbSchema = useMemo(() => breadcrumbSchema([
    { name: t('legal.crumbHome'), path: '/' },
    { name: title, path: currentPath },
  ]), [t, title, currentPath]);

  return (
    <div className="st-shell">
      <JsonLd id="sia-legal-breadcrumb" data={crumbSchema} />
      <StoreNav />

      <main>
        <header className="st-hero">
          <div className="st-wrap">
            <nav className="st-crumbs" aria-label={title}>
              <Link to="/">{t('legal.crumbHome')}</Link>
              <i className="ri-arrow-left-s-line" />
              <span>{title}</span>
            </nav>

            <h1>
              {t(`legal.${doc}.titleLead`)}{' '}
              <em className="accent">{t(`legal.${doc}.titleAccent`)}</em>
            </h1>
            <p className="lead">{t(`legal.${doc}.sub`, values)}</p>

            <div className="st-legal-badges">
              <span className="st-legal-badge">
                <i className="ri-calendar-check-line" />
                {t('legal.updatedLabel')}: {new Date(meta.effective).toLocaleDateString(i18n.language.startsWith('ar') ? 'ar-EG' : i18n.language, { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="st-legal-badge">
                <i className="ri-git-commit-line" />
                {t('legal.versionLabel')}: <span dir="ltr">{meta.version}</span>
              </span>
              <span className="st-legal-badge">
                <i className="ri-draft-line" />
                {t('legal.toc')} · {sections.length}
              </span>
            </div>
          </div>
        </header>

        <div className="st-wrap">
          <div className="st-legal-grid">
            <aside className="st-legal-toc">
              <h2>
                <i className="ri-list-check-2" />
                {t('legal.toc')}
              </h2>
              <ol>
                {sections.map((section, index) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className={active === section.id ? 'is-on' : ''}
                      onClick={() => setActive(section.id)}
                    >
                      <span className="n">{String(index + 1).padStart(2, '0')}</span>
                      <span>{section.title}</span>
                    </a>
                  </li>
                ))}
              </ol>
              <Link className="toc-cta" to="/support">
                <i className="ri-customer-service-2-line" />
                <span>{t('legal.help.cta')}</span>
                <i className="ri-arrow-left-line" />
              </Link>
            </aside>

            <article className="st-legal-doc">
              <p className="st-legal-intro">{t(`legal.${doc}.intro`, values)}</p>

              {sections.map((section, index) => (
                <section className="st-legal-sec" id={section.id} key={section.id}>
                  <h2>
                    <span className="num">{String(index + 1).padStart(2, '0')}</span>
                    <span>{section.title}</span>
                  </h2>
                  <p>{section.body}</p>
                  {section.points && section.points.length > 0 && (
                    <ul>
                      {section.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  )}
                  {section.id === 'window' && zones.length > 0 && (
                    <div className="st-legal-table" role="region" aria-label={t('legal.zoneTable.title')} style={{ overflowX: 'auto', marginTop: 12 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                        <caption style={{ textAlign: 'start', fontWeight: 700, padding: '6px 0' }}>{t('legal.zoneTable.title')}</caption>
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'start', padding: '8px 6px', borderBottom: '1px solid var(--line, #ddd)' }}>{t('legal.zoneTable.countries')}</th>
                            <th style={{ textAlign: 'start', padding: '8px 6px', borderBottom: '1px solid var(--line, #ddd)', whiteSpace: 'nowrap' }}>{t('legal.zoneTable.days')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {zones.map((z) => (
                            <tr key={z.zone}>
                              <td style={{ padding: '8px 6px', borderBottom: '1px solid var(--line, #eee)' }}>{z.countries.join('، ')}</td>
                              <td style={{ padding: '8px 6px', borderBottom: '1px solid var(--line, #eee)', fontWeight: 700 }}>{t('legal.zoneTable.daysValue', { count: z.days })}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p style={{ fontSize: 13, opacity: 0.8 }}>{t('legal.zoneTable.note')}</p>
                    </div>
                  )}
                </section>
              ))}

              <div className="st-legal-foot">
                {related.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={link.to === currentPath ? 'is-here' : ''}
                  >
                    <i className={link.to === currentPath ? 'ri-file-text-line' : 'ri-arrow-left-up-line'} />
                    {link.label}
                  </Link>
                ))}
              </div>
            </article>
          </div>

          <div className="st-legal-help">
            <span className="ic" aria-hidden="true">
              <i className="ri-question-answer-line" />
            </span>
            <div className="body">
              <h3>{t('legal.help.title')}</h3>
              <p>{t('legal.help.text')}</p>
            </div>
            <Link className="st-btn primary" to="/support">
              <i className="ri-customer-service-2-line" />
              {t('legal.help.cta')}
            </Link>
          </div>
        </div>
      </main>

      <StoreFooter />
    </div>
  );
}