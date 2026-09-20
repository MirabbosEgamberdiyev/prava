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
} from "@mantine/core";
import {
  IconUser,
  IconLock,
  IconDevices,
  IconDeviceMobile,
  IconDeviceDesktop,
  IconSettings,
  IconTypography,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import useSWR from "swr";
import { ProfileInfoCard } from "../../features/me/components/ProfileInfoCard";
import { ChangePasswordForm } from "../../features/me/components/ChangePasswordForm";
import { AccessibilityPanelContent } from "../../components/common/AccessibilityPanelContent";
import SEO from "../../components/common/SEO";

import styles from "../../components/dashboard/Dashboard.module.css";

interface DeviceInfo {
  currentDevices: number;
  maxDevices: number;
  devices?: Array<{
    deviceId: string;
    deviceName: string;
    lastActiveAt: string;
    isCurrent: boolean;
  }>;
}

const Settings_Page = () => {
  const { t } = useTranslation();

  const { data: deviceResponse, isLoading: devicesLoading } = useSWR<{
    data: DeviceInfo;
  }>("/api/v2/my-statistics/devices");

  const deviceInfo = deviceResponse?.data;

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
              <h2 className={styles.innerPageTitle}>
                <IconSettings
                  size={24}
                  stroke={2}
                  style={{ color: "var(--primary)", verticalAlign: "middle", marginRight: 8 }}
                />
                {t("settings.title", "Sozlamalar va Profil")}
              </h2>
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
                <Tabs.Tab value="security" leftSection={<IconLock size={16} />}>
                  {t("settings.security")}
                </Tabs.Tab>
                <Tabs.Tab value="devices" leftSection={<IconDevices size={16} />}>
                  {t("settings.devices")}
                </Tabs.Tab>
                <Tabs.Tab value="accessibility" leftSection={<IconTypography size={16} />}>
                  {t("accessibility.title", "Matn va Qulaylik")}
                </Tabs.Tab>
              </Tabs.List>
            </div>

        <Tabs.Panel value="profile">
          <Stack gap="lg">
            <ProfileInfoCard />
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
                      {deviceInfo.currentDevices}/{deviceInfo.maxDevices}
                    </Badge>
                  </Group>
                  <Text size="sm" c="dimmed">
                    {t("settings.deviceLimitDesc")}
                  </Text>
                </Paper>

                {deviceInfo.devices && deviceInfo.devices.length > 0 && (
                  <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                    {deviceInfo.devices.map((device) => (
                      <Paper
                        key={device.deviceId}
                        p="md"
                        radius="md"
                        withBorder
                        shadow="sm"
                        style={device.isCurrent ? { borderColor: "var(--mantine-color-blue-5)" } : undefined}
                      >
                        <Group justify="space-between">
                          <Group gap="sm">
                            {device.deviceName.toLowerCase().includes("mobile") ? (
                              <IconDeviceMobile size={20} />
                            ) : (
                              <IconDeviceDesktop size={20} />
                            )}
                            <div>
                              <Text size="sm" fw={500}>
                                {device.deviceName}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {new Date(device.lastActiveAt).toLocaleString()}
                              </Text>
                            </div>
                          </Group>
                          {device.isCurrent && (
                            <Badge size="sm" color="blue" variant="light">
                              {t("settings.currentDevice")}
                            </Badge>
                          )}
                        </Group>
                      </Paper>
                    ))}
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

        <Tabs.Panel value="accessibility">
          <Paper p="xl" radius="md" withBorder shadow="sm" style={{ background: "var(--card-bg)" }}>
            <div style={{ maxWidth: 680, margin: "0 auto" }}>
              <div style={{ marginBottom: 24 }}>
                <Text fw={700} size="lg" mb={4}>
                  {t("accessibility.title", "Matn va Qulaylik")}
                </Text>
                <Text size="sm" c="dimmed">
                  {t("accessibility.subtitle", "O'qish qulayligi, shrift o'lchami va kontrast sozlamalari")}
                </Text>
              </div>
              <AccessibilityPanelContent />
            </div>
          </Paper>
        </Tabs.Panel>
      </Tabs>
    </div>
  </>
  );
};

export default Settings_Page;
