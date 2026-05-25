import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNews } from "../../../hooks/useNews";
import { NEWS_CATEGORIES, REFRESH_INTERVAL_MS } from "../../../services/newsService";

const INITIAL_VISIBLE = 20;
const LOAD_MORE_STEP = 15;

function SkeletonCard() {
  return (
    <motion.div className="glass" style={{ padding: 16, display: "flex", gap: 14, opacity: 0.7 }}>
      <motion.div
        style={{ width: 96, height: 72, borderRadius: 8, background: "var(--border)", flexShrink: 0 }}
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ repeat: Infinity, duration: 1.2 }}
      />
      <div style={{ flex: 1 }}>
        <motion.div
          style={{ height: 14, width: "90%", background: "var(--border)", borderRadius: 4, marginBottom: 8 }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
        />
        <motion.div
          style={{ height: 10, width: "70%", background: "var(--border)", borderRadius: 4, marginBottom: 6 }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.2, delay: 0.1 }}
        />
        <motion.div
          style={{ height: 10, width: "40%", background: "var(--border)", borderRadius: 4 }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}
        />
      </div>
    </motion.div>
  );
}

function NewsCard({ article, index }) {
  const catLabel = NEWS_CATEGORIES.find((c) => c.id === article.category)?.label || "News";

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.35) }}
      className="glass glass-hover"
      style={{ overflow: "hidden" }}
    >
      <div style={{ display: "flex", flexDirection: "row", minHeight: 100 }}>
        {article.image ? (
          <motion.div
            style={{
              width: 120,
              minHeight: 100,
              flexShrink: 0,
              background: `url(${article.image}) center/cover no-repeat`,
              backgroundColor: "var(--bg3)",
            }}
            role="img"
            aria-label=""
          />
        ) : (
          <div
            style={{
              width: 120,
              flexShrink: 0,
              background: "linear-gradient(135deg,var(--accent)22,var(--accent2)22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
            }}
          >
            📰
          </div>
        )}
        <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span className="badge badge-blue">{catLabel}</span>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>{article.source}</span>
          </div>
          <h4 style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.45, color: "var(--text)" }}>{article.title}</h4>
          {article.description ? (
            <p
              style={{
                fontSize: 12,
                color: "var(--muted)",
                lineHeight: 1.55,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {article.description}
            </p>
          ) : null}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>{article.time}</span>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
              style={{ padding: "4px 10px", fontSize: 11 }}
            >
              Read more →
            </a>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/**
 * Live RSS news feed (free public sources via rss2json).
 * @param {{ onArticlesChange?: (articles: Array) => void }} props
 */
export default function LiveNewsFeed({ onArticlesChange }) {
  const [category, setCategory] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [category, debouncedSearch]);

  const { articles, loading, error, lastUpdated, refresh } = useNews({
    categoryId: category,
    searchQuery: debouncedSearch,
  });

  useEffect(() => {
    onArticlesChange?.(articles);
  }, [articles, onArticlesChange]);

  const visibleArticles = useMemo(
    () => articles.slice(0, visibleCount),
    [articles, visibleCount]
  );

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdated) return null;
    return new Date(lastUpdated).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  }, [lastUpdated]);

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14, alignItems: "center" }}>
        <input
          type="search"
          placeholder="Search live financial news…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ flex: 1, minWidth: 200, maxWidth: 420 }}
          aria-label="Search news"
        />
        <button type="button" className="btn btn-primary" onClick={refresh} disabled={loading} style={{ gap: 6 }}>
          {loading ? <div className="spinner" /> : "↻"} Refresh
        </button>
        {lastUpdatedLabel ? (
          <span style={{ fontSize: 11, color: "var(--muted)" }}>
            Updated {lastUpdatedLabel} · auto every {REFRESH_INTERVAL_MS / 60000}m
          </span>
        ) : null}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {NEWS_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`btn ${category === c.id ? "btn-primary" : "btn-ghost"}`}
            style={{ fontSize: 12, padding: "6px 12px" }}
            onClick={() => setCategory(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {error && !loading ? (
        <div
          className="glass"
          style={{
            padding: 20,
            marginBottom: 16,
            border: "1px solid rgba(255,69,96,0.25)",
            color: "var(--red)",
            fontSize: 13,
          }}
        >
          ⚠️ {error}
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        {loading && articles.length === 0 ? (
          <motion.div
            key="skel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </motion.div>
        ) : articles.length === 0 && !loading ? (
          <motion.div
            key="empty"
            className="glass"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
            <p style={{ fontSize: 14 }}>No articles found. Try another category or search term.</p>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            {visibleArticles.map((a, i) => (
              <NewsCard key={a.id} article={a} index={i} />
            ))}
            {visibleCount < articles.length ? (
              <button
                type="button"
                className="btn btn-ghost"
                style={{ alignSelf: "center", marginTop: 8 }}
                onClick={() => setVisibleCount((n) => n + LOAD_MORE_STEP)}
              >
                Load more ({articles.length - visibleCount} remaining)
              </button>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
