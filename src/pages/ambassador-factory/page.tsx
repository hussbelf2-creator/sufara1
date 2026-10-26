import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StoreNav from '@/components/feature/StoreNav';
import StoreFooter from '@/components/feature/StoreFooter';
import ProductCard from '@/pages/shop/components/ProductCard';
import { useCatalog } from '@/hooks/useCatalog';
import { useAmbassadorPages } from '@/hooks/useAmbassadorPages';
import type { Factory, Product } from '@/pages/shop/types';
import { findAmbPromoByPage, registerAmbPromos, rememberAmbCode } from '@/pages/shop/lib/promo';
import { supabase, backendReady } from '@/lib/supabase';
import { getConfig } from '@/config/store';
import { trackReferralClick } from '@/pages/shop/lib/orderApi';
import { registerVisit } from '@/pages/ambassador-factory/lib/pageStats';
import { initPanels } from '@/pages/home/lib/panels';
import './amb.css';

/* The public, shareable ambassador marketing page for a single factory.
   Route: /f/:amb/:factory  (amb = ambassador slug, factory = factory id).
   A "short" version is available via ?v=short for quick social sharing. */
export default function AmbassadorFactoryPage() {
  const { t, i18n } = useTranslation();
  const { amb: ambSlug, factory: factoryId } = useParams();
  const [params, setParams] = useSearchParams();
  const { factories, products, factoryExtra } = useCatalog();
  const p = useAmbassadorPages();
  const [toast, setToast] = useState('');

  const short = params.get('v') === 'short';

  /* Real ambassadors come from the database (ambassador_page RPC: first
     name, country, tier and the registered page code); the bundled registry
     only serves the demo pages. */
  const [dbAmb, setDbAmb] = useState<{ slug: string; name: string; initials: string; country: string; level: string; code: string } | null>(null);
  const [dbCode, setDbCode] = useState('');
  const [resolved, setResolved] = useState(!backendReady);
  useEffect(() => {
    if (!backendReady || !ambSlug || !factoryId) return undefined;
    let alive = true;
    supabase.rpc('ambassador_page', { p_slug: ambSlug, p_factory: factoryId }).then(({ data }) => {
      const r = data as { slug: string; name: string; country: string | null; tier: string; is_leader: boolean; code: string | null } | null;
      if (alive) setResolved(true);
      if (!alive || !r) return;
      const cfgTier = getConfig().ambassador.retailTiers.find((tr) => tr.id === r.tier);
      const isAr = (i18n.resolvedLanguage || i18n.language || 'ar').startsWith('ar');
      setDbAmb({
        slug: r.slug, name: r.name, initials: r.name.slice(0, 1), country: r.country?.toUpperCase() ?? '',
        level: cfgTier ? (isAr ? cfgTier.labelAr : cfgTier.labelEn) : r.tier, code: r.code ?? '',
      });
      if (r.code) {
        registerAmbPromos([{ code: r.code, slug: r.slug, factoryId, discount: getConfig().promo.ambassadorCodeRate * 100 }]);
        setDbCode(r.code);
      }
    });
    return () => { alive = false; };
  }, [ambSlug, factoryId, i18n]);
  const amb = dbAmb ?? p.ambRegistry.find((a) => a.slug === ambSlug);
  const factory = (factories as Factory[]).find((f) => f.id === factoryId);
  const extra = factoryId ? factoryExtra[factoryId] : undefined;
  const list = useMemo(
    () => (products as Product[]).filter((pr) => pr.factoryId === factoryId),
    [products, factoryId],
  );

  /* Canonical discount code for this ambassador + factory page. */
  const ambPromo = findAmbPromoByPage(ambSlug ?? '', factoryId ?? '');
  /* Only a registered code exists. A page without one still attributes
     through the server-side click record, but shows no invented code. */
  const code = ambPromo?.code ?? dbCode;

  useEffect(() => { window.scrollTo(0, 0); }, [factoryId, ambSlug]);
  useEffect(() => initPanels(), []);

  /* Count this visit and remember the code so the checkout keeps the
     attribution to the ambassador who sent the visitor. */
  useEffect(() => {
    if (!amb || !factory) return;
    registerVisit(ambSlug ?? '', factoryId ?? '');
    if (code) rememberAmbCode(code);
    trackReferralClick(ambSlug ?? '', factoryId ?? '', code || undefined);
  }, [amb, factory, ambSlug, factoryId, code]);

  const copy = async (text: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard may be unavailable — feedback still shows */
    }
    setToast(msg);
    window.setTimeout(() => setToast(''), 2200);
  };

  if (!amb && !resolved) {
    return <div className="st-shell amb-shell" style={{ minHeight: '60vh' }} aria-busy="true" />;
  }

  if (!amb || !factory) {
    return (
      <div className="st-shell amb-shell">
        <StoreNav />
        <main style={{ paddingTop: 140, paddingBottom: 120 }}>
          <div className="st-wrap">
            <div className="st-empty">
              <i className="ri-window-2-line" />
              <div className="t">{t('factories.amb.notFoundTitle')}</div>
              <p>{t('factories.amb.notFoundText')}</p>
              <Link className="st-btn primary" to="/factories" style={{ marginTop: 18 }}>
                <i className="ri-arrow-right-line" /> {t('factories.amb.backHome')}
              </Link>
            </div>
          </div>
        </main>
        <StoreFooter />
      </div>
    );
  }

  const shown = short ? list.slice(0, 3) : list.slice(0, 8);

  const guarantees = [
    { icon: 'ri-shield-check-line', t: t('factories.amb.guarantee1t'), s: t('factories.amb.guarantee1s') },
    { icon: 'ri-truck-line', t: t('factories.amb.guarantee2t'), s: t('factories.amb.guarantee2s') },
    { icon: 'ri-price-tag-3-line', t: t('factories.amb.guarantee3t'), s: t('factories.amb.guarantee3s') },
    { icon: 'ri-verified-badge-line', t: t('factories.amb.guarantee4t'), s: t('factories.amb.guarantee4s') },
  ];

  return (
    <div className="st-shell amb-shell">
      <StoreNav />

      {/* ambassador identity strip */}
      <section className="amb-strip">
        <div className="st-wrap amb-strip-inner">
          <div className="amb-id">
            <span className="av">{amb.initials}</span>
            <div>
              <div className="who">
                {t('factories.amb.shopVia')} <b>{amb.name}</b>
                <i className="ri-verified-badge-fill" title={t('factories.amb.verified')} />
              </div>
              <div className="sub">
                {t('factories.amb.ambassadorTag')} · {amb.level} · {t('factories.amb.fromCountry', { country: amb.country })}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="st-btn ghost sm"
            onClick={() => setParams(short ? {} : { v: 'short' })}
          >
            <i className={short ? 'ri-layout-masonry-line' : 'ri-layout-row-line'} />
            {short ? t('factories.amb.switchFull') : t('factories.amb.switchShort')}
          </button>
        </div>
      </section>

      <main>
        {/* hero */}
        <header className={`amb-hero${short ? ' is-short' : ''}`}>
          {extra && (
            <img
              src={extra.cover}
              alt={t('factories.profile.coverAlt', { name: factory.name, city: factory.city })}
              title={t('factories.profile.coverTitle', { name: factory.name })}
              width={1400}
              height={900}
            />
          )}
          <div className="amb-hero-mask" />
          <div className="st-wrap inner">
            <p className="amb-kicker"><i className="ri-sparkling-2-line" /> {t('factories.amb.heroKicker')}</p>
            <h1>{t('factories.amb.heroTitle', { factory: factory.name })}</h1>
            {!short && <p className="amb-lead">{t('factories.amb.heroLead', { amb: amb.name })}</p>}
            {code && <div className="amb-code">
              <div>
                <span className="lbl">{t('factories.amb.codeTitle')}</span>
                <span className="val">{code}</span>
              </div>
              <button type="button" className="st-btn primary" onClick={() => copy(code, t('factories.amb.copied'))}>
                <i className="ri-file-copy-line" /> {t('factories.amb.copyCode')}
              </button>
            </div>}
            <p className="amb-codehint"><i className="ri-information-line" /> {t('factories.amb.discountNote', { n: Math.round(getConfig().promo.ambassadorCodeRate * 1000) / 10 })}</p>
          </div>
        </header>

        {/* guarantee strip */}
        <section className="amb-trust">
          <div className="st-wrap amb-trust-grid">
            {guarantees.map((g) => (
              <div className="it" key={g.t}>
                <i className={g.icon} />
                <div>
                  <div className="t">{g.t}</div>
                  <div className="s">{g.s}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* attribution confirmation — compact, for the shopper */}
        <section className="amb-confirm">
          <div className="st-wrap amb-confirm-inner">
            <span className="ic"><i className="ri-shield-check-line" /></span>
            <div className="body">
              <div className="t">{t('factories.amb.confirmTitle')}</div>
              <div className="s">{t('factories.amb.confirmText')}</div>
            </div>
            <div className="who">
              <span className="lbl">{t('factories.amb.confirmBy')}</span>
              <span className="val"><i className="ri-user-star-line" /> {amb.name}</span>
              {code && <span className="code">{code}</span>}
            </div>
          </div>
        </section>

        {/* products */}
        <section className="st-section">
          <div className="st-wrap">
            <div className="amb-section-head">
              <div>
                <h2>{t('factories.amb.productsTitle')}</h2>
                <div className="sub">{t('factories.amb.productsSub', { factory: factory.name, count: list.length })}</div>
              </div>
              <Link className="st-link" to={`/products?factory=${factory.id}`}>
                {t('factories.amb.browseAll')} <i className="ri-arrow-left-line" />
              </Link>
            </div>

            {shown.length > 0 ? (
              <div className="st-grid" data-product-shop style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
                {shown.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            ) : (
              <div className="st-empty">
                <i className="ri-shopping-bag-3-line" />
                <div className="t">{t('factories.profile.noProductsTitle')}</div>
                <p>{t('factories.profile.noProductsText')}</p>
              </div>
            )}
          </div>
        </section>

        {!short && (
          <>
            {/* story */}
            <section className="st-section alt">
              <div className="st-wrap amb-story">
                <div className="amb-story-media">
                  {extra && (
                    <img
                      src={extra.workshop}
                      alt={t('factories.profile.workshopAlt', { name: factory.name })}
                      title={t('factories.profile.workshopTitle', { name: factory.name })}
                      width={1200}
                      height={800}
                    />
                  )}
                </div>
                <div>
                  <p className="eyebrow">{t('factories.amb.storyTitle', { factory: factory.name })}</p>
                  <h2>{factory.name}</h2>
                  <p>{factory.blurb}</p>
                  <p>{t('factories.profile.aboutExtra')}</p>
                  {extra && (
                    <div className="st-certs" style={{ marginTop: 8 }}>
                      {extra.certifications.slice(0, 4).map((c) => (
                        <span className="st-cert" key={c}><i className="ri-shield-star-line" />{c}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* attribution */}
            <section className="st-section">
              <div className="st-wrap amb-attr">
                <div>
                  <h2>{t('factories.amb.attrTitle')}</h2>
                  <p>{t('factories.amb.attrText')}</p>
                  <div className="amb-badges">
                    <span className="amb-badge"><i className="ri-link" /> {t('factories.amb.attrBadgeLink')}</span>
                    <span className="amb-badge"><i className="ri-coupon-3-line" /> {t('factories.amb.attrBadgeCode')}</span>
                    <span className="amb-badge"><i className="ri-time-line" /> {t('factories.amb.attrBadgeWindow')}</span>
                  </div>
                </div>
                {code && <aside className="amb-codecard">
                  <div className="lbl">{t('factories.amb.codeTitle')}</div>
                  <div className="val">{code}</div>
                  <button type="button" className="st-btn primary" onClick={() => copy(code, t('factories.amb.copied'))}>
                    <i className="ri-file-copy-line" /> {t('factories.amb.copyCode')}
                  </button>
                </aside>}
              </div>
            </section>
          </>
        )}

        {/* CTA */}
        <section className="amb-cta">
          <div className="st-wrap amb-cta-inner">
            <h2>{t('factories.amb.ctaTitle')}</h2>
            <p>{t('factories.amb.ctaText', { factory: factory.name, amb: amb.name })}</p>
            <Link className="st-btn primary" to={`/products?factory=${factory.id}`}>
              <i className="ri-shopping-bag-3-line" /> {t('factories.amb.ctaBtn')}
            </Link>
          </div>
        </section>
      </main>

      <StoreFooter />

      {toast && (
        <div className="amb-toast" role="status" aria-live="polite">
          <i className="ri-checkbox-circle-fill" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}