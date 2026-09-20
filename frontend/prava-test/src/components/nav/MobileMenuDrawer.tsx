import React, { useEffect } from "react";
import {
  Drawer,
  Button,
  Group,
  ScrollArea,
  Stack,
  Box,
  Text,
  ActionIcon,
  SimpleGrid,
} from "@mantine/core";
import {
  IconBrandTelegram,
  IconPencil,
  IconBrandWindows,
  IconBrandGooglePlay,
  IconBrandApple,
  IconArrowRight,
  IconLogout,
  IconChartBar,
  IconX,
  IconHome,
  IconSparkles,
  IconBuildingCommunity,
  IconDownload,
  IconInfoCircle,
  IconHelpCircle,
  IconPhone,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import LanguagePicker from "../language/LanguagePicker";
import ColorMode from "../other/ColorMode";
import { useAuth } from "../../auth/AuthContext";
import { prefetchRoute } from "../../utils/routePrefetch";
import { getWebAppUrl, getLandingUrl } from "../../utils/domain";

interface MobileMenuDrawerProps {
  opened: boolean;
  onClose: () => void;
}

export const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({
  opened,
  onClose,
}) => {
  const { t } = useTranslation();
  const { isAuthenticated, logout, user } = useAuth();
  const location = useLocation();

  // Close drawer on route navigation
  useEffect(() => {
    if (opened) {
      onClose();
    }
  }, [location.pathname]);

  const navLinks = [
    {
      to: "/",
      label: t("nav.home", "Bosh sahifa"),
      icon: IconHome,
      isHash: false,
    },
    {
      to: getLandingUrl("/#benefits"),
      label: t("nav.features", "Imkoniyatlar"),
      icon: IconSparkles,
      isHash: true,
    },
    {
      to: "/partners",
      label: t("nav.partners", "Avtomaktablar"),
      icon: IconBuildingCommunity,
      isHash: false,
    },
    {
      to: "/downloads",
      label: t("nav.downloads", "Ilovalar"),
      icon: IconDownload,
      isHash: false,
    },
    {
      to: "/about",
      label: t("nav.about", "Biz haqimizda"),
      icon: IconInfoCircle,
      isHash: false,
    },
    {
      to: "/faq",
      label: t("nav.faq", "Ko'p so'raladigan savollar"),
      icon: IconHelpCircle,
      isHash: false,
    },
    {
      to: "/contact",
      label: t("nav.contact", "Bog'lanish"),
      icon: IconPhone,
      isHash: false,
    },
  ];

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="top"
      size="100%"
      withCloseButton={false}
      zIndex={10000}
      overlayProps={{
        backgroundOpacity: 0.65,
        blur: 16,
      }}
      styles={{
        content: {
          background: "var(--surface, #111827)",
          color: "var(--text, #f8fafc)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "100dvh",
          height: "100dvh",
          padding: 0,
        },
        body: {
          padding: 0,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
      }}
      aria-label={t("nav.mobileMenuTitle", "Mobil menyu")}
    >
      {/* 1. Header Bar: Logo + Brand + Close Button */}
      <Box
        px="md"
        h={58}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
          background: "var(--header-bg)",
          backdropFilter: "blur(20px)",
          flexShrink: 0,
        }}
      >
        <Link
          to="/"
          onClick={onClose}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            color: "var(--text)",
          }}
        >
          <img
            src="/logo.svg"
            alt="Prava Online"
            width={32}
            height={32}
          />
          <span
            style={{
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: "-0.2px",
              fontFamily: "Montserrat, sans-serif",
            }}
          >
            PRAVA<span style={{ color: "var(--primary)" }}>ONLINE</span>
          </span>
        </Link>

        <Group gap="xs">
          <ColorMode />
          <LanguagePicker />
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            radius="md"
            onClick={onClose}
            aria-label={t("common.close", "Yopish")}
          >
            <IconX size={22} stroke={2} />
          </ActionIcon>
        </Group>
      </Box>

      {/* 2. Scrollable Drawer Body */}
      <ScrollArea style={{ flex: 1 }} px="md" py="md">
        <Stack gap="md">
          {/* Primary CTA Block */}
          <Stack gap="xs">
            {isAuthenticated ? (
              <Button
                component="a"
                href={getWebAppUrl("/me")}
                onClick={onClose}
                fullWidth
                size="md"
                h={48}
                radius="md"
                style={{
                  background: "var(--primary, #0284c7)",
                  color: "#ffffff",
                  fontWeight: 700,
                }}
                rightSection={<IconArrowRight size={18} />}
              >
                {t("nav.dashboard", "Boshqaruv paneli")}
              </Button>
            ) : (
              <Button
                component="a"
                href={getWebAppUrl("/auth/login")}
                onClick={onClose}
                fullWidth
                size="md"
                h={48}
                radius="md"
                style={{
                  background: "var(--primary, #0284c7)",
                  color: "#ffffff",
                  fontWeight: 700,
                }}
                rightSection={<IconArrowRight size={18} />}
              >
                {t("home.hero.startNow", "Boshlash / Kirish")}
              </Button>
            )}

            <Button
              component={Link}
              to="/try-exam"
              onClick={onClose}
              fullWidth
              size="md"
              h={44}
              radius="md"
              variant="light"
              color="blue"
              leftSection={<IconPencil size={18} />}
              styles={{ root: { fontWeight: 600 } }}
            >
              {t("guestExam.tryFree", "Bepul sinov imtihoni")}
            </Button>
          </Stack>

          <Box my={2} style={{ height: 1, backgroundColor: "var(--border)" }} />

          {/* Navigation Links */}
          <Text
            size="xs"
            fw={700}
            tt="uppercase"
            c="dimmed"
            style={{ letterSpacing: "0.5px" }}
          >
            {t("nav.sections", "Bo'limlar")}
          </Text>

          <Stack gap={4}>
            {navLinks.map((item) => {
              const isActive =
                !item.isHash && location.pathname === item.to;
              const Icon = item.icon;

              if (item.isHash) {
                return (
                  <Button
                    key={item.to}
                    component="a"
                    href={item.to}
                    onClick={onClose}
                    fullWidth
                    size="md"
                    h={46}
                    variant={isActive ? "light" : "subtle"}
                    color={isActive ? "blue" : "gray"}
                    justify="flex-start"
                    leftSection={<Icon size={19} style={{ opacity: 0.8 }} />}
                    styles={{
                      root: {
                        fontWeight: isActive ? 700 : 500,
                        borderRadius: 10,
                        fontSize: "0.95rem",
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                );
              }

              return (
                <Button
                  key={item.to}
                  component={Link}
                  to={item.to}
                  onClick={onClose}
                  onMouseEnter={() => prefetchRoute(item.to)}
                  fullWidth
                  size="md"
                  h={46}
                  variant={isActive ? "light" : "subtle"}
                  color={isActive ? "blue" : "gray"}
                  justify="flex-start"
                  leftSection={<Icon size={19} style={{ opacity: 0.8 }} />}
                  styles={{
                    root: {
                      fontWeight: isActive ? 700 : 500,
                      borderRadius: 10,
                      fontSize: "0.95rem",
                    },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Stack>

          <Box my={2} style={{ height: 1, backgroundColor: "var(--border)" }} />

          {/* Download Platforms Grid */}
          <Text
            size="xs"
            fw={700}
            tt="uppercase"
            c="dimmed"
            style={{ letterSpacing: "0.5px" }}
          >
            {t("nav.downloads", "Ilovalarni yuklab olish")}
          </Text>

          <SimpleGrid cols={2} spacing="xs">
            <Button
              component="a"
              href="/api/v1/files/installers/prava-online-setup.exe"
              download
              onClick={onClose}
              size="sm"
              h={42}
              radius="md"
              variant="default"
              leftSection={<IconBrandWindows size={17} />}
              styles={{ root: { fontWeight: 600, fontSize: "0.82rem" } }}
            >
              Windows
            </Button>

            <Button
              component="a"
              href="https://play.google.com/store/apps/details?id=uz.prava.online"
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              size="sm"
              h={42}
              radius="md"
              variant="default"
              leftSection={<IconBrandGooglePlay size={17} color="#00e676" />}
              styles={{ root: { fontWeight: 600, fontSize: "0.82rem" } }}
            >
              Google Play
            </Button>

            <Button
              component="a"
              href="https://apps.apple.com/app/prava-online/id0000000000"
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              size="sm"
              h={42}
              radius="md"
              variant="default"
              leftSection={<IconBrandApple size={17} />}
              styles={{ root: { fontWeight: 600, fontSize: "0.82rem" } }}
            >
              App Store
            </Button>

            <Button
              component="a"
              href="https://t.me/pravaonlineuzbot"
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              size="sm"
              h={42}
              radius="md"
              variant="default"
              leftSection={<IconBrandTelegram size={17} color="#0088cc" />}
              styles={{ root: { fontWeight: 600, fontSize: "0.82rem" } }}
            >
              Telegram
            </Button>
          </SimpleGrid>

          {/* Bottom Auth Section (if authenticated) */}
          {isAuthenticated && (
            <Box pt="sm" style={{ borderTop: "1px solid var(--border)" }}>
              <Stack gap="xs">
                <Button
                  component="a"
                  href={getWebAppUrl("/me")}
                  fullWidth
                  variant="light"
                  color="blue"
                  radius="md"
                  h={42}
                  leftSection={<IconChartBar size={16} />}
                  onClick={onClose}
                  styles={{ root: { fontWeight: 600 } }}
                >
                  {user?.fullName || t("nav.dashboard", "Boshqaruv paneli")}
                </Button>
                <Button
                  onClick={() => {
                    onClose();
                    logout();
                  }}
                  fullWidth
                  variant="subtle"
                  color="red"
                  radius="md"
                  leftSection={<IconLogout size={16} />}
                  size="sm"
                >
                  {t("common.logout", "Chiqish")}
                </Button>
              </Stack>
            </Box>
          )}

          {/* Legal Footer Links */}
          <Group gap="md" my="sm" justify="center">
            <Link
              to="/terms"
              onClick={onClose}
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                textDecoration: "none",
              }}
            >
              {t("footer.terms", "Foydalanish shartlari")}
            </Link>
            <span style={{ color: "var(--border)" }}>•</span>
            <Link
              to="/privacy"
              onClick={onClose}
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                textDecoration: "none",
              }}
            >
              {t("footer.privacy", "Maxfiylik")}
            </Link>
            <span style={{ color: "var(--border)" }}>•</span>
            <Link
              to="/offer"
              onClick={onClose}
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                textDecoration: "none",
              }}
            >
              {t("footer.offer", "Oferta")}
            </Link>
          </Group>
        </Stack>
      </ScrollArea>
    </Drawer>
  );
};

export default MobileMenuDrawer;
