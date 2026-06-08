// Yahoo market polling for indices + full stock universe
import { useState, useEffect, useRef } from "react";
import { STOCKS, getYahooSymbol } from "../../data/stocksList.js";
import { DEFAULT_INDICES, INDEX_YAHOO_DEFS } from "../../data/marketIndices.js";
import { YAHOO_MARKET_POLL_MS } from "../../constants/market.js";
import {
  fetchQuotesMap,
  fetchNiftyIntradaySeries,
  indexRowsFromQuotes,
  mergeStocksWithYahoo,
  quoteMarketPrice,
} from "../../services/stocks/stockService.js";

export function useMarketData() {
  const [liveStocks, setLiveStocks] = useState(STOCKS);
  const [liveIndices, setLiveIndices] = useState(() => DEFAULT_INDICES.map((r) => ({ ...r })));
  const [niftySeries, setNiftySeries] = useState([]);
  const [quoteMeta, setQuoteMeta] = useState({ ok: true, message: null, loading: true });
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    let timer;

    const poll = async () => {
      const indexSyms = INDEX_YAHOO_DEFS.map((d) => d.yahoo);
      const stockSyms = STOCKS.map(getYahooSymbol);
      const allSyms = [...new Set([...indexSyms, ...stockSyms])];

      let bySym = {};
      let quoteNote = null;
      try {
        bySym = await fetchQuotesMap(allSyms);
        const got = allSyms.filter((s) => quoteMarketPrice(bySym[s]) != null).length;
        if (got < allSyms.length * 0.5) {
          quoteNote = `Loaded ${got}/${allSyms.length} symbols; some may be delayed.`;
        }
      } catch (e) {
        quoteNote = e?.message || "Quote request failed; retrying…";
      }

      if (!mounted.current) return;

      let liveCount = 0;
      setLiveStocks((prev) => {
        const merged = mergeStocksWithYahoo(STOCKS, bySym, prev);
        liveCount = merged.filter((s) => s.live).length;
        return merged;
      });
      setLiveIndices(indexRowsFromQuotes(INDEX_YAHOO_DEFS, bySym));

      const staleCount = STOCKS.length - liveCount;
      setQuoteMeta({
        ok: liveCount > STOCKS.length * 0.4,
        message:
          liveCount === STOCKS.length
            ? null
            : quoteNote ||
              `${liveCount}/${STOCKS.length} live` +
                (staleCount > 0 ? ` · ${staleCount} delayed (*)` : ""),
        loading: false,
        liveCount,
        total: STOCKS.length,
        updatedAt: Date.now(),
      });

      try {
        const intra = await fetchNiftyIntradaySeries();
        if (mounted.current && intra.length) setNiftySeries(intra);
      } catch {
        /* keep previous */
      }
    };

    poll();
    timer = setInterval(poll, YAHOO_MARKET_POLL_MS);
    return () => {
      mounted.current = false;
      clearInterval(timer);
    };
  }, []);

  return { liveStocks, liveIndices, niftySeries, quoteMeta };
}
