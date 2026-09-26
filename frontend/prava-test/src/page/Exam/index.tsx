import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import type { OfflineQuestion } from "../../types/desktop";
import {
  startSecureExamSession,
  checkExamAnswer,
  saveExamResult,
  addWrongAnswer,
  recordQuestionAttempt,
  localizeQ,
  localizeOpt,
  parseOptions,
  submitExamSession,
} from "../../services/desktopAdapter";
import SecureImage from "../../components/common/SecureImage";
import ImageZoomModal from "../../components/common/ImageZoomModal";
import ColorMode from "../../components/other/ColorMode";
import LanguagePicker from "../../components/language/LanguagePicker";
import SEO from "../../components/common/SEO";
import GamificationResult from "../../components/quiz/GamificationResult";
import QuizReviewModal from "../../components/quiz/QuizReviewModal";
import ConfirmFinishModal from "../../components/quiz/ConfirmFinishModal";
import ExamTimerAnnouncer from "../../components/quiz/ExamTimerAnnouncer";
import { useExamTimer } from "../../hooks/useExamTimer";
import { useExamRules } from "../../services/examRules";
import {
  IconChevronLeft,
  IconChevronRight,
  IconCheck,
  IconX,
  IconArrowLeft,
  IconSteeringWheel,
  IconAlertTriangle,
} from "@tabler/icons-react";

type Phase = "loading" | "exam" | "result";

/**
 * `correct` = -1 — to'g'ri javob hali noma'lum (secure rejim: server
 * `/check-answer` javobi kelmagan yoki tarmoq xatosi).
 */
interface Answer {
  selected: number;
  correct: number;
}

const isKnown = (a: Answer) => a.correct >= 0;
const isRight = (a: Answer) => isKnown(a) && a.selected === a.correct;
const isWrong = (a: Answer) => isKnown(a) && a.selected !== a.correct;

const ALLOWED_EXAM_COUNTS = [20, 40, 50, 60, 80, 100];

export default function Exam_Page() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const userId = user?.id ? Number(user.id) : 1;

  const countParam = Number(searchParams.get("count"));
  const questionCount = ALLOWED_EXAM_COUNTS.includes(countParam) ? countParam : 20;
  // Qoidalar serverdan (GET /api/v1/public/exam-rules), offline'da default.
  // real.maxWrong rasmiy `real.questionCount` savolga nisbatan — boshqa sonlar uchun
  // proporsional: 20→2, 40→4, 50→5, 60→6, 80→8, 100→10 (default qoidalarda).
  const rules = useExamRules();
  const MAX_WRONG = Math.floor(
    (rules.real.maxWrong * questionCount) / Math.max(1, rules.real.questionCount),
  );
  const examDurationSeconds = questionCount * rules.real.secondsPerQuestion;

  const [phase, setPhase] = useState<Phase>("loading");
  const [questions, setQuestions] = useState<OfflineQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const [savedScore, setSavedScore] = useState(0);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirmFinishOpen, setConfirmFinishOpen] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // MAX_WRONG oshganda 700 ms kechiktirilgan yakunlash — unmount'da tozalanadi
  const finishDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;
  // Server sessiya ID — komponent darajasida (modul global emas)
  const sessionIdRef = useRef<number | null>(null);
  const finishedRef = useRef(false);

  const onBack = () => navigate("/me");

  // Unmount: kutilayotgan barcha taymerlarni tozalash
  useEffect(() => {
    return () => {
      if (autoRef.current) clearTimeout(autoRef.current);
      if (finishDelayRef.current) clearTimeout(finishDelayRef.current);
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

  // Scroll current question into view
  useEffect(() => {
    const el = document.getElementById(`qnum-${current}`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [current]);

  const loadQuestions = useCallback(() => {
    setPhase("loading");
    setAnswers({});
    answersRef.current = {};
    setCurrent(0);
    setIsTimeUp(false);
    setErrorMsg(null);
    sessionIdRef.current = null;
    finishedRef.current = false;

    // P1-W4: SECURE rejim — to'g'ri javoblar klientga yuklanmaydi,
    // baholash serverda (`/api/v2/exams/submit`).
    startSecureExamSession(questionCount)
      .then(({ sessionId, questions: qs }) => {
        if (qs.length === 0 || !sessionId) {
          setErrorMsg(t("exam.noQuestions", "Savollar topilmadi"));
          setPhase("result");
          return;
        }
        sessionIdRef.current = sessionId;
        setQuestions(qs);
        setPhase("exam");
        startTimeRef.current = Date.now();
      })
      .catch(() => {
        setErrorMsg(t("notification.startError", "Imtihonni boshlashda xatolik yuz berdi"));
        setPhase("result");
      });
  }, [questionCount, t]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const triggerFinish = useCallback(
    (timeUp = false) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      if (finishDelayRef.current) {
        clearTimeout(finishDelayRef.current);
        finishDelayRef.current = null;
      }
      if (autoRef.current) {
        clearTimeout(autoRef.current);
        autoRef.current = null;
      }
      const curAnswers = answersRef.current;
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      // Vaqtinchalik hisob (/check-answer asosida) — server natijasi kelsa almashtiriladi
      const correct = Object.values(curAnswers).filter(isRight).length;
      const total = questions.length || questionCount;
      const score = total > 0 ? Math.round((correct / total) * 100) : 0;
      setSavedScore(score);
      if (!timeUp) setIsTimeUp(false);
      setPhase("result");

      const sessionId = sessionIdRef.current;
      sessionIdRef.current = null;
      if (!sessionId || questions.length === 0) return;

      const answersPayload = questions.map((q, idx) => ({
        questionId: q.id,
        selectedOptionIndex: curAnswers[idx]?.selected ?? null,
      }));
      // Xato bo'lsa submitExamSession o'zi navbatga qo'yadi va bildirishnoma ko'rsatadi
      void submitExamSession(sessionId, answersPayload).then((outcome) => {
        const result = outcome.ok ? outcome.result : null;
        if (!result) {
          // Server natijasi yo'q (navbatga qo'yildi) — lokal statistika vaqtinchalik hisob bilan
          saveExamResult({
            userId,
            score,
            totalQuestions: total,
            correctAnswers: correct,
            durationSeconds: duration,
            examType: "exam",
          }).catch(() => {});
          return;
        }

        // Server natijasidagi to'g'ri javoblar bilan natija/review ma'lumotini yangilash
        const byQid = new Map(
          (result.answerDetails ?? []).map((d) => [d.questionId, d] as const),
        );
        setQuestions((prev) =>
          prev.map((q) => {
            const d = byQid.get(q.id);
            return d && typeof d.correctOptionIndex === "number"
              ? { ...q, correct_option: d.correctOptionIndex }
              : q;
          }),
        );
        const next: Record<number, Answer> = { ...answersRef.current };
        questions.forEach((q, idx) => {
          const d = byQid.get(q.id);
          if (next[idx] && d && typeof d.correctOptionIndex === "number") {
            next[idx] = { ...next[idx], correct: d.correctOptionIndex };
          }
        });
        answersRef.current = next;
        setAnswers(next);

        const serverTotal = result.totalQuestions || total;
        const serverScore =
          result.percentage != null
            ? Math.round(result.percentage)
            : serverTotal > 0
              ? Math.round((result.correctCount / serverTotal) * 100)
              : 0;
        setSavedScore(serverScore);
        saveExamResult({
          userId,
          score: serverScore,
          totalQuestions: serverTotal,
          correctAnswers: result.correctCount,
          durationSeconds: duration,
          examType: "exam",
        }).catch(() => {});
      });
    },
    [questions, questionCount, userId]
  );

  // P2-W5: deadline asosidagi taymer; onExpire bir marta, state updater tashqarisida.
  const { timeLeft, warning: timerWarning } = useExamTimer({
    durationSeconds: examDurationSeconds,
    running: phase === "exam",
    onExpire: () => {
      setIsTimeUp(true);
      triggerFinish(true);
    },
  });

  const handleSelect = (optIdx: number) => {
    if (answers[current] !== undefined || finishedRef.current) return;
    const qIdx = current;
    const q = questions[qIdx];
    if (!q) return;
    const opts = parseOptions(q.options_json);
    if (optIdx >= opts.length) return;
    if (autoRef.current) {
      clearTimeout(autoRef.current);
      autoRef.current = null;
    }

    // Javob darhol qayd etiladi; to'g'riligi serverdan (/check-answer) so'raladi.
    const pendingAns: Record<number, Answer> = {
      ...answersRef.current,
      [qIdx]: { selected: optIdx, correct: -1 },
    };
    setAnswers(pendingAns);
    answersRef.current = pendingAns;

    const advance = () => {
      if (finishedRef.current) return;
      if (qIdx < questions.length - 1) {
        autoRef.current = setTimeout(
          () => setCurrent((c) => (c === qIdx ? c + 1 : c)),
          700,
        );
      }
    };

    void checkExamAnswer(q.id, optIdx).then((res) => {
      if (finishedRef.current) return;
      if (!res) {
        // Tekshirib bo'lmadi (offline) — baho submit paytida serverda hisoblanadi
        advance();
        return;
      }
      const checkedQ: OfflineQuestion = { ...q, correct_option: res.correctOptionIndex };
      setQuestions((prev) => prev.map((pq, i) => (i === qIdx ? checkedQ : pq)));
      if (!res.isCorrect) {
        addWrongAnswer(userId, checkedQ).catch(() => {});
      }
      recordQuestionAttempt(userId, q.id, res.isCorrect, "exam").catch(() => {});

      const newAns: Record<number, Answer> = {
        ...answersRef.current,
        [qIdx]: { selected: optIdx, correct: res.correctOptionIndex },
      };
      setAnswers(newAns);
      answersRef.current = newAns;

      // MAX_WRONG limit check: (10 savolga 1 ta xato)
      const wrongNow = Object.values(newAns).filter(isWrong).length;
      if (wrongNow > MAX_WRONG) {
        if (finishDelayRef.current) clearTimeout(finishDelayRef.current);
        finishDelayRef.current = setTimeout(() => {
          finishDelayRef.current = null;
          triggerFinish(false);
        }, 700);
        return;
      }
      advance();
    });
  };

  // F1–F5 and 1–5 keyboard shortcuts
  useEffect(() => {
    if (phase !== "exam") return;
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      // Tasdiqlash oynasi ochiq: klaviaturani Mantine Modal boshqaradi
      // (Esc = davom etish, Enter = fokusdagi "Yakunlash" tugmasi).
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

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const timerIsRed = timeLeft <= 60;
  const timerIsYellow = !timerIsRed && timeLeft <= 300;

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
    const correct = Object.values(answers).filter(isRight).length;
    const wrong = Object.values(answers).filter(isWrong).length;
    const total = questions.length || questionCount;
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
          title={t("activeTest.results", "Imtihon natijasi")}
          description={t("activeTest.resultsDesc", "Imtihon natijalari va statistikasi")}
          canonical="/exam"
          noIndex={true}
        />
        <div style={{ height: "100vh", maxHeight: "100dvh", overflowY: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <GamificationResult
            mode="real"
            score={score}
            correct={correct}
            wrong={wrong}
            unanswered={unanswered}
            total={total}
            title={t("exam.officialTitle", "Rasmiy DTM Imtihon Simulyatori")}
            badge={`${total} ${t("activeTest.questionsCount", "savol")} • ${MAX_WRONG} ${t("exam.maxWrongAllowed", "tagacha xato")}`}
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
        />
      </>
    );
  }

  // ─── EXAM ───
  const q = questions[current];
  const options = parseOptions(q.options_json);
  const answered = answers[current];
  const correct = Object.values(answers).filter(isRight).length;
  const wrong = Object.values(answers).filter(isWrong).length;

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
        title={t("seo.exam.title", "Rasmiy Sinov Imtihoni — Prava Online")}
        description={t("seo.exam.desc", "YHXX rasmiy imtihoni bilan bir xil vaqt va qoidalardagi haqiqiy sinov simulyatsiyasi.")}
        canonical="/exam"
        noIndex={true}
      />
      <ImageZoomModal src={zoomSrc} onClose={() => setZoomSrc(null)} />
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
            <span className="exam-counter">
              {current + 1} / {questions.length}
            </span>
          </div>

          <div className="exam-topbar-right">
            <span className="exam-score-chip green">
              <IconCheck size={13} /> {correct}
            </span>
            <span className="exam-score-chip red">
              <IconX size={13} /> {wrong} / {MAX_WRONG}
            </span>
            <ColorMode />
            <LanguagePicker />
          </div>
        </div>

        {/* ── Question text ── */}
        <div className="exam-question-header">
          <p className="exam-question-text">{localizeQ(q)}</p>
        </div>

        {/* ── Two-column body ── */}
        <div className="exam-two-col">
          {/* Left: options */}
          <div className="exam-col-options">
            {options.map((opt, idx) => {
              let cls = "exam-option";
              if (answered) {
                if (!isKnown(answered)) {
                  // Server tekshiruvi kutilmoqda / noma'lum
                  if (idx === answered.selected) cls += " selected";
                } else if (idx === answered.correct) cls += " correct";
                else if (idx === answered.selected) cls += " wrong";
              }
              return (
                <button
                  key={idx}
                  className={cls}
                  onClick={() => handleSelect(idx)}
                  disabled={answered !== undefined}
                  type="button"
                >
                  <span className="exam-option-key">F{idx + 1}</span>
                  <span className="exam-option-text">{localizeOpt(opt)}</span>
                  {answered && isKnown(answered) && idx === answered.correct && (
                    <IconCheck size={15} className="opt-icon correct" />
                  )}
                  {answered &&
                    isKnown(answered) &&
                    idx === answered.selected &&
                    idx !== answered.correct && (
                      <IconX size={15} className="opt-icon wrong" />
                    )}
                </button>
              );
            })}
          </div>

          {/* Right: image or placeholder */}
          <div className="exam-col-image">
            {q.image_path ? (
              <SecureImage
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
                  else if (a) cls += !isKnown(a) ? " answered" : isRight(a) ? " correct" : " wrong";
                  return (
                    <button
                      key={i}
                      className={cls}
                      onClick={() => setCurrent(i)}
                      id={`qnum-${i}`}
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
