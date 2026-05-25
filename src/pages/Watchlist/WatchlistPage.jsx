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
export default function WatchlistPage({ stocks, watchlist, setWatchlist, onSelectStock }) {
  const [newAlert, setNewAlert] = useState({ symbol:"", type:"price", value:"" });
  const [alerts, setAlerts] = useState([
    { id:1, symbol:"TCS",        type:"Price Above", value:"₹4000", active:true  },
    { id:2, symbol:"BAJFINANCE", type:"RSI Above",   value:"75",     active:true  },
    { id:3, symbol:"TATAMOTORS", type:"Price Below", value:"₹900",  active:false },
  ]);

  // FIX 3 (Wrong Prices): watched now reads live prices from the stocks prop.
  const watched = stocks.filter(s => watchlist.includes(s.symbol));

  const addAlert = () => {
    if (!newAlert.symbol || !newAlert.value) return;
    setAlerts([...alerts, { id:Date.now(), ...newAlert, active:true }]);
    setNewAlert({ symbol:"", type:"price", value:"" });
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:"var(--font-head)", fontSize:26, fontWeight:700, marginBottom:6 }}>Watchlist & Alerts</h1>
          <p style={{ color:"var(--muted)" }}>{watched.length} stocks being monitored</p>
        </div>
      </div>

      {watched.length === 0 ? (
        <div className="glass" style={{ padding:40, textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>👀</div>
          <h3 style={{ fontFamily:"var(--font-head)", fontSize:18, marginBottom:8 }}>Watchlist is empty</h3>
          <p style={{ color:"var(--muted)", fontSize:14 }}>Add stocks from the Screener or Dashboard by clicking "Add to Watchlist"</p>
        </div>
      ) : (
        <div className="glass" style={{ marginBottom:24 }}>
          <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)" }}>
            <h3 style={{ fontFamily:"var(--font-head)", fontSize:15, fontWeight:600 }}>Watched Stocks</h3>
          </div>
          <div className="scrollable-x">
            <table>
              <thead>
                <tr><th>Symbol</th><th>Name</th><th>Price</th><th>Change</th><th>RSI</th><th>AI Score</th><th>Signal</th><th>Remove</th></tr>
              </thead>
              <tbody>
                {watched.map(s => (
                  <tr key={s.id} style={{ cursor:"pointer" }} onClick={()=>onSelectStock(s)}>
                    <td><span style={{ fontFamily:"var(--font-mono)", fontWeight:700, color:"var(--accent)" }}>{s.symbol}</span></td>
                    <td style={{ color:"var(--muted)" }}>{s.name}</td>
                    <td style={{ fontFamily:"var(--font-mono)" }}>₹{fmt(s.price)}</td>
                    <td style={{ fontFamily:"var(--font-mono)", color:colorChg(s.chg) }}>{fmtPct(s.chg)}</td>
                    <td style={{ fontFamily:"var(--font-mono)" }}>{s.rsi}</td>
                    <td style={{ color:scoreColor(s.score), fontFamily:"var(--font-mono)" }}>{s.score}</td>
                    <td><span className={`badge ${signalBadge(s.signal)}`}>{s.signal}</span></td>
                    <td>
                      {/* FIX 2: stopPropagation preserved to prevent row click firing during remove */}
                      <button className="btn btn-danger" style={{ padding:"3px 8px", fontSize:11 }}
                        onClick={e=>{ e.stopPropagation(); setWatchlist(watchlist.filter(x=>x!==s.symbol)); }}>
                        <Icon name="trash" size={11}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Alerts */}
      <div className="glass" style={{ padding:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <h3 style={{ fontFamily:"var(--font-head)", fontSize:15, fontWeight:600 }}><Icon name="bell" size={14}/> Price Alerts</h3>
        </div>

        {/* Add Alert */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr auto", gap:10, marginBottom:16, alignItems:"end" }}>
          <div>
            <label style={{ fontSize:11, color:"var(--muted)", display:"block", marginBottom:4 }}>SYMBOL</label>
            <input placeholder="TCS" value={newAlert.symbol} onChange={e=>setNewAlert({...newAlert,symbol:e.target.value})}/>
          </div>
          <div>
            <label style={{ fontSize:11, color:"var(--muted)", display:"block", marginBottom:4 }}>TYPE</label>
            <select value={newAlert.type} onChange={e=>setNewAlert({...newAlert,type:e.target.value})}>
              <option value="price">Price Above</option>
              <option value="price_below">Price Below</option>
              <option value="rsi">RSI Above</option>
              <option value="volume">Volume Spike</option>
              <option value="ai_signal">AI Signal Change</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize:11, color:"var(--muted)", display:"block", marginBottom:4 }}>VALUE</label>
            <input placeholder="4000" value={newAlert.value} onChange={e=>setNewAlert({...newAlert,value:e.target.value})}/>
          </div>
          <button className="btn btn-primary" onClick={addAlert}><Icon name="plus" size={13}/> Set Alert</button>
        </div>

        {alerts.map((a) => (
          <div key={a.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"10px 14px", borderRadius:8, background:"var(--surface)", border:"1px solid var(--border)", marginBottom:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <Icon name="bell" size={14} color={a.active?"var(--yellow)":"var(--muted)"}/>
              <div>
                <span style={{ fontFamily:"var(--font-mono)", fontWeight:700, color:"var(--accent)", marginRight:8 }}>{a.symbol}</span>
                <span style={{ fontSize:13, color:"var(--muted)" }}>{a.type} {a.value}</span>
              </div>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <span className={`badge ${a.active?"badge-green":"badge-yellow"}`}>{a.active?"Active":"Triggered"}</span>
              <button className="btn btn-danger" style={{ padding:"3px 8px", fontSize:11 }}
                onClick={()=>setAlerts(alerts.filter(x=>x.id!==a.id))}><Icon name="trash" size={11}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
