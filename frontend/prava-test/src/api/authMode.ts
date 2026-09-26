/**
 * Refresh token saqlash rejimi.
 *
 * "cookie" (standart): refresh token server tomonidan HttpOnly cookie'da saqlanadi,
 * JS unga umuman tegmaydi (XSS uni o'g'irlay olmaydi). So'rovlarga
 * `X-Auth-Mode: cookie` header'i qo'shiladi — server body'da refresh token qaytarmaydi.
 *
 * "legacy": desktop ilovaning OAuth oynasi (Tauri webview) sahifadagi cookie'lardan
 * tokenlarni JS orqali o'qib, desktop'ga o'tkazadi. Shu oynada eski rejim saqlanadi.
 * Desktop oynasi init-script orqali
 * `window.__PRAVA_DESKTOP_AUTH__` flag'ini qo'yadi (URL parametri hisobga olinmaydi).
 */
const LEGACY_FLAG_KEY = "prava_legacy_auth";

function detectLegacyWindow(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(LEGACY_FLAG_KEY) === "1") return true;
    const w = window as unknown as { __PRAVA_DESKTOP_AUTH__?: boolean };
    // SECURITY: faqat Tauri init-script qo'yadigan flag. URL parametri (?oauth=) endi hisobga
    // olinmaydi — aks holda istalgan havola HttpOnly himoyasini o'chirib qo'yishi mumkin edi.
    const fromDesktop = w.__PRAVA_DESKTOP_AUTH__ === true;
    if (fromDesktop) sessionStorage.setItem(LEGACY_FLAG_KEY, "1");
    return fromDesktop;
  } catch {
    return false;
  }
}

const cookieMode = !detectLegacyWindow();

export function isCookieAuthMode(): boolean {
  return cookieMode;
}

export const AUTH_MODE_HEADERS: Record<string, string> = cookieMode
  ? { "X-Auth-Mode": "cookie" }
  : {};
