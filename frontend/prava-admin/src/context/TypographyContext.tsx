import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";

export type TextSize = "small" | "standard" | "large";

interface TypographyContextType {
  textSize: TextSize;
  boldText: boolean;
  setTextSize: (size: TextSize) => void;
  setBoldText: (bold: boolean) => void;
}

const TypographyContext = createContext<TypographyContextType>({
  textSize: "standard",
  boldText: false,
  setTextSize: () => {},
  setBoldText: () => {},
});

export function TypographyProvider({ children }: { children: React.ReactNode }) {
  const [textSize, setTextSizeState] = useState<TextSize>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("prava-text-size") as TextSize | null;
      if (saved === "small" || saved === "standard" || saved === "large") {
        return saved;
      }
    }
    return "standard";
  });

  const [boldText, setBoldTextState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("prava-bold-text") === "true";
    }
    return false;
  });

  // Apply typography attributes to root HTML element
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-text-size", textSize);
    document.documentElement.setAttribute("data-bold-text", String(boldText));

    try {
      localStorage.setItem("prava-text-size", textSize);
      localStorage.setItem("prava-bold-text", String(boldText));
    } catch {
      // ignore storage quota / private browsing errors
    }
  }, [textSize, boldText]);

  const setTextSize = useCallback((size: TextSize) => {
    setTextSizeState(size);
  }, []);

  const setBoldText = useCallback((bold: boolean) => {
    setBoldTextState(bold);
  }, []);

  const value = useMemo(
    () => ({ textSize, boldText, setTextSize, setBoldText }),
    [textSize, boldText, setTextSize, setBoldText]
  );

  return (
    <TypographyContext.Provider value={value}>
      {children}
    </TypographyContext.Provider>
  );
}

export function useTypography() {
  return useContext(TypographyContext);
}
