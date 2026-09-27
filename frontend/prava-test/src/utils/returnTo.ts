/**
 * `returnTo` — login/ro'yxatdan o'tishdan keyin qaytiladigan manzil uchun
 * YAGONA manba (query param `?returnTo=/tickets/5`).
 *
 * Xavfsizlik: faqat shu sayt ichidagi nisbiy yo'l qabul qilinadi —
 * "/" bilan boshlanadi, "//" yoki "/\" bilan boshlanmaydi (protocol-relative
 * open redirect), sxema/boshqaruv belgilarini o'z ichiga olmaydi va auth
 * sahifalarining o'ziga qaytmaydi (cheksiz aylanish bo'lmasligi uchun).
 */
export const RETURN_TO_PARAM = "returnTo";

const AUTH_PREFIX = "/auth/";
const MAX_LEN = 512;

export function sanitizeReturnTo(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value || value.length > MAX_LEN) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//") || value.startsWith("/\\")) return null;
  // Boshqaruv belgilari, backslash va bo'shliqlar (brauzerlar "/\t/evil" ni "//evil" deb o'qishi mumkin)
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f\\\s]/.test(value)) return null;
  try {
    const url = new URL(value, "https://placeholder.invalid");
    if (url.origin !== "https://placeholder.invalid") return null;
    const path = url.pathname + url.search + url.hash;
    if (path.startsWith("//")) return null;
    if (path === "/auth" || path.startsWith(AUTH_PREFIX) || /^\/(login|register)(\/|\?|$)/.test(path)) {
      return null;
    }
    return path;
  } catch {
    return null;
  }
}

/** URL query'dan xavfsiz `returnTo` o'qiydi. */
export function readReturnTo(search: string | URLSearchParams): string | null {
  const params = typeof search === "string" ? new URLSearchParams(search) : search;
  return sanitizeReturnTo(params.get(RETURN_TO_PARAM));
}

/** `path` ga `returnTo` qo'shadi (yaroqsiz bo'lsa — o'zgarishsiz qaytaradi). */
export function withReturnTo(path: string, returnTo: string | null | undefined): string {
  const safe = sanitizeReturnTo(returnTo);
  if (!safe) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}${RETURN_TO_PARAM}=${encodeURIComponent(safe)}`;
}

/** Login sahifasiga yo'l, joriy manzilni `returnTo` sifatida saqlab. */
export function loginPath(returnTo?: string | null): string {
  return withReturnTo("/auth/login", returnTo);
}

export function registerPath(returnTo?: string | null): string {
  return withReturnTo("/auth/register", returnTo);
}
