import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  IconSearch,
  IconKey,
  IconMenu2,
} from "@tabler/icons-react";
import LanguagePicker from "../language/LanguagePicker";
import ColorMode from "../other/ColorMode";
import UserMenuButton from "../nav/UserMenuButton";
import { useAuth } from "../../auth/AuthContext";
import type { User } from "../../types";
import styles from "./Dashboard.module.css";

interface DashboardHeaderProps {
  user: User | null;
  displayName: string;
  onOpenSearch: () => void;
  onToggleMobileSidebar: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
  onLogout: () => void;
  isMePage?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onOpenSearch,
  onToggleMobileSidebar,
  isMePage,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  return (
    <header className={styles.header}>
      {/* Left zone: Brand logo (+ optional subpage collapse toggle if !isMePage) */}
      <div className={styles.headerLeft}>
        {!isMePage && (
          <button
            type="button"
            className={styles.mobileMenuBtn}
            onClick={onToggleMobileSidebar}
            aria-label={t("common.menu")}
          >
            <IconMenu2 size={22} />
          </button>
        )}

        <div
          className={styles.brandLogo}
          onClick={() => navigate("/me")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate("/me")}
          title="Prava Online"
        >
          <div className={styles.brandLogoBadge}>
            <img
              src="/icons/icon-192x192.png"
              alt="Prava Online"
              className={styles.brandLogoImg}
            />
          </div>
          <div className={styles.brandText}>
            <span>PRAVA</span>
            <span className={styles.brandAccent}>ONLINE</span>
          </div>
        </div>
      </div>

      {/* Center zone: Desktop Spotlight search trigger */}
      <button
        type="button"
        className={styles.searchTrigger}
        onClick={onOpenSearch}
        title={`${t("search.shortcutLabel", "Global qidiruv")} (Ctrl+K / ⌘K)`}
        aria-label={t("refDashboard.searchPlaceholder", "Qidirish... (savol, mavzu, bilet, yo'l belgisi...)")}
      >
        <IconSearch size={16} stroke={2} className={styles.searchIcon} />
        <span className={styles.searchPlaceholder}>
          {t("refDashboard.searchPlaceholder", "Qidirish... (savol, mavzu, bilet, yo'l belgisi...)")}
        </span>
        <kbd className={styles.searchKbd}>{t("search.ctrlK", "Ctrl K")}</kbd>
      </button>

      {/* Right zone: Mobile Search + Language + Theme + User profile / Login */}
      <div className={styles.headerRight}>
        <button
          type="button"
          className={styles.mobileSearchBtn}
          onClick={onOpenSearch}
          aria-label={t("refDashboard.searchPlaceholder", "Qidirish...")}
        >
          <IconSearch size={19} stroke={2} />
        </button>

        <LanguagePicker />
        <ColorMode />

        {isAuthenticated ? (
          <UserMenuButton />
        ) : (
          <button
            type="button"
            className={styles.loginBtn}
            onClick={() => navigate("/auth/login")}
          >
            <IconKey size={15} />
            <span>{t("auth.login", "Kirish")}</span>
          </button>
        )}
      </div>
    </header>
  );
};
