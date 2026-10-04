import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { RouteContentFallback } from "../components/common/RouteContentFallback";

export const DesktopAuthLayout = () => {
  const location = useLocation();

  const isLanguagePage = location.pathname.includes("/auth/language");

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
