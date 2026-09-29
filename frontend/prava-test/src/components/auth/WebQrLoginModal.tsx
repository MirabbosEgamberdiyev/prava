import React, { useEffect, useState, useRef } from "react";
import {
  Modal,
  Stack,
  Text,
  Group,
  Button,
  Loader,
  Box,
  ThemeIcon,
  Badge,
} from "@mantine/core";
import {
  IconDeviceMobile,
  IconQrcode,
  IconRefresh,
  IconCheck,
  IconAlertCircle,
} from "@tabler/icons-react";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import { useAuth } from "../../auth/AuthContext";
import { useReturnTo } from "../../auth/useReturnTo";
import { QrAuthService, type QrInitResponse } from "../../api/qrAuthService";

interface WebQrLoginModalProps {
  opened: boolean;
  onClose: () => void;
}

export const WebQrLoginModal: React.FC<WebQrLoginModalProps> = ({
  opened,
  onClose,
}) => {
  const { t, i18n } = useTranslation();
  const { login: authLogin } = useAuth();
  const { destination: from } = useReturnTo();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<QrInitResponse | null>(null);
  const [status, setStatus] = useState<string>("PENDING");
  const [timeLeft, setTimeLeft] = useState<number>(90);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSession = async () => {
    setLoading(true);
    setError(null);
    setStatus("PENDING");
    try {
      const s = await QrAuthService.initSession({
        clientType: "WEB",
        clientVersion: "1.0.0",
        deviceName: "Prava Web Brauzer",
      });
      setSession(s);
      setTimeLeft(s.expiresIn || 90);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || "QR sessiyani boshlab bo'lmadi");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (opened) {
      startSession();
    } else {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (session) {
        QrAuthService.cancelSession(session.sessionId, session.pollSecret);
      }
      setSession(null);
    }
  }, [opened]);

  // Countdown timer
  useEffect(() => {
    if (!opened || !session) return;
    countdownTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          setStatus("EXPIRED");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [opened, session]);

  // Polling loop
  useEffect(() => {
    if (!opened || !session || status === "EXPIRED" || status === "APPROVED") return;

    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await QrAuthService.checkStatus(session.sessionId, session.pollSecret);
        if (res.status === "APPROVED" && res.accessToken && res.user) {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setStatus("APPROVED");

          const userLang = res.user.preferredLanguage;
          if (userLang) {
            i18n.changeLanguage(userLang);
          }

          authLogin({
            accessToken: res.accessToken,
            refreshToken: res.refreshToken || "",
            user: res.user,
          });

          notifications.show({
            title: t("auth.loginSuccess", "Xush kelibsiz!"),
            message: t("auth.qrSuccess", "Mobil ilova orqali muvaffaqiyatli kirdingiz!"),
            color: "green",
            icon: <IconCheck size={18} />,
          });

          onClose();
          navigate(from, { replace: true });
        } else if (res.status === "EXPIRED" || res.status === "REJECTED") {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setStatus(res.status);
        }
      } catch {
        // Polling network transient error
      }
    }, 2000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [opened, session, status, from, navigate, authLogin, i18n, onClose, t]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon size={28} radius="md" color="teal" variant="light">
            <IconQrcode size={18} />
          </ThemeIcon>
          <Text fw={700} size="sm">
            {t("auth.qrLoginTitle", "Mobil ilova orqali QR bilan kirish")}
          </Text>
        </Group>
      }
      centered
      radius="md"
      size="sm"
      styles={{
        header: {
          borderBottom: "1px solid var(--border, #e2e8f0)",
          paddingBottom: 12,
        },
      }}
    >
      <Stack align="center" gap="md" py="xs">
        {loading && (
          <Box py={60} style={{ textAlign: "center" }}>
            <Loader size="lg" color="teal" />
            <Text size="sm" c="dimmed" mt="md">
              {t("auth.qrGenerating", "QR kod yaratilmoqda...")}
            </Text>
          </Box>
        )}

        {!loading && error && (
          <Box py={30} style={{ textAlign: "center" }}>
            <ThemeIcon size={44} radius="xl" color="red" variant="light" mb="sm">
              <IconAlertCircle size={24} />
            </ThemeIcon>
            <Text size="sm" c="red" mb="md">
              {error}
            </Text>
            <Button
              leftSection={<IconRefresh size={16} />}
              variant="light"
              color="teal"
              size="xs"
              onClick={startSession}
            >
              {t("common.retry", "Qayta urinish")}
            </Button>
          </Box>
        )}

        {!loading && !error && session && (
          <>
            <Box
              p="md"
              style={{
                background: "#ffffff",
                borderRadius: "14px",
                border: "2px solid #e2e8f0",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <QRCodeSVG
                value={session.qrPayload}
                size={200}
                level="M"
                bgColor="#ffffff"
                fgColor="#0f172a"
                imageSettings={{
                  src: "/logo.svg",
                  width: 38,
                  height: 38,
                  excavate: true,
                }}
              />

              {status === "EXPIRED" && (
                <Box
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(255, 255, 255, 0.94)",
                    borderRadius: "12px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                  }}
                >
                  <Text size="xs" fw={600} c="dimmed">
                    {t("auth.qrExpired", "QR kod muddati tugadi")}
                  </Text>
                  <Button
                    leftSection={<IconRefresh size={14} />}
                    size="xs"
                    color="teal"
                    radius="md"
                    onClick={startSession}
                  >
                    {t("auth.qrRefresh", "Yangilash")}
                  </Button>
                </Box>
              )}
            </Box>

            {status === "PENDING" && (
              <Badge variant="dot" color="teal" size="sm">
                {t("auth.qrWaiting", "Kutilmoqda...")} ({timeLeft}s)
              </Badge>
            )}

            <Stack gap={4} style={{ textAlign: "center" }}>
              <Group gap={6} justify="center">
                <IconDeviceMobile size={18} color="var(--mantine-color-teal-6)" />
                <Text size="xs" fw={600}>
                  {t("auth.qrInstructionsTitle", "Qanday ulanish mumkin?")}
                </Text>
              </Group>
              <Text size="xs" c="dimmed" maw={280}>
                {t(
                  "auth.qrInstructionsDesc",
                  "Telefoningizda Prava Online mobil ilovasini oching va QR-skaner orqali ushbu kodni skanerlang"
                )}
              </Text>
            </Stack>
          </>
        )}
      </Stack>
    </Modal>
  );
};

export default WebQrLoginModal;
