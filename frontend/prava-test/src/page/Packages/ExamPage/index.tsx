import { resolveUserScopeId } from "@/utils/userScope";
import { getExamRules, durationSecondsFor, isExamPassed } from "@/services/examRules";
import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";
import type { OfflineQuestion } from "../../../types/desktop";
import type { PackageExamData, Question } from "../../../types/api";
import {
  finalizeExamResult,
  addWrongAnswer,
  toggleSavedQuestion,
  getSavedQuestions,
  recordQuestionAttempt,
  getExamQuestions,
  pickLocalized,
} from "../../../services/desktopAdapter";
import api from "../../../api/api";
import { ExamDesktopView, useDebouncedSave, countResults } from "../../../features/ExamDesktop";
import "../../../styles/exam-desktop.css";
import SEO from "../../../components/common/SEO";
import GamificationResult from "../../../components/quiz/GamificationResult";
import QuizReviewModal from "../../../components/quiz/QuizReviewModal";
import { dbClient } from "../../../database";
import { generateUUID } from "../../../sync/outboxQueue";
import { IconArrowLeft, IconAlertTriangle, IconRefresh } from "@tabler/icons-react";

type Phase = "loading" | "exam" | "result";

interface Answer {
  selected: number;
  correct: number;
}

function convertApiQuestionToOffline(q: Question): OfflineQuestion {
  return {
    id: q.id,
    topic_id: null,
    order_num: 0,
    text_uzl: q.text?.uzl || "",
    text_uzc: q.text?.uzc ?? null,
    text_en: null,
    text_ru: q.text?.ru ?? null,
    options_json: JSON.stringify(
      (q.options || []).map((opt, idx) => ({
        key: String(idx + 1),
        text_uzl: opt.text?.uzl || "",
        text_uzc: opt.text?.uzc || opt.text?.uzl || "",
        text_ru: opt.text?.ru || opt.text?.uzl || "",
      }))
    ),
    correct_option: q.correctOptionIndex ?? 0,
    image_path: q.imageUrl ?? null,
    explanation_uzl: q.explanation?.uzl ?? null,
    explanation_uzc: q.explanation?.uzc ?? null,
    explanation_en: null,
    explanation_ru: q.explanation?.ru ?? null,
  };
}

export default function PackageExamPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = resolveUserScopeId(user);

  const packageId = Number(id) || 1;
  const [rules] = useState(getExamRules);

  const [phase, setPhase] = useState<Phase>("loading");
  const [questions, setQuestions] = useState<OfflineQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [deadline, setDeadline] = useState<number>(0);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedScore, setSavedScore] = useState(0);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [reviewOpen, setReviewOpen] = useState(false);
  const [packageName, setPackageName] = useState<string>("");

  const localSessionIdRef = useRef<string>(generateUUID());
  const serverSessionIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const questionsRef = useRef(questions);
  questionsRef.current = questions;
  const deadlineRef = useRef(deadline);
  deadlineRef.current = deadline;
  const finishedRef = useRef(false);

  const onBack = () => navigate("/packages");

  useEffect(() => {
    getSavedQuestions(userId)
      .then((entries) => setSavedIds(new Set(entries.map((e) => e.question.id))))
      .catch(() => {});
  }, [userId]);

  const progressSaver = useDebouncedSave((snap: { answers: Record<number, Answer>; index: number }) => {
    const qs = questionsRef.current;
    const { correct: correctSoFar } = countResults(snap.answers);
    const now = Date.now();
    const durationSec = Math.floor((now - startTimeRef.current) / 1000);
    const remainingSec = Math.max(0, Math.floor((deadlineRef.current - now) / 1000));
    return dbClient
      .saveExamSession({
        local_id: localSessionIdRef.current,
        server_id: serverSessionIdRef.current,
        exam_type: "EXAM",
        status: "IN_PROGRESS",
        total_questions: qs.length,
        correct_answers: correctSoFar,
        score: qs.length > 0 ? Math.round((correctSoFar / qs.length) * 100) : 0,
        passed: false,
        duration_seconds: durationSec,
        time_remaining_seconds: remainingSec,
        deadline_at: deadlineRef.current,
        target_id: packageId,
        started_at: startTimeRef.current,
        completed_at: null,
        answers_json: JSON.stringify(snap.answers),
        synced: 0,
      })
      .catch(() => {});
  }, 500);

  const persistProgress = useCallback(() => {
    void progressSaver.saveNow({ answers: answersRef.current, index: current });
  }, [current, progressSaver]);

  const loadQuestions = useCallback(
    async () => {
      setPhase("loading");
      setErrorMsg(null);
      finishedRef.current = false;
      localSessionIdRef.current = generateUUID();

      try {
        // Try online start first if available
        let loadedQs: OfflineQuestion[] = [];
        let sessionDurationSec = durationSecondsFor("real", 20, rules);
        let name = t("packages.defaultName", "Paket #{{n}}", { n: packageId });

        try {
          const res = await api.post<PackageExamData>("/api/v2/exams/start-visible", {
            packageId,
          });
          if (res.data?.data) {
            const data = res.data.data;
            serverSessionIdRef.current = data.sessionId;
            if (data.packageName) {
              name = pickLocalized({
                uzl: data.packageName.uzl || name,
                uzc: data.packageName.uzc || name,
                ru: data.packageName.ru || name,
              });
            }
            if (Array.isArray(data.questions) && data.questions.length > 0) {
              loadedQs = data.questions.map(convertApiQuestionToOffline);
            }
            if (data.durationMinutes) {
              sessionDurationSec = data.durationMinutes * 60;
            }
          }
        } catch {
          // Offline fallback: load local curriculum / exam questions
          loadedQs = await getExamQuestions(20);
        }

        if (loadedQs.length === 0) {
          setErrorMsg(t("exam.noQuestions", "Savollar topilmadi"));
          return;
        }

        const now = Date.now();
        startTimeRef.current = now;
        const newDeadline = now + sessionDurationSec * 1000;

        setPackageName(name);
        setQuestions(loadedQs);
        questionsRef.current = loadedQs;
        setAnswers({});
        setCurrent(0);
        setDeadline(newDeadline);
        deadlineRef.current = newDeadline;
        setIsTimeUp(false);
        setPhase("exam");

        dbClient
          .saveExamSession({
            local_id: localSessionIdRef.current,
            server_id: serverSessionIdRef.current,
            exam_type: "EXAM",
            status: "IN_PROGRESS",
            total_questions: loadedQs.length,
            correct_answers: 0,
            score: 0,
            passed: false,
            duration_seconds: 0,
            time_remaining_seconds: sessionDurationSec,
            deadline_at: newDeadline,
            target_id: packageId,
            started_at: now,
            completed_at: null,
            answers_json: "{}",
            synced: 0,
          })
          .catch(() => {});
      } catch (err: any) {
        setErrorMsg(err?.message || t("errors.serverError", "Xatolik yuz berdi"));
      }
    },
    [packageId, rules, t]
  );

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  const handleSelect = useCallback(
    (optionIndex: number) => {
      const q = questionsRef.current[current];
      if (!q || answersRef.current[current]) return;

      const isCorrect = optionIndex === q.correct_option;
      const ans: Answer = { selected: optionIndex, correct: q.correct_option };
      const nextAnswers = { ...answersRef.current, [current]: ans };

      setAnswers(nextAnswers);
      answersRef.current = nextAnswers;
      progressSaver.schedule({ answers: nextAnswers, index: current });

      void recordQuestionAttempt(userId, q.id, isCorrect, "package");
      if (!isCorrect) {
        addWrongAnswer(userId, q);
      }
    },
    [current, progressSaver, userId]
  );

  const handleGoto = useCallback((idx: number) => {
    setCurrent(idx);
  }, []);

  const handleFinish = useCallback(async () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    progressSaver.cancel();

    const qs = questionsRef.current;
    const finalAns = answersRef.current;
    const { correct, wrong } = countResults(finalAns);
    const total = qs.length || 20;
    const unanswered = total - (correct + wrong);
    const passed = isExamPassed({ mode: "package", total, correct, wrong, unanswered }, rules);
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

    setSavedScore(score);

    try {
      await finalizeExamResult(
        {
          userId,
          score,
          correctAnswers: correct,
          wrongAnswers: wrong,
          totalQuestions: total,
          durationSeconds: duration,
          passed,
          mode: "package",
          examType: "package",
          unanswered,
        },
        {
          serverSessionId: serverSessionIdRef.current,
          localSessionId: localSessionIdRef.current,
          examType: "package",
          targetId: packageId,
          questions: qs,
          answers: finalAns,
          durationSeconds: duration,
        }
      );
    } catch {}

    setPhase("result");
  }, [packageId, progressSaver, rules, userId]);

  const handleTimeUp = useCallback(() => {
    setIsTimeUp(true);
    void handleFinish();
  }, [handleFinish]);

  const handleExit = useCallback(() => {
    persistProgress();
    onBack();
  }, [persistProgress, onBack]);

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

  // ─── LOADING & ERROR PHASES ───
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

  if (errorMsg) {
    return (
      <div className="exam-result-screen">
        <div className="exam-result-card" style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
          <div className="exam-result-icon failed">
            <IconAlertTriangle size={36} stroke={1.5} />
          </div>
          <h2 className="exam-result-title failed">{t("common.error", "Xatolik")}</h2>
          <p className="exam-result-sub" style={{ marginBottom: 20 }}>
            {errorMsg}
          </p>
          <div className="exam-result-actions" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              className="exam-result-btn primary"
              onClick={() => void loadQuestions()}
              type="button"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px 20px",
                fontWeight: 600,
                borderRadius: 10,
              }}
            >
              <IconRefresh size={18} /> {t("common.retry", "Qayta urinish")}
            </button>
            <button
              className="exam-result-btn secondary"
              onClick={onBack}
              type="button"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "10px 20px",
                borderRadius: 10,
              }}
            >
              <IconArrowLeft size={18} /> {t("common.back", "Orqaga")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── RESULT PHASE ───
  if (phase === "result") {
    const { correct, wrong } = countResults(answers);
    const total = questions.length;
    const unanswered = total - (correct + wrong);
    const score = total > 0 ? Math.round((correct / total) * 100) : savedScore;

    return (
      <>
        <SEO
          title={t("activeTest.results", "Imtihon natijasi")}
          description={t("exam.resultSeoDesc", "Imtihon natijalari va statistikasi")}
          canonical={`/packages/${packageId}`}
        />
        <div style={{ height: "100%", flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <GamificationResult
            score={score}
            correct={correct}
            wrong={wrong}
            unanswered={unanswered}
            total={total}
            title={packageName || t("packages.defaultName", "Paket #{{n}}", { n: packageId })}
            badge={`${total} ${t("activeTest.questionsCount", "savol")}`}
            isTimeUp={isTimeUp}
            passed={isExamPassed({ mode: "package", total, correct, wrong, unanswered }, rules)}
            onRetry={() => void loadQuestions()}
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

  // ─── EXAM PHASE (RealExam Terminal Interface) ───
  return (
    <>
      <SEO
        title={`${packageName || t("packages.defaultName", "Paket #{{n}}", { n: packageId })} - Prava Online`}
        description={t("packages.examSeoDesc", "Prava Online maxsus o'quv paketi imtihoni.")}
        canonical={`/packages/${packageId}`}
      />
      <ExamDesktopView
        mode="package"
        label={packageName || t("packages.defaultName", "Paket #{{n}}", { n: packageId })}
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
