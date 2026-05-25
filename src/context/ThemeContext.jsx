import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { THEME_STORAGE_KEY } from "../theme/themeVariables";

const ThemeContext = createContext(null);

function readStoredTheme() {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    /* ignore */
  }
  return "dark";
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => readStoredTheme());

  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
    document.documentElement.classList.add("theme-root-transition");
    const id = window.setTimeout(() => {
      document.documentElement.classList.remove("theme-root-transition");
    }, 400);
    return () => window.clearTimeout(id);
  }, [theme]);

  const setTheme = useCallback((next) => {
    setThemeState(next === "light" ? "light" : "dark");
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const chartGridStroke = "var(--chart-grid)";

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      chartGridStroke,
      isDark: theme === "dark",
    }),
    [theme, setTheme, toggleTheme, chartGridStroke]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeContext must be used within ThemeProvider");
  return ctx;
}
