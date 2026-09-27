import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import type { OfflineQuestion } from "../../types/desktop";
import {
  getWrongAnswers,
  removeWrongAnswer,
  addWrongAnswer,
  saveExamResult,
  recordQuestionAttempt,
  localizeQ,
  localizeOpt,
  localizeExp,
  parseOptions,
} from "../../services/desktopAdapter";
import ColorMode from "../../components/other/ColorMode";
import LanguagePicker from "../../components/language/LanguagePicker";
import ImageZoomModal, { ZoomableImage } from "../../components/common/ImageZoomModal";
import SEO from "../../components/common/SEO";
import GamificationResult from "../../components/quiz/GamificationResult";
import QuizReviewModal from "../../components/quiz/QuizReviewModal";
import ConfirmFinishModal from "../../components/quiz/ConfirmFinishModal";
import ExamTimerAnnouncer from "../../components/quiz/ExamTimerAnnouncer";
import KeyboardHint from "../../components/quiz/KeyboardHint";
import { useExamTimer } from "../../hooks/useExamTimer";
import { useExamHotkeys } from "../../hooks/useExamHotkeys";
import { useExamLeaveGuard } from "../../hooks/useExamLeaveGuard";
import { durationSecondsFor, getExamRulesSync, isExamPassed } from "../../services/examRules";
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
  IconBulb,
  IconRefresh,
} from "@tabler/icons-react";

type Phase = "loading" | "exam" | "result";

interface Answer {
  selected: number;
  correct: number;
}

/** Yuklash natijasi: xatolar ro'yxati bo'sh yoki xato (matn render paytida tarjima qilinadi). */
type Failure = { kind: "empty" } | { kind: "error"; error: unknown };

export default function WrongExam_Page() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = scopedUserId(user);

  const [phase, setPhase] = useState<Phase>("loading");
  const [questions, setQuestions] = useState<OfflineQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [savedScore, setSavedScore] = useState(0);
  const [showExp, setShowExp] = useState(false);
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const [fixedCount, setFixedCount] = useState(0);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirmFinishOpen, setConfirmFinishOpen] = useState(false);
  /**
   * Amaliyot taymeri: savol soni × secondsPerQuestion (exam-rules, default 60 s).
   * Start/resume paytida absolyut deadline'dan hisoblanadi.
   */
  const [timerSeconds, setTimerSeconds] = useState(0);

  const startTimeRef = useRef<number>(Date.now());
  const deadlineRef = useRef<number | null>(null);
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const questionsRef = useRef(questions);
  questionsRef.current = questions;
  const finishedRef = useRef(false);
  const loadSeqRef = useRef(0);

  // W-01: qayta yuklash FAQAT shu kalit o'zgarganda — til (t) unga kirmaydi.
  const loaderKey = buildExamLoaderKey({ mode: "wrong", userId });

  const guard = useExamLeaveGuard(phase === "exam", () => clearExamSnapshot("wrong"));

  const onBack = () => navigate("/wrong-answers");

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
    setFailure(null);
    setFixedCount(0);
    setIsTimeUp(false);
    setReviewOpen(false);
    deadlineRef.current = null;
    finishedRef.current = false;
  };

  const startFresh = () => {
    const seq = ++loadSeqRef.current;
    clearExamSnapshot("wrong");
    setPhase("loading");
    resetState();

    getWrongAnswers(userId)
      .then((entries) => {
        if (seq !== loadSeqRef.current) return;
        const qs = entries.map((e) => e.question);
        if (qs.length === 0) {
          setFailure({ kind: "empty" });
          setPhase("result");
          return;
        }
        const total = durationSecondsFor(qs.length, getExamRulesSync().ticket.secondsPerQuestion);
        const now = Date.now();
        startTimeRef.current = now;
        deadlineRef.current = now + total * 1000;
        setTimerSeconds(total);
        setQuestions(qs);
        questionsRef.current = qs;
        setPhase("exam");
      })
      .catch((err: unknown) => {
        if (seq !== loadSeqRef.current) return;
        setFailure({ kind: "error", error: err });
        setPhase("result");
      });
  };

  useEffect(() => {
    setShowExp(false);
  }, [current]);

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

  const triggerFinish = (timeUp = false) => {
    // Ikki marta yakunlanmasin (taymer + tugma bir vaqtda)
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearExamSnapshot("wrong");
    if (autoRef.current) {
      clearTimeout(autoRef.current);
      autoRef.current = null;
    }
    const curAnswers = answersRef.current;
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    deadlineRef.current = null;
    const correct = Object.values(curAnswers).filter((a) => a.selected === a.correct).length;
    const total = questionsRef.current.length;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    setSavedScore(score);
    setIsTimeUp(timeUp);
    setPhase("result");

    saveExamResult({
      userId,
      score,
      totalQuestions: total,
      correctAnswers: correct,
      durationSeconds: duration,
      examType: "wrong_practice",
      passed: isExamPassed(
        {
          mode: "wrong",
          total,
          correct,
          wrong: Math.max(0, Object.keys(curAnswers).length - correct),
          unanswered: Math.max(0, total - Object.keys(curAnswers).length),
        },
        getExamRulesSync(),
      ),
    }).catch((e) => reportError("wrongExam.saveResult", e));
  };

  /**
   * W-07: sahifa yangilangan bo'lsa — sessionStorage snapshot'dan davom etish;
   * muddati o'tgan bo'lsa darhol yakunlash; aks holda xatolar ro'yxatini yuklash.
   */
  const resumeOrStart = () => {
    const snap = readExamSnapshot<OfflineQuestion, Answer>("wrong", loaderKey);
    if (snap.status === "none") {
      startFresh();
      return;
    }
    loadSeqRef.current++;
    resetState();
    const s = snap.snapshot;
    startTimeRef.current = s.startedAt;
    deadlineRef.current = s.deadline;
    setQuestions(s.questions);
    questionsRef.current = s.questions;
    setAnswers(s.answers);
    answersRef.current = s.answers;
    setCurrent(s.current);
    const fixed = Number(s.extra?.fixedCount);
    setFixedCount(Number.isFinite(fixed) && fixed > 0 ? fixed : 0);
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
      kind: "wrong",
      scope: loaderKey,
      sessionId: null,
      questions,
      answers,
      current,
      deadline: deadlineRef.current,
      startedAt: startTimeRef.current,
      extra: { fixedCount },
    };
    writeExamSnapshot(snapshot);
  }, [phase, questions, answers, current, fixedCount, loaderKey]);

  // P2-W5: deadline asosidagi taymer; onExpire bir marta, state updater tashqarisida.
  const { timeLeft, warning: timerWarning } = useExamTimer({
    durationSeconds: timerSeconds,
    running: phase === "exam",
    onExpire: () => {
      triggerFinish(true);
    },
  });

  useEffect(() => {
    document.getElementById(`wrong-qnum-${current}`)?.scrollIntoView({
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
    if (isCorrect) {
      removeWrongAnswer(userId, q.id).catch((e) => reportError("wrongExam.removeWrongAnswer", e));
      setFixedCount((c) => c + 1);
    } else {
      addWrongAnswer(userId, q).catch((e) => reportError("wrongExam.addWrongAnswer", e));
    }
    recordQuestionAttempt(userId, q.id, isCorrect, "wrong_practice").catch((e) =>
      reportError("wrongExam.recordAttempt", e),
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
    const total = questions.length;
    const answered = Object.keys(answers).length;
    const unanswered = total - answered;
    const score = total > 0 ? Math.round((correct / total) * 100) : savedScore;

    if (failure?.kind === "error") {
      const message = getErrorMessage(failure.error, t(errorKeyFor(failure.error, "common.loadError")));
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

    if (failure?.kind === "empty" || questions.length === 0) {
      return (
        <div className="exam-result-screen">
          <div className="exam-result-card">
            <div className="exam-result-icon passed">
              <IconCheck size={36} stroke={1.5} />
            </div>
            <h2 className="exam-result-title passed">
              {t("wrongAnswers.emptyTitle")}
            </h2>
            <p className="exam-result-sub">
              {t("wrongAnswers.emptySub")}
            </p>
            <div className="exam-result-actions">
              <button className="exam-result-btn primary" onClick={onBack} type="button">
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
          title={t("wrongAnswers.title")}
          description={t("seo.wrongExam.desc")}
          canonical="/wrong-exam"
          noIndex={true}
        />
        <div style={{ height: "100dvh", overflowY: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <GamificationResult
            mode="wrong"
            score={score}
            correct={correct}
            wrong={wrong}
            unanswered={unanswered}
            total={total}
            title={t("wrongAnswers.title")}
            badge={`${total} ${t("dashboard.questionsUnit")}${
              fixedCount > 0 ? ` • ${fixedCount} ${t("wrongAnswers.fixedShort")}` : ""
            }`}
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
  const explanation = answered !== undefined ? localizeExp(q) : null;
  const correct = Object.values(answers).filter((a) => a.selected === a.correct).length;
  const wrong = Object.values(answers).length - correct;

  const handleFinishClick = () => {
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < questions.length) {
      setConfirmFinishOpen(true);
    } else {
      triggerFinish();
    }
  };

  return (
    <>
      <SEO
        title={t("seo.wrongExam.title")}
        description={t("seo.wrongExam.desc")}
        canonical="/wrong-exam"
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
              <IconAlertTriangle size={14} /> {t("wrongAnswers.title")}
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
                      id={`wrong-qnum-${i}`}
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
          triggerFinish();
        }}
      />

      {/* W-07: faol mashg'ulotdan chiqishni tasdiqlash */}
      <ConfirmFinishModal
        variant="leave"
        opened={guard.blocked}
        onCancel={guard.stay}
        onConfirm={guard.leave}
      />
    </>
  );
}
