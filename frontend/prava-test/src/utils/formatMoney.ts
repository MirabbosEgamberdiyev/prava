/**
 * Money formatting for UZS amounts (traffic fines, BHM).
 *
 * Uses Intl.NumberFormat for the UI language (uzl/uzc → "uz-UZ", ru → "ru-RU") and
 * normalises the group separator to a non-breaking space, so "1 125 000" never wraps
 * in the middle and looks the same in every WebView/ICU build. Falls back to manual
 * grouping when Intl is unavailable or returns something unexpected.
 */

export const NBSP = " ";

const CURRENCY_LABELS: Record<string, string> = {
  uzl: "so'm",
  uzc: "сўм",
  ru: "сум",
};

/** BCP-47 tag used for number formatting in the given UI language. */
export function numberLocale(lang: string): string {
  return lang === "ru" ? "ru-RU" : "uz-UZ";
}

/** Localised currency suffix ("so'm" / "сўм" / "сум"); Latin Uzbek for unknown languages. */
export function currencyLabel(lang: string): string {
  return CURRENCY_LABELS[lang] ?? CURRENCY_LABELS.uzl;
}

/** "1125000" → "1 125 000" (NBSP-separated), no Intl needed. */
export function groupDigits(value: number): string {
  const n = Math.round(Math.abs(value));
  const digits = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return value < 0 && n !== 0 ? `-${digits}` : digits;
}

/** Whole-number amount with locale grouping (NBSP separators). Non-finite → "". */
export function formatAmount(value: number, lang: string): string {
  if (!Number.isFinite(value)) return "";
  const n = Math.round(value);
  try {
    if (typeof Intl !== "undefined" && typeof Intl.NumberFormat === "function") {
      const nf = new Intl.NumberFormat(numberLocale(lang), { maximumFractionDigits: 0, useGrouping: true });
      const out =
        typeof nf.formatToParts === "function"
          ? nf
              .formatToParts(n)
              .map((p) => (p.type === "group" ? NBSP : p.value))
              .join("")
          : nf.format(n).replace(/[\s  ,.]/g, NBSP);
      const normalised = out.replace(/−/g, "-");
      // Only accept ASCII digits + separators; anything else (other numbering systems) → fallback.
      if (/^-?\d{1,3}(?: \d{3})*$/.test(normalised)) return normalised;
    }
  } catch {
    // unsupported locale / Intl missing — manual fallback below
  }
  return groupDigits(n);
}

/** "375 000 so'm" (NBSP between number and currency). */
export function formatSom(value: number, lang: string): string {
  const amount = formatAmount(value, lang);
  return amount ? `${amount}${NBSP}${currencyLabel(lang)}` : "";
}

/** "375 000 – 1 125 000 so'm", or a single amount when there is no (larger) maximum. */
export function formatSomRange(min: number, max: number | null | undefined, lang: string): string {
  if (max == null || !Number.isFinite(max) || max <= min) return formatSom(min, lang);
  return `${formatAmount(min, lang)} – ${formatSom(max, lang)}`;
}

/** BHM multiplier without trailing zeros: 1 → "1", 2.5 → "2,5" (uz/ru use a decimal comma). */
export function formatMultiplier(value: number, lang: string): string {
  if (!Number.isFinite(value)) return "";
  const rounded = Math.round(value * 100) / 100;
  try {
    if (typeof Intl !== "undefined" && typeof Intl.NumberFormat === "function") {
      const out = new Intl.NumberFormat(numberLocale(lang), { maximumFractionDigits: 2 }).format(rounded);
      if (/^-?[\d\s  .,]+$/.test(out)) return out.replace(/[\s ]/g, NBSP);
    }
  } catch {
    // fallback below
  }
  return String(rounded).replace(".", ",");
}
