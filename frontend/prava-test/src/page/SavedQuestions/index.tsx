import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import type { SavedQuestionEntry } from "../../types/desktop";
import {
  getSavedQuestions,
  toggleSavedQuestion,
  parseOptions,
  localizeQ,
  localizeOpt,
  localizeExp,
} from "../../services/desktopAdapter";
import {
  IconBookmark,
  IconBookmarkOff,
  IconCheck,
  IconX,
  IconBulb,
} from "@tabler/icons-react";
import ImageZoomModal, { ZoomableImage } from "../../components/common/ImageZoomModal";
import SEO from "../../components/common/SEO";
import styles from "../../components/dashboard/Dashboard.module.css";

export default function SavedQuestions_Page() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id ? Number(user.id) : 1;

  const [entries, setEntries] = useState<SavedQuestionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);

  const loadData = () => {
    getSavedQuestions(userId)
      .then((data) => setEntries(Array.isArray(data) ? data.filter((e) => e && e.question) : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    const onStorage = () => loadData();
    window.addEventListener("prava-storage-changed", onStorage);
    return () => window.removeEventListener("prava-storage-changed", onStorage);
  }, [userId]);

  const handleRemove = async (questionId: number) => {
    await toggleSavedQuestion(userId, questionId).catch(() => {});
    setEntries((prev) => prev.filter((e) => e?.question?.id !== questionId));
  };

  return (
    <>
      <SEO
        title={t("seo.savedQuestions.title", "Saqlangan savollar")}
        description={t("seo.savedQuestions.desc", "Belgilangan muhim savollar ro'yxati.")}
        canonical="/saved-questions"
        noIndex={true}
      />
      {/* Page Header */}
        <div className={styles.innerPageHeader}>
          <div className={styles.innerPageHeaderLeft}>
            <div className={styles.innerPageTitleRow}>
              <h1 className={styles.innerPageTitle}>{t("saved.title", "Saqlangan savollar")}</h1>
              {!loading && entries.length > 0 && (
                <span className={styles.innerPageCountChip}>
                  {entries.length} {t("common.questions", "savol")}
                </span>
              )}
            </div>
            <p className={styles.innerPageSubtitle}>
              {t(
                "saved.subtitle",
                "O'rganish davomida xatcho'p qo'yilgan muhim va takrorlash kerak bo'lgan savollar."
              )}
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 960, width: "100%", margin: "0 auto" }}>
          {loading ? (
            <div className="loading-screen" style={{ minHeight: 320 }}>
              <div className="spinner" />
              <p style={{ marginTop: 12, color: "var(--text-muted)", fontSize: 14 }}>
                {t("common.loading", "Savollar yuklanmoqda...")}
              </p>
            </div>
          ) : entries.length === 0 ? (
            <div className="review-empty" style={{ padding: "60px 20px" }}>
              <IconBookmark size={56} stroke={1.5} color="var(--primary)" />
              <h3>{t("saved.emptyTitle", "Saqlangan savollar yo'q")}</h3>
              <p style={{ maxWidth: 420, margin: "0 auto", color: "var(--text-muted)", fontSize: 14 }}>
                {t(
                  "saved.emptyDesc",
                  "Testlar yoki biletlarni yechayotganda eslab qolish kerak bo'lgan savollarni xatcho'p orqali saqlang."
                )}
              </p>
              <button
                type="button"
                className="saas-btn-primary"
                onClick={() => navigate("/tickets")}
                style={{ marginTop: 16 }}
              >
                {t("nav.tickets", "Biletlarni ko'rish")}
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
                    >
                      <div className="review-card-badge saved-badge">
                        <IconBookmark size={14} stroke={2} />
                      </div>
                      <p className="review-card-text">{localizeQ(q)}</p>
                      <button
                        className="review-remove-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(q.id);
                        }}
                        title={t("saved.remove", "Saqlangandan o'chirish")}
                        type="button"
                      >
                        <IconBookmarkOff size={14} stroke={2} />
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
                                {t("exam.explanation", "Izoh")}:
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
        {zoomSrc && <ImageZoomModal src={zoomSrc} onClose={() => setZoomSrc(null)} />}
    </>
  );
}
