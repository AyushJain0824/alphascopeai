/**
 * Free public RSS feeds via rss2json.com (no paid API required).
 * Optional: VITE_RSS2JSON_API_KEY for higher rate limits at https://rss2json.com
 */

const RSS2JSON_BASE = "https://api.rss2json.com/v1/api.json";
export const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const CACHE_TTL_MS = 2 * 60 * 1000;

/** @type {Map<string, { articles: object[], fetchedAt: number }>} */
const cache = new Map();

export const NEWS_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "stocks", label: "Stocks" },
  { id: "crypto", label: "Crypto" },
  { id: "global", label: "Global Markets" },
  { id: "economy", label: "Economy" },
  { id: "ai", label: "AI/Tech" },
];

/** RSS sources with category tags for filtering */
export const RSS_FEEDS = [
  {
    id: "yahoo",
    name: "Yahoo Finance",
    url: "https://finance.yahoo.com/rss/",
    categories: ["all", "stocks", "global"],
  },
  {
    id: "google-news",
    name: "Google News",
    url: "https://news.google.com/rss/search?q=stock+market&hl=en-US&gl=US&ceid=US:en",
    categories: ["all", "stocks", "global"],
  },
  {
    id: "marketwatch",
    name: "MarketWatch",
    url: "https://feeds.marketwatch.com/marketwatch/topstories/",
    categories: ["all", "stocks", "global"],
  },
  {
    id: "cnbc",
    name: "CNBC",
    url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114",
    categories: ["all", "stocks", "global"],
  },
  {
    id: "et",
    name: "Economic Times",
    url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
    categories: ["all", "stocks", "economy"],
  },
  {
    id: "coindesk",
    name: "CoinDesk",
    url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
    categories: ["all", "crypto"],
  },
];

const CATEGORY_KEYWORDS = {
  stocks: ["stock", "equity", "nse", "bse", "earnings", "ipo", "share", "sensex", "nifty"],
  crypto: ["crypto", "bitcoin", "ethereum", "blockchain", "btc", "eth", "defi"],
  global: ["market", "wall street", "fed", "dow", "nasdaq", "s&p", "forex", "global"],
  economy: ["economy", "gdp", "inflation", "rate", "fiscal", "trade", "central bank", "rbi"],
  ai: ["ai", "artificial intelligence", "tech", "semiconductor", "chip", "software", "cloud"],
};

function getOptionalApiKey() {
  const key = import.meta.env.VITE_RSS2JSON_API_KEY;
  return typeof key === "string" ? key.trim() : "";
}

function cacheKey(categoryId, searchQuery) {
  return `${categoryId}::${(searchQuery || "").trim().toLowerCase()}`;
}

export function inferSentiment(title = "", description = "") {
  const t = `${title} ${description}`.toLowerCase();
  const bearish = ["fall", "drop", "crash", "decline", "loss", "slump", "bear", "plunge", "warning", "cut"];
  const bullish = ["surge", "rally", "gain", "rise", "jump", "bull", "record", "high", "beat", "growth", "soar"];
  if (bearish.some((w) => t.includes(w))) return "bearish";
  if (bullish.some((w) => t.includes(w))) return "bullish";
  return "neutral";
}

export function formatTimeAgo(dateInput) {
  if (!dateInput) return "—";
  const then = new Date(dateInput).getTime();
  if (Number.isNaN(then)) return "—";
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateInput).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

function stripHtml(html = "") {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractImage(item) {
  if (item?.thumbnail) return item.thumbnail;
  if (item?.enclosure?.link && /\.(jpg|jpeg|png|gif|webp)/i.test(item.enclosure.link)) {
    return item.enclosure.link;
  }
  const html = item?.description || item?.content || "";
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] || null;
}

function normalizeItem(item, feedMeta, categoryId) {
  const title = item?.title?.trim() || "Untitled";
  const description = stripHtml(item?.description || item?.content || "").slice(0, 280);
  const url = item?.link || item?.guid || "#";
  const publishedAt = item?.pubDate ? new Date(item.pubDate).toISOString() : null;

  return {
    id: url || `${feedMeta.id}-${title}`,
    title,
    description,
    image: extractImage(item),
    source: feedMeta.name,
    feedId: feedMeta.id,
    publishedAt,
    time: formatTimeAgo(item?.pubDate),
    url,
    category: categoryId,
    sentiment: inferSentiment(title, description),
  };
}

function dedupeArticles(articles) {
  const seen = new Set();
  return articles.filter((a) => {
    const key = (a.url || a.title).toLowerCase().replace(/\s+/g, " ");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function matchesCategory(article, categoryId) {
  if (categoryId === "all") return true;
  const text = `${article.title} ${article.description}`.toLowerCase();
  const keywords = CATEGORY_KEYWORDS[categoryId] || [];
  if (keywords.some((w) => text.includes(w))) return true;
  const feed = RSS_FEEDS.find((f) => f.id === article.feedId);
  return feed?.categories?.includes(categoryId) ?? false;
}

function matchesSearch(article, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  const hay = `${article.title} ${article.description} ${article.source}`.toLowerCase();
  return hay.includes(q);
}

function getFeedsForCategory(categoryId) {
  if (categoryId === "all") return RSS_FEEDS;
  return RSS_FEEDS.filter((f) => f.categories.includes(categoryId));
}

async function fetchFeed(feed) {
  const params = new URLSearchParams({ rss_url: feed.url });
  const apiKey = getOptionalApiKey();
  if (apiKey) params.set("api_key", apiKey);

  const res = await fetch(`${RSS2JSON_BASE}?${params.toString()}`);
  const data = await res.json().catch(() => ({}));

  if (!res.ok || data?.status === "error") {
    throw new Error(data?.message || `Failed to load ${feed.name}`);
  }

  return (data?.items || []).map((item) =>
    normalizeItem(item, { id: feed.id, name: feed.name }, "all")
  );
}

/**
 * Fetch and aggregate live news from free RSS feeds.
 * @param {{ categoryId?: string, searchQuery?: string, max?: number, force?: boolean }} options
 */
export async function fetchLiveNews(options = {}) {
  const categoryId = options.categoryId || "all";
  const searchQuery = (options.searchQuery || "").trim();
  const max = Math.min(Math.max(options.max ?? 40, 1), 60);
  const key = cacheKey(categoryId, searchQuery);

  if (!options.force) {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.fetchedAt < CACHE_TTL_MS) {
      return { articles: hit.articles.slice(0, max), cached: true, fetchedAt: new Date(hit.fetchedAt).toISOString() };
    }
  }

  const feeds = getFeedsForCategory(categoryId);
  const results = await Promise.allSettled(feeds.map((feed) => fetchFeed(feed)));

  let articles = [];
  const errors = [];

  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      articles = articles.concat(result.value);
    } else {
      errors.push(feeds[i]?.name || "Unknown feed");
    }
  });

  if (!articles.length && errors.length) {
    throw new Error(
      `Unable to load news (${errors.slice(0, 3).join(", ")}). Try again or check your connection.`
    );
  }

  articles = dedupeArticles(articles)
    .filter((a) => matchesCategory(a, categoryId))
    .filter((a) => matchesSearch(a, searchQuery))
    .sort((a, b) => {
      const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return tb - ta;
    })
    .map((a) => ({ ...a, category: categoryId }));

  cache.set(key, { articles, fetchedAt: Date.now() });

  return {
    articles: articles.slice(0, max),
    cached: false,
    fetchedAt: new Date().toISOString(),
    failedFeeds: errors,
  };
}

export function clearNewsCache() {
  cache.clear();
}
