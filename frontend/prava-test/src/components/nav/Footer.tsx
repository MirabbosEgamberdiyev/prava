import React from "react";
import {
  Anchor,
  Box,
  Container,
  Flex,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  IconBrandTelegram,
  IconBrandInstagram,
  IconBrandGooglePlay,
  IconBrandApple,
  IconBrandWindows,
  IconBrowser,
} from "@tabler/icons-react";
import { getWebAppUrl } from "@/utils/domain";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=uz.prava.online";
const APP_STORE_URL = "https://apps.apple.com/app/prava-online/id0000000000";
const WINDOWS_DIRECT_URL = "/api/v1/files/installers/prava-online-setup.exe";
const TELEGRAM_CHANNEL_URL = "https://t.me/pravaonlineuz";
const TELEGRAM_BOT_URL = "https://t.me/pravaonlineuzbot";
const INSTAGRAM_URL = "https://instagram.com/pravaonlineuz";

const Footer = React.memo(() => {
  const { t } = useTranslation();

  return (
    <Paper
      component="footer"
      bg="var(--surface)"
      mt="auto"
      style={{
        borderTop: "1px solid var(--border)",
        transition: "background-color 0.2s ease, border-color 0.2s ease",
      }}
    >
      <Container maw={1200} px={{ base: "md", sm: "xl" }} py={{ base: 28, md: 36 }}>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing={{ base: "xl", md: 36 }}>
          {/* Column 1: Brand & Bio */}
          <Stack gap="xs">
            <Group gap="xs">
              <Image
                src="/logo.svg"
                alt="Prava Online"
                w={26}
                h={26}
                fallbackSrc="/favicon.svg"
              />
              <span className="saas-brand-text" style={{ fontSize: "1.15rem", fontWeight: 800 }}>
                PRAVA<span className="brand-accent">ONLINE</span>
              </span>
            </Group>
            <Text size="xs" c="var(--text-muted)" lh={1.6} maw={260}>
              {t(
                "footer.brandDesc",
                "Haydovchilik guvohnomasi nazariy imtihoniga mustaqil va sifatli tayyorlanish platformasi."
              )}
            </Text>
            <Group gap={8} mt={4}>
              <Tooltip label={t("footer.telegramChannel", "Telegram kanal")} withArrow>
                <ActionIcon
                  component="a"
                  href={TELEGRAM_CHANNEL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="subtle"
                  color="blue"
                  size="sm"
                  radius="md"
                  aria-label="Telegram"
                >
                  <IconBrandTelegram size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={t("footer.telegramBot", "Telegram bot")} withArrow>
                <ActionIcon
                  component="a"
                  href={TELEGRAM_BOT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="subtle"
                  color="cyan"
                  size="sm"
                  radius="md"
                  aria-label={t("footer.telegramBot", "Telegram Bot")}
                >
                  <IconBrandTelegram size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Instagram" withArrow>
                <ActionIcon
                  component="a"
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="subtle"
                  color="pink"
                  size="sm"
                  radius="md"
                  aria-label="Instagram"
                >
                  <IconBrandInstagram size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Stack>

          {/* Column 2: Mahsulot */}
          <Stack gap={8}>
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: "0.5px" }}>
              {t("footer.colProduct", "Mahsulot")}
            </Text>
            <Anchor
              href={getWebAppUrl("/")}
              size="xs"
              c="var(--text)"
              underline="hover"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <IconBrowser size={14} color="var(--primary)" />
              <span>{t("footer.webApp", "Web ilova")}</span>
            </Anchor>
            <Anchor
              href={WINDOWS_DIRECT_URL}
              download
              size="xs"
              c="var(--text)"
              underline="hover"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <IconBrandWindows size={14} color="#2563eb" />
              <span>{t("footer.windowsApp", "Windows (.exe)")}</span>
            </Anchor>
            <Anchor
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              size="xs"
              c="var(--text)"
              underline="hover"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <IconBrandGooglePlay size={14} color="#00e676" />
              <span>{t("footer.androidApp", "Android (Google Play)")}</span>
            </Anchor>
            <Anchor
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              size="xs"
              c="var(--text)"
              underline="hover"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <IconBrandApple size={14} />
              <span>{t("footer.iosApp", "iOS (App Store)")}</span>
            </Anchor>
            <Anchor
              href={TELEGRAM_BOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              size="xs"
              c="var(--text)"
              underline="hover"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <IconBrandTelegram size={14} color="#0088cc" />
              <span>Telegram Bot</span>
            </Anchor>
          </Stack>

          {/* Column 3: Yordam */}
          <Stack gap={8}>
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: "0.5px" }}>
              {t("footer.colSupport", "Yordam")}
            </Text>
            <Anchor component={Link} to="/faq" size="xs" c="var(--text)" underline="hover">
              {t("footer.faq", "Ko'p so'raladigan savollar")}
            </Anchor>
            <Anchor component={Link} to="/about" size="xs" c="var(--text)" underline="hover">
              {t("footer.about", "Biz haqimizda")}
            </Anchor>
            <Anchor component={Link} to="/contact" size="xs" c="var(--text)" underline="hover">
              {t("footer.contact", "Bog'lanish")}
            </Anchor>
            <Anchor component={Link} to="/partners" size="xs" c="var(--text)" underline="hover">
              {t("footer.corporate", "Avtomaktablar va hamkorlik")}
            </Anchor>
          </Stack>

          {/* Column 4: Huquqiy */}
          <Stack gap={8}>
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: "0.5px" }}>
              {t("footer.colLegal", "Huquqiy")}
            </Text>
            <Anchor component={Link} to="/terms" size="xs" c="var(--text)" underline="hover">
              {t("footer.terms", "Foydalanish shartlari")}
            </Anchor>
            <Anchor component={Link} to="/privacy" size="xs" c="var(--text)" underline="hover">
              {t("footer.privacy", "Maxfiylik siyosati")}
            </Anchor>
            <Anchor component={Link} to="/offer" size="xs" c="var(--text)" underline="hover">
              {t("footer.offer", "Ommaviy oferta")}
            </Anchor>
          </Stack>
        </SimpleGrid>

        {/* Bottom sub-footer */}
        <Box
          mt={{ base: 22, md: 26 }}
          pt={14}
          style={{
            borderTop: "1px solid var(--border)",
          }}
        >
          <Flex
            direction={{ base: "column", sm: "row" }}
            justify="space-between"
            align={{ base: "flex-start", sm: "center" }}
            gap="xs"
          >
            <Text size="xs" c="dimmed">
              © {new Date().getFullYear()} Prava Online. {t("footer.allRightsReserved", "Barcha huquqlar himoyalangan.")}
            </Text>
            <Text size="xs" c="dimmed">
              {t("footer.independentNotice", "Mustaqil ta'lim platformasi. Rasmiy davlat organi emas.")}
            </Text>
          </Flex>
        </Box>
      </Container>
    </Paper>
  );
});

Footer.displayName = "Footer";

export default Footer;
