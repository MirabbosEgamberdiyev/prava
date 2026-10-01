import { Suspense } from "react";
import { Outlet, Link } from "react-router-dom";
import {
  Group,
  Text,
  Container,
} from "@mantine/core";
import { RouteContentFallback } from "../components/common/RouteContentFallback";
import { useTranslation } from "react-i18next";

export const WebAuthLayout = () => {
  const { t } = useTranslation();

  return (
    <div
      style={{
        minHeight: "100%",
        flex: "1 1 auto",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
        color: "var(--text)",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
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
