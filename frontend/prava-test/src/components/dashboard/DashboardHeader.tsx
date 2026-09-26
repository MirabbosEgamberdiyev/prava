import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu } from "@mantine/core";
import {
  IconSearch,
  IconChevronDown,
  IconSettings,
  IconHistory,
  IconTrophy,
  IconLogout,
  IconMenu2,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
} from "@tabler/icons-react";
import LanguagePicker from "../language/LanguagePicker";
import ColorMode from "../other/ColorMode";
import NotificationCenter from "./NotificationCenter";
import type { User } from "../../types";
import styles from "./Dashboard.module.css";

interface DashboardHeaderProps {
  user: User | null;
  displayName: string;
  onOpenSearch: () => void;
  onToggleMobileSidebar: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebarCollapse: () => void;
  onLogout: () => void;
}

function getInitials(name: string): string {
  const parts = (name || "").trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }
  return (name?.charAt(0) || "U").toUpperCase();
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  displayName,
  onOpenSearch,
  onToggleMobileSidebar,
  isSidebarCollapsed,
  onToggleSidebarCollapse,
  onLogout,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const initials = getInitials(displayName);

  return (
    <header className={styles.header}>
      {/* Left zone: Mobile toggle + Brand logo + Desktop Sidebar collapse toggle */}
      <div className={styles.headerLeft}>
        <button
          type="button"
          className={styles.mobileMenuBtn}
          onClick={onToggleMobileSidebar}
          aria-label={t("common.menu", "Menyu")}
        >
          <IconMenu2 size={22} />
        </button>

        <div
          className={styles.brandLogo}
          onClick={() => navigate("/me")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate("/me")}
        >
          <img
            src="/logo.svg"
            alt="Prava Online"
            className={styles.brandLogoImg}
            width={36}
            height={36}
          />
          <span className={styles.brandText}>
            PRAVA<span className={styles.brandAccent}>ONLINE</span>
          </span>
        </div>

        <button
          type="button"
          className={styles.desktopCollapseBtn}
          onClick={onToggleSidebarCollapse}
          aria-label={
            isSidebarCollapsed
              ? t("dashboard.expand", "Panelni ochish")
              : t("dashboard.collapse", "Panelni yig'ish")
          }
          title={
            isSidebarCollapsed
              ? t("dashboard.expand", "Panelni ochish")
              : t("dashboard.collapse", "Panelni yig'ish")
          }
        >
          {isSidebarCollapsed ? (
            <IconLayoutSidebarLeftExpand size={20} stroke={1.8} />
          ) : (
            <IconLayoutSidebarLeftCollapse size={20} stroke={1.8} />
          )}
        </button>
      </div>

      {/* Center zone: Desktop Spotlight search trigger */}
      <button
        type="button"
        className={styles.searchTrigger}
        onClick={onOpenSearch}
        aria-label={t("dashboard.searchPlaceholder", "Mavzu, savol yoki qoida qidirish...")}
      >
        <IconSearch size={17} className={styles.searchIcon} />
        <span className={styles.searchPlaceholder}>
          {t("dashboard.searchPlaceholder", "Mavzu, savol yoki qoida qidirish...")}
        </span>
        <kbd className={styles.searchKbd}>⌘ K</kbd>
      </button>

      {/* Right zone: Mobile Search + Language + Theme + Notifications + User profile */}
      <div className={styles.headerRight}>
        {/* Mobile Search Icon Button (visible only on <= 768px) */}
        <button
          type="button"
          className={styles.mobileSearchBtn}
          onClick={onOpenSearch}
          aria-label={t("dashboard.searchPlaceholder", "Mavzu, savol yoki qoida qidirish...")}
        >
          <IconSearch size={19} stroke={2} />
        </button>

        <LanguagePicker />
        <ColorMode />

        {/* Notifications Center */}
        <NotificationCenter />

        {/* User Profile Dropdown Menu */}
        <Menu shadow="md" width={240} position="bottom-end" radius="md">
          <Menu.Target>
            <button
              type="button"
              className={styles.userProfileTrigger}
              aria-label={displayName}
            >
              <div className={styles.userAvatar}>{initials}</div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{displayName}</span>
                <span className={styles.userStatus}>
                  {t("dashboard.accountStatus", "Premium foydalanuvchi")}
                </span>
              </div>
              <IconChevronDown size={14} className={styles.userChevron} />
            </button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>{displayName}</Menu.Label>
            <Menu.Item
              leftSection={<IconSettings size={16} />}
              onClick={() => navigate("/settings")}
            >
              {t("nav.settings", "Sozlamalar")}
            </Menu.Item>
            <Menu.Item
              leftSection={<IconHistory size={16} />}
              onClick={() => navigate("/history")}
            >
              {t("dashboard.tools.historyTitle", "Imtihon tarixi")}
            </Menu.Item>
            <Menu.Item
              leftSection={<IconTrophy size={16} />}
              onClick={() => navigate("/leaderboard")}
            >
              {t("dashboard.tools.ratingTitle", "Reyting")}
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              color="red"
              leftSection={<IconLogout size={16} />}
              onClick={onLogout}
            >
              {t("auth.logout", "Chiqish")}
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </div>
    </header>
  );
};
