// Sparkline — moved from AlphaScopeAI.jsx
import React from "react";

export default function Sparkline({ data, positive=true, w=80, h=32 }) {
  if (!data || data.length < 2) return null;
  const vals = data.map(d => d.price);
  const min = Math.min(...vals), max = Math.max(...vals);
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * h;
    return `${x},${y}`;
  }).join(" ");
  const col = positive ? "var(--green)" : "var(--red)";
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={col} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};
