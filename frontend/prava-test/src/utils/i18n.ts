// utils/i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import uzl from "../locales/uzl.json";
import uzc from "../locales/uzc.json";
import ru from "../locales/ru.json";

const resources = {
  uzl: { translation: uzl },
  uzc: { translation: uzc },
  ru: { translation: ru },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: ["uzl", "uzc", "ru"],
    fallbackLng: "uzl",
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "cookie", "navigator"],
      lookupLocalStorage: "prava_lang",
      lookupCookie: "i18next",
      caches: ["localStorage", "cookie"],
    },
    react: {
      useSuspense: false,
      bindI18n: "languageChanged loaded",
      bindI18nStore: "added removed",
    },
  });

export default i18n;
