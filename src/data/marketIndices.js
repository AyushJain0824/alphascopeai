// Index definitions — moved from AlphaScopeAI.jsx
export const DEFAULT_INDICES = [
  { name:"NIFTY 50",   value:"—", chg:"—", chgPts:"—", color:"var(--muted)" },
  { name:"SENSEX",     value:"—", chg:"—", chgPts:"—", color:"var(--muted)" },
  { name:"BANK NIFTY", value:"—", chg:"—", chgPts:"—", color:"var(--muted)" },
  { name:"NIFTY IT",   value:"—", chg:"—", chgPts:"—", color:"var(--muted)" },
  { name:"NIFTY MID",  value:"—", chg:"—", chgPts:"—", color:"var(--muted)" },
  { name:"NIFTY SMALL",value:"—", chg:"—", chgPts:"—", color:"var(--muted)" },
];

/** Yahoo symbols for the index row (order matches DEFAULT_INDICES). */
export const INDEX_YAHOO_DEFS = [
  { name: "NIFTY 50",    yahoo: "^NSEI" },
  { name: "SENSEX",      yahoo: "^BSESN" },
  { name: "BANK NIFTY",  yahoo: "^NSEBANK" },
  { name: "NIFTY IT",    yahoo: "^CNXIT" },
  { name: "NIFTY MID",   yahoo: "^NSEMDCP50" },
  { name: "NIFTY SMALL", yahoo: "^CNXSC" },
];
