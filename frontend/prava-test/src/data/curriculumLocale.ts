import { latinToCyrillic } from "../utils/transliterate";
import { getAppDateLocale } from "../utils/date";

export type CurriculumLang = "uzl" | "uzc" | "ru";

/**
 * Backend curriculum yozuvlaridagi `*_uzl / *_uzc / *_ru` maydonlaridan joriy tilga mosini tanlaydi.
 *  - ru:  ru -> uzl
 *  - uzc: uzc -> latinToCyrillic(uzl)  (HTML teglari va URL'lar transliteratsiya qilinmaydi)
 *  - uzl: uzl -> uzc
 */
export function pickLocalized(
  lang: string | undefined,
  uzl: string | null | undefined,
  uzc?: string | null,
  ru?: string | null,
): string {
  if (lang === "ru") return ru || uzl || "";
  if (lang === "uzc") return uzc || latinToCyrillic(uzl) || "";
  return uzl || uzc || "";
}

/** Raqamni joriy til lokali bo'yicha formatlaydi (uz-Latn-UZ / uz-Cyrl-UZ / ru-RU). */
export function formatLocalizedNumber(value: number, lang?: string): string {
  try {
    return new Intl.NumberFormat(getAppDateLocale(lang), { maximumFractionDigits: 0 }).format(value);
  } catch {
    return String(Math.round(value));
  }
}
