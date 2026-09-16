import {
  Anchor,
  Container,
  Flex,
  Group,
  Image,
  Paper,
  Text,
} from "@mantine/core";
import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Footer = React.memo(() => {
  const { t } = useTranslation();

  return (
    <Paper
      component="footer"
      bg="var(--surface)"
      mt="auto"
      style={{
        borderTop: "1px solid var(--border)",
        transition: "all 0.2s ease",
      }}
    >
      <Container maw={1200} px={{ base: "md", sm: "xl" }} py={{ base: "md", md: "lg" }}>
        <Flex
          justify="space-between"
          align="center"
          wrap="wrap"
          gap="md"
          direction={{ base: "column", md: "row" }}
        >
          {/* Brand & Copyright */}
          <Group gap="xs">
            <Image
              src="/logo.svg"
              alt="Prava Online"
              w={24}
              h={24}
              fallbackSrc="/favicon.svg"
            />
            <span className="saas-brand-text" style={{ fontSize: "1.05rem" }}>
              PRAVA<span className="brand-accent">ONLINE</span>
            </span>
            <Text size="xs" c="dimmed">
              © {new Date().getFullYear()} Prava Online. {t("footer.allRightsReserved", "Barcha huquqlar himoyalangan.")}
            </Text>
          </Group>

          {/* Public Internal Navigation Links */}
          <Group gap="md" wrap="wrap" justify="center">
            <Anchor component={Link} to="/about" size="xs" c="dimmed" underline="hover">
              {t("nav.about", "Biz haqimizda")}
            </Anchor>
            <Anchor component={Link} to="/downloads" size="xs" c="dimmed" underline="hover">
              {t("nav.downloads", "Ilovalar")}
            </Anchor>
            <Anchor component={Link} to="/partners" size="xs" c="dimmed" underline="hover">
              {t("nav.corporate", "Avtomaktablar")}
            </Anchor>
            <Anchor component={Link} to="/faq" size="xs" c="dimmed" underline="hover">
              {t("nav.faq", "Savol-javob")}
            </Anchor>
            <Anchor component={Link} to="/contact" size="xs" c="dimmed" underline="hover">
              {t("nav.contact", "Bog'lanish")}
            </Anchor>
            <Anchor component={Link} to="/terms" size="xs" c="dimmed" underline="hover">
              {t("footer.terms", "Shartlar")}
            </Anchor>
            <Anchor component={Link} to="/privacy" size="xs" c="dimmed" underline="hover">
              {t("footer.privacy", "Maxfiylik")}
            </Anchor>
            <Anchor
              href="https://t.me/pravaonlineuz"
              target="_blank"
              rel="noopener noreferrer"
              size="xs"
              c="blue"
              underline="hover"
            >
              Telegram: @pravaonlineuz
            </Anchor>
          </Group>
        </Flex>
      </Container>
    </Paper>
  );
});

Footer.displayName = "Footer";

export default Footer;
