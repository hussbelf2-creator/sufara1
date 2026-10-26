/* Published content overrides.
   The content panel stores one row per translation key. This module keeps the
   published rows in memory so every translated line on the site — headings,
   descriptions, footer columns, FAQ answers, empty states — resolves to the
   edited copy instead of the built-in string. It is framework-free on purpose:
   the i18n layer and the admin panel both talk to it, and neither owns it. */

export type OverrideMap = Record<string, string>;

const maps: Record<string, OverrideMap> = { ar: {}, en: {}, ur: {}, id: {} };
const signatures: Record<string, string> = { ar: '', en: '', ur: '', id: '' };

/* ar and en carry CMS overrides; ur and id keep their own (empty by
   default) maps so an Arabic edit never overwrites an Urdu line. */
export const normLang = (raw?: string | null): string => {
  const l = String(raw ?? '').toLowerCase();
  if (l.startsWith('en')) return 'en';
  if (l.startsWith('ur')) return 'ur';
  if (l.startsWith('id')) return 'id';
  return 'ar';
};

/* A cheap fingerprint: only when the published set actually changes do we ask
   the app to re-render. */
function fingerprint(map: OverrideMap): string {
  const keys = Object.keys(map);
  let hash = keys.length;
  for (let i = 0; i < keys.length; i += 1) {
    const value = map[keys[i]];
    hash = (hash * 31 + keys[i].length + value.length) | 0;
  }
  return `${keys.length}:${hash}`;
}

/* Returns true when the map differs from what is already active, which tells
   the caller it is worth repainting the site. */
export function setOverrideMap(lang: string, map: OverrideMap): boolean {
  const key = normLang(lang);
  const next = fingerprintSafe(map);
  if (signatures[key] === next) return false;
  signatures[key] = next;
  maps[key] = map;
  return true;
}

function fingerprintSafe(map: OverrideMap): string {
  try {
    return fingerprint(map);
  } catch {
    return `raw:${Date.now()}`;
  }
}

export function hasOverrides(lang: string): boolean {
  return Object.keys(maps[normLang(lang)]).length > 0;
}

/* Fills {{name}} placeholders inside edited copy so a rewritten line keeps the
   numbers and names the page passes in. */
function interpolate(text: string, values?: Record<string, unknown>): string {
  if (!values || text.indexOf('{{') === -1) return text;
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (whole, name: string) => {
    const value = values[name];
    if (value == null || typeof value === 'object') return whole;
    return String(value);
  });
}

function pluralKey(lang: string, key: string, values?: Record<string, unknown>): string | null {
  const count = values?.count;
  if (typeof count !== 'number') return null;
  try {
    const category = new Intl.PluralRules(lang).select(count);
    return `${key}_${category}`;
  } catch {
    return null;
  }
}

function lookup(key: string, lang: string, values?: Record<string, unknown>): string | null {
  const map = maps[normLang(lang)];
  if (!map) return null;
  const plural = pluralKey(normLang(lang), key, values);
  const raw = (plural != null ? map[plural] : undefined) ?? map[key];
  if (raw == null) return null;
  return interpolate(raw, values);
}

/* Translated trees (FAQ lists, footer columns) must keep a stable identity
   between renders, otherwise lists built from them would rebuild forever. The
   same source object always maps to the same result until copy changes. */
const treeCache = new WeakMap<object, Map<string, unknown>>();

function cacheKey(lang: string, keyPath: string, values?: Record<string, unknown>): string {
  const count = typeof values?.count === 'number' ? values.count : '';
  return `${normLang(lang)}|${keyPath}|${signatures[normLang(lang)] ?? ''}|${count}`;
}

/* Walks whatever i18next returned — a string, an array of FAQ entries, a list
   of footer columns — and swaps every leaf that has a published override. */
export function applyOverrides(
  value: unknown,
  keyPath: string,
  lang: string,
  values?: Record<string, unknown>,
): unknown {
  if (typeof value === 'string') {
    const hit = lookup(keyPath, lang, values);
    return hit == null ? value : hit;
  }
  if (!value || typeof value !== 'object') return value;

  /* Nothing published for this language: hand the original back untouched. */
  if (!hasOverrides(lang)) return value;

  const isTree = Array.isArray(value) || typeof value === 'object';
  if (!isTree) return value;

  const slotKey = cacheKey(lang, keyPath, values);
  let slots = treeCache.get(value as object);
  if (slots && slots.has(slotKey)) return slots.get(slotKey);

  const out: unknown = Array.isArray(value)
    ? value.map((item, index) => applyOverrides(item, `${keyPath}.${index}`, lang, values))
    : Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [childKey, childValue]) => {
      acc[childKey] = applyOverrides(childValue, `${keyPath}.${childKey}`, lang, values);
      return acc;
    }, {});

  if (!slots) {
    slots = new Map<string, unknown>();
    treeCache.set(value as object, slots);
  }
  slots.set(slotKey, out);
  return out;
}

/* The content panel keeps its rows flattened with the resource path as the key,
   so this is the same shape the site resolves against. */
export function flattenResource(
  source: unknown,
  prefix = '',
  out: Record<string, string> = {},
): Record<string, string> {
  if (typeof source === 'string') {
    if (prefix && source.trim()) out[prefix] = source;
    return out;
  }
  if (Array.isArray(source)) {
    source.forEach((item, index) => flattenResource(item, prefix ? `${prefix}.${index}` : String(index), out));
    return out;
  }
  if (source && typeof source === 'object') {
    Object.entries(source as Record<string, unknown>).forEach(([key, child]) => {
      flattenResource(child, prefix ? `${prefix}.${key}` : key, out);
    });
  }
  return out;
}