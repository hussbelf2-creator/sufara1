import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const RTL = new Set(['ar', 'ur']);
const KNOWN = new Set(['ar', 'en', 'ur', 'id']);

/* Keeps <html lang> and <html dir> in sync with the active language so the whole
   document flows RTL for Arabic and Urdu, and LTR for English and Indonesian. */
export function useDirection() {
  const { i18n } = useTranslation();
  const raw = (i18n.resolvedLanguage || i18n.language || 'ar').split('-')[0];
  const lang = KNOWN.has(raw) ? raw : 'ar';

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('lang', lang);
    root.setAttribute('dir', RTL.has(lang) ? 'rtl' : 'ltr');
  }, [lang]);
}
