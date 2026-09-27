import { useLocation } from "react-router-dom";
import { readReturnTo, sanitizeReturnTo } from "../utils/returnTo";

/** Login'dan keyingi standart manzil (returnTo bo'lmasa). */
export const DEFAULT_AFTER_LOGIN = "/me";

const PENDING_KEY = "prava_pending_return_to";
const PENDING_TTL_MS = 15 * 60 * 1000;

/**
 * Telegram deep link / bot oqimi: foydalanuvchi ilovadan chiqib, keyin
 * `/auth/telegram-callback?token=...` ga (ba'zan boshqa tabda) qaytadi —
 * query param yo'qoladi. Shu sabab returnTo qisqa muddatga localStorage'da saqlanadi.
 */
export function rememberPendingReturnTo(returnTo: string | null | undefined): void {
  const safe = sanitizeReturnTo(returnTo);
  try {
    if (!safe) localStorage.removeItem(PENDING_KEY);
    else localStorage.setItem(PENDING_KEY, JSON.stringify({ path: safe, at: Date.now() }));
  } catch {
    // storage bloklangan — returnTo'siz davom etamiz
  }
}

export function consumePendingReturnTo(): string | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    localStorage.removeItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { path?: unknown; at?: unknown };
    if (typeof parsed.at !== "number" || Date.now() - parsed.at > PENDING_TTL_MS) return null;
    return sanitizeReturnTo(parsed.path);
  } catch {
    return null;
  }
}

/**
 * Joriy auth sahifasi uchun maqsadli manzil: `?returnTo=` (yagona manba),
 * eski `location.state.from` (orqaga moslik), aks holda `/me`.
 * Qaytgan qiymat doim xavfsiz (sanitizeReturnTo'dan o'tgan) nisbiy yo'l.
 */
export function useReturnTo(): { returnTo: string | null; destination: string } {
  const location = useLocation();
  let returnTo = readReturnTo(location.search);
  if (!returnTo) {
    const state = location.state as { from?: string | { pathname?: string; search?: string } } | null;
    const from = state?.from;
    if (typeof from === "string") returnTo = sanitizeReturnTo(from);
    else if (from?.pathname) returnTo = sanitizeReturnTo(from.pathname + (from.search || ""));
  }
  return { returnTo, destination: returnTo ?? DEFAULT_AFTER_LOGIN };
}
