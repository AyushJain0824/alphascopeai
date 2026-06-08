// AI prompt wrapper — moved from AlphaScopeAI.jsx
import { sendPrompt } from "../../../services/aiService.js";

export const callAI = async (
  prompt,
  systemPrompt = "You are AlphaScope AI, an expert Indian stock market analyst. Respond concisely with actionable insights. Use ₹ for Indian Rupees. Format nicely with bullet points where appropriate."
) => sendPrompt(prompt, systemPrompt);
