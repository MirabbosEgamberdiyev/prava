import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import type { OfflineQuestion, OfflineTopic } from "../../types/desktop";
import {
  startMarathonSession,
  getTopics,
  addWrongAnswer,
  saveExamResult,
  toggleSavedQuestion,
  getSavedQuestions,
  recordQuestionAttempt,
  localizeQ,
  localizeOpt,
  localizeExp,
  localizeTopic,
  parseOptions,
  submitExamSession,
} from "../../services/desktopAdapter";
import ColorMode from "../../components/other/ColorMode";
import LanguagePicker from "../../components/language/LanguagePicker";
import ImageZoomModal, { ZoomableImage } from "../../components/common/ImageZoomModal";
import GamificationResult from "../../components/quiz/GamificationResult";
import QuizReviewModal from "../../components/quiz/QuizReviewModal";
import TestSetupCard from "../../components/quiz/TestSetupCard";
import ConfirmFinishModal from "../../components/quiz/ConfirmFinishModal";
import ExamTimerAnnouncer from "../../components/quiz/ExamTimerAnnouncer";
import SEO from "../../components/common/SEO";
import KeyboardHint from "../../components/quiz/KeyboardHint";
import { useExamTimer } from "../../hooks/useExamTimer";
import { useExamHotkeys } from "../../hooks/useExamHotkeys";
import { useExamLeaveGuard } from "../../hooks/useExamLeaveGuard";
import { formatCount, useCurriculumCounts } from "../../hooks/useCurriculumCounts";
import { durationSecondsFor, isExamPassed, useExamRules } from "../../services/examRules";
import { errorKeyFor, getErrorMessage } from "../../types/errors";
import { reportError } from "../../utils/monitoring";
import { scopedUserId } from "../../utils/userScope";
import {
  IconChevronLeft,
  IconChevronRight,
  IconCheck,
  IconX,
  IconSteeringWheel,
  IconBulb,
  IconBookmark,
  IconBookmarkFilled,
  IconPlayerPlay,
  IconTrash,
  IconRotateClockwise,
} from "@tabler/icons-react";

type Phase = "setup" | "loading" | "exam" | "result";

interface Answer {
  selected: number;
  correct: number;
}

const COUNT_OPTIONS = [10, 20, 30, 50, 0]; // 0 = barchasi (MARATHON_MAX_QUESTIONS bilan cheklangan)

/**
 * W-15: bitta marafon sessiyasidagi savollar soni chegarasi. Tugallanmagan
 * sessiya (resume uchun) localStorage'ga TO'LIQ savollar bilan yoziladi — serverda
 * savollarni ID bo'yicha qayta olish API'si yo'q, shuning uchun "faqat ID" saqlash
 * resume'ni buzadi. ~1200 ta to'liq savol (3 tilda matn, izohlar) localStorage
 * kvotasiga (~5 MB) sig'maydi va har javobda qayta yoziladi; shu sababli
 * "Barchasi" ham ko'pi bilan 100 ta savol bilan cheklanadi.
 */
const MARATHON_MAX_QUESTIONS = 100;

export default function Marafon_Page() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const userId = scopedUserId(user);
  const { questions: totalQuestionsKnown } = useCurriculumCounts();

  const location = useLocation();
  const rawTopicId = searchParams.get("topicId") || (location.state as { topicId?: number | string } | null)?.topicId;
  const initialTopicId = rawTopicId ? Number(rawTopicId) : null;

  // Setup state
  const [topics, setTopics] = useState<OfflineTopic[]>([]);
  const [selTopic, setSelTopic] = useState<number | null>(initialTopicId);
  const [countIdx, setCountIdx] = useState(0);

  const MARATHON_STORAGE_KEY = `prava_marathon_active_session_${userId}`;

  // Exam state
  const [phase, setPhase] = useState<Phase>("setup");
  const [questions, setQuestions] = useState<OfflineQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [showExp, setShowExp] = useState(false);
  /** Start xatosi (obyekt) — matn render paytida joriy tilda tarjima qilinadi. */
  const [failure, setFailure] = useState<{ kind: "empty" } | { kind: "error"; error: unknown } | null>(null);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirmFinishOpen, setConfirmFinishOpen] = useState(false);
  const [savedSession, setSavedSession] = useState<{
    questions: OfflineQuestion[];
    current: number;
    answers: Record<number, Answer>;
    selTopic: number | null;
    countIdx: number;
    timestamp: number;
    sessionId?: number | null;
    /** Marafon vaqti tugaydigan absolyut vaqt (ms, epoch) — resume qolgan vaqtdan davom etadi. */
    deadline?: number;
  } | null>(null);

  // Marafon vaqtli: savollar soni × marathon.secondsPerQuestion (exam-rules)
  const rules = useExamRules();
  /** Taymer davomiyligi (soniya) — start/resume paytida deadline'dan hisoblanadi. */
  const [timerSeconds, setTimerSeconds] = useState(0);
  const deadlineRef = useRef<number | null>(null);

  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIdRef = useRef<number | null>(null);
  const answersRef = useRef(answers);
  const questionsRef = useRef(questions);
  const activeQnumRef = useRef<HTMLButtonElement | null>(null);
  const finishedRef = useRef(false);
  answersRef.current = answers;
  questionsRef.current = questions;

  // Unmount: kutilayotgan auto-advance taymerini tozalash
  useEffect(() => {
    return () => {
      if (autoRef.current) clearTimeout(autoRef.current);
    };
  }, []);

  // Check for saved uncompleted marathon session on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(MARATHON_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          Array.isArray(parsed.questions) &&
          parsed.questions.length > 0 &&
          parsed.answers &&
          Object.keys(parsed.answers).length > 0
        ) {
          setSavedSession(parsed);
        }
      }
    } catch {}
  }, [MARATHON_STORAGE_KEY]);

  const handleResumeMarathon = () => {
    if (!savedSession) return;
    setQuestions(savedSession.questions);
    setAnswers(savedSession.answers);
    answersRef.current = savedSession.answers;
    setCurrent(Math.min(savedSession.current || 0, savedSession.questions.length - 1));
    setSelTopic(savedSession.selTopic ?? null);
    setCountIdx(savedSession.countIdx || 0);
    sessionIdRef.current = savedSession.sessionId ?? null;
    questionsRef.current = savedSession.questions;

    // Absolyut deadline saqlangan — qolgan vaqtdan davom etamiz. Eski (deadline'siz)
    // sessiyalar uchun: javob berilmagan savollar × secondsPerQuestion.
    const now = Date.now();
    const answeredCount = Object.keys(savedSession.answers || {}).length;
    const deadline =
      typeof savedSession.deadline === "number" && Number.isFinite(savedSession.deadline)
        ? savedSession.deadline
        : now +
          durationSecondsFor(
            Math.max(0, savedSession.questions.length - answeredCount),
            rules.marathon.secondsPerQuestion,
          ) *
            1000;
    deadlineRef.current = deadline;
    const remaining = Math.ceil((deadline - now) / 1000);
    finishedRef.current = false;
    if (remaining <= 0) {
      // Vaqt resume'dan oldin tugagan — darhol yakunlab yuboramiz.
      triggerFinish();
      return;
    }
    setTimerSeconds(remaining);
    setPhase("exam");
  };

  // /me dagi "Davom ettirish" kartasidan (?resume=1) kelinganda — avtomatik davom ettirish
  const autoResumedRef = useRef(false);
  useEffect(() => {
    if (autoResumedRef.current || !savedSession || phase !== "setup") return;
    if (searchParams.get("resume") !== "1") return;
    autoResumedRef.current = true;
    handleResumeMarathon();
  });

  const handleDiscardSavedMarathon = () => {
    try {
      localStorage.removeItem(MARATHON_STORAGE_KEY);
    } catch {}
    setSavedSession(null);
  };

  // W-07: faol marafon davomida ilova ichidagi navigatsiya va sahifani yopish to'siladi.
  // Tugallanmagan sessiya localStorage'da qoladi — keyinroq davom ettirish mumkin.
  const guard = useExamLeaveGuard(phase === "exam");

  const onBack = () => {
    if (phase === "setup") {
      navigate("/me");
    } else {
      // Exam'dan chiqilganda saqlangan sessiya (deadline bilan) setup'da resume uchun ko'rinsin
      if (phase === "exam") {
        try {
          const raw = localStorage.getItem(MARATHON_STORAGE_KEY);
          const parsed = raw ? JSON.parse(raw) : null;
          if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
            setSavedSession(parsed);
          }
        } catch {}
      }
      setPhase("setup");
    }
  };

  useEffect(() => {
    getTopics()
      .then((data) => setTopics(Array.isArray(data) ? data : []))
      .catch((e) => reportError("marathon.loadTopics", e));
  }, []);

  useEffect(() => {
    getSavedQuestions(userId)
      .then((entries) => {
        if (Array.isArray(entries)) {
          setSavedIds(new Set(entries.filter((e) => e?.question?.id != null).map((e) => e.question.id)));
        }
      })
      .catch((e) => reportError("marathon.loadSaved", e));
  }, [userId]);

  useEffect(() => {
    setShowExp(false);
  }, [current]);

  useEffect(() => {
    activeQnumRef.current?.scrollIntoView({
      block: "nearest",
      inline: "center",
      behavior: "smooth",
    });
  }, [current]);

  const startExam = () => {
    setPhase("loading");
    setAnswers({});
    answersRef.current = {};
    setCurrent(0);
    setFailure(null);

    const maxQ =
      selTopic != null
        ? topics.find((tp) => tp.id === selTopic)?.question_count ?? 0
        : totalQuestionsKnown;

    const chosenOption = COUNT_OPTIONS[countIdx];
    // "Barchasi" — mavjud savollar, lekin MARATHON_MAX_QUESTIONS dan oshmaydi (W-15)
    const wanted = chosenOption === 0 ? MARATHON_MAX_QUESTIONS : chosenOption;
    const limit = maxQ > 0 ? Math.min(wanted, maxQ) : wanted;

    sessionIdRef.current = null;
    startMarathonSession(selTopic ?? undefined, limit)
      .then(({ sessionId, questions: qs }) => {
        if (qs.length === 0) {
          setFailure({ kind: "empty" });
          setPhase("result");
          return;
        }
        sessionIdRef.current = sessionId;
        const total = durationSecondsFor(qs.length, rules.marathon.secondsPerQuestion);
        deadlineRef.current = Date.now() + total * 1000;
        finishedRef.current = false;
        setTimerSeconds(total);
        setQuestions(qs);
        questionsRef.current = qs;
        setPhase("exam");
      })
      .catch((err: unknown) => {
        // desktopAdapter xatoda THROW qiladi (W-05). 5xx/tarmoq — api.ts global toast
        // ko'rsatadi; bu yerda faqat lokalizatsiyalangan inline xato + "Qayta urinish".
        setFailure({ kind: "error", error: err });
        setPhase("result");
      });
  };

  function triggerFinish() {
    if (finishedRef.current) return; // taymer + tugma bir vaqtda — ikki marta yuborilmasin
    finishedRef.current = true;
    if (autoRef.current) {
      clearTimeout(autoRef.current);
      autoRef.current = null;
    }
    const questions = questionsRef.current;
    const curAnswers = answersRef.current;
    const correct = Object.values(curAnswers).filter((a) => a.selected === a.correct).length;
    const total = questions.length;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const planned = durationSecondsFor(total, rules.marathon.secondsPerQuestion);
    const remaining = deadlineRef.current
      ? Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000))
      : planned;
    deadlineRef.current = null;
    setPhase("result");
    saveExamResult({
      userId,
      score,
      totalQuestions: total,
      correctAnswers: correct,
      durationSeconds: Math.max(0, planned - remaining),
      examType: "marathon",
      passed: isExamPassed(
        {
          mode: "marathon",
          total,
          correct,
          wrong: Math.max(0, Object.keys(curAnswers).length - correct),
          unanswered: Math.max(0, total - Object.keys(curAnswers).length),
        },
        rules,
      ),
    }).catch((e) => reportError("marathon.saveResult", e));

    const activeId = sessionIdRef.current;
    if (activeId && questions.length > 0) {
      sessionIdRef.current = null; // ikki marta yuborilmasin
      const submitList = questions.map((q, idx) => ({
        questionId: q.id,
        selectedOptionIndex: curAnswers[idx]?.selected ?? null,
      }));
      // Xato bo'lsa submitExamSession o'zi navbatga qo'yadi va bildirishnoma ko'rsatadi
      void submitExamSession(activeId, submitList);
    }

    try {
      localStorage.removeItem(MARATHON_STORAGE_KEY);
    } catch {}
    setSavedSession(null);
  }

  // Marafon taymeri (Exam sahifasi bilan bir xil hook) — tugaganda avtomatik yakunlash
  const { timeLeft, warning: timerWarning } = useExamTimer({
    durationSeconds: timerSeconds,
    running: phase === "exam",
    onExpire: () => triggerFinish(),
  });

  const handleSelect = (optIdx: number) => {
    if (answers[current] !== undefined || finishedRef.current) return;
    const q = questions[current];
    if (!q) return;
    const opts = parseOptions(q.options_json);
    if (optIdx >= opts.length) return;
    if (autoRef.current) {
      clearTimeout(autoRef.current);
      autoRef.current = null;
    }

    const isCorrect = optIdx === q.correct_option;
    if (!isCorrect) addWrongAnswer(userId, q).catch((e) => reportError("marathon.addWrongAnswer", e));
    recordQuestionAttempt(userId, q.id, isCorrect, "marathon").catch((e) =>
      reportError("marathon.recordAttempt", e),
    );

    const newAns = {
      ...answers,
      [current]: { selected: optIdx, correct: q.correct_option },
    };
    setAnswers(newAns);
    answersRef.current = newAns;

    const nextQ = current < questions.length - 1 ? current + 1 : current;
    try {
      localStorage.setItem(
        MARATHON_STORAGE_KEY,
        JSON.stringify({
          questions,
          current: nextQ,
          answers: newAns,
          selTopic,
          countIdx,
          timestamp: Date.now(),
          sessionId: sessionIdRef.current,
          deadline: deadlineRef.current ?? undefined,
        })
      );
    } catch {}

    if (current < questions.length - 1) {
      autoRef.current = setTimeout(() => setCurrent((c) => c + 1), 800);
    }
  };

  const handleToggleExp = () => {
    const willOpen = !showExp;
    setShowExp(willOpen);
    if (willOpen) {
      if (autoRef.current) {
        clearTimeout(autoRef.current);
        autoRef.current = null;
      }
    } else if (current < questions.length - 1) {
      autoRef.current = setTimeout(() => setCurrent((c) => c + 1), 500);
    }
  };

  const handleToggleSave = (q: OfflineQuestion) => {
    if (autoRef.current) {
      clearTimeout(autoRef.current);
      autoRef.current = null;
    }
    toggleSavedQuestion(userId, q).catch((e) => reportError("marathon.toggleSaved", e));
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(q.id)) next.delete(q.id);
      else next.add(q.id);
      return next;
    });
  };

  // W-16: yagona klaviatura boshqaruvi (1–5 / A–D, ←/→, Enter, Space — izoh)
  const lastIdx = Math.max(0, questions.length - 1);
  useExamHotkeys({
    enabled: phase === "exam",
    blocked: confirmFinishOpen || !!zoomSrc || guard.blocked,
    optionCount: questions[current] ? parseOptions(questions[current].options_json).length : 0,
    onSelect: handleSelect,
    onPrev: () => setCurrent((c) => Math.max(0, c - 1)),
    onNext: () => setCurrent((c) => Math.min(lastIdx, c + 1)),
    onEnter: () => {
      if (answers[current] !== undefined && current < lastIdx) {
        setCurrent((c) => Math.min(lastIdx, c + 1));
      }
    },
    onSpace: () => {
      if (answers[current] !== undefined && questions[current] && localizeExp(questions[current])) {
        handleToggleExp();
      }
    },
  });

  // Marafon uzun bo'lishi mumkin (1000+ savol = 1000+ daqiqa) — soat ham ko'rsatiladi.
  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const mmss = `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return h > 0 ? `${h}:${mmss}` : mmss;
  };
  const timerIsRed = timeLeft <= 60;
  const timerIsYellow = !timerIsRed && timeLeft <= 300;

  // ─── SETUP ───
  if (phase === "setup") {
    const isSingleTopic = selTopic != null;
    const pageTitle = isSingleTopic
      ? t("testSetup.topicTestTitle")
      : t("testSetup.marathonTitle");

    return (
      <div className="marathon-setup-wrapper" style={{ display: "flex", flexDirection: "column" }}>
        <SEO
          title={`${pageTitle} — ${t("seo.marathon.title")}`}
          description={t("seo.marathon.desc", { questions: formatCount(totalQuestionsKnown) })}
          canonical="/marafon"
          noIndex={true}
        />
        {/* Top Minimal Bar */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 24px",
            borderBottom: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          <button
            onClick={onBack}
            type="button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "transparent",
              border: "none",
              color: "var(--text)",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <IconChevronLeft size={20} />
            <span>{t("common.back")}</span>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ColorMode />
            <LanguagePicker />
          </div>
        </header>

        <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 16px" }}>
          <div style={{ maxWidth: 840, width: "100%", margin: "0 auto" }}>
            {savedSession && (
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--primary)",
                  borderRadius: 16,
                  padding: "20px 24px",
                  marginBottom: 24,
                  boxShadow: "0 8px 24px -4px rgba(var(--primary-rgb), 0.15)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: "rgba(var(--primary-rgb), 0.12)",
                        color: "var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconRotateClockwise size={24} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--text)" }}>
                        {t("marathon.resumeTitle")}
                      </h3>
                      <p style={{ margin: "3px 0 0", fontSize: 13, color: "var(--text-secondary)" }}>
                        {t(
                          "marathon.resumeDesc",
                          {
                            answered: Object.keys(savedSession.answers || {}).length,
                            total: savedSession.questions?.length || 0,
                          }
                        )}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button
                      type="button"
                      onClick={handleDiscardSavedMarathon}
                      style={{
                        padding: "9px 16px",
                        borderRadius: 10,
                        border: "1px solid var(--border)",
                        background: "var(--surface)",
                        color: "var(--text-secondary)",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <IconTrash size={16} />
                      <span>{t("marathon.discardResume")}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResumeMarathon}
                      style={{
                        padding: "10px 20px",
                        borderRadius: 10,
                        border: "none",
                        background: "var(--primary)",
                        color: "#fff",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        boxShadow: "0 4px 14px rgba(var(--primary-rgb), 0.35)",
                      }}
                    >
                      <IconPlayerPlay size={18} />
                      <span>{t("marathon.resumeButton")}</span>
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ width: "100%", height: 6, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${
                        savedSession.questions?.length > 0
                          ? Math.min(
                              100,
                              Math.round(
                                (Object.keys(savedSession.answers || {}).length /
                                  savedSession.questions.length) *
                                  100
                              )
                            )
                          : 0
                      }%`,
                      background: "var(--primary)",
                      borderRadius: 99,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            )}

            <TestSetupCard
              topics={topics}
              selectedTopicId={selTopic}
              onSelectTopic={(id) => setSelTopic(id)}
              countOptions={COUNT_OPTIONS}
              selectedCountIdx={countIdx}
              onSelectCountIdx={(idx) => setCountIdx(idx)}
              onStart={startExam}
              onBack={onBack}
              localizeTopic={localizeTopic}
              allCap={MARATHON_MAX_QUESTIONS}
            />
          </div>
        </main>
      </div>
    );
  }

  // ─── LOADING ───
  if (phase === "loading") {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  // ─── RESULT ───
  if (phase === "result") {
    const answeredCount = Object.values(answers).length;
    const correct = Object.values(answers).filter((a) => a.selected === a.correct).length;
    const total = questions.length;
    const wrong = answeredCount - correct;
    const unanswered = Math.max(0, total - answeredCount);
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;

    const isSingleTopic = selTopic != null;
    const screenTitle = isSingleTopic
      ? t("testSetup.topicTestTitle")
      : t("testSetup.marathonTitle");

    return (
      <>
        <SEO
          title={`${screenTitle} — ${t("seo.examResult.title")}`}
          description={t("seo.marathon.desc", { questions: formatCount(totalQuestionsKnown) })}
          canonical="/marafon"
          noIndex={true}
        />
        <div style={{ height: "100dvh", overflowY: "auto", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
          <header className="home-header">
            <div className="home-header-inner">
              <div
                className="home-header-logo"
                style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                onClick={() => navigate("/me")}
              >
                <img src="/logo.svg" width={32} height={32} alt="Prava" />
                <span className="home-header-brand">PRAVA<span className="brand-accent">ONLINE</span></span>
              </div>
              <div className="home-header-right">
                <LanguagePicker />
                <ColorMode />
              </div>
            </div>
          </header>

          <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 12px" }}>
            <GamificationResult
              mode="marathon"
              score={score}
              correct={correct}
              wrong={wrong}
              unanswered={unanswered}
              totalQuestions={total}
              errorMsg={
                failure == null
                  ? null
                  : failure.kind === "empty"
                    ? t("marathon.noQuestions")
                    : getErrorMessage(failure.error, t(errorKeyFor(failure.error, "notification.startError")))
              }
              onReviewMistakes={() => setReviewOpen(true)}
              onRetry={() => {
                setPhase("setup");
              }}
              onBackHome={() => navigate("/me")}
              title={t("testSetup.resultTitle", { title: screenTitle })}
            />
          </main>

          <QuizReviewModal
            opened={reviewOpen}
            onClose={() => setReviewOpen(false)}
            questions={questions}
            answers={answers}
          />
        </div>
      </>
    );
  }

  // ─── EXAM ───
  const q = questions[current];
  const options = parseOptions(q.options_json);
  const answered = answers[current];
  const explanation = answered !== undefined ? localizeExp(q) : null;
  const correct = Object.values(answers).filter((a) => a.selected === a.correct).length;
  const wrong = Object.values(answers).length - correct;

  return (
    <>
      <SEO
        title={`${t("seo.marathon.title")} — ${t("activeTest.questionsCount")}: ${correct + wrong}`}
        description={t("seo.marathon.desc", { questions: formatCount(totalQuestionsKnown) })}
        canonical="/marafon"
        noIndex={true}
      />
      <ExamTimerAnnouncer warning={timerWarning} />
      <div className="exam-screen">
        {/* ── Top bar ── */}
        <div className="exam-topbar">
          <div className="exam-topbar-left">
            <button
              className="exam-finish-btn"
              onClick={() => {
                const answeredCount = Object.keys(answers).length;
                if (answeredCount < questions.length) {
                  setConfirmFinishOpen(true);
                } else {
                  triggerFinish();
                }
              }}
              type="button"
            >
              {t("activeTest.finishTest")} <IconX size={15} />
            </button>
            <span
              className={`exam-timer${timerIsRed ? " red" : timerIsYellow ? " yellow" : ""}`}
              role="timer"
              aria-label={`${t("exam.timeLeft")}: ${formatTime(timeLeft)}`}
            >
              {formatTime(timeLeft)}
            </span>
          </div>

          <div className="exam-topbar-center">
            <span className="exam-counter">
              {current + 1} / {questions.length}
            </span>
          </div>

          <div className="exam-topbar-right">
            <span className="exam-score-chip green">
              <IconCheck size={13} /> {correct}
            </span>
            <span className="exam-score-chip red">
              <IconX size={13} /> {wrong}
            </span>
            <ColorMode />
            <LanguagePicker />
          </div>
        </div>

        {/* ── Question text ── */}
        <div className="exam-question-header">
          <p className="exam-question-text">{localizeQ(q)}</p>
          <button
            className={`exam-bookmark-btn${savedIds.has(q.id) ? " saved" : ""}`}
            onClick={() => handleToggleSave(q)}
            aria-pressed={savedIds.has(q.id)}
            aria-label={
              savedIds.has(q.id)
                ? t("saved.remove")
                : t("common.save")
            }
            title={
              savedIds.has(q.id)
                ? t("saved.remove")
                : t("common.save")
            }
            type="button"
          >
            {savedIds.has(q.id) ? (
              <IconBookmarkFilled size={18} />
            ) : (
              <IconBookmark size={18} />
            )}
          </button>
        </div>

        {/* ── Two-column body ── */}
        <div className="exam-two-col">
          {/* Left: options + explanation */}
          <div className="exam-col-options">
            {options.map((opt, idx) => {
              let cls = "exam-option";
              if (answered) {
                if (idx === q.correct_option) cls += " correct";
                else if (idx === answered.selected) cls += " wrong";
              }
              return (
                <button
                  key={idx}
                  className={cls}
                  onClick={() => handleSelect(idx)}
                  disabled={!!answered}
                  type="button"
                >
                  <span className="exam-option-key">{idx + 1}</span>
                  <span className="exam-option-text">{localizeOpt(opt)}</span>
                  {answered && idx === q.correct_option && (
                    <IconCheck size={15} className="opt-icon correct" />
                  )}
                  {answered &&
                    idx === answered.selected &&
                    idx !== q.correct_option && (
                      <IconX size={15} className="opt-icon wrong" />
                    )}
                </button>
              );
            })}

            {/* Explanation toggle */}
            {explanation && (
              <div className="quiz-explanation-wrap" style={{ marginTop: 10 }}>
                <button
                  className="quiz-explanation-toggle"
                  onClick={handleToggleExp}
                  type="button"
                >
                  <IconBulb size={15} />
                  {showExp
                    ? t("marathon.hideExplanation")
                    : t("marathon.showExplanation")}
                </button>
                {showExp && (
                  <div className="quiz-explanation-text">{explanation}</div>
                )}
              </div>
            )}
          </div>

          {/* Right: image or placeholder */}
          <div className="exam-col-image">
            {q.image_path ? (
              <ZoomableImage
                path={q.image_path}
                className="exam-question-img"
                onOpen={(src) => setZoomSrc(src)}
              />
            ) : (
              <div className="exam-img-placeholder">
                <IconSteeringWheel size={52} stroke={1} color="var(--border)" />
                <span className="exam-placeholder-text">pravaonline.uz</span>
              </div>
            )}
          </div>
        </div>

        {/* Zoom modal */}
        <ImageZoomModal src={zoomSrc} onClose={() => setZoomSrc(null)} />

        {/* ── Bottom: question numbers + nav ── */}
        <div className="exam-bottom">
          <div className="exam-bottom-row">
            <button
              className="exam-nav-btn"
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              disabled={current === 0}
              type="button"
              title={t("exam.prev")}
            >
              <IconChevronLeft size={17} /> <span>{t("exam.prev")}</span>
            </button>

            <div className="exam-qnums-wrap">
              <div className="exam-qnums scrollable">
                {(() => {
                  const total = questions.length;
                  const windowSize = 60;
                  let startIdx = 0;
                  let endIdx = total;
                  if (total > windowSize) {
                    startIdx = Math.max(0, current - Math.floor(windowSize / 2));
                    endIdx = Math.min(total, startIdx + windowSize);
                    if (endIdx - startIdx < windowSize) {
                      startIdx = Math.max(0, endIdx - windowSize);
                    }
                  }
                  const visibleIndices: number[] = [];
                  for (let i = startIdx; i < endIdx; i++) {
                    visibleIndices.push(i);
                  }
                  return (
                    <>
                      {startIdx > 0 && (
                        <button
                          className="exam-qnum"
                          onClick={() => setCurrent(0)}
                          type="button"
                          title={t("exam.firstQuestion")}
                        >
                          1..
                        </button>
                      )}
                      {visibleIndices.map((i) => {
                        const a = answers[i];
                        let cls = "exam-qnum";
                        if (i === current) cls += " active";
                        else if (a) cls += a.selected === a.correct ? " correct" : " wrong";
                        return (
                          <button
                            key={i}
                            ref={i === current ? activeQnumRef : undefined}
                            className={cls}
                            onClick={() => setCurrent(i)}
                            type="button"
                          >
                            {i + 1}
                          </button>
                        );
                      })}
                      {endIdx < total && (
                        <button
                          className="exam-qnum"
                          onClick={() => setCurrent(total - 1)}
                          type="button"
                          title={t("exam.questionN", { n: total })}
                        >
                          ..{total}
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {current === questions.length - 1 ? (
              <button
                className="exam-nav-btn primary"
                onClick={() => {
                  const answeredCount = Object.keys(answers).length;
                  if (answeredCount < questions.length) {
                    setConfirmFinishOpen(true);
                  } else {
                    triggerFinish();
                  }
                }}
                type="button"
                title={t("activeTest.finishTest")}
              >
                <span>{t("activeTest.finishTest")}</span> <IconCheck size={17} />
              </button>
            ) : (
              <button
                className="exam-nav-btn primary"
                onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
                type="button"
                title={t("exam.next")}
              >
                <span>{t("exam.next")}</span> <IconChevronRight size={17} />
              </button>
            )}
          </div>
          <KeyboardHint />
        </div>

        {/* Confirmation Modal before early finish (Mantine Modal — P2-W6) */}
        <ConfirmFinishModal
          opened={confirmFinishOpen}
          onCancel={() => setConfirmFinishOpen(false)}
          onConfirm={() => {
            setConfirmFinishOpen(false);
            triggerFinish();
          }}
        />

        {/* W-07: faol marafondan chiqishni tasdiqlash (javoblar saqlanib qoladi) */}
        <ConfirmFinishModal
          variant="leave"
          description={t("marathon.leaveDesc")}
          opened={guard.blocked}
          onCancel={guard.stay}
          onConfirm={guard.leave}
        />
      </div>
    </>
  );
}
