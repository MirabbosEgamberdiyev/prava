import axios, {
  type AxiosInstance,
  AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import Cookies from "js-cookie";
import { ENV } from "../config/env";
import i18n from "../utils/i18n";
import { getSharedCookieDomain } from "../utils/domain";
import { AUTH_MODE_HEADERS, isCookieAuthMode } from "./authMode";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_DATA_KEY = "userData";

function clearCookies(): void {
  const domain = getSharedCookieDomain();
  const keys = [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_DATA_KEY];
  keys.forEach((k) => {
    Cookies.remove(k);
    if (domain) {
      Cookies.remove(k, { domain });
    }
  });
}

// Refresh so'rovi uchun alohida instance (interceptor loop'dan qochish)
const refreshClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // HttpOnly refresh cookie
  headers: { "Content-Type": "application/json", ...AUTH_MODE_HEADERS },
});

const api: AxiosInstance = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 15000,
  withCredentials: true, // login javobidagi HttpOnly refresh cookie qabul qilinsin
  headers: {
    "Content-Type": "application/json",
    ...AUTH_MODE_HEADERS,
  },
});

/**
 * Decode JWT payload using atob (no external library needed).
 */
function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

/**
 * Check if access token expires within the next 5 minutes.
 */
function isTokenExpiringSoon(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  const expiresAt = payload.exp * 1000;
  const fiveMinutes = 5 * 60 * 1000;
  return expiresAt - Date.now() < fiveMinutes;
}

function removeLegacyRefreshCookie(): void {
  const domain = getSharedCookieDomain();
  Cookies.remove(REFRESH_TOKEN_KEY);
  if (domain) Cookies.remove(REFRESH_TOKEN_KEY, { domain });
}

/** Cookie rejimida HttpOnly cookie borligini JS bilmaydi — server hal qiladi. */
function hasRefreshCredential(): boolean {
  return isCookieAuthMode() || Boolean(Cookies.get(REFRESH_TOKEN_KEY));
}

/**
 * Persist freshly issued tokens to cookies.
 */
function storeTokens(newAccessToken: string, newRefreshToken?: string): void {
  const isSecure = window.location.protocol === "https:";
  const domain = getSharedCookieDomain();
  Cookies.set(ACCESS_TOKEN_KEY, newAccessToken, {
    expires: 1,
    secure: isSecure,
    sameSite: "lax",
    domain,
  });
  if (isCookieAuthMode()) {
    // Refresh token HttpOnly cookie'da (server boshqaradi) — eski JS cookie'ni o'chiramiz.
    removeLegacyRefreshCookie();
  } else if (newRefreshToken) {
    Cookies.set(REFRESH_TOKEN_KEY, newRefreshToken, {
      expires: 30,
      secure: isSecure,
      sameSite: "lax",
      domain,
    });
  }
  // Extend userData cookie expiry to match access token
  const existingUserData = Cookies.get(USER_DATA_KEY);
  if (existingUserData) {
    Cookies.set(USER_DATA_KEY, existingUserData, {
      expires: 1,
      secure: isSecure,
      sameSite: "lax",
      domain,
    });
  }
}

/*
 * Refresh token logikasi (P1-W1).
 *
 * Bitta umumiy `refreshPromise`: proactive (request interceptor) va reactive
 * (401 response interceptor) yo'llari AYNAN bitta promise'ni kutadi. Shu
 * sababli hech bir so'rov "navbatda" abadiy osilib qolmaydi — promise
 * resolve/reject bo'lganda barcha kutuvchilar birga davom etadi.
 */
let refreshPromise: Promise<string> | null = null;

function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    // Cookie rejimida token HttpOnly cookie orqali avtomatik yuboriladi. Eski (JS) cookie
    // hali bo'lsa — bir martalik migratsiya: server uni HttpOnly cookie bilan almashtiradi.
    const legacyRefreshToken = Cookies.get(REFRESH_TOKEN_KEY);
    if (!isCookieAuthMode() && !legacyRefreshToken) {
      throw new Error("No refresh token");
    }
    const response = await refreshClient.post(
      "/api/v1/auth/refresh",
      legacyRefreshToken ? { refreshToken: legacyRefreshToken } : {},
    );
    const newAccessToken: string | undefined =
      response.data.data?.accessToken || response.data.accessToken;
    const newRefreshToken: string | undefined =
      response.data.data?.refreshToken || response.data.refreshToken;
    if (!newAccessToken) {
      throw new Error("No access token in refresh response");
    }
    storeTokens(newAccessToken, newRefreshToken);
    return newAccessToken;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

// Bitta muvaffaqiyatsiz refresh uchun logout faqat bir marta yuboriladi
let logoutHandledFor: Promise<string> | null = null;

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // 1. Tokenni olish
    let token = Cookies.get(ACCESS_TOKEN_KEY);

    // 2. Tilni cookiedan olish
    const language = Cookies.get("i18next") || "uzl";

    if (config.headers) {
      // TILNI BIRIKTIRISH
      config.headers["Accept-Language"] = language;
    }

    // 3. Proactive token refresh: 5 daqiqadan kam qolsa oldindan yangilash.
    //    Refresh allaqachon ketayotgan bo'lsa — o'sha promise'ni kutamiz.
    if (
      refreshPromise ||
      (token && isTokenExpiringSoon(token) && hasRefreshCredential())
    ) {
      try {
        token = await refreshAccessToken();
      } catch {
        // Proactive refresh failed — proceed with existing token
        // (reactive 401 yo'li kerak bo'lsa logout qiladi)
        token = Cookies.get(ACCESS_TOKEN_KEY);
      }
    }

    // Tokenni biriktirish
    if (config.headers && token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);


api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Global error handling (non-401 errors)
    const requestUrl = error.config?.url || "unknown";
    const SELF_HANDLED_URLS = [
      "/auth/login",
      "/auth/register",
      "/auth/google",
      "/auth/telegram",
      "/auth/verify-otp",
      "/auth/forgot-password",
      "/auth/reset-password",
      "/auth/logout",
      "/auth/pair",
      "/api/v2/exams/active",
      "/api/v2/tickets/start-visible",
      "/api/v2/exams/start-visible",
      "/api/v2/exams/start-secure",
      "/api/v2/exams/submit",
    ];
    const isSelfHandled = SELF_HANDLED_URLS.some((u) => requestUrl.includes(u));
    const isCanceled = axios.isCancel(error) || error.code === "ERR_CANCELED";

    if (error.response) {
      const status = error.response.status;
      if (status === 403) {
        // 403 means authenticated but forbidden — do NOT clear tokens/logout
        if (!isSelfHandled) {
          window.dispatchEvent(
            new CustomEvent("api-error", {
              detail: { status: 403, message: i18n.t("errors.accessDenied", "Ruxsat etilmagan amal"), url: requestUrl },
            }),
          );
        }
        return Promise.reject(error);
      }
      if (status >= 500) {
        if (!isSelfHandled) {
          window.dispatchEvent(
            new CustomEvent("api-error", {
              detail: { status, message: i18n.t("errors.serverError", "Serverda nosozlik yuz berdi. Iltimos keyinroq qayta urinib ko'ring."), url: requestUrl },
            }),
          );
        }
      }
    } else if (!isCanceled && !isSelfHandled && (error.code === "ERR_NETWORK" || !error.response)) {
      window.dispatchEvent(
        new CustomEvent("api-error", {
          detail: { status: 0, message: i18n.t("errors.networkError", "Internet tarmog'iga ulanishda xatolik yuz berdi."), url: requestUrl },
        }),
      );
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // 401 bo'lsa va retry qilinmagan bo'lsa
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = hasRefreshCredential();
      const hadAuthHeader = Boolean(originalRequest.headers?.Authorization);

      /*
       * KRITIK TUZATISH — mehmon (guest) foydalanuvchini uydan haydash muammosi.
       *
       * Avval: token BUTUNLAY yo'q holatda ham (mehmon), 401 qaytgan har qanday
       * so'rov `auth-logout` eventini yuborardi. AuthContext esa uni ushlab
       * `navigate("/")` qilardi. Natijada `/try-exam` (bepul sinov imtihoni)
       * sahifasida QuizContent'ning `/api/v1/app/saved-questions` so'rovi 401
       * qaytishi bilan MEHMON bosh sahifaga uloqtirilardi — asosiy jalb qilish
       * kanali buzilgan edi.
       *
       * Endi: agar so'rovda Authorization header bo'lmagan bo'lsa, bu "sessiya
       * tugadi" emas, oddiy "ruxsat yo'q" holati — logout yuborilmaydi.
       */
      if (!hadAuthHeader) {
        return Promise.reject(error);
      }

      // Refresh token yo'q bo'lsa - to'g'ridan-to'g'ri logout
      if (!refreshToken) {
        clearCookies();
        window.dispatchEvent(new CustomEvent("auth-logout"));
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // So'rov eski token bilan yuborilgan, lekin shu orada token allaqachon
      // yangilangan bo'lsa — qayta refresh qilmasdan yangi token bilan takrorlash.
      const currentToken = Cookies.get(ACCESS_TOKEN_KEY);
      if (
        !refreshPromise &&
        currentToken &&
        originalRequest.headers?.Authorization !== `Bearer ${currentToken}`
      ) {
        originalRequest.headers.Authorization = `Bearer ${currentToken}`;
        return api(originalRequest);
      }

      const pending = refreshAccessToken();
      try {
        const newAccessToken = await pending;
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        if (logoutHandledFor !== pending) {
          logoutHandledFor = pending;
          clearCookies();
          window.dispatchEvent(new CustomEvent("auth-logout"));
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
