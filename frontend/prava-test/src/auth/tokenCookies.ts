import Cookies from "js-cookie";

type CookieAttributes = Cookies.CookieAttributes;

/**
 * Explicit cookie attributes for auth tokens (audit P2-D1, partial fix).
 *
 * KNOWN LIMITATION — read before touching auth storage:
 * - In the packaged Tauri app the WebView origin is `http://tauri.localhost` (Windows) /
 *   `tauri://localhost` (macOS/Linux). On plain http `Secure` cookies are rejected, so
 *   `secure` is only true when the page is actually served over https (web/dev builds).
 * - js-cookie cannot set `HttpOnly`, so the access/refresh tokens are readable by any script
 *   running in the WebView (an XSS would expose them). The CSP in tauri.conf.json is the main
 *   mitigation. AccountManager no longer stores any tokens (display name + masked id only).
 * - Proper fix (TODO): move the refresh token to the OS keychain via a Tauri plugin
 *   (e.g. `tauri-plugin-stronghold` / a keyring command) and keep only the short-lived access
 *   token in memory. Not done yet because it needs a new native plugin + migration.
 *
 * `sameSite: "strict"` is used for every token cookie: the tokens are only read by JS and sent
 * in the Authorization header, never needed on cross-site navigations.
 */
export type AuthCookieKind = "access" | "refresh" | "userData";

export const REFRESH_TOKEN_TTL_DAYS = 30;
export const ACCESS_TOKEN_TTL_DAYS = 1;

export function authCookieOptions(
  kind: AuthCookieKind,
  expires?: number | Date | null,
): CookieAttributes {
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  const opts: CookieAttributes = {
    path: "/",
    secure: isSecure,
    sameSite: "strict",
  };
  if (expires === undefined) {
    opts.expires = kind === "refresh" ? REFRESH_TOKEN_TTL_DAYS : ACCESS_TOKEN_TTL_DAYS;
  } else if (expires !== null) {
    opts.expires = expires; // null → session cookie (e.g. "remember me" off)
  }
  return opts;
}

/**
 * "Remember me" off (audit D-08): tokens must not outlive the app session. A session-only marker
 * cookie (no expiry, so it dies with the WebView session exactly like the tokens) tells the refresh
 * path in src/api/api.ts to re-issue SESSION cookies instead of 1-day / 30-day ones.
 */
export const AUTH_SESSION_ONLY_COOKIE = "authSessionOnly";

export function setAuthPersistence(remember: boolean): void {
  if (remember) {
    Cookies.remove(AUTH_SESSION_ONLY_COOKIE, { path: "/" });
  } else {
    Cookies.set(AUTH_SESSION_ONLY_COOKIE, "1", authCookieOptions("userData", null));
  }
}

export function isSessionOnlyAuth(): boolean {
  return Cookies.get(AUTH_SESSION_ONLY_COOKIE) === "1";
}

/** Cookie options for a token cookie that honour the current remember-me persistence. */
export function persistedAuthCookieOptions(kind: AuthCookieKind, expires?: number | Date): CookieAttributes {
  return authCookieOptions(kind, isSessionOnlyAuth() ? null : expires);
}
