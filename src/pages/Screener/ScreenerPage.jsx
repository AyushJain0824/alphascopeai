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
export default function ScreenerPage({ stocks, onSelectStock }) {
  const [filters, setFilters] = useState({ minPE:"", maxPE:"", minROE:"", minRSI:"", maxRSI:"", signal:"", sector:"", minScore:"", minMktcap:"" });
  const [results, setResults] = useState(stocks);
  const [preset, setPreset] = useState("");
  const [aiScreening, setAiScreening] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiResults, setAiResults] = useState("");
  const [sortCol, setSortCol] = useState("score");
  const [sortDir, setSortDir] = useState("desc");

  // FIX 3 (Wrong Prices): When the live stocks prop updates, re-run the last
  // applied filter so the results table always shows current prices.
  useEffect(() => {
    setResults(prev => {
      const symbolSet = new Set(prev.map(s => s.symbol));
      return stocks.filter(s => symbolSet.has(s.symbol));
    });
  }, [stocks]);

  const PRESETS = {
    "undervalued": { minROE:"15", maxPE:"20", minScore:"65", signal:"BUY" },
    "momentum":    { minRSI:"60", maxRSI:"75", signal:"BUY", minScore:"70" },
    "value":       { maxPE:"15", minROE:"12", minScore:"60" },
    "growth":      { minROE:"20", minScore:"70", signal:"BUY" },
    "breakout":    { minRSI:"65", minScore:"72", signal:"BUY" },
  };

  const applyPreset = (p) => {
    setPreset(p);
    if (p && PRESETS[p]) setFilters({ ...filters, ...PRESETS[p] });
    else setFilters({ minPE:"", maxPE:"", minROE:"", minRSI:"", maxRSI:"", signal:"", sector:"", minScore:"", minMktcap:"" });
  };

  const runScreen = () => {
    let r = stocks;
    if (filters.minPE)    r = r.filter(s => s.pe >= +filters.minPE);
    if (filters.maxPE)    r = r.filter(s => s.pe <= +filters.maxPE);
    if (filters.minROE)   r = r.filter(s => s.roe >= +filters.minROE);
    if (filters.minRSI)   r = r.filter(s => s.rsi >= +filters.minRSI);
    if (filters.maxRSI)   r = r.filter(s => s.rsi <= +filters.maxRSI);
    if (filters.signal)   r = r.filter(s => s.signal === filters.signal);
    if (filters.sector)   r = r.filter(s => s.sector.toLowerCase().includes(filters.sector.toLowerCase()));
    if (filters.minScore) r = r.filter(s => s.score >= +filters.minScore);
    setResults(r);
  };

  const runAIScreen = async () => {
    if (!aiQuery) return;
    setAiScreening(true);
    try {
      const context = stocks.map(s => `${s.symbol}: PE=${s.pe}, ROE=${s.roe}%, RSI=${s.rsi}, Score=${s.score}, Signal=${s.signal}, Sector=${s.sector}, QtrGrowth=${s.qtrGrowth}%`).join("\n");
      const txt = await callAI(`User query: "${aiQuery}"\n\nAvailable stocks data:\n${context}\n\nBased on the user's criteria, list the top matching stocks with brief reasoning for each. Be specific.`);
      setAiResults(txt);
    } catch { setAiResults("AI screening temporarily unavailable."); }
    setAiScreening(false);
  };

  const sorted = useMemo(() => {
    return [...results].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      if (typeof av === "number") return sortDir === "asc" ? av - bv : bv - av;
      return 0;
    });
  }, [results, sortCol, sortDir]);

  const handleSort = col => {
    if (sortCol === col) setSortDir(d => d==="asc"?"desc":"asc");
    else { setSortCol(col); setSortDir("desc"); }
  };

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontFamily:"var(--font-head)", fontSize:26, fontWeight:700, marginBottom:6 }}>Advanced Stock Screener</h1>
        <p style={{ color:"var(--muted)", fontSize:14 }}>Filter {stocks.length}+ Indian stocks using AI-powered criteria</p>
      </div>

      {/* AI Natural Language Screener */}
      <div className="glass" style={{ padding:20, marginBottom:20, border:"1px solid rgba(0,212,255,0.2)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
          <Icon name="brain" size={18} color="var(--accent)"/>
          <h3 style={{ fontFamily:"var(--font-head)", fontSize:16, fontWeight:600 }}>AI Natural Language Screener</h3>
          <span className="badge badge-purple">BETA</span>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <input placeholder='e.g. "Find undervalued IT stocks with PE under 25 and ROE above 20%"'
            value={aiQuery} onChange={e=>setAiQuery(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&runAIScreen()}/>
          <button className="btn btn-primary" onClick={runAIScreen} disabled={aiScreening} style={{ whiteSpace:"nowrap", gap:8 }}>
            {aiScreening ? <div className="spinner"/> : <Icon name="brain" size={13}/>}
            AI Screen
          </button>
        </div>
        {aiResults && (
          <div style={{ marginTop:14, padding:14, background:"var(--bg3)", borderRadius:8, fontSize:13, lineHeight:1.8,
            whiteSpace:"pre-wrap", border:"1px solid var(--border)" }}>
            {aiResults}
          </div>
        )}
      </div>

      {/* Presets */}
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        <span style={{ color:"var(--muted)", fontSize:12, alignSelf:"center" }}>Quick Presets:</span>
        {Object.keys(PRESETS).map(p => (
          <button key={p} className={`btn ${preset===p?"btn-primary":"btn-ghost"}`} style={{ padding:"5px 12px", fontSize:12, textTransform:"capitalize" }}
            onClick={() => applyPreset(preset===p?"":p)}>{p.charAt(0).toUpperCase()+p.slice(1)}</button>
        ))}
        <button className="btn btn-ghost" style={{ padding:"5px 12px", fontSize:12 }}
          onClick={() => { setFilters({ minPE:"",maxPE:"",minROE:"",minRSI:"",maxRSI:"",signal:"",sector:"",minScore:"",minMktcap:"" }); setPreset(""); setResults(stocks); }}>
          Clear All
        </button>
      </div>

      {/* Filters */}
      <div className="glass" style={{ padding:20, marginBottom:20 }}>
        <h3 style={{ fontFamily:"var(--font-head)", fontSize:14, fontWeight:600, marginBottom:14, color:"var(--muted)" }}>FILTER CRITERIA</h3>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:12, marginBottom:14 }}>
          {[
            ["Min PE","minPE","number","5"],["Max PE","maxPE","number","35"],
            ["Min ROE %","minROE","number","10"],["Min RSI","minRSI","number","40"],
            ["Max RSI","maxRSI","number","75"],["Min AI Score","minScore","number","60"],
            ["Sector","sector","text","e.g. IT"],
          ].map(([label, key, type, ph]) => (
            <div key={key}>
              <label style={{ display:"block", fontSize:11, color:"var(--muted)", marginBottom:5, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</label>
              <input type={type} placeholder={ph} value={filters[key]} onChange={e=>setFilters({...filters,[key]:e.target.value})}/>
            </div>
          ))}
          <div>
            <label style={{ display:"block", fontSize:11, color:"var(--muted)", marginBottom:5, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>Signal</label>
            <select value={filters.signal} onChange={e=>setFilters({...filters,signal:e.target.value})}>
              <option value="">All</option>
              <option value="BUY">BUY</option>
              <option value="HOLD">HOLD</option>
              <option value="SELL">SELL</option>
            </select>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <button className="btn btn-primary" onClick={runScreen}><Icon name="filter" size={13}/> Apply Filters</button>
          <span style={{ color:"var(--muted)", fontSize:13 }}>{results.length} stocks matched</span>
        </div>
      </div>

      {/* Results */}
      <div className="glass" style={{ padding:0, overflow:"hidden" }}>
        <div style={{ padding:"14px 20px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <h3 style={{ fontFamily:"var(--font-head)", fontSize:15, fontWeight:600 }}>Screening Results <span style={{ color:"var(--accent)", marginLeft:8 }}>{results.length}</span></h3>
        </div>
        <div className="scrollable-x">
          <table>
            <thead>
              <tr>
                {[["symbol","Symbol"],["name","Company"],["price","Price"],["chg","Change%"],["pe","PE"],["roe","ROE%"],["rsi","RSI"],["score","AI Score"],["signal","Signal"]].map(([k,l]) => (
                  <th key={k} onClick={()=>handleSort(k)} style={{ cursor:"pointer" }}>
                    {l} {sortCol===k ? (sortDir==="asc"?"↑":"↓") : ""}
                  </th>
                ))}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s) => (
                <tr key={s.id} style={{ cursor:"pointer" }} onClick={()=>onSelectStock(s)}>
                  <td><span style={{ fontFamily:"var(--font-mono)", fontWeight:700, color:"var(--accent)" }}>{s.symbol}</span></td>
                  <td style={{ color:"var(--muted)" }}>{s.name}</td>
                  {/* FIX 3: Use live price from stocks prop (results is kept in sync via useEffect above) */}
                  <td style={{ fontFamily:"var(--font-mono)" }}>₹{fmt(s.price)}</td>
                  <td style={{ color:colorChg(s.chg), fontFamily:"var(--font-mono)" }}>{fmtPct(s.chg)}</td>
                  <td style={{ fontFamily:"var(--font-mono)" }}>{s.pe}</td>
                  <td style={{ fontFamily:"var(--font-mono)", color:s.roe>20?"var(--green)":"var(--text)" }}>{s.roe}%</td>
                  <td style={{ fontFamily:"var(--font-mono)", color:s.rsi>70?"var(--red)":s.rsi<30?"var(--green)":"var(--yellow)" }}>{s.rsi}</td>
                  <td>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <div style={{ width:36, height:3, borderRadius:99, background:"var(--border)", overflow:"hidden" }}>
                        <div style={{ width:`${s.score}%`, height:"100%", background:scoreColor(s.score) }}/>
                      </div>
                      <span style={{ fontFamily:"var(--font-mono)", fontSize:11, color:scoreColor(s.score) }}>{s.score}</span>
                    </div>
                  </td>
                  <td><span className={`badge ${signalBadge(s.signal)}`}>{s.signal}</span></td>
                  {/* FIX 2: View button in screener was completely missing an onClick — wired up here */}
                  <td>
                    <button className="btn btn-ghost" style={{ padding:"3px 8px", fontSize:11 }}
                      onClick={e=>{ e.stopPropagation(); onSelectStock(s); }}>
                      <Icon name="eye" size={11}/> View
                    </button>
                  </td>
                </tr>
              ))}
              {results.length === 0 && (
                <tr><td colSpan={10} style={{ textAlign:"center", padding:30, color:"var(--muted)" }}>No stocks match your criteria. Try adjusting filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
