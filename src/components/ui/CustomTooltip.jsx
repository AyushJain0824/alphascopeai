// Recharts tooltip — moved from AlphaScopeAI.jsx
import React from "react";
import { fmt } from "../../utils/formatters.js";

export default function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div style={{ color:"var(--muted)", marginBottom:4, fontSize:11 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || "var(--accent)", fontWeight:500 }}>
          {p.name}: {typeof p.value === "number" ? fmt(p.value) : p.value}
        </div>
      ))}
    </div>
  );
};
