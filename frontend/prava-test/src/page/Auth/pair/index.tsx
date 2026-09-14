import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Center,
  Container,
  Divider,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconCheck,
  IconDeviceDesktop,
  IconShieldCheck,
  IconUserCheck,
  IconX,
} from "@tabler/icons-react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../auth/AuthContext";
import api from "../../../api/api";
import SEO from "../../../components/common/SEO";

interface SessionInfo {
  sessionId: string;
  status: string;
  deviceUuid: string;
  deviceName: string;
  platform: string;
  appVersion: string;
  ipAddress?: string;
  createdAt: string | number;
  expiresAt: string | number;
  expired?: boolean;
}

export default function PairPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const sessionId = searchParams.get("sessionId") || "";
  const challenge = searchParams.get("challenge") || "";

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!sessionId || !challenge) {
      setError(t("pair.invalidUrl", { defaultValue: "QR havola yaroqsiz yoki parametrlari to'liq emas." }));
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchSessionInfo = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<any>(
          `/api/v1/auth/qr/session-info?sessionId=${encodeURIComponent(
            sessionId
          )}&challenge=${encodeURIComponent(challenge)}`
        );
        if (isMounted) {
          const sessionData: SessionInfo = (res.data as any)?.data || res.data;
          setSessionInfo(sessionData);

          if (sessionData.status === "APPROVED" || sessionData.status === "CONSUMED") {
            setSuccess(true);
          } else if (sessionData.status === "REJECTED" || sessionData.status === "CANCELLED") {
            setError(t("pair.cancelled", { defaultValue: "Ushbu sessiya bekor qilingan." }));
          } else if (sessionData.status === "EXPIRED" || sessionData.expired) {
            setError(
              t("pair.expired", {
                defaultValue: "QR kod muddati tugagan (90 soniya). Desktop ilovasida qaytadan yangilang.",
              })
            );
          }
        }
      } catch (err: any) {
        if (isMounted) {
          const msg =
            err.response?.data?.message ||
            t("pair.expired", {
              defaultValue: "QR kod sessiyasi topilmadi yoki muddati tugagan. Desktop ilovasida yangilang.",
            });
          setError(msg);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSessionInfo();

    return () => {
      isMounted = false;
    };
  }, [sessionId, challenge, t]);

  const handleApprove = async () => {
    if (!sessionId || !challenge) return;
    try {
      setActionLoading(true);
      setError(null);
      await api.post("/api/v1/auth/qr/approve", {
        sessionId,
        challenge,
      });
      setSuccess(true);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        t("common.error", { defaultValue: "Qurilmani ulashda xatolik yuz berdi. Qaytadan urinib ko'ring." });
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!sessionId || !challenge) return;
    try {
      setActionLoading(true);
      await api.post("/api/v1/auth/qr/reject", {
        sessionId,
        challenge,
      });
      setError(t("pair.cancelled", { defaultValue: "Ulanish so'rovi bekor qilindi." }));
    } catch {
      setError(t("pair.cancelled", { defaultValue: "Ulanish so'rovi bekor qilindi." }));
    } finally {
      setActionLoading(false);
    }
  };

  const currentPairUrl = `/auth/pair?sessionId=${encodeURIComponent(
    sessionId
  )}&challenge=${encodeURIComponent(challenge)}`;

  return (
    <>
      <SEO
        title={`${t("pair.title", { defaultValue: "Qurilmani Ulash" })} — PRAVA`}
        description={t("pair.subtitle", {
          defaultValue: "PRAVA Desktop ilovasini hisobingizga xavfsiz QR orqali ulang",
        })}
      />
      <Container size="xs" py={{ base: "md", sm: "xl" }} px={{ base: "xs", sm: "md" }}>
        <Paper
          radius="lg"
          p={{ base: "md", sm: "xl" }}
          withBorder
          shadow="sm"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <Center mb="md">
            <ThemeIcon size={64} radius="xl" color="blue" variant="light">
              <IconDeviceDesktop size={36} />
            </ThemeIcon>
          </Center>

          <Title order={2} ta="center" mb="xs" size="1.4rem" fw={800}>
            {t("pair.title", { defaultValue: "Yangi qurilma ulanishi" })}
          </Title>

          <Text c="dimmed" size="xs" ta="center" mb="xl" maw={380} mx="auto" style={{ lineHeight: 1.5 }}>
            {t("pair.subtitle", {
              defaultValue: "PRAVA Desktop ilovasi hisobingizga kirish uchun ruxsat so'ramoqda",
            })}
          </Text>

          {loading && (
            <Center py="xl">
              <Stack align="center" gap="xs">
                <Loader size="md" />
                <Text size="sm" c="dimmed">
                  {t("pair.checking", { defaultValue: "Sessiya tekshirilmoqda..." })}
                </Text>
              </Stack>
            </Center>
          )}

          {!loading && error && !success && (
            <Stack gap="md">
              <Alert
                icon={<IconAlertCircle size={18} />}
                title={t("pair.errorTitle", { defaultValue: "Xatolik" })}
                color="red"
                variant="light"
                radius="md"
              >
                {error}
              </Alert>
              <Button
                variant="default"
                fullWidth
                radius="md"
                onClick={() => navigate("/")}
              >
                {t("pair.goHome", { defaultValue: "Bosh sahifaga qaytish" })}
              </Button>
            </Stack>
          )}

          {!loading && success && (
            <Stack gap="md" align="center" py="md">
              <ThemeIcon size={60} radius="xl" color="green" variant="filled">
                <IconCheck size={36} />
              </ThemeIcon>
              <Title order={3} ta="center" c="green.7" size="1.25rem" fw={800}>
                {t("pair.successTitle", { defaultValue: "Muvaffaqiyatli ulandi!" })}
              </Title>
              <Text size="xs" ta="center" c="dimmed" maw={380} style={{ lineHeight: 1.5 }}>
                {t("pair.successDesc", {
                  defaultValue:
                    "Desktop ilovangizga avtomatik kirildi. Endi siz barcha testlar, obunalar va saqlangan natijalaringizdan Desktop ilovada foydalanishingiz mumkin.",
                })}
              </Text>
              <Button
                component={Link}
                to="/me"
                variant="filled"
                color="blue"
                fullWidth
                mt="md"
                radius="md"
              >
                {t("pair.goToCabinet", { defaultValue: "Shaxsiy kabinetga o'tish" })}
              </Button>
            </Stack>
          )}

          {!loading && !error && !success && sessionInfo && (
            <Stack gap="lg">
              <Card
                withBorder
                radius="md"
                p="md"
                style={{ background: "var(--surface-muted)", borderColor: "var(--border)" }}
              >
                <Group justify="space-between" mb="xs">
                  <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: 0.5 }}>
                    {t("pair.deviceInfo", { defaultValue: "Qurilma ma'lumotlari" })}
                  </Text>
                  <Badge color="blue" variant="light" size="sm">
                    {sessionInfo.platform || "Desktop"}
                  </Badge>
                </Group>
                <Group gap="sm" mb="xs">
                  <IconDeviceDesktop size={20} color="var(--mantine-color-blue-6)" />
                  <Text fw={600} size="sm">
                    {sessionInfo.deviceName || "PRAVA Desktop"}
                  </Text>
                </Group>
                {sessionInfo.appVersion && (
                  <Text size="xs" c="dimmed">
                    {t("pair.appVersion", { defaultValue: "Ilova versiyasi" })}: v{sessionInfo.appVersion}
                  </Text>
                )}
              </Card>

              {isAuthenticated ? (
                <Stack gap="md">
                  <Paper
                    withBorder
                    p="sm"
                    radius="md"
                    style={{ background: "var(--mantine-color-blue-0)", borderColor: "var(--mantine-color-blue-2)" }}
                  >
                    <Group gap="xs">
                      <IconUserCheck size={20} color="var(--mantine-color-blue-7)" />
                      <Box>
                        <Text size="xs" c="dimmed">
                          {t("pair.targetAccount", { defaultValue: "Ulanadigan hisob:" })}
                        </Text>
                        <Text size="sm" fw={700} c="blue.9">
                          {user?.fullName || user?.phoneNumber || user?.email || "Foydalanuvchi"}
                        </Text>
                      </Box>
                    </Group>
                  </Paper>

                  <Group gap="xs" align="flex-start">
                    <IconShieldCheck
                      size={20}
                      color="var(--mantine-color-green-6)"
                      style={{ marginTop: 2, flexShrink: 0 }}
                    />
                    <Text size="xs" c="dimmed" style={{ lineHeight: 1.4 }}>
                      {t("pair.notice", {
                        defaultValue:
                          "«Tasdiqlash» tugmasini bosganingizda ushbu kompyuter profilingizga ulanadi va hisobingizdagi obuna ochiladi.",
                      })}
                    </Text>
                  </Group>

                  <Divider />

                  <Group grow>
                    <Button
                      variant="default"
                      color="gray"
                      radius="md"
                      leftSection={<IconX size={16} />}
                      onClick={handleReject}
                      disabled={actionLoading}
                    >
                      {t("pair.reject", { defaultValue: "Rad etish" })}
                    </Button>
                    <Button
                      variant="filled"
                      color="green"
                      radius="md"
                      leftSection={<IconCheck size={16} />}
                      onClick={handleApprove}
                      loading={actionLoading}
                    >
                      {t("pair.approve", { defaultValue: "Tasdiqlash" })}
                    </Button>
                  </Group>
                </Stack>
              ) : (
                <Stack gap="md">
                  <Alert
                    icon={<IconAlertCircle size={18} />}
                    title={t("pair.authRequired", { defaultValue: "Avtorizatsiya talab qilinadi" })}
                    color="blue"
                    variant="light"
                    radius="md"
                  >
                    {t("pair.authRequiredDesc", {
                      defaultValue:
                        "Desktop ilovani ulash uchun avval o'z hisobingizga kiring. Agar hisobingiz bo'lmasa, yangi hisob ochishingiz mumkin.",
                    })}
                  </Alert>

                  <Button
                    component={Link}
                    to="/auth/login"
                    state={{ from: currentPairUrl }}
                    variant="filled"
                    color="blue"
                    fullWidth
                    size="md"
                    radius="md"
                  >
                    {t("pair.loginExisting", { defaultValue: "Mavjud hisob bilan kirish" })}
                  </Button>

                  <Button
                    component={Link}
                    to="/auth/register"
                    state={{ from: currentPairUrl }}
                    variant="outline"
                    color="blue"
                    fullWidth
                    radius="md"
                  >
                    {t("pair.registerNew", { defaultValue: "Yangi hisob yaratish" })}
                  </Button>
                </Stack>
              )}
            </Stack>
          )}
        </Paper>
      </Container>
    </>
  );
}