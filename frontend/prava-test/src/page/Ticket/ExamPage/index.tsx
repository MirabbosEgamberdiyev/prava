import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Center, Loader, Text, Title, Button, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import api from "../../../api/api";
import { QuizNav } from "../../../components/quiz/QuizNav";
import { QuizContent } from "../../../components/quiz/QuizContent";
import SEO from "../../../components/common/SEO";
import type { TicketExamData, AnswersMap } from "../../../types";

const TicketExamPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Always use explanatory mode (visible + explanation)
  const isSecureMode = false;
  const showExplanation = true;

  const [examData, setExamData] = useState<TicketExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswersMap>({});

  const hasFetched = useRef(false);

  const startTicketExam = async (isRetry = false) => {
    if (hasFetched.current && !isRetry) return;
    hasFetched.current = true;

    setLoading(true);
    setError(null);

    try {
      const endpoint = "/api/v2/tickets/start-visible";
      const response = await api.post<TicketExamData>(endpoint, {
        ticketId: Number(id),
      });

      if (response.data) {
        setExamData(response.data);
      }
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || t("ticket.startError");

      setError(errorMessage);
      notifications.show({
        title: t("common.error"),
        message: errorMessage,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) startTicketExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
          <Text c="dimmed">{t("ticket.loading")}</Text>
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
            <Button variant="outline" onClick={() => navigate("/tickets")}>
              {t("common.back")}
            </Button>
            <Button onClick={() => startTicketExam(true)}>
              {t("common.retry")}
            </Button>
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
            {t("ticket.notFound")}
          </Title>
          <Text c="dimmed" mb="lg">
            {t("ticket.notFoundDesc")}
          </Text>
          <Button onClick={() => navigate("/tickets")}>
            {t("common.back")}
          </Button>
        </Box>
      </Center>
    );
  }

  const ticketName = examData.data.ticketNumber
    ? `${t("ticket.ticket")} ${examData.data.ticketNumber}`
    : t("ticket.exam");

  return (
    <>
      <SEO
        title={`${ticketName} — Imtihon`}
        description={`${ticketName} savollari — haydovchilik guvohnomasi imtihoniga tayyorgarlik. ${examData.data.totalQuestions} ta savol.`}
        canonical={`/tickets/${id}`}
        noIndex
      />
      <QuizNav
        sessionId={examData.data.sessionId}
        questions={examData.data.questions}
        totalQuestions={examData.data.totalQuestions}
        durationMinutes={examData.data.durationMinutes}
        answers={answers}
        onReset={handleReset}
        backUrl="/tickets"
        isSecureMode={isSecureMode}
      />
      <QuizContent
        questions={examData.data.questions}
        onAnswerSelect={handleAnswerSelect}
        onFinish={handleFinish}
        selectedAnswers={answers}
        isSecureMode={isSecureMode}
        showExplanation={showExplanation}
      />
    </>
  );
};

export default TicketExamPage;
