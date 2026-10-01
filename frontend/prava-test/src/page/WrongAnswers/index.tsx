import { resolveUserScopeId } from "@/utils/userScope";
import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Modal, Button } from "@mantine/core";
import { useAuth } from "../../auth/AuthContext";
import type { WrongAnswerEntry, OfflineTopic } from "../../types/desktop";
import {
  getWrongAnswers,
  removeWrongAnswer,
  parseOptions,
  localizeQ,
  localizeOpt,
  localizeExp,
  getTopics,
  localizeTopic,
} from "../../services/desktopAdapter";
import {
  IconArrowLeft,
  IconTrash,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconPlayerPlay,
  IconBulb,
  IconSearch,
  IconChevronRight,
  IconChevronDown,
} from "@tabler/icons-react";
import ImageZoomModal, { ZoomableImage } from "../../components/common/ImageZoomModal";
import SEO from "../../components/common/SEO";
import { GuestGate } from "../../components/common/GuestEmptyState";
import { showToast } from "../../utils/notificationUtils";

const BADGE_COLORS = [
  "linear-gradient(135deg, #0284c7, #2563eb)",
  "linear-gradient(135deg, #8b5cf6, #7c3aed)",
  "linear-gradient(135deg, #10b981, #059669)",
  "linear-gradient(135deg, #f59e0b, #d97706)",
  "linear-gradient(135deg, #ef4444, #dc2626)",
  "linear-gradient(135deg, #06b6d4, #0891b2)",
];

function WrongAnswersContent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = resolveUserScopeId(user);

  const [entries, setEntries] = useState<WrongAnswerEntry[]>([]);
  const [topics, setTopics] = useState<OfflineTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "byTopic">("all");
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
    getWrongAnswers(userId)
      .then((wrongData) => {
        setEntries(Array.isArray(wrongData) ? wrongData.filter((e) => e && e.question) : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    getTopics().then((data) => setTopics(Array.isArray(data) ? data : [])).catch(() => {});
    const onStorage = () => loadData();
    window.addEventListener("prava-storage-changed", onStorage);
    return () => window.removeEventListener("prava-storage-changed", onStorage);
  }, [userId]);

  const handleRemove = async (questionId: number) => {
    await removeWrongAnswer(userId, questionId).catch(() => {});
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
        await removeWrongAnswer(userId, qId).catch(() => {});
      }
    }
    setEntries([]);
    setExpandedIds(new Set());
    setClearModalOpen(false);
    showToast({
      id: "clear-wrong-success",
      title: t("common.success", "Tozalandi"),
      message: t("wrongAnswers.clearedAll", "Xatolar ro'yxati muvaffaqiyatli tozalandi"),
      color: "teal",
    });
  };

  const onBack = () => navigate("/me");
  const onStartPractice = () => navigate("/wrong-exam");

  // Topic lookup map
  const topicMap = useMemo(() => {
    const map = new Map<number, OfflineTopic>();
    for (const tp of topics) {
      map.set(tp.id, tp);
    }
    return map;
  }, [topics]);

  // Filtered entries based on search
  const filteredEntries = useMemo(() => {
    if (!search.trim()) return entries;
    const query = search.trim().toLowerCase();
    return entries.filter((e) => {
      const text = localizeQ(e.question).toLowerCase();
      return text.includes(query);
    });
  }, [entries, search]);

  // Group wrong answers by topic for Screen 9 "Mavzular bo'yicha" tab
  const topicGroups = useMemo(() => {
    const groups: { topicId: number | null; topicName: string; count: number; entries: WrongAnswerEntry[] }[] = [];
    const groupMap = new Map<number | null, WrongAnswerEntry[]>();

    for (const entry of entries) {
      const tid = entry.question?.topic_id ?? null;
      const list = groupMap.get(tid) || [];
      list.push(entry);
      groupMap.set(tid, list);
    }

    for (const [tid, groupEntries] of groupMap.entries()) {
      let name = t("topics.general", "Umumiy mavzu");
      if (tid !== null && topicMap.has(tid)) {
        name = localizeTopic(topicMap.get(tid)!);
      }
      groups.push({
        topicId: tid,
        topicName: name,
        count: groupEntries.length,
        entries: groupEntries,
      });
    }

    // Sort by count descending
    return groups.sort((a, b) => b.count - a.count);
  }, [entries, topicMap, t]);

  return (
    <>
      <SEO
        title={`${t("wrongAnswers.title", "Xatolar ustida ishlash")} - Prava Online`}
        description={t("seo.wrongDesc", "Qilgan xatolaringizni tahlil qiling va takroriy xatolarni bartaraf eting.")}
        canonical="/wrong-answers"
      />

      <div className="ds-page-wrapper">
        <div className="ds-page-container" style={{ maxWidth: 760 }}>
          {/* Header */}
          <div className="ds-page-header">
            <div className="ds-header-left">
              <button
                type="button"
                className="ds-back-btn"
                onClick={onBack}
                aria-label={t("common.back", "Orqaga")}
              >
                <IconArrowLeft size={18} />
              </button>
              <div>
                <h1 className="ds-page-title">
                  {t("wrongAnswers.title", "Xatolar ustida ishlash")}
                </h1>
                <div className="ds-page-desc">
                  {t("wrongAnswers.subtitle", "Yo'l qo'yilgan xatolarni tahlil qiling va mustahkamlang")}
                </div>
              </div>
            </div>

            <div className="ds-header-actions">
              {entries.length > 0 && (
                <button
                  type="button"
                  className="ds-btn ds-btn-secondary"
                  style={{ color: "var(--g-danger)" }}
                  onClick={() => setClearModalOpen(true)}
                >
                  <IconTrash size={16} />
                  {t("common.clear", "Tozalash")}
                </button>
              )}
              {entries.length > 0 && (
                <button
                  type="button"
                  className="ds-btn ds-btn-primary"
                  onClick={onStartPractice}
                >
                  <IconPlayerPlay size={16} />
                  {t("wrongAnswers.practice", "Mashq qilish")}
                </button>
              )}
            </div>
          </div>

          {/* Tab Switcher Pills */}
          <div className="ds-tabs-row" role="tablist" style={{ marginBottom: 20 }}>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "all"}
              className={`ds-tab-pill ${activeTab === "all" ? "is-active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              {t("wrongAnswers.tabAll", "Barcha xatolar")} ({entries.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "byTopic"}
              className={`ds-tab-pill ${activeTab === "byTopic" ? "is-active" : ""}`}
              onClick={() => setActiveTab("byTopic")}
            >
              {t("wrongAnswers.tabByTopic", "Mavzular bo'yicha")} ({topicGroups.length})
            </button>
          </div>

          {/* Search bar in All tab */}
          {activeTab === "all" && entries.length > 0 && (
            <div className="ds-search-box" style={{ marginBottom: 18 }}>
              <IconSearch size={16} className="ds-search-icon" />
              <input
                className="ds-search-input"
                placeholder={t("wrongAnswers.searchPlaceholder", "Xato savollardan qidirish...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--g-text-muted)",
                  }}
                >
                  <IconX size={15} />
                </button>
              )}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="ds-empty-state">
              <div className="ds-spinner" />
              <p style={{ marginTop: 16, color: "var(--g-text-muted)" }}>{t("common.loading", "Yuklanmoqda...")}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && entries.length === 0 && (
            <div className="ds-empty-state">
              <div className="ds-empty-icon" style={{ background: "var(--g-success-bg)", color: "var(--g-success)" }}>
                <IconCheck size={36} stroke={2} />
              </div>
              <div className="ds-empty-title">{t("wrongAnswers.emptyTitle", "Xatolar yo'q!")}</div>
              <p className="ds-empty-desc">
                {t("wrongAnswers.emptySub", "Sizda hozircha xato javob berilgan savollar mavjud emas.")}
              </p>
            </div>
          )}

          {/* No search results */}
          {!loading && entries.length > 0 && activeTab === "all" && filteredEntries.length === 0 && (
            <div className="ds-empty-state">
              <div className="ds-empty-icon">
                <IconSearch size={36} />
              </div>
              <div className="ds-empty-title">{t("wrongAnswers.noFilterMatch", "Tanlangan qidiruv bo'yicha savol topilmadi.")}</div>
              <button
                type="button"
                className="ds-btn ds-btn-secondary"
                style={{ marginTop: 16 }}
                onClick={() => setSearch("")}
              >
                {t("common.resetFilter", "Filtrni tozalash")}
              </button>
            </div>
          )}

          {/* TAB 1: Barcha xatolar */}
          {!loading && activeTab === "all" && filteredEntries.length > 0 && (
            <div className="ref-wrong-list">
              {filteredEntries.map((entry, idx) => {
                const q = entry.question;
                const qId = Number(q.id || (q as any).questionId || idx + 1);
                const opts = parseOptions(q.options_json);
                const isOpen = expandedIds.has(qId);
                const explanation = localizeExp(q);

                return (
                  <div
                    key={qId}
                    className="ref-wrong-card"
                    style={{ flexDirection: "column", alignItems: "stretch", padding: 0, overflow: "hidden" }}
                  >
                    {/* Top Row */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        padding: "16px 20px",
                        cursor: "pointer",
                      }}
                      onClick={() => toggleExpand(qId)}
                    >
                      {/* Image Thumbnail */}
                      <div className="ref-wrong-thumb">
                        <img
                          src={q.image_path || "/question-default.svg"}
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/question-default.svg";
                          }}
                        />
                      </div>

                      {/* Info */}
                      <div className="ref-wrong-info">
                        <div className="ref-wrong-title">{localizeQ(q)}</div>
                        <div className="ref-wrong-badge">
                          <IconAlertTriangle size={12} />
                          {t("wrongAnswers.timesWrong", "{{count}} marta xato qilingan", {
                            count: entry.wrong_count || 1,
                          })}
                        </div>
                      </div>

                      {/* Remove Button & Chevron */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <button
                          type="button"
                          className="ds-btn ds-btn-ghost"
                          style={{ padding: 6, color: "var(--g-text-muted)" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(qId);
                          }}
                          title={t("wrongAnswers.remove", "Olib tashlash")}
                        >
                          <IconTrash size={16} />
                        </button>
                        {isOpen ? (
                          <IconChevronDown size={20} style={{ color: "var(--g-primary-light)" }} />
                        ) : (
                          <IconChevronRight size={20} style={{ color: "var(--g-text-muted)" }} />
                        )}
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isOpen && (
                      <div
                        style={{
                          padding: "0 20px 20px 20px",
                          borderTop: "1px solid var(--g-border)",
                          background: "var(--g-surface-muted)",
                        }}
                      >
                        <div style={{ margin: "16px 0", maxWidth: 360 }}>
                          <ZoomableImage
                            path={q.image_path || "/question-default.svg"}
                            className="ref-wrong-expanded-img"
                            onOpen={(src) => setZoomSrc(src)}
                          />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
                          {opts.map((opt, optIdx) => {
                            const isCorrect = (opt.index ?? optIdx) === q.correct_option;
                            return (
                              <div
                                key={opt.index ?? optIdx}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                  padding: "10px 14px",
                                  borderRadius: "var(--g-radius-md)",
                                  background: isCorrect
                                    ? "var(--g-success-bg)"
                                    : "var(--g-surface)",
                                  border: `1px solid ${
                                    isCorrect ? "rgba(16, 185, 129, 0.3)" : "var(--g-border)"
                                  }`,
                                  color: isCorrect ? "#34d399" : "var(--g-text)",
                                  fontSize: 13.5,
                                  fontWeight: isCorrect ? 600 : 500,
                                }}
                              >
                                {isCorrect ? (
                                  <IconCheck size={16} style={{ color: "var(--g-success)", flexShrink: 0 }} />
                                ) : (
                                  <IconX size={16} style={{ color: "var(--g-danger)", flexShrink: 0 }} />
                                )}
                                <span>{localizeOpt(opt)}</span>
                              </div>
                            );
                          })}

                          {explanation && (
                            <div
                              style={{
                                marginTop: 12,
                                padding: "12px 16px",
                                borderRadius: "var(--g-radius-md)",
                                background: "rgba(2, 132, 199, 0.1)",
                                border: "1px solid rgba(56, 189, 248, 0.2)",
                                fontSize: 13,
                                color: "var(--g-text)",
                                lineHeight: 1.5,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  color: "var(--g-primary-light)",
                                  fontWeight: 700,
                                  marginBottom: 4,
                                }}
                              >
                                <IconBulb size={16} />
                                <span>{t("quiz.explanationTitle", "Qoida sharhi:")}</span>
                              </div>
                              <p style={{ margin: 0 }}>{explanation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: Mavzular bo'yicha */}
          {!loading && activeTab === "byTopic" && (
            <div className="ref-wrong-list">
              {topicGroups.map((group, idx) => (
                <div
                  key={group.topicId ?? `no-topic-${idx}`}
                  className="ref-wrong-card"
                  onClick={() => {
                    if (group.topicId) {
                      navigate(`/wrong-exam?topicId=${group.topicId}`);
                    } else {
                      navigate("/wrong-exam");
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      if (group.topicId) {
                        navigate(`/wrong-exam?topicId=${group.topicId}`);
                      } else {
                        navigate("/wrong-exam");
                      }
                    }
                  }}
                >
                  <div
                    className="ref-marafon-icon-wrap"
                    style={{
                      background: BADGE_COLORS[idx % BADGE_COLORS.length],
                      fontWeight: 800,
                      fontSize: 16,
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div className="ref-wrong-info">
                    <div className="ref-wrong-title">{group.topicName}</div>
                    <div className="ref-wrong-badge">
                      <IconAlertTriangle size={12} />
                      {t("wrongAnswers.timesWrong", "{{count}} marta xato qilingan", {
                        count: group.count,
                      })}
                    </div>
                  </div>
                  <IconChevronRight size={20} className="ref-marafon-chevron" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clear All Confirmation Modal */}
        <Modal
          opened={clearModalOpen}
          onClose={() => setClearModalOpen(false)}
          title={t("wrongAnswers.confirmClearTitle", "Xatolarni tozalash")}
          centered
          radius="md"
        >
          <div style={{ padding: "8px 0" }}>
            <p style={{ fontSize: 14, color: "var(--g-text)", margin: "0 0 20px" }}>
              {t(
                "wrongAnswers.confirmClearMsg",
                "Haqiqatan ham barcha xatolar ro'yxatini tozalab tashlamoqchimisiz?"
              )}
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

export default function WrongAnswers_Page() {
  const { t } = useTranslation();
  return (
    <GuestGate
      pageTitle={t("wrongAnswers.title", "Xatolar ustida ishlash")}
      title={t("wrongAnswers.title", "Xatolar ustida ishlash")}
      description={t(
        "wrongAnswers.guestDesc",
        "Xatolarni tahlil qilish va mashq qilish uchun tizimga kiring"
      )}
    >
      <WrongAnswersContent />
    </GuestGate>
  );
}
