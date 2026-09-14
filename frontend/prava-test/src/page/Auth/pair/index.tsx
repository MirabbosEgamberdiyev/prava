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
  createdAt: string;
  expiresAt: string;
}

export default function PairPage() {
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
      setError("QR havola yaroqsiz yoki parametrlari to'liq emas.");
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchSessionInfo = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<SessionInfo>(
          `/api/v1/auth/qr/session-info?sessionId=${encodeURIComponent(
            sessionId
          )}&challenge=${encodeURIComponent(challenge)}`
        );
        if (isMounted) {
          setSessionInfo(res.data);
          if (res.data.status === "APPROVED" || res.data.status === "CONSUMED") {
            setSuccess(true);
          } else if (res.data.status === "REJECTED" || res.data.status === "CANCELLED") {
            setError("Ushbu sessiya bekor qilingan.");
          } else if (res.data.status === "EXPIRED") {
            setError("QR kod muddati tugagan (90 soniya). Desktop ilovasida qaytadan yangilang.");
          }
        }
      } catch (err: any) {
        if (isMounted) {
          const msg =
            err.response?.data?.message ||
            "QR kod sessiyasi topilmadi yoki muddati tugagan. Desktop ilovasida yangilang.";
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
  }, [sessionId, challenge]);

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
        "Qurilmani ulashda xatolik yuz berdi. Qaytadan urinib ko'ring.";
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!sessionId || !challenge) return;
    try {
      setActionLoading(true);
      await api.post(
        `/api/v1/auth/qr/reject?sessionId=${encodeURIComponent(
          sessionId
        )}&challenge=${encodeURIComponent(challenge)}`
      );
      setError("Ulanish so'rovi bekor qilindi.");
    } catch {
      setError("Ulanish so'rovi bekor qilindi.");
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
        title="Qurilmani Ulash — PRAVA"
        description="PRAVA Desktop ilovasini hisobingizga xavfsiz QR orqali ulang"
      />
      <Container size="xs" py="xl">
        <Paper radius="md" p="xl" withBorder shadow="sm">
          <Center mb="md">
            <ThemeIcon size={64} radius="xl" color="blue" variant="light">
              <IconDeviceDesktop size={36} />
            </ThemeIcon>
          </Center>

          <Title order={2} ta="center" mb="xs">
            Yangi qurilma ulanishi
          </Title>

          <Text c="dimmed" size="sm" ta="center" mb="xl">
            PRAVA Desktop ilovasi hisobingizga kirish uchun ruxsat so'ramoqda
          </Text>

          {loading && (
            <Center py="xl">
              <Stack align="center" gap="xs">
                <Loader size="md" />
                <Text size="sm" c="dimmed">
                  Sessiya tekshirilmoqda...
                </Text>
              </Stack>
            </Center>
          )}

          {!loading && error && !success && (
            <Stack gap="md">
              <Alert
                icon={<IconAlertCircle size={18} />}
                title="Xatolik"
                color="red"
                variant="light"
              >
                {error}
              </Alert>
              <Button
                variant="default"
                fullWidth
                onClick={() => navigate("/")}
              >
                Bosh sahifaga qaytish
              </Button>
            </Stack>
          )}

          {!loading && success && (
            <Stack gap="md" align="center" py="md">
              <ThemeIcon size={60} radius="xl" color="green" variant="filled">
                <IconCheck size={36} />
              </ThemeIcon>
              <Title order={3} ta="center" c="green.7">
                Muvaffaqiyatli ulandi!
              </Title>
              <Text size="sm" ta="center" c="dimmed">
                Desktop ilovangizga avtomatik kirildi. Endi siz barcha testlar, obunalar va saqlangan natijalaringizdan Desktop ilovada foydalanishingiz mumkin.
              </Text>
              <Button
                component={Link}
                to="/me"
                variant="filled"
                color="blue"
                fullWidth
                mt="md"
              >
                Shaxsiy kabinetga o'tish
              </Button>
            </Stack>
          )}

          {!loading && !error && !success && sessionInfo && (
            <Stack gap="lg">
              <Card withBorder radius="md" p="md" bg="gray.0">
                <Group justify="space-between" mb="xs">
                  <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                    Qurilma ma'lumotlari
                  </Text>
                  <Badge color="blue" variant="light">
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
                    Ilova versiyasi: v{sessionInfo.appVersion}
                  </Text>
                )}
              </Card>

              {isAuthenticated ? (
                <Stack gap="md">
                  <Paper withBorder p="sm" radius="md" bg="blue.0">
                    <Group gap="xs">
                      <IconUserCheck size={20} color="var(--mantine-color-blue-7)" />
                      <Box>
                        <Text size="xs" c="dimmed">
                          Ulanadigan hisob:
                        </Text>
                        <Text size="sm" fw={600} c="blue.9">
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
                    <Text size="xs" c="dimmed">
                      "Tasdiqlash" tugmasini bosganingizda ushbu kompyuter profilingizga ulanadi va hisobingizdagi obuna ochiladi.
                    </Text>
                  </Group>

                  <Divider />

                  <Group grow>
                    <Button
                      variant="default"
                      color="gray"
                      leftSection={<IconX size={16} />}
                      onClick={handleReject}
                      disabled={actionLoading}
                    >
                      Rad etish
                    </Button>
                    <Button
                      variant="filled"
                      color="green"
                      leftSection={<IconCheck size={16} />}
                      onClick={handleApprove}
                      loading={actionLoading}
                    >
                      Tasdiqlash
                    </Button>
                  </Group>
                </Stack>
              ) : (
                <Stack gap="md">
                  <Alert
                    icon={<IconAlertCircle size={18} />}
                    title="Avtorizatsiya talab qilinadi"
                    color="blue"
                    variant="light"
                  >
                    Desktop ilovani ulash uchun avval o'z hisobingizga kiring. Agar hisobingiz bo'lmasa, yangi hisob ochishingiz mumkin.
                  </Alert>

                  <Button
                    component={Link}
                    to="/auth/login"
                    state={{ from: { pathname: currentPairUrl } }}
                    variant="filled"
                    color="blue"
                    fullWidth
                    size="md"
                  >
                    Mavjud hisob bilan kirish
                  </Button>

                  <Button
                    component={Link}
                    to="/auth/register"
                    state={{ from: { pathname: currentPairUrl } }}
                    variant="outline"
                    color="blue"
                    fullWidth
                  >
                    Yangi hisob yaratish
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