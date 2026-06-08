/**
 * 100+ NSE equities — live prices via Yahoo Finance (.NS symbols).
 * Fields: symbol, name, sector, market (IN), yahoo ticker.
 */

function hashSymbol(sym) {
  let h = 0;
  for (let i = 0; i < sym.length; i++) h = (h * 31 + sym.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pick(h, arr) {
  return arr[h % arr.length];
}

/** Deterministic seed metrics for screener / AI UI when Yahoo omits fundamentals. */
export function buildSeedStock(def, id) {
  const h = hashSymbol(def.symbol);
  const score = 52 + (h % 38);
  const pe = +(8 + (h % 55) + (h % 7) / 10).toFixed(1);
  const rsi = 28 + (h % 50);
  const chg = null;
  const signal = score >= 78 ? "BUY" : score >= 62 ? "HOLD" : "HOLD";
  const fundScore = Math.min(98, score + (h % 12) - 6);
  const techScore = Math.min(98, score + ((h >> 3) % 14) - 7);
  const sentScore = Math.min(98, score + ((h >> 5) % 10) - 4);
  const instScore = Math.min(98, score + ((h >> 7) % 16) - 5);
  return {
    id,
    symbol: def.symbol,
    name: def.name,
    sector: def.sector,
    market: "IN",
    yahoo: def.yahoo,
    price: 0,
    chg,
    vol: "—",
    volumeRaw: 0,
    mktcap: "—",
    mktcapRaw: 0,
    pe,
    pb: +(1.2 + (h % 18)).toFixed(1),
    roe: +(8 + (h % 42)).toFixed(1),
    roce: +(6 + (h % 38)).toFixed(1),
    eps: +(10 + (h % 400)).toFixed(1),
    div: +((h % 40) / 10).toFixed(1),
    rsi,
    macd: h % 2 === 0 ? "+ve" : "-ve",
    deb: +((h % 15) / 10).toFixed(1),
    promo: +(h % 75),
    fii: +(h % 48),
    qtrGrowth: +(2 + (h % 38)).toFixed(1),
    score,
    fundScore,
    techScore,
    sentScore,
    instScore,
    risk: pick(h, ["Low", "Medium", "High"]),
    signal,
    conf: Math.min(92, score + (h % 8)),
    live: false,
  };
}

/** Optional screener hints only — no static prices (live Yahoo only). */
const LEGACY_IN = {
  RELIANCE: { pe: 26.4, score: 82, signal: "BUY", conf: 79 },
  TCS: { pe: 29.8, score: 88, signal: "BUY", conf: 84 },
  HDFCBANK: { pe: 18.2, score: 80, signal: "HOLD", conf: 66 },
  INFY: { pe: 24.1, score: 85, signal: "BUY", conf: 82 },
  ICICIBANK: { pe: 17.4, score: 83, signal: "BUY", conf: 80 },
  WIPRO: { pe: 19.8, score: 62, signal: "HOLD", conf: 55 },
  BAJFINANCE: { pe: 34.2, score: 79, signal: "BUY", conf: 75 },
  HINDUNILVR: { pe: 56.4, score: 70, signal: "HOLD", conf: 62 },
  TATAMOTORS: { pe: 8.9, score: 77, signal: "BUY", conf: 74 },
  SUNPHARMA: { pe: 35.1, score: 76, signal: "BUY", conf: 71 },
};

export const STOCK_DEFINITIONS = [
  // —— Energy & resources ——
  { symbol: "RELIANCE", name: "Reliance Industries", sector: "Energy", yahoo: "RELIANCE.NS" },
  { symbol: "ONGC", name: "Oil & Natural Gas Corp", sector: "Energy", yahoo: "ONGC.NS" },
  { symbol: "BPCL", name: "Bharat Petroleum", sector: "Energy", yahoo: "BPCL.NS" },
  { symbol: "HINDPETRO", name: "Hindustan Petroleum", sector: "Energy", yahoo: "HINDPETRO.NS" },
  { symbol: "IOC", name: "Indian Oil Corp", sector: "Energy", yahoo: "IOC.NS" },
  { symbol: "GAIL", name: "GAIL India", sector: "Energy", yahoo: "GAIL.NS" },
  { symbol: "COALINDIA", name: "Coal India", sector: "Mining", yahoo: "COALINDIA.NS" },
  { symbol: "VEDL", name: "Vedanta Ltd", sector: "Metals", yahoo: "VEDL.NS" },
  // —— Power ——
  { symbol: "NTPC", name: "NTPC", sector: "Power", yahoo: "NTPC.NS" },
  { symbol: "POWERGRID", name: "Power Grid Corp", sector: "Power", yahoo: "POWERGRID.NS" },
  { symbol: "TATAPOWER", name: "Tata Power", sector: "Power", yahoo: "TATAPOWER.NS" },
  { symbol: "ADANIGREEN", name: "Adani Green Energy", sector: "Power", yahoo: "ADANIGREEN.NS" },
  { symbol: "JSWENERGY", name: "JSW Energy", sector: "Power", yahoo: "JSWENERGY.NS" },
  { symbol: "NHPC", name: "NHPC", sector: "Power", yahoo: "NHPC.NS" },
  { symbol: "RECLTD", name: "REC Ltd", sector: "Power", yahoo: "RECLTD.NS" },
  { symbol: "PFC", name: "Power Finance Corp", sector: "Power", yahoo: "PFC.NS" },
  // —— Banking ——
  { symbol: "HDFCBANK", name: "HDFC Bank", sector: "Banking", yahoo: "HDFCBANK.NS" },
  { symbol: "ICICIBANK", name: "ICICI Bank", sector: "Banking", yahoo: "ICICIBANK.NS" },
  { symbol: "SBIN", name: "State Bank of India", sector: "Banking", yahoo: "SBIN.NS" },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", sector: "Banking", yahoo: "KOTAKBANK.NS" },
  { symbol: "AXISBANK", name: "Axis Bank", sector: "Banking", yahoo: "AXISBANK.NS" },
  { symbol: "INDUSINDBK", name: "IndusInd Bank", sector: "Banking", yahoo: "INDUSINDBK.NS" },
  { symbol: "BANKBARODA", name: "Bank of Baroda", sector: "Banking", yahoo: "BANKBARODA.NS" },
  { symbol: "PNB", name: "Punjab National Bank", sector: "Banking", yahoo: "PNB.NS" },
  { symbol: "CANBK", name: "Canara Bank", sector: "Banking", yahoo: "CANBK.NS" },
  { symbol: "FEDERALBNK", name: "Federal Bank", sector: "Banking", yahoo: "FEDERALBNK.NS" },
  { symbol: "IDFCFIRSTB", name: "IDFC First Bank", sector: "Banking", yahoo: "IDFCFIRSTB.NS" },
  { symbol: "YESBANK", name: "Yes Bank", sector: "Banking", yahoo: "YESBANK.NS" },
  { symbol: "BANDHANBNK", name: "Bandhan Bank", sector: "Banking", yahoo: "BANDHANBNK.NS" },
  { symbol: "AUBANK", name: "AU Small Finance Bank", sector: "Banking", yahoo: "AUBANK.NS" },
  { symbol: "UNIONBANK", name: "Union Bank of India", sector: "Banking", yahoo: "UNIONBANK.NS" },
  // —— NBFC & insurance ——
  { symbol: "BAJFINANCE", name: "Bajaj Finance", sector: "NBFC", yahoo: "BAJFINANCE.NS" },
  { symbol: "BAJAJFINSV", name: "Bajaj Finserv", sector: "NBFC", yahoo: "BAJAJFINSV.NS" },
  { symbol: "SHRIRAMFIN", name: "Shriram Finance", sector: "NBFC", yahoo: "SHRIRAMFIN.NS" },
  { symbol: "CHOLAFIN", name: "Cholamandalam Investment", sector: "NBFC", yahoo: "CHOLAFIN.NS" },
  { symbol: "HDFCLIFE", name: "HDFC Life Insurance", sector: "NBFC", yahoo: "HDFCLIFE.NS" },
  { symbol: "ICICIPRULI", name: "ICICI Prudential Life", sector: "NBFC", yahoo: "ICICIPRULI.NS" },
  { symbol: "SBILIFE", name: "SBI Life Insurance", sector: "NBFC", yahoo: "SBILIFE.NS" },
  { symbol: "LICI", name: "Life Insurance Corp", sector: "NBFC", yahoo: "LICI.NS" },
  { symbol: "ICICIGI", name: "ICICI Lombard GIC", sector: "NBFC", yahoo: "ICICIGI.NS" },
  { symbol: "IRFC", name: "Indian Railway Finance", sector: "NBFC", yahoo: "IRFC.NS" },
  { symbol: "HUDCO", name: "HUDCO", sector: "NBFC", yahoo: "HUDCO.NS" },
  // —— IT ——
  { symbol: "TCS", name: "Tata Consultancy Svcs", sector: "IT", yahoo: "TCS.NS" },
  { symbol: "INFY", name: "Infosys", sector: "IT", yahoo: "INFY.NS" },
  { symbol: "WIPRO", name: "Wipro", sector: "IT", yahoo: "WIPRO.NS" },
  { symbol: "LTIM", name: "LTIMindtree", sector: "IT", yahoo: "LTM.NS" },
  { symbol: "HCLTECH", name: "HCL Technologies", sector: "IT", yahoo: "HCLTECH.NS" },
  { symbol: "TECHM", name: "Tech Mahindra", sector: "IT", yahoo: "TECHM.NS" },
  { symbol: "PERSISTENT", name: "Persistent Systems", sector: "IT", yahoo: "PERSISTENT.NS" },
  { symbol: "COFORGE", name: "Coforge", sector: "IT", yahoo: "COFORGE.NS" },
  { symbol: "MPHASIS", name: "Mphasis", sector: "IT", yahoo: "MPHASIS.NS" },
  { symbol: "TATAELXSI", name: "Tata Elxsi", sector: "IT", yahoo: "TATAELXSI.NS" },
  { symbol: "KPITTECH", name: "KPIT Technologies", sector: "IT", yahoo: "KPITTECH.NS" },
  // —— Pharma & healthcare ——
  { symbol: "SUNPHARMA", name: "Sun Pharmaceutical", sector: "Pharma", yahoo: "SUNPHARMA.NS" },
  { symbol: "DRREDDY", name: "Dr Reddy's Labs", sector: "Pharma", yahoo: "DRREDDY.NS" },
  { symbol: "CIPLA", name: "Cipla", sector: "Pharma", yahoo: "CIPLA.NS" },
  { symbol: "DIVISLAB", name: "Divi's Laboratories", sector: "Pharma", yahoo: "DIVISLAB.NS" },
  { symbol: "LUPIN", name: "Lupin", sector: "Pharma", yahoo: "LUPIN.NS" },
  { symbol: "AUROPHARMA", name: "Aurobindo Pharma", sector: "Pharma", yahoo: "AUROPHARMA.NS" },
  { symbol: "BIOCON", name: "Biocon", sector: "Pharma", yahoo: "BIOCON.NS" },
  { symbol: "TORNTPHARM", name: "Torrent Pharmaceuticals", sector: "Pharma", yahoo: "TORNTPHARM.NS" },
  { symbol: "ALKEM", name: "Alkem Laboratories", sector: "Pharma", yahoo: "ALKEM.NS" },
  { symbol: "MANKIND", name: "Mankind Pharma", sector: "Pharma", yahoo: "MANKIND.NS" },
  { symbol: "APOLLOHOSP", name: "Apollo Hospitals", sector: "Healthcare", yahoo: "APOLLOHOSP.NS" },
  // —— Auto ——
  { symbol: "TATAMOTORS", name: "Tata Motors", sector: "Auto", yahoo: "TMPV.NS" },
  { symbol: "MARUTI", name: "Maruti Suzuki India", sector: "Auto", yahoo: "MARUTI.NS" },
  { symbol: "M&M", name: "Mahindra & Mahindra", sector: "Auto", yahoo: "M&M.NS" },
  { symbol: "EICHERMOT", name: "Eicher Motors", sector: "Auto", yahoo: "EICHERMOT.NS" },
  { symbol: "HEROMOTOCO", name: "Hero MotoCorp", sector: "Auto", yahoo: "HEROMOTOCO.NS" },
  { symbol: "BAJAJ-AUTO", name: "Bajaj Auto", sector: "Auto", yahoo: "BAJAJ-AUTO.NS" },
  { symbol: "TVSMOTOR", name: "TVS Motor Company", sector: "Auto", yahoo: "TVSMOTOR.NS" },
  { symbol: "BHARATFORG", name: "Bharat Forge", sector: "Auto", yahoo: "BHARATFORG.NS" },
  { symbol: "MOTHERSON", name: "Samvardhana Motherson", sector: "Auto", yahoo: "MOTHERSON.NS" },
  { symbol: "ESCORTS", name: "Escorts Kubota", sector: "Auto", yahoo: "ESCORTS.NS" },
  { symbol: "BOSCHLTD", name: "Bosch", sector: "Auto", yahoo: "BOSCHLTD.NS" },
  { symbol: "MRF", name: "MRF", sector: "Auto", yahoo: "MRF.NS" },
  // —— FMCG & consumer ——
  { symbol: "HINDUNILVR", name: "Hindustan Unilever", sector: "FMCG", yahoo: "HINDUNILVR.NS" },
  { symbol: "NESTLEIND", name: "Nestle India", sector: "FMCG", yahoo: "NESTLEIND.NS" },
  { symbol: "ITC", name: "ITC Limited", sector: "FMCG", yahoo: "ITC.NS" },
  { symbol: "BRITANNIA", name: "Britannia Industries", sector: "FMCG", yahoo: "BRITANNIA.NS" },
  { symbol: "DABUR", name: "Dabur India", sector: "FMCG", yahoo: "DABUR.NS" },
  { symbol: "MARICO", name: "Marico", sector: "FMCG", yahoo: "MARICO.NS" },
  { symbol: "COLPAL", name: "Colgate-Palmolive India", sector: "FMCG", yahoo: "COLPAL.NS" },
  { symbol: "GODREJCP", name: "Godrej Consumer Products", sector: "FMCG", yahoo: "GODREJCP.NS" },
  { symbol: "TATACONSUM", name: "Tata Consumer Products", sector: "FMCG", yahoo: "TATACONSUM.NS" },
  { symbol: "JUBLFOOD", name: "Jubilant Foodworks", sector: "FMCG", yahoo: "JUBLFOOD.NS" },
  { symbol: "TRENT", name: "Trent", sector: "Consumer", yahoo: "TRENT.NS" },
  { symbol: "DMART", name: "Avenue Supermarts", sector: "Consumer", yahoo: "DMART.NS" },
  { symbol: "ASIANPAINT", name: "Asian Paints", sector: "Consumer", yahoo: "ASIANPAINT.NS" },
  { symbol: "TITAN", name: "Titan Company", sector: "Consumer", yahoo: "TITAN.NS" },
  { symbol: "BERGEPAINT", name: "Berger Paints", sector: "Consumer", yahoo: "BERGEPAINT.NS" },
  { symbol: "PGHH", name: "Procter & Gamble Hygiene", sector: "Consumer", yahoo: "PGHH.NS" },
  { symbol: "ZOMATO", name: "Zomato (Eternal)", sector: "Consumer", yahoo: "ETERNAL.NS" },
  { symbol: "NYKAA", name: "FSN E-Commerce (Nykaa)", sector: "Consumer", yahoo: "NYKAA.NS" },
  { symbol: "PAYTM", name: "One 97 Communications", sector: "Consumer", yahoo: "PAYTM.NS" },
  { symbol: "NAUKRI", name: "Info Edge (Naukri)", sector: "Consumer", yahoo: "NAUKRI.NS" },
  // —— Metals ——
  { symbol: "JSWSTEEL", name: "JSW Steel", sector: "Metals", yahoo: "JSWSTEEL.NS" },
  { symbol: "TATASTEEL", name: "Tata Steel", sector: "Metals", yahoo: "TATASTEEL.NS" },
  { symbol: "HINDALCO", name: "Hindalco Industries", sector: "Metals", yahoo: "HINDALCO.NS" },
  { symbol: "JINDALSTEL", name: "Jindal Steel & Power", sector: "Metals", yahoo: "JINDALSTEL.NS" },
  { symbol: "SAIL", name: "Steel Authority of India", sector: "Metals", yahoo: "SAIL.NS" },
  { symbol: "NATIONALUM", name: "NALCO", sector: "Metals", yahoo: "NATIONALUM.NS" },
  { symbol: "HINDZINC", name: "Hindustan Zinc", sector: "Metals", yahoo: "HINDZINC.NS" },
  // —— Infrastructure, cement & realty ——
  { symbol: "LT", name: "Larsen & Toubro", sector: "Infrastructure", yahoo: "LT.NS" },
  { symbol: "ADANIPORTS", name: "Adani Ports & SEZ", sector: "Infrastructure", yahoo: "ADANIPORTS.NS" },
  { symbol: "ADANIENT", name: "Adani Enterprises", sector: "Infrastructure", yahoo: "ADANIENT.NS" },
  { symbol: "ADANIENSOL", name: "Adani Energy Solutions", sector: "Infrastructure", yahoo: "ADANIENSOL.NS" },
  { symbol: "ULTRACEMCO", name: "UltraTech Cement", sector: "Cement", yahoo: "ULTRACEMCO.NS" },
  { symbol: "GRASIM", name: "Grasim Industries", sector: "Cement", yahoo: "GRASIM.NS" },
  { symbol: "AMBUJACEM", name: "Ambuja Cements", sector: "Cement", yahoo: "AMBUJACEM.NS" },
  { symbol: "SHREECEM", name: "Shree Cement", sector: "Cement", yahoo: "SHREECEM.NS" },
  { symbol: "DLF", name: "DLF", sector: "Infrastructure", yahoo: "DLF.NS" },
  { symbol: "GODREJPROP", name: "Godrej Properties", sector: "Infrastructure", yahoo: "GODREJPROP.NS" },
  { symbol: "OBEROIRLTY", name: "Oberoi Realty", sector: "Infrastructure", yahoo: "OBEROIRLTY.NS" },
  { symbol: "CONCOR", name: "Container Corp of India", sector: "Infrastructure", yahoo: "CONCOR.NS" },
  // —— Telecom ——
  { symbol: "BHARTIARTL", name: "Bharti Airtel", sector: "Telecom", yahoo: "BHARTIARTL.NS" },
  { symbol: "INDUSTOWER", name: "Indus Towers", sector: "Telecom", yahoo: "INDUSTOWER.NS" },
  // —— Chemicals & industrials ——
  { symbol: "PIDILITIND", name: "Pidilite Industries", sector: "Chemicals", yahoo: "PIDILITIND.NS" },
  { symbol: "UPL", name: "UPL", sector: "Chemicals", yahoo: "UPL.NS" },
  { symbol: "SRF", name: "SRF", sector: "Chemicals", yahoo: "SRF.NS" },
  { symbol: "TATACHEM", name: "Tata Chemicals", sector: "Chemicals", yahoo: "TATACHEM.NS" },
  { symbol: "SIEMENS", name: "Siemens", sector: "Industrials", yahoo: "SIEMENS.NS" },
  { symbol: "ABB", name: "ABB India", sector: "Industrials", yahoo: "ABB.NS" },
  { symbol: "HAVELLS", name: "Havells India", sector: "Industrials", yahoo: "HAVELLS.NS" },
  { symbol: "VOLTAS", name: "Voltas", sector: "Industrials", yahoo: "VOLTAS.NS" },
  { symbol: "POLYCAB", name: "Polycab India", sector: "Industrials", yahoo: "POLYCAB.NS" },
  { symbol: "CGPOWER", name: "CG Power & Industrial", sector: "Industrials", yahoo: "CGPOWER.NS" },
  { symbol: "DIXON", name: "Dixon Technologies", sector: "Industrials", yahoo: "DIXON.NS" },
  { symbol: "CUMMINSIND", name: "Cummins India", sector: "Industrials", yahoo: "CUMMINSIND.NS" },
  { symbol: "PAGEIND", name: "Page Industries", sector: "Industrials", yahoo: "PAGEIND.NS" },
  // —— Defence & services ——
  { symbol: "HAL", name: "Hindustan Aeronautics", sector: "Defence", yahoo: "HAL.NS" },
  { symbol: "BEL", name: "Bharat Electronics", sector: "Defence", yahoo: "BEL.NS" },
  { symbol: "IRCTC", name: "IRCTC", sector: "Services", yahoo: "IRCTC.NS" },
  { symbol: "INDIGO", name: "InterGlobe Aviation", sector: "Services", yahoo: "INDIGO.NS" },
];

export function getYahooSymbol(stock) {
  return stock?.yahoo || `${stock?.symbol}.NS`;
}

export const STOCKS = STOCK_DEFINITIONS.map((def, i) => {
  const base = buildSeedStock(def, i + 1);
  const legacy = LEGACY_IN[def.symbol];
  if (legacy) return { ...base, ...legacy, mktcap: base.mktcap };
  return base;
});

export const STOCK_COUNT = STOCKS.length;
