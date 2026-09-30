import { resolveUserScopeId } from "@/utils/userScope";
import { getExamRules, durationSecondsFor, isExamPassed } from "@/services/examRules";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import type { OfflineQuestion, OfflineTopic } from "../../types/desktop";
import {
  getMarathonQuestions,
  getTopics,
  addWrongAnswer,
  finalizeExamResult,
  toggleSavedQuestion,
  getSavedQuestions,
  recordQuestionAttempt,
  localizeTopic,
  parseOptions,
  getActiveMarathonSessionId,
} from "../../services/desktopAdapter";
import { isFakeLocalSessionId } from "../../services/offlineExamRecord";
import { remainingSecondsUntil } from "../../components/quiz/ExamTimerDisplay";
import { ExamDesktopView, useDebouncedSave, countResults } from "../../features/ExamDesktop";
import "../../styles/exam-desktop.css";
import GamificationResult from "../../components/quiz/GamificationResult";
import QuizReviewModal from "../../components/quiz/QuizReviewModal";
import { dbClient } from "../../database";
import { generateUUID } from "../../sync/outboxQueue";
import { showToast } from "../../utils/notificationUtils";
import SEO from "../../components/common/SEO";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconDownload,
  IconFlame,
  IconRefresh,
  IconChevronRight,
  IconPlayerPlay,
  IconBook2,
  IconTarget,
} from "@tabler/icons-react";
import OfflinePreparationModal from "../../components/offline/OfflinePreparationModal";
import { errorMessage } from "../../services/safeError";

type Phase = "setup" | "loading" | "exam" | "result";

interface Answer {
  selected: number;
  correct: number;
}

const COUNT_OPTIONS = [10, 20, 30, 50, 0]; // 0 = barchasi
const BADGE_COLORS = [
  "linear-gradient(135deg, #0284c7, #2563eb)",
  "linear-gradient(135deg, #8b5cf6, #7c3aed)",
  "linear-gradient(135deg, #10b981, #059669)",
  "linear-gradient(135deg, #f59e0b, #d97706)",
  "linear-gradient(135deg, #ef4444, #dc2626)",
  "linear-gradient(135deg, #06b6d4, #0891b2)",
];

export default function Marafon_Page() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const userId = resolveUserScopeId(user);

  const location = useLocation();
  const rawTopicId = searchParams.get("topicId") || (location.state as any)?.topicId;
  const initialTopicId = rawTopicId ? Number(rawTopicId) : null;
  // Rules (marathon = TIMED, secondsPerQuestion each) — fixed for this page's lifetime
  const [rules] = useState(getExamRules);

  // Setup state
  const [topics, setTopics] = useState<OfflineTopic[]>([]);
  const [selTopic, setSelTopic] = useState<number | null>(initialTopicId);
  const [countIdx, setCountIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<"all" | "byTopic">(initialTopicId ? "byTopic" : "all");

  // Exam state
  const [phase, setPhase] = useState<Phase>("setup");
  const [questions, setQuestions] = useState<OfflineQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  /** Absolute deadline (epoch ms): count × marathon.secondsPerQuestion, persisted for crash recovery. */
  const [deadline, setDeadline] = useState<number>(0);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [reviewOpen, setReviewOpen] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);

  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const questionsRef = useRef(questions);
  questionsRef.current = questions;
  const deadlineRef = useRef(deadline);
  deadlineRef.current = deadline;
  const startTimeRef = useRef<number>(Date.now());
  const serverSessionIdRef = useRef<number | null>(null);
  const finishedRef = useRef(false);
  const selTopicRef = useRef(selTopic);
  selTopicRef.current = selTopic;

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (phase === "exam" && Object.keys(answers).length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [phase, answers]);

  const onBack = () => {
    if (phase === "setup") {
      navigate("/me");
    } else {
      setPhase("setup");
    }
  };

  useEffect(() => {
    getTopics().then((data) => setTopics(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (initialTopicId !== null && !isNaN(initialTopicId)) {
      setSelTopic(initialTopicId);
    }
  }, [initialTopicId]);

  useEffect(() => {
    getSavedQuestions(userId)
      .then((entries) => {
        if (Array.isArray(entries)) {
          setSavedIds(new Set(entries.filter((e) => e?.question?.id != null).map((e) => e.question.id)));
        }
      })
      .catch(() => {});
  }, [userId]);

  const localSessionIdRef = useRef<string>(generateUUID());
  const questionsJsonRef = useRef<string>("[]");
  const currentRef = useRef(current);
  currentRef.current = current;

  /**
   * Debounced (~500 ms) crash-recovery progress write (keeps the ORIGINAL started_at / deadline).
   * The (large) questions JSON is serialized once per session, not on every answer.
   */
  const progressSaver = useDebouncedSave((snap: { answers: Record<number, Answer>; index: number }) => {
    const qs = questionsRef.current;
    const { correct: correctSoFar } = countResults(snap.answers);
    return dbClient
      .saveExamSession({
        local_id: localSessionIdRef.current,
        server_id: serverSessionIdRef.current,
        exam_type: "MARATHON",
        target_id: selTopicRef.current,
        status: "IN_PROGRESS",
        total_questions: qs.length,
        correct_answers: correctSoFar,
        score: qs.length > 0 ? Math.round((correctSoFar / qs.length) * 100) : 0,
        duration_seconds: Math.floor((Date.now() - startTimeRef.current) / 1000),
        time_remaining_seconds: remainingSecondsUntil(deadlineRef.current),
        deadline_at: deadlineRef.current,
        started_at: startTimeRef.current,
        completed_at: null,
        answers_json: JSON.stringify(snap.answers),
        questions_json: questionsJsonRef.current,
        current_index: snap.index,
        synced: 0,
      })
      .catch(() => {});
  });

  const triggerFinish = useCallback(
    (timeUp = false) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      progressSaver.cancel();
      if (autoRef.current) {
        clearTimeout(autoRef.current);
        autoRef.current = null;
      }
      const curAnswers = answersRef.current;
      const qs = questionsRef.current;
      const now = Date.now();
      const endAt = deadlineRef.current > 0 ? Math.min(now, deadlineRef.current) : now;
      const duration = Math.max(0, Math.floor((endAt - startTimeRef.current) / 1000));
      const correct = Object.values(curAnswers).filter((a) => a.selected === a.correct).length;
      const total = qs.length;
      const answeredCount = Object.keys(curAnswers).length;
      const wrong = answeredCount - correct;
      const unanswered = Math.max(0, total - answeredCount);
      const score = total > 0 ? Math.round((correct / total) * 100) : 0;
      const passed = isExamPassed({ mode: "marathon", total, correct, wrong, unanswered }, rules);
      setIsTimeUp(timeUp);
      setPhase("result");

      // Mark session completed in local database (outcome persisted with the record)
      dbClient
        .completeExamSession(localSessionIdRef.current, {
          status: "COMPLETED",
          correct_answers: correct,
          score,
          duration_seconds: duration,
          completed_at: now,
          mode: "marathon",
          passed,
          wrong_answers: wrong,
          unanswered,
        })
        .catch(() => {});

      void finalizeExamResult(
        {
          userId,
          score,
          totalQuestions: total,
          correctAnswers: correct,
          durationSeconds: duration,
          examType: "marathon",
          mode: "marathon",
          wrongAnswers: wrong,
          unanswered,
          passed,
        },
        {
          serverSessionId: serverSessionIdRef.current,
          localSessionId: localSessionIdRef.current,
          examType: "marathon",
          targetId: null,
          questions: qs,
          answers: curAnswers,
          durationSeconds: duration,
          completedAt: now,
        }
      );
    },
    [userId, rules, progressSaver]
  );

  const startExam = useCallback(
    async (forceFresh = false) => {
      setPhase("loading");
      setAnswers({});
      answersRef.current = {};
      setCurrent(0);
      setErrorMsg(null);
      setIsTimeUp(false);
      finishedRef.current = false;

      // Crash recovery: resume an unfinished marathon with its ORIGINAL absolute deadline
      if (!forceFresh) {
        try {
          const active = await dbClient.getActiveExamSession("MARATHON");
          if (active && active.questions_json && Date.now() - active.started_at < 24 * 60 * 60 * 1000) {
            const restoredQs: OfflineQuestion[] = JSON.parse(active.questions_json);
            const restoredAns: Record<number, Answer> = JSON.parse(active.answers_json || "{}");

            if (restoredQs.length > 0) {
              const restoredDeadline =
                active.deadline_at ??
                active.started_at + durationSecondsFor("marathon", restoredQs.length, rules) * 1000;
              localSessionIdRef.current = active.local_id;
              serverSessionIdRef.current =
                active.server_id != null && !isFakeLocalSessionId(active.server_id) ? active.server_id : null;
              setQuestions(restoredQs);
              questionsRef.current = restoredQs;
              questionsJsonRef.current = active.questions_json;
              setAnswers(restoredAns);
              answersRef.current = restoredAns;
              setCurrent(active.current_index || 0);
              startTimeRef.current = active.started_at;
              setDeadline(restoredDeadline);
              deadlineRef.current = restoredDeadline;

              if (restoredDeadline <= Date.now()) {
                // Expired while the app was closed → auto-submit what was answered.
                triggerFinish(true);
                return;
              }
              setPhase("exam");

              showToast({
                id: "marathon-crash-restored",
                dedupeKey: "marathon-crash-restored",
                title: t("marathon.sessionRestored", "Marafon tiklandi"),
                message: t(
                  "marathon.sessionRestoredDesc",
                  "Avvalgi yakunlanmagan marafon holati avtomatik tiklandi"
                ),
                color: "blue",
              });
              return;
            }
          }
        } catch (err) {
          console.warn("Lokal marafon sessiyasini tiklashda xatolik:", errorMessage(err));
        }
      }

      // Fresh marathon session
      try {
        const maxQ =
          selTopic != null
            ? topics.find((tp) => tp.id === selTopic)?.question_count ?? 0
            : topics.reduce((s, tp) => s + (tp.question_count || 0), 0);

        const chosenOption = COUNT_OPTIONS[countIdx];
        const limit =
          chosenOption === 0
            ? maxQ > 0 ? maxQ : 0 // 0 → every question in the local bank
            : maxQ > 0 ? Math.min(chosenOption, maxQ) : chosenOption;

        const qs = await getMarathonQuestions(selTopic ?? undefined, limit);
        if (qs.length === 0) {
          setErrorMsg(t("marathon.noQuestions", "Savollar topilmadi"));
          setPhase("result");
          return;
        }

        // A deliberately fresh start supersedes an unfinished marathon.
        const stale = await dbClient.getActiveExamSession("MARATHON").catch(() => null);
        if (stale) await dbClient.abandonExamSession(stale.local_id).catch(() => {});

        const newId = generateUUID();
        const startedAt = Date.now();
        const seconds = durationSecondsFor("marathon", qs.length, rules);
        const newDeadline = startedAt + seconds * 1000;
        localSessionIdRef.current = newId;
        serverSessionIdRef.current = getActiveMarathonSessionId();
        setQuestions(qs);
        questionsRef.current = qs;
        questionsJsonRef.current = JSON.stringify(qs);
        startTimeRef.current = startedAt;
        setDeadline(newDeadline);
        deadlineRef.current = newDeadline;
        setPhase("exam");

        await dbClient.saveExamSession({
          local_id: newId,
          server_id: serverSessionIdRef.current,
          exam_type: "MARATHON",
          target_id: selTopic,
          status: "IN_PROGRESS",
          total_questions: qs.length,
          correct_answers: 0,
          score: 0,
          duration_seconds: 0,
          time_remaining_seconds: seconds,
          deadline_at: newDeadline,
          started_at: startedAt,
          completed_at: null,
          answers_json: "{}",
          questions_json: questionsJsonRef.current,
          current_index: 0,
          synced: 0,
        });
      } catch (e) {
        console.warn("Marafon savollarini yuklab bo'lmadi:", e instanceof Error ? e.message : e);
        setErrorMsg(t("exam.loadFailed", "Savollarni yuklab bo'lmadi. Qayta urinib ko'ring."));
        setPhase("result");
      }
    },
    [selTopic, countIdx, topics, rules, t, triggerFinish]
  );

  // Resume an interrupted marathon automatically on page open (crash recovery).
  useEffect(() => {
    let alive = true;
    dbClient
      .getActiveExamSession("MARATHON")
      .then((active) => {
        if (alive && active && active.questions_json && Date.now() - active.started_at < 24 * 60 * 60 * 1000) {
          startExam(false);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const handleSelect = useCallback(
    (optIdx: number) => {
      if (phase !== "exam" || finishedRef.current) return;
      const idx = currentRef.current;
      if (answersRef.current[idx] !== undefined) return;
      const q = questionsRef.current[idx];
      if (!q) return;
      const opts = parseOptions(q.options_json);
      if (optIdx >= opts.length) return;

      const isCorrect = optIdx === q.correct_option;
      if (!isCorrect) addWrongAnswer(userId, q).catch(() => {});
      recordQuestionAttempt(userId, q.id, isCorrect, "marathon").catch(() => {});

      const newAns = {
        ...answersRef.current,
        [idx]: { selected: optIdx, correct: q.correct_option },
      };
      setAnswers(newAns);
      answersRef.current = newAns;
      // Persist immediately after every answer (crash resistance)
      void progressSaver.saveNow({ answers: newAns, index: idx });
    },
    [phase, userId, progressSaver]
  );

  const handleToggleSave = useCallback(
    (q: OfflineQuestion) => {
      toggleSavedQuestion(userId, q);
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (next.has(q.id)) next.delete(q.id);
        else next.add(q.id);
        return next;
      });
    },
    [userId]
  );

  const handleGoto = useCallback(
    (i: number) => {
      setCurrent(i);
      progressSaver.schedule({ answers: answersRef.current, index: i });
    },
    [progressSaver]
  );
  const handleFinish = useCallback(() => triggerFinish(false), [triggerFinish]);
  const persistProgress = useCallback(
    () => progressSaver.saveNow({ answers: answersRef.current, index: currentRef.current }),
    [progressSaver]
  );
  const handleExit = useCallback(() => navigate("/me"), [navigate]);
  const handleTimeUp = useCallback(() => triggerFinish(true), [triggerFinish]);
  const activeTopic = selTopic != null ? topics.find((tp) => tp.id === selTopic) ?? null : null;
  const activeTopicName = activeTopic ? localizeTopic(activeTopic) : "";
  const runLabel = useMemo(
    () =>
      activeTopicName
        ? t("examDesktop.modeTopic", "Mavzu: {{name}}", { name: activeTopicName })
        : t("examDesktop.modeMarathon", "Marafon"),
    [t, activeTopicName]
  );

  // ─── SETUP ───
  if (phase === "setup") {
    return (
      <>
        <SEO
          title={`${t("marathon.title", "Marafon")} - Prava Online`}
          description={t("marathon.seoDesc", "Yo'l harakati qoidalari bo'yicha mustahkamlash testi")}
          canonical="/marafon"
        />
        <div className="ds-page-wrapper">
          <div className="ds-page-container" style={{ maxWidth: 760 }}>
            {/* Page Header */}
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
                  <h1 className="ds-page-title">{t("marathon.title", "Marafon")}</h1>
                  <div className="ds-page-desc">
                    {t("marathon.setupDesc", "Marafon imtihon sozlamalarini tanlang")}
                  </div>
                </div>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="ds-tabs-row" role="tablist" style={{ marginBottom: 24 }}>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "all"}
                className={`ds-tab-pill ${activeTab === "all" ? "is-active" : ""}`}
                onClick={() => setActiveTab("all")}
              >
                {t("marathon.tabAll", "Barcha savollar")}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "byTopic"}
                className={`ds-tab-pill ${activeTab === "byTopic" ? "is-active" : ""}`}
                onClick={() => setActiveTab("byTopic")}
              >
                {t("marathon.tabByTopic", "Mavzular bo'yicha")}
              </button>
            </div>

            {/* TAB 1: Barcha savollar (4 Mode Cards from Screen 8) */}
            {activeTab === "all" && (
              <div className="ref-marafon-grid">
                {/* 1. Kunlik marafon */}
                <div
                  className="ref-marafon-card"
                  onClick={() => {
                    setSelTopic(null);
                    setCountIdx(3); // 50 questions
                    startExam(true);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelTopic(null);
                      setCountIdx(3);
                      startExam(true);
                    }
                  }}
                >
                  <div
                    className="ref-marafon-icon-wrap"
                    style={{ background: "linear-gradient(135deg, #0284c7, #2563eb)" }}
                  >
                    <IconPlayerPlay size={24} />
                  </div>
                  <div className="ref-marafon-info">
                    <div className="ref-marafon-title">{t("marathon.dailyTitle", "Kunlik marafon")}</div>
                    <div className="ref-marafon-subtitle">{t("marathon.dailySubtitle", "50 ta tasodifiy savol")}</div>
                  </div>
                  <IconChevronRight size={20} className="ref-marafon-chevron" />
                </div>

                {/* 2. Xatogacha marafon */}
                <div
                  className="ref-marafon-card"
                  onClick={() => navigate("/survival")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") navigate("/survival");
                  }}
                >
                  <div
                    className="ref-marafon-icon-wrap"
                    style={{ background: "linear-gradient(135deg, #d946ef, #a855f7)" }}
                  >
                    <IconFlame size={24} />
                  </div>
                  <div className="ref-marafon-info">
                    <div className="ref-marafon-title">{t("marathon.survivalTitle", "Xatogacha marafon")}</div>
                    <div className="ref-marafon-subtitle">{t("marathon.survivalSubtitle", "Xato qilmaguningizcha")}</div>
                  </div>
                  <IconChevronRight size={20} className="ref-marafon-chevron" />
                </div>

                {/* 3. Mavzu marafoni */}
                <div
                  className="ref-marafon-card"
                  onClick={() => setActiveTab("byTopic")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setActiveTab("byTopic");
                  }}
                >
                  <div
                    className="ref-marafon-icon-wrap"
                    style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                  >
                    <IconBook2 size={24} />
                  </div>
                  <div className="ref-marafon-info">
                    <div className="ref-marafon-title">{t("marathon.topicTitle", "Mavzu marafoni")}</div>
                    <div className="ref-marafon-subtitle">{t("marathon.topicSubtitle", "Tanlangan mavzu bo'yicha")}</div>
                  </div>
                  <IconChevronRight size={20} className="ref-marafon-chevron" />
                </div>

                {/* 4. Qiyin savollar marafoni */}
                <div
                  className="ref-marafon-card"
                  onClick={() => {
                    setSelTopic(null);
                    setCountIdx(1); // 20 questions
                    startExam(true);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelTopic(null);
                      setCountIdx(1);
                      startExam(true);
                    }
                  }}
                >
                  <div
                    className="ref-marafon-icon-wrap"
                    style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
                  >
                    <IconTarget size={24} />
                  </div>
                  <div className="ref-marafon-info">
                    <div className="ref-marafon-title">{t("marathon.hardTitle", "Qiyin savollar marafoni")}</div>
                    <div className="ref-marafon-subtitle">{t("marathon.hardSubtitle", "Faqat qiyin savollar")}</div>
                  </div>
                  <IconChevronRight size={20} className="ref-marafon-chevron" />
                </div>
              </div>
            )}

            {/* TAB 2: Mavzular bo'yicha */}
            {activeTab === "byTopic" && (
              <div>
                {/* Count selector pills */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--g-text-muted)", marginBottom: 8 }}>
                    {t("marathon.questionCount", "Savollar soni")}:
                  </div>
                  <div className="ds-tabs-row" style={{ gap: 8 }}>
                    {COUNT_OPTIONS.map((count, idx) => (
                      <button
                        key={count}
                        type="button"
                        className={`ds-tab-pill ${countIdx === idx ? "is-active" : ""}`}
                        onClick={() => setCountIdx(idx)}
                      >
                        {count === 0 ? t("marathon.allQuestions", "Barchasi") : `${count} ${t("marathon.questions", "ta")}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Topics list */}
                <div className="ref-marafon-grid">
                  {topics.map((tp, idx) => (
                    <div
                      key={tp.id}
                      className="ref-marafon-card"
                      onClick={() => {
                        setSelTopic(tp.id);
                        startExam(true);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setSelTopic(tp.id);
                          startExam(true);
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
                      <div className="ref-marafon-info">
                        <div className="ref-marafon-title">{localizeTopic(tp)}</div>
                        <div className="ref-marafon-subtitle">
                          {tp.question_count || tp.question_ids?.length || 0} {t("marathon.questions", "ta savol")}
                        </div>
                      </div>
                      <IconChevronRight size={20} className="ref-marafon-chevron" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // ─── LOADING ───
  if (phase === "loading") {
    return (
      <div className="ds-page-wrapper">
        <div className="ds-empty-state" style={{ minHeight: "80vh" }}>
          <div className="ds-spinner" />
          <p style={{ marginTop: 16, color: "var(--g-text-muted)" }}>{t("common.loading", "Yuklanmoqda...")}</p>
        </div>
      </div>
    );
  }

  // ─── RESULT ───
  if (phase === "result") {
    if (errorMsg) {
      return (
        <div className="ds-page-wrapper" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24 }}>
          <div className="ref-result-card" style={{ maxWidth: 480, width: "100%" }}>
            <div style={{ margin: "0 auto 16px", color: "var(--g-danger)" }}>
              <IconAlertTriangle size={44} stroke={1.5} />
            </div>
            <h2 className="ref-result-title" style={{ color: "var(--g-danger)" }}>{t("common.error", "Xatolik")}</h2>
            <p className="ref-result-sub">
              {errorMsg === t("marathon.noQuestions", "Savollar topilmadi")
                ? t("offline.questionsNotPreloaded", "Lokal bazada savollar topilmadi yoki to'liq tayyorlanmagan.")
                : errorMsg}
            </p>
            <div className="exam-result-actions" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                className="exam-result-btn primary"
                onClick={() => startExam(false)}
                type="button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "12px 20px",
                  fontWeight: 600,
                  borderRadius: 10,
                  background: "var(--primary, #228be6)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <IconRefresh size={18} /> {t("common.retry", "Qayta urinish")}
              </button>
              <button
                className="exam-result-btn secondary"
                onClick={() => setShowOfflineModal(true)}
                type="button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "12px 20px",
                  fontWeight: 600,
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text)",
                  cursor: "pointer",
                }}
              >
                <IconDownload size={18} /> {t("offline.prepareDataset", "Offline bazani tayyorlash / yuklash")}
              </button>
              <button
                className="exam-result-btn secondary"
                onClick={() => setPhase("setup")}
                type="button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text)",
                  cursor: "pointer",
                }}
              >
                <IconArrowLeft size={18} /> {t("common.back", "Orqaga")}
              </button>
            </div>
          </div>
          <OfflinePreparationModal
            opened={showOfflineModal}
            onClose={() => setShowOfflineModal(false)}
            onSuccess={() => {
              setShowOfflineModal(false);
              startExam(true);
            }}
          />
        </div>
      );
    }

    const answeredCount = Object.values(answers).length;
    const correct = Object.values(answers).filter((a) => a.selected === a.correct).length;
    const total = questions.length;
    const wrong = answeredCount - correct;
    const unanswered = Math.max(0, total - answeredCount);
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;

    const isSingleTopic = selTopic != null;
    const screenTitle = isSingleTopic
      ? t("testSetup.topicTestTitle", "Mavzulashtirilgan test")
      : t("testSetup.marathonTitle", "Katta Marafon");

    return (
      <>
        <SEO
          title={t("exam.resultTitleOf", "{{title}} natijasi", { title: screenTitle })}
          description={t("marathon.resultSeoDesc", "Prava Online test natijalari va statistikasi")}
          canonical="/marafon"
        />
        <div className="ds-page-wrapper">
          <div className="ds-page-container" style={{ maxWidth: 760, padding: "32px 16px" }}>
            <GamificationResult
              score={score}
              correct={correct}
              wrong={wrong}
              unanswered={unanswered}
              totalQuestions={total}
              errorMsg={errorMsg}
              isTimeUp={isTimeUp}
              passed={isExamPassed({ mode: "marathon", total, correct, wrong, unanswered }, rules)}
              onReviewMistakes={() => setReviewOpen(true)}
              onRetry={() => {
                setPhase("setup");
              }}
              onBackHome={() => navigate("/me")}
              title={t("exam.resultTitleOf", "{{title}} natijasi", { title: screenTitle })}
            />

            <QuizReviewModal
              opened={reviewOpen}
              onClose={() => setReviewOpen(false)}
              questions={questions}
              answers={answers}
            />
          </div>
        </div>
      </>
    );
  }

  // ─── EXAM ───
  return (
    <>
      <SEO
        title={t("marathon.inProgressTitle", "Marafon davom etmoqda")}
        description={t("marathon.inProgressSeoDesc", "Prava Online marafon testi")}
        canonical="/marafon"
      />
      <ExamDesktopView
        mode={activeTopic ? "topic" : "marathon"}
        label={runLabel}
        questions={questions}
        current={current}
        answers={answers}
        onSelect={handleSelect}
        onGoto={handleGoto}
        onFinish={handleFinish}
        deadline={deadline > 0 ? deadline : null}
        onTimeUp={handleTimeUp}
        showExplanation
        autoAdvance="correct"
        bookmarkedIds={savedIds}
        onToggleBookmark={handleToggleSave}
        onExit={handleExit}
        persistProgress={persistProgress}
      />
    </>
  );
}
