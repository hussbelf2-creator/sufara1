import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StoreNav from '@/components/feature/StoreNav';
import StoreFooter from '@/components/feature/StoreFooter';
import JsonLd from '@/components/feature/JsonLd';
import ContactForm from '@/pages/support/components/ContactForm';
import SupportAside from '@/pages/support/components/SupportAside';
import { initPanels } from '@/pages/home/lib/panels';
import { breadcrumbSchema } from '@/lib/seo';

interface Channel {
  icon: string;
  label: string;
  value: string;
  hint: string;
  href: string;
}

interface RelatedLink {
  label: string;
  to: string;
}

export default function SupportPage() {
  const { t } = useTranslation();

  useEffect(() => initPanels(), []);

  /* Coming from "open the support form" lands straight on the form instead of
     the top of the page, so the visitor starts typing immediately. */
  useEffect(() => {
    if (window.location.hash !== '#contact') return undefined;
    const timer = window.setTimeout(() => {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const previous = document.title;
    document.title = `${t('legal.contact.crumb')} — Safeer`;
    return () => {
      document.title = previous;
    };
  }, [t]);

  const channelValue = t('legal.contact.channels', { returnObjects: true });
  const channels = Array.isArray(channelValue) ? (channelValue as unknown as Channel[]) : [];

  const relatedValue = t('legal.relatedLinks', { returnObjects: true });
  const related = Array.isArray(relatedValue)
    ? (relatedValue as unknown as RelatedLink[]).filter((item) => item.to !== '/support')
    : [];

  const crumbSchema = useMemo(() => breadcrumbSchema([
    { name: t('legal.crumbHome'), path: '/' },
    { name: t('legal.contact.crumb'), path: '/support' },
  ]), [t]);

  return (
    <div className="st-shell">
      <JsonLd id="sia-support-breadcrumb" data={crumbSchema} />
      <StoreNav />

      <main>
        <header className="st-hero">
          <div className="st-wrap">
            <nav className="st-crumbs" aria-label={t('legal.contact.crumb')}>
              <Link to="/">{t('legal.crumbHome')}</Link>
              <i className="ri-arrow-left-s-line" />
              <span>{t('legal.contact.crumb')}</span>
            </nav>

            <h1>
              {t('legal.contact.titleLead')}{' '}
              <em className="accent">{t('legal.contact.titleAccent')}</em>
            </h1>
            <p className="lead">{t('legal.contact.sub')}</p>

            <div className="st-legal-badges">
              <span className="st-legal-badge">
                <i className="ri-mail-send-line" />
                support@safeer.sa
              </span>
              <span className="st-legal-badge">
                <i className="ri-whatsapp-line" />
                +966 55 480 1122
              </span>
              <span className="st-legal-badge">
                <i className="ri-time-line" />
                {t('legal.contact.aside.hoursTitle')}
              </span>
            </div>
          </div>
        </header>

        <div className="st-wrap">
          <div className="st-sup-grid">
            <div className="st-sup-main">
              <section aria-label={t('legal.contact.channelsTitle')}>
                <div className="st-sup-channels">
                  {channels.map((channel) => (
                    <a className="st-sup-channel" href={channel.href} key={channel.label}>
                      <span className="ic" aria-hidden="true">
                        <i className={channel.icon} />
                      </span>
                      <span className="tx">
                        <span className="lbl">{channel.label}</span>
                        <span className="val">{channel.value}</span>
                        <span className="hint">{channel.hint}</span>
                      </span>
                    </a>
                  ))}
                </div>
              </section>

              <ContactForm />

              <section id="map" aria-label={t('legal.contact.mapTitle')}>
                <div className="st-sup-map">
                  <iframe
                    title={t('legal.contact.mapTitle')}
                    src="https://www.google.com/maps?q=Al%20Khumrah%2C%20Jeddah%2C%20Saudi%20Arabia&output=embed"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <span className="pin">
                    <i className="ri-map-pin-2-fill" />
                    {t('legal.contact.mapHint')}
                  </span>
                </div>
              </section>

              <div className="st-legal-foot">
                {related.map((link) => (
                  <Link key={link.to} to={link.to}>
                    <i className="ri-file-shield-2-line" />
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <SupportAside />
          </div>
        </div>
      </main>

      <StoreFooter />
    </div>
  );
}