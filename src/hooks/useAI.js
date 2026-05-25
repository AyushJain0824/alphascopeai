import { useCallback, useState } from "react";
import { sendMessage, sendPrompt, DEFAULT_SYSTEM_PROMPT } from "../services/aiService";

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ask = useCallback(async (prompt, systemPrompt = DEFAULT_SYSTEM_PROMPT) => {
    setLoading(true);
    setError(null);
    try {
      const text = await sendPrompt(prompt, systemPrompt);
      return text;
    } catch (e) {
      const msg = e?.message || "AI request failed.";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const chat = useCallback(async (messages, options) => {
    setLoading(true);
    setError(null);
    try {
      const text = await sendMessage(messages, options);
      return text;
    } catch (e) {
      const msg = e?.message || "AI request failed.";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, ask, chat, clearError: () => setError(null) };
}
