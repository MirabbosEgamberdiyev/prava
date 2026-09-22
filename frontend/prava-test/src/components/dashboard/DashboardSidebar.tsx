import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  IconHome2,
  IconBook2,
  IconTicket,
  IconRun,
  IconPencil,
  IconChartBar,
  IconBookmark,
  IconTrophy,
  IconSettings,
  IconCrown,
  IconArrowRight,
  IconX,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconDirections,
  IconRoad,
  IconBuildingSkyscraper,
  IconSteeringWheel,
  IconDeviceGamepad2,
  IconGavel,
  IconBook,
} from "@tabler/icons-react";
import styles from "./Dashboard.module.css";

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenExamPicker: () => void;
  onWheel?: (e: React.WheelEvent<HTMLElement>) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  isOpen,
  onClose,
  onOpenExamPicker,
  onWheel,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const currentX = e.touches[0].clientX;
    const deltaX = touchStartX - currentX;
    if (deltaX > 50) {
      setTouchStartX(null);
      onClose();
    }
  };

  const [isPremiumDismissed, setIsPremiumDismissed] = useState<boolean>(() => {
    try {
      return typeof window !== "undefined" && localStorage.getItem("sidebar-premium-dismissed") === "true";
    } catch {
      return false;
    }
  });

  const handleDismissPremium = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPremiumDismissed(true);
    try {
      localStorage.setItem("sidebar-premium-dismissed", "true");
    } catch {}
  };

  const handleReopenPremium = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPremiumDismissed(false);
    try {
      localStorage.removeItem("sidebar-premium-dismissed");
    } catch {}
  };

  // 1. ESC key to close mobile drawer
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // 2. Body scroll lock when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const navItems = [
    {
      path: "/me",
      label: t("dashboard.nav.home", "Bosh sahifa"),
      icon: IconHome2,
      action: () => {
        navigate("/me");
        onClose();
      },
    },
    {
      path: "/topics",
      label: t("dashboard.nav.topics", "Mavzular"),
      icon: IconBook2,
      action: () => {
        navigate("/topics");
        onClose();
      },
    },
    {
      path: "/tickets",
      label: t("dashboard.nav.tickets", "Biletlar"),
      icon: IconTicket,
      action: () => {
        navigate("/tickets");
        onClose();
      },
    },
    {
      path: "/marafon",
      label: t("dashboard.nav.marathon", "Marafon"),
      icon: IconRun,
      action: () => {
        navigate("/marafon");
        onClose();
      },
    },
    {
      path: "/exam",
      label: t("dashboard.nav.exam", "Haqiqiy imtihon"),
      icon: IconPencil,
      action: () => {
        onClose();
        onOpenExamPicker();
      },
    },
    {
      path: "/signs",
      label: t("dashboard.nav.signs", "Yo'l belgilari"),
      icon: IconDirections,
      action: () => {
        navigate("/signs");
        onClose();
      },
    },
    {
      path: "/markings",
      label: t("dashboard.nav.markings", "Yo'l chiziqlari"),
      icon: IconRoad,
      action: () => {
        navigate("/markings");
        onClose();
      },
    },
    {
      path: "/practical-exam",
      label: t("dashboard.nav.autodrom", "Avtodrom"),
      icon: IconSteeringWheel,
      action: () => {
        navigate("/practical-exam");
        onClose();
      },
    },
    {
      path: "/simulator",
      label: t("dashboard.nav.simulator", "Avtodrom Simulyatori 3D"),
      icon: IconDeviceGamepad2,
      action: () => {
        navigate("/simulator");
        onClose();
      },
    },
    {
      path: "/exam-centers",
      label: t("dashboard.nav.examCenters", "Imtihon markazlari"),
      icon: IconBuildingSkyscraper,
      action: () => {
        navigate("/exam-centers");
        onClose();
      },
    },
    {
      path: "/rules",
      label: t("dashboard.nav.rules", "YHQ Qoidalari"),
      icon: IconBook,
      action: () => {
        navigate("/rules");
        onClose();
      },
    },
    {
      path: "/penalties",
      label: t("dashboard.nav.penalties", "Jarimalar"),
      icon: IconGavel,
      action: () => {
        navigate("/penalties");
        onClose();
      },
    },
    {
      path: "/statistics",
      label: t("dashboard.nav.stats", "Statistika"),
      icon: IconChartBar,
      action: () => {
        navigate("/statistics");
        onClose();
      },
    },
    {
      path: "/saved-questions",
      label: t("dashboard.nav.saved", "Saqlanganlar"),
      icon: IconBookmark,
      action: () => {
        navigate("/saved-questions");
        onClose();
      },
    },
    {
      path: "/leaderboard",
      label: t("dashboard.nav.rating", "Reyting"),
      icon: IconTrophy,
      action: () => {
        navigate("/leaderboard");
        onClose();
      },
    },
    {
      path: "/settings",
      label: t("dashboard.nav.settings", "Sozlamalar"),
      icon: IconSettings,
      action: () => {
        navigate("/settings");
        onClose();
      },
    },
  ];

  return (
    <>
      {/* Backdrop for mobile drawer */}
      {isOpen && (
        <div
          className={styles.mobileDrawerOverlay}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        id="dashboard-sidebar"
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""} ${
          isCollapsed ? styles.sidebarCollapsed : ""
        }`}
        aria-label={t("dashboard.sidebarAria", "Asosiy navigatsiya")}
        onWheel={onWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {/* Mobile-only drawer top header bar with brand & close button */}
        <div className={styles.mobileDrawerHeader}>
          <div className={styles.mobileDrawerBrand}>
            <img
              src="/logo.svg"
              alt="Prava Online"
              className={styles.brandLogoImg}
              width={32}
              height={32}
            />
            <span className={styles.brandText}>
              PRAVA<span className={styles.brandAccent}>ONLINE</span>
            </span>
          </div>
          <button
            type="button"
            className={styles.mobileDrawerCloseBtn}
            onClick={onClose}
            aria-label={t("common.close", "Yopish")}
          >
            <IconX size={20} stroke={2.2} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className={styles.sidebarNav}>
          {navItems.map((item) => {
            const isActive =
              item.path === "/me"
                ? location.pathname === "/me"
                : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                type="button"
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                onClick={item.action}
                aria-current={isActive ? "page" : undefined}
                title={item.label}
              >
                <Icon size={20} className={styles.navIcon} stroke={isActive ? 2.2 : 1.8} />
                <span className={styles.navLabel}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Desktop Collapse Toggle at Bottom of Nav */}
        {onToggleCollapse && (
          <div className={styles.sidebarBottomToggleWrap}>
            <button
              type="button"
              className={styles.sidebarToggleBtn}
              onClick={onToggleCollapse}
              aria-label={
                isCollapsed
                  ? t("dashboard.expand", "Panelni ochish")
                  : t("dashboard.collapse", "Panelni yig'ish")
              }
              title={
                isCollapsed
                  ? t("dashboard.expand", "Panelni ochish")
                  : t("dashboard.collapse", "Panelni yig'ish")
              }
            >
              {isCollapsed ? (
                <IconLayoutSidebarLeftExpand size={19} stroke={2} />
              ) : (
                <>
                  <IconLayoutSidebarLeftCollapse size={19} stroke={2} />
                  <span className={styles.navLabel}>
                    {t("dashboard.collapse", "Panelni yig'ish")}
                  </span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Bottom Premium Area: Full Card or Collapsed Icon */}
        {isCollapsed ? (
          <div className={styles.sidebarCollapsedPremiumWrap}>
            <button
              type="button"
              className={styles.premiumCollapsedBtn}
              onClick={() => {
                navigate("/pricing");
                onClose();
              }}
              aria-label={t("dashboard.premium.title", "Premium imkoniyatlar")}
              title={t("dashboard.premium.title", "Premium imkoniyatlar")}
            >
              <IconCrown size={20} stroke={2.2} />
            </button>
          </div>
        ) : !isPremiumDismissed ? (
          <div
            className={styles.sidebarBottomCard}
            role="region"
            aria-label={t("dashboard.premium.title", "Premium imkoniyatlar")}
          >
            <button
              type="button"
              className={styles.premiumCloseBtn}
              onClick={handleDismissPremium}
              aria-label={t("dashboard.premium.close", "Yopish")}
              title={t("dashboard.premium.close", "Yopish")}
            >
              <IconX size={15} stroke={2.2} />
            </button>
            <div className={styles.premiumBadgeIcon}>
              <IconCrown size={18} stroke={2.2} />
            </div>
            <h4 className={styles.premiumCardTitle}>
              {t("dashboard.premium.title", "Premium imkoniyatlar")}
            </h4>
            <p className={styles.premiumCardDesc}>
              {t("dashboard.premium.desc", "Barcha funksiyalardan to'liq foydalaning!")}
            </p>
            <button
              type="button"
              className={styles.premiumCardBtn}
              onClick={() => {
                navigate("/pricing");
                onClose();
              }}
            >
              <span>{t("dashboard.premium.btn", "Premium olish →")}</span>
              <IconArrowRight size={14} stroke={2.5} />
            </button>
          </div>
        ) : (
          <div className={styles.sidebarReopenWrap}>
            <button
              type="button"
              className={styles.premiumReopenBtn}
              onClick={handleReopenPremium}
              aria-label={t("dashboard.premium.reopen", "Premium imkoniyatlar")}
              title={t("dashboard.premium.reopen", "Premium imkoniyatlar")}
            >
              <IconCrown size={16} className={styles.reopenCrownIcon} stroke={2.2} />
              <span>{t("dashboard.premium.title", "Premium")}</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
