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
  IconFlame,
} from "@tabler/icons-react";
import { useCurriculumCounts } from "../../hooks/useCurriculumCounts";
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
  const curriculum = useCurriculumCounts();
  // W-10: faqat serverdan kelgan raqamlar; noma'lum (0) bo'lsa raqamsiz matn ko'rsatiladi.
  const ticketsCount = totalTickets || curriculum.tickets;
  const questionsCount = totalQuestions || curriculum.questions;

  return (
    <section
      className={styles.modesSection}
      aria-label={t("dashboard.modes.title")}
    >
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>
          {t("dashboard.modes.title")}
        </h3>
        <p className={styles.sectionSubtitle}>
          {t(
            "dashboard.modes.subtitle"
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
              })}
            </span>
          ) : (
            <span className={styles.modeBadgeRecommended}>
              <IconSparkles size={11} stroke={2.5} />
              {t("dashboard.modes.recommended")}
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
              {t("dashboard.modes.topicsTitle")}
            </h4>
            <p className={styles.modeDesc}>
              {t(
                "dashboard.modes.topicsDesc"
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
            <span>{t("dashboard.modes.startBtn")}</span>
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
          {ticketsSolvedCount > 0 && ticketsCount > 0 && (
            <span className={styles.modeProgressChip}>
              {t("dashboard.modes.ticketsChip", {
                done: ticketsSolvedCount,
                total: ticketsCount,
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
              {t("dashboard.modes.ticketsTitle")}
            </h4>
            <p className={styles.modeDesc}>
              {ticketsCount > 0
                ? t(
                    "dashboard.modes.ticketsDesc",
                    { count: ticketsCount }
                  )
                : t("dashboard.modes.ticketsDescNoCount")}
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
            <span>{t("dashboard.modes.startBtn")}</span>
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
          {marathonCurrentIndex > 0 && questionsCount > 0 && (
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
              {t("dashboard.modes.marathonTitle")}
            </h4>
            <p className={styles.modeDesc}>
              {questionsCount > 0
                ? t(
                    "dashboard.modes.marathonDesc",
                    { count: questionsCount }
                  )
                : t("dashboard.modes.marathonDescNoCount")}
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
            <span>{t("dashboard.modes.startBtn")}</span>
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
              {t("dashboard.modes.examTitle")}
            </h4>
            <p className={styles.modeDesc}>
              {t(
                "dashboard.modes.examDesc"
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
            <span>{t("dashboard.modes.startBtn")}</span>
            <IconArrowRight size={15} stroke={2.5} />
          </button>
        </article>

        {/* Mode 5: Xatogacha marafon (Survival) — to'liq kenglikdagi karta */}
        <article
          className={styles.modeCard}
          style={{ "--mode-accent": "#dc2626", gridColumn: "1 / -1", minHeight: 0 } as React.CSSProperties}
          onClick={() => navigate("/survival")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate("/survival")}
        >
          <div>
            <div
              className={styles.modeIconBox}
              style={{ background: "linear-gradient(135deg, #fb923c 0%, #dc2626 100%)" }}
            >
              <IconFlame size={24} stroke={2} />
            </div>
            <h4 className={styles.modeTitle}>{t("dashboard.modes.survivalTitle")}</h4>
            <p className={styles.modeDesc}>{t("dashboard.modes.survivalDesc")}</p>
          </div>

          <button
            type="button"
            className={styles.modeActionRow}
            style={{ maxWidth: 320 }}
            onClick={(e) => {
              e.stopPropagation();
              navigate("/survival");
            }}
          >
            <span>{t("dashboard.modes.startBtn")}</span>
            <IconArrowRight size={15} stroke={2.5} />
          </button>
        </article>
      </div>
    </section>
  );
};
