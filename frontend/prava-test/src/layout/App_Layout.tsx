import { Suspense } from "react";
import { AppShell } from "@mantine/core";
import { Outlet, useLocation } from "react-router-dom";
import Footer from "../components/nav/Footer";
import AuthCompactFooter from "../components/auth/AuthCompactFooter";
import { useDisclosure } from "@mantine/hooks";
import MobileMenuDrawer from "@/components/nav/MobileMenuDrawer";
import Header from "@/components/nav/Header";
import { RouteContentFallback } from "../components/common/RouteContentFallback";

const App_Layout = () => {
  const [opened, { toggle, close }] = useDisclosure();
  const location = useLocation();

  const isAuthPage =
    location.pathname.startsWith("/auth") ||
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/forgot-password" ||
    location.pathname === "/reset-password" ||
    location.pathname === "/verify-email" ||
    location.pathname === "/verify-sms";

  return (
    <AppShell
      header={{ height: 58 }}
      padding={0}
    >
      <Header opened={opened} toggle={toggle} />
      <MobileMenuDrawer opened={opened} onClose={close} />
      <AppShell.Main
        px={0}
        style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}
      >
        <div
          style={{ flex: 1 }}
          className="page-transition-wrapper"
        >
          <Suspense fallback={<RouteContentFallback />}>
            <Outlet />
          </Suspense>
        </div>
        {isAuthPage ? <AuthCompactFooter /> : <Footer />}
      </AppShell.Main>
    </AppShell>
  );
};

export default App_Layout;
