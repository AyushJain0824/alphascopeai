import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

/** Proxies /api/anthropic/* → https://api.anthropic.com/* and adds auth headers (key never sent to the browser). */
function anthropicProxy(apiKey) {
  const key = (apiKey || "").trim();
  return {
    target: "https://api.anthropic.com",
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/anthropic/, ""),
    configure: (proxy) => {
      proxy.on("proxyReq", (proxyReq) => {
        if (key) {
          proxyReq.setHeader("x-api-key", key);
          proxyReq.setHeader("anthropic-version", "2023-06-01");
        }
      });
    },
  };
}

/** Respond locally when the key is missing so Anthropic never sees a headerless request. */
function anthropicMissingKeyMiddleware(apiKey) {
  const key = (apiKey || "").trim();
  const fn = (req, res, next) => {
    const path = (req.url || "").split("?")[0];
    if (!path.startsWith("/api/anthropic")) return next();
    if (key) return next();
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        type: "error",
        error: {
          type: "configuration_error",
          message:
            "ANTHROPIC_API_KEY is missing or empty. Add it to the project root `.env` file (same folder as package.json), then restart `npm run dev` or `npm run preview`. Get a key at https://console.anthropic.com/",
        },
      })
    );
  };
  fn._alphascopeAnthropicGuard = true;
  return fn;
}

/** Proxies /api/yahoo/* → query1.finance.yahoo.com (quotes & charts; avoids browser CORS). */
function yahooProxy() {
  return {
    target: "https://query1.finance.yahoo.com",
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/yahoo/, ""),
    configure: (proxy) => {
      proxy.on("proxyReq", (proxyReq) => {
        proxyReq.setHeader(
          "User-Agent",
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        );
        proxyReq.setHeader("Referer", "https://finance.yahoo.com/");
        proxyReq.setHeader("Origin", "https://finance.yahoo.com");
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const anthropicKey = (env.ANTHROPIC_API_KEY || "").trim();
  const proxy = {
    "/api/anthropic": anthropicProxy(anthropicKey),
    "/api/yahoo": yahooProxy(),
  };

  const guard = anthropicMissingKeyMiddleware(anthropicKey);

  return {
    plugins: [
      react(),
      {
        name: "alphascope-anthropic-key-guard",
        enforce: "pre",
        configureServer(server) {
          const stack = server.middlewares.stack;
          if (stack?.some((l) => l.handle && l.handle._alphascopeAnthropicGuard)) return;
          stack?.unshift({ route: "", handle: guard });
        },
        configurePreviewServer(server) {
          const stack = server.middlewares.stack;
          if (stack?.some((l) => l.handle && l.handle._alphascopeAnthropicGuard)) return;
          stack?.unshift({ route: "", handle: guard });
        },
      },
    ],
    server: { proxy },
    preview: { proxy },
  };
});
