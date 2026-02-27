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
  Button,
  Group,
  Image,
  Modal,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { IconDownload, IconShare, IconX } from "@tabler/icons-react";

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

const PWA_DISMISSED_KEY = "pwa_modal_dismissed";

/**
 * PWA modal — ilovani o'rnatish yoki ilovaga o'tish uchun
 * Faqat brauzerda ko'rinadi (standalone rejimda emas)
 * sessionStorage da dismiss holatini saqlaydi — refresh qilganda qayta chiqmaydi
 */
function PWAModal() {
  const { t } = useTranslation();
  const { isInstalled, isStandalone, isInstallable, isIOS, install } =
    useInstallPrompt();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(PWA_DISMISSED_KEY) === "true";
    } catch {
      return false;
    }
  });

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(PWA_DISMISSED_KEY, "true");
    } catch { /* ignore */ }
  };

  const handleInstall = async () => {
    await install();
    handleDismiss();
  };

  // PWA ichida bo'lsa, yopilgan bo'lsa, yoki hech narsa ko'rsatish kerak bo'lmasa
  if (isStandalone || dismissed) return null;

  // Ilova allaqachon o'rnatilgan — ko'rsatmaymiz (banner emas, modal ham emas)
  if (isInstalled) return null;

  // Faqat o'rnatish mumkin bo'lganda yoki iOS da modal ko'rsatamiz
  const showModal = isInstallable || isIOS;
  if (!showModal) return null;

  return (
    <Modal
      opened
      onClose={handleDismiss}
      centered
      radius="lg"
      size="sm"
      withCloseButton={false}
      overlayProps={{ backgroundOpacity: 0.4, blur: 3 }}
      padding="xl"
    >
      <Stack align="center" gap="md">
        <Image
          src="/logo.svg"
          alt="Prava Online"
          w={64}
          h={64}
          fit="contain"
          fallbackSrc="/favicon.svg"
        />
        <Text size="lg" fw={700} ta="center">
          Prava Online
        </Text>
        <Text size="sm" c="dimmed" ta="center">
          {t("pwa.installBanner")}
        </Text>

        {isInstallable && (
          <Button
            fullWidth
            size="md"
            radius="md"
            leftSection={<IconDownload size={20} />}
            onClick={handleInstall}
          >
            {t("pwa.installApp")}
          </Button>
        )}

        {isIOS && (
          <Stack gap="xs" w="100%">
            <Group gap="xs" justify="center">
              <ThemeIcon variant="light" size="sm" radius="xl">
                <IconShare size={14} />
              </ThemeIcon>
              <Text size="sm" c="dimmed">
                {t("pwa.iosInstallBanner")}
              </Text>
            </Group>
          </Stack>
        )}

        <Button
          fullWidth
          size="md"
          radius="md"
          variant="light"
          color="gray"
          leftSection={<IconX size={18} />}
          onClick={handleDismiss}
        >
          {t("common.close")}
        </Button>
      </Stack>
    </Modal>
  );
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
        <PWAModal />
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
