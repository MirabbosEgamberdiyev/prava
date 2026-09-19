import { useEffect } from "react";
import { nprogress } from "@mantine/nprogress";

/**
 * Clean, zero-layout-shift fallback shown inside App_Layout when a route chunk is being fetched.
 * The Header, Navbar, and Footer stay completely stable and mounted.
 */
export function RouteContentFallback() {
  useEffect(() => {
    nprogress.start();
    return () => {
      nprogress.complete();
    };
  }, []);

  return (
    <div
      style={{
        flex: 1,
        width: "100%",
        minHeight: "60vh",
        background: "var(--bg)",
      }}
    />
  );
}

/**
 * Fallback for authenticated/dashboard routes inside User_Layout.
 */
export function UserRouteFallback() {
  useEffect(() => {
    nprogress.start();
    return () => {
      nprogress.complete();
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
      }}
    >
      <div className="spinner" />
    </div>
  );
}
