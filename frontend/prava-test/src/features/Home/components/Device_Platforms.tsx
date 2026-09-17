import React from "react";
import { Box, SimpleGrid, Text, Title, Badge, Button, Group } from "@mantine/core";
import {
  IconBrandWindows,
  IconDeviceMobile,
  IconBrowser,
  IconBrandTelegram,
  IconDownload,
  IconBrandGooglePlay,
  IconBrandApple,
  IconExternalLink,
  IconDevices,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { DomainLink } from "@/components/common/DomainLink";
import { getWebAppUrl } from "@/utils/domain";
import classes from "./Home.module.css";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=uz.prava.online";
const APP_STORE_URL = "https://apps.apple.com/app/prava-online/id0000000000";
const WINDOWS_DIRECT_URL = "/api/v1/files/installers/prava-online-setup.exe";
const TELEGRAM_BOT_URL = "https://t.me/pravaonlineuzbot";

export const Device_Platforms = React.memo(() => {
  const { t } = useTranslation();

  return (
    <section className={classes.appShowcaseSection} aria-label={t("home.devices.title", "Istalgan qurilmada qulay o'rganing")}>
      <Box className={classes.sectionTitle}>
        <div className={classes.sectionBadge}>
          <IconDevices size={14} />
          {t("home.devices.badge", "Barcha Qurilmalarda")}
        </div>
        <Title order={2}>
          {t("home.devices.title", "Istalgan qurilmada qulay o'rganing")}
        </Title>
        <Text size="md" c="var(--text-muted)" mt="sm" maw={720} mx="auto" lh={1.6}>
          {t(
            "home.devices.subtitle",
            "Brauzerda, kompyuterda internetsiz yoki mobil telefonda — barcha qulay formatlar mavjud."
          )}
        </Text>
      </Box>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl" mt={36}>
        {/* 1. Web Application Card */}
        <div className={classes.appDeviceCard}>
          <div
            className={classes.trustIcon}
            style={{ backgroundColor: "rgba(2, 132, 199, 0.12)", color: "#0284c7" }}
          >
            <IconBrowser size={28} stroke={1.8} />
          </div>
          <Box style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <Badge size="xs" color="blue" variant="light" mb={6}>
              {t("home.devices.webCardBadge", "O'rnatish shart emas")}
            </Badge>
            <Text fw={700} size="md" c="var(--text)" lh={1.3} mb={6}>
              {t("home.devices.webCardTitle", "Web Ilova")}
            </Text>
            <Text size="sm" c="var(--text-muted)" lh={1.5} mb="lg" style={{ flex: 1 }}>
              {t(
                "home.devices.webCardDesc",
                "Zamonaviy kompyuter yoki telefon brauzerida to'liq ishlaydi. Ro'yxatdan o'ting va darhol boshlang."
              )}
            </Text>
            <DomainLink href={getWebAppUrl("/auth/login")} style={{ textDecoration: "none" }}>
              <Button
                variant="light"
                color="blue"
                fullWidth
                radius="md"
                size="sm"
                rightSection={<IconExternalLink size={16} />}
              >
                {t("home.devices.webCardAction", "Web ilovaga o'tish")}
              </Button>
            </DomainLink>
          </Box>
        </div>

        {/* 2. Windows Desktop Card */}
        <div className={classes.appDeviceCard}>
          <div
            className={classes.trustIcon}
            style={{ backgroundColor: "rgba(37, 99, 235, 0.12)", color: "#2563eb" }}
          >
            <IconBrandWindows size={28} stroke={1.8} />
          </div>
          <Box style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <Badge size="xs" color="indigo" variant="light" mb={6}>
              {t("home.devices.windowsCardBadge", "Internetsiz (Offline)")}
            </Badge>
            <Text fw={700} size="md" c="var(--text)" lh={1.3} mb={6}>
              {t("home.devices.windowsCardTitle", "Windows Desktop")}
            </Text>
            <Text size="sm" c="var(--text-muted)" lh={1.5} mb="lg" style={{ flex: 1 }}>
              {t(
                "home.devices.windowsCardDesc",
                "Kompyuter uchun mustaqil dastur (.exe). Barcha 70 ta bilet va 1200+ savollar internetsiz to'liq ishlaydi."
              )}
            </Text>
            <Button
              component="a"
              href={WINDOWS_DIRECT_URL}
              download
              variant="filled"
              color="blue"
              fullWidth
              radius="md"
              size="sm"
              leftSection={<IconDownload size={16} />}
            >
              {t("home.devices.windowsCardAction", "Yuklab olish (.exe)")}
            </Button>
          </Box>
        </div>

        {/* 3. Mobile Apps Card */}
        <div className={classes.appDeviceCard}>
          <div
            className={classes.trustIcon}
            style={{ backgroundColor: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}
          >
            <IconDeviceMobile size={28} stroke={1.8} />
          </div>
          <Box style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <Badge size="xs" color="green" variant="light" mb={6}>
              {t("home.devices.mobileCardBadge", "Android & iOS")}
            </Badge>
            <Text fw={700} size="md" c="var(--text)" lh={1.3} mb={6}>
              {t("home.devices.mobileCardTitle", "Mobil Ilova")}
            </Text>
            <Text size="sm" c="var(--text-muted)" lh={1.5} mb="lg" style={{ flex: 1 }}>
              {t(
                "home.devices.mobileCardDesc",
                "Jamoat transportida, navbatda yoki yo'lda har kuni telefoningizda qulay mashq qiling."
              )}
            </Text>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(115px, 1fr))",
                gap: 8,
              }}
            >
              <Button
                component="a"
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                variant="default"
                radius="md"
                size="sm"
                px={8}
                leftSection={<IconBrandGooglePlay size={16} color="#00e676" />}
              >
                Google Play
              </Button>
              <Button
                component="a"
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                variant="default"
                radius="md"
                size="sm"
                px={8}
                leftSection={<IconBrandApple size={16} />}
              >
                App Store
              </Button>
            </div>
          </Box>
        </div>
      </SimpleGrid>

      {/* Secondary Telegram Assistant Banner */}
      <Box
        mt="lg"
        p="md"
        style={{
          borderRadius: 14,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <Group gap="sm">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(0, 136, 204, 0.12)",
              color: "#0088cc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconBrandTelegram size={20} />
          </div>
          <div>
            <Text size="sm" fw={700} c="var(--text)">
              {t("home.devices.telegramCardTitle", "Telegram Bot")}
            </Text>
            <Text size="xs" c="var(--text-muted)">
              {t(
                "home.devices.telegramCardDesc",
                "Rasmiy bot orqali tezkor bildirishnomalar va qo'shimcha testlardan foydalaning."
              )}
            </Text>
          </div>
        </Group>
        <Button
          component="a"
          href={TELEGRAM_BOT_URL}
          target="_blank"
          rel="noopener noreferrer"
          variant="subtle"
          color="blue"
          size="xs"
          radius="md"
          rightSection={<IconExternalLink size={14} />}
        >
          {t("home.devices.telegramCardAction", "Telegramda ochish")}
        </Button>
      </Box>
    </section>
  );
});

Device_Platforms.displayName = "Device_Platforms";
