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
import LiveNewsFeed from "../../features/news/components/LiveNewsFeed.jsx";
import { callAI } from "../../features/ai/utils/callAI.js";
export default function NewsPage() {
  const [liveArticles, setLiveArticles] = useState([]);
  const [aiSummary, setAiSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const sentimentCounts = useMemo(
    () => ({
      bullish: liveArticles.filter((n) => n.sentiment === "bullish").length,
      bearish: liveArticles.filter((n) => n.sentiment === "bearish").length,
      neutral: liveArticles.filter((n) => n.sentiment === "neutral").length,
    }),
    [liveArticles]
  );

  const getSentimentSummary = async () => {
    if (!liveArticles.length) {
      setAiSummary("Load live news first, then run AI sentiment analysis.");
      return;
    }
    setLoading(true);
    try {
      const headlines = liveArticles
        .slice(0, 20)
        .map((n) => `- ${n.title} (${n.sentiment}, ${n.source})`)
        .join("\n");
      const txt = await callAI(
        `Today's financial market news headlines:\n${headlines}\n\nProvide: 1) Overall market sentiment score (0-100) 2) Top bullish themes 3) Top bearish risks 4) Sectors most impacted 5) Trading implications for today. Be concise.`
      );
      setAiSummary(txt);
    } catch { setAiSummary("Sentiment analysis temporarily unavailable."); }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:"var(--font-head)", fontSize:26, fontWeight:700, marginBottom:6 }}>Market News & Sentiment</h1>
          <p style={{ color:"var(--muted)" }}>Live RSS news · {liveArticles.length} articles loaded</p>
        </div>
        <button className="btn btn-primary" onClick={getSentimentSummary} disabled={loading}>
          {loading ? <div className="spinner"/> : <Icon name="brain" size={13}/>}
          AI Sentiment Report
        </button>
      </div>

      {/* Sentiment stats */}
      <div className="grid-3" style={{ marginBottom:20 }}>
        {[
          { label:"Bullish (est.)", count:sentimentCounts.bullish, color:"var(--green)", bg:"rgba(0,229,160,0.08)" },
          { label:"Bearish (est.)", count:sentimentCounts.bearish, color:"var(--red)", bg:"rgba(255,69,96,0.08)" },
          { label:"Neutral (est.)", count:sentimentCounts.neutral, color:"var(--muted)", bg:"var(--surface)" },
        ].map((s, i) => (
          <div key={i} className="glass stat-card" style={{ background:s.bg }}>
            <div style={{ fontSize:28, fontWeight:700, fontFamily:"var(--font-mono)", color:s.color }}>{s.count}</div>
            <div style={{ fontSize:12, color:"var(--muted)", marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* AI Summary */}
      {(aiSummary || loading) && (
        <div className="glass" style={{ padding:20, marginBottom:20, border:"1px solid rgba(0,212,255,0.15)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
            <Icon name="brain" size={16} color="var(--accent)"/>
            <h3 style={{ fontFamily:"var(--font-head)", fontSize:15, fontWeight:600 }}>AI Sentiment Analysis</h3>
          </div>
          {loading
            ? <div style={{ textAlign:"center", padding:16, color:"var(--muted)" }}>Analyzing market sentiment...</div>
            : <div style={{ fontSize:13, lineHeight:1.9, whiteSpace:"pre-wrap" }}>{aiSummary}</div>}
        </div>
      )}

      <LiveNewsFeed onArticlesChange={setLiveArticles} />
    </div>
  );
};
