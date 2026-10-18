import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { UserRouteFallback } from "../components/common/RouteContentFallback";

/**
 * Modern desktop layout: clean full-width canvas with header-driven navigation.
 * Sidebar removed per reference image architecture.
 */
const User_Layout = () => {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <div className="app shell-layout is-focus">
      <main className="shell-main" id="main-content" tabIndex={-1} role="region" aria-label={t("common.mainContent", "Main content")}>
        <div className="page-transition-wrapper shell-page" key={location.pathname}>
          <Suspense fallback={<UserRouteFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default User_Layout;
