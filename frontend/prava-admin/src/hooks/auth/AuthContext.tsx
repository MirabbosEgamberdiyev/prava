/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import api from "../../services/api";

// O'zgaruvchi nomlari o'z holicha qoldi
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_DATA_KEY = "userData";

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  loading: boolean;
  login: (authData: any) => void;
  register: (authData: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Sahifa yangilanganda Session Storage'dan ma'lumotlarni tiklash
  useEffect(() => {
    const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
    const savedUser = sessionStorage.getItem(USER_DATA_KEY);

    if (token && savedUser) {
      try {
        setIsAuthenticated(true);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Session ma'lumotlarini o'qishda xatolik:", e);
        logout(); // Agar ma'lumot buzilgan bo'lsa, hammasini tozalaymiz
      }
    }
    setLoading(false);
  }, []);

  const saveAuthData = (authData: any) => {
    const { accessToken, refreshToken, user: userData } = authData;

    // Session Storage'ga ma'lumotlarni yozish
    if (accessToken) {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    }
    if (refreshToken) {
      sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    if (userData) {
      sessionStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    }

    setIsAuthenticated(true);
    setUser(userData);
  };

  const login = (authData: any) => saveAuthData(authData);
  const register = (authData: any) => saveAuthData(authData);

  const logout = async () => {
    // Backend'ga logout so'rov yuborish
    const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      try {
        await api.post("/api/v1/auth/logout", { refreshToken });
      } catch {
        // Logout API xatoligi bo'lsa ham, local ma'lumotlarni tozalaymiz
      }
    }

    // Session Storage'ni tozalash
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(USER_DATA_KEY);

    setIsAuthenticated(false);
    setUser(null);

    // Login sahifaga redirect
    window.location.href = "/auth/login";
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, loading, login, register, logout }}
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
