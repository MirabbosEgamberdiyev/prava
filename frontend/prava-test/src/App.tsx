import { useEffect, useRef, useState } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import AppRoutes from "./routes";
import { useRegisterSW } from "virtual:pwa-register/react";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import { useInstallPrompt } from "./hooks/useInstallPrompt";
import {
  Box,
  Button,
  CloseButton,
  Group,
  Text,
  useComputedColorScheme,
} from "@mantine/core";
import { IconDownload, IconExternalLink } from "@tabler/icons-react";

/**
 * Silent PWA auto-updater.
 * registerType: 'autoUpdate' in vite.config.ts handles SW updates automatically.
 * This component just ensures periodic update checks.
 */
function PWAUpdater() {
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        intervalRef.current = setInterval(() => registration.update(), 60 * 60 * 1000);
      }
    },
  });

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return null;
}

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
        notifications.show({
          title: t("errors.noInternetTitle"),
          message: detail.message || t("errors.networkError"),
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

/**
 * PWA banner — ilovani o'rnatish yoki ilovaga o'tish uchun
 * Faqat brauzerda ko'rinadi (standalone rejimda emas)
 * Update banners removed — updates happen silently via autoUpdate.
 */
function PWABanner() {
  const { t } = useTranslation();
  const colorScheme = useComputedColorScheme("light");
  const isDark = colorScheme === "dark";
  const { isInstalled, isStandalone, isInstallable, isIOS, install, openApp } =
    useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  // PWA ichida bo'lsa yoki yopilgan bo'lsa — ko'rsatmaymiz
  if (isStandalone || dismissed) return null;

  // Ilova o'rnatilgan — "Ilovaga o'tish"
  if (isInstalled) {
    return (
      <Box
        bg="blue"
        py={8}
        px="md"
        style={{ position: "relative", zIndex: 1000 }}
      >
        <Group justify="center" gap="sm" wrap="nowrap">
          <IconExternalLink size={18} color="white" />
          <Text size="sm" c="white" fw={500}>
            {t("pwa.openAppBanner")}
          </Text>
          <Button
            size="compact-sm"
            variant="white"
            color="blue"
            onClick={openApp}
          >
            {t("pwa.openApp")}
          </Button>
          <CloseButton
            size="sm"
            variant="transparent"
            c="white"
            onClick={() => setDismissed(true)}
          />
        </Group>
      </Box>
    );
  }

  const installBg = isDark ? "dark.6" : "dark.8";

  // O'rnatish mumkin (Chrome/Edge/Android)
  if (isInstallable) {
    return (
      <Box
        bg={installBg}
        py={8}
        px="md"
        style={{ position: "relative", zIndex: 1000 }}
      >
        <Group justify="center" gap="sm" wrap="nowrap">
          <IconDownload size={18} color="white" />
          <Text size="sm" c="white" fw={500}>
            {t("pwa.installBanner")}
          </Text>
          <Button
            size="compact-sm"
            variant="white"
            color="dark"
            onClick={install}
          >
            {t("pwa.installApp")}
          </Button>
          <CloseButton
            size="sm"
            variant="transparent"
            c="white"
            onClick={() => setDismissed(true)}
          />
        </Group>
      </Box>
    );
  }

  // iOS — manual ko'rsatma
  if (isIOS) {
    return (
      <Box
        bg={installBg}
        py={8}
        px="md"
        style={{ position: "relative", zIndex: 1000 }}
      >
        <Group justify="center" gap="sm" wrap="nowrap">
          <IconDownload size={18} color="white" />
          <Text size="sm" c="white" fw={500} lineClamp={1}>
            {t("pwa.iosInstallBanner")}
          </Text>
          <CloseButton
            size="sm"
            variant="transparent"
            c="white"
            onClick={() => setDismissed(true)}
          />
        </Group>
      </Box>
    );
  }

  return null;
}

/**
 * Inner app wrapper that resets ErrorBoundary on route change.
 */
function AppInner() {
  const location = useLocation();

  return (
    <ErrorBoundary key={location.pathname}>
      <AuthProvider>
        <PWAUpdater />
        <ApiErrorListener />
        <PWABanner />
        <AppRoutes />
      </AuthProvider>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}

export default App;
