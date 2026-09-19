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

export const AnalyticsToolsSection: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const tools = [
    {
      id: "saved",
      title: t("dashboard.tools.savedTitle", "Saqlanganlar"),
      desc: t("dashboard.tools.savedDesc", "Xatcho'p qo'yilgan savollar"),
      icon: IconBookmark,
      gradient: "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)",
      route: "/saved-questions",
    },
    {
      id: "stats",
      title: t("dashboard.tools.statsTitle", "Statistika"),
      desc: t("dashboard.tools.statsDesc", "Batafsil o'rganish statistikasi"),
      icon: IconChartBar,
      gradient: "linear-gradient(135deg, #34d399 0%, #059669 100%)",
      route: "/statistics",
    },
    {
      id: "leaderboard",
      title: t("dashboard.tools.ratingTitle", "Reyting"),
      desc: t("dashboard.tools.ratingDesc", "O'quvchilar reytingidagi o'rningiz"),
      icon: IconTrophy,
      gradient: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)",
      route: "/leaderboard",
    },
    {
      id: "history",
      title: t("dashboard.tools.historyTitle", "Imtihon tarixi"),
      desc: t("dashboard.tools.historyDesc", "Avvalgi imtihon natijalari"),
      icon: IconCalendarEvent,
      gradient: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
      route: "/history",
    },
  ];

  return (
    <section
      className={styles.toolsSection}
      aria-label={t("dashboard.tools.title", "Tahlil va shaxsiy vositalar")}
    >
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>
          {t("dashboard.tools.title", "Tahlil va shaxsiy vositalar")}
        </h3>
        <p className={styles.sectionSubtitle}>
          {t(
            "dashboard.tools.subtitle",
            "Shaxsiy o'sish, natijalar va sinovlar monitoringi"
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
                <h5 className={styles.toolTitle}>{tool.title}</h5>
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
