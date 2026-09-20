import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";

export type TextSize = "small" | "normal" | "large";
export type FontScale = "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
export type FontWeight = "normal" | "bold";
export type LineHeight = "normal" | "comfortable" | "spacious";
export type LetterSpacing = "normal" | "wide";
export type FontFamily = "default" | "readable";
export type Contrast = "normal" | "high";

export interface AccessibilityPreferences {
  textSize: TextSize;
  boldText: boolean;
  // Legacy backward-compatibility
  fontScale: FontScale;
  fontWeight: FontWeight;
  lineHeight: LineHeight;
  letterSpacing: LetterSpacing;
  fontFamily: FontFamily;
  contrast: Contrast;
}

export interface AccessibilityContextType extends AccessibilityPreferences {
  setTextSize: (size: TextSize) => void;
  setBoldText: (bold: boolean) => void;
  toggleBoldText: () => void;
  // Legacy aliases
  setFontScale: (scale: FontScale) => void;
  setFontWeight: (weight: FontWeight) => void;
  setLineHeight: (lineHeight: LineHeight) => void;
  setLetterSpacing: (letterSpacing: LetterSpacing) => void;
  setFontFamily: (fontFamily: FontFamily) => void;
  setContrast: (contrast: Contrast) => void;
  resetPreferences: () => void;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

export const DEFAULT_ACCESSIBILITY_PREFERENCES: AccessibilityPreferences = {
  textSize: "normal",
  boldText: false,
  fontScale: "md",
  fontWeight: "normal",
  lineHeight: "normal",
  letterSpacing: "normal",
  fontFamily: "default",
  contrast: "normal",
};

export const TEXT_SIZE_VALUES: Record<TextSize, number> = {
  small: 0.9,
  normal: 1.0,
  large: 1.15,
};

const TYPOGRAPHY_STORAGE_KEY = "prava_typography_settings";
const LEGACY_STORAGE_KEY = "prava_accessibility_preferences";

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

function getInitialPreferences(): AccessibilityPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_ACCESSIBILITY_PREFERENCES;
  }
  try {
    const typoRaw = localStorage.getItem(TYPOGRAPHY_STORAGE_KEY);
    if (typoRaw) {
      const parsed = JSON.parse(typoRaw);
      const textSize: TextSize = ["small", "normal", "large"].includes(parsed.textSize)
        ? parsed.textSize
        : "normal";
      const boldText = Boolean(parsed.boldText);
      return {
        ...DEFAULT_ACCESSIBILITY_PREFERENCES,
        textSize,
        boldText,
        fontScale: textSize === "small" ? "sm" : textSize === "large" ? "lg" : "md",
        fontWeight: boldText ? "bold" : "normal",
      };
    }

    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw);
      let textSize: TextSize = "normal";
      if (parsed.textSize && ["small", "normal", "large"].includes(parsed.textSize)) {
        textSize = parsed.textSize;
      } else if (parsed.fontScale === "xs" || parsed.fontScale === "sm") {
        textSize = "small";
      } else if (["lg", "xl", "xxl"].includes(parsed.fontScale)) {
        textSize = "large";
      }

      const boldText = parsed.boldText !== undefined ? Boolean(parsed.boldText) : parsed.fontWeight === "bold";

      return {
        ...DEFAULT_ACCESSIBILITY_PREFERENCES,
        textSize,
        boldText,
        fontScale: textSize === "small" ? "sm" : textSize === "large" ? "lg" : "md",
        fontWeight: boldText ? "bold" : "normal",
      };
    }
  } catch (e) {
    console.warn("Failed to load typography preferences:", e);
  }
  return DEFAULT_ACCESSIBILITY_PREFERENCES;
}

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(getInitialPreferences);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;

    root.setAttribute("data-text-size", preferences.textSize);
    root.setAttribute("data-bold-text", String(preferences.boldText));

    root.setAttribute("data-font-scale", preferences.fontScale);
    root.setAttribute("data-font-weight", preferences.boldText ? "bold" : "normal");

    const scaleVal = String(TEXT_SIZE_VALUES[preferences.textSize] || 1.0);
    root.style.setProperty("--user-font-scale", scaleVal);
    root.style.setProperty("--font-scale", scaleVal);

    try {
      localStorage.setItem(
        TYPOGRAPHY_STORAGE_KEY,
        JSON.stringify({ textSize: preferences.textSize, boldText: preferences.boldText })
      );
      localStorage.setItem(
        LEGACY_STORAGE_KEY,
        JSON.stringify({
          ...preferences,
          textSize: preferences.textSize,
          boldText: preferences.boldText,
          fontScale: preferences.textSize === "small" ? "sm" : preferences.textSize === "large" ? "lg" : "md",
          fontWeight: preferences.boldText ? "bold" : "normal",
        })
      );
    } catch (e) {
      console.warn("Failed to save typography preferences:", e);
    }
  }, [preferences]);

  const setTextSize = useCallback((textSize: TextSize) => {
    setPreferences((prev) => ({
      ...prev,
      textSize,
      fontScale: textSize === "small" ? "sm" : textSize === "large" ? "lg" : "md",
    }));
  }, []);

  const setBoldText = useCallback((boldText: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      boldText,
      fontWeight: boldText ? "bold" : "normal",
    }));
  }, []);

  const toggleBoldText = useCallback(() => {
    setPreferences((prev) => ({
      ...prev,
      boldText: !prev.boldText,
      fontWeight: !prev.boldText ? "bold" : "normal",
    }));
  }, []);

  const setFontScale = useCallback((fontScale: FontScale) => {
    const textSize: TextSize = fontScale === "xs" || fontScale === "sm" ? "small" : fontScale === "md" ? "normal" : "large";
    setTextSize(textSize);
  }, [setTextSize]);

  const setFontWeight = useCallback((fontWeight: FontWeight) => {
    setBoldText(fontWeight === "bold");
  }, [setBoldText]);

  const setLineHeight = useCallback((lineHeight: LineHeight) => {
    setPreferences((prev) => ({ ...prev, lineHeight }));
  }, []);

  const setLetterSpacing = useCallback((letterSpacing: LetterSpacing) => {
    setPreferences((prev) => ({ ...prev, letterSpacing }));
  }, []);

  const setFontFamily = useCallback((fontFamily: FontFamily) => {
    setPreferences((prev) => ({ ...prev, fontFamily }));
  }, []);

  const setContrast = useCallback((contrast: Contrast) => {
    setPreferences((prev) => ({ ...prev, contrast }));
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_ACCESSIBILITY_PREFERENCES);
    try {
      localStorage.removeItem(TYPOGRAPHY_STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch (e) {
      console.warn("Failed to reset typography preferences:", e);
    }
  }, []);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen((prev) => !prev), []);

  const contextValue = useMemo<AccessibilityContextType>(
    () => ({
      ...preferences,
      setTextSize,
      setBoldText,
      toggleBoldText,
      setFontScale,
      setFontWeight,
      setLineHeight,
      setLetterSpacing,
      setFontFamily,
      setContrast,
      resetPreferences,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
    }),
    [
      preferences,
      setTextSize,
      setBoldText,
      toggleBoldText,
      setFontScale,
      setFontWeight,
      setLineHeight,
      setLetterSpacing,
      setFontFamily,
      setContrast,
      resetPreferences,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
    ]
  );

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export function useAccessibility(): AccessibilityContextType {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider");
  }
  return context;
}
