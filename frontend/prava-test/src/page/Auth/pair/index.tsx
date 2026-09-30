import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  Container,
  Group,
  Loader,
  Stack,
  Text,
  TextInput,
  PasswordInput,
  Title,
  Alert,
} from "@mantine/core";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  IconDeviceLaptop,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconLock,
  IconUser,
} from "@tabler/icons-react";
import api from "../../../api/api";
import { useAuth } from "../../../auth/AuthContext";
import { useAuthModal } from "../../../auth/AuthModalContext";
import { showToast } from "../../../utils/notificationUtils";
import { normalizeUzPhone } from "../../../utils/phoneUtils";
import GoogleLoginButton from "../../../components/auth/GoogleLoginButton";

interface SessionInfo {
  sessionId: string;
  deviceName?: string;
  clientType?: string;
  clientVersion?: string;
  status?: string;
  isExpired?: boolean;
}

export default function QrPairingPage() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, login } = useAuth();
  const { executePending } = useAuthModal();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const sessionId = searchParams.get("sessionId") || "";
  const challenge = searchParams.get("challenge") || "";

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form states if not authenticated
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || !challenge) {
      setError(t("pair.invalidUrl"));
      setLoading(false);
      return;
    }

    const fetchSession = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/api/v1/auth/qr/session-info", {
          params: { sessionId, challenge },
        });
        if (res.data?.success && res.data?.data) {
          setSessionInfo(res.data.data);
        } else {
          setError(t("pair.sessionNotFound"));
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || t("pair.sessionNotFound"));
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId, challenge, t]);

  const handleApprove = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await api.post("/api/v1/auth/qr/approve", {
        sessionId,
        challenge,
      });

      if (res.data?.success) {
        setSuccess(true);
        showToast({
          id: "qr-paired-success",
          title: t("common.success"),
          message: t("pair.computerConnected"),
          color: "teal",
        });
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || t("pair.approveError"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await api.post("/api/v1/auth/qr/reject", { sessionId, challenge });
    } catch {
      // ignore
    }
    navigate("/me", { replace: true });
  };

  const handleLoginAndApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setAuthError(t("pair.enterCredentials"));
      return;
    }

    setActionLoading(true);
    setAuthError(null);

    let cleanId = identifier.trim();
    const digitsOnly = cleanId.replace(/\D/g, "");
    if (digitsOnly.length >= 9 && !cleanId.includes("@")) {
      cleanId = normalizeUzPhone(cleanId);
    }

    try {
      const loginRes = await api.post("/api/v1/auth/login", {
        identifier: cleanId,
        password,
      });

      if (loginRes.data?.success) {
        const userLang = loginRes.data.data.user?.preferredLanguage;
        if (userLang) i18n.changeLanguage(userLang);
        login(loginRes.data.data);

        // Approve after successful login
        const approveRes = await api.post(
          "/api/v1/auth/qr/approve",
          { sessionId, challenge },
          { headers: { Authorization: `Bearer ${loginRes.data.data.accessToken}` } }
        );

        if (approveRes.data?.success) {
          setSuccess(true);
        }
      }
    } catch (err: any) {
      setAuthError(err?.response?.data?.message || t("auth.loginError"));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Container size={440} py={60}>
        <Card withBorder radius={20} p={32} style={{ textAlign: "center" }}>
          <Stack align="center" gap={16}>
            <Loader size="md" color="#0284c7" />
            <Text fz={14} c="dimmed">
              {t("pair.checking")}
            </Text>
          </Stack>
        </Card>
      </Container>
    );
  }

  if (success) {
    return (
      <Container size={440} py={60}>
        <Card
          withBorder
          radius={24}
          p={36}
          style={{
            textAlign: "center",
            boxShadow: "0 12px 36px rgba(10, 37, 64, 0.08)",
          }}
        >
          <Stack align="center" gap={18}>
            <Box
              style={{
                width: 72,
                height: 72,
                borderRadius: 24,
                backgroundColor: "#dcfce7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconCheck size={38} color="#16a34a" aria-hidden="true" />
            </Box>

            <Title order={2} fw={800} fz={22}>
              {t("pair.computerConnected")}
            </Title>

            <Text c="dimmed" fz={14} maw={340}>
              {t("pair.computerConnectedDesc")}
            </Text>

            <Button
              fullWidth
              size="md"
              radius={14}
              color="#0284c7"
              h={46}
              onClick={() => executePending()}
            >
              {t("pair.goToCabinet")}
            </Button>
          </Stack>
        </Card>
      </Container>
    );
  }

  if (error && !sessionInfo) {
    return (
      <Container size={440} py={60}>
        <Card withBorder radius={24} p={32} style={{ textAlign: "center" }}>
          <Stack align="center" gap={16}>
            <Box
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                backgroundColor: "#fee2e2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconAlertCircle size={32} color="#dc2626" aria-hidden="true" />
            </Box>

            <Title order={3} fw={700} fz={20}>
              {t("pair.connectError")}
            </Title>

            <Text c="dimmed" fz={13.5}>
              {error}
            </Text>

            <Button
              variant="default"
              radius={12}
              onClick={() => navigate("/auth/login")}
            >
              {t("forgotPassword.backToLogin")}
            </Button>
          </Stack>
        </Card>
      </Container>
    );
  }

  return (
    <Container size={460} py={40}>
      <Card
        withBorder
        shadow="md"
        radius={24}
        p={32}
        style={{
          backgroundColor: "var(--card-bg, #ffffff)",
          boxShadow: "0 12px 36px rgba(10, 37, 64, 0.08)",
        }}
      >
        <Stack align="center" gap={18} style={{ textAlign: "center" }}>
          {/* Laptop Icon Header */}
          <Box
            style={{
              width: 72,
              height: 72,
              borderRadius: 22,
              backgroundColor: "rgba(2, 132, 199, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconDeviceLaptop size={40} color="#0284c7" aria-hidden="true" />
          </Box>

          <Box>
            <Title order={2} fw={800} fz={22}>
              {t("pair.requestTitle")}
            </Title>
            <Text c="dimmed" fz={13.5} mt={4}>
              {isAuthenticated ? t("pair.requestAuthed") : t("pair.requestGuest")}
            </Text>
          </Box>

          {/* Device Details Card */}
          <Card
            withBorder
            p={18}
            radius={16}
            style={{
              width: "100%",
              backgroundColor: "var(--surface, #f8fafc)",
              textAlign: "left",
            }}
          >
            <Stack gap={10}>
              <Group justify="space-between">
                <Text fz={13} c="dimmed" fw={600}>
                  💻 {t("pair.deviceLabel")}
                </Text>
                <Text fz={13.5} fw={700}>
                  {sessionInfo?.deviceName || "—"}
                </Text>
              </Group>

              <Group justify="space-between">
                <Text fz={13} c="dimmed" fw={600}>
                  🕒 {t("pair.timeLabel")}
                </Text>
                <Text fz={13.5} fw={700}>
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </Group>
            </Stack>
          </Card>

          {error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="red"
              radius="md"
              style={{ width: "100%", textAlign: "left" }}
            >
              {error}
            </Alert>
          )}

          {/* If Authenticated: Approve & Reject Buttons */}
          {isAuthenticated ? (
            <Group gap={12} style={{ width: "100%" }} mt={8}>
              <Button
                flex={1}
                variant="outline"
                color="red"
                radius={14}
                h={48}
                onClick={handleReject}
                disabled={actionLoading}
                leftSection={<IconX size={18} />}
                style={{ fontWeight: 700 }}
              >
                {t("pair.reject")}
              </Button>

              <Button
                flex={1}
                color="#0284c7"
                radius={14}
                h={48}
                onClick={handleApprove}
                loading={actionLoading}
                leftSection={<IconCheck size={18} />}
                style={{ fontWeight: 700 }}
              >
                {t("pair.approve")}
              </Button>
            </Group>
          ) : (
            /* If Not Authenticated: Quick Login Form */
            <Box
              component="form"
              onSubmit={handleLoginAndApprove}
              style={{ width: "100%", textAlign: "left" }}
            >
              <Stack gap={12}>
                {authError && (
                  <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md">
                    {authError}
                  </Alert>
                )}

                <TextInput
                  label={t("auth.identifier", { defaultValue: "Telefon yoki Email" })}
                  placeholder={t("auth.identifierPlaceholder")}
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.currentTarget.value)}
                  leftSection={<IconUser size={16} />}
                  radius="md"
                />

                <PasswordInput
                  label={t("auth.password", { defaultValue: "Parol" })}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.currentTarget.value)}
                  leftSection={<IconLock size={16} />}
                  radius="md"
                />

                <Button
                  type="submit"
                  fullWidth
                  color="#0284c7"
                  radius={14}
                  h={46}
                  loading={actionLoading}
                  mt={4}
                  style={{ fontWeight: 700 }}
                >
                  {t("pair.loginAndApprove")}
                </Button>

                <GoogleLoginButton compact />

                <Button
                  variant="subtle"
                  color="gray"
                  fullWidth
                  radius={12}
                  onClick={() => navigate("/auth/login")}
                >
                  {t("common.cancel")}
                </Button>
              </Stack>
            </Box>
          )}
        </Stack>
      </Card>
    </Container>
  );
}
