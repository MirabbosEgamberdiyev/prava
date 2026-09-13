import { useState, useEffect, useRef, useCallback } from "react";
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
import {
  IconChevronLeft,
  IconChevronRight,
  IconCheck,
  IconX,
  IconArrowLeft,
  IconTrophy,
  IconRefresh,
  IconSteeringWheel,
  IconAlertTriangle,
  IconBulb,
} from "@tabler/icons-react";

type Phase = "loading" | "exam" | "result";

interface Answer {
  selected: number;
  correct: number;
}

export default function WrongExam_Page() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id ? Number(user.id) : 1;

  const [phase, setPhase] = useState<Phase>("loading");
  const [questions, setQuestions] = useState<OfflineQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedScore, setSavedScore] = useState(0);
  const [showExp, setShowExp] = useState(false);
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const [fixedCount, setFixedCount] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const onBack = () => navigate("/wrong-answers");

  const loadQuestions = useCallback(() => {
    setPhase("loading");
    setAnswers({});
    answersRef.current = {};
    setCurrent(0);
    setErrorMsg(null);
    setFixedCount(0);

    getWrongAnswers(userId)
      .then((entries) => {
        const qs = entries.map((e) => e.question);
        if (qs.length === 0) {
          setErrorMsg(t("wrongAnswers.emptySub", "Xatolar mavjud emas"));
          setPhase("result");
          return;
        }
        setQuestions(qs);
        setTimeLeft(qs.length * 60);
        setPhase("exam");
        startTimeRef.current = Date.now();
      })
      .catch((e) => {
        setErrorMsg(String(e));
        setPhase("result");
      });
  }, [userId, t]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

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

  const triggerFinish = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoRef.current) {
      clearTimeout(autoRef.current);
      autoRef.current = null;
    }
    const curAnswers = answersRef.current;
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const correct = Object.values(curAnswers).filter((a) => a.selected === a.correct).length;
    const total = questions.length;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    setSavedScore(score);
    setPhase("result");

    saveExamResult({
      userId,
      score,
      totalQuestions: total,
      correctAnswers: correct,
      durationSeconds: duration,
      examType: "wrong_practice",
    }).catch(() => {});
  }, [questions.length, userId]);

  useEffect(() => {
    if (phase !== "exam") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          triggerFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, triggerFinish]);

  useEffect(() => {
    document.getElementById(`wrong-qnum-${current}`)?.scrollIntoView({
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

      const map: Record<string, number> = {
        F1: 0, F2: 1, F3: 2, F4: 3, F5: 4,
        "1": 0, "2": 1, "3": 2, "4": 3, "5": 4,
      };
      if (e.key in map) {
        e.preventDefault();
        handleSelect(map[e.key]);
      }
      if (e.key === "ArrowLeft") setCurrent((c) => Math.max(0, c - 1));
      if (e.key === "ArrowRight")
        setCurrent((c) => Math.min((questions.length || 1) - 1, c + 1));
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, answers, current, questions.length]);

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
    if (isCorrect) {
      removeWrongAnswer(userId, q.id).catch(() => {});
      setFixedCount((c) => c + 1);
    } else {
      addWrongAnswer(userId, q).catch(() => {});
    }
    recordQuestionAttempt(userId, q.id, isCorrect, "wrong_practice").catch(() => {});

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
    const total = questions.length;
    const answered = Object.keys(answers).length;
    const unanswered = total - answered;
    const score = total > 0 ? Math.round((correct / total) * 100) : savedScore;
    const passed = total > 0 && wrong === 0 && answered === total;

    return (
      <>
        <SEO
          title="Xatolar amaliyoti natijasi"
          description="Xatolar ustida ishlash natijalari"
          canonical="/wrong-exam"
        />
        <div className="exam-result-screen">
          <div className="exam-result-card">
            <div className="ticket-result-label">
              <IconAlertTriangle size={16} />
              {t("wrongAnswers.title", "Xatolar ustida ishlash")}
            </div>
            {errorMsg ? (
              <>
                <div className="exam-result-icon passed">
                  <IconCheck size={36} stroke={1.5} />
                </div>
                <h2 className="exam-result-title passed">
                  {t("wrongAnswers.emptyTitle", "Xatolar yo'q!")}
                </h2>
                <p className="exam-result-sub">{errorMsg}</p>
              </>
            ) : (
              <>
                <div className={`exam-result-icon ${passed ? "passed" : "failed"}`}>
                  {passed ? (
                    <IconTrophy size={36} stroke={1.5} />
                  ) : (
                    <IconX size={36} stroke={2} />
                  )}
                </div>
                <h2 className={`exam-result-title ${passed ? "passed" : "failed"}`}>
                  {passed
                    ? t("exam.passed", "Barcha xatolar to'g'rilandi!")
                    : t("exam.failed", "Hali to'g'rilanmagan xatolar bor")}
                </h2>
                <div className="exam-result-score">{score}%</div>
                <div className="exam-result-stats">
                  <div className="exam-result-stat green">
                    <div className="exam-stat-val">{correct}</div>
                    <div className="exam-stat-lbl">{t("common.correct", "To'g'ri")}</div>
                  </div>
                  <div className="exam-result-stat red">
                    <div className="exam-stat-val">{wrong}</div>
                    <div className="exam-stat-lbl">{t("common.wrong", "Noto'g'ri")}</div>
                  </div>
                  {unanswered > 0 && (
                    <div className="exam-result-stat gray">
                      <div className="exam-stat-val">{unanswered}</div>
                      <div className="exam-stat-lbl">
                        {t("exam.unanswered", "Javob berilmagan")}
                      </div>
                    </div>
                  )}
                </div>
                {fixedCount > 0 && (
                  <p className="exam-result-sub">
                    {t(
                      "wrongAnswers.fixedCount",
                      "{{count}} ta savol xatolar ro'yxatidan olib tashlandi",
                      { count: fixedCount }
                    )}
                  </p>
                )}
              </>
            )}
            <div className="exam-result-actions">
              <button className="exam-result-btn primary" onClick={onBack} type="button">
                <IconArrowLeft size={16} /> {t("common.backToHome", "Bosh sahifaga qaytish")}
              </button>
              <button className="exam-result-btn" onClick={loadQuestions} type="button">
                <IconRefresh size={16} /> {t("exam.retry", "Qayta topshirish")}
              </button>
            </div>
          </div>
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
        title="Xatolar amaliyoti"
        description="Prava Online xatolar ustida ishlash"
        canonical="/wrong-exam"
      />
      <div className="exam-screen">
        {/* ── Top bar ── */}
        <div className="exam-topbar">
          <div className="exam-topbar-left">
            <button
              className="exam-finish-btn"
              onClick={() => triggerFinish()}
              type="button"
            >
              {t("exam.finish", "Yakunlash")} <IconX size={15} />
            </button>
            <span
              className={`exam-timer${timerIsRed ? " red" : timerIsYellow ? " yellow" : ""}`}
            >
              {formatTime(timeLeft)}
            </span>
          </div>

          <div className="exam-topbar-center">
            <span className="exam-ticket-label">
              <IconAlertTriangle size={14} /> {t("wrongAnswers.title", "Xatolar ustida ishlash")}
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

        {zoomSrc && <ImageZoomModal src={zoomSrc} onClose={() => setZoomSrc(null)} />}

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
                onClick={() => triggerFinish()}
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
    </>
  );
}
