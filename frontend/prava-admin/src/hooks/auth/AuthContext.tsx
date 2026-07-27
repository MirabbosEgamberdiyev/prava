/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import api, { getAccessToken, getRefreshToken, saveTokens, clearTokens } from "../../services/api";

// O'zgaruvchi nomlari o'z holicha qoldi
const USER_DATA_KEY = "userData";

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  loading: boolean;
  login: (authData: any) => void;
  register: (authData: any) => void;
  logout: () => void;
  /** Profil tahrirlangandan keyin sessiyadagi user ma'lumotini yangilaydi */
  updateUser: (patch: Record<string, unknown>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const logout = useCallback(async () => {
    // Backend'ga logout so'rov yuborish
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await api.post("/api/v1/auth/logout", { refreshToken });
      } catch {
        // Logout API xatoligi bo'lsa ham, local ma'lumotlarni tozalaymiz
      }
    }

    clearTokens();

    setIsAuthenticated(false);
    setUser(null);

    // NO-RELOAD FIX: avval `window.location.href = "/auth/login"` edi — butun
    // SPA qayta yuklanardi. Endi router orqali yumshoq o'tish (prava-test
    // bilan bir xil yondashuv).
    navigate("/auth/login", { replace: true });
  }, [navigate]);

  // Sahifa yangilanganda cookie'dan ma'lumotlarni tiklash
  // (TOKEN STORAGE FIX: avval sessionStorage edi)
  useEffect(() => {
    const token = getAccessToken();
    const savedUser = Cookies.get(USER_DATA_KEY);

    if (token && savedUser) {
      try {
        setIsAuthenticated(true);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Sessiya ma'lumotlarini o'qishda xatolik:", e);
        logout(); // Agar ma'lumot buzilgan bo'lsa, hammasini tozalaymiz
      }
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Boshqa joyda (api.ts interceptori) yuborilgan majburiy logout hodisasini
  // tinglaydi — masalan refresh token muddati tugaganda. Bu yerda navigate()
  // chaqirish uchun context AuthProvider ichida joylashgan bo'lishi kerak.
  useEffect(() => {
    const onForceLogout = () => {
      clearTokens();
      setIsAuthenticated(false);
      setUser(null);
      navigate("/auth/login", { replace: true });
    };
    window.addEventListener("auth-logout", onForceLogout);
    return () => window.removeEventListener("auth-logout", onForceLogout);
  }, [navigate]);

  const saveAuthData = (authData: any) => {
    const { accessToken, refreshToken, user: userData } = authData;

    saveTokens(accessToken, refreshToken, userData);

    setIsAuthenticated(true);
    setUser(userData);
  };

  const login = (authData: any) => saveAuthData(authData);
  const register = (authData: any) => saveAuthData(authData);

  /**
   * Sozlamalar sahifasida profil yangilangach chaqiriladi.
   * Busiz header/avatar qayta login qilinmaguncha eski ism-familiyani
   * ko'rsatib turardi (cookie va context yangilanmasdi).
   */
  const updateUser = (patch: Record<string, unknown>) => {
    setUser((prev: any) => {
      const next = { ...(prev ?? {}), ...patch };
      try {
        Cookies.set(USER_DATA_KEY, JSON.stringify(next), {
          expires: 1,
          secure: window.location.protocol === "https:",
          sameSite: window.location.protocol === "https:" ? "strict" : "lax",
        });
      } catch {
        // cookie yozib bo'lmasa ham — context baribir yangilanadi
      }
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, loading, login, register, logout, updateUser }}
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
