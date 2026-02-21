import axios, {
  type AxiosInstance,
  AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import Cookies from "js-cookie";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

// Refresh uchun alohida instance (interceptor loop'dan qochish)
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 1. Tokenni olish
    const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);

    // 2. Tilni cookiedan olish (i18next odatda 'i18next' yoki 'i18nextLng' deb saqlaydi)
    const language = Cookies.get("i18next") || "uzl";

    if (config.headers) {
      // Tokenni biriktirish
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // TILNI BIRIKTIRISH (Swaggerdagi kabi)
      config.headers["Accept-Language"] = language;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// Refresh token logikasi
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // 403 Forbidden - ruxsat yo'q
    if (error.response?.status === 403) {
      const data = error.response?.data as Record<string, unknown> | undefined;
      window.dispatchEvent(
        new CustomEvent("api-error", {
          detail: {
            status: 403,
            message: (data?.message as string) || "",
          },
        }),
      );
      return Promise.reject(error);
    }

    // 401 bo'lsa va retry qilinmagan bo'lsa
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);

      // Refresh token yo'q bo'lsa — to'g'ridan-to'g'ri logout
      if (!refreshToken) {
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        sessionStorage.removeItem(REFRESH_TOKEN_KEY);
        sessionStorage.removeItem("userData");
        window.location.href = "/auth/login";
        return Promise.reject(error);
      }

      // Agar allaqachon refresh qilinayotgan bo'lsa, navbatga qo'shish
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await refreshClient.post("/api/v1/auth/refresh", {
          refreshToken,
        });

        const newAccessToken =
          response.data.data?.accessToken || response.data.accessToken;
        const newRefreshToken =
          response.data.data?.refreshToken || response.data.refreshToken;

        if (newAccessToken) {
          sessionStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);

          if (newRefreshToken) {
            sessionStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
          }

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }

          processQueue(null, newAccessToken);
          return api(originalRequest);
        }

        throw new Error("No access token in refresh response");
      } catch (refreshError) {
        processQueue(refreshError, null);
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        sessionStorage.removeItem(REFRESH_TOKEN_KEY);
        sessionStorage.removeItem("userData");
        window.location.href = "/auth/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
