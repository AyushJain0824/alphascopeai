// Score ring — moved from AlphaScopeAI.jsx
import React from "react";
import { scoreColor } from "../../utils/formatters.js";

export default function ScoreRing({ score, size=80, strokeW=7 }) {
  const r = (size - strokeW * 2) / 2;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;
  const color = scoreColor(score);
  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={strokeW}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeW}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "stroke-dashoffset 1s ease" }}/>
      </svg>
      <div style={{ position:"absolute", textAlign:"center" }}>
        <div style={{ fontSize: size/4, fontWeight:700, fontFamily:"var(--font-mono)", color }}>{score}</div>
        <div style={{ fontSize: size/8, color:"var(--muted)", marginTop:"-2px" }}>/ 100</div>
      </div>
    </div>
  );
};
