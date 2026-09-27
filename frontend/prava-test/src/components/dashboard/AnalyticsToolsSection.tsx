import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  IconBookmark,
  IconChartBar,
  IconTrophy,
  IconCalendarEvent,
  IconChevronRight,
} from "@tabler/icons-react";
import styles from "./Dashboard.module.css";

interface AnalyticsToolsSectionProps {
  savedCount?: number;
  lastExamScore?: number | null;
}

export const AnalyticsToolsSection: React.FC<AnalyticsToolsSectionProps> = ({
  savedCount,
  lastExamScore,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const tools = [
    {
      id: "saved",
      title: t("dashboard.tools.savedTitle"),
      desc: t("dashboard.tools.savedDesc"),
      icon: IconBookmark,
      gradient: "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)",
      route: "/saved-questions",
      badge:
        savedCount != null && savedCount > 0
          ? t("dashboard.tools.savedCount", {
              count: savedCount,
            })
          : undefined,
    },
    {
      id: "stats",
      title: t("dashboard.tools.statsTitle"),
      desc: t("dashboard.tools.statsDesc"),
      icon: IconChartBar,
      gradient: "linear-gradient(135deg, #34d399 0%, #059669 100%)",
      route: "/statistics",
    },
    {
      id: "leaderboard",
      title: t("dashboard.tools.ratingTitle"),
      desc: t("dashboard.tools.ratingDesc"),
      icon: IconTrophy,
      gradient: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)",
      route: "/leaderboard",
    },
    {
      id: "history",
      title: t("dashboard.tools.historyTitle"),
      desc: t("dashboard.tools.historyDesc"),
      icon: IconCalendarEvent,
      gradient: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
      route: "/history",
      badge:
        lastExamScore != null
          ? t("dashboard.tools.lastScore", {
              score: lastExamScore,
            })
          : undefined,
    },
  ];

  return (
    <section
      className={styles.toolsSection}
      aria-label={t("dashboard.tools.title")}
    >
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>
          {t("dashboard.tools.title")}
        </h3>
        <p className={styles.sectionSubtitle}>
          {t(
            "dashboard.tools.subtitle"
          )}
        </p>
      </div>

      <div className={styles.toolsGrid}>
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <article
              key={tool.id}
              className={styles.toolCard}
              onClick={() => navigate(tool.route)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate(tool.route)}
            >
              <div className={styles.toolIconBox} style={{ background: tool.gradient }}>
                <Icon size={22} stroke={2} />
              </div>
              <div className={styles.toolInfo}>
                <h5 className={styles.toolTitle}>
                  <span>{tool.title}</span>
                  {tool.badge && <span className={styles.toolStatBadge}>{tool.badge}</span>}
                </h5>
                <p className={styles.toolDesc}>{tool.desc}</p>
              </div>
              <IconChevronRight size={18} className={styles.toolChevron} />
            </article>
          );
        })}
      </div>
    </section>
  );
};
