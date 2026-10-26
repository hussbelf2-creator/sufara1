import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StoreNav from '@/components/feature/StoreNav';
import StoreFooter from '@/components/feature/StoreFooter';
import JsonLd from '@/components/feature/JsonLd';
import { initPanels } from '@/pages/home/lib/panels';
import { breadcrumbSchema, SITE_URL } from '@/lib/seo';

interface FaqItem {
  q: string;
  a: string;
}

interface FaqCategory {
  id: string;
  icon: string;
  title: string;
  desc: string;
  items: FaqItem[];
}

interface RelatedLink {
  label: string;
  to: string;
}

export default function FaqPage() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || i18n.language || 'ar').toLowerCase();

  const categoriesValue = t('faq.categories', { returnObjects: true });
  const categories = Array.isArray(categoriesValue) ? (categoriesValue as unknown as FaqCategory[]) : [];

  const relatedValue = t('faq.relatedLinks', { returnObjects: true });
  const related = Array.isArray(relatedValue) ? (relatedValue as unknown as RelatedLink[]) : [];

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string[]>(['orders-0']);
  const [active, setActive] = useState('orders');

  const total = useMemo(
    () => categories.reduce((sum, category) => sum + category.items.length, 0),
    [categories],
  );

  /* Filtering keeps the original category order but drops categories whose
     questions no longer match, so the reader only sees relevant answers. */
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return categories;
    return categories
      .map((category) => ({
        ...category,
        items: category.items.filter(
          (item) => item.q.toLowerCase().includes(needle) || item.a.toLowerCase().includes(needle),
        ),
      }))
      .filter((category) => category.items.length > 0);
  }, [categories, query]);

  const resultCount = useMemo(
    () => filtered.reduce((sum, category) => sum + category.items.length, 0),
    [filtered],
  );

  useEffect(() => initPanels(), []);

  /* Arriving from a quick question opens that section's first answer and
     scrolls straight to it, so the visitor never lands on a closed list. */
  useEffect(() => {
    if (!categories.length) return undefined;
    const hash = window.location.hash.replace('#', '');
    if (!hash) return undefined;
    if (!categories.some((category) => category.id === hash)) return undefined;

    setActive(hash);
    setOpen([`${hash}-0`]);

    const timer = window.setTimeout(() => {
      const target = document.getElementById(hash);
      if (!target) return;
      const top = target.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top, behavior: 'smooth' });
    }, 160);

    return () => window.clearTimeout(timer);
  }, [categories]);

  useEffect(() => {
    const previous = document.title;
    document.title = `${t('faq.crumb')} — Safeer`;
    return () => {
      document.title = previous;
    };
  }, [t]);

  useEffect(() => {
    if (!categories.length) return undefined;
    if (typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: '-130px 0px -62% 0px', threshold: 0 },
    );

    filtered.forEach((category) => {
      const el = document.getElementById(category.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [filtered]);

  const faqSchema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    url: `${SITE_URL}/faq`,
    inLanguage: lang.match(/^(en|ur|id)/) !== null ? 'en' : 'ar',
    mainEntity: categories.flatMap((category) => category.items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    }))),
  }), [categories, lang]);

  const crumbSchema = useMemo(() => breadcrumbSchema([
    { name: t('legal.crumbHome'), path: '/' },
    { name: t('faq.crumb'), path: '/faq' },
  ]), [t]);

  const isOpen = (key: string) => (query.trim() ? true : open.includes(key));
  const toggle = (key: string) => {
    setOpen((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));
  };

  return (
    <div className="st-shell">
      <JsonLd id="sia-faq-schema" data={faqSchema} />
      <JsonLd id="sia-faq-breadcrumb" data={crumbSchema} />

      <StoreNav />

      <main>
        <header className="st-hero">
          <div className="st-wrap">
            <nav className="st-crumbs" aria-label={t('faq.crumb')}>
              <Link to="/">{t('legal.crumbHome')}</Link>
              <i className="ri-arrow-left-s-line" />
              <span>{t('faq.crumb')}</span>
            </nav>

            <h1>
              {t('faq.titleLead')}{' '}
              <em className="accent">{t('faq.titleAccent')}</em>
            </h1>
            <p className="lead">{t('faq.sub')}</p>

            <div className="st-legal-badges">
              <span className="st-legal-badge">
                <i className="ri-question-answer-line" />
                {t('faq.totalCount', { count: total, sections: categories.length })}
              </span>
              <span className="st-legal-badge">
                <i className="ri-calendar-check-line" />
                {t('legal.updatedLabel')}: {t('legal.updated')}
              </span>
            </div>
          </div>
        </header>

        <div className="st-wrap">
          <div className="st-faq-tools">
            <div className="st-faq-search">
              <i className="ri-search-line" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('faq.searchPlaceholder')}
                aria-label={t('faq.searchAria')}
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} aria-label={t('faq.clearSearch')}>
                  <i className="ri-close-line" />
                </button>
              )}
            </div>
            <span className="st-faq-count">
              {query.trim()
                ? t('faq.resultsCount', { count: resultCount, total })
                : t('faq.totalCount', { count: total, sections: categories.length })}
            </span>
          </div>

          <nav className="st-faq-chips" aria-label={t('faq.jumpTitle')}>
            {categories.map((category) => (
              <a
                key={category.id}
                href={`#${category.id}`}
                className={active === category.id ? 'is-on' : ''}
                onClick={() => setActive(category.id)}
              >
                <i className={category.icon} aria-hidden="true" />
                <span>{category.title}</span>
                <b>{category.items.length}</b>
              </a>
            ))}
          </nav>

          <div className="st-legal-grid st-faq-grid">
            <aside className="st-legal-toc">
              <h2>
                <i className="ri-list-check-2" />
                {t('faq.jumpTitle')}
              </h2>
              <ol>
                {categories.map((category) => (
                  <li key={category.id}>
                    <a
                      href={`#${category.id}`}
                      className={active === category.id ? 'is-on' : ''}
                      onClick={() => setActive(category.id)}
                    >
                      <span className="n">
                        <i className={category.icon} aria-hidden="true" />
                      </span>
                      <span>{category.title}</span>
                      <b className="q-count">{category.items.length}</b>
                    </a>
                  </li>
                ))}
              </ol>

              <Link className="toc-cta" to="/support">
                <i className="ri-customer-service-2-line" />
                <span>{t('faq.helpCta')}</span>
                <i className="ri-arrow-left-line" />
              </Link>
            </aside>

            <div className="st-faq-main">
              {filtered.map((category) => (
                <section className="st-faq-block" id={category.id} key={category.id}>
                  <div className="st-faq-block-head">
                    <span className="ic" aria-hidden="true">
                      <i className={category.icon} />
                    </span>
                    <div className="tx">
                      <h2>{category.title}</h2>
                      <p>{category.desc}</p>
                    </div>
                    <span className="cnt">{t('faq.sectionCount', { count: category.items.length })}</span>
                  </div>

                  <div className="st-faq-list">
                    {category.items.map((item, index) => {
                      const key = `${category.id}-${index}`;
                      const expanded = isOpen(key);
                      return (
                        <div className={`st-faq-item${expanded ? ' is-open' : ''}`} key={key}>
                          <button
                            type="button"
                            onClick={() => toggle(key)}
                            aria-expanded={expanded}
                            aria-controls={`${key}-answer`}
                          >
                            <span>{item.q}</span>
                            <i className={expanded ? 'ri-subtract-line' : 'ri-add-line'} aria-hidden="true" />
                          </button>
                          {expanded && (
                            <p className="a" id={`${key}-answer`}>{item.a}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}

              {!filtered.length && (
                <div className="st-faq-empty">
                  <i className="ri-search-eye-line" />
                  <p>{t('faq.noResults')}</p>
                  <Link className="st-btn primary" to="/support">
                    <i className="ri-mail-send-line" />
                    {t('faq.helpCta')}
                  </Link>
                </div>
              )}

              <div className="st-legal-help">
                <span className="ic" aria-hidden="true">
                  <i className="ri-question-answer-line" />
                </span>
                <div className="body">
                  <h3>{t('faq.helpTitle')}</h3>
                  <p>{t('faq.helpText')}</p>
                </div>
                <Link className="st-btn primary" to="/support">
                  <i className="ri-customer-service-2-line" />
                  {t('faq.helpCta')}
                </Link>
              </div>

              <div className="st-legal-foot">
                {related.map((link) => (
                  <Link key={link.to} to={link.to}>
                    <i className="ri-file-shield-2-line" />
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <StoreFooter />
    </div>
  );
}