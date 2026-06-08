// Client-side stock list: category, sort, debounced search, pagination
import { useState, useEffect, useMemo } from "react";
import { useMarketData } from "./useMarketData.js";
import {
  filterStocksByQuery,
  filterStocksByCategory,
  sortStocks,
} from "../../utils/stockFilters.js";
import { STOCK_TABLE_PAGE_SIZE } from "../../constants/market.js";

const SEARCH_DEBOUNCE_MS = 280;

export function useStocks() {
  const market = useMarketData();
  const [category, setCategory] = useState("all");
  const [sortMode, setSortMode] = useState("gainers");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(STOCK_TABLE_PAGE_SIZE);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setVisibleCount(STOCK_TABLE_PAGE_SIZE);
  }, [category, sortMode, debouncedSearch]);

  const processedStocks = useMemo(() => {
    let list = market.liveStocks;
    list = filterStocksByCategory(list, category);
    list = filterStocksByQuery(list, debouncedSearch);
    return sortStocks(list, sortMode);
  }, [market.liveStocks, category, debouncedSearch, sortMode]);

  const visibleStocks = useMemo(
    () => processedStocks.slice(0, visibleCount),
    [processedStocks, visibleCount]
  );

  const listMeta = useMemo(
    () => ({
      query: debouncedSearch,
      shown: processedStocks.length,
      total: market.liveStocks.length,
      visible: visibleStocks.length,
      category,
      sortMode,
      hasMore: visibleCount < processedStocks.length,
    }),
    [
      debouncedSearch,
      processedStocks.length,
      market.liveStocks.length,
      visibleStocks.length,
      category,
      sortMode,
      visibleCount,
    ]
  );

  const loadMore = () =>
    setVisibleCount((n) => Math.min(n + STOCK_TABLE_PAGE_SIZE, processedStocks.length));

  return {
    ...market,
    category,
    setCategory,
    sortMode,
    setSortMode,
    searchInput,
    setSearchInput,
    processedStocks,
    visibleStocks,
    listMeta,
    loadMore,
    resetVisible: () => setVisibleCount(STOCK_TABLE_PAGE_SIZE),
  };
}
