import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Container, Paper, Stack, Text, Title, Button, Loader } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { IconBrandGoogle, IconBrandTelegram, IconCheck, IconAlertCircle, IconDeviceLaptop, IconDeviceMobile } from "@tabler/icons-react";
import { useGoogleLogin } from "@react-oauth/google";
import Cookies from "js-cookie";
import api from "../../../api/api";
import { useAuth } from "../../../auth/AuthContext";
import SEO from "../../../components/common/SEO";
import { getErrorMessage } from "../../../types/errors";

type BridgeStatus =
  | "INITIALIZING"
  | "IDLE_PROMPT"
  | "AUTHENTICATING"
  | "CONNECTING_DESKTOP"
  | "SUCCESS"
  | "ERROR";

export default function DesktopBridgePage() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const provider = searchParams.get("provider") || "google";
  const port = searchParams.get("port");
  const state = searchParams.get("state") || "";
  const sessionId = searchParams.get("sessionId");
  const challenge = searchParams.get("challenge");
  const redirectUri = searchParams.get("redirect_uri") || searchParams.get("redirect") || searchParams.get("callbackUrl");
  const platform = searchParams.get("platform");
  const isMobile = platform === "mobile" || /Android|iPhone|iPad/i.test(navigator.userAgent);

  const [status, setStatus] = useState<BridgeStatus>("INITIALIZING");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(3);
  const hasTransferredRef = useRef(false);

  // Send tokens back to Desktop via Localhost Loopback + Server Session Approval
  const sendToDesktop = useCallback(
    async (accessToken: string, refreshToken: string) => {
      if (hasTransferredRef.current) return;
      hasTransferredRef.current = true;
      setStatus("CONNECTING_DESKTOP");

      // 1. Primary channel: Local loopback HTTP server
      if (port && state) {
        const loopbackUrl = `http://127.0.0.1:${port}/callback?token=${encodeURIComponent(
          accessToken
        )}&refresh=${encodeURIComponent(refreshToken)}&state=${encodeURIComponent(state)}`;

        try {
          // Fetch attempt
          await fetch(loopbackUrl, { method: "GET", mode: "cors" });
        } catch {
          // Fallback image ping in case browser CORS / mixed content policy blocks fetch
          try {
            const img = new Image();
            img.src = loopbackUrl;
          } catch {
            // will rely on session approval
          }
        }
      }

      // 2. Secondary redundant channel: Server-side session approval (via QR pairing store)
      if (sessionId && challenge) {
        try {
          await api.post("/api/v1/auth/qr/approve", {
            sessionId,
            challenge,
          });
        } catch (err) {
          console.warn("Desktop session approval notice:", err);
        }
      }

      // 3. Deep link redirect (Mobile app or custom protocol scheme)
      const targetRedirect = redirectUri || (state ? `pravaonline://oauth/callback?token=${encodeURIComponent(
        accessToken
      )}&refresh=${encodeURIComponent(refreshToken)}&state=${encodeURIComponent(state)}` : null);

      if (targetRedirect) {
        try {
          window.location.href = targetRedirect;
        } catch {
          // ignore
        }
      }

      setStatus("SUCCESS");

      // Auto close countdown
      let c = 3;
      const interval = setInterval(() => {
        c -= 1;
        setCountdown(c);
        if (c <= 0) {
          clearInterval(interval);
          try {
            window.close();
          } catch {
            // ignore if blocked by browser
          }
        }
      }, 1000);
    },
    [port, state, sessionId, challenge, redirectUri]
  );

  // If already authenticated on web, immediately transfer session to Desktop!
  useEffect(() => {
    const existingToken = Cookies.get("accessToken") || localStorage.getItem("accessToken");
    const existingRefresh = Cookies.get("refreshToken") || localStorage.getItem("refreshToken") || "";

    if (existingToken && !hasTransferredRef.current) {
      sendToDesktop(existingToken, existingRefresh);
    } else if (!existingToken) {
      setStatus("IDLE_PROMPT");
    }
  }, [sendToDesktop]);

  // Hook for Google OAuth in system browser
  const handleGoogleSuccess = async (tokenResponse: any) => {
    setStatus("AUTHENTICATING");
    try {
      const response = await api.post("/api/v1/auth/google", {
        accessToken: tokenResponse.access_token,
      });

      if (response.data?.success && response.data?.data) {
        const { accessToken, refreshToken, user: authUser } = response.data.data;
        if (authUser?.preferredLanguage) {
          i18n.changeLanguage(authUser.preferredLanguage);
        }
        authLogin(response.data.data);
        await sendToDesktop(accessToken, refreshToken || "");
      } else {
        throw new Error(response.data?.message || "Google auth failed");
      }
    } catch (err: unknown) {
      setStatus("ERROR");
      setErrorMessage(getErrorMessage(err, t("auth.google.errorMessage")));
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => {
      setStatus("ERROR");
      setErrorMessage(t("auth.google.errorMessage"));
    },
  });

  return (
    <>
      <SEO
        title="Prava Online Desktop — Kirish"
        description="Prava Online Desktop ilovasiga xavfsiz kirish"
        noIndex
      />

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b1120",
          color: "#f8fafc",
          padding: "20px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <Container size={440}>
          <Paper
            withBorder
            shadow="xl"
            p="xl"
            radius="24px"
            style={{
              background: "#1e293b",
              borderColor: "rgba(255, 255, 255, 0.1)",
              textAlign: "center",
            }}
          >
            <Stack align="center" gap="md">
              {/* Header Icon */}
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  background: "rgba(34, 158, 217, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#38bdf8",
                  marginBottom: 4,
                }}
              >
                {isMobile ? <IconDeviceMobile size={34} stroke={2} /> : <IconDeviceLaptop size={34} stroke={2} />}
              </div>

              <Title order={2} style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", margin: 0 }}>
                {isMobile ? "Prava Online Mobile" : "Prava Online Desktop"}
              </Title>

              {status === "INITIALIZING" && (
                <>
                  <Loader size="md" color="#38bdf8" />
                  <Text size="sm" c="dimmed">
                    {isMobile ? "Ilovaga ulanmoqda..." : t("auth.connecting", "Desktop ilovasiga ulanmoqda...")}
                  </Text>
                </>
              )}

              {status === "IDLE_PROMPT" && (
                <>
                  <Text size="sm" c="dimmed" style={{ lineHeight: 1.5, maxWidth: 360 }}>
                    {provider === "telegram"
                      ? (isMobile ? "Ilovaga kirish uchun Telegram hisobingizni tasdiqlang." : "Desktop ilovangizga kirish uchun Telegram hisobingizni tasdiqlang.")
                      : (isMobile ? "Prava Online ilovasiga kirish uchun Google hisobingiz orqali 1 bosqichda kiring." : "Desktop ilovangizga kirish uchun Google hisobingiz orqali 1 bosqichda kiring.")}
                  </Text>

                  {provider === "telegram" ? (
                    <Button
                      fullWidth
                      size="md"
                      radius="md"
                      color="#229ed9"
                      leftSection={<IconBrandTelegram size={20} />}
                      onClick={() => navigate("/auth/login?oauth=telegram")}
                    >
                      Telegram orqali kirish
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      size="md"
                      radius="md"
                      variant="white"
                      color="dark"
                      leftSection={<IconBrandGoogle size={20} color="#EA4335" />}
                      onClick={() => googleLogin()}
                      style={{
                        boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
                        fontWeight: 700,
                      }}
                    >
                      Google bilan kirish
                    </Button>
                  )}
                </>
              )}

              {status === "AUTHENTICATING" && (
                <>
                  <Loader size="md" color="#EA4335" />
                  <Text size="sm" c="dimmed">
                    Google hisobi tekshirilmoqda...
                  </Text>
                </>
              )}

              {status === "CONNECTING_DESKTOP" && (
                <>
                  <Loader size="md" color="#38bdf8" />
                  <Text size="sm" c="dimmed">
                    {isMobile ? "Ilovaga token uzatilmoqda..." : "Desktop ilovasiga token uzatilmoqda..."}
                  </Text>
                </>
              )}

              {status === "SUCCESS" && (
                <>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      background: "rgba(16, 185, 129, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#10b981",
                      margin: "8px 0",
                    }}
                  >
                    <IconCheck size={32} stroke={3} />
                  </div>
                  <Title order={3} style={{ color: "#34d399", fontSize: 20, fontWeight: 800 }}>
                    Muvaffaqiyatli ulandingiz!
                  </Title>
                  <Text size="sm" c="dimmed" style={{ maxWidth: 340 }}>
                    {isMobile ? "Prava Online ilovangizga muvaffaqiyatli kirildi. Ilovaga qaytishingiz mumkin." : "Prava Online Desktop ilovangizga kirildi. Dasturga qaytishingiz mumkin."}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Ushbu oyna {countdown} soniyada avtomatik yopiladi...
                  </Text>
                  {isMobile ? (
                    <Button
                      component="a"
                      href={redirectUri || "pravamobile://auth/callback"}
                      size="sm"
                      radius="md"
                      color="blue"
                      mt={6}
                    >
                      Ilovaga qaytish
                    </Button>
                  ) : null}
                  <Button
                    variant="subtle"
                    color="gray"
                    size="xs"
                    onClick={() => window.close()}
                    mt={4}
                  >
                    Oynani yopish
                  </Button>
                </>
              )}

              {status === "ERROR" && (
                <>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      background: "rgba(239, 68, 68, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ef4444",
                    }}
                  >
                    <IconAlertCircle size={32} stroke={2.5} />
                  </div>
                  <Title order={3} style={{ color: "#f87171", fontSize: 18 }}>
                    Kirishda xatolik yuz berdi
                  </Title>
                  <Text size="sm" c="dimmed" style={{ maxWidth: 340 }}>
                    {errorMessage || "Noma'lum xatolik yuz berdi. Qaytadan urinib ko'ring."}
                  </Text>
                  <Button
                    size="sm"
                    radius="md"
                    color="blue"
                    onClick={() => {
                      setStatus("IDLE_PROMPT");
                      setErrorMessage(null);
                    }}
                    mt={8}
                  >
                    Qayta urinish
                  </Button>
                </>
              )}
            </Stack>
          </Paper>
        </Container>
      </div>
    </>
  );
}
