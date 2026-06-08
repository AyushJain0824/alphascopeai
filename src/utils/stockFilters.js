// Stock search, category & sort filters

const chgSort = (a, b, dir = -1) => {
  const av = a.chg ?? (dir < 0 ? -Infinity : Infinity);
  const bv = b.chg ?? (dir < 0 ? -Infinity : Infinity);
  return dir * (av - bv);
};

const CATEGORY_SECTORS = {
  banking: ["Banking", "NBFC"],
  it: ["IT"],
  energy: ["Energy", "Power", "Mining"],
  pharma: ["Pharma", "Healthcare"],
  auto: ["Auto"],
  fmcg: ["FMCG", "Consumer"],
};

export function filterStocksByQuery(stocks, rawQuery) {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return stocks;
  return stocks.filter((s) => {
    const hay = `${s.symbol} ${s.name} ${s.sector}`.toLowerCase();
    return hay.includes(q);
  });
}

export function filterStocksByCategory(stocks, category) {
  if (!category || category === "all") return stocks;
  if (category === "trending") {
    return [...stocks]
      .sort(
        (a, b) =>
          Math.abs(b.chg ?? 0) - Math.abs(a.chg ?? 0) ||
          (b.volumeRaw ?? 0) - (a.volumeRaw ?? 0)
      )
      .slice(0, 40);
  }
  const sectors = CATEGORY_SECTORS[category];
  if (sectors) return stocks.filter((s) => sectors.includes(s.sector));
  return stocks;
}

export function sortStocks(stocks, mode) {
  const list = [...stocks];
  switch (mode) {
    case "losers":
      return list.sort((a, b) => chgSort(a, b, 1));
    case "volume":
      return list.sort((a, b) => (b.volumeRaw ?? 0) - (a.volumeRaw ?? 0));
    case "score":
      return list.sort((a, b) => b.score - a.score);
    case "gainers":
    default:
      return list.sort((a, b) => chgSort(a, b, -1));
  }
}
