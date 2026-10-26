import { useTranslation } from 'react-i18next';
import { usePlatformConfig } from '@/config/store';
import { getDisplayCurrency, setDisplayCurrency } from '@/lib/currency';

const LANG_LABEL: Record<string, string> = { ar: 'عربي', en: 'EN', ur: 'اردو', id: 'ID' };

/* Compact language + display-currency switch. It inherits the surrounding
   colour so it reads well both on the dark hero and on the light store header.
   Only the languages enabled in the platform settings are offered. */
export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { i18n, t } = useTranslation();
  const config = usePlatformConfig();
  const lang = (i18n.resolvedLanguage || i18n.language || 'ar').split('-')[0];
  const currency = getDisplayCurrency();

  const set = (next: string) => {
    if (next !== lang) i18n.changeLanguage(next);
  };

  return (
    <div className={`lang-switch ${className}`.trim()} role="group" aria-label={t('common.nav.switchLang')}>
      <i className="ri-translate-2" aria-hidden="true" />
      {config.locale.languages.map((code, i) => (
        <span key={code} style={{ display: 'contents' }}>
          {i > 0 && <span className="sep" aria-hidden="true">/</span>}
          <button
            type="button"
            className={lang === code ? 'is-on' : ''}
            onClick={() => set(code)}
            aria-pressed={lang === code}
            lang={code}
          >
            {LANG_LABEL[code] ?? code.toUpperCase()}
          </button>
        </span>
      ))}
      <span className="sep" aria-hidden="true">·</span>
      <select
        className="lang-cur"
        aria-label={t('common.nav.currency', { defaultValue: 'Currency' })}
        value={currency.code}
        onChange={(e) => setDisplayCurrency(e.target.value)}
      >
        {config.locale.currencies.map((c) => (
          <option key={c.code} value={c.code}>{c.code}</option>
        ))}
      </select>
    </div>
  );
}
