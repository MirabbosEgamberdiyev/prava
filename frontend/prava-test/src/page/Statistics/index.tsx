import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../auth/AuthContext";
import { scopedUserId } from "../../utils/userScope";
import { reportError } from "../../utils/monitoring";
import { isStoredResultPassed, modeFromExamType, passPercentFor, useExamRules } from "../../services/examRules";
import { AVERAGE_GAP_PERCENT } from "../../services/desktopAdapter";
import type {
  ExamResult,
  FullStats,
  TicketReadinessStat,
  QuestionStatDetail,
} from "../../types/desktop";
import {
  getFullStats,
  getExamHistory,
  getQuestionStats,
  resetAllStats,
} from "../../services/desktopAdapter";
import { Modal } from "@mantine/core";
import SEO from "../../components/common/SEO";
import styles from "../../components/dashboard/Dashboard.module.css";
import {
  IconTrophy,
  IconCheck,
  IconX,
  IconClock,
  IconTicket,
  IconQuestionMark,
  IconHistory,
  IconSearch,
  IconTrash,
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleHalf,
  IconCircleX,
  IconCircleDashed,
} from "@tabler/icons-react";

type Tab = "tickets" | "questions" | "history";
type QFilter = "all" | "ready" | "average" | "weak" | "untouched";

// ── Stacked bar ────────────────────────────────────────────────────────────
interface StackedBarProps {
  ready: number;
  average: number;
  notReady: number;
  untouched: number;
}
function StackedBar({ ready, average, notReady, untouched }: StackedBarProps) {
  const { t } = useTranslation();
  const total = ready + average + notReady + untouched || 1;
  const rPct = (ready / total) * 100;
  const aPct = (average / total) * 100;
  const nPct = (notReady / total) * 100;
  const uPct = (untouched / total) * 100;
  return (
    <div className="stacked-bar">
      {rPct > 0 && (
        <div
          className="sb-seg ready"
          style={{ width: `${rPct}%` }}
          title={t("stats.tooltipReady", { count: ready })}
        />
      )}
      {aPct > 0 && (
        <div
          className="sb-seg avg"
          style={{ width: `${aPct}%` }}
          title={t("stats.tooltipAverage", { count: average })}
        />
      )}
      {nPct > 0 && (
        <div
          className="sb-seg bad"
          style={{ width: `${nPct}%` }}
          title={t("stats.tooltipNotReady", { count: notReady })}
        />
      )}
      {uPct > 0 && (
        <div
          className="sb-seg unseen"
          style={{ width: `${uPct}%` }}
          title={t("stats.tooltipUntouched", { count: untouched })}
        />
      )}
    </div>
  );
}

// ── Horizontal bar row ─────────────────────────────────────────────────────
interface HBarProps {
  label: string;
  count: number;
  total: number;
  color: string;
  icon: React.ReactNode;
}
function HBar({ label, count, total, color, icon }: HBarProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="hbar-row">
      <div className="hbar-icon" style={{ color }}>
        {icon}
      </div>
      <div className="hbar-label">{label}</div>
      <div className="hbar-track">
        <div className="hbar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="hbar-count">{count}</div>
      <div className="hbar-pct" style={{ color }}>
        {pct}%
      </div>
    </div>
  );
}

// ── Readiness badge ────────────────────────────────────────────────────────
function ReadinessBadge({ r }: { r: string }) {
  const { t } = useTranslation();
  if (r === "ready")
    return (
      <span className="rd-badge rd-ready">
        <IconCircleCheck size={11} />
        {t("stats.ready")}
      </span>
    );
  if (r === "average")
    return (
      <span className="rd-badge rd-avg">
        <IconCircleHalf size={11} />
        {t("stats.average")}
      </span>
    );
  if (r === "not_ready")
    return (
      <span className="rd-badge rd-bad">
        <IconCircleX size={11} />
        {t("stats.notReady")}
      </span>
    );
  if (r === "weak")
    return (
      <span className="rd-badge rd-bad">
        <IconCircleX size={11} />
        {t("stats.weakLabel")}
      </span>
    );
  return (
    <span className="rd-badge rd-none">
      <IconCircleDashed size={11} />
      {t("stats.untouched")}
    </span>
  );
}

// ── Dot progress ───────────────────────────────────────────────────────────
function DotProgress({ count, max }: { count: number; max: number }) {
  return (
    <div className="dot-progress">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={`dot${i < count ? " dot-filled" : ""}`} />
      ))}
    </div>
  );
}

export default function Statistics_Page() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const userId = scopedUserId(user);
  const rules = useExamRules();
  const ticketPassPercent = passPercentFor("ticket", rules);
  const ticketAvgPercent = Math.max(0, ticketPassPercent - AVERAGE_GAP_PERCENT);

  const [tab, setTab] = useState<Tab>("tickets");
  const [stats, setStats] = useState<FullStats | null>(null);
  const [history, setHistory] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Question stats — lazy loaded
  const [qStats, setQStats] = useState<QuestionStatDetail[] | null>(null);
  const [qLoading, setQLoading] = useState(false);
  const [qFilter, setQFilter] = useState<QFilter>("all");
  const [qTopicId, setQTopicId] = useState<number | "all">("all");
  const [qSearch, setQSearch] = useState("");

  // Reset all stats
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  const getLang = () => {
    const l = i18n.language;
    if (l === "uzc") return "uzc";
    if (l === "ru") return "ru";
    return "uzl";
  };

  const localizeTicket = (tk: TicketReadinessStat): string => {
    if (!tk) return "";
    const l = getLang();
    if (l === "uzc" && tk.name_uzc) return tk.name_uzc;
    if (l === "ru" && tk.name_ru) return tk.name_ru;
    return tk.name_uzl || tk.name_ru || tk.name_uzc || `Bilet #${tk.ticket_id || ""}`;
  };

  // Server ("EXAM"/"TICKET"/…) va lokal ("exam"/"ticket_5"/…) turlari — xom qiymat ko'rsatilmaydi
  const localizeExamType = (type: string): string => {
    const raw = String(type || "");
    const ticketNum = /^ticket_(\d+)$/i.exec(raw)?.[1];
    if (ticketNum) return `${t("stats.ticket")} #${ticketNum}`;
    switch (modeFromExamType(raw)) {
      case "real":
        return t("exam.title");
      case "marathon":
        return t("marathon.title");
      case "wrong":
        return t("nav.wrongAnswers");
      case "package":
        return t("nav.packages");
      default:
        return t("stats.ticket");
    }
  };

  const localizeQuestion = (q: QuestionStatDetail): string => {
    if (!q) return "";
    const l = getLang();
    if (l === "uzc" && q.text_uzc) return q.text_uzc;
    if (l === "ru" && q.text_ru) return q.text_ru;
    return q.text_uzl || q.text_ru || q.text_uzc || `Savol #${q.question_id || ""}`;
  };

  const localizeQTopic = (q: QuestionStatDetail): string | null => {
    if (!q) return null;
    const l = getLang();
    if (l === "uzc" && q.topic_name_uzc) return q.topic_name_uzc;
    if (l === "ru" && q.topic_name_ru) return q.topic_name_ru;
    return q.topic_name_uzl ?? q.topic_name_ru ?? q.topic_name_uzc ?? null;
  };

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const fmtDate = (d: string) => {
    try {
      const locale =
        i18n.language === "ru"
          ? "ru-RU"
          : i18n.language === "en"
          ? "en-US"
          : "uz-UZ";
      return new Date(d).toLocaleDateString(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  useEffect(() => {
    Promise.all([getFullStats(userId), getExamHistory(userId, 30)])
      .then(([s, h]) => {
        setStats(s);
        setHistory(h);
      })
      .catch((err: unknown) => reportError("statistics.load", err))
      .finally(() => setLoading(false));
  }, [userId]);

  // Load question stats when tab is first opened
  useEffect(() => {
    if (tab === "questions" && qStats === null && !qLoading) {
      setQLoading(true);
      getQuestionStats(userId)
        .then(setQStats)
        .catch(() => setQStats([]))
        .finally(() => setQLoading(false));
    }
  }, [tab, qStats, qLoading, userId]);

  // Filtered question list
  const filteredQuestions = useMemo(() => {
    if (!qStats) return [];
    return qStats.filter((q) => {
      if (qFilter !== "all" && q.readiness !== qFilter) return false;
      if (qTopicId !== "all" && q.topic_id !== qTopicId) return false;
      if (qSearch.trim()) {
        const s = qSearch.toLowerCase();
        const text = localizeQuestion(q).toLowerCase();
        if (!text.includes(s)) return false;
      }
      return true;
    });
  }, [qStats, qFilter, qTopicId, qSearch]);

  // Unique topic list for dropdown
  const topicList = useMemo(() => {
    if (!qStats) return [];
    const seen = new Map<number, { id: number; name: string }>();
    for (const q of qStats) {
      if (q.topic_id != null && !seen.has(q.topic_id)) {
        seen.set(q.topic_id, {
          id: q.topic_id,
          name: localizeQTopic(q) ?? String(q.topic_id),
        });
      }
    }
    return Array.from(seen.values());
  }, [qStats]);

  // ── Reset all stats ───────────────────────────────────────────────────────
  async function handleResetAll() {
    setResetting(true);
    try {
      await resetAllStats(userId);
      const [s, h] = await Promise.all([
        getFullStats(userId),
        getExamHistory(userId, 30),
      ]);
      setStats(s);
      setHistory(h);
      setQStats(null);
    } catch (err) {
      console.warn("Failed to reset stats:", err);
    }
    setResetting(false);
    setResetConfirm(false);
  }

  function ticketRowClass(r: string) {
    if (r === "ready") return "td-row ready";
    if (r === "average") return "td-row average";
    if (r === "not_ready") return "td-row not_ready";
    return "td-row untouched";
  }

  return (
    <>
      <SEO
        title={t("seo.statistics.title")}
        description={t("seo.statistics.desc")}
        canonical="/statistics"
        noIndex={true}
      />
      {/* ── Reset confirm modal (Mantine Modal — P2-W6) ── */}
        <Modal.Root
          opened={resetConfirm}
          onClose={() => !resetting && setResetConfirm(false)}
          closeOnClickOutside={!resetting}
          closeOnEscape={!resetting}
          centered
          size={380}
          zIndex={9000}
        >
          <Modal.Overlay backgroundOpacity={0.5} blur={3} />
          <Modal.Content
            radius="lg"
            styles={{ content: { background: "transparent", boxShadow: "none" } }}
          >
            <Modal.Body className="reset-modal" style={{ padding: "28px 24px" }}>
              <div className="reset-modal-icon" aria-hidden="true">
                <IconAlertTriangle size={32} />
              </div>
              <Modal.Title
                className="reset-modal-title"
                style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.3, color: "var(--text)", marginBottom: 10 }}
              >
                {t("stats.resetAll")}
              </Modal.Title>
              <div className="reset-modal-msg">
                {t(
                  "stats.resetAllConfirm"
                )}
              </div>
              <div className="reset-modal-actions">
                <button
                  className="reset-cancel-btn"
                  onClick={() => setResetConfirm(false)}
                  disabled={resetting}
                  type="button"
                >
                  {t("common.cancel")}
                </button>
                <button
                  className="reset-confirm-btn"
                  onClick={handleResetAll}
                  disabled={resetting}
                  type="button"
                >
                  {resetting ? <span className="spinner-sm" /> : <IconTrash size={14} />}
                  {resetting ? t("common.loading") : t("common.yes")}
                </button>
              </div>
            </Modal.Body>
          </Modal.Content>
        </Modal.Root>

        {/* Page Header */}
        <div className={styles.innerPageHeader}>
          <div className={styles.innerPageHeaderLeft}>
            <div className={styles.innerPageTitleRow}>
              <h1 className={styles.innerPageTitle}>{t("stats.title")}</h1>
            </div>
            <p className={styles.innerPageSubtitle}>
              {t(
                "stats.subtitle"
              )}
            </p>
          </div>

          <div className={styles.innerPageActions}>
            <button
              className="stats-reset-btn"
              onClick={() => setResetConfirm(true)}
              title={t("stats.resetAll")}
              aria-label={t("stats.resetAll")}
              type="button"
            >
              <IconTrash size={15} />
              <span>{t("stats.resetAll")}</span>
            </button>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="stats-tabs">
          <button
            className={`stats-tab-btn${tab === "tickets" ? " active" : ""}`}
            onClick={() => setTab("tickets")}
            type="button"
          >
            <IconTicket size={15} />
            {t("stats.tabTickets")}
          </button>
          <button
            className={`stats-tab-btn${tab === "questions" ? " active" : ""}`}
            onClick={() => setTab("questions")}
            type="button"
          >
            <IconQuestionMark size={15} />
            {t("stats.tabQuestions")}
          </button>
          <button
            className={`stats-tab-btn${tab === "history" ? " active" : ""}`}
            onClick={() => setTab("history")}
            type="button"
          >
            <IconHistory size={15} />
            {t("stats.tabHistory")}
          </button>
        </div>

        {loading ? (
          <div className="loading-screen">
            <div className="spinner" />
          </div>
        ) : (
          <div className="stats-content">
            <div className="stats-container">
              {/* ══════════════════════════════════════════════════
                  TAB 1 — BILETLAR
              ══════════════════════════════════════════════════ */}
              {tab === "tickets" && (
                <>
                  {/* Summary overview */}
                  {stats && stats.ticket_total > 0 && (
                    <div className="stats-section-card">
                      <div className="stats-section-header">
                        <span className="stats-section-icon">
                          <IconTicket size={17} />
                        </span>
                        <span className="stats-section-title">
                          {t("stats.ticketSection")}
                        </span>
                      </div>

                      <StackedBar
                        ready={stats.ticket_ready}
                        average={stats.ticket_average}
                        notReady={stats.ticket_not_ready}
                        untouched={stats.ticket_untouched}
                      />
                      <div className="hbar-list">
                        <HBar
                          label={t("stats.ready")}
                          count={stats.ticket_ready}
                          total={stats.ticket_total}
                          color="var(--correct)"
                          icon={<IconCircleCheck size={15} />}
                        />
                        <HBar
                          label={t("stats.average")}
                          count={stats.ticket_average}
                          total={stats.ticket_total}
                          color="#f08c00"
                          icon={<IconCircleHalf size={15} />}
                        />
                        <HBar
                          label={t("stats.notReady")}
                          count={stats.ticket_not_ready}
                          total={stats.ticket_total}
                          color="var(--wrong)"
                          icon={<IconCircleX size={15} />}
                        />
                        <HBar
                          label={t("stats.untouched")}
                          count={stats.ticket_untouched}
                          total={stats.ticket_total}
                          color="var(--text-muted)"
                          icon={<IconCircleDashed size={15} />}
                        />
                      </div>
                      <div className="stats-condition-info">
                        <div className="condition-row ready">
                          <IconCircleCheck size={13} />
                          {t("stats.conditionReady", { percent: ticketPassPercent })}
                        </div>
                        <div className="condition-row avg">
                          <IconCircleHalf size={13} />
                          {t("stats.conditionAvg", { percent: ticketAvgPercent })}
                        </div>
                        <div className="condition-row bad">
                          <IconCircleX size={13} />
                          {t("stats.conditionBad")}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Per-ticket detail list */}
                  {!stats || stats.ticket_total === 0 ? (
                    <div className="stats-section-card">
                      <p className="stats-empty-hint">
                        {t("stats.noTicketsYet")}
                      </p>
                    </div>
                  ) : (
                    <div className="stats-section-card" style={{ padding: 0 }}>
                      <div className="td-list">
                        {stats.ticket_stats.map((tk) => (
                          <div
                            key={tk.ticket_id}
                            className={ticketRowClass(tk.readiness)}
                          >
                            {/* Left: number + name */}
                            <div className="td-left">
                              <span className="td-num">#{tk.ticket_number}</span>
                              <span className="td-name">{localizeTicket(tk)}</span>
                            </div>

                            {/* Middle: dots progress */}
                            {tk.readiness !== "untouched" ? (
                              <div className="td-mid">
                                <DotProgress count={tk.fast_perfect_count} max={5} />
                                <span className="td-dot-label">
                                  {tk.fast_perfect_count}/5
                                </span>
                              </div>
                            ) : (
                              <div className="td-mid">
                                <span className="td-untouched-label">—</span>
                              </div>
                            )}

                            {/* Right: badge + meta */}
                            <div className="td-right">
                              <ReadinessBadge r={tk.readiness} />
                              <div className="td-meta">
                                {tk.last_score != null && (
                                  <span className="td-score">{tk.last_score}%</span>
                                )}
                                {tk.last_duration != null && (
                                  <span className="td-time">
                                    <IconClock size={10} />
                                    {fmtTime(tk.last_duration)}
                                  </span>
                                )}
                                {tk.times_done > 0 && (
                                  <span className="td-attempts">×{tk.times_done}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ══════════════════════════════════════════════════
                  TAB 2 — SAVOLLAR
              ══════════════════════════════════════════════════ */}
              {tab === "questions" && (
                <>
                  {/* Summary overview card */}
                  {stats && (
                    <div className="stats-section-card">
                      <div className="stats-section-header">
                        <span className="stats-section-icon">
                          <IconQuestionMark size={17} />
                        </span>
                        <span className="stats-section-title">
                          {t("stats.questionSection")}
                        </span>
                      </div>
                      <StackedBar
                        ready={stats.question_readiness.ready}
                        average={stats.question_readiness.average}
                        notReady={stats.question_readiness.weak}
                        untouched={stats.question_readiness.untouched}
                      />
                      <div className="hbar-list">
                        <HBar
                          label={t("stats.ready")}
                          count={stats.question_readiness.ready}
                          total={stats.question_readiness.total}
                          color="var(--correct)"
                          icon={<IconCircleCheck size={15} />}
                        />
                        <HBar
                          label={t("stats.average")}
                          count={stats.question_readiness.average}
                          total={stats.question_readiness.total}
                          color="#f08c00"
                          icon={<IconCircleHalf size={15} />}
                        />
                        <HBar
                          label={t("stats.weakLabel")}
                          count={stats.question_readiness.weak}
                          total={stats.question_readiness.total}
                          color="var(--wrong)"
                          icon={<IconCircleX size={15} />}
                        />
                        <HBar
                          label={t("stats.untouched")}
                          count={stats.question_readiness.untouched}
                          total={stats.question_readiness.total}
                          color="var(--text-muted)"
                          icon={<IconCircleDashed size={15} />}
                        />
                      </div>
                      <div className="stats-condition-info">
                        <div className="condition-row ready">
                          <IconCircleCheck size={13} />
                          {t("stats.qConditionReady")}
                        </div>
                        <div className="condition-row avg">
                          <IconCircleHalf size={13} />
                          {t("stats.qConditionAvg")}
                        </div>
                        <div className="condition-row bad">
                          <IconCircleX size={13} />
                          {t("stats.qConditionBad")}
                        </div>
                      </div>
                      <div className="stats-total-hint">
                        {t("stats.totalQuestions")}:{" "}
                        <strong>{stats.question_readiness.total}</strong>
                      </div>
                    </div>
                  )}

                  {/* Filter + search */}
                  <div className="stats-section-card q-filter-card">
                    {/* Readiness filter buttons */}
                    <div className="q-filter-bar">
                      {(
                        ["all", "ready", "average", "weak", "untouched"] as QFilter[]
                      ).map((f) => (
                        <button
                          key={f}
                          className={`q-filter-btn ${f}${qFilter === f ? " active" : ""}`}
                          onClick={() => setQFilter(f)}
                          type="button"
                        >
                          {f === "all" && t("stats.filterAll")}
                          {f === "ready" && t("stats.ready")}
                          {f === "average" && t("stats.average")}
                          {f === "weak" && t("stats.weakLabel")}
                          {f === "untouched" && t("stats.untouched")}
                        </button>
                      ))}
                    </div>

                    {/* Topic + search row */}
                    <div className="q-search-row">
                      <select
                        className="q-topic-select"
                        value={qTopicId === "all" ? "all" : String(qTopicId)}
                        onChange={(e) =>
                          setQTopicId(
                            e.target.value === "all" ? "all" : Number(e.target.value)
                          )
                        }
                      >
                        <option value="all">
                          {t("stats.allTopics")}
                        </option>
                        {topicList.map((tp) => (
                          <option key={tp.id} value={tp.id}>
                            {tp.name}
                          </option>
                        ))}
                      </select>
                      <div className="q-search-wrap">
                        <IconSearch size={14} className="q-search-icon" />
                        <input
                          type="text"
                          className="q-search-input"
                          placeholder={t(
                            "stats.searchPlaceholder"
                          )}
                          value={qSearch}
                          onChange={(e) => setQSearch(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Question list */}
                  {qLoading ? (
                    <div style={{ padding: 24, textAlign: "center" }}>
                      <div className="spinner" />
                    </div>
                  ) : filteredQuestions.length === 0 ? (
                    <div className="stats-section-card">
                      <p className="stats-empty-hint">
                        {t("stats.noResults")}
                      </p>
                    </div>
                  ) : (
                    <div className="stats-section-card" style={{ padding: 0 }}>
                      <div className="q-list">
                        {filteredQuestions.map((q) => (
                          <div
                            key={q.question_id}
                            className={`q-row q-row-${q.readiness}`}
                          >
                            <div className="q-row-num">#{q.order_num}</div>
                            <div className="q-row-body">
                              <div className="q-row-text">{localizeQuestion(q)}</div>
                              {localizeQTopic(q) && (
                                <div className="q-row-topic">{localizeQTopic(q)}</div>
                              )}
                            </div>
                            <div className="q-row-right">
                              <ReadinessBadge r={q.readiness} />
                              <div className="q-row-counts">
                                <span className="q-correct">{q.correct_count}</span>
                                <span className="q-sep">/</span>
                                <span className="q-total">{q.total_attempts}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="q-list-footer">
                        {t("stats.showingCount", {
                          count: filteredQuestions.length,
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ══════════════════════════════════════════════════
                  TAB 3 — TARIX
              ══════════════════════════════════════════════════ */}
              {tab === "history" && (
                <div className="stats-section-card">
                  <div className="stats-section-header">
                    <span className="stats-section-icon">
                      <IconTrophy size={17} />
                    </span>
                    <span className="stats-section-title">
                      {t("stats.recentExams")}
                    </span>
                  </div>
                  {history.length === 0 ? (
                    <p className="stats-empty-hint">
                      {t("stats.noExams")}
                    </p>
                  ) : (
                    <div className="stats-history-list">
                      {history.map((h) => {
                        // W-04: rejim qoidasi (real: maxWrong; bilet/marafon: foiz) yoki saqlangan natija
                        const passed = isStoredResultPassed(h, rules);
                        return (
                          <div
                            key={h.id}
                            className={`stats-history-item ${
                              passed ? "passed" : "failed"
                            }`}
                          >
                            <div
                              className={`stats-history-badge ${
                                passed ? "passed" : "failed"
                              }`}
                            >
                              {passed ? <IconCheck size={13} /> : <IconX size={13} />}
                            </div>
                            <div className="stats-history-info">
                              <div className="stats-history-type">
                                {localizeExamType(h.exam_type)}
                              </div>
                              <div className="stats-history-score">
                                {h.correct_answers}/{h.total_questions} —{" "}
                                <strong>{h.score}%</strong>
                              </div>
                            </div>
                            <div className="stats-history-right">
                              <div className="stats-history-time">
                                <IconClock size={11} /> {fmtTime(h.duration_seconds)}
                              </div>
                              <div className="stats-history-date">
                                {fmtDate(h.created_at)}
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
    </>
  );
}
