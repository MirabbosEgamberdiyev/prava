import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Center, Loader, Text, Title, Button, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import api from "../../../api/api";
import { QuizNav, type QuizNavHandle } from "../../../components/quiz/QuizNav";
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
  const submittedRef = useRef(false);
  const sessionIdRef = useRef<number | null>(null);
  const quizNavRef = useRef<QuizNavHandle>(null);

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
        sessionIdRef.current = response.data.data.sessionId;
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

  // Foydalanuvchi modal orqali emas, boshqa yo'l bilan chiqib ketsa
  // (browser back, URL o'zgartirish) — sessiyani abandon qilamiz
  useEffect(() => {
    return () => {
      if (!submittedRef.current && sessionIdRef.current) {
        navigator.sendBeacon(
          `/api/v2/exams/${sessionIdRef.current}/abandon`,
        );
      }
    };
  }, []);

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
    quizNavRef.current?.openFinishModal();
  };

  const handleSubmitSuccess = () => {
    submittedRef.current = true;
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
  const examSuffix = t("ticket.examSuffix");

  return (
    <>
      <SEO
        title={`${ticketName} ${examSuffix}`}
        description={`${ticketName} savollari — haydovchilik guvohnomasi imtihoniga tayyorgarlik. ${examData.data.totalQuestions} ta savol.`}
        canonical={`/tickets/${id}`}
        noIndex
      />
      <QuizNav
        ref={quizNavRef}
        sessionId={examData.data.sessionId}
        questions={examData.data.questions}
        totalQuestions={examData.data.totalQuestions}
        durationMinutes={examData.data.durationMinutes}
        answers={answers}
        onReset={handleReset}
        backUrl="/tickets"
        isSecureMode={isSecureMode}
        onSubmitSuccess={handleSubmitSuccess}
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
