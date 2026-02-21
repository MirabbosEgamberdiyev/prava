import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Center,
  Loader,
  Text,
  Title,
  Button,
  Group,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import api from "../../../api/api";
import { QuizNav } from "../../../components/quiz/QuizNav";
import { QuizContent } from "../../../components/quiz/QuizContent";
import type { PackageExamData, AnswersMap } from "../../../types";

const PackageExamPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const examMode = location.state?.examMode || "visible";
  const isSecureMode = examMode === "secure";

  const [examData, setExamData] = useState<PackageExamData | null>(
    location.state?.examData || null,
  );
  const [loading, setLoading] = useState(!examData);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswersMap>({});

  const startExam = useCallback(async () => {
    setLoading(true);
    setError(null);

    const endpoint = isSecureMode
      ? "/api/v2/exams/start-secure"
      : "/api/v2/exams/start-visible";

    try {
      const response = await api.post<PackageExamData>(endpoint, {
        packageId: Number(id),
      });

      if (response.data) {
        setExamData(response.data);
      }
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || t("notification.startError");

      setError(errorMessage);
      notifications.show({
        title: t("common.error"),
        message: errorMessage,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    if (!examData && id) {
      startExam();
    }
  }, [id, examData, startExam]);

  const handleAnswerSelect = (
    questionIndex: number,
    optionIndex: number,
    timeSpentSeconds: number,
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: { optionIndex, timeSpentSeconds },
    }));
  };

  const handleReset = () => setAnswers({});

  const handleFinish = () => {
    const finishButton = document.querySelector(
      "[data-finish-button]",
    ) as HTMLButtonElement;
    finishButton?.click();
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
            <Button variant="outline" onClick={() => navigate("/packages")}>
              {t("common.back")}
            </Button>
            <Button onClick={startExam}>{t("common.retry")}</Button>
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
          <Button onClick={() => navigate("/packages")}>
            {t("common.back")}
          </Button>
        </Box>
      </Center>
    );
  }

  return (
    <>
      <QuizNav
        sessionId={examData.data.sessionId}
        questions={examData.data.questions}
        totalQuestions={examData.data.totalQuestions}
        durationMinutes={examData.data.durationMinutes}
        answers={answers}
        onReset={handleReset}
        backUrl="/packages"
        isSecureMode={isSecureMode}
      />
      <QuizContent
        questions={examData.data.questions}
        onAnswerSelect={handleAnswerSelect}
        onFinish={handleFinish}
        selectedAnswers={answers}
        isSecureMode={isSecureMode}
      />
    </>
  );
};

export default PackageExamPage;
