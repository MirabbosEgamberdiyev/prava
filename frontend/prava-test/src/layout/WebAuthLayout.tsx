import { Suspense } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import {
  Button,
  Group,
  Text,
  Container,
} from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import LanguagePicker from "../components/language/LanguagePicker";
import ColorMode from "../components/other/ColorMode";
import { RouteContentFallback } from "../components/common/RouteContentFallback";
import { useTranslation } from "react-i18next";
import { clearPendingAuthRedirect } from "../auth/pendingAuthRedirect";

export const WebAuthLayout = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const continueAsGuest = () => {
    clearPendingAuthRedirect();
    navigate("/me", { replace: true });
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
        color: "var(--text)",
      }}
    >
      {/* Top Navigation Bar */}
      <header
        style={{
          flex: "0 0 auto",
          borderBottom: "1px solid var(--border)",
          backgroundColor: "var(--card-bg, #ffffff)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <Container size="lg" h={60}>
          <Group justify="space-between" align="center" h="100%">
            {/* Logo + Title */}
            <Link
              to="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <img
                src="/logo.svg"
                alt="Prava Online"
                width={34}
                height={34}
                style={{ objectFit: "contain" }}
              />
              <Text fw={800} fz={18} style={{ letterSpacing: "-0.01em", color: "var(--text)" }}>
                PRAVA ONLINE
              </Text>
            </Link>

            {/* Right actions: Guest button + Theme + Language */}
            <Group gap={10}>
              <Button
                variant="subtle"
                size="xs"
                radius="md"
                rightSection={<IconArrowRight size={14} />}
                onClick={continueAsGuest}
                c="dimmed"
              >
                {t("auth.continueGuest", { defaultValue: "Mehmon sifatida" })}
              </Button>
              <ColorMode />
              <LanguagePicker />
            </Group>
          </Group>
        </Container>
      </header>

      {/* Main Content Area */}
      <main
        style={{
          flex: "1 0 auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "32px 16px",
          width: "100%",
        }}
      >
        <Suspense fallback={<RouteContentFallback />}>
          <Outlet />
        </Suspense>
      </main>

      {/* Footer */}
      <footer
        style={{
          flex: "0 0 auto",
          borderTop: "1px solid var(--border)",
          padding: "16px 0",
          backgroundColor: "var(--card-bg, #ffffff)",
          fontSize: "12px",
          color: "var(--text-muted, #64748b)",
        }}
      >
        <Container size="lg">
          <Group justify="space-between" align="center" wrap="wrap" gap={12}>
            <Text size="xs" c="dimmed">
              {t("footer.copyright", { year: new Date().getFullYear() })}
            </Text>
            <Group gap={16}>
              <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>
                {t("nav.home")}
              </Link>
              <Link to="/terms" style={{ color: "inherit", textDecoration: "none" }}>
                {t("auth.termsOfService", { defaultValue: "Foydalanish shartlari" })}
              </Link>
              <Link to="/privacy" style={{ color: "inherit", textDecoration: "none" }}>
                {t("auth.privacyPolicy", { defaultValue: "Maxfiylik siyosati" })}
              </Link>
              <Link to="/faq" style={{ color: "inherit", textDecoration: "none" }}>
                {t("home.faq", { defaultValue: "Savol-javob" })}
              </Link>
            </Group>
          </Group>
        </Container>
      </footer>
    </div>
  );
};

export default WebAuthLayout;
