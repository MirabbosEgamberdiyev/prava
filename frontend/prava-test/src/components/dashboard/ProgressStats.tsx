import React from "react";
import { useTranslation } from "react-i18next";
import { IconBook2, IconCheck, IconChartBar } from "@tabler/icons-react";
import styles from "./Dashboard.module.css";

interface ProgressStatsProps {
  dailyDone: number;
  dailyTarget: number;
  dailyPercent: number;
  streakDays: number;
  qPracticed: number;
  qTotal: number;
  qPercent: number;
  readinessPercent: number;
  levelLabel: string;
  onNavigate: (route: string) => void;
}

export const ProgressStats: React.FC<ProgressStatsProps> = ({
  dailyDone,
  dailyTarget,
  dailyPercent,
  streakDays,
  qPracticed,
  qTotal,
  qPercent,
  readinessPercent,
  levelLabel,
  onNavigate,
}) => {
  const { t } = useTranslation();

  return (
    <section className={styles.progressGrid} aria-label={t("dashboard.metricsAria", "Metrikalar")}>
      {/* 1. Kunlik reja */}
      <article
        className={styles.progressCard}
        onClick={() => onNavigate("/statistics")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onNavigate("/statistics")}
      >
        <div className={styles.progressCardTop}>
          <div
            className={styles.progressIconBox}
            style={{ background: "linear-gradient(135deg, #fb923c 0%, #ea580c 100%)" }}
          >
            <IconBook2 size={22} stroke={2.2} />
          </div>
          <div className={styles.progressContent}>
            <div className={styles.progressValue}>
              {dailyDone} / {dailyTarget}
            </div>
            <div className={styles.progressLabel}>
              {t("dashboard.stats.dailyPlanTitle", "Kunlik reja (savol)")}
            </div>
          </div>
          <span className={styles.progressBadgePercent} style={{ color: "#ea580c" }}>
            {dailyPercent}%
          </span>
        </div>

        <div className={styles.progressBarTrack}>
          <div
            className={styles.progressBarFill}
            style={{
              width: `${Math.min(100, dailyPercent)}%`,
              backgroundColor: "#ea580c",
            }}
          />
        </div>

        <div className={styles.progressCardBottom}>
          <span style={{ color: "#ea580c", fontWeight: 700 }}>
            {dailyPercent >= 100
              ? `🔥 ${t("dashboard.stats.dailyPlanDone", "Ajoyib! Bugungi rejangiz to'liq bajarildi.")}`
              : `🔥 ${t("dashboard.stats.streakDays", { count: streakDays, defaultValue: `${streakDays} kunlik seriya` })}`}
          </span>
        </div>
      </article>

      {/* 2. Yechilgan savollar */}
      <article
        className={styles.progressCard}
        onClick={() => onNavigate("/statistics")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onNavigate("/statistics")}
      >
        <div className={styles.progressCardTop}>
          <div
            className={styles.progressIconBox}
            style={{ background: "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)" }}
          >
            <IconCheck size={22} stroke={2.5} />
          </div>
          <div className={styles.progressContent}>
            <div className={styles.progressValue}>
              {qPracticed} / {qTotal}
            </div>
            <div className={styles.progressLabel}>
              {t("dashboard.stats.solvedQuestionsTitle", "Yechilgan savollar")}
            </div>
          </div>
          <span className={styles.progressBadgePercent} style={{ color: "#0284c7" }}>
            {qPercent}%
          </span>
        </div>

        <div className={styles.progressBarTrack}>
          <div
            className={styles.progressBarFill}
            style={{
              width: `${Math.min(100, qPercent)}%`,
              backgroundColor: "#0284c7",
            }}
          />
        </div>

        <div className={styles.progressCardBottom}>
          <span>
            {t("dashboard.stats.solvedQuestionsFootnote", "Jami 1 190 ta rasmiy savoldan")}
          </span>
        </div>
      </article>

      {/* 3. Umumiy tayyorgarlik */}
      <article
        className={styles.progressCard}
        onClick={() => onNavigate("/statistics")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onNavigate("/statistics")}
      >
        <div className={styles.progressCardTop}>
          <div
            className={styles.progressIconBox}
            style={{ background: "linear-gradient(135deg, #34d399 0%, #059669 100%)" }}
          >
            <IconChartBar size={22} stroke={2.2} />
          </div>
          <div className={styles.progressContent}>
            <div className={styles.progressValue}>{readinessPercent}%</div>
            <div className={styles.progressLabel}>
              {t("dashboard.stats.overallReadinessTitle", "Umumiy tayyorgarlik")}
            </div>
          </div>
          <span
            className={styles.progressLevelBadge}
            style={{
              backgroundColor: "rgba(16, 185, 129, 0.14)",
              color: "#059669",
            }}
          >
            🏆 {levelLabel}
          </span>
        </div>

        <div className={styles.progressBarTrack}>
          <div
            className={styles.progressBarFill}
            style={{
              width: `${Math.min(100, readinessPercent)}%`,
              backgroundColor: "#059669",
            }}
          />
        </div>

        <div className={styles.progressCardBottom}>
          <span>
            {t(
              "dashboard.stats.readinessFootnote",
              "Muntazam amaliyot bilan natija yanada yaxshi bo'ladi."
            )}
          </span>
        </div>
      </article>
    </section>
  );
};
