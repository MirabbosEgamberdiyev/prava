import { useState, useEffect, useRef, useCallback } from "react";
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
import { useExamTimer } from "../../../hooks/useExamTimer";
import { isExamPassed, useExamRules } from "../../../services/examRules";
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
} from "@tabler/icons-react";

type Phase = "loading" | "exam" | "result";

interface Answer {
  selected: number;
  correct: number;
}

export default function TicketExamPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id ? Number(user.id) : 1;

  // Bilet qoidalari (exam-rules): savolga secondsPerQuestion, o'tish foizi passPercent
  const rules = useExamRules();

  const ticketId = id ? Number(id) : 1;
  const ticket: OfflineTicket = {
    id: ticketId,
    topic_id: null,
    ticket_number: ticketId,
    name_uzl: `${ticketId}-bilet`,
    name_uzc: `${ticketId}-билет`,
    name_en: `Ticket #${ticketId}`,
    name_ru: `Билет #${ticketId}`,
    duration_minutes: 20,
    passing_score: rules.ticket.passPercent,
    question_count: 20,
  };

  const localizeName = (tk: OfflineTicket): string => {
    const l = getLang();
    if (l === "uzc" && tk.name_uzc) return tk.name_uzc;
    if (l === "ru" && tk.name_ru) return tk.name_ru;
    return tk.name_uzl;
  };

  const [phase, setPhase] = useState<Phase>("loading");
  const [questions, setQuestions] = useState<OfflineQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedScore, setSavedScore] = useState(0);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [showExp, setShowExp] = useState(false);
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirmFinishOpen, setConfirmFinishOpen] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIdRef = useRef<number | null>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const finishedRef = useRef(false);

  const onBack = () => navigate("/tickets");

  // Unmount: kutilayotgan auto-advance taymerini tozalash
  useEffect(() => {
    return () => {
      if (autoRef.current) clearTimeout(autoRef.current);
    };
  }, []);

  // Beforeunload listener during exam
  useEffect(() => {
    if (phase !== "exam") return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [phase]);

  const loadingRef = useRef(false);

  const loadQuestions = useCallback(() => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setPhase("loading");
    setAnswers({});
    answersRef.current = {};
    setCurrent(0);
    setIsTimeUp(false);
    setErrorMsg(null);
    finishedRef.current = false;

    sessionIdRef.current = null;
    startTicketSession(ticket.id)
      .then(({ sessionId, questions: qs }) => {
        if (qs.length === 0) {
          setErrorMsg(t("exam.noQuestions", "Savollar topilmadi"));
          setPhase("result");
          return;
        }
        sessionIdRef.current = sessionId;
        setQuestions(qs);
        setPhase("exam");
        startTimeRef.current = Date.now();
      })
      .catch((e) => {
        setErrorMsg(String(e));
        setPhase("result");
      })
      .finally(() => {
        loadingRef.current = false;
      });
  }, [ticket.id, t]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Savol o'zgarganda izohni yop
  useEffect(() => {
    setShowExp(false);
  }, [current]);

  // Saqlangan savollarni yuklab olish
  useEffect(() => {
    getSavedQuestions(userId)
      .then((entries) => setSavedIds(new Set(entries.map((e) => e.question.id))))
      .catch(() => {});
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
    toggleSavedQuestion(userId, q);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(q.id)) next.delete(q.id);
      else next.add(q.id);
      return next;
    });
  };

  const triggerFinish = useCallback(
    (timeUp = false) => {
      // Ikki marta yakunlanmasin (taymer + tugma bir vaqtda, StrictMode)
      if (finishedRef.current) return;
      finishedRef.current = true;
      if (autoRef.current) {
        clearTimeout(autoRef.current);
        autoRef.current = null;
      }
      const curAnswers = answersRef.current;
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const correct = Object.values(curAnswers).filter((a) => a.selected === a.correct).length;
      const total = questions.length || ticket.question_count;
      const score = total > 0 ? Math.round((correct / total) * 100) : 0;
      setSavedScore(score);
      if (!timeUp) setIsTimeUp(false);
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
        examType: `ticket_${ticket.ticket_number}`,
      }).catch(() => {});
      saveTicketStat(userId, ticket.id, duration, correct, score, isPassed).catch(() => {});

      const activeSessionId = sessionIdRef.current;
      if (activeSessionId && questions.length > 0) {
        sessionIdRef.current = null; // ikki marta yuborilmasin
        const answersPayload = questions.map((q, idx) => ({
          questionId: q.id,
          selectedOptionIndex: curAnswers[idx]?.selected ?? null,
        }));
        // Xato bo'lsa submitExamSession o'zi navbatga qo'yadi va bildirishnoma ko'rsatadi
        void submitExamSession(activeSessionId, answersPayload);
      }
    },
    [questions, ticket, userId, rules]
  );

  // P2-W5: deadline asosidagi taymer; onExpire bir marta, state updater tashqarisida.
  const { timeLeft, warning: timerWarning } = useExamTimer({
    durationSeconds: (questions.length || ticket.question_count) * rules.ticket.secondsPerQuestion,
    running: phase === "exam",
    onExpire: () => {
      setIsTimeUp(true);
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

  // F1–F5 and 1–5 keyboard shortcuts
  useEffect(() => {
    if (phase !== "exam") return;
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      // Tasdiqlash oynasi ochiq: klaviaturani Mantine Modal boshqaradi
      if (confirmFinishOpen || zoomSrc) return;

      const map: Record<string, number> = {
        F1: 0, F2: 1, F3: 2, F4: 3, F5: 4,
        "1": 0, "2": 1, "3": 2, "4": 3, "5": 4,
      };
      if (e.key in map) {
        e.preventDefault();
        handleSelect(map[e.key]);
      }
      if (e.key === "Enter") {
        if (answers[current] !== undefined && current < (questions.length || 1) - 1) {
          e.preventDefault();
          setCurrent((c) => Math.min((questions.length || 1) - 1, c + 1));
          return;
        }
      }
      if (e.key === "ArrowLeft") setCurrent((c) => Math.max(0, c - 1));
      if (e.key === "ArrowRight")
        setCurrent((c) => Math.min((questions.length || 1) - 1, c + 1));
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, answers, current, questions.length, confirmFinishOpen, zoomSrc]);

  const handleSelect = (optIdx: number) => {
    if (answers[current] !== undefined) return;
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
      addWrongAnswer(userId, q).catch(() => {});
    }
    recordQuestionAttempt(userId, q.id, isCorrect, "ticket").catch(() => {});
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
        <p>{t("common.loading", "Yuklanmoqda...")}</p>
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

    if (errorMsg) {
      return (
        <div className="exam-result-screen">
          <div className="exam-result-card">
            <div className="exam-result-icon failed">
              <IconAlertTriangle size={36} stroke={1.5} />
            </div>
            <h2 className="exam-result-title failed">{t("common.error", "Xatolik")}</h2>
            <p className="exam-result-sub">{errorMsg}</p>
            <div className="exam-result-actions">
              <button className="exam-result-btn primary" onClick={onBack} type="button">
                <IconArrowLeft size={18} /> {t("common.backToHome", "Bosh sahifaga qaytish")}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <SEO
          title={`${localizeName(ticket)} — ${t("seo.examResult.title", "Natija")}`}
          description={t("seo.ticketExam.desc", "Bilet imtihon natijalari")}
          canonical={`/tickets/${ticket.id}`}
          noIndex={true}
        />
        <div style={{ height: "100vh", maxHeight: "100dvh", overflowY: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <GamificationResult
            mode="ticket"
            score={score}
            correct={correct}
            wrong={wrong}
            unanswered={unanswered}
            total={total}
            title={localizeName(ticket)}
            badge={`${ticket.question_count} ${t("activeTest.questionsCount", "savol")} • ${t("exam.passingScore", "O'tish bali")}: ${ticket.passing_score}%`}
            isTimeUp={isTimeUp}
            onRetry={loadQuestions}
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
        title={`${localizeName(ticket)} — ${t("seo.ticketExam.title", "Bilet Imtihoni")}`}
        description={t("seo.ticketExam.desc", "Prava Online bilet imtihoni.")}
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
              {t("exam.finish", "Yakunlash")} <IconX size={15} />
            </button>
            <span
              className={`exam-timer${timerIsRed ? " red" : timerIsYellow ? " yellow" : ""}`}
              role="timer"
              aria-label={`${t("exam.timeLeft", "Qolgan vaqt")}: ${formatTime(timeLeft)}`}
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
                ? t("saved.remove", "Saqlangandan o'chirish")
                : t("common.save", "Saqlash")
            }
            title={
              savedIds.has(q.id)
                ? t("saved.remove", "Saqlangandan o'chirish")
                : t("common.save", "Saqlash")
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
                  <span className="exam-option-key">F{idx + 1}</span>
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
                    ? t("marathon.hideExplanation", "Izohni yashirish")
                    : t("marathon.showExplanation", "Izohni ko'rish")}
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
            >
              <IconChevronLeft size={17} /> {t("exam.prev", "Oldingi")}
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
              >
                {t("exam.finish", "Yakunlash")} <IconCheck size={17} />
              </button>
            ) : (
              <button
                className="exam-nav-btn primary"
                onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
                type="button"
              >
                {t("exam.next", "Keyingi")} <IconChevronRight size={17} />
              </button>
            )}
          </div>
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
    </>
  );
}
