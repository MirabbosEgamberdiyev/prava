import React, { useState, useEffect, useRef, useCallback } from "react";
import { Loader, Stack, Text, Center, Button } from "@mantine/core";
import { QRCodeSVG } from "qrcode.react";
import {
  IconX,
  IconQrcode,
  IconClock,
  IconRefresh,
  IconLink,
  IconCheck,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useAuthModal } from "../../auth/AuthModalContext";
import { useAuthReturnUrl } from "../../auth/useAuthReturnUrl";
import { clearPendingAuthRedirect } from "../../auth/pendingAuthRedirect";
import { startQrPolling } from "../../auth/qrPolling";
import {
  QrAuthService,
  type QrInitResponse,
  type QrSessionStatus,
} from "../../api/qrAuthService";
import { showToast } from "../../utils/notificationUtils";
import { GoogleLoginButton } from "./GoogleLoginButton";
import TelegramLoginButton from "./TelegramLoginButton";
import "../../styles/unified-auth-card.css";

export interface UnifiedAuthCardProps {
  /** 'page' for full-page routes (/auth/login), 'modal' for popups (DesktopAuthModal) */
  mode?: "page" | "modal";
  /** Called when the top-right close button (on main view) or guest button is clicked in modal */
  onClose?: () => void;
  /** Initial view to show */
  initialView?: "main" | "qr";
}

// Graduation cap + car SVG icon matching the user screenshot
function GraduationBadgeIcon() {
  return (
    <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

export const UnifiedAuthCard: React.FC<UnifiedAuthCardProps> = ({
  mode = "page",
  onClose,
  initialView = "main",
}) => {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const { executePending } = useAuthModal();
  const navigate = useNavigate();
  const { returnUrl: from } = useAuthReturnUrl();

  const [view, setView] = useState<"main" | "qr">(initialView);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const isAnyLoading = googleLoading || telegramLoading;

  // QR Pairing Session State
  const [session, setSession] = useState<QrInitResponse | null>(null);
  const [status, setStatus] = useState<QrSessionStatus>("PENDING");
  const [timeLeft, setTimeLeft] = useState<number>(90);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const stopPollRef = useRef<(() => void) | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Keep latest callbacks for polling
  const loginRef = useRef(login);
  const executePendingRef = useRef(executePending);
  const tRef = useRef(t);
  const i18nRef = useRef(i18n);
  const navigateRef = useRef(navigate);
  const fromRef = useRef(from);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    loginRef.current = login;
    executePendingRef.current = executePending;
    tRef.current = t;
    i18nRef.current = i18n;
    navigateRef.current = navigate;
    fromRef.current = from;
    onCloseRef.current = onClose;
  });

  const clearTimers = useCallback(() => {
    stopPollRef.current?.();
    stopPollRef.current = null;
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  const startNewSession = useCallback(async () => {
    if (!isMountedRef.current) return;
    setLoading(true);
    setStatus("PENDING");
    clearTimers();

    try {
      const newSession = await QrAuthService.initSession();
      if (!isMountedRef.current) return;
      setSession(newSession);
      setTimeLeft(newSession.expiresIn || 90);

      countdownTimerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearTimers();
            setStatus("EXPIRED");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      stopPollRef.current = startQrPolling({
        sessionId: newSession.sessionId,
        pollSecret: newSession.pollSecret,
        intervalMs: 1500,
        onStatus: (res) => {
          if (!isMountedRef.current) return;
          if (res.status === "SCANNED") {
            setStatus("SCANNED");
          } else if (res.status === "APPROVED" && res.accessToken && res.user) {
            clearTimers();
            setStatus("APPROVED");
            const userLang = res.user.preferredLanguage;
            if (userLang) {
              i18nRef.current.changeLanguage(userLang);
            }
            loginRef.current({
              accessToken: res.accessToken,
              refreshToken: res.refreshToken || "",
              user: res.user,
            });
            showToast({
              id: "qr-login-success",
              title: tRef.current("qr.loginSuccessTitle"),
              message: tRef.current("qr.loginSuccessDesc"),
              color: "green",
            });
            executePendingRef.current();
            if (mode === "modal" && onCloseRef.current) {
              onCloseRef.current();
            } else {
              navigateRef.current(fromRef.current || "/me", { replace: true });
            }
          } else if (res.status === "EXPIRED" || res.status === "REJECTED") {
            clearTimers();
            setStatus(res.status);
          }
        },
      });
    } catch (err: unknown) {
      clearTimers();
      if (!isMountedRef.current) return;
      showToast({
        id: "qr-session-init-error",
        color: "red",
        title: tRef.current("common.error"),
        message: (err as Error)?.message || tRef.current("qr.serviceUnavailable"),
      });
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [clearTimers, mode]);

  useEffect(() => {
    isMountedRef.current = true;
    if (view === "qr") {
      startNewSession();
    } else {
      clearTimers();
    }
    return () => {
      clearTimers();
    };
  }, [view, startNewSession, clearTimers]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      clearTimers();
    };
  }, [clearTimers]);

  const continueAsGuest = () => {
    clearPendingAuthRedirect();
    if (mode === "modal" && onClose) {
      onClose();
    } else {
      navigate(from || "/me", { replace: true });
    }
  };

  const handleCopyLink = () => {
    const payload = session?.qrPayload || window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(payload);
    }
    setCopied(true);
    showToast({
      id: "qr-copy-toast",
      title: t("common.close"),
      message: t("qr.copiedToast"),
      color: "teal",
    });
    setTimeout(() => {
      if (isMountedRef.current) {
        setCopied(false);
      }
    }, 2500);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="uac-card-wrapper">
      <div className="uac-card">
        {/* VIEW 1: MAIN 3-METHOD AUTH VIEW */}
        {view === "main" ? (
          <>
            {/* Modal Close Button if opened inside a modal */}
            {mode === "modal" && onClose && (
              <button
                type="button"
                className="uac-close-btn"
                onClick={onClose}
                title={t("common.close")}
                aria-label={t("common.close")}
              >
                <IconX size={20} />
              </button>
            )}

            {/* Top Logo Badge */}
            <div className="uac-logo-badge">
              <div className="uac-logo-badge-inner">
                <GraduationBadgeIcon />
              </div>
            </div>

            {/* Title & Subtitle */}
            <h1 className="uac-title">{t("authV2.login.title")}</h1>
            <p className="uac-subtitle">{t("authV2.register.subtitle")}</p>

            {/* Stack of Auth Actions */}
            <div className="uac-stack">
              {/* 1. Google OAuth */}
              <GoogleLoginButton
                mode="login"
                h={48}
                radius={14}
                disabled={isAnyLoading}
                onLoadingChange={setGoogleLoading}
                onSuccess={() => {
                  if (mode === "modal" && onClose) {
                    onClose();
                  } else {
                    navigate(from || "/me", { replace: true });
                  }
                }}
                style={{ width: "100%", height: 48, borderRadius: 14, fontWeight: 700, fontSize: 15 }}
              />

              {/* 2. Telegram Login */}
              <TelegramLoginButton
                mode="login"
                h={48}
                radius={14}
                disabled={isAnyLoading}
                onLoadingChange={setTelegramLoading}
                onSuccess={() => {
                  if (mode === "modal" && onClose) {
                    onClose();
                  } else {
                    navigate(from || "/me", { replace: true });
                  }
                }}
                style={{ width: "100%", height: 48, borderRadius: 14, fontWeight: 700, fontSize: 15 }}
              />

              {/* Divider: yoki */}
              <div className="uac-divider" aria-hidden="true">
                <span className="uac-divider-line" />
                <span className="uac-divider-text">{t("auth.orContinueWith")}</span>
                <span className="uac-divider-line" />
              </div>

              {/* 3. Mobil ilova orqali kiring */}
              <button
                type="button"
                className="uac-btn-mobile"
                disabled={isAnyLoading}
                onClick={() => setView("qr")}
                style={{
                  opacity: isAnyLoading ? 0.6 : 1,
                  cursor: isAnyLoading ? "not-allowed" : "pointer",
                }}
              >
                <IconQrcode size={22} color="#0284c7" stroke={2} />
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                  <span>{t("qr.appLoginTitle")}</span>
                  {t("qr.appLoginSubtitle") ? (
                    <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted, #64748b)" }}>
                      {t("qr.appLoginSubtitle")}
                    </span>
                  ) : null}
                </div>
              </button>
            </div>

            {/* Mehmon sifatida davom etish */}
            <button
              type="button"
              className="uac-guest-link"
              onClick={continueAsGuest}
            >
              {t("auth.continueGuest")}
            </button>
          </>
        ) : (
          /* VIEW 2: QR PAIRING VIEW (Qurilmani bog'lash) */
          <>
            {/* Close Button: Returns to Main 3-method View */}
            <button
              type="button"
              className="uac-close-btn"
              onClick={() => setView("main")}
              title={t("common.close")}
              aria-label={t("common.close")}
            >
              <IconX size={20} />
            </button>

            {/* Title & Subtitle */}
            <h2 className="uac-title">{t("qr.devicePairingTitle")}</h2>
            <p className="uac-subtitle">{t("qr.devicePairingDesc")}</p>

            {/* QR Code Container */}
            <div className="uac-qr-box">
              {loading ? (
                <Center w={200} h={200}>
                  <Loader size="md" color="#0284c7" />
                </Center>
              ) : status === "APPROVED" ? (
                <Center w={200} h={200}>
                  <Stack align="center" gap={10}>
                    <Loader size="md" color="#0284c7" />
                    <Text fz={13.5} fw={600} c="dimmed">
                      {t("qr.approved")}
                    </Text>
                  </Stack>
                </Center>
              ) : status === "SCANNED" ? (
                <Center w={200} h={200}>
                  <Stack align="center" gap={8} ta="center" px={10}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        backgroundColor: "rgba(47, 158, 68, 0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#2f9e44",
                      }}
                    >
                      <IconCheck size={28} stroke={2.4} />
                    </div>
                    <Text fz={13.5} fw={700} c="#2f9e44">
                      {t("qr.scanned")}
                    </Text>
                  </Stack>
                </Center>
              ) : session && status !== "EXPIRED" && status !== "REJECTED" ? (
                <>
                  <QRCodeSVG value={session.qrPayload} size={200} level="M" />
                  <div className="uac-qr-radar" aria-hidden="true" />
                </>
              ) : (
                <Center w={200} h={200}>
                  <Stack align="center" gap={10}>
                    <Text fz={13.5} c="dimmed" fw={600} ta="center">
                      {status === "EXPIRED"
                        ? t("qr.expired")
                        : status === "REJECTED"
                        ? t("qr.rejected", { defaultValue: "Ulanish bekor qilindi" })
                        : t("qr.initFailed", "QR kod yuklanmadi")}
                    </Text>
                    <Button
                      size="xs"
                      radius="md"
                      color="#0284c7"
                      onClick={startNewSession}
                    >
                      {t("qr.refresh")}
                    </Button>
                  </Stack>
                </Center>
              )}
            </div>

            {/* Countdown Timer & Refresh Button */}
            {session && status !== "EXPIRED" && status !== "REJECTED" && !loading && (
              <div className="uac-timer-row">
                <span className="uac-timer-text">
                  <IconClock size={16} />
                  <span>{formatTimer(timeLeft)}</span>
                </span>
                <button
                  type="button"
                  className="uac-refresh-btn"
                  onClick={startNewSession}
                  title={t("qr.refresh")}
                  aria-label={t("qr.refresh")}
                >
                  <IconRefresh size={16} />
                </button>
              </div>
            )}

            {/* Yoki havolani nusxalash button */}
            <button
              type="button"
              className={`uac-btn-copy ${copied ? "copied" : ""}`}
              onClick={handleCopyLink}
            >
              {copied ? <IconCheck size={18} /> : <IconLink size={18} />}
              <span>
                {copied ? t("qr.copiedToast") : t("qr.copyLink")}
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default UnifiedAuthCard;
