import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  IconBook2,
  IconTicket,
  IconRun,
  IconPencil,
  IconArrowRight,
  IconSparkles,
} from "@tabler/icons-react";
import { getCachedTotalTickets, getCachedTotalQuestions } from "../../services/desktopAdapter";
import styles from "./Dashboard.module.css";

interface LearningModesSectionProps {
  onOpenExamPicker: () => void;
  totalTickets?: number;
  totalQuestions?: number;
  ticketsSolvedCount?: number;
  topicsLearnedCount?: number;
  totalTopicsCount?: number;
  marathonCurrentIndex?: number;
  lastExamScore?: number | null;
}

export const LearningModesSection: React.FC<LearningModesSectionProps> = ({
  onOpenExamPicker,
  totalTickets,
  totalQuestions,
  ticketsSolvedCount = 0,
  topicsLearnedCount = 0,
  totalTopicsCount = 44,
  marathonCurrentIndex = 0,
  lastExamScore,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const ticketsCount = totalTickets || getCachedTotalTickets() || 63;
  const questionsCount = totalQuestions || getCachedTotalQuestions() || 1234;

  return (
    <section
      className={styles.modesSection}
      aria-label={t("dashboard.modes.title", "Asosiy ta'lim rejimlari")}
    >
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>
          {t("dashboard.modes.title", "Asosiy ta'lim rejimlari")}
        </h3>
        <p className={styles.sectionSubtitle}>
          {t(
            "dashboard.modes.subtitle",
            "Maqsadingizga eng mos rejimni tanlang va bilim oling"
          )}
        </p>
      </div>

      <div className={styles.modesGrid}>
        {/* Mode 1: Mavzular */}
        <article
          className={styles.modeCard}
          style={{ "--mode-accent": "#0284c7" } as React.CSSProperties}
          onClick={() => navigate("/topics")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate("/topics")}
        >
          {topicsLearnedCount > 0 ? (
            <span className={styles.modeProgressChip}>
              {t("dashboard.modes.topicsChip", {
                done: topicsLearnedCount,
                total: totalTopicsCount,
                defaultValue: `${topicsLearnedCount}/${totalTopicsCount} mavzu`,
              })}
            </span>
          ) : (
            <span className={styles.modeBadgeRecommended}>
              <IconSparkles size={11} stroke={2.5} />
              {t("dashboard.modes.recommended", "TAVSIYA ETILADI")}
            </span>
          )}

          <div>
            <div
              className={styles.modeIconBox}
              style={{ background: "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)" }}
            >
              <IconBook2 size={24} stroke={2} />
            </div>
            <h4 className={styles.modeTitle}>
              {t("dashboard.modes.topicsTitle", "Mavzular")}
            </h4>
            <p className={styles.modeDesc}>
              {t(
                "dashboard.modes.topicsDesc",
                "Nazariya va amaliy bilimlarni mavzular bo'yicha bosqichma-bosqich o'rganing."
              )}
            </p>
          </div>

          <button
            type="button"
            className={styles.modeActionRow}
            onClick={(e) => {
              e.stopPropagation();
              navigate("/topics");
            }}
          >
            <span>{t("dashboard.modes.startBtn", "Boshlash")}</span>
            <IconArrowRight size={15} stroke={2.5} />
          </button>
        </article>

        {/* Mode 2: Biletlar */}
        <article
          className={styles.modeCard}
          style={{ "--mode-accent": "#059669" } as React.CSSProperties}
          onClick={() => navigate("/tickets")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate("/tickets")}
        >
          {ticketsSolvedCount > 0 && (
            <span className={styles.modeProgressChip}>
              {t("dashboard.modes.ticketsChip", {
                done: ticketsSolvedCount,
                total: ticketsCount,
                defaultValue: `${ticketsSolvedCount}/${ticketsCount} bilet`,
              })}
            </span>
          )}

          <div>
            <div
              className={styles.modeIconBox}
              style={{ background: "linear-gradient(135deg, #34d399 0%, #059669 100%)" }}
            >
              <IconTicket size={24} stroke={2} />
            </div>
            <h4 className={styles.modeTitle}>
              {t("dashboard.modes.ticketsTitle", "Biletlar")}
            </h4>
            <p className={styles.modeDesc}>
              {t(
                "dashboard.modes.ticketsDesc",
                "1 dan {{count}} gacha rasmiy biletlar bilan o'zingizni sinab ko'ring.",
                { count: ticketsCount }
              )}
            </p>
          </div>

          <button
            type="button"
            className={styles.modeActionRow}
            onClick={(e) => {
              e.stopPropagation();
              navigate("/tickets");
            }}
          >
            <span>{t("dashboard.modes.startBtn", "Boshlash")}</span>
            <IconArrowRight size={15} stroke={2.5} />
          </button>
        </article>

        {/* Mode 3: Marafon (Featured Purple) */}
        <article
          className={`${styles.modeCard} ${styles.modeCardFeatured}`}
          style={{ "--mode-accent": "#8b5cf6" } as React.CSSProperties}
          onClick={() => navigate("/marafon")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate("/marafon")}
        >
          {marathonCurrentIndex > 0 && (
            <span
              className={styles.modeProgressChip}
              style={{
                backgroundColor: "rgba(139, 92, 246, 0.2)",
                borderColor: "#a78bfa",
                color: "#ede9fe",
              }}
            >
              {t("dashboard.modes.marathonChip", {
                current: marathonCurrentIndex,
                total: questionsCount,
                defaultValue: `${marathonCurrentIndex}/${questionsCount} savol`,
              })}
            </span>
          )}

          <div>
            <div
              className={styles.modeIconBox}
              style={{ background: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)" }}
            >
              <IconRun size={24} stroke={2} />
            </div>
            <h4 className={styles.modeTitle}>
              {t("dashboard.modes.marathonTitle", "Marafon")}
            </h4>
            <p className={styles.modeDesc}>
              {t(
                "dashboard.modes.marathonDesc",
                "Barcha {{count}} ta savol ketma-ket. Tayyorgarligingizni maksimal darajada sinang.",
                { count: questionsCount }
              )}
            </p>
          </div>

          <button
            type="button"
            className={styles.modeActionRow}
            onClick={(e) => {
              e.stopPropagation();
              navigate("/marafon");
            }}
          >
            <span>{t("dashboard.modes.startBtn", "Boshlash")}</span>
            <IconArrowRight size={15} stroke={2.5} />
          </button>
        </article>

        {/* Mode 4: Haqiqiy imtihon */}
        <article
          className={styles.modeCard}
          style={{ "--mode-accent": "#ea580c" } as React.CSSProperties}
          onClick={onOpenExamPicker}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpenExamPicker()}
        >
          {lastExamScore != null && (
            <span className={styles.modeProgressChip}>
              {t("dashboard.modes.examChip", {
                score: lastExamScore,
                defaultValue: `Oxirgi: ${lastExamScore}%`,
              })}
            </span>
          )}

          <div>
            <div
              className={styles.modeIconBox}
              style={{ background: "linear-gradient(135deg, #fb923c 0%, #ea580c 100%)" }}
            >
              <IconPencil size={24} stroke={2} />
            </div>
            <h4 className={styles.modeTitle}>
              {t("dashboard.modes.examTitle", "Haqiqiy imtihon")}
            </h4>
            <p className={styles.modeDesc}>
              {t(
                "dashboard.modes.examDesc",
                "Vaqt cheklangan rasmiy DTM test simulyatori."
              )}
            </p>
          </div>

          <button
            type="button"
            className={styles.modeActionRow}
            onClick={(e) => {
              e.stopPropagation();
              onOpenExamPicker();
            }}
          >
            <span>{t("dashboard.modes.startBtn", "Boshlash")}</span>
            <IconArrowRight size={15} stroke={2.5} />
          </button>
        </article>
      </div>
    </section>
  );
};
