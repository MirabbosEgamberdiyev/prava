import { useState } from "react";
import { Button } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useGoogleLogin } from "@react-oauth/google";
import { isTauriRuntime } from "../../auth/runtime";
import { useAuth } from "../../auth/AuthContext";
import { useAuthModal } from "../../auth/AuthModalContext";
import api from "../../api/api";
import { showToast } from "../../utils/notificationUtils";
import { getErrorMessage } from "../../types/errors";

export interface GoogleLoginButtonProps {
  mode?: "login" | "register";
  compact?: boolean;
  h?: number | string;
  radius?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.04 24.04 0 0 0 0 21.56l7.98-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

export const GoogleLoginButton = ({
  mode = "login",
  compact = false,
  h,
  radius = 10,
  className,
  style,
}: GoogleLoginButtonProps) => {
  const { t, i18n } = useTranslation();
  const { login: authLogin } = useAuth();
  const { executePending } = useAuthModal();
  const [loading, setLoading] = useState(false);

  const buttonText = compact
    ? "Google"
    : mode === "login"
    ? t("auth.google.loginButton")
    : t("auth.google.registerButton");

  // Fallback Google OAuth login for web browser environment
  let browserGoogleLogin: (() => void) | null = null;
  try {
    const hookLogin = useGoogleLogin({
      onSuccess: async (tokenResponse) => {
        setLoading(true);
        try {
          const response = await api.post("/api/v1/auth/google", {
            accessToken: tokenResponse.access_token,
          });

          if (response.data.success) {
            const userLang = response.data.data.user?.preferredLanguage;
            if (userLang) {
              i18n.changeLanguage(userLang);
            }

            authLogin(response.data.data);
            showToast({
              id: "auth-google-success",
              dedupeKey: "auth-google-success",
              title: t("auth.google.successTitle", { defaultValue: "Muvaffaqiyat" }),
              message: t("auth.google.successMessage", { defaultValue: "Google orqali tizimga kirdingiz!" }),
              color: "green",
              withBorder: true,
            });
            executePending();
          }
        } catch (err: unknown) {
          showToast({
            id: "auth-google-error",
            dedupeKey: "auth-google-error",
            color: "red",
            title: t("common.error"),
            message: getErrorMessage(err, t("auth.google.errorMessage")),
          });
        } finally {
          setLoading(false);
        }
      },
      onError: (errorResponse) => {
        const err = (errorResponse as { error?: string })?.error;
        if (err === "popup_closed_by_user" || err === "access_denied") {
          return;
        }
        showToast({
          id: "auth-google-popup-error",
          dedupeKey: "auth-google-popup-error",
          color: "red",
          title: t("common.error"),
          message: t("auth.google.errorMessage"),
        });
      },
    });
    browserGoogleLogin = hookLogin;
  } catch {
    // Graceful fallback if invoked outside GoogleOAuthProvider in isolated tests
  }

  const handleGoogleLogin = async () => {
    if (loading) return;

    if (isTauriRuntime()) {
      setLoading(true);
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("open_oauth_window", { provider: "google" });
      } catch (err) {
        console.error("Tauri open_oauth_window error:", err);
        showToast({
          id: "auth-google-tauri-error",
          dedupeKey: "auth-google-tauri-error",
          color: "red",
          title: t("common.error"),
          message: t("auth.socialLoginError", { defaultValue: "Google orqali kirish oynasini ochib bo'lmadi" }),
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    if (browserGoogleLogin) {
      browserGoogleLogin();
    } else {
      showToast({
        id: "auth-google-unavailable",
        color: "yellow",
        title: t("common.attention", { defaultValue: "Diqqat" }),
        message: t("auth.google.errorMessage", { defaultValue: "Google orqali kirish hozircha mavjud emas" }),
      });
    }
  };

  return (
    <Button
      leftSection={<GoogleIcon />}
      variant="default"
      size={compact ? "sm" : "md"}
      h={h ?? (compact ? 40 : 44)}
      fullWidth
      radius={radius}
      loading={loading}
      onClick={handleGoogleLogin}
      className={className}
      styles={{
        root: {
          fontWeight: 600,
          fontSize: compact ? 13 : "14px",
          border: "1px solid rgba(255, 255, 255, 0.18)",
          backgroundColor: "#ffffff",
          color: "#1f2937",
          transition: "all 0.16s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
          ...style,
        },
      }}
    >
      {loading ? t("auth.google.authenticating", "Google orqali kirilmoqda...") : buttonText}
    </Button>
  );
};

export default GoogleLoginButton;
