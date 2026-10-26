import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import messages from './local/index';
import { applyOverrides, normLang } from './overrides';

/* Arabic is the default language; English, Urdu and Indonesian are offered
   for the launch markets (Pakistan, Egypt, Indonesia). Urdu and Indonesian
   fall back to English, then Arabic, for any line not yet translated. The
   shopper's choice is remembered in localStorage so it survives reloads. */
/* First visit: Arabic stays the default, except for visitors whose browser
   asks for Urdu or Indonesian (the launch markets), who land in their own
   language. A choice made with the switcher always wins (localStorage). */
const detector = new LanguageDetector();
detector.addDetector({
  name: 'launchMarkets',
  lookup() {
    try {
      const wanted = (navigator.languages ?? [navigator.language]).map((l) => l.toLowerCase().slice(0, 2));
      return wanted.find((l) => l === 'ur' || l === 'id');
    } catch {
      return undefined;
    }
  },
});

i18n
  .use(detector)
  .use(initReactI18next)
  .init({
    fallbackLng: { ur: ['en', 'ar'], id: ['en', 'ar'], default: ['ar'] },
    supportedLngs: ['ar', 'en', 'ur', 'id'],
    nonExplicitSupportedLngs: true,
    debug: false,
    resources: messages,
    detection: {
      order: ['localStorage', 'launchMarkets'],
      lookupLocalStorage: 'sta-lang',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

/* Copy edited in the content panel wins over the built-in translation across
   the whole site — home, store, factories, FAQ, legal, orders. Both entry
   points i18next can be reached through are wrapped: the instance `t` and the
   fixed translators components receive. Objects and lists (FAQ sections,
   footer columns, quick links) are walked recursively so their leaves can be
   rewritten too. Applying an override twice is harmless — it resolves to the
   same published string. */
function decorate(
  translate: (...args: unknown[]) => unknown,
  hintLang?: string,
) {
  return (key: unknown, options?: unknown, ...rest: unknown[]) => {
    const result = translate(key, options, ...rest);
    const path = Array.isArray(key) ? key[0] : key;
    if (typeof path !== 'string' || !path) return result;
    if (result == null) return result;
    const opts = (options ?? {}) as Record<string, unknown>;
    const lang = normLang(
      (opts.lng as string | undefined) ?? hintLang ?? i18n.resolvedLanguage ?? i18n.language,
    );
    /* Namespaced lookups (`ns:key`) are matched on the bare path. */
    const colon = path.indexOf(':');
    const bare = colon > -1 ? path.slice(colon + 1) : path;
    return applyOverrides(result, bare, lang, opts);
  };
}

const instance = i18n as unknown as {
  t: (...args: unknown[]) => unknown;
  getFixedT: (lng?: string | null, ns?: string | null, keyPrefix?: string) => unknown;
};

instance.t = decorate(instance.t.bind(i18n));

const baseGetFixedT = instance.getFixedT.bind(i18n);
instance.getFixedT = (lng?: string | null, ns?: string | null, keyPrefix?: string) => {
  const fixed = baseGetFixedT(lng, ns, keyPrefix) as ((...args: unknown[]) => unknown) & Record<string, unknown>;
  const wrapped = decorate(fixed, typeof lng === 'string' ? lng : undefined);
  /* Keep any helpers attached to the fixed translator (getFixedT factory). */
  Object.assign(wrapped, fixed);
  return wrapped;
};

export default i18n;