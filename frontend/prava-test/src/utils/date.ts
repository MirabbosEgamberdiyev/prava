import i18n from "./i18n";

/**
 * Returns BCP-47 locale matching current app language.
 */
export function getAppDateLocale(lang?: string): string {
  const l = lang || i18n.resolvedLanguage || i18n.language || "uzl";
  if (l === "ru") return "ru-RU";
  if (l === "uzc") return "uz-Cyrl-UZ";
  if (l === "en") return "en-US";
  return "uz-Latn-UZ";
}

/**
 * Localized date formatter respecting active app language.
 */
export function formatAppDate(
  dateStr?: string | Date | null,
  options?: Intl.DateTimeFormatOptions,
  lang?: string
): string {
  if (!dateStr) return "-";
  try {
    const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return "-";
    const locale = getAppDateLocale(lang);
    return d.toLocaleDateString(
      locale,
      options || {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  } catch {
    return String(dateStr);
  }
}

/**
 * Localized date-time formatter (day, month, year, hour, minute).
 */
export function formatAppDateTime(
  dateStr?: string | Date | null,
  lang?: string
): string {
  return formatAppDate(
    dateStr,
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
    lang
  );
}
