import React from "react";
import { IconArrowRight } from "@tabler/icons-react";
import styles from "./Dashboard.module.css";

export interface NextBestActionProps {
  badgeText: string;
  badgeBg?: string;
  badgeColor?: string;
  title: string;
  subtitle: string;
  statPill?: {
    icon?: React.ReactNode;
    text: string;
  };
  btnText: string;
  btnBg?: string;
  btnColor?: string;
  iconBoxBg: string;
  icon: React.ReactNode;
  onAction: () => void;
}

export const NextBestActionCard: React.FC<NextBestActionProps> = ({
  badgeText,
  badgeBg = "rgba(2, 132, 199, 0.12)",
  badgeColor = "#0284c7",
  title,
  subtitle,
  statPill,
  btnText,
  btnBg = "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
  btnColor = "#ffffff",
  iconBoxBg,
  icon,
  onAction,
}) => {
  return (
    <aside
      className={styles.nbaCard}
      aria-label={title}
      onClick={onAction}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onAction()}
    >
      <div className={styles.nbaContent}>
        <div className={styles.nbaBadgeRow}>
          <span
            className={styles.nbaBadge}
            style={{
              backgroundColor: badgeBg,
              color: badgeColor,
            }}
          >
            {badgeText}
          </span>

          {statPill && (
            <span className={styles.nbaStatPill}>
              {statPill.icon}
              <span>{statPill.text}</span>
            </span>
          )}
        </div>

        <h3 className={styles.nbaTitle}>{title}</h3>
        <p className={styles.nbaSubtitle}>{subtitle}</p>
      </div>

      <div className={styles.nbaActionWrap}>
        <div
          className={styles.nbaIconBox}
          style={{ background: iconBoxBg }}
          aria-hidden="true"
        >
          {icon}
        </div>

        <button
          type="button"
          className={styles.nbaBtn}
          style={{ background: btnBg, color: btnColor }}
          onClick={(e) => {
            e.stopPropagation();
            onAction();
          }}
        >
          <span>{btnText}</span>
          <IconArrowRight size={17} stroke={2.5} />
        </button>
      </div>
    </aside>
  );
};
