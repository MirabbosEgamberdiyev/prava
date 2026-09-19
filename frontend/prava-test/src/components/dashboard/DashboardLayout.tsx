import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../auth/AuthContext";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardFooter } from "./DashboardFooter";
import { DashboardSearchModal } from "./DashboardSearchModal";
import type { User } from "../../types";
import styles from "./Dashboard.module.css";

const EXAM_OPTIONS = [20, 40, 50, 60, 80, 100];

export interface DashboardContextValue {
  openExamPicker: () => void;
  openSearch: () => void;
  isSidebarCollapsed: boolean;
  toggleSidebarCollapse: () => void;
}

export const DashboardContext = React.createContext<DashboardContextValue>({
  openExamPicker: () => {},
  openSearch: () => {},
  isSidebarCollapsed: false,
  toggleSidebarCollapse: () => {},
});

export const useDashboard = () => React.useContext(DashboardContext);

interface DashboardLayoutProps {
  user?: User | null;
  displayName?: string;
  onLogout?: () => void;
  onOpenExamPicker?: () => void;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  user: propUser,
  displayName: propDisplayName,
  onLogout: propOnLogout,
  onOpenExamPicker: propOnOpenExamPicker,
  children,
}) => {
  const { user: authUser, logout: authLogout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();

  const user = propUser !== undefined ? propUser : authUser;
  const onLogout = propOnLogout || authLogout;

  const displayName = useMemo(() => {
    if (propDisplayName) return propDisplayName;
    if (user?.fullName && user.fullName.trim().length > 0) return user.fullName.trim();
    if (user?.firstName && user.firstName.trim().length > 0) return `${user.firstName} ${user.lastName || ""}`.trim();
    if (user?.phoneNumber) return user.phoneNumber;
    if (user?.email) return user.email;
    return "Haydovchi";
  }, [propDisplayName, user]);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return (
        typeof window !== "undefined" &&
        localStorage.getItem("sidebarCollapsed") === "true"
      );
    } catch {
      return false;
    }
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [internalExamPickerOpen, setInternalExamPickerOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sidebarCollapsed", String(next));
      } catch {}
      return next;
    });
  }, []);

  const handleOpenExamPicker = () => {
    if (propOnOpenExamPicker) {
      propOnOpenExamPicker();
    } else {
      setInternalExamPickerOpen(true);
    }
  };

  const handleStartExam = (count: number) => {
    setInternalExamPickerOpen(false);
    navigate(`/exam?count=${count}`);
  };

  // Scroll to top and close mobile drawer on route change
  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: "instant" });
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileSidebarOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isMobileSidebarOpen]);

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileSidebarOpen]);

  // Forward mouse wheel on sidebar to container when sidebar itself does not need internal scroll
  const handleSidebarWheel = (e: React.WheelEvent<HTMLElement>) => {
    const sidebar = e.currentTarget;
    const isScrollable = sidebar.scrollHeight > sidebar.clientHeight;
    if (!isScrollable && containerRef.current) {
      containerRef.current.scrollBy({ top: e.deltaY, behavior: "auto" });
    }
  };

  const contextValue = useMemo(
    () => ({
      openExamPicker: handleOpenExamPicker,
      openSearch: () => setIsSearchOpen(true),
      isSidebarCollapsed,
      toggleSidebarCollapse: handleToggleSidebarCollapse,
    }),
    [isSidebarCollapsed, handleToggleSidebarCollapse]
  );

  return (
    <DashboardContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className={styles.dashboardContainer}
        tabIndex={-1}
      >
        {/* 1. Fixed Header (Always visible at top: 0) */}
        <DashboardHeader
          user={user}
          displayName={displayName}
          onOpenSearch={() => setIsSearchOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebarCollapse={handleToggleSidebarCollapse}
          onLogout={onLogout}
        />

        {/* 2. Body: Fixed Sidebar + Main Content Column */}
        <div className={styles.bodyWrapper}>
          <DashboardSidebar
            isOpen={isMobileSidebarOpen}
            onClose={() => setIsMobileSidebarOpen(false)}
            onOpenExamPicker={handleOpenExamPicker}
            onWheel={handleSidebarWheel}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={handleToggleSidebarCollapse}
          />

          <div
            className={`${styles.mainColumn} ${
              isSidebarCollapsed ? styles.mainColumnCollapsed : ""
            }`}
          >
            <main className={styles.mainContent}>{children}</main>

            {/* 3. Enterprise Footer inside main column for zero sidebar overlap */}
            <DashboardFooter />
          </div>
        </div>

        {/* 4. Global Spotlight Search Modal */}
        <DashboardSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectExamPicker={handleOpenExamPicker}
      />

      {/* 5. Centralized Exam Question Count Picker Modal */}
      {internalExamPickerOpen && (
        <div
          className="modal-overlay"
          onClick={() => setInternalExamPickerOpen(false)}
        >
          <div
            className="modal-card exam-picker-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="modal-title">
              {t("dashboard.examQuestionCount", "Nechta savoldan imtihon?")}
            </h3>
            <div className="exam-picker-grid">
              {EXAM_OPTIONS.map((count) => (
                <button
                  key={count}
                  className="exam-picker-btn"
                  onClick={() => handleStartExam(count)}
                  type="button"
                >
                  <span className="exam-picker-num">{count}</span>
                  <span className="exam-picker-label">
                    {t("dashboard.questionsUnit", "savol")}
                  </span>
                  <span className="exam-picker-time">
                    {count} {t("dashboard.minutesUnit", "daq")}
                  </span>
                </button>
              ))}
            </div>
            <button
              className="modal-btn-cancel"
              onClick={() => setInternalExamPickerOpen(false)}
              type="button"
            >
              {t("dashboard.cancel", "Bekor qilish")}
            </button>
          </div>
        </div>
      )}
    </div>
  </DashboardContext.Provider>
);
};

