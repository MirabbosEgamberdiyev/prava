// utils/i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

/**
 * Build-time version stamp — har deploy paytida o'zgaradi.
 * Brauzer va nginx eski JSON ni cache qilmasligi uchun query param qo'shamiz.
 */
const BUILD_VERSION = String(__BUILD_TIME__ ?? Date.now());

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: ["uzl", "uzc", "ru", "en"],
    fallbackLng: "uzl",
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["cookie", "localStorage", "navigator"],
      lookupCookie: "i18next",
      lookupLocalStorage: "i18nextLng",
      caches: ["cookie", "localStorage"],
    },
    backend: {
      loadPath: "/locales/{{lng}}/translation.json",
      // Har build da yangi version — cache bypass
      queryStringParams: { v: BUILD_VERSION },
    },
  });

export default i18n;
