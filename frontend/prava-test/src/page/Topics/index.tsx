import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Drawer, Tabs, Skeleton } from "@mantine/core";
import {
  IconArrowLeft,
  IconSearch,
  IconBook2,
  IconPlayerPlay,
  IconHelpCircle,
  IconInfoCircle,
  IconChevronRight,
  IconX,
} from "@tabler/icons-react";
import type { OfflineTopic, OfflineQuestion } from "../../types/desktop";
import { getTopics, getQuestionsByTopic, localizeQ, parseOptions } from "../../services/desktopAdapter";
import { useLanguage } from "../../context/LanguageContext";
import SEO from "../../components/common/SEO";
import storageService from "../../services/storageService";

const BADGE_COLORS = [
  "linear-gradient(135deg, #0284c7, #2563eb)",
  "linear-gradient(135deg, #8b5cf6, #7c3aed)",
  "linear-gradient(135deg, #10b981, #059669)",
  "linear-gradient(135deg, #f59e0b, #d97706)",
  "linear-gradient(135deg, #ef4444, #dc2626)",
  "linear-gradient(135deg, #06b6d4, #0891b2)",
];

const CATEGORIES = [
  { id: "all", labelKey: "common.all", fallback: "Barchasi" },
  { id: "movement", labelKey: "topics.catMovement", fallback: "Harakatlanish tartibi" },
  { id: "vehicle", labelKey: "topics.catVehicle", fallback: "Avtomobil" },
  { id: "firstaid", labelKey: "topics.catFirstAid", fallback: "Birinchi yordam" },
];

export default function Topics_Page() {
  const { t } = useTranslation();
  const { localizeTopic } = useLanguage();
  const navigate = useNavigate();

  const [topics, setTopics] = useState<OfflineTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Topic detail drawer state
  const [activeTopic, setActiveTopic] = useState<OfflineTopic | null>(null);
  const [drawerQuestions, setDrawerQuestions] = useState<OfflineQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Attempt statistics to compute progress per topic
  const [attemptsMap, setAttemptsMap] = useState<Record<number, { correct: number; total: number }>>({});

  useEffect(() => {
    getTopics()
      .then((data) => setTopics(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));

    try {
      const attempts = storageService.getQuestionAttempts();
      setAttemptsMap(attempts || {});
    } catch {
      setAttemptsMap({});
    }
  }, []);

  const openTopicDetail = async (topic: OfflineTopic) => {
    setActiveTopic(topic);
    setLoadingQuestions(true);
    try {
      const qs = await getQuestionsByTopic(topic.id);
      setDrawerQuestions(qs);
    } catch {
      setDrawerQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const onStartTopicTest = (topicId: number) => {
    navigate(`/marafon?topicId=${topicId}`);
  };

  // Compute progress for each topic
  const topicProgress = useMemo(() => {
    const map: Record<number, number> = {};
    for (const tp of topics) {
      const total = tp.question_count || tp.question_ids?.length || 0;
      if (total <= 0) {
        map[tp.id] = 0;
        continue;
      }
      const answered = (tp.question_ids || []).filter((qid: number) => (attemptsMap[qid]?.total || 0) > 0).length;
      map[tp.id] = Math.min(100, Math.round((answered / total) * 100));
    }
    return map;
  }, [topics, attemptsMap]);

  // Filtered topics
  const processedTopics = useMemo(() => {
    let result = (Array.isArray(topics) ? topics : []).filter((tp) => {
      const name = localizeTopic(tp).toLowerCase();
      const code = (tp.code || "").toLowerCase();
      const query = search.trim().toLowerCase();
      return name.includes(query) || code.includes(query);
    });

    if (selectedCategory !== "all") {
      result = result.filter((_tp, idx) => {
        if (selectedCategory === "movement") return idx < 15;
        if (selectedCategory === "vehicle") return idx >= 15 && idx < 25;
        if (selectedCategory === "firstaid") return idx >= 25;
        return true;
      });
    }

    result.sort((a, b) => a.id - b.id);
    return result;
  }, [topics, search, selectedCategory, localizeTopic]);

  return (
    <>
      <SEO
        title={t("topics.seoTitle", "Mavzular - YHQ nazariyasi va testlari")}
        description={t("topics.seoDesc", "Yo'l harakati qoidalari mavzulari bo'yicha nazariy bilimlar va savollar to'plami.")}
        canonical="/topics"
      />

      <div className="ds-page-wrapper">
        <main className="ds-page-container">
          {/* Header */}
          <div className="ds-page-header">
            <div className="ds-header-left">
              <button
                type="button"
                className="ds-back-btn"
                onClick={() => navigate("/me")}
                aria-label={t("common.back", "Orqaga")}
              >
                <IconArrowLeft size={20} stroke={2.2} />
              </button>
              <div>
                <h1 className="ds-page-title">
                  <span>📖</span>
                  <span>{t("topics.title", "Mavzular")}</span>
                  {!loading && topics.length > 0 && (
                    <span className="ds-badge ds-badge-blue" style={{ marginLeft: 8 }}>
                      {topics.length}
                    </span>
                  )}
                </h1>
                <p className="ds-page-desc">
                  {t("topics.subtitle", "Yo'l harakati qoidalari bo'yicha mavzulashtirilgan bilimlar")}
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="ds-search-box">
              <IconSearch size={16} stroke={2} className="ds-search-icon" />
              <input
                className="ds-search-input"
                placeholder={t("topics.searchPlaceholder", "Mavzu qidirish...")}
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
                    display: "flex",
                    alignItems: "center",
                  }}
                  aria-label={t("common.clear", "Tozalash")}
                >
                  <IconX size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="ds-tabs-row" role="tablist">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={selectedCategory === cat.id}
                className={`ds-tab-pill ${selectedCategory === cat.id ? "is-active" : ""}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {t(cat.labelKey, cat.fallback)}
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div className="ds-empty-state">
              <div className="ds-spinner" />
              <p style={{ marginTop: 16, color: "var(--g-text-muted)" }}>
                {t("common.loading", "Yuklanmoqda...")}
              </p>
            </div>
          )}

          {/* Empty */}
          {!loading && processedTopics.length === 0 && (
            <div className="ds-empty-state">
              <div className="ds-empty-icon">
                <IconBook2 size={36} stroke={1.5} />
              </div>
              <div className="ds-empty-title">
                {search ? t("topics.notFound", "Mos keluvchi mavzu topilmadi") : t("topics.noTopics", "Mavzular mavjud emas")}
              </div>
              <p className="ds-empty-desc">
                {t("topics.emptyDesc", "Boshqa kalit so'z bilan qidirib ko'ring yoki filtrlarni tozalang.")}
              </p>
            </div>
          )}

          {/* Topics List matching Reference Design */}
          {!loading && processedTopics.length > 0 && (
            <div className="ref-topics-list">
              {processedTopics.map((topic, idx) => {
                const qCount = topic.question_count || 0;
                const progress = topicProgress[topic.id] || 0;
                const badgeBg = BADGE_COLORS[idx % BADGE_COLORS.length];

                return (
                  <div
                    key={topic.id}
                    className="ref-topic-item"
                    onClick={() => openTopicDetail(topic)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="ref-topic-num" style={{ background: badgeBg }}>
                      {idx + 1}
                    </div>

                    <div className="ref-topic-content">
                      <div className="ref-topic-title">
                        {idx + 1}. {localizeTopic(topic)}
                      </div>
                      <div className="ref-topic-meta">
                        <span>{t("topics.questionCount", "{{count}} ta savol", { count: qCount })}</span>
                        <span className="ref-topic-sep">•</span>
                        <span style={{ color: progress >= 80 ? "#10b981" : progress > 0 ? "#38bdf8" : "var(--g-text-muted)" }}>
                          {progress}%
                        </span>
                      </div>
                      <div className="ref-topic-progress">
                        <div
                          className="ref-topic-progress-fill"
                          style={{
                            width: `${progress}%`,
                            background: badgeBg,
                          }}
                        />
                      </div>
                    </div>

                    <IconChevronRight size={20} stroke={2.2} className="ref-topic-chevron" />
                  </div>
                );
              })}
            </div>
          )}

          {/* Topic Detail Drawer */}
          <Drawer
            opened={activeTopic !== null}
            onClose={() => setActiveTopic(null)}
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <IconBook2 size={22} color="var(--g-primary-light)" />
                <span style={{ fontWeight: 800, fontSize: 16, color: "var(--g-text)" }}>
                  {activeTopic ? localizeTopic(activeTopic) : ""}
                </span>
              </div>
            }
            position="right"
            size="md"
            styles={{
              content: { background: "var(--g-surface)", color: "var(--g-text)" },
              header: { background: "var(--g-surface)", borderBottom: "1px solid var(--g-border)", padding: "18px 24px" },
              body: { padding: "24px" },
            }}
          >
            {activeTopic && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Summary Card */}
                <div
                  style={{
                    background: "var(--g-surface-muted)",
                    padding: "16px 20px",
                    borderRadius: 14,
                    border: "1px solid var(--g-border)",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, color: "var(--g-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                      {t("common.questions", "Savollar")}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "var(--g-text)", marginTop: 2 }}>
                      {activeTopic.question_count} ta
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: "var(--g-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                      {t("topics.studyTime", "O'rganish vaqti")}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#38bdf8", marginTop: 2 }}>
                      ~{Math.ceil((activeTopic.question_count || 10) * 1.25)} daq
                    </div>
                  </div>
                </div>

                {/* Action: Start Quiz */}
                <button
                  type="button"
                  className="ds-btn ds-btn-primary"
                  onClick={() => {
                    const id = activeTopic.id;
                    setActiveTopic(null);
                    onStartTopicTest(id);
                  }}
                  style={{ width: "100%", height: 46, fontSize: 14.5 }}
                >
                  <IconPlayerPlay size={18} />
                  <span>{t("topics.startQuizNow", "Ushbu mavzu bo'yicha testni boshlash")}</span>
                </button>

                {/* Tabs */}
                <Tabs defaultValue="questions">
                  <Tabs.List>
                    <Tabs.Tab value="questions" leftSection={<IconHelpCircle size={16} />}>
                      {t("topics.sampleQuestions", "Savollar")} ({drawerQuestions.length})
                    </Tabs.Tab>
                    <Tabs.Tab value="theory" leftSection={<IconInfoCircle size={16} />}>
                      {t("topics.theoryGuide", "Qoidalar sharhi")}
                    </Tabs.Tab>
                  </Tabs.List>

                  <Tabs.Panel value="questions" pt="md">
                    {loadingQuestions ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <Skeleton height={60} radius="md" />
                        <Skeleton height={60} radius="md" />
                        <Skeleton height={60} radius="md" />
                      </div>
                    ) : drawerQuestions.length === 0 ? (
                      <p style={{ fontSize: 13, color: "var(--g-text-muted)", textAlign: "center", margin: "24px 0" }}>
                        {t("topics.noQuestionsLoaded", "Bu mavzu uchun savollar yuklanmadi.")}
                      </p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: "calc(100vh - 360px)", overflowY: "auto" }}>
                        {drawerQuestions.map((q, qIdx) => {
                          const opts = parseOptions(q.options_json);
                          return (
                            <div
                              key={q.id}
                              style={{
                                background: "var(--g-surface-muted)",
                                padding: "14px 16px",
                                borderRadius: 12,
                                border: "1px solid var(--g-border)",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: "#38bdf8" }}>
                                  #{qIdx + 1}
                                </span>
                              </div>
                              <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--g-text)", margin: 0, lineHeight: 1.45 }}>
                                {localizeQ(q)}
                              </p>
                              {opts.length > 0 && (
                                <div style={{ marginTop: 8, fontSize: 12, color: "var(--g-text-muted)" }}>
                                  {opts.length} {t("topics.optionsCount", "ta variant")}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Tabs.Panel>

                  <Tabs.Panel value="theory" pt="md">
                    <div
                      style={{
                        background: "var(--g-surface-muted)",
                        padding: 18,
                        borderRadius: 12,
                        border: "1px solid var(--g-border)",
                        fontSize: 13.5,
                        lineHeight: 1.6,
                        color: "var(--g-text)",
                      }}
                    >
                      <p style={{ margin: "0 0 10px" }}>
                        <strong>{localizeTopic(activeTopic)}</strong> {t("topics.officialSectionDesc", "— O'zbekiston Respublikasi Yo'l harakati qoidalarining rasmiy bo'limi hisoblanadi.")}
                      </p>
                      <p style={{ margin: "0 0 10px", color: "var(--g-text-muted)" }}>
                        {t("topics.examStandardDesc", "Ushbu mavzudagi test savollari Davlat Yo'l Harakati Xavfsizligi Xizmati (YHXDX) imtihon standartlariga to'liq mos keladi.")}
                      </p>
                      <div style={{ padding: 12, borderRadius: 10, background: "rgba(56, 189, 248, 0.1)", color: "#38bdf8" }}>
                        💡 {t("topics.hintTip", "Mavzuni to'liq o'zlashtirish uchun avval testlarni yechib, xato qilgan savollaringiz izohlarini tahlil qiling.")}
                      </div>
                    </div>
                  </Tabs.Panel>
                </Tabs>
              </div>
            )}
          </Drawer>
        </main>
      </div>
    </>
  );
}
