import type { ComponentType, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconLock, IconLogin } from "@tabler/icons-react";
import { useAuth } from "../../auth/AuthContext";
import { useAuthModal } from "../../auth/AuthModalContext";

export interface GuestEmptyStateProps {
  /** Page header title (already translated). */
  pageTitle: string;
  /** Header icon. */
  icon?: ComponentType<{ size?: number; stroke?: number; color?: string }>;
  /** Empty-state heading (already translated). */
  title: string;
  /** Empty-state explanation (already translated). */
  description: string;
}

/**
 * Friendly guest view for pages that show per-user data (history, wrong answers, saved
 * questions, statistics). Offers a login CTA that returns to the current route after login.
 */
export function GuestEmptyState({ pageTitle, icon: Icon = IconLock, title, description }: GuestEmptyStateProps) {
  const { t } = useTranslation();
  const { openAuthModal } = useAuthModal();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="review-screen">
      <header className="review-header">
        <div className="review-header-title">
          <Icon size={20} stroke={2} color="var(--mantine-color-blue-5)" />
          <span>{pageTitle}</span>
        </div>
      </header>
      <main className="review-content">
        <div className="review-empty" role="status">
          <IconLock size={56} stroke={1.5} color="var(--mantine-color-blue-5)" aria-hidden />
          <h3>{title}</h3>
          <p>{description}</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 12 }}>
            <button
              type="button"
              className="saas-btn-primary"
              onClick={() => openAuthModal({ returnUrl: location.pathname + location.search })}
            >
              <IconLogin size={16} stroke={2} style={{ marginRight: 6, verticalAlign: "-3px" }} aria-hidden />
              {t("guest.loginCta")}
            </button>
            <button type="button" className="saas-btn-secondary" onClick={() => navigate("/tickets")}>
              {t("guest.browseTickets")}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

/** Renders `children` for signed-in users, otherwise the guest empty state. */
export function GuestGate({ children, ...props }: GuestEmptyStateProps & { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <GuestEmptyState {...props} />;
  return <>{children}</>;
}

export default GuestEmptyState;
