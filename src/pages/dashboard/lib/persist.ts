/* Tiny typed helpers for persisting dashboard state in the browser, so the
   buyer's addresses, saved cards, messages, returns and deal payments survive
   a page reload instead of vanishing with React state. Once a real backend is
   connected these become server-side records. */

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage may be unavailable — state simply will not persist */
  }
}