import { useCallback, useEffect, useRef, useState } from "react";
import { fetchLiveNews, REFRESH_INTERVAL_MS } from "../services/newsService";

let fetchInFlight = null;

/**
 * Live RSS news hook with debounced search, cache, and 5-minute auto-refresh.
 */
export function useNews({ categoryId = "all", searchQuery = "", enabled = true } = {}) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const mounted = useRef(true);
  const requestId = useRef(0);

  const load = useCallback(
    async (opts = {}) => {
      if (!enabled) return;

      const silent = opts.silent === true;
      const force = opts.force === true;
      const reqId = ++requestId.current;

      if (!silent) setLoading(true);
      setError(null);

      const run = async () => {
        const result = await fetchLiveNews({
          categoryId,
          searchQuery,
          force,
        });
        if (!mounted.current || reqId !== requestId.current) return;
        setArticles(result.articles);
        setLastUpdated(result.fetchedAt);
      };

      try {
        if (fetchInFlight) await fetchInFlight;
        fetchInFlight = run();
        await fetchInFlight;
      } catch (e) {
        if (!mounted.current || reqId !== requestId.current) return;
        setError(e?.message || "Failed to load news.");
        if (!silent) setArticles([]);
      } finally {
        fetchInFlight = null;
        if (mounted.current && reqId === requestId.current) setLoading(false);
      }
    },
    [categoryId, searchQuery, enabled]
  );

  useEffect(() => {
    mounted.current = true;
    load({ silent: false, force: false });
    return () => {
      mounted.current = false;
    };
  }, [load]);

  useEffect(() => {
    if (!enabled) return undefined;
    const id = setInterval(() => load({ silent: true, force: true }), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load, enabled]);

  const refresh = useCallback(() => load({ silent: false, force: true }), [load]);

  return { articles, loading, error, lastUpdated, refresh };
}
