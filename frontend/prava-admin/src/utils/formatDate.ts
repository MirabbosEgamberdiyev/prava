// src/utils/formatDate.ts
import i18n from "./i18n";

/**
 * Ilova tili → Intl locale.
 * Ilgari locale qattiq "ru-RU" edi: interfeys inglizcha/o'zbekcha bo'lsa ham
 * sanalar rus formatida chiqardi.
 */
const LOCALE_MAP: Record<string, string> = {
  uzl: "uz-Latn-UZ",
  uzc: "uz-Cyrl-UZ",
  ru: "ru-RU",
  en: "en-GB",
};

const resolveLocale = (): string =>
  LOCALE_MAP[i18n.resolvedLanguage ?? i18n.language ?? "uzl"] ?? "uz-Latn-UZ";

export const formatDate = (dateString: string | Date): string => {
  if (!dateString) return "";

  const date = new Date(dateString);

  // Agarda sana noto'g'ri bo'lsa, xato bermasligi uchun
  if (isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(resolveLocale(), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

/**
 * Faqat sana (vaqtsiz), interfeys tiliga mos formatda.
 * Bo'sh/noto'g'ri qiymat uchun jadvallardagi bir xil "—" belgisini qaytaradi.
 */
export const formatDateShort = (dateString?: string | Date | null): string => {
  if (!dateString) return "—";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(resolveLocale(), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};
