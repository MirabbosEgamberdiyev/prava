/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import type { User, AuthData } from "../types";
import api from "../api/api";
import { isCookieAuthMode } from "../api/authMode";
import { flushPendingSubmits } from "../services/pendingSubmits";
import { getSharedCookieDomain } from "../utils/domain";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_DATA_KEY = "userData";

/**
 * Service-worker runtime caches that may hold user-scoped API responses
 * (see vite.config.ts workbox.runtimeCaching → cacheName "api-cache").
 * Cleared on logout so the next user on the same device never sees them.
 */
const USER_SCOPED_SW_CACHES = ["api-cache"];

/** Logout'da o'chiriladigan, foydalanuvchiga tegishli localStorage kalitlari (keyingi foydalanuvchiga ko'rinmasin). */
const USER_SCOPED_LOCAL_KEYS = ["prava_inapp_notifications_v2", "prava_pending_submits_v1"];
const USER_SCOPED_LOCAL_PREFIXES = ["prava_autosave_"];

export function clearUserScopedCaches(): void {
  if (typeof window === "undefined") return;
  try {
    USER_SCOPED_LOCAL_KEYS.forEach((k) => localStorage.removeItem(k));
    Object.keys(localStorage)
      .filter((k) => USER_SCOPED_LOCAL_PREFIXES.some((p) => k.startsWith(p)))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // storage bloklangan — o'tkazib yuboramiz
  }
  if (!("caches" in window)) return;
  USER_SCOPED_SW_CACHES.forEach((name) => {
    void window.caches.delete(name).catch(() => {
      // ignore
    });
  });
}

export function clearAuthCookies(): void {
  const domain = getSharedCookieDomain();
  const keys = [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_DATA_KEY];
  keys.forEach((k) => {
    Cookies.remove(k);
    if (domain) {
      Cookies.remove(k, { domain });
    }
  });
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (authData: AuthData) => void;
  register: (authData: AuthData) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * JWT payload'dan exp vaqtini olish.
 */
function getTokenExpiry(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Auth holatini tekshirish:
 * - Access token mavjud va eskirmaganmi
 * - Access token eskirgan bo'lsa, refresh token bormi (API interceptor yangilaydi)
 * - Hech biri yo'q → cookie'larni tozalash
 */
const checkAuthStatus = (): boolean => {
  const accessToken = Cookies.get(ACCESS_TOKEN_KEY);
  if (!accessToken) return false;

  const expiry = getTokenExpiry(accessToken);

  // Token hali amal qilmoqda
  if (expiry && expiry > Date.now()) return true;

  // Access token eskirgan — refresh token bormi?
  // (cookie rejimida refresh token HttpOnly — JS uni ko'rmaydi, interceptor server orqali yangilaydi)
  if (isCookieAuthMode() || Cookies.get(REFRESH_TOKEN_KEY)) return true; // API interceptor yangilaydi

  // Hech qanday valid token yo'q — cookie'larni tozalash
  clearAuthCookies();
  return false;
};

/**
 * SECURITY: `userData` cookie JS o'qiy oladigan va barcha *.pravaonline.uz subdomenlariga
 * yuboriladigan cookie. Unda telefon/email saqlanmaydi — faqat UI uchun zarur minimal maydonlar.
 * To'liq profil faqat xotirada (login javobi yoki /auth/me). Desktop OAuth oynasida (legacy)
 * desktop ilova userData'ni to'liq o'qiydi, shuning uchun u yerda o'zgarmaydi.
 */
const toCookieUser = (u: User): Partial<User> =>
  isCookieAuthMode()
    ? {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        fullName: u.fullName,
        role: u.role,
        preferredLanguage: u.preferredLanguage,
      }
    : u;

const getInitialUser = () => {
  const user = Cookies.get(USER_DATA_KEY);
  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] =
    useState<boolean>(checkAuthStatus());
  const [user, setUser] = useState<User | null>(getInitialUser());
  const navigate = useNavigate();

  // Keep a ref in sync so syncAuthState never closes over stale state
  const isAuthenticatedRef = useRef(isAuthenticated);
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  // Stable callback — no state in deps, reads current value via ref
  const syncAuthState = useCallback(() => {
    const isValid = checkAuthStatus();
    if (isAuthenticatedRef.current && !isValid) {
      setIsAuthenticated(false);
      setUser(null);
    } else if (!isAuthenticatedRef.current && isValid) {
      setIsAuthenticated(true);
      setUser(getInitialUser());
    }
  }, []);

  useEffect(() => {
    // Check every 30 seconds
    const interval = setInterval(syncAuthState, 30_000);

    // Also check on window focus (user returning to tab)
    const onFocus = () => syncAuthState();
    window.addEventListener("focus", onFocus);

    // Instant multi-tab synchronization
    const onStorage = (e: StorageEvent) => {
      if (e.key === "auth_sync_event") {
        syncAuthState();
      }
    };
    window.addEventListener("storage", onStorage);

    // Listen for forced logout from API interceptor (e.g. refresh token expired)
    const onForceLogout = () => {
      clearUserScopedCaches();
      setIsAuthenticated(false);
      setUser(null);
      try {
        localStorage.setItem("auth_sync_event", `logout_${Date.now()}`);
      } catch {
        // ignore
      }
      navigate("/", { replace: true });
    };
    window.addEventListener("auth-logout", onForceLogout);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("auth-logout", onForceLogout);
    };
  }, [syncAuthState, navigate]);

  // To'liq profil (telefon/email) cookie'da yo'q — sahifa yuklanganda bir marta xotiraga olinadi.
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    api
      .get("/api/v1/auth/me")
      .then((res) => {
        const full = (res.data?.data ?? null) as User | null;
        if (!cancelled && full?.id) {
          setUser(full);
          // Eski (to'liq PII'li) cookie'ni minimal ko'rinishga almashtirish — migratsiya.
          const isSecure = window.location.protocol === "https:";
          Cookies.set(USER_DATA_KEY, JSON.stringify(toCookieUser(full)), {
            expires: 1,
            secure: isSecure,
            sameSite: "lax",
            domain: getSharedCookieDomain(),
          });
        }
      })
      .catch(() => {
        // Offline yoki xato — cookie'dagi minimal ma'lumot bilan davom etiladi.
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const saveAuthData = (authData: AuthData) => {
    const { accessToken, refreshToken, user: userData, expiresIn } = authData;

    // expiresIn millisekundda kelsa kun hisobiga o'tkazamiz, kelmasa 1 kun
    // Access token endi qisqa (30 daqiqa) — cookie esa kamida 1 kun turadi, JWT muddatini server tekshiradi
    // va interceptor uni refresh orqali yangilaydi.
    const expiryDays = Math.max(1, expiresIn ? expiresIn / (1000 * 60 * 60 * 24) : 1);

    // HTTP da secure: true cookie saqlanmaydi, shuning uchun protocol'ga qarab o'rnatamiz
    const isSecure = window.location.protocol === "https:";
    const domain = getSharedCookieDomain();

    Cookies.set(ACCESS_TOKEN_KEY, accessToken, {
      expires: expiryDays,
      secure: isSecure,
      sameSite: "lax",
      domain,
    });

    if (isCookieAuthMode()) {
      // Refresh token HttpOnly cookie'da (server o'rnatadi) — eski JS nusxasi o'chiriladi.
      Cookies.remove(REFRESH_TOKEN_KEY);
      if (domain) Cookies.remove(REFRESH_TOKEN_KEY, { domain });
    } else if (refreshToken) {
      Cookies.set(REFRESH_TOKEN_KEY, refreshToken, {
        expires: 30, // Refresh token uchun 30 kun
        secure: isSecure,
        sameSite: "lax",
        domain,
      });
    }

    Cookies.set(USER_DATA_KEY, JSON.stringify(toCookieUser(userData)), {
      expires: expiryDays,
      secure: isSecure,
      sameSite: "lax",
      domain,
    });

    try {
      localStorage.setItem("auth_sync_event", `login_${Date.now()}`);
    } catch {
      // ignore
    }

    setIsAuthenticated(true);
    setUser(userData);
  };

  const login = (authData: AuthData) => {
    saveAuthData(authData);
  };

  const register = (authData: AuthData) => {
    saveAuthData(authData);
  };

  const logout = async () => {
    try {
      // Tozalashdan oldin yuborilmagan natijalar bir marta yuboriladi (ko'pi bilan 4 s kutiladi).
      await Promise.race([
        flushPendingSubmits().catch(() => 0),
        new Promise((resolve) => setTimeout(resolve, 4000)),
      ]);
      const refreshToken = Cookies.get(REFRESH_TOKEN_KEY);
      if (isCookieAuthMode() || refreshToken) {
        // Cookie rejimida server HttpOnly cookie'dan o'qiydi va uni o'chiradi.
        await api.post("/api/v1/auth/logout", refreshToken ? { refreshToken } : {});
      }
    } catch {
      // Logout API xatosi bo'lsa ham, local tokenlarni tozalaymiz
    } finally {
      clearAuthCookies();
      clearUserScopedCaches();
      try {
        localStorage.setItem("auth_sync_event", `logout_${Date.now()}`);
      } catch {
        // ignore
      }
      setIsAuthenticated(false);
      setUser(null);
      navigate("/auth/login", { replace: true });
    }
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
