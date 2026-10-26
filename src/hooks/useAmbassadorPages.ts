import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import * as ar from '@/mocks/ambassadorPages';
import * as en from '@/mocks/ambassadorPages.en';

/* Returns the ambassador marketing-pages data resolved in the active language.
   Arabic is the base set in src/mocks/ambassadorPages.ts; English mirrors it
   with the exact same shape, so every consumer reads identical fields. */
export function useAmbassadorPages() {
  const { i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || i18n.language || 'ar').toLowerCase();
  const isEn = lang.match(/^(en|ur|id)/) !== null;

  return useMemo(() => (isEn ? en : ar), [isEn]);
}