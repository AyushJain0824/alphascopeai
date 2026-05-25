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
import { fmt, fmtPct, colorChg, scoreColor, signalBadge, currencySymbol, fmtPrice } from "../../utils/formatters.js";
import { callAI } from "../../features/ai/utils/callAI.js";
import { fetchStockDailyHistory, genPriceHistory } from "../../services/stocks/stockService.js";
export default function StockDetailModal({ stock, onClose, onAddToWatchlist, onAddToPortfolio }) {
  const { chartGridStroke } = useTheme();
  const [tab, setTab] = useState("overview");
  const [aiInsight, setAiInsight] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);

  const [priceHistory, setPriceHistory] = useState([]);
  const [tf, setTf] = useState("3M");

  useEffect(() => {
    let cancelled = false;
    setPriceHistory([]);
    (async () => {
      try {
        const rows = await fetchStockDailyHistory(stock);
        if (!cancelled) setPriceHistory(rows);
      } catch {
        if (!cancelled) setPriceHistory(genPriceHistory(stock.price, 365));
      }
    })();
    return () => { cancelled = true; };
  }, [stock.symbol]);

  // FIX 4 (useCallback / missing dep): loadAI is stable via useCallback so
  // the useEffect below doesn't need to re-run except when tab or stock changes.
  const loadAI = useCallback(async () => {
    if (aiInsight) return;
    setLoadingAI(true);
    try {
      const txt = await callAI(
        `Analyze ${stock.symbol} (${stock.name}) for Indian investors. Current price ₹${stock.price}, PE ${stock.pe}, ROE ${stock.roe}%, RSI ${stock.rsi}, quarterly growth ${stock.qtrGrowth}%. Sector: ${stock.sector}. Provide: 1) Investment thesis 2) Key risks 3) Technical outlook 4) Target price range 5) Recommendation. Be specific and actionable.`
      );
      setAiInsight(txt);
    } catch { setAiInsight("⚠️ AI analysis temporarily unavailable. Please try again."); }
    setLoadingAI(false);
  }, [stock, aiInsight]);

  useEffect(() => { if (tab === "ai") loadAI(); }, [tab, loadAI]);

  // FIX 3 (Wrong Prices): tfMap now has correct day counts matching actual timeframes.
  // Previously 6M was 60 (wrong) and 1Y was 90 (wrong), showing wrong date ranges.
  const tfMap = { "1W": 7, "1M": 30, "3M": 90, "6M": 180, "1Y": 365 };
  const cur = currencySymbol(stock.market);
  const staticFallback = useMemo(() => genPriceHistory(stock.price || 100, 365), [stock.symbol, stock.price]);
  const chartSrc = priceHistory.length ? priceHistory : staticFallback;
  const chartData = chartSrc.slice(-tfMap[tf]);

  const fundamentals = [
    { label:"P/E Ratio",       value:stock.pe,          good: stock.pe < 25 },
    { label:"P/B Ratio",       value:stock.pb,          good: stock.pb < 5 },
    { label:"ROE %",           value:stock.roe+"%",     good: stock.roe > 15 },
    { label:"ROCE %",          value:stock.roce+"%",    good: stock.roce > 15 },
    { label:"EPS (₹)",         value:"₹"+stock.eps,     good: true },
    { label:"Div Yield %",     value:stock.div+"%",     good: stock.div > 1 },
    { label:"Debt/Equity",     value:stock.deb,         good: stock.deb < 1 },
    { label:"Promoter Hold %", value:stock.promo+"%",   good: stock.promo > 50 },
    { label:"FII Hold %",      value:stock.fii+"%",     good: stock.fii > 15 },
    { label:"Qtr Growth %",    value:"+"+stock.qtrGrowth+"%", good: true },
  ];

  const technicals = [
    { label:"RSI (14)",         value:stock.rsi,         status: stock.rsi>70?"Overbought":stock.rsi<30?"Oversold":"Neutral" },
    { label:"MACD",             value:stock.macd,        status: stock.macd==="+ve"?"Bullish":"Bearish" },
    { label:"Moving Avg (50D)", value:"Above SMA",       status:"Bullish" },
    { label:"Bollinger Band",   value:"Middle Band",     status:"Neutral" },
    { label:"Volume Trend",     value:"Above Avg",       status:"Bullish" },
    { label:"Trend Strength",   value:"Strong",          status:"Bullish" },
  ];

  const radarData = [
    { sub:"Fundamentals", A:stock.fundScore },
    { sub:"Technicals",   A:stock.techScore },
    { sub:"Sentiment",    A:stock.sentScore },
    { sub:"Institutional",A:stock.instScore },
    { sub:"Growth",       A:Math.round((stock.fundScore+stock.techScore)/2) },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div className="modal-box" initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
        transition={{ duration:0.25 }} onClick={e => e.stopPropagation()} style={{ maxWidth:900 }}>

        {/* Header */}
        <div style={{ padding:"20px 24px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:4 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:`linear-gradient(135deg,var(--accent)22,var(--accent2)22)`,
                border:"1px solid var(--border2)", display:"flex", alignItems:"center", justifyContent:"center",
                fontFamily:"var(--font-mono)", fontWeight:700, fontSize:11, color:"var(--accent)" }}>
                {stock.symbol.slice(0,3)}
              </div>
              <div>
                <h2 style={{ fontFamily:"var(--font-head)", fontSize:20, fontWeight:700 }}>{stock.symbol}</h2>
                <div style={{ color:"var(--muted)", fontSize:13 }}>{stock.name} · <span className="tag">{stock.sector}</span></div>
              </div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:26, fontFamily:"var(--font-mono)", fontWeight:700 }}>{cur}{fmtPrice(stock)}</div>
              <div style={{ fontFamily:"var(--font-mono)", color:colorChg(stock.chg), fontSize:14 }}>{fmtPct(stock.chg)}</div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <span className={`badge ${signalBadge(stock.signal)}`} style={{ padding:"4px 12px", fontSize:12 }}>{stock.signal}</span>
              <span className="badge badge-blue">Conf: {stock.conf}%</span>
            </div>
            <button className="btn btn-ghost" style={{ padding:8 }} onClick={onClose}><Icon name="close" size={16}/></button>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ padding:"12px 24px", borderBottom:"1px solid var(--border)", display:"flex", gap:10 }}>
          {/* FIX 2: Buttons had correct onClick handlers — preserved */}
          <button className="btn btn-success" onClick={() => { onAddToWatchlist(stock); }}>
            <Icon name="star" size={13}/> Add to Watchlist
          </button>
          <button className="btn btn-primary" onClick={() => { onAddToPortfolio(stock); }}>
            <Icon name="portfolio" size={13}/> Add to Portfolio
          </button>
          <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
            {["1W","1M","3M","6M","1Y"].map(t => (
              <button key={t} className={`btn ${tf===t?"btn-primary":"btn-ghost"}`} style={{ padding:"4px 10px", fontSize:11 }}
                onClick={()=>setTf(t)}>{t}</button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div style={{ padding:"16px 24px", borderBottom:"1px solid var(--border)" }}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={stock.chg>=0?"var(--green)":"var(--red)"} stopOpacity={0.25}/>
                  <stop offset="95%" stopColor={stock.chg>=0?"var(--green)":"var(--red)"} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke}/>
              <XAxis dataKey="date" tick={{ fontSize:9, fill:"var(--muted)" }} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
              <YAxis domain={["auto","auto"]} tick={{ fontSize:9, fill:"var(--muted)" }} axisLine={false} tickLine={false} tickFormatter={v=>cur+v.toFixed(0)}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Area type="monotone" dataKey="price" stroke={stock.chg>=0?"var(--green)":"var(--red)"} strokeWidth={2} fill="url(#sg)" name={`Price (${cur})`} isAnimationActive={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Tabs */}
        <div style={{ padding:"12px 24px 0" }}>
          <div className="tab-list" style={{ width:"fit-content" }}>
            {[["overview","Overview"],["fundamentals","Fundamentals"],["technicals","Technicals"],["ai","🧠 AI Insights"]].map(([k,l])=>(
              <button key={k} className={`tab-item ${tab===k?"active":""}`} onClick={()=>setTab(k)}>{l}</button>
            ))}
          </div>
        </div>

        <div style={{ padding:24 }}>
          {tab === "overview" && (
            <div className="grid-2">
              <div>
                <h4 style={{ fontFamily:"var(--font-head)", fontSize:14, fontWeight:600, marginBottom:14, color:"var(--muted)" }}>AI SCORE BREAKDOWN</h4>
                <div style={{ display:"flex", justifyContent:"center", marginBottom:20 }}>
                  <ScoreRing score={stock.score} size={100}/>
                </div>
                <ScoreBar label="Fundamentals" value={stock.fundScore}/>
                <ScoreBar label="Technicals" value={stock.techScore}/>
                <ScoreBar label="Sentiment" value={stock.sentScore}/>
                <ScoreBar label="Institutional" value={stock.instScore}/>
              </div>
              <div>
                <h4 style={{ fontFamily:"var(--font-head)", fontSize:14, fontWeight:600, marginBottom:14, color:"var(--muted)" }}>SPIDER CHART</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="var(--border)"/>
                    <PolarAngleAxis dataKey="sub" tick={{ fontSize:10, fill:"var(--muted)" }}/>
                    <PolarRadiusAxis domain={[0,100]} tick={false} axisLine={false}/>
                    <Radar name={stock.symbol} dataKey="A" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.15} strokeWidth={2}/>
                    <Tooltip content={<CustomTooltip/>}/>
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {tab === "fundamentals" && (
            <div>
              <div className="grid-2">
                {fundamentals.map((f, i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                    padding:"10px 14px", borderRadius:8, background:"var(--surface)", border:"1px solid var(--border)" }}>
                    <span style={{ fontSize:13, color:"var(--muted)" }}>{f.label}</span>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontFamily:"var(--font-mono)", fontWeight:600, fontSize:13 }}>{f.value}</span>
                      <span style={{ fontSize:10 }}>{f.good ? "✅" : "⚠️"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "technicals" && (
            <div>
              <div className="grid-2" style={{ marginBottom:16 }}>
                {technicals.map((t, i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                    padding:"10px 14px", borderRadius:8, background:"var(--surface)", border:"1px solid var(--border)" }}>
                    <span style={{ fontSize:13, color:"var(--muted)" }}>{t.label}</span>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontFamily:"var(--font-mono)", fontSize:13 }}>{t.value}</span>
                      <span className={`badge ${t.status==="Bullish"?"badge-green":t.status==="Bearish"?"badge-red":"badge-yellow"}`}>{t.status}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding:"14px", borderRadius:8, background:"rgba(0,229,160,0.05)", border:"1px solid rgba(0,229,160,0.15)" }}>
                <div style={{ fontSize:13, fontWeight:600, color:"var(--green)", marginBottom:6 }}>📊 Technical Summary</div>
                <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.8 }}>
                  RSI at {stock.rsi} indicates {stock.rsi>70?"overbought conditions - consider waiting for pullback":stock.rsi<30?"oversold territory - potential buying opportunity":"neutral momentum"}.
                  MACD signal is {stock.macd === "+ve" ? "positive, suggesting bullish momentum" : "negative, indicating bearish pressure"}.
                  Support zone: {cur}{fmt(stock.price * 0.94)} | Resistance: {cur}{fmt(stock.price * 1.06)}
                </div>
              </div>
            </div>
          )}

          {tab === "ai" && (
            <div>
              {loadingAI ? (
                <div style={{ textAlign:"center", padding:40 }}>
                  <div className="spinner" style={{ margin:"0 auto 12px" }}/>
                  <div style={{ color:"var(--muted)", fontSize:13 }}>Analyzing {stock.symbol} with AI...</div>
                </div>
              ) : (
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, padding:"10px 14px", borderRadius:8,
                    background:"rgba(0,212,255,0.05)", border:"1px solid rgba(0,212,255,0.15)" }}>
                    <Icon name="brain" size={16} color="var(--accent)"/>
                    <span style={{ fontSize:13, color:"var(--accent)", fontWeight:600 }}>AlphaScope AI Analysis — {stock.symbol}</span>
                  </div>
                  <div style={{ fontSize:13, lineHeight:1.9, color:"var(--text)", whiteSpace:"pre-wrap",
                    background:"var(--surface)", border:"1px solid var(--border)", borderRadius:8, padding:16 }}>
                    {aiInsight}
                  </div>
                  <button className="btn btn-ghost" style={{ marginTop:12, fontSize:12 }}
                    onClick={() => { setAiInsight(""); setTimeout(loadAI, 100); }}>
                    <Icon name="refresh" size={12}/> Regenerate Analysis
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
