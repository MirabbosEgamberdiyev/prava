import { useEffect, useRef } from "react";
import { createBrowserRouter, RouterProvider, useLocation } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { DesktopThemeProvider } from "./context/DesktopThemeContext";
import { TypographyProvider } from "./context/TypographyContext";
import { LanguageProvider } from "./context/LanguageContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import AppRoutes from "./routes";
import GoogleOneTap from "./components/auth/GoogleOneTap";
import { isGoogleOneTapAllowed } from "./utils/domain";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import { ScrollManager } from "./components/common/ScrollManager";
import { AuthModalProvider } from "./auth/AuthModalContext";
import { TariffPaywallProvider } from "./context/TariffPaywallContext";
import TariffPaywallModal from "./components/common/TariffPaywallModal";

/**
 * Global API error listener with deduplication cooldown.
 * Prevents toast spam when polling endpoints (like /me, /statistics) hit repeated errors.
 */
function ApiErrorListener() {
  const { t } = useTranslation();
  const lastToastRef = useRef<Record<string, number>>({});
  const COOLDOWN_MS = 60_000; // 1 minute cooldown per endpoint

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail as {
        status: number;
        message: string;
        url?: string;
      };

      // Deduplication: skip if same endpoint showed toast recently
      const endpoint = detail.url || `status-${detail.status}`;
      const now = Date.now();
      if (now - (lastToastRef.current[endpoint] || 0) < COOLDOWN_MS) return;
      lastToastRef.current[endpoint] = now;

      if (detail.status === 403) {
        notifications.show({
          title: t("common.error"),
          message: detail.message || t("errors.accessDenied"),
          color: "orange",
          autoClose: 5000,
        });
      } else if (detail.status >= 500) {
        notifications.show({
          title: t("common.error"),
          message: detail.message || t("errors.serverError"),
          color: "red",
          autoClose: 5000,
        });
      } else if (detail.status === 0) {
        const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
        notifications.show({
          title: isOffline ? t("errors.noInternetTitle") : t("common.error"),
          message: isOffline
            ? (detail.message || t("errors.networkError"))
            : t("errors.serverUnreachable"),
          color: "red",
          autoClose: 5000,
        });
      }
    };

    window.addEventListener("api-error", handler);
    return () => window.removeEventListener("api-error", handler);
  }, [t]);

  return null;
}

import GlobalSearchHost from "./features/Search/GlobalSearchHost";
import DesktopFrame from "./shell/DesktopFrame";

/**
 * Inner app wrapper that resets ErrorBoundary on route change.
 */
function AppInner() {
  const location = useLocation();
  const allowGoogleOneTap = isGoogleOneTapAllowed(location.pathname);

  return (
    <DesktopThemeProvider>
      <TypographyProvider>
        <AuthProvider>
          <AuthModalProvider>
            <TariffPaywallProvider>
              <LanguageProvider>
                <ApiErrorListener />
                {allowGoogleOneTap && <GoogleOneTap />}
                <ScrollManager />
                <GlobalSearchHost />
                <TariffPaywallModal />
                <DesktopFrame>
                  <ErrorBoundary resetKey={location.pathname}>
                    <AppRoutes />
                  </ErrorBoundary>
                </DesktopFrame>
              </LanguageProvider>
            </TariffPaywallProvider>
          </AuthModalProvider>
        </AuthProvider>
      </TypographyProvider>
    </DesktopThemeProvider>
  );
}

/*
 * Data router (createBrowserRouter): `useBlocker` (imtihon davomida sahifadan
 * chiqishni tasdiqlash, W-07) faqat data router ichida ishlaydi. Barcha
 * marshrutlar avvalgidek `AppRoutes` ichidagi <Routes> da — bu yerda faqat
 * bitta catch-all marshrut.
 */
const router = createBrowserRouter([{ path: "*", element: <AppInner /> }]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
