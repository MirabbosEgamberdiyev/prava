import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconKey, IconSearch } from "@tabler/icons-react";
import { useAuth } from "../auth/AuthContext";
import { useAuthModal } from "../auth/AuthModalContext";
import UserMenuButton from "../components/nav/UserMenuButton";
import { isSearchBlockedPath, openGlobalSearch } from "../features/Search/GlobalSearchHost";
import { closeWindow, isTauri, minimizeWindow, toggleMaximizeWindow, useWindowState } from "./windowControls";
import { useShellFocusMode } from "./focusMode";

import LanguagePicker from "../components/common/LanguagePicker";
import ThemeToggle from "../components/common/ThemeToggle";

/** Segoe Fluent-style caption glyphs (10×10, 1px strokes, crisp at any DPI). */
function CaptionGlyph({ kind }: { kind: "min" | "max" | "restore" | "close" }) {
  const common = { width: 10, height: 10, viewBox: "0 0 10 10", fill: "none", stroke: "currentColor", strokeWidth: 1, "aria-hidden": true };
  switch (kind) {
    case "min":
      return (
        <svg {...common}>
          <path d="M0 5.5h10" />
        </svg>
      );
    case "max":
      return (
        <svg {...common}>
          <rect x="0.5" y="0.5" width="9" height="9" rx="1" />
        </svg>
      );
    case "restore":
      return (
        <svg {...common}>
          <rect x="0.5" y="2.5" width="7" height="7" rx="1" />
          <path d="M2.5 2.5V1.5a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-1" />
        </svg>
      );
    case "close":
      return (
        <svg {...common}>
          <path d="M0.5 0.5l9 9M9.5 0.5l-9 9" />
        </svg>
      );
  }
}

/**
 * Frameless window caption (Tauri `decorations: false`, see src-tauri/src/lib.rs):
 * icon + title + current section on a drag region (double-click maximizes natively via
 * Tauri's drag script), search / notifications / account, then Windows caption buttons.
 * Snap Layouts flyout needs a native maximize button → not available (documented limitation).
 */
export default function TitleBar() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { maximized, fullscreen } = useWindowState();
  const native = isTauri();

  const inFocus = useShellFocusMode();
  const isTestPath =
    pathname === "/exam" ||
    pathname === "/simulator" ||
    pathname.startsWith("/tickets/") ||
    pathname === "/wrong-exam" ||
    pathname === "/survival";

  const isLandingHostname = typeof window !== "undefined" && (window.location.hostname === "pravaonline.uz" || window.location.hostname === "www.pravaonline.uz");
  const isLandingMarketingPath =
    pathname === "/" ||
    pathname === "/about" ||
    pathname === "/partners" ||
    pathname === "/downloads" ||
    pathname === "/contact" ||
    pathname === "/faq" ||
    pathname === "/terms" ||
    pathname === "/privacy" ||
    pathname === "/offer";

  if ((!native && (isLandingHostname || isLandingMarketingPath)) || fullscreen || inFocus || isTestPath) return null;

  const canSearch = !isSearchBlockedPath(pathname);

  return (
    <header className="shell-titlebar" role="banner">
      <div
        className="shell-logo-wrap"
        onClick={() => navigate("/me")}
        style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
        title="Prava Online"
      >
        <div className="shell-logo-badge">
          <img src="/icons/icon-192x192.png" alt="Prava Online" className="shell-logo-img" />
        </div>
        <div style={{ display: "flex", alignItems: "center", userSelect: "none" }}>
          <span style={{ color: "var(--text, #ffffff)", fontWeight: 900, fontSize: "19px", letterSpacing: "-0.5px" }}>PRAVA</span>
          {/* i18n-ignore */}
          <span className="shell-logo-online" style={{ fontWeight: 900, fontSize: "19px", letterSpacing: "-0.5px" }}>ONLINE</span>
        </div>
      </div>

      {canSearch && (
        <button
          type="button"
          className="shell-titlebar-search"
          onClick={openGlobalSearch}
          title={`${t("search.shortcutLabel", "Global qidiruv")} (Ctrl+K / Ctrl+F)`}
          aria-keyshortcuts="Control+K Control+F"
        >
          <IconSearch size={16} stroke={2} className="shell-search-icon" />
          <span className="shell-search-placeholder">
            {t("refDashboard.searchPlaceholder", "Qidirish... (savol, mavzu, bilet, yo'l belgisi...)")}
          </span>
          <kbd>Ctrl K</kbd>
        </button>
      )}

      <div className="shell-titlebar-drag shell-titlebar-spacer" data-tauri-drag-region="deep" />

      <div className="shell-titlebar-tools">
        <LanguagePicker />
        <ThemeToggle />
        {isAuthenticated ? (
          <UserMenuButton />
        ) : !pathname.startsWith("/auth") ? (
          <button
            type="button"
            className="shell-login-btn"
            onClick={() => openAuthModal()}
          >
            <IconKey size={15} />
            {t("auth.login", "Kirish")}
          </button>
        ) : null}
      </div>

      {native && (
        <div className="shell-caption-buttons">
          <button
            type="button"
            className="shell-caption-btn"
            onClick={() => void minimizeWindow()}
            title={t("desktopShell.titlebar.minimize", "Yig'ish")}
            aria-label={t("desktopShell.titlebar.minimize", "Yig'ish")}
            tabIndex={-1}
          >
            <CaptionGlyph kind="min" />
          </button>
          <button
            type="button"
            className="shell-caption-btn"
            onClick={() => void toggleMaximizeWindow()}
            title={maximized ? t("desktopShell.titlebar.restore", "Oldingi o'lcham") : t("desktopShell.titlebar.maximize", "Kattalashtirish")}
            aria-label={maximized ? t("desktopShell.titlebar.restore", "Oldingi o'lcham") : t("desktopShell.titlebar.maximize", "Kattalashtirish")}
            tabIndex={-1}
          >
            <CaptionGlyph kind={maximized ? "restore" : "max"} />
          </button>
          <button
            type="button"
            className="shell-caption-btn shell-caption-close"
            onClick={() => void closeWindow()}
            title={t("desktopShell.titlebar.close", "Yopish")}
            aria-label={t("desktopShell.titlebar.close", "Yopish")}
            tabIndex={-1}
          >
            <CaptionGlyph kind="close" />
          </button>
        </div>
      )}
    </header>
  );
}
