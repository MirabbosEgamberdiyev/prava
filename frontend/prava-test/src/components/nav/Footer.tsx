import React from "react";
import {
  Anchor,
  Box,
  Container,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconBrandTelegram } from "@tabler/icons-react";
import { getWebAppUrl } from "@/utils/domain";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=uz.prava.online";
const APP_STORE_URL = "https://apps.apple.com/app/prava-online/id0000000000";
const WINDOWS_DIRECT_URL = "/api/v1/files/installers/prava-online-setup.exe";

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
      <Container maw={1200} px={{ base: "md", sm: "xl" }} py={{ base: "xl", md: 48 }}>
        <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing={{ base: "xl", md: 36 }}>
          {/* Column 1: Brand & Description */}
          <Stack gap="sm">
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
            <Text size="sm" c="var(--text-muted)" lh={1.6}>
              {t(
                "footer.brandDesc",
                "Haydovchilik guvohnomasi imtihoniga tayyorlanishning zamonaviy va qulay platformasi."
              )}
            </Text>
            <Text size="xs" c="dimmed" mt="xs">
              © {new Date().getFullYear()} Prava Online. {t("footer.allRightsReserved", "Barcha huquqlar himoyalangan.")}
            </Text>
          </Stack>

          {/* Column 2: Mahsulot */}
          <Stack gap="xs">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: "0.5px" }}>
              {t("footer.colProduct", "Mahsulot")}
            </Text>
            <Anchor
              href={getWebAppUrl("/")}
              size="sm"
              c="var(--text)"
              underline="hover"
            >
              {t("footer.webApp", "Web ilova")}
            </Anchor>
            <Anchor
              href={WINDOWS_DIRECT_URL}
              download
              size="sm"
              c="var(--text)"
              underline="hover"
            >
              {t("footer.windowsApp", "Windows (.exe)")}
            </Anchor>
            <Anchor
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              c="var(--text)"
              underline="hover"
            >
              {t("footer.androidApp", "Android (Google Play)")}
            </Anchor>
            <Anchor
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              c="var(--text)"
              underline="hover"
            >
              {t("footer.iosApp", "iOS (App Store)")}
            </Anchor>
          </Stack>

          {/* Column 3: Yordam */}
          <Stack gap="xs">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: "0.5px" }}>
              {t("footer.colSupport", "Yordam")}
            </Text>
            <Anchor component={Link} to="/faq" size="sm" c="var(--text)" underline="hover">
              {t("footer.faq", "Ko'p so'raladigan savollar")}
            </Anchor>
            <Anchor component={Link} to="/about" size="sm" c="var(--text)" underline="hover">
              {t("footer.about", "Biz haqimizda")}
            </Anchor>
            <Anchor component={Link} to="/contact" size="sm" c="var(--text)" underline="hover">
              {t("footer.contact", "Bog'lanish")}
            </Anchor>
            <Anchor component={Link} to="/partners" size="sm" c="var(--text)" underline="hover">
              {t("footer.corporate", "Avtomaktablar va hamkorlik")}
            </Anchor>
          </Stack>

          {/* Column 4: Huquqiy va Aloqa */}
          <Stack gap="xs">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: "0.5px" }}>
              {t("footer.colLegal", "Huquqiy va Aloqa")}
            </Text>
            <Anchor component={Link} to="/terms" size="sm" c="var(--text)" underline="hover">
              {t("footer.terms", "Foydalanish shartlari")}
            </Anchor>
            <Anchor component={Link} to="/privacy" size="sm" c="var(--text)" underline="hover">
              {t("footer.privacy", "Maxfiylik siyosati")}
            </Anchor>
            <Box mt={6}>
              <Anchor
                href="https://t.me/pravaonlineuz"
                target="_blank"
                rel="noopener noreferrer"
                size="sm"
                c="#0284c7"
                underline="hover"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600 }}
              >
                <IconBrandTelegram size={16} stroke={1.8} />
                <span>@pravaonlineuz</span>
              </Anchor>
            </Box>
          </Stack>
        </SimpleGrid>
      </Container>
    </Paper>
  );
});

Footer.displayName = "Footer";

export default Footer;
