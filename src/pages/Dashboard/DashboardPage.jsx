import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "../../hooks/useTheme.js";
import Icon from "../../components/common/Icon.jsx";
import CustomTooltip from "../../components/ui/CustomTooltip.jsx";
import { fmtPct, colorChg, scoreColor, signalBadge, currencySymbol, fmtPrice, fmtVol } from "../../utils/formatters.js";
import { SECTORS } from "../../data/sectors.js";
import { STOCK_SORT_MODES } from "../../constants/market.js";

function StockRowSkeleton({ rows = 6 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: 11 }).map((__, j) => (
            <td key={j}>
              <div
                className="skeleton-pulse"
                style={{
                  height: 14,
                  borderRadius: 4,
                  background: "var(--border)",
                  width: j === 1 ? "80%" : "60%",
                  opacity: 0.5,
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function DashboardPage({
  stocks,
  stocksUniverse,
  indices,
  niftySeries,
  quoteMeta,
  listMeta,
  sortMode,
  setSortMode,
  onLoadMore,
  onSelectStock,
}) {
  const { chartGridStroke } = useTheme();
  const [tab, setTab] = useState("gainers");
  const loading = quoteMeta?.loading;

  const sorted = useMemo(() => {
    const byVolume = (a, b) => (b.volumeRaw ?? 0) - (a.volumeRaw ?? 0);
    return {
      gainers: [...stocks]
        .sort((a, b) => (b.chg ?? -Infinity) - (a.chg ?? -Infinity))
        .slice(0, 8),
      losers: [...stocks]
        .sort((a, b) => (a.chg ?? Infinity) - (b.chg ?? Infinity))
        .slice(0, 8),
      active: [...stocks].sort(byVolume).slice(0, 8),
      top: [...stocks].sort((a, b) => b.score - a.score).slice(0, 8),
    };
  }, [stocks]);

  const fullTable = useMemo(() => {
    const mode = sortMode || "gainers";
    const list = [...stocks];
    if (mode === "losers") list.sort((a, b) => (a.chg ?? Infinity) - (b.chg ?? Infinity));
    else if (mode === "volume") list.sort((a, b) => (b.volumeRaw ?? 0) - (a.volumeRaw ?? 0));
    else if (mode === "score") list.sort((a, b) => b.score - a.score);
    else list.sort((a, b) => (b.chg ?? -Infinity) - (a.chg ?? -Infinity));
    return list.slice(0, listMeta?.visible ?? list.length);
  }, [stocks, sortMode, listMeta?.visible]);

  const sectorsLive = useMemo(() => {
    const base = stocksUniverse || stocks;
    return SECTORS.map((sec) => {
      const vals = sec.stocks
        .map((sym) => base.find((st) => st.symbol === sym)?.chg)
        .filter((v) => v != null && Number.isFinite(v) && v !== 0);
      if (!vals.length) return sec;
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      return { ...sec, chg: +avg.toFixed(2) };
    });
  }, [stocks, stocksUniverse]);

  const niftySpot = niftySeries?.length ? niftySeries[niftySeries.length - 1].v : null;
  const nx = indices[0];

  return (
    <div>
      <div className="grid-3" style={{ marginBottom: 20 }}>
        {indices.map((idx, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass stat-card glass-hover"
            style={{ cursor: "default" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 4,
                  }}
                >
                  {idx.name}
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-mono)" }}>{idx.value}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: idx.color, fontFamily: "var(--font-mono)" }}>
                  {idx.chg}
                </div>
                <div style={{ fontSize: 12, color: idx.color, fontFamily: "var(--font-mono)" }}>{idx.chgPts}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 20 }}>
        <div className="glass" style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-head)", fontWeight: 600, fontSize: 16 }}>NIFTY 50 — Intraday</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <span className="dot-live" />
                <span style={{ fontSize: 11, color: "var(--muted)" }}>Yahoo · 5m · IST</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 22, fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                {niftySpot != null
                  ? niftySpot.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : nx?.value ?? "—"}
              </div>
              <div style={{ color: nx?.color ?? "var(--muted)", fontSize: 13, fontFamily: "var(--font-mono)" }}>
                {nx?.chgPts && nx?.chg && nx.chg !== "—" ? `${nx.chgPts} (${nx.chg})` : "—"}
              </div>
            </div>
          </div>
          {(niftySeries?.length ?? 0) ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={niftySeries}>
                <defs>
                  <linearGradient id="ng" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--green)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--green)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                <XAxis dataKey="t" tick={{ fontSize: 10, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 10, fill: "var(--muted)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v.toFixed(0)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="var(--green)"
                  strokeWidth={2}
                  fill="url(#ng)"
                  name="NIFTY"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                height: 180,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--muted)",
                fontSize: 13,
              }}
            >
              {loading ? "Loading intraday NIFTY 50…" : "Chart unavailable — check Yahoo proxy."}
            </div>
          )}
        </div>

        <div className="glass" style={{ padding: 20 }}>
          <h3 style={{ fontFamily: "var(--font-head)", fontWeight: 600, fontSize: 16, marginBottom: 14 }}>Sector Heatmap</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {sectorsLive.map((s, i) => {
              const intensity = Math.abs(s.chg) / 4;
              const bg =
                s.chg >= 0
                  ? `rgba(0,229,160,${0.1 + intensity * 0.3})`
                  : `rgba(255,69,96,${0.1 + intensity * 0.3})`;
              return (
                <div
                  key={i}
                  className="heatmap-cell"
                  style={{
                    background: bg,
                    border: `1px solid ${s.chg >= 0 ? "rgba(0,229,160,0.2)" : "rgba(255,69,96,0.2)"}`,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 2 }}>{s.name}</div>
                  <div
                    style={{
                      fontSize: 12,
                      fontFamily: "var(--font-mono)",
                      color: s.chg >= 0 ? "var(--green)" : "var(--red)",
                      fontWeight: 600,
                    }}
                  >
                    {fmtPct(s.chg)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="glass" style={{ padding: 20, marginBottom: 20 }}>
        {listMeta?.query?.trim() ? (
          <div
            style={{
              fontSize: 12,
              color: "var(--muted)",
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <Icon name="search" size={14} />
            <span>
              Showing <strong style={{ color: "var(--text)" }}>{listMeta.shown}</strong> of {listMeta.total} matching
              “{listMeta.query.trim()}”
            </span>
          </div>
        ) : null}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div className="tab-list">
            {[
              ["gainers", "🚀 Gainers"],
              ["losers", "📉 Losers"],
              ["active", "🔥 Most Active"],
              ["top", "⭐ AI Top Picks"],
            ].map(([k, l]) => (
              <button key={k} className={`tab-item ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>
                {l}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="dot-live" />
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Yahoo · ~20s</span>
            {quoteMeta?.ok === false && (
              <span style={{ fontSize: 11, color: "var(--yellow)", marginLeft: 8 }} title={quoteMeta.message}>
                {quoteMeta.message || "Partial data"}
              </span>
            )}
          </div>
        </div>
        <div className="scrollable-x">
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th>Price</th>
                <th>Change</th>
                <th>Volume</th>
                <th>Market Cap</th>
                <th>PE</th>
                <th>RSI</th>
                <th>AI Score</th>
                <th>Signal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <StockRowSkeleton rows={6} />
              ) : sorted[tab].length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: "center", padding: 28, color: "var(--muted)" }}>
                    No stocks in this view match your filters.
                  </td>
                </tr>
              ) : (
                sorted[tab].map((s, i) => (
                  <StockTableRow key={s.id} stock={s} index={i} onSelect={onSelectStock} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass" style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <h3 style={{ fontFamily: "var(--font-head)", fontWeight: 600, fontSize: 16, margin: 0 }}>
            Full Market ({listMeta?.shown ?? stocks.length})
          </h3>
          <div className="tab-list">
            {STOCK_SORT_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`tab-item ${sortMode === m.id ? "active" : ""}`}
                onClick={() => setSortMode(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div className="scrollable-x">
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Market</th>
                <th>Name</th>
                <th>Price</th>
                <th>Change</th>
                <th>Volume</th>
                <th>Signal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <StockRowSkeleton rows={10} />
              ) : fullTable.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 28, color: "var(--muted)" }}>
                    No stocks match filters.
                  </td>
                </tr>
              ) : (
                fullTable.map((s, i) => (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.02, 0.4) }}
                    style={{ cursor: "pointer" }}
                    onClick={() => onSelectStock(s)}
                  >
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent)" }}>
                        {s.symbol}
                      </span>
                      {s.live ? (
                        <span className="dot-live" style={{ marginLeft: 6, scale: 0.7 }} />
                      ) : s.quoteStale ? (
                        <span style={{ marginLeft: 6, fontSize: 9, color: "var(--muted)" }} title="Delayed quote">
                          *
                        </span>
                      ) : null}
                    </td>
                    <td>
                      <span className="tag" style={{ fontSize: 10 }}>
                        {s.market}
                      </span>
                    </td>
                    <td style={{ color: "var(--muted)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {s.name}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                      {currencySymbol(s.market)}
                      {fmtPrice(s)}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", color: colorChg(s.chg) }}>
                      {fmtPct(s.chg)}
                    </td>
                    <td style={{ color: "var(--muted)" }}>{fmtVol(s)}</td>
                    <td>
                      <span className={`badge ${signalBadge(s.signal)}`}>{s.signal}</span>
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: "4px 8px", fontSize: 11 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStock(s);
                        }}
                      >
                        <Icon name="eye" size={12} /> View
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {listMeta?.hasMore && !loading ? (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button type="button" className="btn btn-ghost" onClick={onLoadMore}>
              Load more ({listMeta.visible} / {listMeta.shown})
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StockTableRow({ stock: s, index: i, onSelect }) {
  const cur = currencySymbol(s.market);
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: i * 0.04 }}
      style={{ cursor: "pointer" }}
      onClick={() => onSelect(s)}
    >
      <td>
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent)" }}>{s.symbol}</span>
      </td>
      <td style={{ color: "var(--muted)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</td>
      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
        {cur}
        {fmtPrice(s)}
      </td>
      <td style={{ fontFamily: "var(--font-mono)", color: colorChg(s.chg) }}>{fmtPct(s.chg)}</td>
      <td style={{ color: "var(--muted)" }}>{fmtVol(s)}</td>
      <td style={{ color: "var(--muted)" }}>{s.mktcap}</td>
      <td style={{ fontFamily: "var(--font-mono)" }}>{s.pe}</td>
      <td>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            color: s.rsi > 70 ? "var(--red)" : s.rsi < 30 ? "var(--green)" : "var(--yellow)",
          }}
        >
          {s.rsi}
        </span>
      </td>
      <td>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
            <div
              style={{ width: `${s.score}%`, height: "100%", background: scoreColor(s.score), borderRadius: 99 }}
            />
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: scoreColor(s.score) }}>{s.score}</span>
        </div>
      </td>
      <td>
        <span className={`badge ${signalBadge(s.signal)}`}>{s.signal}</span>
      </td>
      <td>
        <button
          className="btn btn-ghost"
          style={{ padding: "4px 8px", fontSize: 11 }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(s);
          }}
        >
          <Icon name="eye" size={12} /> View
        </button>
      </td>
    </motion.tr>
  );
}
