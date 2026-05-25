/**
 * One-time refactor helper: splits src/AlphaScopeAI.jsx into modular files.
 * Preserves exact line content from the monolith.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = path.join(root, "src");
const monoPath = path.join(src, "AlphaScopeAI.jsx");
const lines = fs.readFileSync(monoPath, "utf8").split(/\r?\n/);

function slice(start, end) {
  return lines.slice(start - 1, end).join("\n");
}

function write(rel, content, header = "") {
  const file = path.join(src, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, header + content + (content.endsWith("\n") ? "" : "\n"), "utf8");
  console.log("wrote", rel);
}

// ── Data (moved from AlphaScopeAI.jsx) ──
write(
  "data/stocksList.js",
  slice(20, 56).replace(/^const STOCKS/, "export const STOCKS"),
  "// Stock seed data — moved from AlphaScopeAI.jsx\n"
);

write(
  "data/marketIndices.js",
  slice(58, 75).replace(/^const /gm, "export const "),
  "// Index definitions — moved from AlphaScopeAI.jsx\n"
);

write(
  "data/mockNews.js",
  slice(215, 224).replace(/^const NEWS/, "export const NEWS"),
  "// Static news seed — moved from AlphaScopeAI.jsx\n"
);

write(
  "data/sectors.js",
  slice(226, 235).replace(/^const SECTORS/, "export const SECTORS"),
  "// Sector heatmap seed — moved from AlphaScopeAI.jsx\n"
);

write(
  "constants/market.js",
  `// Yahoo poll interval — moved from AlphaScopeAI.jsx\nexport const YAHOO_MARKET_POLL_MS = 15_000;\n`
);

// stockService — functions from monolith
const stockServiceBody = [
  slice(79, 90),
  slice(92, 99).replace(/^async function fetchYahooQuoteResults/, "export async function fetchYahooQuoteResults"),
  slice(102, 120).replace(/^async function fetchYahooChartAsQuote/, "export async function fetchYahooChartAsQuote"),
  slice(122, 136).replace(/^async function fetchNiftyIntradaySeries/, "export async function fetchNiftyIntradaySeries"),
  slice(138, 155).replace(/^function indexRowsFromQuotes/, "export function indexRowsFromQuotes"),
  slice(157, 170).replace(/^function mergeStocksWithYahoo/, "export function mergeStocksWithYahoo"),
  slice(172, 193).replace(/^async function fetchStockDailyHistory/, "export async function fetchStockDailyHistory"),
  slice(197, 213).replace(/^function genPriceHistory/, "export function genPriceHistory"),
].join("\n\n");

write(
  "services/stocks/stockService.js",
  `// Yahoo Finance & stock helpers — moved from AlphaScopeAI.jsx\nimport { formatIndianVolume } from "../../utils/formatters.js";\n\n${stockServiceBody}\n`,
);

const formatVol = slice(79, 90).replace(/^function formatIndianVolume/, "export function formatIndianVolume");
write(
  "utils/formatters.js",
  [
    formatVol,
    slice(238, 252)
      .replace(/^const fmt/, "export const fmt")
      .replace(/^const fmtPct/, "export const fmtPct")
      .replace(/^const colorChg/, "export const colorChg")
      .replace(/^const scoreColor/, "export const scoreColor")
      .replace(/^const signalBadge/, "export const signalBadge"),
  ].join("\n\n"),
  "// Formatting helpers — moved from AlphaScopeAI.jsx\n"
);

write(
  "utils/stockFilters.js",
  slice(245, 252).replace(/^function filterStocksByQuery/, "export function filterStocksByQuery"),
  "// Stock search filter — moved from AlphaScopeAI.jsx\n"
);

write(
  "features/ai/utils/callAI.js",
  slice(360, 363).replace(/^const callAI/, "export const callAI"),
  `// AI prompt wrapper — moved from AlphaScopeAI.jsx\nimport { sendPrompt } from "../../../services/aiService.js";\n\n`
);

// UI components
const uiCommonHeader = `import React from "react";\nimport { scoreColor } from "../../utils/formatters.js";\nimport { fmt } from "../../utils/formatters.js";\n\n`;

write(
  "components/common/Icon.jsx",
  slice(255, 284).replace(/^const Icon/, "export default function Icon"),
  "// Inline SVG icons — moved from AlphaScopeAI.jsx\nimport React from \"react\";\n\n"
);

write(
  "components/ui/ScoreRing.jsx",
  slice(287, 307).replace(/^const ScoreRing/, "export default function ScoreRing"),
  "// Score ring — moved from AlphaScopeAI.jsx\nimport React from \"react\";\nimport { scoreColor } from \"../../utils/formatters.js\";\n\n"
);

write(
  "components/ui/Sparkline.jsx",
  slice(310, 325).replace(/^const Sparkline/, "export default function Sparkline"),
  "// Sparkline — moved from AlphaScopeAI.jsx\nimport React from \"react\";\n\n"
);

write(
  "components/ui/CustomTooltip.jsx",
  slice(328, 340).replace(/^const CustomTooltip/, "export default function CustomTooltip"),
  "// Recharts tooltip — moved from AlphaScopeAI.jsx\nimport React from \"react\";\nimport { fmt } from \"../../utils/formatters.js\";\n\n"
);

write(
  "components/ui/ScoreBar.jsx",
  slice(343, 357).replace(/^const ScoreBar/, "export default function ScoreBar"),
  `${uiCommonHeader}`
);

write(
  "components/layout/TickerTape.jsx",
  slice(368, 390).replace(/^const TickerTape/, "export default function TickerTape"),
  `// Ticker tape — moved from AlphaScopeAI.jsx\nimport React from "react";\nimport Icon from "../common/Icon.jsx";\nimport { fmt, fmtPct, colorChg } from "../../utils/formatters.js";\n\n`
);

const pageImports = `import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
`;

const dashboardExtra = `import { SECTORS } from "../../data/sectors.js";
`;

write(
  "pages/Dashboard/DashboardPage.jsx",
  slice(395, 584).replace(/^const DashboardPage/, "export default function DashboardPage"),
  `${pageImports}${dashboardExtra}`
);

const modalExtra = `import { callAI } from "../../features/ai/utils/callAI.js";
import { fetchStockDailyHistory, genPriceHistory } from "../../services/stocks/stockService.js";
`;

write(
  "pages/Dashboard/StockDetailModal.jsx",
  slice(589, 843).replace(/^const StockDetailModal/, "export default function StockDetailModal"),
  `${pageImports}${modalExtra}`
);

const screenerExtra = `import { callAI } from "../../features/ai/utils/callAI.js";
`;

write(
  "pages/Screener/ScreenerPage.jsx",
  slice(848, 1048).replace(/^const ScreenerPage/, "export default function ScreenerPage"),
  `${pageImports}${screenerExtra}`
);

write(
  "pages/AIPicks/AIRecommendationsPage.jsx",
  slice(1053, 1200).replace(/^const AIRecommendationsPage/, "export default function AIRecommendationsPage"),
  `${pageImports}import { callAI } from "../../features/ai/utils/callAI.js";\n`
);

write(
  "pages/Portfolio/PortfolioPage.jsx",
  slice(1205, 1428).replace(/^const PortfolioPage/, "export default function PortfolioPage"),
  `${pageImports}import { callAI } from "../../features/ai/utils/callAI.js";\n`
);

write(
  "pages/Watchlist/WatchlistPage.jsx",
  slice(1433, 1549).replace(/^const WatchlistPage/, "export default function WatchlistPage"),
  `${pageImports}`
);

const newsPageHeader = `${pageImports}import LiveNewsFeed from "../../features/news/components/LiveNewsFeed.jsx";
import { callAI } from "../../features/ai/utils/callAI.js";
`;

write(
  "pages/News/NewsPage.jsx",
  slice(1554, 1630).replace(/^const NewsPage/, "export default function NewsPage"),
  newsPageHeader
);

console.log("split complete");
