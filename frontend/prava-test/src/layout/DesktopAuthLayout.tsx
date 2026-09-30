import { Suspense } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import LanguagePicker from "../components/language/LanguagePicker";
import ColorMode from "../components/other/ColorMode";
import { RouteContentFallback } from "../components/common/RouteContentFallback";
import { useTranslation } from "react-i18next";
import { clearPendingAuthRedirect } from "../auth/pendingAuthRedirect";

export const DesktopAuthLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const isLanguagePage = location.pathname.includes("/auth/language");

  const continueAsGuest = () => {
    clearPendingAuthRedirect();
    navigate("/me", { replace: true });
  };

  return (
    <div
      style={{
        height: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
      }}
    >
      {/* Top Bar: Guest button + ColorMode + LanguagePicker */}
      <div
        style={{
          flex: "0 0 auto",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 10,
          padding: "12px 20px 0",
        }}
      >
        {!isLanguagePage && (
          <Button
            variant="subtle"
            size="xs"
            radius="md"
            rightSection={<IconArrowRight size={14} />}
            onClick={continueAsGuest}
            style={{ marginRight: "auto" }}
          >
            {t("auth.continueGuest")}
          </Button>
        )}
        <ColorMode />
        <LanguagePicker />
      </div>

      <main
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          background: "var(--bg)",
          overflowX: "hidden",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem 1rem",
            width: "100%",
          }}
        >
          <Suspense fallback={<RouteContentFallback />}>
            <div style={{ width: "100%", maxWidth: isLanguagePage ? 520 : 440, margin: "0 auto" }}>
              <Outlet />
            </div>
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default DesktopAuthLayout;
