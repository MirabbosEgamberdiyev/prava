import {
  Stack,
  Title,
  Card,
  Grid,
  Group,
  Text,
  Badge,
  ThemeIcon,
  Button,
  Skeleton,
  Paper,
  Divider,
} from "@mantine/core";
import {
  IconBrandWindows,
  IconBrandApple,
  IconBrandAndroid,
  IconBrandUbuntu,
  IconDownload,
  IconUsers,
  IconClock,
  IconRefresh,
  IconApps,
} from "@tabler/icons-react";
import useSWR from "swr";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useTranslation } from "react-i18next";

interface PlatformStatItem {
  platform: string;
  downloadCount: number;
  uniqueUsers: number;
  lastDownload?: string;
  latestVersion?: string;
}

interface DownloadStatsResponse {
  totalDownloads: number;
  totalUniqueUsers: number;
  platforms: PlatformStatItem[];
}

const platformIcons: Record<string, any> = {
  WINDOWS: IconBrandWindows,
  MACOS: IconBrandApple,
  ANDROID: IconBrandAndroid,
  IOS: IconBrandApple,
  LINUX: IconBrandUbuntu,
};

const platformColors: Record<string, string> = {
  WINDOWS: "blue",
  MACOS: "gray",
  ANDROID: "green",
  IOS: "dark",
  LINUX: "orange",
};

export default function DownloadsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, error, mutate, isValidating } = useSWR<DownloadStatsResponse>(
    "/api/v1/admin/downloads/stats",
    () => api.get("/api/v1/admin/downloads/stats").then((res) => res.data?.data)
  );

  return (
    <Stack gap="lg" p="md">
      <Group justify="space-between" align="center">
        <div>
          <Title order={1} fz="h3" fw={700}>{t("downloadsAdmin.title")}</Title>
          <Text c="dimmed" size="sm">
            {t("downloadsAdmin.subtitle")}
          </Text>
        </div>
        <Group>
          <Button
            leftSection={<IconApps size={16} />}
            variant="default"
            onClick={() => navigate("/applications")}
          >
            Relizlarni boshqarish
          </Button>
          <Button
            leftSection={<IconRefresh size={16} />}
            variant="light"
            onClick={() => mutate()}
            loading={isValidating}
          >
            {t("common.refresh")}
          </Button>
        </Group>
      </Group>

      {/* Umumiy Xulosa Kartalari */}
      <Grid>
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Card withBorder radius="md" p="lg">
            <Group justify="space-between">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  {t("downloadsAdmin.totalDownloads")}
                </Text>
                <Text fw={800} fz={28} mt="xs">
                  {isValidating && !data ? <Skeleton height={36} width={120} /> : data?.totalDownloads?.toLocaleString() || "0"}
                </Text>
              </div>
              <ThemeIcon size={52} radius="md" color="blue" variant="light">
                <IconDownload size={28} />
              </ThemeIcon>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Card withBorder radius="md" p="lg">
            <Group justify="space-between">
              <div>
                <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                  Unikal Foydalanuvchilar (IP/Qurilma)
                </Text>
                <Text fw={800} fz={28} mt="xs">
                  {isValidating && !data ? <Skeleton height={36} width={120} /> : data?.totalUniqueUsers?.toLocaleString() || "0"}
                </Text>
              </div>
              <ThemeIcon size={52} radius="md" color="teal" variant="light">
                <IconUsers size={28} />
              </ThemeIcon>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Platformalar Bo'yicha Kartalar */}
      <Title order={3} fw={600} mt="sm">{t("downloadsAdmin.platformDist")}</Title>

      {isValidating && !data ? (
        <Grid>
          {[1, 2, 3, 4, 5].map((i) => (
            <Grid.Col key={i} span={{ base: 12, sm: 6, lg: 4 }}>
              <Skeleton height={200} radius="md" />
            </Grid.Col>
          ))}
        </Grid>
      ) : error ? (
        <Paper p="xl" withBorder style={{ textAlign: "center" }}>
          <Text c="red">{t("downloadsAdmin.errorLoad")}</Text>
          <Button mt="sm" variant="subtle" onClick={() => mutate()}>{t("downloadsAdmin.retry")}</Button>
        </Paper>
      ) : (
        <Grid>
          {data?.platforms?.map((item) => {
            const IconComponent = platformIcons[item.platform] || IconDownload;
            const color = platformColors[item.platform] || "blue";

            return (
              <Grid.Col key={item.platform} span={{ base: 12, sm: 6, lg: 4 }}>
                <Card withBorder radius="md" p="md">
                  <Group justify="space-between" mb="xs">
                    <Group>
                      <ThemeIcon size={40} radius="md" color={color} variant="light">
                        <IconComponent size={24} />
                      </ThemeIcon>
                      <div>
                        <Text fw={700} size="md">{item.platform}</Text>
                        <Text size="xs" c="dimmed">
                          Eng so'nggi versiya: <Badge size="xs" variant="light" color="indigo">{item.latestVersion || "v1.0.0"}</Badge>
                        </Text>
                      </div>
                    </Group>
                  </Group>

                  <Divider my="sm" />

                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Yuklab olishlar soni:</Text>
                      <Text fw={700} size="md">{item.downloadCount.toLocaleString()} marta</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Unikal foydalanuvchilar:</Text>
                      <Text fw={600} size="sm">{item.uniqueUsers.toLocaleString()}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="xs" c="dimmed">Oxirgi yuklab olish:</Text>
                      <Group gap={4}>
                        <IconClock size={12} color="gray" />
                        <Text size="xs" c="dimmed">
                          {item.lastDownload ? new Date(item.lastDownload).toLocaleString() : "Hali yuklanmagan"}
                        </Text>
                      </Group>
                    </Group>
                  </Stack>
                </Card>
              </Grid.Col>
            );
          })}
        </Grid>
      )}
    </Stack>
  );
}
