// Main application shell — moved from AlphaScopeAI.jsx

import React, { useState, useCallback } from "react";

import { motion, AnimatePresence } from "framer-motion";

import { buildThemeStylesheet } from "../theme/themeVariables";

import { useAuth } from "../hooks/useAuth";

import { useStocks } from "../hooks/stocks/useStocks";

import { useToast } from "../hooks/useToast";

import { STOCK_CATEGORIES } from "../constants/market";

import PasswordAuthScreen from "../features/auth/components/PasswordAuthScreen";

import SettingsModal from "../features/settings/components/SettingsModal";

import { ThemeToggleButton } from "../components/layout/ThemeToggleButton";

import AIChat from "../features/ai/components/AIChat";

import Icon from "../components/common/Icon";

import TickerTape from "../components/layout/TickerTape";

import DashboardPage from "../pages/Dashboard/DashboardPage";

import StockDetailModal from "../pages/Dashboard/StockDetailModal";

import ScreenerPage from "../pages/Screener/ScreenerPage";

import AIRecommendationsPage from "../pages/AIPicks/AIRecommendationsPage";

import PortfolioPage from "../pages/Portfolio/PortfolioPage";

import WatchlistPage from "../pages/Watchlist/WatchlistPage";

import NewsPage from "../pages/News/NewsPage";

import { NAV_ITEMS } from "./routes";



export default function App() {

  const auth = useAuth();

  const [settingsOpen, setSettingsOpen] = useState(false);

  const [page, setPage] = useState("dashboard");

  const [selectedStock, setSelectedStock] = useState(null);

  const [watchlist, setWatchlist] = useState(["TCS", "RELIANCE", "HDFCBANK", "INFY"]);



  const {

    liveStocks,

    processedStocks,

    liveIndices,

    niftySeries,

    quoteMeta,

    listMeta,

    category,

    setCategory,

    sortMode,

    setSortMode,

    searchInput,

    setSearchInput,

    loadMore,

  } = useStocks();

  const { toast, showToast } = useToast();



  const handleAddToWatchlist = useCallback(

    (stock) => {

      if (!watchlist.includes(stock.symbol)) {

        setWatchlist((prev) => [...prev, stock.symbol]);

        showToast(`${stock.symbol} added to watchlist ⭐`);

      } else {

        showToast(`${stock.symbol} already in watchlist`, "info");

      }

    },

    [watchlist, showToast]

  );



  const handleAddToPortfolio = useCallback(

    (stock) => {

      showToast(`${stock.symbol} added to portfolio 📊`);

      setSelectedStock(null);

    },

    [showToast]

  );



  if (!auth.isAuthenticated) {

    return (

      <>

        <style>{buildThemeStylesheet()}</style>

        <PasswordAuthScreen />

      </>

    );

  }



  const pages = {

    dashboard: (

      <DashboardPage

        stocks={processedStocks}

        stocksUniverse={liveStocks}

        indices={liveIndices}

        niftySeries={niftySeries}

        quoteMeta={quoteMeta}

        listMeta={listMeta}

        sortMode={sortMode}

        setSortMode={setSortMode}

        onLoadMore={loadMore}

        onSelectStock={setSelectedStock}

      />

    ),

    screener: <ScreenerPage stocks={liveStocks} onSelectStock={setSelectedStock} />,

    ai_picks: (

      <AIRecommendationsPage

        stocks={processedStocks}

        listMeta={listMeta}

        onSelectStock={setSelectedStock}

      />

    ),

    portfolio: <PortfolioPage stocks={liveStocks} />,

    watchlist: (

      <WatchlistPage

        stocks={liveStocks}

        watchlist={watchlist}

        setWatchlist={setWatchlist}

        onSelectStock={setSelectedStock}

      />

    ),

    news: <NewsPage />,

    chatbot: <AIChat stocks={liveStocks} />,

  };



  return (

    <>

      <style>{buildThemeStylesheet()}</style>



      <div className="sidebar">

        <div style={{ padding: "20px 16px 14px", borderBottom: "1px solid var(--border)" }}>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

            <div

              style={{

                width: 32,

                height: 32,

                borderRadius: 8,

                background: "linear-gradient(135deg,var(--accent),var(--accent2))",

                display: "flex",

                alignItems: "center",

                justifyContent: "center",

              }}

            >

              <Icon name="zap" size={16} color="white" />

            </div>

            <div>

              <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>

                AlphaScope

              </div>

              <div style={{ fontSize: 10, color: "var(--accent)", fontWeight: 600, letterSpacing: "0.06em" }}>

                AI MARKETS

              </div>

            </div>

          </div>

        </div>



        <div style={{ padding: "12px 0", flex: 1 }}>

          {NAV_ITEMS.map((n) => (

            <button key={n.id} className={`nav-item ${page === n.id ? "active" : ""}`} onClick={() => setPage(n.id)}>

              <Icon name={n.icon} size={15} />

              {n.label}

              {n.id === "watchlist" && watchlist.length > 0 && (

                <span

                  style={{

                    marginLeft: "auto",

                    fontSize: 10,

                    padding: "1px 6px",

                    borderRadius: 99,

                    background: "rgba(0,212,255,0.15)",

                    color: "var(--accent)",

                  }}

                >

                  {watchlist.length}

                </span>

              )}

            </button>

          ))}

        </div>



        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>

            <div

              style={{

                width: 28,

                height: 28,

                borderRadius: 50,

                background: "linear-gradient(135deg,var(--accent2),var(--accent))",

                display: "flex",

                alignItems: "center",

                justifyContent: "center",

                fontSize: 11,

                fontWeight: 700,

                color: "white",

              }}

            >

              {auth.user.name?.[0]?.toUpperCase() || "?"}

            </div>

            <div>

              <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.2 }}>{auth.user.name}</div>

              <span className="badge badge-purple" style={{ fontSize: 9 }}>

                {auth.user.plan.toUpperCase()}

              </span>

            </div>

          </div>

          <button

            className="btn btn-ghost"

            style={{ width: "100%", fontSize: 11, justifyContent: "center", gap: 6 }}

            onClick={() => auth.logout()}

          >

            <Icon name="logout" size={12} /> Sign Out

          </button>

        </div>

      </div>



      <div className="main-content">

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>

              <span className="dot-live" />

              <span style={{ fontSize: 12, color: "var(--muted)" }}>Global · Yahoo Finance</span>

              <span style={{ fontSize: 12, color: "var(--muted)" }}>·</span>

              <span style={{ fontSize: 12, color: "var(--muted)" }} title="Free-tier data can be delayed vs exchange tape.">

                ~20s refresh

              </span>

              {quoteMeta?.liveCount != null && (

                <span style={{ fontSize: 12, color: "var(--muted)" }}>

                  · {quoteMeta.liveCount}/{quoteMeta.total} live

                </span>

              )}

              <span style={{ fontSize: 12, color: "var(--muted)" }}>

                {new Date().toLocaleString("en-IN", {

                  timeZone: "Asia/Kolkata",

                  hour: "2-digit",

                  minute: "2-digit",

                  weekday: "short",

                  month: "short",

                  day: "numeric",

                })}

              </span>

            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

              <ThemeToggleButton />

              <button type="button" className="btn btn-ghost" style={{ padding: 8 }} aria-label="Notifications">

                <Icon name="bell" size={16} />

              </button>

              <button

                type="button"

                className="btn btn-ghost"

                style={{ padding: 8 }}

                aria-label="Settings"

                onClick={() => setSettingsOpen(true)}

              >

                <Icon name="settings" size={16} />

              </button>

            </div>

          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>

            <Icon name="search" size={16} color="var(--muted)" style={{ flexShrink: 0 }} />

            <input

              type="search"

              placeholder="Search symbol, company, sector, or market…"

              value={searchInput}

              onChange={(e) => setSearchInput(e.target.value)}

              aria-label="Search stocks"

              style={{ flex: 1, minWidth: 200, maxWidth: 420, padding: "8px 12px" }}

            />

            {searchInput.trim() ? (

              <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setSearchInput("")}>

                Clear

              </button>

            ) : null}

            <span style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>

              {processedStocks.length} / {liveStocks.length} stocks

            </span>

          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>

            {STOCK_CATEGORIES.map((c) => (

              <button

                key={c.id}

                type="button"

                className={`btn ${category === c.id ? "btn-primary" : "btn-ghost"}`}

                style={{ fontSize: 11, padding: "4px 10px" }}

                onClick={() => setCategory(c.id)}

              >

                {c.label}

              </button>

            ))}

          </div>

        </div>



        <div

          style={{

            marginBottom: 20,

            borderRadius: "var(--radius)",

            overflow: "hidden",

            border: "1px solid var(--border)",

          }}

        >

          <TickerTape stocks={liveStocks} />

        </div>



        <AnimatePresence mode="wait">

          <motion.div

            key={page}

            initial={{ opacity: 0, y: 12 }}

            animate={{ opacity: 1, y: 0 }}

            exit={{ opacity: 0, y: -12 }}

            transition={{ duration: 0.2 }}

          >

            {pages[page]}

          </motion.div>

        </AnimatePresence>

      </div>



      <AnimatePresence>

        {selectedStock && (

          <StockDetailModal

            stock={selectedStock}

            onClose={() => setSelectedStock(null)}

            onAddToWatchlist={handleAddToWatchlist}

            onAddToPortfolio={handleAddToPortfolio}

          />

        )}

      </AnimatePresence>



      <AnimatePresence>

        {toast && (

          <motion.div

            initial={{ opacity: 0, y: 20, x: "-50%" }}

            animate={{ opacity: 1, y: 0, x: "-50%" }}

            exit={{ opacity: 0, y: 20, x: "-50%" }}

            style={{

              position: "fixed",

              bottom: 24,

              left: "50%",

              zIndex: 2000,

              padding: "10px 20px",

              borderRadius: 10,

              background: "var(--bg2)",

              border: "1px solid var(--border2)",

              fontSize: 13,

              fontWeight: 500,

              boxShadow: "var(--toast-shadow)",

              whiteSpace: "nowrap",

              display: "flex",

              alignItems: "center",

              gap: 8,

            }}

          >

            {toast.msg}

          </motion.div>

        )}

      </AnimatePresence>



      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} onNotify={showToast} />

    </>

  );

}

