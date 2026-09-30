import { useState, useEffect, useRef, useCallback } from "react";
import {
  Stack,
  Text,
  Center,
  Button,
  Loader,
  Group,
  Box,
  Title,
  ActionIcon,
} from "@mantine/core";
import { QRCodeSVG } from "qrcode.react";
import { IconRefresh } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  QrAuthService,
  type QrInitResponse,
  type QrSessionStatus,
} from "../../api/qrAuthService";
import { useAuth } from "../../auth/AuthContext";
import { useAuthModal } from "../../auth/AuthModalContext";
import { startQrPolling } from "../../auth/qrPolling";
import { showToast } from "../../utils/notificationUtils";

interface QrLoginCardProps {
  onSwitchToPassword?: () => void;
  onCancel?: () => void;
}

// Phone vector outline
function PhoneVectorIcon() {
  return (
    <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x={5} y={2} width={14} height={20} rx={3} />
      <path d="M12 18h.01" />
    </svg>
  );
}

export function QrLoginCard({ onSwitchToPassword: _onSwitchToPassword, onCancel }: QrLoginCardProps = {}) {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const { executePending } = useAuthModal();

  const [session, setSession] = useState<QrInitResponse | null>(null);
  const [status, setStatus] = useState<QrSessionStatus>("PENDING");
  const [timeLeft, setTimeLeft] = useState<number>(90);
  const [loading, setLoading] = useState<boolean>(true);

  const stopPollRef = useRef<(() => void) | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  // Latest callbacks without re-creating the session effect.
  const loginRef = useRef(login);
  const executePendingRef = useRef(executePending);
  const tRef = useRef(t);
  useEffect(() => {
    loginRef.current = login;
    executePendingRef.current = executePending;
    tRef.current = t;
  }, [login, executePending, t]);

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
              i18n.changeLanguage(userLang);
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
  }, [clearTimers, i18n]);

  useEffect(() => {
    isMountedRef.current = true;
    startNewSession();
    return () => {
      isMountedRef.current = false;
      clearTimers();
    };
    // Mount-only: one session per card instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (status === "APPROVED") {
    return (
      <Center py={40}>
        <Stack align="center" gap={10}>
          <Loader size="md" color="#0284c7" />
          <Text fz={14} c="dimmed">
            {t("qr.approved")}
          </Text>
        </Stack>
      </Center>
    );
  }

  // Waiting for approval on the phone
  if (status === "SCANNED") {
    return (
      <Stack align="center" gap={18} py={30} style={{ textAlign: "center", width: "100%", maxWidth: 420, margin: "0 auto" }}>
        <Box
          style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            backgroundColor: "rgba(2, 132, 199, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <PhoneVectorIcon />
        </Box>

        <Box>
          <Title order={2} fw={800} fz={21} style={{ letterSpacing: "-0.02em" }}>
            {t("qr.confirmOnPhoneTitle")}
          </Title>
          <Text c="dimmed" fz={13.5} mt={6} maw={320}>
            {t("qr.confirmOnPhoneDesc")}
          </Text>
        </Box>

        <Group gap={10} mt={10}>
          <Loader size="sm" color="#0284c7" />
          <Text fz={14} fw={600} c="#0284c7">
            {t("qr.waiting")}
          </Text>
        </Group>

        <Button
          variant="default"
          radius={14}
          h={44}
          fullWidth
          mt={14}
          onClick={() => {
            const current = session;
            clearTimers();
            if (current) QrAuthService.cancelSession(current.sessionId, current.pollSecret);
            if (onCancel) onCancel();
            else startNewSession();
          }}
          style={{ borderColor: "var(--border, #e2e8f0)", fontWeight: 600 }}
        >
          {t("common.cancel")}
        </Button>
      </Stack>
    );
  }

  // QR code (pending)
  return (
    <Stack align="center" gap={14} py={10} style={{ textAlign: "center", width: "100%", maxWidth: 420, margin: "0 auto" }}>
      <Box>
        <Title order={2} fw={800} fz={22} style={{ letterSpacing: "-0.02em" }}>
          {t("qr.appLoginTitle")}
        </Title>
        <Text c="dimmed" fz={13} mt={4} maw={340}>
          {t("qr.appLoginDesc")}
        </Text>
      </Box>

      <Box
        style={{
          position: "relative",
          padding: "16px",
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          boxShadow: "0 8px 32px rgba(10, 37, 64, 0.08)",
          border: "2px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <Center w={210} h={210}>
            <Loader size="md" color="#0284c7" />
          </Center>
        ) : session && status !== "EXPIRED" && status !== "REJECTED" ? (
          <>
            <QRCodeSVG value={session.qrPayload} size={210} level="M" />
            {/* Animated Radar Scanning Line */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                background: "linear-gradient(90deg, transparent, #0284c7, transparent)",
                boxShadow: "0 0 10px #0284c7",
                animation: "qrRadar 2.5s infinite ease-in-out",
              }}
            />
            <style>
              {`
                @keyframes qrRadar {
                  0% { top: 12px; opacity: 0.2; }
                  50% { top: calc(100% - 16px); opacity: 1; }
                  100% { top: 12px; opacity: 0.2; }
                }
              `}
            </style>
          </>
        ) : (
          <Center w={210} h={210}>
            <Stack align="center" gap={8}>
              <Text fz={13} c="dimmed">
                {t("qr.expired")}
              </Text>
              <Button size="xs" radius="md" color="#0284c7" onClick={startNewSession}>
                {t("qr.refresh")}
              </Button>
            </Stack>
          </Center>
        )}
      </Box>

      {status !== "EXPIRED" && status !== "REJECTED" && !loading && (
        <Group gap={8} justify="center" mt={4}>
          <Text fz={13.5} fw={600} c="dimmed">
            ⏱ {formatTimer(timeLeft)}
          </Text>
          <ActionIcon
            size={26}
            radius="xl"
            variant="light"
            color="gray"
            onClick={startNewSession}
            aria-label={t("qr.refresh")}
            title={t("qr.refresh")}
          >
            <IconRefresh size={14} />
          </ActionIcon>
        </Group>
      )}

      {session && (
        <Button
          variant="subtle"
          color="blue"
          size="compact-sm"
          mt={2}
          onClick={() => {
            navigator.clipboard?.writeText(session.qrPayload);
            showToast({
              id: "qr-copy-toast",
              title: t("common.copied"),
              message: t("qr.linkCopied"),
              color: "teal",
            });
          }}
          style={{ fontSize: 13, fontWeight: 600 }}
        >
          {t("qr.copyLink")}
        </Button>
      )}
    </Stack>
  );
}

export default QrLoginCard;
