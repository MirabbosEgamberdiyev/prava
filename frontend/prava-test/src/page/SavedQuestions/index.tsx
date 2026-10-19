import { resolveUserScopeId } from "@/utils/userScope";
import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Modal, Button } from "@mantine/core";
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
  IconArrowLeft,
  IconBookmark,
  IconBookmarkOff,
  IconTrash,
  IconCheck,
  IconX,
  IconBulb,
  IconSearch,
} from "@tabler/icons-react";
import ImageZoomModal, { ZoomableImage } from "../../components/common/ImageZoomModal";
import SEO from "../../components/common/SEO";
import { GuestGate } from "../../components/common/GuestEmptyState";
import { showToast } from "../../utils/notificationUtils";

function SavedQuestionsContent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = resolveUserScopeId(user);

  const [entries, setEntries] = useState<SavedQuestionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [clearModalOpen, setClearModalOpen] = useState(false);

  const toggleExpand = (qId: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) {
        next.delete(qId);
      } else {
        next.add(qId);
      }
      return next;
    });
  };

  const loadData = () => {
    getSavedQuestions(userId)
      .then((savedData) => {
        setEntries(Array.isArray(savedData) ? savedData.filter((e) => e && e.question) : []);
      })
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
    setEntries((prev) => prev.filter((e) => Number(e?.question?.id ?? (e?.question as any)?.questionId) !== questionId));
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.delete(questionId);
      return next;
    });
  };

  const handleClearAll = async () => {
    for (const entry of entries) {
      const qId = Number(entry?.question?.id ?? (entry?.question as any)?.questionId);
      if (qId) {
        await toggleSavedQuestion(userId, qId).catch(() => {});
      }
    }
    setEntries([]);
    setExpandedIds(new Set());
    setClearModalOpen(false);
    showToast({
      id: "clear-saved-success",
      title: t("common.success", "Tozalandi"),
      message: t("saved.clearedAll", "Barcha saqlangan savollar tozalandi"),
      color: "teal",
    });
  };

  const onBack = () => navigate("/me");

  // Filtered Entries based on search
  const filteredEntries = useMemo(() => {
    if (!search.trim()) return entries;
    const query = search.trim().toLowerCase();
    return entries.filter((e) => {
      const text = localizeQ(e.question).toLowerCase();
      return text.includes(query);
    });
  }, [entries, search]);

  return (
    <>
      <SEO
        title={t("saved.title", "Saqlangan savollar")}
        description={t("seo.savedDesc", "Muhim savollar va biletlarni tanlanganlar ro'yxatida saqlang va takrorlang.")}
        canonical="/saved-questions"
      />

      <div className="review-screen">
        <header className="review-header">
          <button className="review-back-btn" onClick={onBack} type="button">
            <IconArrowLeft size={18} stroke={2} />
            {t("common.back", "Orqaga")}
          </button>
          <div className="review-header-title">
            <IconBookmark size={20} stroke={2} color="#1971c2" />
            <span>{t("saved.title", "Saqlangan savollar")}</span>
          </div>

          {entries.length > 0 && (
            <div className="topics-search-wrap">
              <IconSearch size={15} className="topics-search-icon" />
              <input
                className="topics-search-input"
                placeholder={t("saved.searchPlaceholder", "Qidirish...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}

          <div className="review-header-count">
            {filteredEntries.length} {t("common.questions", "savol")}
          </div>

          {entries.length > 0 && (
            <button
              type="button"
              className="review-back-btn"
              style={{ color: "#e03131", borderColor: "rgba(224, 49, 49, 0.3)" }}
              onClick={() => setClearModalOpen(true)}
              title={t("saved.clearAll", "Barchasini tozalash")}
            >
              <IconTrash size={16} />
              {t("common.clear", "Tozalash")}
            </button>
          )}
        </header>

        <main className="review-content">
          {loading ? (
            <div className="loading-screen">
              <div className="spinner" />
            </div>
          ) : entries.length === 0 ? (
            <div className="review-empty">
              <IconBookmark size={56} stroke={1.5} color="#1971c2" />
              <h3>{t("saved.emptyTitle", "Hali saqlangan savollar yo'q")}</h3>
              <p>
                {t(
                  "saved.emptySub",
                  "Testlar yoki biletlar davomida istalgan savolni belgilar (bookmark) orqali saqlab qo'yishingiz mumkin."
                )}
              </p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="review-empty">
              <p>{t("saved.noFilterMatch", "Tanlangan qidiruv bo'yicha savol topilmadi.")}</p>
              <button className="review-back-btn" onClick={() => setSearch("")} type="button">
                {t("common.resetFilter", "Filtrni tozalash")}
              </button>
            </div>
          ) : (
            <div className="review-list">
              {filteredEntries.map((entry, idx) => {
                const q = entry.question;
                const qId = Number(q.id || (q as any).questionId || idx + 1);
                const opts = parseOptions(q.options_json);
                const isOpen = expandedIds.has(qId);
                const explanation = localizeExp(q);

                return (
                  <div key={qId} className={`review-card ${isOpen ? "open" : ""}`}>
                    <div className="review-card-top" onClick={() => toggleExpand(qId)}>
                      <div className="review-card-badge saved-badge">
                        <IconBookmark size={14} stroke={2} />
                      </div>
                      <p className="review-card-text">{localizeQ(q)}</p>
                      <button
                        type="button"
                        className="review-remove-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(qId);
                        }}
                        title={t("saved.remove", "Olib tashlash")}
                      >
                        <IconBookmarkOff size={14} stroke={2} />
                      </button>
                    </div>

                    {isOpen && (
                      <div className="review-card-body">
                        <div className="review-card-options">
                          {opts.map((opt, optIdx) => {
                            const isCorrect = (opt.index ?? optIdx) === q.correct_option;
                            return (
                              <div
                                key={opt.index ?? optIdx}
                                className={`review-option ${isCorrect ? "correct" : ""}`}
                              >
                                {isCorrect ? (
                                  <IconCheck size={14} stroke={2.5} />
                                ) : (
                                  <IconX size={14} stroke={2.5} />
                                )}
                                <span>{localizeOpt(opt)}</span>
                              </div>
                            );
                          })}

                          {explanation && (
                            <div
                              style={{
                                marginTop: 8,
                                padding: "10px 14px",
                                borderRadius: 8,
                                background: "rgba(31, 125, 211, 0.08)",
                                border: "1px solid rgba(31, 125, 211, 0.2)",
                                fontSize: 12.5,
                                color: "var(--text)",
                                lineHeight: 1.5,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  color: "var(--primary)",
                                  fontWeight: 700,
                                  marginBottom: 3,
                                }}
                              >
                                <IconBulb size={15} />
                                <span>{t("quiz.explanationTitle", "Qoida sharhi:")}</span>
                              </div>
                              <p style={{ margin: 0 }}>{explanation}</p>
                            </div>
                          )}
                        </div>

                        <div className="review-card-img-wrap">
                          <ZoomableImage
                            path={q.image_path || "/question-default.svg"}
                            className="review-card-img"
                            onOpen={(src) => setZoomSrc(src)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Clear All Confirmation Modal */}
        <Modal
          opened={clearModalOpen}
          onClose={() => setClearModalOpen(false)}
          title={t("saved.confirmClearTitle", "Tanlanganlarni tozalash")}
          centered
          radius="md"
        >
          <div style={{ padding: "8px 0" }}>
            <p style={{ fontSize: 14, color: "var(--text)", margin: "0 0 20px" }}>
              {t("saved.confirmClearMsg", "Haqiqatan ham barcha saqlangan savollarni tozalab tashlamoqchimisiz?")}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <Button variant="default" onClick={() => setClearModalOpen(false)}>
                {t("common.cancel", "Bekor qilish")}
              </Button>
              <Button color="red" onClick={handleClearAll}>
                {t("common.delete", "Tozalash")}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Image Zoom Modal */}
        {zoomSrc && (
          <ImageZoomModal
            onClose={() => setZoomSrc(null)}
            src={zoomSrc}
          />
        )}
      </div>
    </>
  );
}

export default function SavedQuestions_Page() {
  const { t } = useTranslation();
  return (
    <GuestGate
      pageTitle={t("saved.title", "Tanlangan savollar")}
      title={t("saved.title", "Tanlangan savollar")}
      description={t("saved.guestDesc", "Savollarni saqlash va ko'rish uchun tizimga kiring")}
    >
      <SavedQuestionsContent />
    </GuestGate>
  );
}
