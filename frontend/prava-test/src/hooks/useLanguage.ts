import { useState, useEffect, useCallback } from "react";
import i18n from "i18next";
import type { LanguageKey, LocalizedText } from "../types";

export function getLocalizedText(
  text: LocalizedText | string | undefined,
  lang: LanguageKey,
): string {
  if (!text) return "";
  if (typeof text === "string") return text;
  return text[lang] || text.uzl || "";
}

export function useLanguage() {
  const [lang, setLang] = useState<LanguageKey>(
    (i18n.language || "uzl") as LanguageKey,
  );

  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setLang(lng as LanguageKey);
    };

    i18n.on("languageChanged", handleLanguageChanged);
    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, []);

  const localize = useCallback(
    (text: LocalizedText | string | undefined) => getLocalizedText(text, lang),
    [lang],
  );

  return { lang, localize };
}
