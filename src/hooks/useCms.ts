import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { fetchAllRows } from '@/lib/fetchAll';
import i18n from '@/i18n';
import { setOverrideMap } from '@/i18n/overrides';

/* Live site content, managed from the admin content panel.
   Every published entry is read here and overrides the built-in copy, so the
   admin can rewrite the site without a deploy. Values are cached in
   localStorage so the first paint already shows the edited copy, then the
   real rows replace them as soon as they arrive. */

export type CmsMediaRow = {
  id: number;
  title_ar: string;
  title_en: string;
  kind: string;
  lang: string;
  section: string;
  url: string;
  poster_url: string | null;
  storage_path: string | null;
  status: string;
  sort_order: number;
  created_at?: string;
};

type EntryRow = {
  key: string | null;
  value: string | null;
  published: boolean | null;
  scheduled_at: string | null;
  scheduled_value: string | null;
  scheduled_published: boolean | null;
};

type Snapshot = {
  entries: Record<string, string>;
  media: CmsMediaRow[];
  at: number;
};
type Store = Snapshot & { loading: boolean; error: string };

const EVT = 'sta-cms-change';

const cache = new Map<string, Store>();
const listeners = new Set<() => void>();
const inflight = new Map<string, Promise<void>>();
/* Soonest scheduled moment per language, so an open page can refresh itself
   exactly when a scheduled line is due — no reload needed by the visitor. */
const nextDue = new Map<string, number>();

const empty = (): Store => ({ entries: {}, media: [], at: 0, loading: true, error: '' });

const LS_KEY = (lang: string) => `sta-cms-${lang}`;

function readLocal(lang: string): Store | null {
  try {
    const raw = localStorage.getItem(LS_KEY(lang));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Snapshot;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      entries: parsed.entries ?? {},
      media: Array.isArray(parsed.media) ? parsed.media : [],
      at: parsed.at ?? 0,
      loading: true,
      error: '',
    };
  } catch {
    return null;
  }
}

function writeLocal(lang: string, store: Store) {
  try {
    localStorage.setItem(LS_KEY(lang), JSON.stringify({ entries: store.entries, media: store.media, at: store.at }));
  } catch {
    /* storage may be full or unavailable — the site still works from the DB */
  }
}

function publish(lang: string, store: Store) {
  cache.set(lang, store);
  listeners.forEach((fn) => fn());
}

async function runLoad(lang: string): Promise<void> {
  try {
    const [entriesFetch, mediaFetch] = await Promise.all([
      fetchAllRows<EntryRow>((from, to) => supabase
        .from('cms_entries')
        .select('key,value,published,scheduled_at,scheduled_value,scheduled_published')
        .eq('lang', lang)
        .order('id', { ascending: true })
        .range(from, to)),
      fetchAllRows<CmsMediaRow>((from, to) => supabase
        .from('cms_media')
        .select('*')
        .eq('status', 'published')
        .in('lang', [lang, 'both'])
        .order('id', { ascending: true })
        .range(from, to)),
    ]);

    if (entriesFetch.error) throw new Error(entriesFetch.error);

    /* A scheduled entry keeps serving the current copy until its moment, then
       the scheduled value takes over without waiting for anyone to publish. */
    const now = Date.now();
    let soonest = 0;
    const entries: Record<string, string> = {};
    entriesFetch.rows.forEach((item) => {
      const dueAt = item.scheduled_at ? new Date(item.scheduled_at).getTime() : 0;
      const due = dueAt > 0 && dueAt <= now;
      if (dueAt > now && (soonest === 0 || dueAt < soonest)) soonest = dueAt;
      const value = due && item.scheduled_value != null ? item.scheduled_value : item.value;
      const published = due && item.scheduled_published != null ? item.scheduled_published : item.published;
      const key = String(item.key ?? '');
      if (published !== false && key && String(value ?? '').trim()) {
        entries[key] = String(value);
      }
    });
    nextDue.set(lang, soonest);

    const media = mediaFetch.rows.filter((row) => row.url);

    /* Published copy becomes the live source for every translated line on the
       site, so a save in the panel shows up on the store, factories, FAQ and
       legal pages too — not only where this hook is called directly. */
    const changed = setOverrideMap(lang, entries);

    const next: Store = {
      entries,
      media,
      at: Date.now(),
      loading: false,
      error: mediaFetch.error,
    };
    publish(lang, next);
    writeLocal(lang, next);

    /* Same language, new copy: the event is what makes open pages repaint
       without a reload. */
    if (changed) i18n.emit('languageChanged', i18n.language);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'content unavailable';
    const prev = cache.get(lang) ?? readLocal(lang) ?? empty();
    publish(lang, { ...prev, loading: false, error: message });
  }
}

/* Several components ask for content on the same page — one request per
   language at a time keeps that a single round trip. */
function loadCms(lang: string): Promise<void> {
  const pending = inflight.get(lang);
  if (pending) return pending;
  const task = runLoad(lang).finally(() => inflight.delete(lang));
  inflight.set(lang, task);
  return task;
}

/* Called by any screen that saves content so every open page refreshes. */
export function refreshCms() {
  cache.clear();
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVT));
}

export function useCms() {
  const { i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || i18n.language || 'ar').toLowerCase().match(/^(en|ur|id)/) !== null ? 'en' : 'ar';

  const [store, setStore] = useState<Store>(() => cache.get(lang) ?? readLocal(lang) ?? empty());

  useEffect(() => {
    let alive = true;
    const sync = () => {
      const next = cache.get(lang);
      if (next && alive) setStore(next);
    };
    listeners.add(sync);
    const onRefresh = () => {
      loadCms(lang);
    };
    window.addEventListener(EVT, onRefresh);
    const timer = window.setInterval(() => {
      const due = nextDue.get(lang) ?? 0;
      if (due && due <= Date.now()) loadCms(lang);
    }, 30_000);
    sync();
    loadCms(lang);

    return () => {
      alive = false;
      window.clearInterval(timer);
      listeners.delete(sync);
      window.removeEventListener(EVT, onRefresh);
    };
  }, [lang]);

  /* Returns the edited value when the admin has published one, otherwise the
     built-in copy passed in as the fallback. */
  const get = useCallback((key: string, fallback: string): string => {
    const value = store.entries[key];
    return value && value.trim() ? value : fallback;
  }, [store.entries]);

  const media = useCallback((section: string, kind = 'video'): CmsMediaRow | null => {
    const rows = store.media.filter((row) => row.section === section && row.kind === kind);
    /* A language-specific file always wins over a "both" file. */
    return rows.find((row) => row.lang === lang) ?? rows[0] ?? null;
  }, [store.media, lang]);

  return useMemo(() => ({
    lang,
    get,
    media,
    loading: store.loading,
    error: store.error,
    updatedAt: store.at,
  }), [lang, get, media, store.loading, store.error, store.at]);
}