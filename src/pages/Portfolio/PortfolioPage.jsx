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
export default function PortfolioPage({ stocks }) {
  const { chartGridStroke } = useTheme();
  const [holdings, setHoldings] = useState([
    { id:1, symbol:"TCS",        qty:10, buyPrice:3500, date:"2024-01-15" },
    { id:2, symbol:"RELIANCE",   qty:20, buyPrice:2600, date:"2024-03-20" },
    { id:3, symbol:"ICICIBANK",  qty:50, buyPrice:980,  date:"2024-05-10" },
    { id:4, symbol:"INFY",       qty:15, buyPrice:1380, date:"2024-07-01" },
    { id:5, symbol:"TATAMOTORS", qty:30, buyPrice:780,  date:"2024-08-12" },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [newH, setNewH] = useState({ symbol:"", qty:"", buyPrice:"" });
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);

  // FIX 3 (Wrong Prices): enriched now reads live price from the stocks prop
  // so portfolio P&L always reflects the current simulated price, not seed data.
  const enriched = useMemo(() => holdings.map(h => {
    const s = stocks.find(x => x.symbol === h.symbol);
    if (!s) return { ...h, currentPrice:h.buyPrice, pnl:0, pnlPct:0 };
    const currentPrice = s.price; // always live
    const pnl = (currentPrice - h.buyPrice) * h.qty;
    const pnlPct = ((currentPrice - h.buyPrice) / h.buyPrice) * 100;
    return { ...h, currentPrice, pnl, pnlPct, sector:s.sector, signal:s.signal, score:s.score };
  }), [holdings, stocks]);

  const totalInvested = enriched.reduce((a,h) => a + h.buyPrice * h.qty, 0);
  const totalCurrent  = enriched.reduce((a,h) => a + h.currentPrice * h.qty, 0);
  const totalPnL      = totalCurrent - totalInvested;
  const totalPnLPct   = (totalPnL / totalInvested) * 100;

  const sectorAlloc = Object.entries(
    enriched.reduce((acc, h) => { acc[h.sector||"Other"] = (acc[h.sector||"Other"]||0) + h.currentPrice*h.qty; return acc; }, {})
  ).map(([name, val]) => ({ name, value: +((val/totalCurrent)*100).toFixed(1) }));

  const COLORS = ["var(--accent)","var(--accent2)","var(--green)","var(--yellow)","var(--orange)","var(--red)"];

  // FIX 4 (Perf): pnlHistory used to recalculate with Math.random() on every
  // render, causing flickering. Stabilised with useMemo + a seed derived from
  // totalInvested so it only regenerates when the portfolio composition changes.
  const pnlHistory = useMemo(() => Array.from({ length:30 }, (_,i) => {
    const d = new Date(); d.setDate(d.getDate()-29+i);
    return {
      date: d.toLocaleDateString("en-IN",{month:"short",day:"numeric"}),
      value: totalInvested * (1 + (i*0.003) + (Math.sin(i*0.7)*0.01)),
    };
  }), [totalInvested]);

  const getAIAdvice = async () => {
    setLoadingAI(true);
    const ctx = enriched.map(h => `${h.symbol}: Qty=${h.qty}, BuyPrice=₹${h.buyPrice}, Current=₹${h.currentPrice?.toFixed(0)}, P&L=${h.pnlPct?.toFixed(1)}%, Signal=${h.signal}`).join("\n");
    try {
      const txt = await callAI(
        `Portfolio review:\n${ctx}\nTotal invested: ₹${fmt(totalInvested)}, Current value: ₹${fmt(totalCurrent)}, Return: ${totalPnLPct.toFixed(1)}%\nProvide: 1) Portfolio health assessment 2) Rebalancing suggestions 3) Stocks to hold/exit 4) What to add. Be specific.`,
        "You are a SEBI-registered portfolio advisor. Provide actionable Indian stock market advice."
      );
      setAiAnalysis(txt);
    } catch { setAiAnalysis("AI advice temporarily unavailable."); }
    setLoadingAI(false);
  };

  const addHolding = () => {
    if (!newH.symbol || !newH.qty || !newH.buyPrice) return;
    setHoldings([...holdings, { id:Date.now(), ...newH, qty:+newH.qty, buyPrice:+newH.buyPrice, date:new Date().toISOString().split("T")[0] }]);
    setNewH({ symbol:"", qty:"", buyPrice:"" }); setShowAdd(false);
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:"var(--font-head)", fontSize:26, fontWeight:700, marginBottom:6 }}>Portfolio Tracker</h1>
          <p style={{ color:"var(--muted)" }}>Track, analyze and optimize your holdings with AI</p>
        </div>
        <button className="btn btn-primary" onClick={()=>setShowAdd(true)}>
          <Icon name="plus" size={13}/> Add Holding
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:"Total Invested", value:`₹${fmt(totalInvested)}`,           sub:"Capital deployed",         color:"var(--accent)",  icon:"portfolio" },
          { label:"Current Value",  value:`₹${fmt(totalCurrent)}`,            sub:"Market value",             color:"var(--green)",   icon:"trending_up" },
          { label:"Total P&L",      value:`₹${fmt(Math.abs(totalPnL))}`,      sub:`${fmtPct(totalPnLPct)} return`, color:totalPnL>=0?"var(--green)":"var(--red)", icon:totalPnL>=0?"arrow_up":"arrow_down" },
          { label:"Holdings",       value:holdings.length,                    sub:"Active positions",         color:"var(--yellow)",  icon:"grid" },
        ].map((c, i) => (
          <div key={i} className="glass stat-card">
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
              <span style={{ fontSize:11, color:"var(--muted)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>{c.label}</span>
              <Icon name={c.icon} size={15} color={c.color}/>
            </div>
            <div style={{ fontSize:22, fontWeight:700, fontFamily:"var(--font-mono)", color:c.color }}>{c.value}</div>
            <div style={{ fontSize:12, color:"var(--muted)", marginTop:4 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:20, marginBottom:20 }}>
        {/* Portfolio Chart */}
        <div className="glass" style={{ padding:20 }}>
          <h3 style={{ fontFamily:"var(--font-head)", fontSize:15, fontWeight:600, marginBottom:16 }}>Portfolio Performance (30D)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={pnlHistory}>
              <defs>
                <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke}/>
              <XAxis dataKey="date" tick={{ fontSize:9, fill:"var(--muted)" }} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
              <YAxis tick={{ fontSize:9, fill:"var(--muted)" }} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Area type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} fill="url(#pg)" name="Value (₹)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Allocation */}
        <div className="glass" style={{ padding:20 }}>
          <h3 style={{ fontFamily:"var(--font-head)", fontSize:15, fontWeight:600, marginBottom:16 }}>Sector Allocation</h3>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={sectorAlloc} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" nameKey="name">
                {sectorAlloc.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:"flex", flexDirection:"column", gap:5, marginTop:6 }}>
            {sectorAlloc.map((s, i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:8, height:8, borderRadius:2, background:COLORS[i%COLORS.length] }}/>
                  <span style={{ fontSize:11, color:"var(--muted)" }}>{s.name}</span>
                </div>
                <span style={{ fontSize:11, fontFamily:"var(--font-mono)" }}>{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="glass" style={{ marginBottom:20 }}>
        <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)" }}>
          <h3 style={{ fontFamily:"var(--font-head)", fontSize:15, fontWeight:600 }}>Holdings</h3>
        </div>
        <div className="scrollable-x">
          <table>
            <thead>
              <tr><th>Symbol</th><th>Qty</th><th>Buy Price</th><th>Current</th><th>Invested</th><th>Current Value</th><th>P&L</th><th>Return%</th><th>Signal</th><th>Score</th><th></th></tr>
            </thead>
            <tbody>
              {enriched.map((h) => (
                <tr key={h.id}>
                  <td><span style={{ fontFamily:"var(--font-mono)", fontWeight:700, color:"var(--accent)" }}>{h.symbol}</span></td>
                  <td style={{ fontFamily:"var(--font-mono)" }}>{h.qty}</td>
                  <td style={{ fontFamily:"var(--font-mono)" }}>₹{fmt(h.buyPrice)}</td>
                  <td style={{ fontFamily:"var(--font-mono)" }}>₹{fmt(h.currentPrice)}</td>
                  <td style={{ fontFamily:"var(--font-mono)", color:"var(--muted)" }}>₹{fmt(h.buyPrice*h.qty)}</td>
                  <td style={{ fontFamily:"var(--font-mono)" }}>₹{fmt(h.currentPrice*h.qty)}</td>
                  <td style={{ fontFamily:"var(--font-mono)", color:colorChg(h.pnl) }}>
                    {h.pnl>=0?"+":""}₹{fmt(Math.abs(h.pnl))}
                  </td>
                  <td style={{ fontFamily:"var(--font-mono)", color:colorChg(h.pnlPct) }}>{fmtPct(h.pnlPct)}</td>
                  <td><span className={`badge ${signalBadge(h.signal||"HOLD")}`}>{h.signal||"HOLD"}</span></td>
                  <td><span style={{ fontFamily:"var(--font-mono)", fontSize:12, color:scoreColor(h.score||60) }}>{h.score||60}</span></td>
                  <td>
                    <button className="btn btn-danger" style={{ padding:"3px 8px", fontSize:11 }}
                      onClick={()=>setHoldings(holdings.filter(x=>x.id!==h.id))}>
                      <Icon name="trash" size={11}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Portfolio Advice */}
      <div className="glass" style={{ padding:20, border:"1px solid rgba(0,212,255,0.15)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Icon name="brain" size={18} color="var(--accent)"/>
            <h3 style={{ fontFamily:"var(--font-head)", fontSize:15, fontWeight:600 }}>AI Portfolio Advisor</h3>
          </div>
          <button className="btn btn-primary" onClick={getAIAdvice} disabled={loadingAI}>
            {loadingAI ? <div className="spinner"/> : <Icon name="zap" size={13}/>}
            Get AI Advice
          </button>
        </div>
        {loadingAI && <div style={{ textAlign:"center", padding:20, color:"var(--muted)" }}>Analyzing your portfolio...</div>}
        {aiAnalysis && <div style={{ fontSize:13, lineHeight:1.9, whiteSpace:"pre-wrap", color:"var(--text)" }}>{aiAnalysis}</div>}
        {!aiAnalysis && !loadingAI && <div style={{ color:"var(--muted)", fontSize:13, textAlign:"center", padding:16 }}>Click "Get AI Advice" for personalized portfolio recommendations</div>}
      </div>

      {/* Add Holding Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={()=>setShowAdd(false)}>
          <motion.div className="modal-box" initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
            style={{ maxWidth:400 }} onClick={e=>e.stopPropagation()}>
            <div style={{ padding:"20px 24px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <h3 style={{ fontFamily:"var(--font-head)", fontSize:16, fontWeight:600 }}>Add Holding</h3>
              <button className="btn btn-ghost" style={{ padding:6 }} onClick={()=>setShowAdd(false)}><Icon name="close" size={14}/></button>
            </div>
            <div style={{ padding:24 }}>
              {[["Symbol","symbol","text","e.g. TCS"],["Quantity","qty","number","10"],["Buy Price (₹)","buyPrice","number","3500"]].map(([l,k,t,p])=>(
                <div key={k} style={{ marginBottom:16 }}>
                  <label style={{ display:"block", fontSize:12, color:"var(--muted)", marginBottom:6, fontWeight:600 }}>{l}</label>
                  <input type={t} placeholder={p} value={newH[k]} onChange={e=>setNewH({...newH,[k]:e.target.value})}/>
                </div>
              ))}
              <button className="btn btn-primary" style={{ width:"100%", justifyContent:"center" }} onClick={addHolding}>
                <Icon name="plus" size={13}/> Add to Portfolio
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
