// Yahoo poll interval & stock list paging
export const YAHOO_MARKET_POLL_MS = 20_000;
export const YAHOO_QUOTE_CACHE_MS = 25_000;
export const YAHOO_QUOTE_BATCH_SIZE = 40;
/** Concurrent v8 chart fallbacks per wave (all missing symbols are covered). */
export const YAHOO_CHART_FALLBACK_CONCURRENCY = 8;
export const STOCK_TABLE_PAGE_SIZE = 25;

/** Sector-based filters for NSE universe (see stockFilters.js). */
export const STOCK_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "trending", label: "Trending" },
  { id: "banking", label: "Banking" },
  { id: "it", label: "IT" },
  { id: "energy", label: "Energy" },
  { id: "pharma", label: "Pharma" },
  { id: "auto", label: "Auto" },
  { id: "fmcg", label: "FMCG" },
];

export const STOCK_SORT_MODES = [
  { id: "gainers", label: "Top Gainers" },
  { id: "losers", label: "Top Losers" },
  { id: "volume", label: "Highest Volume" },
  { id: "score", label: "AI Score" },
];
