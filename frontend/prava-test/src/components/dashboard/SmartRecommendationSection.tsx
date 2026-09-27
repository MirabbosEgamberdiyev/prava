import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  IconAlertTriangle,
  IconFlame,
  IconArrowRight,
  IconChevronRight,
  IconTargetArrow,
  IconCheck,
} from "@tabler/icons-react";
import styles from "./Dashboard.module.css";
import { useLanguage } from "../../context/LanguageContext";

interface WeakTopic {
  id: number;
  name: string;
  wrongCount: number;
}

interface SmartRecommendationSectionProps {
  weakTopics: WeakTopic[];
  totalWrongs: number;
  practicedCount?: number;
}

export const SmartRecommendationSection: React.FC<SmartRecommendationSectionProps> = ({
  weakTopics,
  totalWrongs,
  practicedCount = 0,
}) => {
  const { t } = useTranslation();
  const { localizeTopic } = useLanguage();
  const navigate = useNavigate();

  const handleFixMistakes = () => {
    if (totalWrongs > 0) {
      navigate("/wrong-exam");
    } else {
      navigate("/exam");
    }
  };

  const hasWeakTopics = weakTopics.length > 0;

  return (
    <section
      className={styles.smartSection}
      aria-label={t("dashboard.recommendation.title")}
    >
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>
          {t("dashboard.recommendation.title")}
        </h3>
        <p className={styles.sectionSubtitle}>
          {t(
            "dashboard.recommendation.subtitle"
          )}
        </p>
      </div>

      <div className={styles.smartSectionGrid}>
        {/* Left Column: Weak Topics List or Honest Empty/Mastery State */}
        <div className={styles.weakTopicsCard}>
          <div className={styles.weakTopicsHeader}>
            <span className={styles.weakBadge}>
              <IconAlertTriangle size={13} stroke={2.5} />
              <span>{t("dashboard.recommendation.weakTopicsBadge")}</span>
            </span>

            <button
              type="button"
              className={styles.weakViewAllLink}
              onClick={() => navigate("/topics")}
            >
              <span>{t("dashboard.recommendation.viewAllLink")}</span>
              <IconArrowRight size={14} stroke={2.5} />
            </button>
          </div>

          <h4 className={styles.weakTopicsTitle}>
            {t("dashboard.recommendation.weakTopicsTitle")}
          </h4>

          {hasWeakTopics ? (
            <div className={styles.weakTopicList}>
              {weakTopics.slice(0, 5).map((topic, index) => (
                <button
                  key={topic.id}
                  type="button"
                  className={styles.weakTopicItem}
                  onClick={() => navigate(`/marafon?topicId=${topic.id}`)}
                >
                  <span className={styles.weakTopicNum}>{index + 1}</span>
                  <span className={styles.weakTopicName}>
                    {localizeTopic({ id: topic.id, name: topic.name }) || topic.name}
                  </span>
                  <span className={styles.weakTopicMistakes}>
                    {t("dashboard.recommendation.mistakesCount", {
                      count: topic.wrongCount,
                    })}
                  </span>
                  <IconChevronRight size={15} className={styles.weakTopicArrow} />
                </button>
              ))}
            </div>
          ) : practicedCount === 0 ? (
            /* New user with 0 practice - honest diagnostic onboarding */
            <div className={styles.weakEmptyBox}>
              <div className={styles.weakEmptyIcon}>
                <IconTargetArrow size={24} stroke={2} />
              </div>
              <h5 className={styles.weakEmptyTitle}>
                {t("dashboard.recommendation.diagnosticEmptyTitle")}
              </h5>
              <p className={styles.weakEmptyDesc}>
                {t(
                  "dashboard.recommendation.diagnosticEmptyDesc"
                )}
              </p>
              <button
                type="button"
                className={styles.weakEmptyBtn}
                onClick={() => navigate("/exam")}
              >
                <span>{t("dashboard.recommendation.startDiagnosticBtn")}</span>
              </button>
            </div>
          ) : (
            /* Experienced user with 0 mistakes - Mastery celebration */
            <div className={styles.weakEmptyBox}>
              <div
                className={styles.weakEmptyIcon}
                style={{ background: "rgba(16, 185, 129, 0.12)", color: "#059669" }}
              >
                <IconCheck size={24} stroke={2.5} />
              </div>
              <h5 className={styles.weakEmptyTitle}>
                {t("dashboard.recommendation.masteryTitle")}
              </h5>
              <p className={styles.weakEmptyDesc}>
                {t(
                  "dashboard.recommendation.masteryDesc"
                )}
              </p>
              <button
                type="button"
                className={styles.weakEmptyBtn}
                style={{ background: "#059669" }}
                onClick={() => navigate("/exam")}
              >
                <span>{t("dashboard.recommendation.startMockExamBtn")}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Stacked Cards */}
        <div className={styles.smartRightStack}>
          {/* Card 1: Red Error Correction Card */}
          <div className={styles.errorCorrectionCard}>
            <div className={styles.errorCardHeader}>
              <div>
                <span className={styles.errorBadge}>
                  <IconFlame size={12} stroke={2.5} />
                  <span>{t("dashboard.recommendation.quickFixBadge")}</span>
                </span>
                <h4 className={styles.errorTitle}>
                  {totalWrongs > 0
                    ? `${totalWrongs} ${t("dashboard.recommendation.mistakesTitle")}`
                    : t("dashboard.recommendation.noMistakesYet")}
                </h4>
                <p className={styles.errorDesc}>
                  {totalWrongs > 0
                    ? t(
                        "dashboard.recommendation.mistakesDesc"
                      )
                    : t(
                        "dashboard.recommendation.noMistakesDesc"
                      )}
                </p>
              </div>

              {/* Exam document graphic */}
              <div className={styles.errorDocGraphic}>
                <div className={styles.errorCrossCircle}>✕</div>
                <div
                  style={{
                    width: 32,
                    height: 4,
                    backgroundColor: "rgba(239, 68, 68, 0.2)",
                    borderRadius: 2,
                  }}
                />
                <div
                  style={{
                    width: 24,
                    height: 4,
                    backgroundColor: "rgba(239, 68, 68, 0.2)",
                    borderRadius: 2,
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              className={styles.errorCorrectionBtn}
              onClick={handleFixMistakes}
            >
              <span>
                {totalWrongs > 0
                  ? t("dashboard.recommendation.fixMistakesBtn")
                  : t("dashboard.recommendation.startExamBtn")}
              </span>
              <IconArrowRight size={16} stroke={2.5} />
            </button>
          </div>

          {/* Card 2: Goal Target Card */}
          <div
            className={styles.goalTargetCard}
            onClick={() => navigate("/statistics")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate("/statistics")}
          >
            <div className={styles.goalIconBox}>
              <IconTargetArrow size={22} stroke={2.2} />
            </div>
            <div className={styles.goalInfo}>
              <h5 className={styles.goalTitle}>
                {t("dashboard.recommendation.goalTitle")}
              </h5>
              <p className={styles.goalDesc}>
                {t(
                  "dashboard.recommendation.goalDesc"
                )}
              </p>
            </div>
            <IconChevronRight size={18} color="var(--text-muted)" />
          </div>
        </div>
      </div>
    </section>
  );
};
