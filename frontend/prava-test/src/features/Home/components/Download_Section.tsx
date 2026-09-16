import React from "react";
import { Box, SimpleGrid, Text, Title, Button, Group, Stack } from "@mantine/core";
import {
  IconDownload,
  IconBrandWindows,
  IconBrandGooglePlay,
  IconBrandApple,
  IconScan,
  IconExternalLink,
  IconBrowser,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { QRCodeSVG } from "../../../components/common/QRCodeSVG";
import { getWebAppUrl } from "@/utils/domain";
import classes from "./Home.module.css";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=uz.prava.online";
const APP_STORE_URL  = "https://apps.apple.com/app/prava-online/id0000000000";
const WINDOWS_DIRECT_URL = "/api/v1/files/installers/prava-online-setup.exe";

export const Download_Section = React.memo(() => {
  const { t } = useTranslation();
  const currentUrl = typeof window !== "undefined" ? window.location.origin + "/downloads" : "https://pravaonline.uz/downloads";

  return (
    <section className={classes.downloadSection} aria-label="Downloads">
      <div className={classes.downloadWrapper}>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={40} style={{ alignItems: "center" }}>
          {/* Left Column: Direct Download Actions */}
          <div>
            <div className={classes.sectionBadge}>
              <IconDownload size={14} />
              {t("home.downloadSection.badge", "Yuklab Oling")}
            </div>
            <Title order={2} c="var(--text)" mt="xs">
              {t("home.downloadSection.title", "O'zingizga qulay formatda o'rnating")}
            </Title>
            <Text size="sm" c="var(--text-muted)" mt="xs" mb="lg" lh={1.6}>
              {t(
                "home.downloadSection.subtitle",
                "Kompyuter va telefoningiz uchun eng so'nggi rasmiy versiyalar."
              )}
            </Text>

            <Stack gap="sm">
              {/* Windows Application */}
              <Button
                component="a"
                href={WINDOWS_DIRECT_URL}
                download
                fullWidth
                size="md"
                h={50}
                radius="md"
                color="blue"
                variant="filled"
                leftSection={<IconBrandWindows size={22} />}
                rightSection={<IconDownload size={18} />}
                style={{ fontWeight: 600 }}
              >
                {t("home.downloadSection.windowsApp", "Windows uchun yuklab olish (.exe)")}
              </Button>

              {/* Mobile Stores */}
              <SimpleGrid cols={{ base: 1, 360: 2 }} spacing="xs">
                <Button
                  component="a"
                  href={PLAY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  fullWidth
                  size="md"
                  h={48}
                  radius="md"
                  variant="default"
                  leftSection={<IconBrandGooglePlay size={20} color="#00e676" />}
                  rightSection={<IconExternalLink size={14} style={{ opacity: 0.5 }} />}
                  style={{ fontWeight: 600 }}
                >
                  Google Play
                </Button>

                <Button
                  component="a"
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  fullWidth
                  size="md"
                  h={48}
                  radius="md"
                  variant="default"
                  leftSection={<IconBrandApple size={20} />}
                  rightSection={<IconExternalLink size={14} style={{ opacity: 0.5 }} />}
                  style={{ fontWeight: 600 }}
                >
                  App Store
                </Button>
              </SimpleGrid>

              {/* Web App Quick Link */}
              <Button
                component="a"
                href={getWebAppUrl("/auth/login")}
                fullWidth
                size="md"
                h={48}
                radius="md"
                variant="light"
                color="blue"
                leftSection={<IconBrowser size={20} />}
                style={{ fontWeight: 600 }}
              >
                {t("home.downloadSection.openBrowser", "Web App'ni brauzerda ochish")}
              </Button>
            </Stack>
          </div>

          {/* Right Column: Dynamic QR Code */}
          <Box style={{ textAlign: "center" }}>
            <Box className={classes.qrContainer}>
              <QRCodeSVG
                value={currentUrl}
                size={160}
                bgColor="#ffffff"
                fgColor="#031824"
                level="Q"
              />
            </Box>
            <Group justify="center" gap="xs" mt="sm">
              <IconScan size={16} color="var(--primary)" />
              <Text size="xs" fw={600} c="var(--text-muted)" maw={260}>
                {t(
                  "home.downloadSection.qrScan",
                  "Kamerani QR-kodga yo'naltiring va ilovani yuklab oling"
                )}
              </Text>
            </Group>
          </Box>
        </SimpleGrid>
      </div>
    </section>
  );
});

Download_Section.displayName = "Download_Section";
