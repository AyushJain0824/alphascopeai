// Ticker tape — moved from AlphaScopeAI.jsx
import React from "react";
import Icon from "../common/Icon.jsx";
import { fmtPct, colorChg, currencySymbol, fmtPrice } from "../../utils/formatters.js";

export default function TickerTape({ stocks }) {
  if (!stocks?.length) {
    return (
      <div style={{ background:"var(--bg2)", borderBottom:"1px solid var(--border)", padding:"12px 16px", textAlign:"center", color:"var(--muted)", fontSize:12 }}>
        No stocks match your search — clear the search box to see the full ticker.
      </div>
    );
  }
  const items = [...stocks, ...stocks];
  return (
    <div style={{ background:"var(--bg2)", borderBottom:"1px solid var(--border)", padding:"8px 0", overflow:"hidden" }}>
      <div style={{ display:"inline-flex", gap:32, animation:"ticker 50s linear infinite", whiteSpace:"nowrap" }}>
        {items.map((s, i) => (
          <span key={i} style={{ fontSize:12, fontFamily:"var(--font-mono)", display:"inline-flex", alignItems:"center", gap:8 }}>
            <span style={{ color:"var(--text)", fontWeight:600 }}>{s.symbol}</span>
            <span style={{ color:colorChg(s.chg) }}>{currencySymbol(s.market)}{fmtPrice(s)}</span>
            <span style={{ color:colorChg(s.chg) }}>{fmtPct(s.chg)}</span>
          </span>
        ))}
      </div>
    </div>
  );
};
