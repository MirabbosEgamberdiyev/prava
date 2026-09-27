import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { scopedUserId } from "../../utils/userScope";
import { reportError } from "../../utils/monitoring";
import type { WrongAnswerEntry } from "../../types/desktop";
import {
  getWrongAnswers,
  removeWrongAnswer,
  parseOptions,
  localizeQ,
  localizeOpt,
  localizeExp,
} from "../../services/desktopAdapter";
import {
  IconTrash,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconPlayerPlay,
  IconBulb,
} from "@tabler/icons-react";
import ImageZoomModal, { ZoomableImage } from "../../components/common/ImageZoomModal";
import SEO from "../../components/common/SEO";
import styles from "../../components/dashboard/Dashboard.module.css";

export default function WrongAnswers_Page() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = scopedUserId(user);

  const [entries, setEntries] = useState<WrongAnswerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);

  const loadData = useCallback(() => {
    getWrongAnswers(userId)
      .then((data) => setEntries(Array.isArray(data) ? data.filter((e) => e && e.question) : []))
      .catch((err: unknown) => reportError("wrongAnswers.load", err))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    loadData();
    const onStorage = () => loadData();
    window.addEventListener("prava-storage-changed", onStorage);
    return () => window.removeEventListener("prava-storage-changed", onStorage);
  }, [loadData]);

  const handleRemove = async (questionId: number) => {
    await removeWrongAnswer(userId, questionId).catch((err: unknown) => reportError("wrongAnswers.remove", err));
    setEntries((prev) => prev.filter((e) => e?.question?.id !== questionId));
  };

  const onStartPractice = () => navigate("/wrong-exam");

  return (
    <>
      <SEO
        title={t("seo.wrongAnswers.title")}
        description={t("seo.wrongAnswers.desc")}
        canonical="/wrong-answers"
        noIndex={true}
      />
      {/* Page Header */}
        <div className={styles.innerPageHeader}>
          <div className={styles.innerPageHeaderLeft}>
            <div className={styles.innerPageTitleRow}>
              <h1 className={styles.innerPageTitle}>
                <IconAlertTriangle
                  size={24}
                  stroke={2}
                  style={{ color: "#e03131", verticalAlign: "middle", marginRight: 8 }}
                />
                {t("wrongAnswers.title")}
              </h1>
              {!loading && entries.length > 0 && (
                <span
                  className={styles.innerPageCountChip}
                  style={{ background: "rgba(224, 49, 49, 0.12)", color: "#e03131" }}
                >
                  {entries.length} {t("common.questions")}
                </span>
              )}
            </div>
            <p className={styles.innerPageSubtitle}>
              {t(
                "wrongAnswers.subtitle"
              )}
            </p>
          </div>

          {entries.length > 0 && (
            <div className={styles.innerPageActions}>
              <button
                className="saas-btn-primary"
                onClick={onStartPractice}
                type="button"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 20px",
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                <IconPlayerPlay size={16} stroke={2.2} />
                {t("wrongAnswers.practice")}
              </button>
            </div>
          )}
        </div>

        {/* Content Container */}
        <div style={{ maxWidth: 960, width: "100%", margin: "0 auto" }}>
          {loading ? (
            <div className="loading-screen" style={{ minHeight: 320 }}>
              <div className="spinner" />
              <p style={{ marginTop: 12, color: "var(--text-muted)", fontSize: 14 }}>
                {t("common.loading")}
              </p>
            </div>
          ) : entries.length === 0 ? (
            <div className="review-empty" style={{ padding: "60px 20px" }}>
              <IconCheck size={56} stroke={1.5} color="#2f9e44" />
              <h3 style={{ marginTop: 16 }}>{t("wrongAnswers.emptyTitle")}</h3>
              <p style={{ maxWidth: 460, margin: "8px auto 0", color: "var(--text-muted)", fontSize: 14 }}>
                {t(
                  "wrongAnswers.emptySub"
                )}
              </p>
              <button
                type="button"
                className="saas-btn-primary"
                onClick={() => navigate("/tickets")}
                style={{ marginTop: 20 }}
              >
                {t("home.biletlar")}
              </button>
            </div>
          ) : (
            <div className="review-list">
              {entries.map((entry) => {
                const q = entry.question;
                const opts = parseOptions(q.options_json);
                const isOpen = expanded === q.id;
                return (
                  <div key={q.id} className={`review-card ${isOpen ? "open" : ""}`}>
                    <div
                      className="review-card-top"
                      onClick={() => setExpanded(isOpen ? null : q.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setExpanded(isOpen ? null : q.id);
                        }
                      }}
                    >
                      <div className="review-card-badge wrong-badge">
                        {entry.wrong_count}✕
                      </div>
                      <p className="review-card-text">{localizeQ(q)}</p>
                      <button
                        className="review-remove-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(q.id);
                        }}
                        title={t("wrongAnswers.remove")}
                        type="button"
                        aria-label={t("wrongAnswers.remove")}
                      >
                        <IconTrash size={14} stroke={2} />
                      </button>
                    </div>
                    {isOpen && (
                      <div className="review-card-body">
                        <div className="review-card-options">
                          {opts.map((opt) => (
                            <div
                              key={opt.index}
                              className={`review-option ${
                                opt.index === q.correct_option ? "correct" : ""
                              }`}
                            >
                              {opt.index === q.correct_option ? (
                                <IconCheck size={14} stroke={2.5} />
                              ) : (
                                <IconX size={14} stroke={2.5} />
                              )}
                              {localizeOpt(opt)}
                            </div>
                          ))}
                        </div>
                        {q.image_path && (
                          <div className="review-card-img-wrap">
                            <ZoomableImage
                              path={q.image_path}
                              className="review-card-img"
                              onOpen={(src) => setZoomSrc(src)}
                            />
                          </div>
                        )}
                        {localizeExp(q) && (
                          <div className="quiz-explanation-wrap" style={{ marginTop: 10 }}>
                            <div className="quiz-explanation-text" style={{ display: "block" }}>
                              <strong>
                                <IconBulb size={15} style={{ verticalAlign: "middle", marginRight: 4 }} />
                                {t("exam.explanation")}:
                              </strong>{" "}
                              {localizeExp(q)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <ImageZoomModal src={zoomSrc} onClose={() => setZoomSrc(null)} />
    </>
  );
}
