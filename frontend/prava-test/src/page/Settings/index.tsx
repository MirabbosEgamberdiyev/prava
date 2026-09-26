import {
  Stack,
  Tabs,
  Paper,
  Text,
  Group,
  Badge,
  Center,
  Loader,
  SimpleGrid,
  Button,
  ActionIcon,
  Modal,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import {
  IconUser,
  IconLock,
  IconDevices,
  IconDeviceMobile,
  IconDeviceDesktop,
  IconSettings,
  IconTypography,
  IconTrash,
} from "@tabler/icons-react";
import api from "../../api/api";
import { useTranslation } from "react-i18next";
import useSWR from "swr";
import { ProfileInfoCard } from "../../features/me/components/ProfileInfoCard";
import { ChangePasswordForm } from "../../features/me/components/ChangePasswordForm";
import { SimpleTypographyControl } from "../../components/common/SimpleTypographyControl";
import SEO from "../../components/common/SEO";

import styles from "../../components/dashboard/Dashboard.module.css";

interface DeviceItem {
  deviceId: string;
  deviceName: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

interface DeviceInfo {
  /** Yangi backend maydoni. */
  activeDevices?: number;
  /** Eski backend maydoni (moslik uchun). */
  currentDevices?: number;
  maxDevices: number;
  devices?: DeviceItem[];
}

const DEVICES_KEY = "/api/v2/my-statistics/devices";

const Settings_Page = () => {
  const { t } = useTranslation();

  const {
    data: deviceResponse,
    isLoading: devicesLoading,
    mutate: refreshDevices,
  } = useSWR<{
    data: DeviceInfo;
  }>(DEVICES_KEY);

  const deviceInfo = deviceResponse?.data;
  const deviceList = deviceInfo?.devices ?? [];
  const activeCount = deviceInfo?.activeDevices ?? deviceInfo?.currentDevices ?? deviceList.length;

  // Qurilmani o'chirish (sessiyani bekor qilish) — Mantine modal orqali tasdiqlash
  const [pendingRemove, setPendingRemove] = useState<DeviceItem | null>(null);
  const [removing, setRemoving] = useState(false);

  const formatLastActive = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
  };

  const confirmRemove = async () => {
    if (!pendingRemove || pendingRemove.isCurrent) return;
    setRemoving(true);
    try {
      await api.delete(`${DEVICES_KEY}/${encodeURIComponent(pendingRemove.deviceId)}`);
      notifications.show({
        color: "green",
        message: t("settings.deviceRemoved", "Qurilma chiqarildi"),
      });
      setPendingRemove(null);
      await refreshDevices();
    } catch {
      notifications.show({
        color: "red",
        message: t("settings.deviceRemoveError", "Qurilmani chiqarib bo'lmadi. Qayta urinib ko'ring."),
      });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <>
      <SEO
        title={t("seo.settings.title", "Sozlamalar va Profil — PravaOnline")}
        description={t("seo.settings.desc", "Profil sozlamalari, xavfsizlik va ulangan qurilmalar.")}
        canonical="/settings"
        noIndex={true}
      />
      {/* Page Header */}
        <div className={styles.innerPageHeader}>
          <div className={styles.innerPageHeaderLeft}>
            <div className={styles.innerPageTitleRow}>
              <h1 className={styles.innerPageTitle}>
                <IconSettings
                  size={24}
                  stroke={2}
                  style={{ color: "var(--primary)", verticalAlign: "middle", marginRight: 8 }}
                />
                {t("settings.title", "Sozlamalar va Profil")}
              </h1>
            </div>
            <p className={styles.innerPageSubtitle}>
              {t(
                "settings.subtitle",
                "Hisob ma'lumotlari, xavfsizlik paroli va tizimga ulangan qurilmalarni boshqaring."
              )}
            </p>
          </div>
        </div>

        {/* Content Container */}
        <div style={{ maxWidth: 1200, width: "100%", margin: "0" }}>
          <Tabs defaultValue="profile">
            <div
              style={{
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                marginBottom: 16,
              }}
            >
              <Tabs.List style={{ flexWrap: "nowrap", minWidth: "max-content" }}>
                <Tabs.Tab value="profile" leftSection={<IconUser size={16} />}>
                  {t("settings.profile")}
                </Tabs.Tab>
                <Tabs.Tab value="appearance" leftSection={<IconTypography size={16} />}>
                  {t("settings.appearance")}
                </Tabs.Tab>
                <Tabs.Tab value="security" leftSection={<IconLock size={16} />}>
                  {t("settings.security")}
                </Tabs.Tab>
                <Tabs.Tab value="devices" leftSection={<IconDevices size={16} />}>
                  {t("settings.devices")}
                </Tabs.Tab>
              </Tabs.List>
            </div>

        <Tabs.Panel value="profile">
          <Stack gap="lg">
            <ProfileInfoCard />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="appearance">
          <Stack gap="lg">
            <SimpleTypographyControl />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="security">
          <Stack gap="lg">
            <ChangePasswordForm />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="devices">
          <Stack gap="lg">
            {devicesLoading && (
              <Center py="xl">
                <Loader size="sm" />
              </Center>
            )}

            {deviceInfo && (
              <>
                <Paper p="lg" radius="md" withBorder shadow="sm">
                  <Group justify="space-between" mb="md">
                    <Text fw={600}>{t("settings.activeDevices")}</Text>
                    <Badge size="lg" variant="light">
                      {activeCount}/{deviceInfo.maxDevices}
                    </Badge>
                  </Group>
                  <Text size="sm" c="dimmed">
                    {t("settings.deviceLimitDesc")}
                  </Text>
                </Paper>

                {deviceList.length > 0 && (
                  <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                    {deviceList.map((device) => {
                      const name = device.deviceName || t("settings.unknownDevice", "Noma'lum qurilma");
                      const isMobile = /mobile|android|iphone|ios/i.test(name);
                      return (
                        <Paper
                          key={device.deviceId}
                          p="md"
                          radius="md"
                          withBorder
                          shadow="sm"
                          style={device.isCurrent ? { borderColor: "var(--primary)" } : undefined}
                        >
                          <Group justify="space-between" wrap="nowrap" gap="sm">
                            <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                              {isMobile ? <IconDeviceMobile size={20} /> : <IconDeviceDesktop size={20} />}
                              <div style={{ minWidth: 0 }}>
                                <Group gap={6} wrap="wrap">
                                  <Text size="sm" fw={600} truncate>
                                    {name}
                                  </Text>
                                  {device.isCurrent && (
                                    <Badge size="sm" variant="light">
                                      {t("settings.thisDevice", "Shu qurilma")}
                                    </Badge>
                                  )}
                                </Group>
                                <Text size="xs" c="dimmed">
                                  {t("settings.lastActive", "Oxirgi faollik")}: {formatLastActive(device.lastActiveAt)}
                                </Text>
                              </div>
                            </Group>
                            <Tooltip
                              label={
                                device.isCurrent
                                  ? t("settings.cannotRemoveCurrent", "Joriy qurilmani chiqarib bo'lmaydi")
                                  : t("settings.removeDevice", "Qurilmani chiqarish")
                              }
                            >
                              <ActionIcon
                                variant="light"
                                color="red"
                                size="lg"
                                disabled={device.isCurrent}
                                aria-label={t("settings.removeDevice", "Qurilmani chiqarish")}
                                onClick={() => setPendingRemove(device)}
                              >
                                <IconTrash size={18} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Paper>
                      );
                    })}
                  </SimpleGrid>
                )}
              </>
            )}

            {!devicesLoading && !deviceInfo && (
              <Paper p="xl" radius="md" withBorder ta="center">
                <Text c="dimmed">{t("settings.noDeviceData")}</Text>
              </Paper>
            )}
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </div>

    <Modal
      opened={pendingRemove !== null}
      onClose={() => {
        if (!removing) setPendingRemove(null);
      }}
      title={t("settings.removeDeviceTitle", "Qurilmani chiqarish")}
    >
      <Stack gap="md">
        <Text size="sm">
          {t(
            "settings.removeDeviceConfirm",
            "\"{{name}}\" qurilmasidagi sessiya yakunlanadi. Davom etasizmi?",
            { name: pendingRemove?.deviceName || t("settings.unknownDevice", "Noma'lum qurilma") },
          )}
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setPendingRemove(null)} disabled={removing}>
            {t("common.cancel", "Bekor qilish")}
          </Button>
          <Button color="red" onClick={() => void confirmRemove()} loading={removing}>
            {t("settings.removeDevice", "Qurilmani chiqarish")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  </>
  );
};

export default Settings_Page;
