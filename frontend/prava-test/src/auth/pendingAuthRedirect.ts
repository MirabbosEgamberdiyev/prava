/**
 * Pending post-login destination ("returnUrl") + optional pending action (audit D-03).
 *
 * Guests browse freely; auth is requested only when a protected workflow starts. The place the
 * user wanted to go is remembered here (in memory + mirrored to sessionStorage so it survives the
 * /auth/* page hops and the in-app OAuth window round-trip) and consumed exactly once by whichever
 * login path succeeds (password, register, Google, Telegram, QR, modal).
 *
 * Only same-app relative paths are accepted: must start with a single "/", must not be
 * protocol-relative ("//evil"), must not contain a backslash / control chars, and must not point
 * back into the auth shell (/auth/*) — that would loop.
 */

export const RETURN_URL_STORAGE_KEY = "prava_auth_return_url";
export const DEFAULT_AFTER_LOGIN = "/me";
/** Dispatched on window after a login completed outside React's normal flow (desktop OAuth event). */
export const AUTH_LOGIN_COMPLETED_EVENT = "prava-auth-login-completed";

// eslint-disable-next-line no-control-regex
const CONTROL_OR_BACKSLASH = /[\u0000-\u001f\u007f\\]/;

/** Returns the path when it is a safe in-app destination, otherwise null. */
export function sanitizeReturnUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const url = value.trim();
  if (!url || url.length > 2048) return null;
  if (!url.startsWith("/") || url.startsWith("//")) return null;
  if (CONTROL_OR_BACKSLASH.test(url)) return null;
  const path = url.split(/[?#]/, 1)[0].toLowerCase();
  if (path === "/auth" || path.startsWith("/auth/")) return null;
  return url;
}

let memoryReturnUrl: string | null = null;
let memoryAction: (() => void) | null = null;

function storage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

export function setPendingReturnUrl(value: unknown): string | null {
  const safe = sanitizeReturnUrl(value);
  if (!safe) return null;
  memoryReturnUrl = safe;
  try {
    storage()?.setItem(RETURN_URL_STORAGE_KEY, safe);
  } catch {
    // quota / private mode — memory copy still works for this window
  }
  return safe;
}

export function getPendingReturnUrl(): string | null {
  if (memoryReturnUrl) return memoryReturnUrl;
  try {
    return sanitizeReturnUrl(storage()?.getItem(RETURN_URL_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function setPendingAction(action: (() => void) | null): void {
  memoryAction = action;
}

export function hasPendingAction(): boolean {
  return memoryAction !== null;
}

export function clearPendingAuthRedirect(): void {
  memoryReturnUrl = null;
  memoryAction = null;
  try {
    storage()?.removeItem(RETURN_URL_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Reads and clears the pending redirect (one-shot). */
export function takePendingAuthRedirect(): { action: (() => void) | null; url: string | null } {
  const result = { action: memoryAction, url: getPendingReturnUrl() };
  clearPendingAuthRedirect();
  return result;
}

/** `?returnUrl=` query suffix for links into /auth/* (empty when there is nothing safe to carry). */
export function returnUrlQuery(value: unknown): string {
  const safe = sanitizeReturnUrl(value);
  return safe ? `?returnUrl=${encodeURIComponent(safe)}` : "";
}

/**
 * One-shot completion used by AuthModalContext.executePending: runs the pending action if any,
 * otherwise navigates to the pending returnUrl, else to a safe `fallback`, else "/me".
 * Returns the path navigated to (null when a pending action ran instead).
 */
export function completePendingAuthRedirect(
  navigate: (to: string, opts: { replace: boolean }) => void,
  fallback?: unknown,
): string | null {
  const { action, url } = takePendingAuthRedirect();
  if (action) {
    action();
    return null;
  }
  const target = url ?? sanitizeReturnUrl(fallback) ?? DEFAULT_AFTER_LOGIN;
  navigate(target, { replace: true });
  return target;
}
