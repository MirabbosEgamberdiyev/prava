import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import type { OfflineQuestion, OfflineTopic } from "../../types/desktop";
import {
  getMarathonQuestions,
  getTopics,
  addWrongAnswer,
  saveExamResult,
  toggleSavedQuestion,
  getSavedQuestions,
  recordQuestionAttempt,
  localizeQ,
  localizeOpt,
  localizeExp,
  parseOptions,
  getActiveMarathonSessionId,
  submitExamSession,
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
  IconSteeringWheel,
  IconBulb,
  IconBookmark,
  IconBookmarkFilled,
  IconPlayerPlay,
  IconListNumbers,
  IconRefresh,
  IconClock,
} from "@tabler/icons-react";

type Phase = "setup" | "loading" | "exam" | "result";

interface Answer {
  selected: number;
  correct: number;
}

const COUNT_OPTIONS = [20, 50, 100, 0]; // 0 = barchasi

export default function Marafon_Page() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const userId = user?.id ? Number(user.id) : 1;

  const location = useLocation();
  const rawTopicId = searchParams.get("topicId") || (location.state as any)?.topicId;
  const initialTopicId = rawTopicId ? Number(rawTopicId) : null;

  // Setup state
  const [topics, setTopics] = useState<OfflineTopic[]>([]);
  const [selTopic, setSelTopic] = useState<number | null>(initialTopicId);
  const [countIdx, setCountIdx] = useState(0);

  // Exam state
  const [phase, setPhase] = useState<Phase>("setup");
  const [questions, setQuestions] = useState<OfflineQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [showExp, setShowExp] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);

  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answersRef = useRef(answers);
  const activeQnumRef = useRef<HTMLButtonElement | null>(null);
  answersRef.current = answers;

  const localizeTopic = (tp: OfflineTopic): string => {
    if (!tp) return "";
    const l = i18n.language;
    if (l === "uzc" && tp.name_uzc) return tp.name_uzc;
    if (l === "ru" && tp.name_ru) return tp.name_ru;
    return tp.name_uzl || tp.name_ru || tp.name_uzc || "";
  };

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
    getSavedQuestions(userId)
      .then((entries) => {
        if (Array.isArray(entries)) {
          setSavedIds(new Set(entries.filter((e) => e?.question?.id != null).map((e) => e.question.id)));
        }
      })
      .catch(() => {});
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

  const startExam = useCallback(() => {
    setPhase("loading");
    setAnswers({});
    answersRef.current = {};
    setCurrent(0);
    setErrorMsg(null);

    const maxQ =
      selTopic != null
        ? topics.find((t) => t.id === selTopic)?.question_count ?? 0
        : topics.reduce((s, t) => s + (t.question_count || 0), 0);

    const chosenOption = COUNT_OPTIONS[countIdx];
    const limit =
      chosenOption === 0
        ? (maxQ > 0 ? maxQ : 1190)
        : (maxQ > 0 ? Math.min(chosenOption, maxQ) : chosenOption);

    getMarathonQuestions(selTopic ?? undefined, limit)
      .then((qs) => {
        if (qs.length === 0) {
          setErrorMsg(t("marathon.noQuestions", "Savollar topilmadi"));
          setPhase("result");
          return;
        }
        setQuestions(qs);
        setPhase("exam");
      })
      .catch((e) => {
        setErrorMsg(String(e));
        setPhase("result");
      });
  }, [selTopic, countIdx, topics, t]);

  const triggerFinish = useCallback(() => {
    if (autoRef.current) {
      clearTimeout(autoRef.current);
      autoRef.current = null;
    }
    const curAnswers = answersRef.current;
    const correct = Object.values(curAnswers).filter((a) => a.selected === a.correct).length;
    const total = questions.length;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    setPhase("result");
    saveExamResult({
      userId,
      score,
      totalQuestions: total,
      correctAnswers: correct,
      durationSeconds: 0,
      examType: "marathon",
    }).catch(() => {});

    const activeId = getActiveMarathonSessionId();
    if (activeId && questions.length > 0) {
      const submitList = questions.map((q, idx) => ({
        questionId: q.id,
        selectedOptionIndex: curAnswers[idx]?.selected ?? null,
      }));
      submitExamSession(activeId, submitList).catch(() => {});
    }
  }, [questions, userId]);

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
    if (!isCorrect) addWrongAnswer(userId, q).catch(() => {});
    recordQuestionAttempt(userId, q.id, isCorrect, "marathon").catch(() => {});

    const newAns = {
      ...answers,
      [current]: { selected: optIdx, correct: q.correct_option },
    };
    setAnswers(newAns);
    answersRef.current = newAns;

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
    toggleSavedQuestion(userId, q);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(q.id)) next.delete(q.id);
      else next.add(q.id);
      return next;
    });
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

  // ─── SETUP ───
  if (phase === "setup") {
    const maxQ =
      selTopic != null
        ? topics.find((t) => t.id === selTopic)?.question_count ?? 0
        : topics.reduce((s, t) => s + t.question_count, 0);

    return (
      <>
        <SEO
          title="Marafon - Katta test rejimi"
          description="Prava Online marafon sinovi"
          canonical="/marafon"
        />
        <div className="marathon-setup-screen">
          <div className="marathon-setup-card">
            {/* Header */}
            <div className="marathon-setup-header">
              <button
                className="quiz-back-btn"
                onClick={onBack}
                style={{ position: "static" }}
                type="button"
              >
                <IconArrowLeft size={18} />
              </button>
              <h2 className="marathon-setup-title">{t("marathon.title", "Marafon")}</h2>
            </div>

            {/* Topic select */}
            <div className="marathon-setup-section">
              <label className="marathon-setup-label">
                {t("marathon.selectTopic", "Mavzuni tanlang")}
              </label>
              <select
                className="marathon-setup-select"
                value={selTopic ?? ""}
                onChange={(e) =>
                  setSelTopic(e.target.value === "" ? null : Number(e.target.value))
                }
              >
                <option value="">{t("marathon.allTopics", "Barcha mavzular")}</option>
                {topics.map((tp) => (
                  <option key={tp.id} value={tp.id}>
                    {localizeTopic(tp)} ({tp.question_count})
                  </option>
                ))}
              </select>
            </div>

            {/* Question count */}
            <div className="marathon-setup-section">
              <label className="marathon-setup-label">
                {t("marathon.questionCount", "Savollar soni")}
              </label>
              <div className="marathon-count-btns">
                {COUNT_OPTIONS.map((n, idx) => {
                  const isAll = n === 0;
                  const label = isAll
                    ? `${t("marathon.allQuestions", "Barchasi")}${maxQ > 0 ? ` (${maxQ})` : ""}`
                    : String(n);
                  const isOptionExcessive = !isAll && maxQ > 0 && n > maxQ;

                  return (
                    <button
                      key={idx}
                      className={`marathon-count-btn${countIdx === idx ? " active" : ""}`}
                      onClick={() => setCountIdx(idx)}
                      disabled={isOptionExcessive}
                      style={isOptionExcessive ? { opacity: 0.45, cursor: "not-allowed" } : undefined}
                      title={isOptionExcessive ? `${maxQ} ta savol mavjud` : undefined}
                      type="button"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <p className="marathon-setup-hint">
                <IconListNumbers size={13} />
                {t("marathon.available", "Mavjud")}: {maxQ} {t("common.questions", "savol")}
              </p>
            </div>

            {/* Start */}
            <button className="marathon-start-btn" onClick={startExam} type="button">
              <IconPlayerPlay size={18} />
              {t("marathon.startExam", "Marafonni boshlash")}
            </button>
          </div>
        </div>
      </>
    );
  }

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
    const answeredCount = Object.values(answers).length;
    const correct = Object.values(answers).filter((a) => a.selected === a.correct).length;
    const total = questions.length;
    const wrong = answeredCount - correct;
    const unanswered = Math.max(0, total - answeredCount);
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;

    return (
      <>
        <SEO
          title="Marafon natijasi"
          description="Marafon natijalari"
          canonical="/marafon"
        />
        <div className="quiz-result-screen">
          <div className="quiz-result-card">
            <div className={`quiz-result-badge ${errorMsg ? "failed" : "passed"}`}>
              {errorMsg ? <IconX size={34} /> : <IconTrophy size={34} />}
            </div>
            <h2 className="quiz-result-title">
              {errorMsg
                ? t("common.error", "Xatolik")
                : t("marathon.finished", "Marafon yakunlandi")}
            </h2>
            {errorMsg ? (
              <p className="quiz-result-sub">{errorMsg}</p>
            ) : (
              <>
                <div className="quiz-result-score">{score}%</div>
                <div className="quiz-result-stats">
                  <div className="quiz-res-stat">
                    <IconCheck size={18} color="#2f9e44" />
                    <span>
                      {correct} {t("common.correct", "to'g'ri")}
                    </span>
                  </div>
                  <div className="quiz-res-stat">
                    <IconX size={18} color="#e03131" />
                    <span>
                      {wrong} {t("common.wrong", "noto'g'ri")}
                    </span>
                  </div>
                  {unanswered > 0 && (
                    <div className="quiz-res-stat">
                      <IconClock size={18} color="#868e96" />
                      <span>
                        {unanswered} {t("marathon.unanswered", "javob berilmagan")}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
            <div className="quiz-result-actions">
              <button className="quiz-res-btn" onClick={() => setPhase("setup")} type="button">
                <IconRefresh size={16} /> {t("common.retry", "Qayta urinish")}
              </button>
              <button
                className="quiz-res-btn primary"
                onClick={() => navigate("/me")}
                type="button"
              >
                <IconArrowLeft size={16} /> {t("common.backToHome", "Bosh sahifa")}
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
        title="Marafon davom etmoqda"
        description="Prava Online marafon testi"
        canonical="/marafon"
      />
      <div className="exam-screen">
        {/* ── Top bar ── */}
        <div className="exam-topbar">
          <div className="exam-topbar-left">
            <button className="exam-finish-btn" onClick={triggerFinish} type="button">
              {t("exam.finish", "Yakunlash")} <IconX size={15} />
            </button>
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
                          title="1-savol"
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
                          title={`${total}-savol`}
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
                onClick={triggerFinish}
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
