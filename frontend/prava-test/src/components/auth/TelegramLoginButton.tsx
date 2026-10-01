import { useState, useCallback, useRef } from "react";
import {
  Button,
  Modal,
  Stack,
  Text,
  TextInput,
  Group,
  ThemeIcon,
  Divider,
} from "@mantine/core";
import { showToast } from "../../utils/notificationUtils";
import { useAuth } from "../../auth/AuthContext";
import { useAuthModal } from "../../auth/AuthModalContext";
import { useTranslation } from "react-i18next";
import api from "../../api/api";
import { ENV } from "../../config/env";
import { getErrorMessage } from "../../types/errors";
import { IconBrandTelegram, IconKey, IconExternalLink } from "@tabler/icons-react";

export interface TelegramLoginButtonProps {
  mode?: "login" | "register";
  compact?: boolean;
  h?: number | string;
  radius?: number | string;
  className?: string;
  style?: React.CSSProperties;
  hideBotOption?: boolean;
}

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

declare global {
  interface Window {
    Telegram?: {
      Login: {
        auth: (
          options: { bot_id: number; request_access?: boolean },
          callback: (user: TelegramUser | false) => void
        ) => void;
      };
    };
  }
}

const TELEGRAM_BOT_ID = ENV.TELEGRAM_BOT_ID;
/** Only used in a plain browser (vite dev / web); never loaded inside the Tauri webview. */
const TELEGRAM_WIDGET_SRC = "https://telegram.org/js/telegram-widget.js?22";

const isTauriRuntime = () =>
  typeof window !== "undefined" &&
  Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);

const TelegramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const TelegramLoginButton = ({
  mode = "login",
  compact = false,
  h,
  radius = 10,
  className,
  style,
  hideBotOption = false,
}: TelegramLoginButtonProps) => {
  const { t, i18n } = useTranslation();
  const { login: authLogin } = useAuth();
  const { executePending } = useAuthModal();
  const [loading, setLoading] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [submittingToken, setSubmittingToken] = useState(false);
  const isSubmittingRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);

  const clearSafetyTimeout = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const startSafetyTimeout = () => {
    clearSafetyTimeout();
    timeoutRef.current = window.setTimeout(() => {
      setLoading(false);
      setModalOpened(true);
    }, 12000);
  };

  const handleTokenSubmit = async (tokenValue?: string) => {
    if (isSubmittingRef.current) return;
    const raw = (tokenValue || tokenInput).trim();
    if (!raw) return;

    let token = raw;
    if (raw.includes("token=")) {
      try {
        const url = new URL(raw, "https://pravaonline.uz");
        token = url.searchParams.get("token") || raw;
      } catch {
        const match = raw.match(/token=([a-zA-Z0-9_-]+)/);
        if (match) token = match[1];
      }
    }

    isSubmittingRef.current = true;
    setSubmittingToken(true);
    try {
      const response = await api.post("/api/v1/auth/telegram/token-login", {
        token,
      });

      if (response.data.success) {
        const userLang = response.data.data.user?.preferredLanguage;
        if (userLang) {
          i18n.changeLanguage(userLang);
        }

        authLogin(response.data.data);
        setModalOpened(false);
        showToast({
          id: "auth-telegram-token-success",
          dedupeKey: "auth-telegram-token-success",
          title: t("auth.telegram.successTitle"),
          message: t("auth.telegram.successMessage"),
          color: "green",
          withBorder: true,
        });
        executePending();
      }
    } catch (err: unknown) {
      showToast({
        id: "auth-telegram-token-error",
        dedupeKey: "auth-telegram-token-error",
        color: "red",
        title: t("common.error"),
        message: getErrorMessage(err, t("auth.telegramCallbackInvalid")),
      });
    } finally {
      isSubmittingRef.current = false;
      setSubmittingToken(false);
    }
  };

  const isTauri = isTauriRuntime();

  const openExternalUrl = useCallback(async (url: string) => {
    if (isTauri) {
      try {
        const { openUrl } = await import("@tauri-apps/plugin-opener");
        await openUrl(url);
        return;
      } catch {
        // fallback
      }
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }, [isTauri]);

  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.endsWith(".local"));

  const botUsername = ENV.TELEGRAM_BOT_USERNAME || "pravaonlineuzbot";
  const botUrl = `https://t.me/${botUsername}?start=desktop`;
  const isRegister = mode === "register";

  const handleTelegramLogin = useCallback(async () => {
    if (loading) return;

    if (isTauri) {
      try {
        setLoading(true);
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("open_oauth_window", { provider: "telegram" });
      } catch (err) {
        console.error("Tauri open_oauth_window for telegram error:", err);
        setModalOpened(true);
      } finally {
        setLoading(false);
      }
      return;
    }

    // In local development / localhost, Telegram widget origin check always fails
    // because BotFather only permits the production domain (pravaonline.uz).
    // Smoothly launch the Telegram bot and open the 5-digit verification code modal!
    if (isLocalhost) {
      setModalOpened(true);
      void openExternalUrl(botUrl);
      return;
    }

    if (window.Telegram?.Login?.auth) {
      setLoading(true);
      startSafetyTimeout();

      try {
        window.Telegram.Login.auth(
          { bot_id: TELEGRAM_BOT_ID, request_access: true },
          async (user: TelegramUser | false) => {
            clearSafetyTimeout();
            if (!user) {
              setLoading(false);
              // Fallback to bot code entry so the user is never stuck
              setModalOpened(true);
              return;
            }

            try {
              const response = await api.post("/api/v1/auth/telegram", {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name || "",
                username: user.username || "",
                photoUrl: user.photo_url || "",
                authDate: user.auth_date,
                hash: user.hash,
              });

              if (response.data.success) {
                const userLang = response.data.data.user?.preferredLanguage;
                if (userLang) {
                  i18n.changeLanguage(userLang);
                }

                authLogin(response.data.data);
                showToast({
                  id: "auth-telegram-auth-success",
                  dedupeKey: "auth-telegram-auth-success",
                  title: t("auth.telegram.successTitle"),
                  message: t("auth.telegram.successMessage"),
                  color: "green",
                  withBorder: true,
                });
                executePending();
              }
            } catch (err: unknown) {
              showToast({
                id: "auth-telegram-auth-error",
                dedupeKey: "auth-telegram-auth-error",
                color: "red",
                title: t("common.error"),
                message: getErrorMessage(err, t("auth.telegram.errorMessage")),
              });
              setModalOpened(true);
            } finally {
              setLoading(false);
            }
          }
        );
      } catch {
        clearSafetyTimeout();
        setLoading(false);
        setModalOpened(true);
      }
    } else {
      // Browser only: load Telegram widget script and retry
      setLoading(true);
      startSafetyTimeout();
      const script = document.createElement("script");
      script.src = TELEGRAM_WIDGET_SRC;
      script.async = true;
      script.onload = () => {
        clearSafetyTimeout();
        if (window.Telegram?.Login?.auth) {
          handleTelegramLogin();
        } else {
          setLoading(false);
          setModalOpened(true);
        }
      };
      script.onerror = () => {
        clearSafetyTimeout();
        setLoading(false);
        setModalOpened(true);
      };
      document.head.appendChild(script);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLogin, executePending, t, i18n, isLocalhost, botUrl, openExternalUrl]);

  return (
    <>
      <Button
        leftSection={<TelegramIcon />}
        variant="filled"
        color="#229ED9"
        size={compact ? "sm" : "md"}
        h={h ?? (compact ? 40 : 44)}
        fullWidth
        radius={radius}
        loading={loading}
        onClick={handleTelegramLogin}
        className={className}
        styles={{
          root: {
            fontWeight: 600,
            fontSize: compact ? 13 : "14px",
            color: "#ffffff",
            backgroundColor: "#229ed9",
            transition: "all 0.16s cubic-bezier(0.16, 1, 0.3, 1)",
            boxShadow: "0 4px 14px rgba(34, 158, 217, 0.35)",
            ...style,
          },
        }}
      >
        {compact
          ? "Telegram"
          : isRegister
          ? t("auth.telegram.registerButton")
          : t("auth.telegram.loginButton")}
      </Button>

      {isTauri && !compact && !hideBotOption && (
        <Text
          component="button"
          type="button"
          size="xs"
          c="dimmed"
          ta="center"
          mt={4}
          style={{
            cursor: "pointer",
            textDecoration: "underline",
            background: "transparent",
            border: "none",
            width: "100%",
          }}
          onClick={() => setModalOpened(true)}
        >
          {t("auth.telegram.botOption")}
        </Text>
      )}

      {/* Modal: Telegram bot + one-time code (reliable desktop path) */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        closeButtonProps={{ "aria-label": t("common.close") }}
        title={
          <Group gap="xs">
            <ThemeIcon size="md" color="#229ED9" radius="md">
              <IconBrandTelegram size={20} />
            </ThemeIcon>
            <Text fw={700} fz="md">
              {isRegister ? t("auth.telegram.registerButton") : t("auth.loginWithTelegram")}
            </Text>
          </Group>
        }
        centered
        radius="lg"
        size="md"
        zIndex={100001}
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            {isRegister ? t("auth.telegram.modalDescRegister") : t("auth.telegram.modalDescLogin")}
          </Text>

          <Stack
            gap="xs"
            p="md"
            style={{
              background: "var(--surface)",
              borderRadius: "12px",
              border: "1px solid var(--border)",
            }}
          >
            <Text size="xs" fw={700} c="dimmed">
              {t("auth.telegram.stepLabel", { n: 1 })}
            </Text>
            <Text size="sm">{t("auth.telegram.step1")}</Text>
            <Button
              fullWidth
              variant="light"
              color="#229ED9"
              leftSection={<IconBrandTelegram size={18} />}
              rightSection={<IconExternalLink size={16} />}
              onClick={() => openExternalUrl(botUrl)}
            >
              {t("auth.telegram.openBot", { bot: botUsername })}
            </Button>
          </Stack>

          <Divider label={t("auth.telegram.then")} labelPosition="center" />

          <Stack
            gap="xs"
            p="md"
            style={{
              background: "var(--surface)",
              borderRadius: "12px",
              border: "1px solid var(--border)",
            }}
          >
            <Text size="xs" fw={700} c="dimmed">
              {t("auth.telegram.stepLabel", { n: 2 })}
            </Text>
            <Text size="sm">{t("auth.telegram.step2")}</Text>
            <TextInput
              placeholder={t("auth.telegram.codePlaceholder")}
              aria-label={t("auth.telegram.codeLabel")}
              leftSection={<IconKey size={18} />}
              value={tokenInput}
              onChange={(e) => {
                const val = e.currentTarget.value;
                setTokenInput(val);
                if (/^\d{5}$/.test(val.trim())) {
                  handleTokenSubmit(val.trim());
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleTokenSubmit();
                }
              }}
              size="md"
              radius="md"
              styles={{
                input: {
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: tokenInput.length > 0 && /^\d+$/.test(tokenInput) ? 4 : 1,
                  textAlign: "center",
                },
              }}
            />
            <Button
              fullWidth
              color="#229ED9"
              loading={submittingToken}
              disabled={!tokenInput.trim()}
              onClick={() => handleTokenSubmit()}
              radius="md"
            >
              {isRegister ? t("auth.register") : t("auth.login")}
            </Button>
          </Stack>
        </Stack>
      </Modal>
    </>
  );
};

export default TelegramLoginButton;
