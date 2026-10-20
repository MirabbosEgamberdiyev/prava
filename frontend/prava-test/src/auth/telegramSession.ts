import api from "../api/api";
import type { User } from "../types";

/**
 * Telegram orqali "bir bosishda" kirish (deep link + botdagi «Tasdiqlash» tugmasi).
 *
 * 1. `init` — server bir martalik `token` va faqat shu klientga ma'lum `pollSecret` beradi.
 * 2. Klient Telegram'ni ochadi (`tg://` Desktop'da, `https://t.me/...` brauzerda — ilova o'rnatilmagan
 *    bo'lsa ham Telegram Web orqali ishlaydi).
 * 3. Foydalanuvchi botda qurilmani ko'radi va «Tasdiqlash»ni bosadi (avtomatik tasdiq yo'q — phishing himoyasi).
 * 4. `status` polling: APPROVED bo'lganda tokenlar faqat bir marta qaytadi.
 *
 * Poll secret QR oqimidagi `X-QR-Poll-Secret` sarlavhasida yuboriladi (u backend CORS ro'yxatida bor).
 */
export type TelegramSessionStatus = "PENDING" | "APPROVED" | "CONSUMED" | "EXPIRED" | "CANCELLED" | "REJECTED";

export interface TelegramSessionInit {
  token: string;
  pollSecret: string;
  botUsername: string;
  botUrl: string;
  directAppUrl: string;
  expiresInSeconds: number;
}

export interface TelegramSessionStatusResponse {
  status: TelegramSessionStatus;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  redirectPath?: string;
}

const POLL_SECRET_HEADER = "X-QR-Poll-Secret";

export const TelegramSessionService = {
  async init(platform: "web" | "desktop", redirectPath?: string): Promise<TelegramSessionInit> {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
    const os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
    const res = await api.post("/api/v1/auth/telegram/session/init", {
      platform,
      deviceName: platform === "desktop" ? `Prava Online${os ? " · " + os : ""}` : `${browser}${os ? " · " + os : ""}`,
      redirectPath,
    });
    return res.data.data as TelegramSessionInit;
  },

  async status(token: string, pollSecret: string): Promise<TelegramSessionStatusResponse> {
    const res = await api.get("/api/v1/auth/telegram/session/status", {
      params: { token },
      headers: { [POLL_SECRET_HEADER]: pollSecret },
      timeout: 8000,
    });
    return res.data.data as TelegramSessionStatusResponse;
  },

  async cancel(token: string, pollSecret: string): Promise<void> {
    try {
      await api.post("/api/v1/auth/telegram/session/cancel", null, {
        params: { token },
        headers: { [POLL_SECRET_HEADER]: pollSecret },
      });
    } catch {
      // best effort — the session expires by itself after 5 minutes
    }
  },
};

export interface TelegramPollingOptions {
  token: string;
  pollSecret: string;
  intervalMs?: number;
  /** Faqat yakuniy holatlar (APPROVED/CONSUMED/EXPIRED/CANCELLED/REJECTED) uchun chaqiriladi. */
  onFinal: (res: TelegramSessionStatusResponse) => void;
  /** Injectable for tests. */
  check?: (token: string, pollSecret: string) => Promise<TelegramSessionStatusResponse>;
}

/**
 * In-flight guard bilan polling (sekin tarmoqda so'rovlar ustma-ust tushmaydi). Yakuniy holatda o'zi to'xtaydi.
 * Qaytgan funksiya pollingni to'xtatadi; undan keyin callback chaqirilmaydi.
 */
export function pollTelegramSession({
  token,
  pollSecret,
  intervalMs = 2000,
  onFinal,
  check = (t, s) => TelegramSessionService.status(t, s),
}: TelegramPollingOptions): () => void {
  let stopped = false;
  let inFlight = false;
  const stop = () => {
    stopped = true;
    clearInterval(timer);
  };
  const tick = async () => {
    if (stopped || inFlight) return;
    inFlight = true;
    try {
      const res = await check(token, pollSecret);
      if (!stopped && res && res.status !== "PENDING") {
        stop();
        onFinal(res);
      }
    } catch {
      // transient error — keep polling until the session expires
    } finally {
      inFlight = false;
    }
  };
  const timer = setInterval(tick, intervalMs);
  return stop;
}
