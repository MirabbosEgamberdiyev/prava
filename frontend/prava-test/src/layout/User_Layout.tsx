import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { UserRouteFallback } from "../components/common/RouteContentFallback";

/**
 * Modern desktop layout: clean full-width canvas with header-driven navigation.
 * Sidebar removed per reference image architecture.
 */
const User_Layout = () => {
  const location = useLocation();

  return (
    <div className="app shell-layout is-focus">
      <main className="shell-main" id="main-content">
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
