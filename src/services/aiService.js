/**
 * OpenRouter chat API — https://openrouter.ai/docs
 * API key: VITE_OPENROUTER_API_KEY in project root `.env` (never commit `.env`).
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
export const DEFAULT_MODEL = "openai/gpt-4o-mini";

export const DEFAULT_SYSTEM_PROMPT =
  "You are AlphaScopeAI, an advanced AI-powered stock market and financial assistant.";

function getApiKey() {
  const key = import.meta.env.VITE_OPENROUTER_API_KEY;
  return typeof key === "string" ? key.trim() : "";
}

/**
 * @param {Array<{ role: 'user' | 'assistant', content: string }>} messages
 * @param {{ system?: string, model?: string, maxTokens?: number }} [options]
 * @returns {Promise<string>}
 */
export async function sendMessage(messages, options = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      "OpenRouter API key is missing. Add VITE_OPENROUTER_API_KEY to `.env` next to package.json and restart the dev server."
    );
  }

  const system = options.system ?? DEFAULT_SYSTEM_PROMPT;
  const model = options.model ?? DEFAULT_MODEL;
  const max_tokens = options.maxTokens ?? 1000;

  let res;
  try {
    res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "http://localhost",
        "X-Title": "AlphaScope AI",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: system }, ...messages],
        max_tokens,
      }),
    });
  } catch {
    throw new Error("Network error. Check your connection and try again.");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      data?.error?.message ||
      data?.error ||
      (typeof data?.message === "string" ? data.message : null) ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text || typeof text !== "string") {
    throw new Error("Empty response from AI.");
  }
  return text.trim();
}

/**
 * Single-turn helper (screener, news, stock insights, etc.).
 * @param {string} prompt
 * @param {string} [systemPrompt]
 */
export async function sendPrompt(prompt, systemPrompt = DEFAULT_SYSTEM_PROMPT) {
  return sendMessage([{ role: "user", content: prompt }], { system: systemPrompt });
}
