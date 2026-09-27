import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";
import type { OfflineQuestion, OfflineTicket } from "../../../types/desktop";
import {
  startTicketSession,
  saveExamResult,
  addWrongAnswer,
  saveTicketStat,
  toggleSavedQuestion,
  getSavedQuestions,
  recordQuestionAttempt,
  localizeQ,
  localizeOpt,
  localizeExp,
  parseOptions,
  submitExamSession,
  getLang,
} from "../../../services/desktopAdapter";
import ColorMode from "../../../components/other/ColorMode";
import LanguagePicker from "../../../components/language/LanguagePicker";
import ImageZoomModal, { ZoomableImage } from "../../../components/common/ImageZoomModal";
import SEO from "../../../components/common/SEO";
import GamificationResult from "../../../components/quiz/GamificationResult";
import QuizReviewModal from "../../../components/quiz/QuizReviewModal";
import ConfirmFinishModal from "../../../components/quiz/ConfirmFinishModal";
import ExamTimerAnnouncer from "../../../components/quiz/ExamTimerAnnouncer";
import KeyboardHint from "../../../components/quiz/KeyboardHint";
import { useExamTimer } from "../../../hooks/useExamTimer";
import { useExamHotkeys } from "../../../hooks/useExamHotkeys";
import { useExamLeaveGuard } from "../../../hooks/useExamLeaveGuard";
import {
  durationMinutesFor,
  durationSecondsFor,
  getExamRulesSync,
  isExamPassed,
  useExamRules,
} from "../../../services/examRules";
import {
  buildExamLoaderKey,
  clearExamSnapshot,
  readExamSnapshot,
  writeExamSnapshot,
  type ExamSnapshot,
} from "../../../services/examSnapshot";
import { errorKeyFor, getErrorMessage } from "../../../types/errors";
import { reportError } from "../../../utils/monitoring";
import { scopedUserId } from "../../../utils/userScope";
import {
  IconChevronLeft,
  IconChevronRight,
  IconCheck,
  IconX,
  IconArrowLeft,
  IconSteeringWheel,
  IconTicket,
  IconBookmark,
  IconBookmarkFilled,
  IconBulb,
  IconAlertTriangle,
  IconRefresh,
} from "@tabler/icons-react";

type Phase = "loading" | "exam" | "result";

interface Answer {
  selected: number;
  correct: number;
}

/** Yuklash muvaffaqiyatsiz: savol yo'q yoki xato (matn render paytida tarjima qilinadi). */
type Failure = { kind: "empty" } | { kind: "error"; error: unknown };

/** URL'dagi bilet ID: faqat musbat butun son; aks holda `null` (W-15). */
function parseTicketId(raw: string | undefined): number | null {
  if (!raw || !/^\d{1,9}$/.test(raw)) return null;
  const n = Number(raw);
  return n > 0 ? n : null;
}

export default function TicketExamPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = scopedUserId(user);

  // Bilet qoidalari (exam-rules): savolga secondsPerQuestion, o'tish foizi passPercent
  const rules = useExamRules();

  const ticketId = parseTicketId(id);

  const [phase, setPhase] = useState<Phase>("loading");
  const [questions, setQuestions] = useState<OfflineQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [savedScore, setSavedScore] = useState(0);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [showExp, setShowExp] = useState(false);
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirmFinishOpen, setConfirmFinishOpen] = useState(false);
  /** Taymer davomiyligi (soniya) — start/resume paytida absolyut deadline'dan hisoblanadi. */
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Bilet metama'lumoti — sehrli sonlar o'rniga exam-rules va yuklangan savollar soni (W-15).
  const ticket: OfflineTicket = useMemo(() => {
    const num = ticketId ?? 0;
    const questionCount = questions.length || rules.real.questionCount;
    return {
      id: num,
      topic_id: null,
      ticket_number: num,
      name_uzl: `${num}-bilet`,
      name_uzc: `${num}-билет`,
      name_en: `Ticket #${num}`,
      name_ru: `Билет #${num}`,
      duration_minutes: durationMinutesFor(questionCount, rules.ticket.secondsPerQuestion),
      passing_score: rules.ticket.passPercent,
      question_count: questionCount,
    };
  }, [ticketId, questions.length, rules]);

  const localizeName = (tk: OfflineTicket): string => {
    const l = getLang();
    if (l === "uzc" && tk.name_uzc) return tk.name_uzc;
    if (l === "ru" && tk.name_ru) return tk.name_ru;
    return tk.name_uzl;
  };

  const startTimeRef = useRef<number>(Date.now());
  const deadlineRef = useRef<number | null>(null);
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIdRef = useRef<number | null>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const questionsRef = useRef(questions);
  questionsRef.current = questions;
  const ticketRef = useRef(ticket);
  ticketRef.current = ticket;
  const finishedRef = useRef(false);
  // Eskirgan (bekor qilingan) yuklash javoblarini e'tiborsiz qoldirish uchun
  const loadSeqRef = useRef(0);

  // W-01: qayta yuklash FAQAT shu kalit o'zgarganda — til (t) unga kirmaydi.
  const loaderKey = buildExamLoaderKey({ mode: "ticket", userId, ticketId });

  const guard = useExamLeaveGuard(phase === "exam", () => clearExamSnapshot("ticket"));

  const onBack = () => navigate("/tickets");

  // W-15: yaroqsiz / raqam bo'lmagan ID — biletlar ro'yxatiga (tarixga yozmasdan)
  useEffect(() => {
    if (ticketId == null) navigate("/tickets", { replace: true });
  }, [ticketId, navigate]);

  // Unmount: kutilayotgan auto-advance taymerini tozalash
  useEffect(() => {
    return () => {
      if (autoRef.current) clearTimeout(autoRef.current);
    };
  }, []);

  const resetState = () => {
    setAnswers({});
    answersRef.current = {};
    setCurrent(0);
    setIsTimeUp(false);
    setFailure(null);
    setReviewOpen(false);
    sessionIdRef.current = null;
    deadlineRef.current = null;
    finishedRef.current = false;
  };

  const startFresh = () => {
    if (ticketId == null) return;
    const seq = ++loadSeqRef.current;
    clearExamSnapshot("ticket");
    setPhase("loading");
    resetState();

    // desktopAdapter.startTicketSession xatoda THROW qiladi (W-05)
    startTicketSession(ticketId)
      .then(({ sessionId, questions: qs }) => {
        if (seq !== loadSeqRef.current) return;
        if (qs.length === 0) {
          setFailure({ kind: "empty" });
          setPhase("result");
          return;
        }
        const total = durationSecondsFor(qs.length, getExamRulesSync().ticket.secondsPerQuestion);
        const now = Date.now();
        sessionIdRef.current = sessionId;
        startTimeRef.current = now;
        deadlineRef.current = now + total * 1000;
        setTimerSeconds(total);
        setQuestions(qs);
        questionsRef.current = qs;
        setPhase("exam");
      })
      .catch((err: unknown) => {
        if (seq !== loadSeqRef.current) return;
        // 5xx/tarmoq uchun api.ts global toast ko'rsatadi — bu yerda faqat inline xato + "Qayta urinish".
        setFailure({ kind: "error", error: err });
        setPhase("result");
      });
  };

  // Savol o'zgarganda izohni yop
  useEffect(() => {
    setShowExp(false);
  }, [current]);

  // Saqlangan savollarni yuklab olish
  useEffect(() => {
    getSavedQuestions(userId)
      .then((entries) => setSavedIds(new Set(entries.map((e) => e.question.id))))
      .catch((e) => reportError("ticket.loadSaved", e));
  }, [userId]);

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
    toggleSavedQuestion(userId, q).catch((e) => reportError("ticket.toggleSaved", e));
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(q.id)) next.delete(q.id);
      else next.add(q.id);
      return next;
    });
  };

  const triggerFinish = (timeUp = false) => {
    // Ikki marta yakunlanmasin (taymer + tugma bir vaqtda, StrictMode)
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearExamSnapshot("ticket");
    if (autoRef.current) {
      clearTimeout(autoRef.current);
      autoRef.current = null;
    }
    const qs = questionsRef.current;
    const tk = ticketRef.current;
    const curAnswers = answersRef.current;
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    deadlineRef.current = null;
    const correct = Object.values(curAnswers).filter((a) => a.selected === a.correct).length;
    const total = qs.length || tk.question_count;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    setSavedScore(score);
    setIsTimeUp(timeUp);
    setPhase("result");
    const answeredCount = Object.keys(curAnswers).length;
    // Yagona qoida (barcha platformalar): foiz >= ticket.passPercent
    const isPassed = isExamPassed(
      {
        mode: "ticket",
        total,
        correct,
        wrong: Math.max(0, answeredCount - correct),
        unanswered: Math.max(0, total - answeredCount),
      },
      rules,
    );
    saveExamResult({
      userId,
      score,
      totalQuestions: total,
      correctAnswers: correct,
      durationSeconds: duration,
      examType: `ticket_${tk.ticket_number}`,
      passed: isPassed,
    }).catch((e) => reportError("ticket.saveResult", e));
    saveTicketStat(userId, tk.id, duration, correct, score, isPassed).catch((e) =>
      reportError("ticket.saveStat", e),
    );

    const activeSessionId = sessionIdRef.current;
    if (activeSessionId && qs.length > 0) {
      sessionIdRef.current = null; // ikki marta yuborilmasin
      const answersPayload = qs.map((q, idx) => ({
        questionId: q.id,
        selectedOptionIndex: curAnswers[idx]?.selected ?? null,
      }));
      // Xato bo'lsa submitExamSession o'zi navbatga qo'yadi va bildirishnoma ko'rsatadi
      void submitExamSession(activeSessionId, answersPayload);
    }
  };

  /**
   * W-07: sahifa yangilangan bo'lsa — sessionStorage snapshot'dan davom etish;
   * muddati o'tgan bo'lsa darhol yakunlash (natija + submit); aks holda yangi sessiya.
   */
  const resumeOrStart = () => {
    if (ticketId == null) return;
    const snap = readExamSnapshot<OfflineQuestion, Answer>("ticket", loaderKey);
    if (snap.status === "none") {
      startFresh();
      return;
    }
    loadSeqRef.current++;
    resetState();
    const s = snap.snapshot;
    sessionIdRef.current = s.sessionId;
    startTimeRef.current = s.startedAt;
    deadlineRef.current = s.deadline;
    setQuestions(s.questions);
    questionsRef.current = s.questions;
    setAnswers(s.answers);
    answersRef.current = s.answers;
    setCurrent(s.current);
    if (snap.status === "expired") {
      triggerFinish(true);
      return;
    }
    setTimerSeconds(snap.remainingSeconds);
    setPhase("exam");
  };

  const initRef = useRef(resumeOrStart);
  useEffect(() => {
    initRef.current = resumeOrStart;
  });
  useEffect(() => {
    initRef.current();
  }, [loaderKey]);

  // W-07: har javob / savol almashganda snapshot (absolyut deadline bilan)
  useEffect(() => {
    if (phase !== "exam" || finishedRef.current || deadlineRef.current == null) return;
    const snapshot: Omit<ExamSnapshot<OfflineQuestion, Answer>, "v"> = {
      kind: "ticket",
      scope: loaderKey,
      sessionId: sessionIdRef.current,
      questions,
      answers,
      current,
      deadline: deadlineRef.current,
      startedAt: startTimeRef.current,
    };
    writeExamSnapshot(snapshot);
  }, [phase, questions, answers, current, loaderKey]);

  // P2-W5: deadline asosidagi taymer; onExpire bir marta, state updater tashqarisida.
  const { timeLeft, warning: timerWarning } = useExamTimer({
    durationSeconds: timerSeconds,
    running: phase === "exam",
    onExpire: () => {
      triggerFinish(true);
    },
  });

  useEffect(() => {
    document.getElementById(`ticket-qnum-${current}`)?.scrollIntoView({
      block: "nearest",
      inline: "center",
      behavior: "smooth",
    });
  }, [current]);

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
    if (!isCorrect) {
      addWrongAnswer(userId, q).catch((e) => reportError("ticket.addWrongAnswer", e));
    }
    recordQuestionAttempt(userId, q.id, isCorrect, "ticket").catch((e) =>
      reportError("ticket.recordAttempt", e),
    );
    const newAns: Record<number, Answer> = {
      ...answers,
      [current]: { selected: optIdx, correct: q.correct_option },
    };
    setAnswers(newAns);
    answersRef.current = newAns;
    if (current < questions.length - 1) {
      autoRef.current = setTimeout(() => setCurrent((c) => c + 1), 700);
    }
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

  if (ticketId == null) return null;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const timerIsRed = timeLeft <= 60;
  const timerIsYellow = !timerIsRed && timeLeft <= 60 * 3;

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
    const correct = Object.values(answers).filter((a) => a.selected === a.correct).length;
    const wrong = Object.values(answers).length - correct;
    const total = questions.length || ticket.question_count;
    const answered = Object.keys(answers).length;
    const unanswered = total - answered;
    const score = total > 0 ? Math.round((correct / total) * 100) : savedScore;

    if (failure) {
      const message =
        failure.kind === "empty"
          ? t("exam.noQuestions")
          : getErrorMessage(failure.error, t(errorKeyFor(failure.error, "notification.startError")));
      return (
        <div className="exam-result-screen">
          <div className="exam-result-card">
            <div className="exam-result-icon failed">
              <IconAlertTriangle size={36} stroke={1.5} />
            </div>
            <h2 className="exam-result-title failed">{t("common.error")}</h2>
            <p className="exam-result-sub">{message}</p>
            <div className="exam-result-actions">
              <button className="exam-result-btn primary" onClick={startFresh} type="button">
                <IconRefresh size={18} /> {t("common.retry")}
              </button>
              <button className="exam-result-btn" onClick={onBack} type="button">
                <IconArrowLeft size={18} /> {t("common.back")}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <SEO
          title={`${localizeName(ticket)} — ${t("seo.examResult.title")}`}
          description={t("seo.ticketExam.desc")}
          canonical={`/tickets/${ticket.id}`}
          noIndex={true}
        />
        <div style={{ height: "100dvh", overflowY: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <GamificationResult
            mode="ticket"
            score={score}
            correct={correct}
            wrong={wrong}
            unanswered={unanswered}
            total={total}
            title={localizeName(ticket)}
            badge={`${total} ${t("dashboard.questionsUnit")} • ${t("exam.passingScore")}: ${ticket.passing_score}%`}
            isTimeUp={isTimeUp}
            onRetry={startFresh}
            onReviewMistakes={() => setReviewOpen(true)}
            onHome={onBack}
          />
        </div>

        <QuizReviewModal
          isOpen={reviewOpen}
          onClose={() => setReviewOpen(false)}
          questions={questions}
          answers={answers}
          onToggleSave={handleToggleSave}
          savedIds={savedIds}
        />
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

  const handleFinishClick = () => {
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < questions.length) {
      setConfirmFinishOpen(true);
    } else {
      triggerFinish(false);
    }
  };

  return (
    <>
      <SEO
        title={`${localizeName(ticket)} — ${t("seo.ticketExam.title")}`}
        description={t("seo.ticketExam.desc")}
        canonical={`/tickets/${ticket.id}`}
          noIndex={true}
      />
      <ExamTimerAnnouncer warning={timerWarning} />
      <div className="exam-screen">
        {/* ── Top bar ── */}
        <div className="exam-topbar">
          <div className="exam-topbar-left">
            <button
              className="exam-finish-btn"
              onClick={handleFinishClick}
              type="button"
            >
              {t("exam.finish")} <IconX size={15} />
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
            <span className="exam-ticket-label">
              <IconTicket size={14} /> #{ticket.ticket_number}
            </span>
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
                {questions.map((_, i) => {
                  const a = answers[i];
                  let cls = "exam-qnum";
                  if (i === current) cls += " active";
                  else if (a) cls += a.selected === a.correct ? " correct" : " wrong";
                  return (
                    <button
                      key={i}
                      id={`ticket-qnum-${i}`}
                      className={cls}
                      onClick={() => setCurrent(i)}
                      type="button"
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {current === questions.length - 1 ? (
              <button
                className="exam-nav-btn primary"
                onClick={handleFinishClick}
                type="button"
                title={t("exam.finish")}
              >
                <span>{t("exam.finish")}</span> <IconCheck size={17} />
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
      </div>

      {/* Early finish confirmation modal (Mantine Modal — P2-W6) */}
      <ConfirmFinishModal
        opened={confirmFinishOpen}
        onCancel={() => setConfirmFinishOpen(false)}
        onConfirm={() => {
          setConfirmFinishOpen(false);
          triggerFinish(false);
        }}
      />

      {/* W-07: faol imtihondan chiqishni tasdiqlash */}
      <ConfirmFinishModal
        variant="leave"
        opened={guard.blocked}
        onCancel={guard.stay}
        onConfirm={guard.leave}
      />
    </>
  );
}
