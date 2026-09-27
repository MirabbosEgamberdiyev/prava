import { useState, useEffect, useRef } from "react";
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
import KeyboardHint from "../../components/quiz/KeyboardHint";
import { useExamTimer } from "../../hooks/useExamTimer";
import { useExamHotkeys } from "../../hooks/useExamHotkeys";
import { useExamLeaveGuard } from "../../hooks/useExamLeaveGuard";
import {
  durationSecondsFor,
  getExamRulesSync,
  isExamPassed,
  maxAllowedWrong,
  useExamRules,
} from "../../services/examRules";
import {
  buildExamLoaderKey,
  clearExamSnapshot,
  readExamSnapshot,
  writeExamSnapshot,
  type ExamSnapshot,
} from "../../services/examSnapshot";
import { errorKeyFor, getErrorMessage } from "../../types/errors";
import { reportError } from "../../utils/monitoring";
import { scopedUserId } from "../../utils/userScope";
import {
  IconChevronLeft,
  IconChevronRight,
  IconCheck,
  IconX,
  IconArrowLeft,
  IconSteeringWheel,
  IconAlertTriangle,
  IconRefresh,
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

/** Yuklash muvaffaqiyatsiz: savol yo'q yoki xato (xato obyekti — matn render paytida tarjima qilinadi). */
type Failure = { kind: "empty" } | { kind: "error"; error: unknown };

const isKnown = (a: Answer) => a.correct >= 0;
const isRight = (a: Answer) => isKnown(a) && a.selected === a.correct;
const isWrong = (a: Answer) => isKnown(a) && a.selected !== a.correct;

const ALLOWED_EXAM_COUNTS = [20, 40, 50, 60, 80, 100];

export default function Exam_Page() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const userId = scopedUserId(user);

  // Qoidalar serverdan (GET /api/v1/public/exam-rules), offline'da default.
  const rules = useExamRules();
  // Standart savollar soni — rasmiy `real.questionCount` (mount paytidagi qiymat
  // muzlatiladi: qoidalar kechikib yuklansa imtihon qayta boshlanmasin).
  const [defaultCount] = useState(() => getExamRulesSync().real.questionCount);
  const countParam = Number(searchParams.get("count"));
  const questionCount = ALLOWED_EXAM_COUNTS.includes(countParam) ? countParam : defaultCount;
  // Ruxsat etilgan xatolar: floor(real.maxWrong × savollar / real.questionCount)
  // (default 3/20 qoidasida: 20→3, 40→6, 50→7, 60→9, 80→12, 100→15).
  const MAX_WRONG = maxAllowedWrong(questionCount, rules);

  const [phase, setPhase] = useState<Phase>("loading");
  const [questions, setQuestions] = useState<OfflineQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const [savedScore, setSavedScore] = useState(0);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirmFinishOpen, setConfirmFinishOpen] = useState(false);
  /** Taymer davomiyligi (soniya) — start/resume paytida absolyut deadline'dan hisoblanadi. */
  const [timerSeconds, setTimerSeconds] = useState(0);

  const startTimeRef = useRef<number>(Date.now());
  const deadlineRef = useRef<number | null>(null);
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // MAX_WRONG oshganda 700 ms kechiktirilgan yakunlash — unmount'da tozalanadi
  const finishDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const questionsRef = useRef(questions);
  questionsRef.current = questions;
  // Server sessiya ID — komponent darajasida (modul global emas)
  const sessionIdRef = useRef<number | null>(null);
  const finishedRef = useRef(false);
  // Eskirgan (bekor qilingan) yuklash javoblarini e'tiborsiz qoldirish uchun
  const loadSeqRef = useRef(0);

  // W-01: savollarni qayta yuklash FAQAT shu kalit o'zgarganda — til (t) unga kirmaydi.
  const loaderKey = buildExamLoaderKey({ mode: "exam", userId, questionCount });

  const guard = useExamLeaveGuard(phase === "exam", () => clearExamSnapshot("exam"));

  const onBack = () => navigate("/me");

  // Unmount: kutilayotgan barcha taymerlarni tozalash
  useEffect(() => {
    return () => {
      if (autoRef.current) clearTimeout(autoRef.current);
      if (finishDelayRef.current) clearTimeout(finishDelayRef.current);
    };
  }, []);

  // Scroll current question into view
  useEffect(() => {
    const el = document.getElementById(`qnum-${current}`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [current]);

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
    const seq = ++loadSeqRef.current;
    clearExamSnapshot("exam");
    setPhase("loading");
    resetState();

    // P1-W4: SECURE rejim — to'g'ri javoblar klientga yuklanmaydi,
    // baholash serverda (`/api/v2/exams/submit`).
    startSecureExamSession(questionCount)
      .then(({ sessionId, questions: qs }) => {
        if (seq !== loadSeqRef.current) return;
        if (qs.length === 0 || !sessionId) {
          setFailure({ kind: "empty" });
          setPhase("result");
          return;
        }
        const total = durationSecondsFor(qs.length, getExamRulesSync().real.secondsPerQuestion);
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
        // api.ts 5xx/tarmoq uchun global toast ko'rsatadi — bu yerda faqat inline xato + "Qayta urinish".
        setFailure({ kind: "error", error: err });
        setPhase("result");
      });
  };

  const triggerFinish = (timeUp = false) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearExamSnapshot("exam");
    if (finishDelayRef.current) {
      clearTimeout(finishDelayRef.current);
      finishDelayRef.current = null;
    }
    if (autoRef.current) {
      clearTimeout(autoRef.current);
      autoRef.current = null;
    }
    const qs = questionsRef.current;
    const curAnswers = answersRef.current;
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    deadlineRef.current = null;
    // Vaqtinchalik hisob (/check-answer asosida) — server natijasi kelsa almashtiriladi
    const correct = Object.values(curAnswers).filter(isRight).length;
    const total = qs.length || questionCount;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const answeredCount = Object.keys(curAnswers).length;
    // Vaqtinchalik o'tdi/o'tmadi: tekshirilmagan javoblar to'g'ri deb hisoblanmaydi
    const localPassed = isExamPassed(
      {
        mode: "real",
        total,
        correct,
        wrong: Math.max(0, answeredCount - correct),
        unanswered: Math.max(0, total - answeredCount),
      },
      rules,
    );
    setSavedScore(score);
    setIsTimeUp(timeUp);
    setPhase("result");

    const sessionId = sessionIdRef.current;
    sessionIdRef.current = null;
    if (!sessionId || qs.length === 0) return;

    const answersPayload = qs.map((q, idx) => ({
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
          passed: localPassed,
        }).catch((e) => reportError("exam.saveResult", e));
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
      qs.forEach((q, idx) => {
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
        passed:
          typeof result.isPassed === "boolean"
            ? result.isPassed
            : isExamPassed(
                {
                  mode: "real",
                  total: serverTotal,
                  correct: result.correctCount,
                  wrong: result.incorrectCount,
                  unanswered: result.unansweredCount,
                },
                rules,
              ),
      }).catch((e) => reportError("exam.saveResult", e));
    });
  };

  /**
   * W-07: sahifa yangilangan bo'lsa — sessionStorage snapshot'dan davom etish;
   * muddati o'tgan bo'lsa darhol yakunlash (natija + submit); aks holda yangi imtihon.
   */
  const resumeOrStart = () => {
    const snap = readExamSnapshot<OfflineQuestion, Answer>("exam", loaderKey);
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
      kind: "exam",
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
        addWrongAnswer(userId, checkedQ).catch((e) => reportError("exam.addWrongAnswer", e));
      }
      recordQuestionAttempt(userId, q.id, res.isCorrect, "exam").catch((e) =>
        reportError("exam.recordAttempt", e),
      );

      const newAns: Record<number, Answer> = {
        ...answersRef.current,
        [qIdx]: { selected: optIdx, correct: res.correctOptionIndex },
      };
      setAnswers(newAns);
      answersRef.current = newAns;

      // Ruxsat etilgan xatolar soni oshdi — imtihon yakunlanadi
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

  // W-16: yagona klaviatura boshqaruvi (1–5 / A–D, ←/→, Enter)
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
  });

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
        <p>{t("common.loading")}</p>
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
                <IconArrowLeft size={18} /> {t("common.backToHome")}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <SEO
          title={t("activeTest.results")}
          description={t("activeTest.resultsDesc")}
          canonical="/exam"
          noIndex={true}
        />
        <div style={{ height: "100dvh", overflowY: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <GamificationResult
            mode="real"
            score={score}
            correct={correct}
            wrong={wrong}
            unanswered={unanswered}
            total={total}
            title={t("exam.officialTitle")}
            badge={`${total} ${t("dashboard.questionsUnit")} • ${t("exam.maxWrongAllowed", { max: maxAllowedWrong(total, rules) })}`}
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
        title={t("seo.exam.title")}
        description={t("seo.exam.desc")}
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
                  <span className="exam-option-key">{idx + 1}</span>
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
