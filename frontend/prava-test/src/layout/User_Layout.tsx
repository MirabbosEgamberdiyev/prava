import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { UserRouteFallback } from "../components/common/RouteContentFallback";
import { DashboardLayout } from "../components/dashboard/DashboardLayout";

/**
 * Enterprise Dashboard AppShell Layout.
 * Persists DashboardHeader, Sticky Sidebar, and Global Persistent Footer
 * across all dashboard route transitions without unmounting or flicker.
 */
const User_Layout = () => {
  return (
    <DashboardLayout>
      <Suspense fallback={<UserRouteFallback />}>
        <Outlet />
      </Suspense>
    </DashboardLayout>
  );
};

export default User_Layout;
