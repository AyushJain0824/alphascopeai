// Yahoo Finance & stock helpers
import { formatVolume, formatMarketCap } from "../../utils/formatters.js";
import { getYahooSymbol } from "../../data/stocksList.js";
import {
  YAHOO_QUOTE_CACHE_MS,
  YAHOO_QUOTE_BATCH_SIZE,
  YAHOO_CHART_FALLBACK_CONCURRENCY,
} from "../../constants/market.js";

const quoteCache = new Map();
const inflight = new Map();

function cacheKey(symbols) {
  return [...symbols].sort().join("|");
}

function getCached(symbols) {
  const key = cacheKey(symbols);
  const hit = quoteCache.get(key);
  if (hit && Date.now() - hit.ts < YAHOO_QUOTE_CACHE_MS) return hit.data;
  return null;
}

function setCache(symbols, data) {
  quoteCache.set(cacheKey(symbols), { ts: Date.now(), data });
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Best available spot price from a Yahoo quote or chart meta row. */
export function quoteMarketPrice(q) {
  if (!q) return null;
  const p =
    q.regularMarketPrice ??
    q.postMarketPrice ??
    q.preMarketPrice ??
    q.regularMarketPreviousClose;
  return p != null && Number.isFinite(Number(p)) ? Number(p) : null;
}

function quoteChangePercent(q, price) {
  if (q?.regularMarketChangePercent != null && Number.isFinite(q.regularMarketChangePercent)) {
    return Number(q.regularMarketChangePercent);
  }
  const prev =
    q?.regularMarketPreviousClose ??
    q?.chartPreviousClose ??
    q?.previousClose;
  if (price != null && prev != null && prev !== 0) {
    return ((price - prev) / prev) * 100;
  }
  return null;
}

function quoteVolume(q) {
  const v = q?.regularMarketVolume ?? q?.postMarketVolume;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export async function fetchYahooQuoteResults(yahooSymbols) {
  if (!yahooSymbols.length) return [];
  const unique = [...new Set(yahooSymbols)];
  const cached = getCached(unique);
  if (cached) return cached;

  const key = cacheKey(unique);
  if (inflight.has(key)) return inflight.get(key);

  const promise = (async () => {
    const batches = chunk(unique, YAHOO_QUOTE_BATCH_SIZE);
    const all = [];
    let v7Blocked = false;
    for (const batch of batches) {
      if (v7Blocked) break;
      const url = `/api/yahoo/v7/finance/quote?symbols=${encodeURIComponent(batch.join(","))}`;
      try {
        const r = await fetch(url);
        const d = await r.json().catch(() => ({}));
        if (!r.ok || d.finance?.error || d.quoteResponse?.error) {
          if (r.status === 401 || d.finance?.error?.code === "Unauthorized") v7Blocked = true;
          continue;
        }
        const rows = d.quoteResponse?.result ?? [];
        if (!rows.length && batch.length) v7Blocked = true;
        all.push(...rows);
      } catch {
        v7Blocked = true;
      }
    }
    setCache(unique, all);
    return all;
  })().finally(() => inflight.delete(key));

  inflight.set(key, promise);
  return promise;
}

export async function fetchYahooChartAsQuote(yahooSymbol) {
  const path = `/api/yahoo/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=2d&interval=1d`;
  const r = await fetch(path);
  if (!r.ok) return null;
  const d = await r.json().catch(() => ({}));
  const meta = d.chart?.result?.[0]?.meta;
  const price = quoteMarketPrice(meta);
  if (!meta || price == null) return null;
  const prev = meta.chartPreviousClose ?? meta.previousClose ?? price;
  const chgPts = price - prev;
  const chgPct = prev ? (chgPts / prev) * 100 : 0;
  return {
    symbol: meta.symbol ?? yahooSymbol,
    regularMarketPrice: price,
    regularMarketChangePercent: chgPct,
    regularMarketChange: chgPts,
    regularMarketVolume: meta.regularMarketVolume,
    regularMarketPreviousClose: prev,
  };
}

async function fetchChartsForMissing(symbols) {
  const rows = [];
  for (let i = 0; i < symbols.length; i += YAHOO_CHART_FALLBACK_CONCURRENCY) {
    const batch = symbols.slice(i, i + YAHOO_CHART_FALLBACK_CONCURRENCY);
    const part = await Promise.all(batch.map((sym) => fetchYahooChartAsQuote(sym)));
    for (const row of part) {
      if (row?.symbol) rows.push(row);
    }
  }
  return rows;
}

/** Fetch quotes for many symbols; chart fallback for every missing symbol. */
export async function fetchQuotesMap(yahooSymbols) {
  const unique = [...new Set(yahooSymbols)];
  let bySym = {};
  try {
    const results = await fetchYahooQuoteResults(unique);
    bySym = Object.fromEntries(
      results.filter(Boolean).map((q) => [q.symbol, q])
    );
  } catch {
    /* continue to chart fallback */
  }

  const missing = unique.filter((sym) => quoteMarketPrice(bySym[sym]) == null);
  if (missing.length) {
    const rows = await fetchChartsForMissing(missing);
    for (const row of rows) {
      if (row?.symbol) bySym[row.symbol] = row;
    }
  }
  return bySym;
}

export async function fetchNiftyIntradaySeries() {
  const r = await fetch("/api/yahoo/v8/finance/chart/%5ENSEI?interval=5m&range=1d");
  if (!r.ok) throw new Error(`nifty chart ${r.status}`);
  const d = await r.json();
  const res = d.chart?.result?.[0];
  if (!res) return [];
  const ts = res.timestamp || [];
  const closes = res.indicators?.quote?.[0]?.close || [];
  return ts
    .map((t, i) => ({
      t: new Date(t * 1000).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      }),
      v: closes[i],
    }))
    .filter((p) => p.v != null && Number.isFinite(p.v));
}

export function indexRowsFromQuotes(defs, quotesBySymbol) {
  return defs.map((def) => {
    const q = quotesBySymbol[def.yahoo];
    const price = quoteMarketPrice(q);
    if (price == null) {
      return { name: def.name, value: "—", chg: "—", chgPts: "—", color: "var(--muted)" };
    }
    const chgPct = quoteChangePercent(q, price) ?? 0;
    const chgPts = Number(q.regularMarketChange ?? (price * chgPct) / 100);
    const color = chgPct >= 0 ? "var(--green)" : "var(--red)";
    const locale = "en-IN";
    return {
      name: def.name,
      value: price.toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      chg: `${chgPct >= 0 ? "+" : ""}${chgPct.toFixed(2)}%`,
      chgPts: `${chgPts >= 0 ? "+" : ""}${chgPts.toLocaleString(locale, { maximumFractionDigits: 2 })}`,
      color,
    };
  });
}

const NO_QUOTE_FIELDS = {
  price: null,
  chg: null,
  vol: "—",
  volumeRaw: 0,
  live: false,
  quoteStale: false,
};

export function mergeStocksWithYahoo(seedStocks, quotesBySymbol, previousStocks = []) {
  const prevById = Object.fromEntries(previousStocks.map((s) => [s.id, s]));

  return seedStocks.map((s) => {
    const ySym = getYahooSymbol(s);
    const q = quotesBySymbol[ySym];
    const price = quoteMarketPrice(q);
    const prev = prevById[s.id];

    if (price == null) {
      if (prev?.live && prev.price != null) {
        return {
          ...prev,
          live: false,
          quoteStale: true,
        };
      }
      return { ...s, ...NO_QUOTE_FIELDS };
    }

    const chgPct = quoteChangePercent(q, price);
    const vol = quoteVolume(q);

    return {
      ...s,
      price: +Number(price).toFixed(2),
      chg: chgPct != null ? +Number(chgPct).toFixed(2) : null,
      vol: formatVolume(vol, s.market),
      volumeRaw: typeof vol === "number" && Number.isFinite(vol) ? vol : 0,
      mktcapRaw:
        typeof q.marketCap === "number" && Number.isFinite(q.marketCap)
          ? q.marketCap
          : s.mktcapRaw,
      mktcap:
        typeof q.marketCap === "number" && q.marketCap > 0
          ? formatMarketCap(q.marketCap, s.market)
          : s.mktcap,
      pe:
        q.trailingPE != null || q.forwardPE != null
          ? +(Number(q.trailingPE ?? q.forwardPE)).toFixed(1)
          : s.pe,
      live: true,
      quoteStale: false,
      quotedAt: Date.now(),
    };
  });
}

export async function fetchStockDailyHistory(stockOrSymbol) {
  const yahoo =
    typeof stockOrSymbol === "object"
      ? getYahooSymbol(stockOrSymbol)
      : stockOrSymbol.includes(".")
        ? stockOrSymbol
        : `${stockOrSymbol}.NS`;
  const market =
    typeof stockOrSymbol === "object" ? stockOrSymbol.market : "IN";
  const sym = encodeURIComponent(yahoo);
  const r = await fetch(`/api/yahoo/v8/finance/chart/${sym}?interval=1d&range=1y`);
  if (!r.ok) throw new Error(`chart ${r.status}`);
  const d = await r.json();
  const res = d.chart?.result?.[0];
  if (!res) throw new Error("no chart");
  const ts = res.timestamp || [];
  const q = res.indicators?.quote?.[0] || {};
  const closes = q.close || [];
  const vols = q.volume || [];
  return ts
    .map((t, i) => ({
      date: new Date(t * 1000).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      price: closes[i],
      vol: vols[i] && Number.isFinite(vols[i]) ? formatVolume(vols[i], market) : "—",
      open: closes[i],
      high: closes[i],
      low: closes[i],
    }))
    .filter((row) => row.price != null && Number.isFinite(row.price));
}

export function genPriceHistory(base, days = 90) {
  const arr = [];
  let p = base || 100;
  const now = Date.now();
  for (let i = days; i >= 0; i--) {
    p = p * (1 + (Math.random() - 0.48) * 0.025);
    const d = new Date(now - i * 86400000);
    arr.push({
      date: d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      price: +p.toFixed(2),
      vol: Math.floor(Math.random() * 15e6 + 1e6),
      open: +(p * (1 - Math.random() * 0.01)).toFixed(2),
      high: +(p * (1 + Math.random() * 0.015)).toFixed(2),
      low: +(p * (1 - Math.random() * 0.015)).toFixed(2),
    });
  }
  return arr;
}
