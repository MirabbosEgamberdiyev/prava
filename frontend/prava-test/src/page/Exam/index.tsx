import { useState } from "react";
import {
  Box,
  Center,
  Loader,
  Text,
  Title,
  Button,
  Group,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import { notifications } from "@mantine/notifications";
import { useExam, EXAM_DEFAULTS } from "../../features/Exam";
import type { ExamPageProps } from "../../features/Exam";
import { QuizNav } from "../../components/quiz/QuizNav";
import { QuizContent } from "../../components/quiz/QuizContent";
import SEO from "../../components/common/SEO";
import api from "../../api/api";

const Exam_Page = ({
  questionCount = EXAM_DEFAULTS.QUESTION_COUNT,
  durationMinutes = EXAM_DEFAULTS.DURATION_MINUTES,
}: ExamPageProps) => {
  const { t } = useTranslation();

  const {
    examData,
    loading,
    error,
    answers,
    handleAnswerSelect,
    handleReset,
    handleRetry,
    navigate,
  } = useExam({ questionCount, durationMinutes });

  const [isTimeUp, setIsTimeUp] = useState(false);
  const [isErrorLimitReached, setIsErrorLimitReached] = useState(false);

  const handleExamFinish = async (navigateTo: string) => {
    if (!examData) return;
    try {
      const formattedAnswers = examData.data.questions.map((question, index) => ({
        questionId: question.id,
        selectedOptionIndex: answers[index]?.optionIndex ?? null,
        timeSpentSeconds: answers[index]?.timeSpentSeconds ?? 0,
      }));
      await api.post("/api/v2/exams/submit", {
        sessionId: examData.data.sessionId,
        answers: formattedAnswers,
      });
      notifications.show({
        title: t("common.success"),
        message: t("notification.examFinished"),
        color: "green",
      });
      navigate(navigateTo, { replace: true });
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || t("notification.submitError");
      notifications.show({
        title: t("common.error"),
        message: errorMessage,
        color: "red",
      });
    }
  };

  if (loading) {
    return (
      <Center h="100vh">
        <Box ta="center">
          <Loader size="lg" mb="md" />
          <Text c="dimmed">{t("exam.loading")}</Text>
        </Box>
      </Center>
    );
  }

  if (error) {
    return (
      <Center h="100vh">
        <Box ta="center">
          <Title order={3} c="red" mb="md">
            {t("common.errorOccurred")}
          </Title>
          <Text c="dimmed" mb="lg">
            {error}
          </Text>
          <Group justify="center">
            <Button variant="outline" onClick={() => navigate("/me")}>
              {t("common.back")}
            </Button>
            <Button onClick={handleRetry}>{t("common.retry")}</Button>
          </Group>
        </Box>
      </Center>
    );
  }

  if (!examData) {
    return (
      <Center h="100vh">
        <Box ta="center">
          <Title order={3} mb="md">
            {t("exam.notFound")}
          </Title>
          <Text c="dimmed" mb="lg">
            {t("exam.notFoundDesc")}
          </Text>
          <Button onClick={() => navigate("/me")}>{t("common.back")}</Button>
        </Box>
      </Center>
    );
  }

  return (
    <>
      <SEO
        title="Imtihon"
        description="Haydovchilik guvohnomasi imtihonini topshiring. Real imtihon formati va vaqt chegarasi."
        canonical="/exam"
        noIndex={true}
      />
      <QuizNav
        sessionId={examData.data.sessionId}
        questions={examData.data.questions}
        totalQuestions={examData.data.totalQuestions}
        durationMinutes={examData.data.durationMinutes}
        answers={answers}
        onReset={handleReset}
        backUrl="/me"
        onTimeUp={() => setIsTimeUp(true)}
        forceEnableSubmit={isErrorLimitReached}
      />
      <QuizContent
        questions={examData.data.questions}
        onAnswerSelect={handleAnswerSelect}
        onFinish={() => {
          (document.querySelector("[data-finish-button]") as HTMLButtonElement)?.click();
        }}
        selectedAnswers={answers}
        errorLimitMode
        maxErrorPercentage={0.1}
        isTimeUp={isTimeUp}
        onFinishExam={handleExamFinish}
        examSessionId={examData.data.sessionId}
        onErrorLimitReached={() => setIsErrorLimitReached(true)}
      />
    </>
  );
};

export default Exam_Page;
