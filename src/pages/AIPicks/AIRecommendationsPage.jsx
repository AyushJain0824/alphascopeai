import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell
} from "recharts";
import { useTheme } from "../../hooks/useTheme.js";
import Icon from "../../components/common/Icon.jsx";
import ScoreRing from "../../components/ui/ScoreRing.jsx";
import Sparkline from "../../components/ui/Sparkline.jsx";
import CustomTooltip from "../../components/ui/CustomTooltip.jsx";
import ScoreBar from "../../components/ui/ScoreBar.jsx";
import { fmt, fmtPct, colorChg, scoreColor, signalBadge } from "../../utils/formatters.js";
import { callAI } from "../../features/ai/utils/callAI.js";
export default function AIRecommendationsPage({ stocks, onSelectStock, listMeta }) {
  const [loading, setLoading] = useState(false);
  const [recs, setRecs] = useState(null);
  const [category, setCategory] = useState("all");

  const topPicks = useMemo(
    () => stocks.filter(s => s.signal === "BUY" && s.score >= 74).sort((a,b) => b.score - a.score),
    [stocks]
  );

  // FIX 4 (useEffect deps): loadRecs defined with useCallback so the dependency
  // array is stable — previously passing a plain async function reference caused
  // the effect to skip running if deps weren't listed correctly.
  const loadRecs = useCallback(async () => {
    setLoading(true);
    try {
      const ctx = topPicks.slice(0,8).map(s =>
        `${s.symbol}: Score=${s.score}, PE=${s.pe}, ROE=${s.roe}%, RSI=${s.rsi}, QtrGrowth=${s.qtrGrowth}%, Sector=${s.sector}`
      ).join("\n");
      const txt = await callAI(
        `Based on current Indian market data, provide top investment recommendations:\n${ctx}\n\nFor each stock provide: entry zone, stop loss, 3-month target, risk level, and one-line thesis. Format clearly. Also mention overall market outlook.`,
        "You are AlphaScope AI's chief investment strategist. Provide specific, actionable recommendations for Indian retail investors. Include specific price levels."
      );
      setRecs(txt);
    } catch { setRecs("Unable to load AI recommendations. Please try again."); }
    setLoading(false);
  }, [topPicks]);

  // FIX 4: Empty deps array is intentional here (load once on mount).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadRecs(); }, []);

  const categories = [
    { key:"all",       label:"All Picks",   icon:"⭐" },
    { key:"longterm",  label:"Long Term",   icon:"📈" },
    { key:"swing",     label:"Swing Trade", icon:"🔄" },
    { key:"momentum",  label:"Momentum",    icon:"🚀" },
    { key:"value",     label:"Value Picks", icon:"💎" },
  ];

  const categoryMap = {
    all:      topPicks,
    longterm: topPicks.filter(s => s.pe > 15 && s.roe > 15),
    swing:    topPicks.filter(s => s.rsi > 55 && s.rsi < 72),
    momentum: topPicks.filter(s => s.rsi > 60 && s.techScore > 70),
    value:    topPicks.filter(s => s.pe < 22 && s.roe > 14),
  };

  const displayStocks = categoryMap[category] || topPicks;

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontFamily:"var(--font-head)", fontSize:26, fontWeight:700, marginBottom:6 }}>
          <span className="gradient-text">AI Investment Recommendations</span>
        </h1>
        <p style={{ color:"var(--muted)" }}>Powered by AlphaScope AI · Updated {new Date().toLocaleTimeString("en-IN")}</p>
        {listMeta?.query?.trim() ? (
          <p style={{ fontSize:12, color:"var(--muted)", marginTop:4 }}>
            Search active: {listMeta.shown} of {listMeta.total} stocks
          </p>
        ) : null}
      </div>

      {/* Category Tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:24, flexWrap:"wrap" }}>
        {categories.map(c => (
          <button key={c.key} className={`btn ${category===c.key?"btn-primary":"btn-ghost"}`}
            style={{ gap:6 }} onClick={()=>setCategory(c.key)}>
            <span>{c.icon}</span> {c.label}
            <span style={{ fontSize:11, opacity:0.7 }}>({categoryMap[c.key].length})</span>
          </button>
        ))}
      </div>

      {/* Stock Cards */}
      <div className="grid-auto" style={{ marginBottom:28 }}>
        {displayStocks.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
            className="glass glass-hover" style={{ padding:20, cursor:"pointer" }} onClick={()=>onSelectStock(s)}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
              <div>
                <div style={{ fontFamily:"var(--font-mono)", fontWeight:700, fontSize:15, color:"var(--accent)", marginBottom:3 }}>{s.symbol}</div>
                <div style={{ fontSize:12, color:"var(--muted)" }}>{s.name}</div>
                <span className="tag" style={{ marginTop:5, display:"inline-block" }}>{s.sector}</span>
              </div>
              <ScoreRing score={s.score} size={64} strokeW={5}/>
            </div>

            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
              <div>
                <div style={{ fontSize:18, fontFamily:"var(--font-mono)", fontWeight:700 }}>₹{fmt(s.price)}</div>
                <div style={{ fontSize:12, color:colorChg(s.chg), fontFamily:"var(--font-mono)" }}>{fmtPct(s.chg)}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <span className={`badge ${signalBadge(s.signal)}`} style={{ display:"block", marginBottom:4, textAlign:"center" }}>{s.signal}</span>
                <span style={{ fontSize:11, color:"var(--muted)" }}>Conf: {s.conf}%</span>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
              {[
                ["Entry Zone", `₹${fmt(s.price*0.97)} – ₹${fmt(s.price*1.01)}`],
                ["Stop Loss",  `₹${fmt(s.price*0.91)}`],
                ["Target 1",   `₹${fmt(s.price*1.10)}`],
                ["Target 2",   `₹${fmt(s.price*1.20)}`],
              ].map(([k,v]) => (
                <div key={k} style={{ padding:"6px 10px", borderRadius:6, background:"var(--surface)", border:"1px solid var(--border)" }}>
                  <div style={{ fontSize:10, color:"var(--muted)", marginBottom:2 }}>{k}</div>
                  <div style={{ fontSize:12, fontFamily:"var(--font-mono)", fontWeight:600 }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              <span className="badge badge-blue">RSI {s.rsi}</span>
              <span className="badge badge-purple">PE {s.pe}</span>
              <span className={`badge ${s.risk==="Low"?"badge-green":s.risk==="High"?"badge-red":"badge-yellow"}`}>{s.risk} Risk</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* AI Market Analysis */}
      <div className="glass" style={{ padding:24, border:"1px solid rgba(0,212,255,0.15)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Icon name="brain" size={20} color="var(--accent)"/>
            <h3 style={{ fontFamily:"var(--font-head)", fontSize:17, fontWeight:600 }}>AlphaScope AI — Market Intelligence</h3>
          </div>
          <button className="btn btn-ghost" style={{ fontSize:12 }} onClick={loadRecs} disabled={loading}>
            <Icon name="refresh" size={12}/> Refresh
          </button>
        </div>
        {loading ? (
          <div style={{ textAlign:"center", padding:30 }}>
            <div className="spinner" style={{ margin:"0 auto 12px" }}/>
            <div style={{ color:"var(--muted)" }}>Generating AI market intelligence...</div>
          </div>
        ) : (
          <div style={{ fontSize:13, lineHeight:1.9, whiteSpace:"pre-wrap", color:"var(--text)" }}>
            {recs || "Click Refresh to load AI market intelligence."}
          </div>
        )}
      </div>
    </div>
  );
};
