import { useAuth } from "@/auth/AuthContext";
import { AppShell, Button, Group, ScrollArea, Stack, Box, Text } from "@mantine/core";
import {
  IconBrandTelegram,
  IconPencil,
  IconBrandWindows,
  IconBrandGooglePlay,
  IconBrandApple,
  IconArrowRight,
  IconLogout,
  IconChartBar,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import LanguagePicker from "../language/LanguagePicker";
import ColorMode from "../other/ColorMode";
import { prefetchRoute } from "../../utils/routePrefetch";
import { getWebAppUrl } from "../../utils/domain";

const Navbar = ({ close }: { close: () => void }) => {
  const { t } = useTranslation();
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <AppShell.Navbar
      py="md"
      px="md"
      style={{
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Mobile Top Controls (Language & Theme) */}
      <Box pb="sm" style={{ borderBottom: "1px solid var(--border)" }}>
        <Group justify="space-between" align="center">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: "0.5px" }}>
            {t("userMenu.settings", "Sozlamalar")}
          </Text>
          <Group gap="xs">
            <ColorMode />
            <LanguagePicker />
          </Group>
        </Group>
      </Box>

      {/* Navigation & Action List */}
      <ScrollArea style={{ flex: 1 }} pt="sm">
        <Stack gap="sm" pt="xs">
          {/* 1. Primary Action: Web App / Boshlash */}
          <Button
            component="a"
            href={getWebAppUrl(isAuthenticated ? "/me" : "/auth/login")}
            onClick={close}
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
            {isAuthenticated ? t("nav.dashboard", "Boshqaruv paneli") : t("home.hero.startNow", "Boshlash")}
          </Button>

          {/* 2. Free Guest Exam */}
          <Button
            component={Link}
            to="/try-exam"
            onClick={close}
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

          <Box my={4} style={{ height: 1, backgroundColor: "var(--border)" }} />

          <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: "0.5px" }}>
            {t("nav.downloads", "Ilovalar")}
          </Text>

          {/* 3. Downloads */}
          <Button
            component="a"
            href="/api/v1/files/installers/prava-online-setup.exe"
            download
            onClick={close}
            fullWidth
            size="sm"
            h={42}
            radius="md"
            variant="default"
            leftSection={<IconBrandWindows size={18} />}
            styles={{ root: { fontWeight: 600 } }}
          >
            Windows (.exe)
          </Button>

          <Button
            component="a"
            href="https://play.google.com/store/apps/details?id=uz.prava.online"
            target="_blank"
            rel="noopener noreferrer"
            onClick={close}
            fullWidth
            size="sm"
            h={42}
            radius="md"
            variant="default"
            leftSection={<IconBrandGooglePlay size={18} color="#00e676" />}
            styles={{ root: { fontWeight: 600 } }}
          >
            Google Play
          </Button>

          <Button
            component="a"
            href="https://apps.apple.com/app/prava-online/id0000000000"
            target="_blank"
            rel="noopener noreferrer"
            onClick={close}
            fullWidth
            size="sm"
            h={42}
            radius="md"
            variant="default"
            leftSection={<IconBrandApple size={18} />}
            styles={{ root: { fontWeight: 600 } }}
          >
            App Store
          </Button>

          <Button
            component="a"
            href="https://t.me/pravaonlineuzbot"
            target="_blank"
            rel="noopener noreferrer"
            onClick={close}
            fullWidth
            size="sm"
            h={42}
            radius="md"
            variant="default"
            leftSection={<IconBrandTelegram size={18} color="#0088cc" />}
            styles={{ root: { fontWeight: 600 } }}
          >
            Telegram Bot
          </Button>

          <Box my={4} style={{ height: 1, backgroundColor: "var(--border)" }} />

          {/* Public Pages Navigation */}
          <Stack gap={4}>
            <Button
              component={Link}
              to="/downloads"
              onClick={close}
              fullWidth
              size="sm"
              variant="subtle"
              color="gray"
              justify="flex-start"
              styles={{ root: { fontWeight: 500 } }}
            >
              {t("nav.downloads", "Ilovalar (Windows, Mobile)")}
            </Button>
            <Button
              component={Link}
              to="/partners"
              onClick={close}
              fullWidth
              size="sm"
              variant="subtle"
              color="gray"
              justify="flex-start"
              styles={{ root: { fontWeight: 500 } }}
            >
              {t("nav.corporate", "Avtomaktablar va Hamkorlik")}
            </Button>
            <Button
              component={Link}
              to="/about"
              onClick={close}
              fullWidth
              size="sm"
              variant="subtle"
              color="gray"
              justify="flex-start"
              styles={{ root: { fontWeight: 500 } }}
            >
              {t("nav.about", "Biz haqimizda")}
            </Button>
            <Button
              component={Link}
              to="/faq"
              onClick={close}
              fullWidth
              size="sm"
              variant="subtle"
              color="gray"
              justify="flex-start"
              styles={{ root: { fontWeight: 500 } }}
            >
              {t("nav.faq", "Ko'p so'raladigan savollar")}
            </Button>
            <Button
              component={Link}
              to="/contact"
              onClick={close}
              fullWidth
              size="sm"
              variant="subtle"
              color="gray"
              justify="flex-start"
              styles={{ root: { fontWeight: 500 } }}
            >
              {t("nav.contact", "Bog'lanish")}
            </Button>
          </Stack>

          {/* Legal Links */}
          <Group gap="md" mt="sm" justify="center">
            <Link to="/terms" onClick={close} style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {t("footer.terms", "Foydalanish shartlari")}
            </Link>
            <span style={{ color: "var(--border)" }}>•</span>
            <Link to="/privacy" onClick={close} style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {t("footer.privacy", "Maxfiylik")}
            </Link>
          </Group>
        </Stack>
      </ScrollArea>

      {/* Bottom Auth Section (if authenticated) */}
      {isAuthenticated && (
        <Box pt="md" style={{ borderTop: "1px solid var(--border)" }}>
          <Stack gap="xs">
            <Button
              component="a"
              href={getWebAppUrl("/me")}
              onMouseEnter={() => prefetchRoute("/me")}
              onTouchStart={() => prefetchRoute("/me")}
              fullWidth
              variant="light"
              color="blue"
              radius="md"
              leftSection={<IconChartBar size={16} />}
              onClick={close}
              styles={{ root: { fontWeight: 600 } }}
            >
              {user?.fullName || t("nav.dashboard", "Boshqaruv paneli")}
            </Button>
            <Button
              onClick={() => {
                close();
                logout();
              }}
              fullWidth
              variant="subtle"
              color="red"
              radius="md"
              leftSection={<IconLogout size={16} />}
              size="xs"
            >
              {t("common.logout", "Chiqish")}
            </Button>
          </Stack>
        </Box>
      )}
    </AppShell.Navbar>
  );
};

export default Navbar;
