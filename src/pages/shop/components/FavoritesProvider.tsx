import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';

/* Real, persisted favourites / watchlist. The shopper's saved product ids are
   kept in the browser so the heart on any product card stays filled across
   pages and reloads. Only ids are stored — product details are always resolved
   fresh, so prices and stock can never go stale. */

const KEY = 'sta_favorites';

interface FavoritesApi {
  ids: string[];
  count: number;
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const noop = () => {};
const FavoritesCtx = createContext<FavoritesApi>({
  ids: [],
  count: 0,
  has: () => false,
  toggle: noop,
  remove: noop,
  clear: noop,
});

export function useFavorites() {
  return useContext(FavoritesCtx);
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setIds(parsed.filter((x): x is string => typeof x === 'string'));
        }
      }
    } catch {
      /* localStorage unavailable: favourites simply start empty. */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(ids));
    } catch {
      /* ignore persistence failure */
    }
  }, [ids, ready]);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback((id: string) => {
    setIds((current) => (current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id]));
  }, []);

  const remove = useCallback((id: string) => {
    setIds((current) => current.filter((x) => x !== id));
  }, []);

  const clear = useCallback(() => setIds([]), []);

  const value = useMemo<FavoritesApi>(
    () => ({ ids, count: ids.length, has, toggle, remove, clear }),
    [ids, has, toggle, remove, clear],
  );

  return <FavoritesCtx.Provider value={value}>{children}</FavoritesCtx.Provider>;
}