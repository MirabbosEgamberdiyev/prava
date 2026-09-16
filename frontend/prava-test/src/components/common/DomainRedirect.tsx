import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { redirectToWebApp, redirectToLanding } from "../../utils/domain";

interface DomainRedirectProps {
  targetPath?: string;
  preserveQuery?: boolean;
}

/**
 * Automatically redirects the user to the Web Application domain (web.pravaonline.uz)
 * preserving all query parameters (e.g. for QR pairing or Telegram token logins).
 */
export function DomainRedirectToWebApp({
  targetPath,
  preserveQuery = true,
}: DomainRedirectProps) {
  const location = useLocation();
  const path = targetPath || location.pathname;

  useEffect(() => {
    redirectToWebApp(path, preserveQuery);
  }, [path, preserveQuery]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg, #1a1b1e)",
        color: "var(--text, #ffffff)",
        gap: 16,
      }}
    >
      <div className="spinner" />
      <span style={{ fontSize: "14px", opacity: 0.8 }}>
        Ilovaga yo'naltirilmoqda...
      </span>
    </div>
  );
}

/**
 * Automatically redirects the user to the Public Landing domain (pravaonline.uz)
 */
export function DomainRedirectToLanding({
  targetPath,
  preserveQuery = false,
}: DomainRedirectProps) {
  const location = useLocation();
  const path = targetPath || location.pathname;

  useEffect(() => {
    redirectToLanding(path, preserveQuery);
  }, [path, preserveQuery]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg, #1a1b1e)",
        color: "var(--text, #ffffff)",
        gap: 16,
      }}
    >
      <div className="spinner" />
      <span style={{ fontSize: "14px", opacity: 0.8 }}>
        Bosh sahifaga yo'naltirilmoqda...
      </span>
    </div>
  );
}
