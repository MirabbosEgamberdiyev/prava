import { useState } from "react";
import { ActionIcon, Alert, Badge, Group, Loader, Paper, Progress, Stack, Text, Tooltip } from "@mantine/core";
import { IconDeviceDesktop, IconDeviceMobile, IconWorldWww, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import useSWR from "swr";
import api from "../../../api/api";
import { showToast } from "../../../utils/notificationUtils";

interface DeviceItem {
  deviceId: string;
  deviceName: string;
  lastActiveAt?: string;
  isCurrent?: boolean;
}

interface DeviceInfo {
  maxDevices?: number;
  activeDevices?: number;
  devices?: DeviceItem[];
}

const DEVICES_URL = "/api/v2/my-statistics/devices";
/** Server limiti (DeviceManagementService.DEFAULT_MAX_DEVICES) — javobda bo'lmasa shu ko'rsatiladi. */
const DEFAULT_MAX_DEVICES = 2;

/** Server nomi: "App · Android", "Chrome · Windows", "Safari · iOS"… — 📱 telefon, 💻 kompyuter, 🌐 noma'lum. */
function deviceKind(name: string): "mobile" | "desktop" | "web" {
  if (/android|\bios\b|iphone|ipad/i.test(name) || /^app\b/i.test(name)) return "mobile";
  if (/windows|macos|linux/i.test(name)) return "desktop";
  return "web";
}

/** Faol qurilmalar (har biri = alohida kirish sessiyasi): "1/2", joriy qurilma belgisi va boshqasini chiqarish. */
export function MyDevicesPanel() {
  const { t, i18n } = useTranslation();
  const { data, error, isLoading, mutate } = useSWR<{ data: DeviceInfo }>(DEVICES_URL);
  const [removing, setRemoving] = useState<string | null>(null);

  const info = data?.data;
  const devices = info?.devices ?? [];
  const max = info?.maxDevices && info.maxDevices > 0 ? info.maxDevices : DEFAULT_MAX_DEVICES;
  const used = devices.length;
  const locale = i18n.language === "ru" ? "ru-RU" : "uz-UZ";

  const remove = async (d: DeviceItem) => {
    setRemoving(d.deviceId);
    try {
      await api.delete(`${DEVICES_URL}/${encodeURIComponent(d.deviceId)}`);
      showToast({ color: "teal", message: t("devices.removed", { name: d.deviceName }) });
      await mutate();
    } catch {
      showToast({ color: "red", message: t("devices.removeError") });
    } finally {
      setRemoving(null);
    }
  };

  if (isLoading) {
    return (
      <Group justify="center" py="md">
        <Loader size="sm" />
      </Group>
    );
  }
  if (error) {
    return (
      <Alert color="red" variant="light">
        {t("devices.loadError")}
      </Alert>
    );
  }

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="center">
        <Text fw={800}>{t("devices.activeCount", { used, max })}</Text>
        <Badge color={used >= max ? "orange" : "teal"} variant="light" size="lg">
          {used}/{max}
        </Badge>
      </Group>
      <Progress value={Math.min(100, (used / max) * 100)} color={used >= max ? "orange" : "blue"} radius="xl" />
      <Text size="xs" c="dimmed">
        {t("devices.limitHint", { max })}
      </Text>

      {devices.map((d) => {
        const kind = deviceKind(d.deviceName);
        const Icon = kind === "mobile" ? IconDeviceMobile : kind === "desktop" ? IconDeviceDesktop : IconWorldWww;
        return (
          <Paper key={d.deviceId} withBorder radius="md" p="sm" style={d.isCurrent ? { borderColor: "var(--mantine-color-teal-6)" } : undefined}>
            <Group justify="space-between" wrap="nowrap">
              <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                <Icon size={26} stroke={1.6} />
                <div style={{ minWidth: 0 }}>
                  <Group gap={6}>
                    <Text fw={700} size="sm" truncate>
                      {d.deviceName}
                    </Text>
                    {d.isCurrent && (
                      <Badge color="teal" size="xs" variant="filled">
                        {t("devices.current")}
                      </Badge>
                    )}
                  </Group>
                  {d.lastActiveAt && (
                    <Text size="xs" c="dimmed">
                      {t("devices.lastActive", {
                        time: new Date(d.lastActiveAt).toLocaleString(locale, {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }),
                      })}
                    </Text>
                  )}
                </div>
              </Group>
              {!d.isCurrent && (
                <Tooltip label={t("devices.signOut")}>
                  <ActionIcon
                    color="red"
                    variant="light"
                    loading={removing === d.deviceId}
                    onClick={() => void remove(d)}
                    aria-label={t("devices.signOutNamed", { name: d.deviceName })}
                  >
                    <IconX size={16} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
          </Paper>
        );
      })}
    </Stack>
  );
}
