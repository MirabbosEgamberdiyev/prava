import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import Cookies from "js-cookie";
import i18n from "../utils/i18n";
import { useAuth } from "../auth/AuthContext";
import type {
  LocalizedText,
  OfflineQuestion,
  OfflineTopic,
  QuestionOption,
} from "../types";
import { OFFICIAL_TOPIC_MAP, findOfficialTopic } from "../constants/topics";
import { latinToCyrillic, cyrillicToLatin } from "../utils/transliterate";

export type AppLanguage = "uzl" | "uzc" | "ru";

export interface LanguageOption {
  code: AppLanguage;
  aliases: string[];
  label: string;
  short: string;
  flagCode: string;
}

export const APP_LANGUAGES: LanguageOption[] = [
  {
    code: "uzl",
    aliases: ["uz", "uz-latn", "uz_latn", "uz-uz", "uz_uz", "uzl"],
    label: "O‘zbekcha (Lotin)",
    short: "O‘zbek",
    flagCode: "UZ",
  },
  {
    code: "uzc",
    aliases: ["uzc", "uz-cyrl", "uz_cyrl", "cyrl"],
    label: "Ўзбекча (Кирилл)",
    short: "Ўзбек",
    flagCode: "ЎЗ",
  },
  {
    code: "ru",
    aliases: ["ru", "ru-ru", "ru_ru", "rus", "russian"],
    label: "Русский",
    short: "Русский",
    flagCode: "RU",
  },
];

/**
 * Normalizes any language code string into the canonical AppLanguage: "uzl" | "uzc" | "ru".
 */
export function normalizeLanguage(raw: string | null | undefined): AppLanguage {
  if (!raw) return "uzl";
  const clean = raw.trim().toLowerCase();

  for (const item of APP_LANGUAGES) {
    if (item.code === clean || item.aliases.includes(clean)) {
      return item.code;
    }
  }

  if (clean.startsWith("ru")) return "ru";
  if (clean.includes("cyrl") || clean === "uzc") return "uzc";
  if (clean.startsWith("uz")) return "uzl";

  return "uzl";
}

export interface LanguageContextType {
  language: AppLanguage;
  lang: AppLanguage;
  setLanguage: (lang: string) => Promise<void>;
  languages: LanguageOption[];
  currentLanguageOption: LanguageOption;
  localize: (text: LocalizedText | Record<string, string> | string | undefined | null) => string;
  localizeTopic: (topic: OfflineTopic | null | undefined) => string;
  localizeQuestion: (q: OfflineQuestion | null | undefined) => string;
  localizeOption: (opt: QuestionOption | null | undefined) => string;
  localizeExplanation: (q: OfflineQuestion | null | undefined) => string | null;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * Resolves initial language by strict priority:
 * 1. User Profile Language (if authenticated)
 * 2. localStorage ("prava_lang" or "i18nextLng")
 * 3. Cookie ("i18next")
 * 4. Browser Navigator Language
 * 5. Fallback: "uzl"
 */
function resolveInitialLanguage(userPreferred?: string | null): AppLanguage {
  try {
    const fromLocal =
      localStorage.getItem("prava_lang") || localStorage.getItem("i18nextLng");
    if (fromLocal) return normalizeLanguage(fromLocal);
  } catch {
    // ignore
  }

  if (userPreferred) {
    return normalizeLanguage(userPreferred);
  }

  const fromCookie = Cookies.get("i18next");
  if (fromCookie) return normalizeLanguage(fromCookie);

  if (typeof navigator !== "undefined" && navigator.language) {
    return normalizeLanguage(navigator.language);
  }

  return "uzl";
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const initial = resolveInitialLanguage(user?.preferredLanguage);
    return initial;
  });

  // Sync with user's preferred language on initial login ONLY if localStorage doesn't have an explicit user choice
  useEffect(() => {
    if (user?.preferredLanguage) {
      const explicitChoice = localStorage.getItem("prava_lang") || localStorage.getItem("i18nextLng");
      if (!explicitChoice) {
        const userLang = normalizeLanguage(user.preferredLanguage);
        if (userLang !== language) {
          setLanguage(userLang);
        }
      }
    }
  }, [user?.preferredLanguage]);

  // Synchronize i18next instance and document language on initial mount
  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, []);

  const setLanguage = useCallback(async (newLang: string): Promise<void> => {
    const normalized = normalizeLanguage(newLang);
    setLanguageState(normalized);

    // 1. Sync i18next instance
    await i18n.changeLanguage(normalized);

    // 2. Persist to localStorage and sync user object if present
    try {
      localStorage.setItem("prava_lang", normalized);
      localStorage.setItem("i18nextLng", normalized);
      const rawUser = localStorage.getItem("userData");
      if (rawUser) {
        try {
          const parsed = JSON.parse(rawUser);
          if (parsed && typeof parsed === "object") {
            parsed.preferredLanguage = normalized;
            localStorage.setItem("userData", JSON.stringify(parsed));
          }
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }

    // 3. Persist to Cookie (cross-subdomain support between pravaonline.uz and web.pravaonline.uz)
    const isPravaDomain =
      typeof window !== "undefined" &&
      window.location.hostname.endsWith("pravaonline.uz");
    Cookies.set("i18next", normalized, {
      expires: 365,
      path: "/",
      domain: isPravaDomain ? ".pravaonline.uz" : undefined,
      sameSite: "Lax",
    });

    // 4. Update DOM attribute
    if (typeof document !== "undefined") {
      document.documentElement.lang = normalized;
    }

    // 5. Dispatch global window event for components outside React context
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("appLanguageChanged", { detail: normalized })
      );
    }
  }, []);

  // Listen to external i18n language changes (e.g. from tests or third-party adapters)
  useEffect(() => {
    const handleExternal = (lng: string) => {
      const normalized = normalizeLanguage(lng);
      setLanguageState((prev) => (prev !== normalized ? normalized : prev));
    };

    i18n.on("languageChanged", handleExternal);
    return () => {
      i18n.off("languageChanged", handleExternal);
    };
  }, []);

  const currentLanguageOption = useMemo(
    () => APP_LANGUAGES.find((l) => l.code === language) ?? APP_LANGUAGES[0],
    [language]
  );

  // Localization helper methods
  const localize = useCallback(
    (text: LocalizedText | Record<string, string> | string | undefined | null): string => {
      if (!text) return "";
      if (typeof text === "string") return text;
      const map = text as Record<string, string>;
      const direct = map[language];
      if (direct && direct.trim() !== "") return direct;
      if (language === "uzc") {
        const uzlVal = map["uzl"] || map["uz"];
        if (uzlVal) return latinToCyrillic(uzlVal);
      }
      if (language === "uzl") {
        const uzcVal = map["uzc"];
        if (uzcVal) return cyrillicToLatin(uzcVal);
      }
      return map["uzl"] || map["uz"] || map["ru"] || "";
    },
    [language]
  );

  const localizeTopic = useCallback(
    (topic: any): string => {
      if (!topic) return "";
      const official = findOfficialTopic(topic);
      const nameRu =
        topic.name_ru ||
        topic.nameRu ||
        (typeof topic.name === "object" ? topic.name?.ru : null) ||
        official?.name_ru;
      const nameUzc =
        topic.name_uzc ||
        topic.nameUzc ||
        (typeof topic.name === "object" ? topic.name?.uzc : null) ||
        official?.name_uzc;
      const nameUzl =
        topic.name_uzl ||
        topic.nameUzl ||
        (typeof topic.name === "object" ? topic.name?.uzl : null) ||
        official?.name_uzl ||
        (typeof topic.name === "string" ? topic.name : "");

      if (language === "uzc") {
        if (nameUzc && String(nameUzc).trim()) return String(nameUzc);
        if (nameUzl && String(nameUzl).trim()) return latinToCyrillic(String(nameUzl));
        if (nameRu && String(nameRu).trim()) return String(nameRu);
        return "";
      }
      if (language === "ru") {
        if (nameRu && String(nameRu).trim()) return String(nameRu);
        if (nameUzl && String(nameUzl).trim()) return String(nameUzl);
        if (nameUzc && String(nameUzc).trim()) return cyrillicToLatin(String(nameUzc));
        return "";
      }
      // uzl
      if (nameUzl && String(nameUzl).trim()) return String(nameUzl);
      if (nameUzc && String(nameUzc).trim()) return cyrillicToLatin(String(nameUzc));
      if (nameRu && String(nameRu).trim()) return String(nameRu);
      return "";
    },
    [language]
  );

  const localizeQuestion = useCallback(
    (q: OfflineQuestion | null | undefined): string => {
      if (!q) return "";
      if (language === "uzc") {
        if (q.text_uzc && q.text_uzc.trim()) return q.text_uzc;
        if (q.text_uzl && q.text_uzl.trim()) return latinToCyrillic(q.text_uzl);
        if (q.text_ru && q.text_ru.trim()) return q.text_ru;
        return "";
      }
      if (language === "ru") return q.text_ru || q.text_uzl;
      if (q.text_uzl && q.text_uzl.trim()) return q.text_uzl;
      if (q.text_uzc && q.text_uzc.trim()) return cyrillicToLatin(q.text_uzc);
      return q.text_ru || "";
    },
    [language]
  );

  const localizeOption = useCallback(
    (opt: QuestionOption | null | undefined): string => {
      if (!opt) return "";
      if (language === "uzc") {
        if (opt.uzc && opt.uzc.trim()) return opt.uzc;
        if (opt.uzl && opt.uzl.trim()) return latinToCyrillic(opt.uzl);
        if (opt.ru && opt.ru.trim()) return opt.ru;
        return "";
      }
      if (language === "ru") return opt.ru || opt.uzl;
      if (opt.uzl && opt.uzl.trim()) return opt.uzl;
      if (opt.uzc && opt.uzc.trim()) return cyrillicToLatin(opt.uzc);
      return opt.ru || "";
    },
    [language]
  );

  const localizeExplanation = useCallback(
    (q: OfflineQuestion | null | undefined): string | null => {
      if (!q) return null;
      if (language === "uzc") {
        if (q.explanation_uzc && q.explanation_uzc.trim()) return q.explanation_uzc;
        if (q.explanation_uzl && q.explanation_uzl.trim()) return latinToCyrillic(q.explanation_uzl);
        if (q.explanation_ru && q.explanation_ru.trim()) return q.explanation_ru;
        return null;
      }
      if (language === "ru") return q.explanation_ru || q.explanation_uzl || null;
      if (q.explanation_uzl && q.explanation_uzl.trim()) return q.explanation_uzl;
      if (q.explanation_uzc && q.explanation_uzc.trim()) return cyrillicToLatin(q.explanation_uzc);
      return q.explanation_ru ?? null;
    },
    [language]
  );

  const contextValue = useMemo<LanguageContextType>(
    () => ({
      language,
      lang: language,
      setLanguage,
      languages: APP_LANGUAGES,
      currentLanguageOption,
      localize,
      localizeTopic,
      localizeQuestion,
      localizeOption,
      localizeExplanation,
    }),
    [
      language,
      setLanguage,
      currentLanguageOption,
      localize,
      localizeTopic,
      localizeQuestion,
      localizeOption,
      localizeExplanation,
    ]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    // Safe fallback if used outside provider during isolated tests
    const normalized = normalizeLanguage(i18n.language || "uzl");
    return {
      language: normalized,
      lang: normalized,
      setLanguage: async (l: string) => {
        const norm = normalizeLanguage(l);
        await i18n.changeLanguage(norm);
      },
      languages: APP_LANGUAGES,
      currentLanguageOption:
        APP_LANGUAGES.find((l) => l.code === normalized) ?? APP_LANGUAGES[0],
      localize: (text) => {
        if (!text) return "";
        if (typeof text === "string") return text;
        return (text as any)[normalized] || (text as any).uzl || "";
      },
      localizeTopic: (tp) => {
        if (!tp) return "";
        const official = tp.id != null ? OFFICIAL_TOPIC_MAP[tp.id] : undefined;
        if (normalized === "uzc") {
          return (
            tp.name_uzc ||
            official?.name_uzc ||
            tp.name_uzl ||
            official?.name_uzl ||
            tp.name_ru ||
            official?.name_ru ||
            ""
          );
        }
        if (normalized === "ru") {
          return (
            tp.name_ru ||
            official?.name_ru ||
            tp.name_uzl ||
            official?.name_uzl ||
            tp.name_uzc ||
            official?.name_uzc ||
            ""
          );
        }
        return (
          tp.name_uzl ||
          official?.name_uzl ||
          tp.name_uzc ||
          official?.name_uzc ||
          tp.name_ru ||
          official?.name_ru ||
          ""
        );
      },
      localizeQuestion: (q) => {
        if (!q) return "";
        if (normalized === "uzc") return q.text_uzc || q.text_uzl;
        if (normalized === "ru") return q.text_ru || q.text_uzl;
        return q.text_uzl;
      },
      localizeOption: (opt) => {
        if (!opt) return "";
        if (normalized === "uzc") return opt.uzc || opt.uzl;
        if (normalized === "ru") return opt.ru || opt.uzl;
        return opt.uzl;
      },
      localizeExplanation: (q) => {
        if (!q) return null;
        if (normalized === "uzc" && q.explanation_uzc) return q.explanation_uzc;
        if (normalized === "ru" && q.explanation_ru) return q.explanation_ru;
        return q.explanation_uzl ?? null;
      },
    };
  }
  return context;
}

/**
 * Universal text extractor for database objects with multi-lingual fields (e.g. text_uzl, text_uzc, text_ru).
 */
export function getLocalizedText(item: any, fieldPrefix: string, lang?: string): string {
  if (!item) return "";
  const l = normalizeLanguage(
    lang ||
      (typeof window !== "undefined"
        ? localStorage.getItem("prava_lang") || localStorage.getItem("i18nextLng")
        : undefined) ||
      i18n.language ||
      "uzl"
  );
  const direct = item[`${fieldPrefix}_${l}`];
  if (direct && String(direct).trim() !== "") return String(direct);

  if (import.meta.env.DEV) {
    console.warn(`[i18n:getLocalizedText] Missing field "${fieldPrefix}_${l}" for active locale "${l}"`, item);
  }
  if (l === "uzc") {
    return item[`${fieldPrefix}_uzl`] || item[fieldPrefix] || "";
  }
  if (l === "ru") {
    return item[`${fieldPrefix}_uzl`] || item[fieldPrefix] || "";
  }
  return item[`${fieldPrefix}_uzl`] || item[fieldPrefix] || "";
}
