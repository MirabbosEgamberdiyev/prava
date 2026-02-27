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
import { useExam, EXAM_DEFAULTS } from "../../features/Exam";
import type { ExamPageProps } from "../../features/Exam";
import { QuizNav } from "../../components/quiz/QuizNav";
import { QuizContent } from "../../components/quiz/QuizContent";
import SEO from "../../components/common/SEO";

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
      />
      <QuizContent
        questions={examData.data.questions}
        onAnswerSelect={handleAnswerSelect}
        onFinish={() => {}}
        selectedAnswers={answers}
        errorLimitMode
        maxErrorPercentage={0.1}
        isTimeUp={isTimeUp}
      />
    </>
  );
};

export default Exam_Page;
