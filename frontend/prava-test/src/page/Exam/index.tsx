import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import type { OfflineQuestion } from "../../types/desktop";
import {
  getExamQuestions,
  saveExamResult,
  addWrongAnswer,
  recordQuestionAttempt,
  localizeQ,
  localizeOpt,
  parseOptions,
} from "../../services/desktopAdapter";
import SecureImage from "../../components/common/SecureImage";
import ImageZoomModal from "../../components/common/ImageZoomModal";
import ColorMode from "../../components/other/ColorMode";
import LanguagePicker from "../../components/language/LanguagePicker";
import SEO from "../../components/common/SEO";
import {
  IconChevronLeft,
  IconChevronRight,
  IconCheck,
  IconX,
  IconClock,
  IconArrowLeft,
  IconTrophy,
  IconRefresh,
  IconSteeringWheel,
} from "@tabler/icons-react";

type Phase = "loading" | "exam" | "result";

interface Answer {
  selected: number;
  correct: number;
}

export default function Exam_Page() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const userId = user?.id ? Number(user.id) : 1;

  const countParam = Number(searchParams.get("count"));
  const questionCount = countParam && countParam > 0 ? countParam : 20;
  const MAX_WRONG = Math.floor(questionCount / 10); // 20→2, 40→4, 50→5, 60→6, 80→8, 100→10

  const [phase, setPhase] = useState<Phase>("loading");
  const [questions, setQuestions] = useState<OfflineQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [timeLeft, setTimeLeft] = useState(questionCount * 60);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const [savedScore, setSavedScore] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const onBack = () => navigate("/me");

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
    setTimeLeft(questionCount * 60);
    setErrorMsg(null);

    getExamQuestions(questionCount)
      .then((qs) => {
        if (qs.length === 0) {
          setErrorMsg(t("exam.noQuestions", "Savollar topilmadi"));
          setPhase("result");
          return;
        }
        setQuestions(qs);
        setPhase("exam");
        startTimeRef.current = Date.now();
      })
      .catch((e) => {
        setErrorMsg(String(e));
        setPhase("result");
      });
  }, [questionCount, t]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const triggerFinish = useCallback(
    (timeUp = false) => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoRef.current) {
        clearTimeout(autoRef.current);
        autoRef.current = null;
      }
      const curAnswers = answersRef.current;
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const correct = Object.values(curAnswers).filter((a) => a.selected === a.correct).length;
      const total = questions.length || questionCount;
      const score = total > 0 ? Math.round((correct / total) * 100) : 0;
      setSavedScore(score);
      if (!timeUp) setIsTimeUp(false);
      setPhase("result");

      saveExamResult({
        userId,
        score,
        totalQuestions: total,
        correctAnswers: correct,
        durationSeconds: duration,
        examType: "exam",
      }).catch(() => {});
    },
    [questions.length, questionCount, userId]
  );

  useEffect(() => {
    if (phase !== "exam") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsTimeUp(true);
          triggerFinish(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, triggerFinish]);

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
    recordQuestionAttempt(userId, q.id, isCorrect, "exam").catch(() => {});

    const newAns: Record<number, Answer> = {
      ...answers,
      [current]: { selected: optIdx, correct: q.correct_option },
    };
    setAnswers(newAns);
    answersRef.current = newAns;

    // MAX_WRONG limit check: (10 savolga 1 ta xato)
    const wrongNow = Object.values(newAns).filter((a) => a.selected !== a.correct).length;
    if (wrongNow > MAX_WRONG) {
      setTimeout(() => triggerFinish(false), 700);
      return;
    }

    if (current < questions.length - 1) {
      autoRef.current = setTimeout(() => setCurrent((c) => c + 1), 700);
    }
  };

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
    const correct = Object.values(answers).filter((a) => a.selected === a.correct).length;
    const wrong = Object.values(answers).length - correct;
    const total = questions.length || questionCount;
    const answered = Object.keys(answers).length;
    const unanswered = total - answered;
    const passed = !isTimeUp && wrong <= MAX_WRONG && answered === total;
    const score = total > 0 ? Math.round((correct / total) * 100) : savedScore;

    return (
      <>
        <SEO
          title="Imtihon natijasi"
          description="Imtihon natijalari va statistikasi"
          canonical="/exam"
        />
        <div className="exam-result-screen">
          <div className="exam-result-card">
            <div className={`exam-result-icon ${passed ? "passed" : "failed"}`}>
              {passed ? <IconTrophy size={40} stroke={1.5} /> : <IconX size={40} stroke={2} />}
            </div>
            <h2 className={`exam-result-title ${passed ? "passed" : "failed"}`}>
              {errorMsg
                ? t("common.error", "Xatolik")
                : isTimeUp
                ? t("exam.timeUp", "Vaqt tugadi!")
                : passed
                ? t("exam.passed", "Imtihondan o'tdingiz!")
                : t("exam.failed", "Imtihondan o'ta olmadingiz")}
            </h2>
            {errorMsg ? (
              <p className="exam-result-sub">{errorMsg}</p>
            ) : (
              <>
                <div className="exam-result-score">{score}%</div>
                <div className="exam-result-stats">
                  <div className="exam-result-stat green">
                    <IconCheck size={18} />
                    <div>
                      <div className="exam-stat-val">{correct}</div>
                      <div className="exam-stat-lbl">{t("common.correct", "To'g'ri")}</div>
                    </div>
                  </div>
                  <div className="exam-result-stat red">
                    <IconX size={18} />
                    <div>
                      <div className="exam-stat-val">{wrong}</div>
                      <div className="exam-stat-lbl">{t("common.wrong", "Noto'g'ri")}</div>
                    </div>
                  </div>
                  {unanswered > 0 && (
                    <div className="exam-result-stat gray">
                      <IconClock size={18} />
                      <div>
                        <div className="exam-stat-val">{unanswered}</div>
                        <div className="exam-stat-lbl">
                          {t("exam.unanswered", "Javob berilmagan")}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <p className="exam-result-sub">
                  {t("exam.maxWrong", "Ruxsat etilgan xatolar soni: {{count}} ta", {
                    count: MAX_WRONG,
                  })}
                </p>
              </>
            )}
            <div className="exam-result-actions">
              <button className="exam-result-btn primary" onClick={onBack} type="button">
                <IconArrowLeft size={18} /> {t("common.backToHome", "Bosh sahifaga qaytish")}
              </button>
              <button className="exam-result-btn" onClick={loadQuestions} type="button">
                <IconRefresh size={18} /> {t("exam.retry", "Qayta topshirish")}
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
  const correct = Object.values(answers).filter((a) => a.selected === a.correct).length;
  const wrong = Object.values(answers).length - correct;

  return (
    <>
      <SEO
        title="Imtihon topshirish"
        description="Prava Online haydovchilik imtihoni."
        canonical="/exam"
      />
      {zoomSrc && <ImageZoomModal src={zoomSrc} onClose={() => setZoomSrc(null)} />}
      <div className="exam-screen">
        {/* ── Top bar ── */}
        <div className="exam-topbar">
          <div className="exam-topbar-left">
            <button
              className="exam-finish-btn"
              onClick={() => triggerFinish(false)}
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
                  else if (a) cls += a.selected === a.correct ? " correct" : " wrong";
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
                onClick={() => triggerFinish(false)}
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
