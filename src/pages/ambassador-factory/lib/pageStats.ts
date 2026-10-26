/* Real click counting for the public ambassador landing pages.
   Every visit to /f/:amb/:factory is recorded with its timestamp in the browser
   so the ambassador dashboard can show a click number that grows on each page
   view — and can be filtered by today / last 7 days / all time. */

const KEY = 'sta_amb_page_clicks';

/* Each page stores a list of visit timestamps (ms). */
type VisitMap = Record<string, number[]>;

export type RangeKey = 'today' | 'week' | 'all';

export function pageKey(ambSlug: string, factoryId: string): string {
  return `${ambSlug}::${factoryId}`;
}

function readMap(): VisitMap {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const out: VisitMap = {};
    Object.entries(parsed as Record<string, unknown>).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        out[k] = v.filter((x): x is number => typeof x === 'number');
      }
    });
    return out;
  } catch {
    return {};
  }
}

function writeMap(map: VisitMap): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* Storage unavailable — counts simply will not persist between reloads. */
  }
}

/* Guards against a single page load being counted twice (React strict mode
   double-invokes effects). One load of a page = one click. */
const countedThisLoad = new Set<string>();

/* Records one visit for a page and returns its new all-time total for this browser. */
export function registerVisit(ambSlug: string, factoryId: string): number {
  const k = pageKey(ambSlug, factoryId);
  const map = readMap();
  if (!countedThisLoad.has(k)) {
    countedThisLoad.add(k);
    const arr = map[k] ?? [];
    arr.push(Date.now());
    map[k] = arr;
    writeMap(map);
  }
  return (map[k] ?? []).length;
}

/* The oldest timestamp still counted for a given range. */
function rangeStart(range: RangeKey): number {
  if (range === 'today') {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  if (range === 'week') return Date.now() - 7 * 24 * 60 * 60 * 1000;
  return 0;
}

/* Visits recorded so far for a page (0 when the page was never opened here). */
export function getVisits(ambSlug: string, factoryId: string): number {
  return (readMap()[pageKey(ambSlug, factoryId)] ?? []).length;
}

/* Visits for a page limited to the given time range. */
export function getVisitsInRange(ambSlug: string, factoryId: string, range: RangeKey): number {
  const arr = readMap()[pageKey(ambSlug, factoryId)] ?? [];
  const start = rangeStart(range);
  return arr.filter((ts) => ts >= start).length;
}

/* Daily visit counts for a page over the last `days` days (oldest → newest).
   Used to draw the click-growth trend for the best-performing page. */
export function getDailyVisits(ambSlug: string, factoryId: string, days = 7): number[] {
  const arr = readMap()[pageKey(ambSlug, factoryId)] ?? [];
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const dayMs = 24 * 60 * 60 * 1000;
  const out: number[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const dayStart = startOfToday.getTime() - i * dayMs;
    const dayEnd = dayStart + dayMs;
    out.push(arr.filter((ts) => ts >= dayStart && ts < dayEnd).length);
  }
  return out;
}

/* Short weekday labels for the last `days` days (oldest → newest), localised. */
export function dayLabels(lang: string, days = 7): string[] {
  const locale = (lang || 'ar').toLowerCase().match(/^(en|ur|id)/) !== null ? 'en-US' : 'ar-EG';
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const dayMs = 24 * 60 * 60 * 1000;
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(startOfToday.getTime() - i * dayMs);
    out.push(d.toLocaleDateString(locale, { weekday: 'short' }));
  }
  return out;
}

/* Grouped all-time visit totals for every page, optionally limited to one ambassador. */
export function getVisitTotals(ambSlug?: string): Record<string, number> {
  const map = readMap();
  const totals: Record<string, number> = {};
  Object.entries(map).forEach(([k, v]) => {
    if (!ambSlug || k.startsWith(`${ambSlug}::`)) totals[k] = v.length;
  });
  return totals;
}

/* Formats a click total in the active language (Arabic-Indic digits in Arabic). */
export function formatClicks(total: number, lang: string): string {
  try {
    const locale = (lang || 'ar').toLowerCase().match(/^(en|ur|id)/) !== null ? 'en-US' : 'ar-EG';
    return new Intl.NumberFormat(locale).format(total);
  } catch {
    return String(total);
  }
}