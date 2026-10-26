import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BrandMark from './BrandMark';

interface FooterLink { label: string; to: string; }
interface FooterCol { title: string; links: FooterLink[]; }

export default function StoreFooter() {
  const { t } = useTranslation();
  const cols = t('common.storeFooter.cols', { returnObjects: true }) as unknown as FooterCol[];

  return (
    <footer className="site-footer">
      <div className="cols">
        <div>
          <div className="brand-block">
            <BrandMark size={42} variant="outline" label={t('common.brandMark')} />
            <h4 className="brandline">{t('common.brandFull')}</h4>
          </div>
          <p className="muted">{t('common.storeFooter.about')}</p>
          <p className="muted" style={{ marginTop: 14 }}>{t('common.storeFooter.address')}</p>
        </div>

        {cols.map((col) => (
          <div key={col.title}>
            <h4>{col.title}</h4>
            {col.links.map((l) => (
              <Link key={`${col.title}-${l.label}`} to={l.to}>{l.label}</Link>
            ))}
          </div>
        ))}
      </div>

      <div className="bottom">
        <span>{t('common.storeFooter.rights')}</span>
        <div className="socials">
          <a href="/" aria-label={t('common.storeFooter.instagram')}><i className="ri-instagram-line" /></a>
          <a href="/" aria-label={t('common.storeFooter.tiktok')}><i className="ri-tiktok-line" /></a>
          <a href="/" aria-label={t('common.storeFooter.whatsapp')}><i className="ri-whatsapp-line" /></a>
          <a href="/" aria-label={t('common.storeFooter.linkedin')}><i className="ri-linkedin-line" /></a>
        </div>
      </div>
    </footer>
  );
}