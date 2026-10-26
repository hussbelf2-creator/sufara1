import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StoreNav from '@/components/feature/StoreNav';
import StoreFooter from '@/components/feature/StoreFooter';
import {
  downloadBrandMarkPng,
  renderBrandMarkPng,
  type BrandMarkVariant,
} from '@/components/feature/brandMarkCanvas';
import { initPanels } from '@/pages/home/lib/panels';

const VARIANTS: BrandMarkVariant[] = ['solid', 'transparent', 'light'];
const SIZES = [1024, 512, 256];
const PREVIEW_SIZE = 320;

interface Swatch { name: string; hex: string; }

export default function BrandPage() {
  const { t } = useTranslation();
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState('');

  useEffect(() => initPanels(), []);

  useEffect(() => {
    const next: Record<string, string> = {};
    VARIANTS.forEach((variant) => {
      next[variant] = renderBrandMarkPng(PREVIEW_SIZE, variant);
    });
    setPreviews(next);
  }, []);

  const usage = t('common.brandPage.usage', { returnObjects: true }) as unknown as string[];
  const colors = t('common.brandPage.colors', { returnObjects: true }) as unknown as Swatch[];

  const handleDownload = (size: number, variant: BrandMarkVariant) => {
    const ok = downloadBrandMarkPng(size, variant);
    setSaved(ok ? `${size} px · PNG` : '');
  };

  return (
    <div className="st-shell">
      <StoreNav />

      <main>
        <header className="st-hero">
          <div className="st-wrap">
            <nav className="st-crumbs" aria-label={t('common.brandPage.crumb')}>
              <Link to="/">{t('shop.crumbs.home')}</Link>
              <i className="ri-arrow-left-s-line" />
              <span>{t('common.brandPage.crumb')}</span>
            </nav>

            <h1>
              {t('common.brandPage.titleLead')}{' '}
              <em className="accent">{t('common.brandPage.titleAccent')}</em>
            </h1>
            <p className="lead">{t('common.brandPage.sub')}</p>
          </div>
        </header>

        <section className="st-section">
          <div className="st-wrap">
            <div className="st-head">
              <div>
                <p className="eyebrow">{t('common.brandPage.crumb')}</p>
                <h2>{t('common.brandPage.sizesLabel')}</h2>
                <p className="sub">{t('common.brandPage.hint')}</p>
              </div>
            </div>

            <div className="st-brand-grid">
              {VARIANTS.map((variant) => (
                <article className="st-brand-card" key={variant}>
                  <div className={`st-brand-preview${variant === 'transparent' ? ' is-clear' : ''}`}>
                    {previews[variant] ? (
                      <img
                        src={previews[variant]}
                        alt={`Safeer — ${t(`common.brandPage.variants.${variant}.name`)}`}
                        title={`Safeer ${t(`common.brandPage.variants.${variant}.name`)} PNG`}
                        width={148}
                        height={148}
                      />
                    ) : (
                      <span className="st-brand-ghost" aria-hidden="true" />
                    )}
                  </div>

                  <h3>{t(`common.brandPage.variants.${variant}.name`)}</h3>
                  <p>{t(`common.brandPage.variants.${variant}.desc`)}</p>

                  <div className="st-brand-sizes">
                    {SIZES.map((size) => (
                      <button
                        key={size}
                        type="button"
                        className="st-brand-size"
                        onClick={() => handleDownload(size, variant)}
                      >
                        <i className="ri-download-2-line" />
                        {t('common.brandPage.download')} {size}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <p className="st-brand-saved" aria-live="polite">
              {saved ? <><i className="ri-checkbox-circle-line" /> {saved}</> : '\u00A0'}
            </p>
          </div>
        </section>

        <section className="st-section alt">
          <div className="st-wrap">
            <div className="st-brand-usage">
              <div>
                <div className="st-head">
                  <div>
                    <p className="eyebrow">{t('common.brandPage.crumb')}</p>
                    <h2>{t('common.brandPage.usageTitle')}</h2>
                  </div>
                </div>
                <ul className="st-brand-rules">
                  {usage.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="st-brand-sub">{t('common.brandPage.colorsTitle')}</h3>
                <div className="st-brand-swatches">
                  {colors.map((color) => (
                    <div className="st-brand-swatch" key={color.hex}>
                      <span className="chip" style={{ background: color.hex }} />
                      <b>{color.name}</b>
                      <code>{color.hex.toUpperCase()}</code>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Link className="st-btn ghost" to="/products" style={{ marginTop: 28 }}>
              <i className="ri-arrow-right-line" /> {t('common.brandPage.back')}
            </Link>
          </div>
        </section>
      </main>

      <StoreFooter />
    </div>
  );
}