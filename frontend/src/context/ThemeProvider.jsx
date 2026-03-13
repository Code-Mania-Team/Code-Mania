import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const THEME_STORAGE_KEY = "cm_theme";

const ThemeContext = createContext(null);

function getSystemTheme() {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyThemeToDom(theme) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
    return getSystemTheme();
  });

  const [isFollowingSystem, setIsFollowingSystem] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return !(stored === "light" || stored === "dark");
  });

  useEffect(() => {
    applyThemeToDom(theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isFollowingSystem) return;

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setTheme(mql.matches ? "dark" : "light");

    try {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    } catch {
      // Safari < 14
      mql.addListener(onChange);
      return () => mql.removeListener(onChange);
    }
  }, [isFollowingSystem]);

  const setThemeExplicit = useCallback((nextTheme) => {
    const normalized = nextTheme === "light" ? "light" : "dark";
    setTheme(normalized);
    setIsFollowingSystem(false);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, normalized);
    } catch {
      // ignore
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeExplicit(theme === "dark" ? "light" : "dark");
  }, [setThemeExplicit, theme]);

  const value = useMemo(
    () => ({ theme, setTheme: setThemeExplicit, toggleTheme }),
    [theme, setThemeExplicit, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
