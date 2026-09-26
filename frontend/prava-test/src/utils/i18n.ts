// utils/i18n.ts
import i18n, { type BackendModule, type ReadCallback, type ResourceKey } from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

/*
 * P1-W6: locale JSON'lari (~570 KB) avval entry chunk'ga statik import
 * qilinardi. Endi faqat aktiv til dinamik `import()` orqali alohida chunk
 * sifatida yuklanadi. Til almashtirilganda (`changeLanguage`) yangi til
 * shu backend orqali avtomatik yuklanadi.
 */
const SUPPORTED_LANGS = ["uzl", "uzc", "ru"] as const;
type SupportedLang = (typeof SUPPORTED_LANGS)[number];

const loaders: Record<SupportedLang, () => Promise<{ default: ResourceKey }>> = {
  uzl: () => import("../locales/uzl.json"),
  uzc: () => import("../locales/uzc.json"),
  ru: () => import("../locales/ru.json"),
};

const lazyLocaleBackend: BackendModule = {
  type: "backend",
  init() {},
  read(language: string, _namespace: string, callback: ReadCallback) {
    const loader = loaders[language as SupportedLang];
    if (!loader) {
      callback(null, {});
      return;
    }
    loader()
      .then((mod) => callback(null, mod.default))
      .catch((err: unknown) => callback(err as Error, null));
  },
};

/**
 * Tayyor bo'lish promise'i — `main.tsx` birinchi render'ni shu promise'dan
 * keyin bajaradi, shuning uchun xom kalitlar (raw keys) ko'rinib qolmaydi.
 */
export const i18nReady = i18n
  .use(lazyLocaleBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: [...SUPPORTED_LANGS],
    /*
     * Qo'llab-quvvatlanadigan til uchun fallback yuklanmaydi (uchala locale
     * kalitlari 100% mos; t() chaqiruvlarida uzl defaultValue bor) — aks holda
     * ru/uzc foydalanuvchisi uzl.json'ni ham yuklab olardi.
     * Noma'lum til (masalan "en") → "uzl".
     */
    fallbackLng: (code: string) =>
      (SUPPORTED_LANGS as readonly string[]).includes(code) ? [] : ["uzl"],
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
  })
  .catch(() => {
    // Locale chunk yuklanmasa ham ilova ochilsin (t() defaultValue'lar ishlaydi)
  });

export default i18n;
