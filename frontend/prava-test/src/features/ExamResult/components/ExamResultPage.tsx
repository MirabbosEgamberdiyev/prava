import {
  Badge,
  Box,
  Button,
  Center,
  Flex,
  Grid,
  Group,
  Loader,
  Paper,
  RingProgress,
  Stack,
  Text,
  Title,
  Image,
  useComputedColorScheme,
} from "@mantine/core";
import { IconArrowLeft, IconCheck, IconX } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import useSWR from "swr";
import { useLanguage } from "../../../hooks/useLanguage";
import { getImageUrl } from "../../../utils/imageUtils";
import { dbClient } from "../../../database/dbClient";
import storageService from "../../../services/storageService";
import { passPercentForMode, resolveExamOutcome } from "../../../services/examOutcome";
import { getExamRules } from "../../../services/examRules";
import type { LocalizedText } from "../../../types";
import type { ExamResultResponse, AnswerDetail } from "../types";

export function ExamResultPage() {
  const { t } = useTranslation();
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { localize } = useLanguage();
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });

  const [localResult, setLocalResult] = useState<ExamResultResponse["data"] | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!sessionId) return;
    const sid: string = sessionId;
    async function loadLocal() {
      try {
        const localSession = await dbClient.getExamSessionById(sid);
        if (localSession) {
          let answerDetails: AnswerDetail[] = [];
          if (localSession.questions_json && localSession.answers_json) {
            try {
              const qs = JSON.parse(localSession.questions_json);
              const answers = JSON.parse(localSession.answers_json);
              answerDetails = qs.map((q: any, idx: number) => {
                const ans = answers[idx];
                const selected = ans?.selected ?? null;
                const correct = ans?.correct ?? q.correct_option;
                let opts: any[] = [];
                try {
                  opts = typeof q.options_json === "string" ? JSON.parse(q.options_json) : (q.options || []);
                } catch {}
                return {
                  questionId: q.id,
                  questionOrder: idx + 1,
                  questionText: { uzl: q.text_uzl, uzc: q.text_uzc, ru: q.text_ru, en: q.text_en },
                  imageUrl: q.image_url,
                  options: opts.map((opt: any, optIdx: number) => ({
                    id: optIdx,
                    index: optIdx,
                    text: typeof opt === "object" ? opt : { uzl: String(opt) },
                  })),
                  correctOptionIndex: correct,
                  selectedOptionIndex: selected,
                  isCorrect: selected !== null ? selected === correct : null,
                  timeSpentSeconds: null,
                  explanation: { uzl: q.explanation_uzl, uzc: q.explanation_uzc, ru: q.explanation_ru, en: q.explanation_en },
                };
              });
            } catch {}
          }

          const rules = getExamRules();
          const outcome = resolveExamOutcome(
            {
              passed: localSession.passed,
              mode: localSession.mode,
              examType: localSession.exam_type,
              total: localSession.total_questions || rules.real.questionCount,
              correct: localSession.correct_answers,
              wrong: localSession.wrong_answers,
              unanswered: localSession.unanswered,
              score: localSession.score,
            },
            rules
          );
          const isPassed = outcome.passed;
          const mapped: ExamResultResponse["data"] = {
            sessionId: typeof sessionId === "number" ? sessionId : 0,
            packageId: null,
            packageName: null,
            topicId: null,
            topicName: null,
            status: localSession.status,
            isMarathonMode: localSession.exam_type === "MARATHON",
            totalQuestions: outcome.total,
            answeredCount: outcome.correct + outcome.wrong,
            correctCount: localSession.correct_answers,
            incorrectCount: outcome.wrong,
            unansweredCount: outcome.unanswered,
            score: localSession.score,
            percentage: localSession.score,
            isPassed,
            passingScore: passPercentForMode(outcome.mode, rules),
            startedAt: new Date(localSession.started_at).toISOString(),
            finishedAt: localSession.completed_at ? new Date(localSession.completed_at).toISOString() : new Date().toISOString(),
            durationSeconds: localSession.duration_seconds,
            averageTimePerQuestion: localSession.total_questions > 0 ? localSession.duration_seconds / localSession.total_questions : 0,
            answerDetails,
          };

          if (mounted) setLocalResult(mapped);
          return;
        }

        const stored = storageService.getExamHistory().find((h) => String(h.id) === String(sessionId));
        if (stored) {
          const rules = getExamRules();
          const outcome = resolveExamOutcome(
            {
              passed: stored.passed,
              mode: stored.mode,
              examType: stored.examType,
              total: stored.totalQuestions,
              correct: stored.correctAnswers,
              wrong: stored.wrongAnswers,
              unanswered: stored.unanswered,
              score: stored.score,
            },
            rules
          );
          const isPassed = outcome.passed;
          const mapped: ExamResultResponse["data"] = {
            sessionId: typeof sessionId === "number" ? sessionId : 0,
            packageId: null,
            packageName: null,
            topicId: null,
            topicName: null,
            status: "COMPLETED",
            isMarathonMode: stored.examType === "MARATHON" || stored.examType === "marathon",
            totalQuestions: stored.totalQuestions,
            answeredCount: outcome.correct + outcome.wrong,
            correctCount: stored.correctAnswers,
            incorrectCount: outcome.wrong,
            unansweredCount: outcome.unanswered,
            score: stored.score,
            percentage: stored.score,
            isPassed,
            passingScore: passPercentForMode(outcome.mode, rules),
            startedAt: stored.createdAt,
            finishedAt: stored.createdAt,
            durationSeconds: stored.durationSeconds,
            averageTimePerQuestion: stored.totalQuestions > 0 ? stored.durationSeconds / stored.totalQuestions : 0,
            answerDetails: [],
          };
          if (mounted) setLocalResult(mapped);
        }
      } catch {}
    }
    loadLocal();
    return () => {
      mounted = false;
    };
  }, [sessionId]);

  const {
    data: resultResponse,
    isLoading,
    error,
    mutate,
  } = useSWR<ExamResultResponse>(
    sessionId && !isNaN(Number(sessionId)) ? `/api/v2/exams/${sessionId}/result` : null,
  );

  const result = resultResponse?.data || localResult;

  if (isLoading && !result) {
    return (
      <Center h="80vh">
        <Stack align="center">
          <Loader size="lg" />
          <Text c="dimmed">{t("common.loading")}</Text>
        </Stack>
      </Center>
    );
  }

  /*
   * BUG FIX: avval tarmoq/server xatosi ham "natija topilmadi" deb
   * ko'rsatilardi va qayta urinish tugmasi yo'q edi. Agar offline/lokal
   * natija mavjud bo'lsa, xato o'rniga lokal natija ko'rsatiladi.
   */
  if (error && !result) {
    return (
      <Center h="80vh">
        <Stack align="center">
          <Title order={3} c="red">
            {t("common.errorOccurred")}
          </Title>
          <Text c="dimmed" size="sm">
            {t("common.loadError")}
          </Text>
          <Group>
            <Button
              variant="outline"
              leftSection={<IconArrowLeft size={18} />}
              onClick={() => navigate("/me")}
            >
              {t("examResult.backToDashboard")}
            </Button>
            <Button onClick={() => mutate()}>{t("common.retry")}</Button>
          </Group>
        </Stack>
      </Center>
    );
  }

  if (!result) {
    return (
      <Center h="80vh">
        <Stack align="center">
          <Title order={3}>{t("examResult.notFound")}</Title>
          <Button
            leftSection={<IconArrowLeft size={18} />}
            onClick={() => navigate("/me")}
          >
            {t("examResult.backToDashboard")}
          </Button>
        </Stack>
      </Center>
    );
  }

  const durationSeconds = result.durationSeconds ?? 0;
  const avgTimePerQuestion = result.averageTimePerQuestion
    ? Math.round(result.averageTimePerQuestion)
    : result.totalQuestions > 0
      ? Math.round(durationSeconds / result.totalQuestions)
      : 0;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins} ${t("examResult.minutes")} ${secs} ${t("examResult.seconds")}`;
    }
    return `${secs} ${t("examResult.seconds")}`;
  };

  const scrollToReview = () => {
    const el = document.getElementById("exam-review-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="ds-page-wrapper">
      <main className="ds-page-container" style={{ maxWidth: 900 }}>
        {/* Modern Result Card matching Reference Screen 5 */}
        <div className="ref-result-card">
          {/* Centered Circular Gauge */}
          <div className="ref-result-gauge">
            <RingProgress
              size={150}
              thickness={12}
              roundCaps
              sections={[
                {
                  value: result.percentage ?? 0,
                  color: result.isPassed ? "#10b981" : "#ef4444",
                },
              ]}
              label={
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: "var(--g-text)", lineHeight: 1.1 }}>
                    {result.correctCount}/{result.totalQuestions}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: result.isPassed ? "#10b981" : "#ef4444" }}>
                    {(result.percentage ?? 0).toFixed(0)}%
                  </span>
                </div>
              }
            />
          </div>

          {/* Heading & Subtitle */}
          <h1 className="ref-result-title">
            {result.isPassed
              ? t("examResult.congratsTitle", "Ajoyib natija! ⭐")
              : t("examResult.tryAgainTitle", "Qayta urinib ko'ring")}
          </h1>
          <p className="ref-result-sub">
            {t("examResult.summarySubtitle", "Siz {{total}} ta savoldan {{correct}} tasiga to'g'ri javob berdingiz", {
              total: result.totalQuestions,
              correct: result.correctCount,
            })}
          </p>

          {/* 3 Stat Boxes Row */}
          <div className="ref-result-stats-row">
            <div className="ref-result-stat-box" style={{ borderColor: "rgba(16, 185, 129, 0.3)" }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#10b981" }}>{result.correctCount ?? 0}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--g-text-muted)" }}>{t("examResult.correct", "To'g'ri")}</span>
            </div>
            <div className="ref-result-stat-box" style={{ borderColor: "rgba(239, 68, 68, 0.3)" }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#ef4444" }}>{result.incorrectCount ?? 0}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--g-text-muted)" }}>{t("examResult.incorrect", "Xato")}</span>
            </div>
            <div className="ref-result-stat-box">
              <span style={{ fontSize: 22, fontWeight: 800, color: "#38bdf8" }}>{result.unansweredCount ?? 0}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--g-text-muted)" }}>{t("examResult.unanswered", "Javobsiz")}</span>
            </div>
          </div>

          {/* Time Metrics Pills */}
          <div className="ref-result-pills-row">
            <div className="ref-result-pill">
              <span>⏱️</span>
              <span>{t("examResult.timeSpent", "Sarflangan vaqt")}: <strong>{formatDuration(durationSeconds)}</strong></span>
            </div>
            <div className="ref-result-pill">
              <span>⚡</span>
              <span>{t("examResult.avgTimePerQuestion", "O'rtacha vaqt")}: <strong>{avgTimePerQuestion} {t("examResult.seconds", "soniya")}</strong></span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 360, margin: "0 auto" }}>
            {(result.incorrectCount ?? 0) > 0 && (
              <button
                type="button"
                className="ds-btn ds-btn-primary"
                onClick={scrollToReview}
                style={{ width: "100%", height: 44 }}
              >
                <span>{t("examResult.viewMistakes", "Xatolarni ko'rish")}</span>
              </button>
            )}
            <button
              type="button"
              className="ds-btn ds-btn-secondary"
              onClick={() => navigate(`/exam?count=${result.totalQuestions || 20}`)}
              style={{ width: "100%", height: 44 }}
            >
              <span>{t("examResult.retake", "Qayta yechish")}</span>
            </button>
            <button
              type="button"
              className="ds-btn ds-btn-ghost"
              onClick={() => navigate("/me")}
              style={{ width: "100%", height: 44 }}
            >
              <span>{t("examResult.backToDashboard", "Bosh sahifaga")}</span>
            </button>
          </div>
        </div>

        {/* Detailed Answer Review Section */}
        <div id="exam-review-section" style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--g-text)", marginBottom: 16 }}>
            {t("examResult.answerReview", "Savollar tahlili")}
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {(result.answerDetails ?? []).map((answer: AnswerDetail, index: number) => (
              <AnswerReviewCard
                key={answer.questionId}
                answer={answer}
                index={index}
                localize={localize}
                t={t}
                computedColorScheme={computedColorScheme}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function AnswerReviewCard({
  answer,
  index,
  localize,
  t,
  computedColorScheme,
}: {
  answer: AnswerDetail;
  index: number;
  localize: (text: LocalizedText | string | undefined) => string;
  t: (key: string) => string;
  computedColorScheme: string;
}) {
  const isNotAnswered =
    answer.selectedOptionIndex === null ||
    answer.selectedOptionIndex === undefined ||
    answer.selectedOptionIndex === -1;

  return (
    <Paper
      p="md"
      radius="md"
      withBorder
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <Flex justify="space-between" align="center" mb="sm">
        <Text fw={600}>
          {t("examResult.question")} {index + 1}
        </Text>
        {isNotAnswered ? (
          <Badge color="gray" variant="light">
            {t("examResult.notAnswered")}
          </Badge>
        ) : answer.isCorrect ? (
          <Badge
            color="green"
            variant="light"
            leftSection={<IconCheck size={14} />}
          >
            {t("examResult.correct")}
          </Badge>
        ) : (
          <Badge color="red" variant="light" leftSection={<IconX size={14} />}>
            {t("examResult.incorrect")}
          </Badge>
        )}
      </Flex>

      <Text mb="sm" fw={500}>{localize(answer.questionText)}</Text>

      {/* Savol rasmi (yo'l belgilari, chorraha holatlari yoki default) */}
      <Box
        mb="md"
        style={{
          maxHeight: 240,
          display: "flex",
          justifyContent: "center",
          background: "rgba(0, 0, 0, 0.04)",
          borderRadius: "var(--radius)",
          padding: 8,
        }}
      >
        <Image
          src={getImageUrl(answer.imageUrl) || "/question-default.svg"}
          fallbackSrc="/question-default.svg"
          alt={localize(answer.questionText)}
          fit="contain"
          mah={220}
          radius="sm"
        />
      </Box>

      <Grid gutter="xs">
        {answer.options.map((option) => {
          const isCorrect = option.index === answer.correctOptionIndex;
          const isSelected = option.index === answer.selectedOptionIndex;

          let borderColor: string | undefined;
          let bgColor: string | undefined;

          if (isCorrect) {
            borderColor = "var(--mantine-color-green-6)";
            bgColor =
              computedColorScheme === "light"
                ? "var(--mantine-color-green-0)"
                : "var(--mantine-color-green-9)";
          } else if (isSelected && !isCorrect) {
            borderColor = "var(--mantine-color-red-6)";
            bgColor =
              computedColorScheme === "light"
                ? "var(--mantine-color-red-0)"
                : "var(--mantine-color-red-9)";
          }

          return (
            <Grid.Col span={{ base: 12, sm: 6 }} key={option.index}>
              <Paper
                p="xs"
                withBorder
                style={{
                  borderColor,
                  backgroundColor: bgColor,
                }}
              >
                <Flex gap="xs" align="center">
                  {isCorrect && <IconCheck size={16} color="green" />}
                  {isSelected && !isCorrect && <IconX size={16} color="red" />}
                  <Text size="sm">{localize(option.text)}</Text>
                </Flex>
              </Paper>
            </Grid.Col>
          );
        })}
      </Grid>

      {answer.explanation && localize(answer.explanation) && (
        <Paper
          p="xs"
          mt="sm"
          radius="sm"
          style={{
            background:
              computedColorScheme === "light"
                ? "rgba(25, 113, 194, 0.08)"
                : "rgba(255, 255, 255, 0.05)",
            border: "1px solid var(--border)",
          }}
        >
          <Text size="sm" c="dimmed">
            <strong>{t("examResult.explanation")}:</strong>{" "}
            {localize(answer.explanation)}
          </Text>
        </Paper>
      )}
    </Paper>
  );
}
