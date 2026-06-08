import React from "react";
import { scoreColor } from "../../utils/formatters.js";
import { fmt } from "../../utils/formatters.js";

export default function ScoreBar({ label, value, max=100 }) {
  const pct = (value / max) * 100;
  const col = scoreColor(value);
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontSize:12, color:"var(--muted)" }}>{label}</span>
        <span style={{ fontSize:12, fontFamily:"var(--font-mono)", color:col }}>{value}</span>
      </div>
      <div className="score-bar-bg">
        <div className="score-bar-fill" style={{ width:`${pct}%`, background:`linear-gradient(90deg,${col}99,${col})` }}/>
      </div>
    </div>
  );
};
