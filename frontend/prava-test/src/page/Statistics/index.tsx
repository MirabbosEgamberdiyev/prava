import { resolveUserScopeId } from "@/utils/userScope";
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import type {
  ExamResult,
  FullStats,
} from "../../types/desktop";
import {
  getFullStats,
  getExamHistory,
  resetAllStats,
} from "../../services/desktopAdapter";
import SEO from "../../components/common/SEO";
import { isExamResultPassed } from "../../services/examOutcome";
import { getFallbackTopicName } from "../../data/topicTranslations";
import { GuestGate } from "../../components/common/GuestEmptyState";
import {
  IconArrowLeft,
  IconTrophy,
  IconCheck,
  IconX,
  IconTicket,
  IconHistory,
  IconTrash,
  IconAlertTriangle,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";

type DrilldownTab = "none" | "tickets" | "history";
type PeriodDays = 7 | 30 | 90 | 0; // 0 = all

const TOPIC_BAR_COLORS = [
  "linear-gradient(90deg, #10b981, #059669)",
  "linear-gradient(90deg, #06b6d4, #0284c7)",
  "linear-gradient(90deg, #8b5cf6, #6366f1)",
  "linear-gradient(90deg, #f59e0b, #d97706)",
  "linear-gradient(90deg, #ec4899, #d946ef)",
];

function StatisticsContent() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = resolveUserScopeId(user);

  const [stats, setStats] = useState<FullStats | null>(null);
  const [history, setHistory] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodDays, setPeriodDays] = useState<PeriodDays>(30);
  const [drilldown, setDrilldown] = useState<DrilldownTab>("none");

  // Reset modal state
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  const onBack = () => navigate("/me");

  useEffect(() => {
    Promise.all([getFullStats(userId), getExamHistory(userId, 100)])
      .then(([s, h]) => {
        setStats(s);
        setHistory(Array.isArray(h) ? h : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  // Filter history by period
  const filteredHistory = useMemo(() => {
    if (periodDays === 0) return history;
    const cutoff = Date.now() - periodDays * 24 * 60 * 60 * 1000;
    return history.filter((h) => {
      const time = new Date(h.created_at).getTime();
      return isNaN(time) || time >= cutoff;
    });
  }, [history, periodDays]);

  // Aggregated totals
  const totalCorrect = useMemo(() => {
    return filteredHistory.reduce((sum, h) => sum + (h.correct_answers || 0), 0);
  }, [filteredHistory]);

  const totalWrong = useMemo(() => {
    return filteredHistory.reduce((sum, h) => sum + (h.wrong_answers || 0), 0);
  }, [filteredHistory]);

  const totalAnswered = totalCorrect + totalWrong;

  // Overall readiness percentage: weighted score or accuracy
  const overallPercentage = useMemo(() => {
    if (stats && stats.ticket_total > 0) {
      const readyPct = (stats.ticket_ready / stats.ticket_total) * 100;
      const avgPct = (stats.ticket_average / stats.ticket_total) * 50;
      const readinessFromTickets = Math.min(100, Math.round(readyPct + avgPct));
      if (readinessFromTickets > 0) return readinessFromTickets;
    }
    if (totalAnswered > 0) {
      return Math.round((totalCorrect / totalAnswered) * 100);
    }
    return 0;
  }, [stats, totalCorrect, totalAnswered]);

  // Daily activity bars for Card 2
  const dailyActivity = useMemo(() => {
    // Generate dates array for current period (e.g. 7, 14, or last 7 distinct buckets)
    const numBuckets = periodDays === 7 ? 7 : periodDays === 30 ? 10 : 8;
    const bucketDurationMs = (Math.max(1, periodDays || 30) * 24 * 60 * 60 * 1000) / numBuckets;
    const now = Date.now();
    const buckets: { label: string; correct: number; wrong: number; total: number }[] = [];

    const locale = i18n.language === "ru" ? "ru-RU" : "uz-UZ";

    for (let i = numBuckets - 1; i >= 0; i--) {
      const bStart = now - (i + 1) * bucketDurationMs;
      const bEnd = now - i * bucketDurationMs;
      const dateObj = new Date(bEnd);
      const label = dateObj.toLocaleDateString(locale, { day: "numeric", month: "short" });

      let correct = 0;
      let wrong = 0;
      for (const h of filteredHistory) {
        const t = new Date(h.created_at).getTime();
        if (t >= bStart && t < bEnd) {
          correct += h.correct_answers || 0;
          wrong += h.wrong_answers || 0;
        }
      }
      buckets.push({ label, correct, wrong, total: correct + wrong });
    }

    const maxVal = Math.max(1, ...buckets.map((b) => b.total));
    return { buckets, maxVal };
  }, [periodDays, filteredHistory, i18n.language]);

  // Topic readiness list for Card 3
  const topicList = useMemo(() => {
    if (!stats || !stats.topic_readiness || stats.topic_readiness.length === 0) {
      return [];
    }
    const lang = (i18n.language as "uzl" | "uzc" | "ru") || "uzl";
    return stats.topic_readiness.slice(0, 8).map((tp) => {
      const fb = getFallbackTopicName(tp.topic_id, lang);
      let name = fb || tp.name_uzl || t("topics.topicNumber", { number: tp.topic_id });
      if (lang === "ru" && tp.name_ru && tp.name_ru !== tp.name_uzl) name = tp.name_ru;
      if (lang === "uzc" && tp.name_uzc && tp.name_uzc !== tp.name_uzl) name = tp.name_uzc;

      // Percentage calculation
      const totalQ = tp.total || 1;
      const pct = Math.min(100, Math.round(((tp.mastered || 0) / totalQ) * 100));
      return {
        id: tp.topic_id,
        name,
        percentage: pct,
      };
    });
  }, [stats, i18n.language, t]);

  // Reset all stats handler
  const handleResetAll = async () => {
    setResetting(true);
    try {
      await resetAllStats(userId);
      const [s, h] = await Promise.all([
        getFullStats(userId),
        getExamHistory(userId, 30),
      ]);
      setStats(s);
      setHistory(Array.isArray(h) ? h : []);
    } catch (_) {}
    setResetting(false);
    setResetConfirm(false);
  };

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const fmtDate = (d: string) => {
    try {
      const locale = i18n.language === "ru" ? "ru-RU" : "uz-UZ";
      return new Date(d).toLocaleDateString(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  // Circular gauge calculations
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallPercentage / 100) * circumference;

  return (
    <>
      <SEO
        title={`${t("stats.title", "Statistika")} - Prava Online`}
        description={t("seo.statsDesc", "O'zlashtirish va imtihon ko'rsatkichlari tahlili")}
        canonical="/statistics"
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
                <h1 className="ds-page-title">{t("stats.title", "Statistika")}</h1>
                <div className="ds-page-desc">
                  {t("stats.readinessFootnote", "O'zlashtirilgan savollar va test aniqligi asosida")}
                </div>
              </div>
            </div>

            <div className="ds-header-actions">
              <button
                type="button"
                className="ds-btn ds-btn-ghost"
                style={{ color: "var(--g-text-muted)" }}
                onClick={() => setResetConfirm(true)}
                title={t("stats.resetAll", "Statistikani tozalash")}
              >
                <IconTrash size={18} />
              </button>
            </div>
          </div>

          {/* Filter Pills (Screen 10: 7 kun | 30 kun | 90 kun | Barchasi) */}
          <div className="ds-tabs-row" role="tablist" style={{ marginBottom: 20 }}>
            <button
              type="button"
              className={`ds-tab-pill ${periodDays === 7 ? "is-active" : ""}`}
              onClick={() => setPeriodDays(7)}
            >
              {t("stats.days7", "7 kun")}
            </button>
            <button
              type="button"
              className={`ds-tab-pill ${periodDays === 30 ? "is-active" : ""}`}
              onClick={() => setPeriodDays(30)}
            >
              {t("stats.days30", "30 kun")}
            </button>
            <button
              type="button"
              className={`ds-tab-pill ${periodDays === 90 ? "is-active" : ""}`}
              onClick={() => setPeriodDays(90)}
            >
              {t("stats.days90", "90 kun")}
            </button>
            <button
              type="button"
              className={`ds-tab-pill ${periodDays === 0 ? "is-active" : ""}`}
              onClick={() => setPeriodDays(0)}
            >
              {t("stats.daysAll", "Barchasi")}
            </button>
          </div>

          {loading ? (
            <div className="ds-empty-state">
              <div className="ds-spinner" />
              <p style={{ marginTop: 16, color: "var(--g-text-muted)" }}>{t("common.loading", "Yuklanmoqda...")}</p>
            </div>
          ) : (
            <div className="ref-stats-grid">
              {/* ── CARD 1: Umumiy tayyorgarlik (Overall Readiness) ── */}
              <div className="ref-stats-overview-card">
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--g-text)", marginBottom: 18 }}>
                  {t("stats.overallReadiness", "Umumiy tayyorgarlik")}
                </div>
                <div className="ref-stats-overview-inner">
                  {/* Circular Gauge */}
                  <div className="ref-stats-circle-wrap">
                    <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
                      <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        stroke="rgba(255, 255, 255, 0.08)"
                        strokeWidth="10"
                        fill="none"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        stroke="#06b6d4"
                        strokeWidth="10"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="none"
                        style={{ transition: "stroke-dashoffset 0.8s ease" }}
                      />
                    </svg>
                    <div
                      style={{
                        position: "absolute",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span className="ref-stats-circle-text">{overallPercentage}%</span>
                    </div>
                  </div>

                  {/* 3 Metric Rows with colored dots */}
                  <div className="ref-stats-metrics-list">
                    <div className="ref-stats-metric-row">
                      <span className="ref-stats-metric-label">
                        <span className="ref-stats-metric-dot" style={{ background: "#10b981" }} />
                        {t("stats.correctAnswers", "To'g'ri javoblar")}
                      </span>
                      <span className="ref-stats-metric-value">{totalCorrect}</span>
                    </div>

                    <div className="ref-stats-metric-row">
                      <span className="ref-stats-metric-label">
                        <span className="ref-stats-metric-dot" style={{ background: "#ef4444" }} />
                        {t("stats.wrongAnswers", "Xato javoblar")}
                      </span>
                      <span className="ref-stats-metric-value">{totalWrong}</span>
                    </div>

                    <div className="ref-stats-metric-row">
                      <span className="ref-stats-metric-label">
                        <span className="ref-stats-metric-dot" style={{ background: "#06b6d4" }} />
                        {t("stats.totalQuestions", "Jami savollar")}
                      </span>
                      <span className="ref-stats-metric-value">{totalAnswered}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── CARD 2: Kunlik faollik (Daily Activity Bar Chart) ── */}
              <div className="ref-stats-chart-card">
                <div className="ref-stats-chart-header">
                  {t("stats.dailyActivity", "Kunlik faollik")}
                </div>

                <div className="ref-chart-bars-wrap">
                  {dailyActivity.buckets.map((b, idx) => {
                    const correctPct = Math.round((b.correct / dailyActivity.maxVal) * 100);
                    const wrongPct = Math.round((b.wrong / dailyActivity.maxVal) * 100);

                    return (
                      <div key={idx} className="ref-chart-bar-group">
                        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, width: "100%", justifyContent: "center", height: "100%" }}>
                          {/* Correct pillar */}
                          <div
                            className="ref-chart-bar-pillar"
                            style={{ height: `${Math.max(4, correctPct)}%` }}
                            title={`${b.label}: ${b.correct} ${t("stats.correctAnswers", "to'g'ri")}`}
                          />
                          {/* Wrong pillar */}
                          {b.wrong > 0 && (
                            <div
                              className="ref-chart-bar-pillar wrong"
                              style={{ height: `${Math.max(4, wrongPct)}%` }}
                              title={`${b.label}: ${b.wrong} ${t("stats.wrongAnswers", "xato")}`}
                            />
                          )}
                        </div>
                        {/* Only show label for every 2nd or 3rd to keep clean */}
                        {idx % 2 === 0 && (
                          <div className="ref-chart-bar-label">{b.label}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── CARD 3: Mavzular bo'yicha natijalar (Topic Results) ── */}
              <div className="ref-stats-chart-card">
                <div className="ref-stats-chart-header">
                  {t("stats.resultsByTopic", "Mavzular bo'yicha natijalar")}
                </div>

                {topicList.length === 0 ? (
                  <p style={{ color: "var(--g-text-muted)", fontSize: 13.5, margin: 0 }}>
                    {t("stats.noTopicsYet", "Hozircha mavzular bo'yicha ma'lumot yo'q. Test yechishni boshlang!")}
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {topicList.map((tp, idx) => (
                      <div key={tp.id}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: 14,
                            fontWeight: 600,
                            marginBottom: 6,
                          }}
                        >
                          <span style={{ color: "var(--g-text)" }}>{tp.name}</span>
                          <span style={{ color: "var(--g-text-muted)", fontWeight: 700 }}>
                            {tp.percentage}%
                          </span>
                        </div>
                        <div
                          style={{
                            width: "100%",
                            height: 6,
                            borderRadius: "var(--g-radius-pill)",
                            background: "rgba(255, 255, 255, 0.06)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${tp.percentage}%`,
                              height: "100%",
                              background: TOPIC_BAR_COLORS[idx % TOPIC_BAR_COLORS.length],
                              borderRadius: "var(--g-radius-pill)",
                              transition: "width 0.6s ease",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── DRILLDOWN TOGGLE ACCORDIONS (Tickets, Questions, History) ── */}
              <div style={{ marginTop: 8 }}>
                <div className="ds-tabs-row" style={{ marginBottom: 14 }}>
                  <button
                    type="button"
                    className={`ds-tab-pill ${drilldown === "tickets" ? "is-active" : ""}`}
                    onClick={() => setDrilldown(drilldown === "tickets" ? "none" : "tickets")}
                  >
                    <IconTicket size={15} />
                    {t("stats.tabTickets", "Biletlar tahlili")}
                    {drilldown === "tickets" ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
                  </button>

                  <button
                    type="button"
                    className={`ds-tab-pill ${drilldown === "history" ? "is-active" : ""}`}
                    onClick={() => setDrilldown(drilldown === "history" ? "none" : "history")}
                  >
                    <IconHistory size={15} />
                    {t("stats.tabHistory", "Imtihonlar tarixi")}
                    {drilldown === "history" ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
                  </button>
                </div>

                {/* Drilldown: Tickets Breakdown */}
                {drilldown === "tickets" && stats && stats.ticket_stats && (
                  <div className="ref-stats-chart-card" style={{ marginTop: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
                      {stats.ticket_stats.map((tk) => (
                        <div
                          key={tk.ticket_id}
                          style={{
                            background: "var(--g-surface-muted)",
                            border: "1px solid var(--g-border)",
                            borderRadius: "var(--g-radius-md)",
                            padding: "10px 12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--g-text)" }}>
                            #{tk.ticket_id}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: "var(--g-radius-pill)",
                              background:
                                tk.readiness === "ready"
                                  ? "var(--g-success-bg)"
                                  : tk.readiness === "average"
                                  ? "var(--g-warning-bg)"
                                  : "rgba(255, 255, 255, 0.05)",
                              color:
                                tk.readiness === "ready"
                                  ? "#34d399"
                                  : tk.readiness === "average"
                                  ? "#fbbf24"
                                  : "var(--g-text-muted)",
                            }}
                          >
                            {tk.last_score != null ? `${tk.last_score}%` : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Drilldown: Exam History */}
                {drilldown === "history" && (
                  <div className="ref-stats-chart-card" style={{ marginTop: 12 }}>
                    {filteredHistory.length === 0 ? (
                      <p style={{ color: "var(--g-text-muted)", fontSize: 13.5, margin: 0 }}>
                        {t("stats.noExams", "Hozircha imtihonlar tarixi yo'q")}
                      </p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {filteredHistory.slice(0, 15).map((h) => {
                          const passed = isExamResultPassed(h);
                          return (
                            <div
                              key={h.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "10px 14px",
                                borderRadius: "var(--g-radius-md)",
                                background: "var(--g-surface-muted)",
                                border: "1px solid var(--g-border)",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: "50%",
                                    background: passed ? "var(--g-success-bg)" : "var(--g-danger-bg)",
                                    color: passed ? "var(--g-success)" : "var(--g-danger)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  {passed ? <IconCheck size={14} /> : <IconX size={14} />}
                                </div>
                                <div>
                                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--g-text)" }}>
                                    {h.exam_type.toUpperCase()}
                                  </div>
                                  <div style={{ fontSize: 11.5, color: "var(--g-text-muted)" }}>
                                    {fmtDate(h.created_at)}
                                  </div>
                                </div>
                              </div>

                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: 14, fontWeight: 800, color: passed ? "#34d399" : "#f87171" }}>
                                  {h.score}%
                                </div>
                                <div style={{ fontSize: 11, color: "var(--g-text-muted)" }}>
                                  {h.correct_answers}/{h.total_questions} • {fmtTime(h.duration_seconds)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Reset Confirmation Modal */}
        {resetConfirm && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 16,
            }}
            onClick={() => !resetting && setResetConfirm(false)}
          >
            <div
              className="ref-result-card"
              style={{ maxWidth: 440, width: "100%", textAlign: "center" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ color: "var(--g-danger)", margin: "0 auto 12px" }}>
                <IconAlertTriangle size={40} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--g-text)", margin: "0 0 8px" }}>
                {t("stats.resetAll", "Barcha statistikani tozalash")}
              </h3>
              <p style={{ fontSize: 13.5, color: "var(--g-text-muted)", margin: "0 0 24px" }}>
                {t(
                  "stats.resetAllConfirm",
                  "Haqiqatan ham barcha biletlar, savollar va imtihon tarixini qayta boshlamoqchimisiz?"
                )}
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                <button
                  type="button"
                  className="ds-btn ds-btn-secondary"
                  onClick={() => setResetConfirm(false)}
                  disabled={resetting}
                >
                  {t("common.cancel", "Bekor qilish")}
                </button>
                <button
                  type="button"
                  className="ds-btn ds-btn-primary"
                  style={{ background: "var(--g-danger)", borderColor: "var(--g-danger)" }}
                  onClick={handleResetAll}
                  disabled={resetting}
                >
                  {resetting ? t("common.loading", "Yuklanmoqda...") : t("common.delete", "Tozalash")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function Statistics_Page() {
  const { t } = useTranslation();
  return (
    <GuestGate
      pageTitle={t("statistics.title", "Statistika")}
      icon={IconTrophy}
      title={t("guest.statsTitle", "Statistika")}
      description={t("guest.statsDesc", "O'zlashtirish va imtihon ko'rsatkichlarini ko'rish uchun kiring")}
    >
      <StatisticsContent />
    </GuestGate>
  );
}
