import React, { useState, useEffect, useRef, useCallback } from "react";
import { sendMessage, DEFAULT_SYSTEM_PROMPT } from "../../../services/aiService";

function IconZap({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconSend({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

const WELCOME =
  "👋 Hello! I'm AlphaScope AI, your personal Indian stock market assistant.\n\nI can help you with:\n• Finding best investment opportunities\n• Analyzing specific stocks\n• Comparing companies\n• Market insights and trends\n• Technical & fundamental analysis\n\nWhat would you like to explore today?";

const SUGGESTIONS = [
  "Best undervalued stocks today?",
  "Which IT stocks have BUY signal?",
  "Compare TCS vs Infosys",
  "Best long-term picks under ₹1000?",
  "Top momentum stocks this week?",
  "Stocks with highest ROE in NIFTY 50?",
];

export default function AIChat({ stocks = [] }) {
  const [messages, setMessages] = useState([{ role: "ai", text: WELCOME }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const buildStockContext = useCallback(() => {
    if (!stocks?.length) return "";
    return stocks
      .map(
        (s) =>
          `${s.symbol}(${s.sector}): ₹${s.price}, PE=${s.pe}, ROE=${s.roe}%, RSI=${s.rsi}, Score=${s.score}, Signal=${s.signal}, QGrowth=${s.qtrGrowth}%`
      )
      .join("\n");
  }, [stocks]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");

    const nextUi = [...messages, { role: "user", text: msg }];
    setMessages(nextUi);
    setLoading(true);

    const ctx = buildStockContext();
    const system = ctx
      ? `${DEFAULT_SYSTEM_PROMPT} You are an expert Indian stock market chatbot with access to data on ${stocks.length} NSE stocks. Current market data:\n${ctx}\n\nProvide specific, actionable advice. Use ₹ symbol. Be concise but thorough. Use bullet points for lists.`
      : `${DEFAULT_SYSTEM_PROMPT} Focus on Indian equities (NSE), portfolios, and market trends. Use ₹ for prices.`;

    let start = 0;
    while (start < nextUi.length && nextUi[start].role !== "user") start += 1;
    const apiMessages = nextUi
      .slice(start)
      .slice(-12)
      .map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      }));

    try {
      const reply = await sendMessage(apiMessages, { system, maxTokens: 800 });
      setMessages((m) => [...m, { role: "ai", text: reply }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text: `⚠️ ${e?.message || "AI unavailable. Add VITE_OPENROUTER_API_KEY to .env and restart the dev server."}`,
        },
      ]);
    }
    setLoading(false);
  };

  return (
    <div style={{ height: "calc(100vh - 80px)", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontFamily: "var(--font-head)", fontSize: 26, fontWeight: 700, marginBottom: 4 }}>AlphaScope AI Assistant</h1>
        <p style={{ color: "var(--muted)", fontSize: 13 }}>Ask anything about Indian stocks · Powered by OpenRouter</p>
      </div>

      {messages.length <= 1 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {SUGGESTIONS.map((s, i) => (
            <button key={i} type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => send(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="glass" style={{ flex: 1, padding: 20, overflowY: "auto", marginBottom: 16 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              marginBottom: 16,
            }}
          >
            {m.role === "ai" && (
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: "linear-gradient(135deg,var(--accent),var(--accent2))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 10,
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                <IconZap />
              </div>
            )}
            <div className={`chat-bubble ${m.role === "user" ? "chat-user" : "chat-ai"}`}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "linear-gradient(135deg,var(--accent),var(--accent2))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconZap />
            </div>
            <div className="chat-bubble chat-ai">
              <div className="typing-dots">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="glass" style={{ padding: 12, display: "flex", gap: 10 }}>
        <input
          placeholder="Ask about any Indian stock, sector, or investment strategy..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          style={{ flex: 1 }}
          disabled={loading}
        />
        <button type="button" className="btn btn-primary" onClick={() => send()} disabled={loading || !input.trim()}>
          <IconSend /> Send
        </button>
      </div>
    </div>
  );
}