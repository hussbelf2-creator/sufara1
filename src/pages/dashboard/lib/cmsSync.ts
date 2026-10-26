import i18n from '@/i18n';
import { supabase } from '@/lib/supabase';
import { flattenResource } from '@/i18n/overrides';

/* Imports every line the website can print into the content store, so the
   admin can rewrite any of it — not just the home page. Keys are the exact
   resource paths the site resolves, which means a row becomes live the moment
   it is saved. Running this again only fills the gaps, so edited copy is never
   overwritten. */

type Draft = {
  key: string;
  lang: string;
  page_key: string;
  area: string;
  label_ar: string;
  label_en: string;
  value: string;
  kind: string;
  published: boolean;
  sort_order: number;
};

/* Namespaces that belong to the public site. The dashboard has its own admin
   vocabulary and is deliberately left out — editing the panel from the panel
   would be a confusing loop. */
const PUBLIC_ROOTS = new Set([
  'home', 'shop', 'factories', 'faq', 'legal', 'orders', 'common',
]);

const PAGE_BY_ROOT: Record<string, string> = {
  home: 'home',
  shop: 'shop',
  factories: 'factories',
  faq: 'faq',
  legal: 'legal',
  orders: 'orders',
  common: 'common',
};

/* A handful of shared groups live under `common` but really belong to their own
   screen; mapping them keeps the page filter honest. */
const PAGE_BY_GROUP: Record<string, string> = {
  brandPage: 'brand',
  faqQuick: 'faq',
};

const LONG_TEXT = 120;

function pageOf(key: string): string {
  const parts = key.split('.');
  const group = parts[1] ?? '';
  if (PAGE_BY_GROUP[group]) return PAGE_BY_GROUP[group];
  return PAGE_BY_ROOT[parts[0]] ?? 'general';
}

function areaOf(key: string): string {
  const parts = key.split('.');
  const group = parts[1] ?? 'general';
  /* Array indexes are not useful group names — fall back to the group itself. */
  return /^\d+$/.test(group) ? (parts[0] ?? 'general') : group;
}

function labelOf(value: string, key: string): string {
  const clean = value.replace(/\s+/g, ' ').trim();
  if (!clean) return key;
  return clean.length > 80 ? `${clean.slice(0, 78)}…` : clean;
}

function buildDrafts(): Draft[] {
  const ar = flattenResource(i18n.getResourceBundle('ar', 'translation'));
  const en = flattenResource(i18n.getResourceBundle('en', 'translation'));

  const keys = new Set<string>([...Object.keys(ar), ...Object.keys(en)]);
  const drafts: Draft[] = [];

  keys.forEach((key) => {
    const root = key.split('.')[0];
    if (!PUBLIC_ROOTS.has(root)) return;

    const labelAr = labelOf(ar[key] ?? en[key] ?? key, key);
    const labelEn = labelOf(en[key] ?? ar[key] ?? key, key);

    ([['ar', ar[key]], ['en', en[key]]] as const).forEach(([lang, value]) => {
      if (typeof value !== 'string' || !value.trim()) return;
      drafts.push({
        key,
        lang,
        page_key: pageOf(key),
        area: areaOf(key),
        label_ar: labelAr,
        label_en: labelEn,
        value,
        kind: value.length > LONG_TEXT || value.indexOf('\n') !== -1 ? 'textarea' : 'text',
        published: true,
        sort_order: 100,
      });
    });
  });

  return drafts;
}

async function existingKeys(lang: string): Promise<Set<string>> {
  const found = new Set<string>();
  const pageSize = 1000;
  for (let from = 0; from < 20000; from += pageSize) {
    const { data, error } = await supabase
      .from('cms_entries')
      .select('key')
      .eq('lang', lang)
      .range(from, from + pageSize - 1);
    if (error) break;
    const rows = data ?? [];
    rows.forEach((row) => found.add(String((row as { key: string }).key)));
    if (rows.length < pageSize) break;
  }
  return found;
}

export type SyncResult = { added: number; scanned: number; error: string };

/* Scans the site's copy and inserts anything missing. Safe to run repeatedly. */
export async function syncSiteContent(): Promise<SyncResult> {
  try {
    const drafts = buildDrafts();
    if (!drafts.length) return { added: 0, scanned: 0, error: '' };

    const [arKeys, enKeys] = await Promise.all([existingKeys('ar'), existingKeys('en')]);
    const known: Record<string, Set<string>> = { ar: arKeys, en: enKeys };

    const missing = drafts.filter((draft) => !known[draft.lang]?.has(draft.key));
    if (!missing.length) return { added: 0, scanned: drafts.length, error: '' };

    let added = 0;
    const batch = 250;
    for (let i = 0; i < missing.length; i += batch) {
      const slice = missing.slice(i, i + batch);
      const { error } = await supabase.from('cms_entries').insert(slice);
      if (error) return { added, scanned: drafts.length, error: error.message };
      added += slice.length;
    }
    return { added, scanned: drafts.length, error: '' };
  } catch (err) {
    return { added: 0, scanned: 0, error: err instanceof Error ? err.message : 'sync failed' };
  }
}

/* How many lines this run would cover — shown before the admin commits. */
export function countSiteLines(): number {
  return buildDrafts().length;
}