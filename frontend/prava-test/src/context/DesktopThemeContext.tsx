import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { useMantineColorScheme } from "@mantine/core";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  resolvedTheme: "dark",
  toggleTheme: () => {},
  setTheme: () => {},
});

function getSystemPreference(): ResolvedTheme {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "dark";
}

export function DesktopThemeProvider({ children }: { children: React.ReactNode }) {
  const { setColorScheme } = useMantineColorScheme({ keepTransitions: true });

  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const saved = (localStorage.getItem("prava-theme") ||
        localStorage.getItem("mantine-color-scheme-value")) as Theme | null;
      if (saved === "dark" || saved === "light" || saved === "system") {
        return saved;
      }
    }
    return "system";
  });

  const [systemPref, setSystemPref] = useState<ResolvedTheme>(getSystemPreference);

  // Listen for OS system theme changes
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      setSystemPref(e.matches ? "dark" : "light");
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Compute active visual theme
  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (theme === "system") return systemPref;
    return theme;
  }, [theme, systemPref]);

  // Apply visual theme to DOM and Mantine
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    document.documentElement.setAttribute("data-mantine-color-scheme", resolvedTheme);
    document.documentElement.style.colorScheme = resolvedTheme;

    if (resolvedTheme === "dark") {
      document.documentElement.style.backgroundColor = "#0B1220";
      document.documentElement.style.color = "#F8FAFC";
    } else {
      document.documentElement.style.backgroundColor = "#F8FAFC";
      document.documentElement.style.color = "#0F172A";
    }

    try {
      setColorScheme(resolvedTheme);
    } catch {
      // ignore in test / SSR environments
    }

    localStorage.setItem("prava-theme", theme);
    localStorage.setItem("mantine-color-scheme-value", resolvedTheme);
  }, [theme, resolvedTheme, setColorScheme]);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      if (current === "system") {
        return systemPref === "dark" ? "light" : "dark";
      }
      return current === "light" ? "dark" : "light";
    });
  }, [systemPref]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useDesktopTheme = () => useContext(ThemeContext);
export default useDesktopTheme;
