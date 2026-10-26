/* Runtime holder for the active PlatformConfig.

   - Pure modules (promo, shipping, economics, tax) call getConfig().
   - React views call usePlatformConfig() and re-render on publish.
   - Versions live in the `platform_settings` table (public read, admin-only
     write through the `publish_platform_settings` RPC). Without a backend —
     local development or the demo — they are kept in localStorage so the
     admin panel still behaves end-to-end. */

import { useSyncExternalStore } from 'react';
import { supabase, backendReady } from '@/lib/supabase';
import { DEFAULT_CONFIG, normalizeConfig, type PlatformConfig } from './platform';

export interface ConfigVersion {
  version: number;
  effectiveFrom: string;
  note: string;
  createdBy: string;
  createdAt: string;
  payload: PlatformConfig;
}

const CACHE_KEY = 'safeer-platform-config';
const LOCAL_VERSIONS_KEY = 'safeer-platform-versions';

let versions: ConfigVersion[] = [];
let current: PlatformConfig = readCache() ?? normalizeConfig(DEFAULT_CONFIG);
const listeners = new Set<() => void>();

function readCache(): PlatformConfig | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? normalizeConfig(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function writeCache(cfg: PlatformConfig) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cfg));
  } catch {
    /* storage unavailable — the in-memory copy still serves this visit */
  }
}

function emit() {
  listeners.forEach((fn) => fn());
}

export function getConfig(): PlatformConfig {
  return current;
}

export function getVersions(): ConfigVersion[] {
  return versions;
}

/** Picks the newest version whose effective date has arrived. */
export function activeVersionAt(list: ConfigVersion[], at = new Date()): ConfigVersion | undefined {
  const today = at.toISOString().slice(0, 10);
  return [...list]
    .filter((v) => v.effectiveFrom <= today)
    .sort((a, b) => (a.effectiveFrom === b.effectiveFrom ? b.version - a.version : b.effectiveFrom.localeCompare(a.effectiveFrom)))[0];
}

function apply(list: ConfigVersion[]) {
  versions = [...list].sort((a, b) => b.version - a.version);
  const active = activeVersionAt(versions);
  current = active ? normalizeConfig(active.payload) : normalizeConfig(DEFAULT_CONFIG);
  writeCache(current);
  emit();
}

function readLocalVersions(): ConfigVersion[] {
  try {
    const raw = localStorage.getItem(LOCAL_VERSIONS_KEY);
    return raw ? (JSON.parse(raw) as ConfigVersion[]) : [];
  } catch {
    return [];
  }
}

let loading: Promise<void> | null = null;

export function loadPlatformConfig(): Promise<void> {
  if (loading) return loading;
  loading = (async () => {
    if (backendReady) {
      try {
        const { data, error } = await supabase
          .from('platform_settings')
          .select('version, effective_from, note, created_by, created_at, payload')
          .order('version', { ascending: false })
          .limit(50);
        if (!error && data) {
          apply(data.map((r) => ({
            version: r.version as number,
            effectiveFrom: String(r.effective_from).slice(0, 10),
            note: (r.note as string) ?? '',
            createdBy: (r.created_by as string) ?? '',
            createdAt: (r.created_at as string) ?? '',
            payload: normalizeConfig(r.payload),
          })));
          return;
        }
      } catch {
        /* fall back to the local copy */
      }
    }
    apply(readLocalVersions());
  })();
  return loading;
}

export interface PublishResult {
  ok: boolean;
  error?: string;
  version?: number;
}

/**
 * Publishes a new settings version. The server function re-validates the
 * payload and checks the caller's admin role — the client check here is only
 * for a fast, friendly error.
 */
export async function publishConfig(
  payload: PlatformConfig,
  meta: { note: string; effectiveFrom: string; author: string; demo: boolean },
): Promise<PublishResult> {
  const clean = normalizeConfig({ ...payload, effectiveFrom: meta.effectiveFrom, note: meta.note });
  const nextVersion = (versions[0]?.version ?? DEFAULT_CONFIG.version) + 1;
  clean.version = nextVersion;

  if (backendReady && !meta.demo) {
    const { data, error } = await supabase.rpc('publish_platform_settings', {
      p_payload: clean,
      p_effective_from: meta.effectiveFrom,
      p_note: meta.note,
    });
    if (error) return { ok: false, error: error.message };
    loading = null;
    await loadPlatformConfig();
    return { ok: true, version: (data as number) ?? nextVersion };
  }

  const entry: ConfigVersion = {
    version: nextVersion,
    effectiveFrom: meta.effectiveFrom,
    note: meta.note,
    createdBy: meta.author,
    createdAt: new Date().toISOString(),
    payload: clean,
  };
  const list = [entry, ...readLocalVersions()];
  try {
    localStorage.setItem(LOCAL_VERSIONS_KEY, JSON.stringify(list));
  } catch {
    return { ok: false, error: 'storage' };
  }
  apply(list);
  return { ok: true, version: nextVersion };
}

/** Test / storybook hook: replace the active config in memory. */
export function setConfigForTests(patch: unknown) {
  current = normalizeConfig(patch);
  emit();
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function usePlatformConfig(): PlatformConfig {
  return useSyncExternalStore(subscribe, getConfig, getConfig);
}

export function usePlatformVersions(): ConfigVersion[] {
  return useSyncExternalStore(subscribe, getVersions, getVersions);
}
