// Formatting helpers — moved from AlphaScopeAI.jsx
export function formatIndianVolume(n) {
  if (n == null || !Number.isFinite(n) || n <= 0) return "—";
  const cr = n / 1e7;
  if (cr >= 0.01) return `${cr.toFixed(2)}Cr`;
  const L = n / 1e5;
  if (L >= 0.01) return `${L.toFixed(2)}L`;
  const M = n / 1e6;
  if (M >= 0.01) return `${M.toFixed(1)}M`;
  const K = n / 1e3;
  if (K >= 1) return `${K.toFixed(1)}K`;
  return String(Math.round(n));
}

export function formatUsVolume(n) {
  if (n == null || !Number.isFinite(n) || n <= 0) return "—";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(Math.round(n));
}

export function formatVolume(n, _market) {
  return formatIndianVolume(n);
}

export function currencySymbol(_market) {
  return "₹";
}

export function formatMarketCap(n, _market) {
  if (n == null || !Number.isFinite(n) || n <= 0) return "—";
  const cr = n / 1e7;
  if (cr >= 100) return `${(cr / 100).toFixed(1)}L Cr`;
  if (cr >= 1) return `${cr.toFixed(1)} Cr`;
  return formatIndianVolume(n);
}

export const fmt = (n, dec = 2, locale = "en-IN") =>
  n?.toLocaleString(locale, { minimumFractionDigits: dec, maximumFractionDigits: dec });

export function fmtPrice(stock, dec = 2) {
  if (!stock || stock.price == null || !Number.isFinite(stock.price)) return "—";
  const p = fmt(stock.price, dec, "en-IN");
  return stock.quoteStale ? `${p}*` : p;
}

export const fmtPct = (n) => {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n >= 0 ? "+" : ""}${fmt(n)}%`;
};

export function fmtVol(stock) {
  if (!stock) return "—";
  if (!stock.live && !stock.quoteStale) return "—";
  return stock.vol ?? "—";
}

export const colorChg = (v) =>
  v == null || !Number.isFinite(v) ? "var(--muted)" : v >= 0 ? "var(--green)" : "var(--red)";
export const scoreColor = (s) =>
  s >= 80 ? "var(--green)" : s >= 65 ? "var(--yellow)" : s >= 50 ? "var(--orange)" : "var(--red)";
export const signalBadge = (s) => (s === "BUY" ? "badge-green" : s === "SELL" ? "badge-red" : "badge-yellow");
