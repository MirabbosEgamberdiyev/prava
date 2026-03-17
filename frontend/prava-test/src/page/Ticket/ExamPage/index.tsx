import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Center,
  Loader,
  Text,
  Title,
  Button,
  Group,
  Paper,
  Stack,
  Container,
  ThemeIcon,
} from "@mantine/core";
import { IconAlertCircle, IconPlayerPlay, IconRefresh } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { mutate } from "swr";
import api from "../../../api/api";
import { QuizNav, type QuizNavHandle } from "../../../components/quiz/QuizNav";
import { QuizContent } from "../../../components/quiz/QuizContent";
import SEO from "../../../components/common/SEO";
import type { TicketExamData, AnswersMap } from "../../../types";

interface ActiveExamInfo {
  sessionId: number;
  ticketId?: number;
  packageId?: number;
}

const TicketExamPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isSecureMode = false;
  const showExplanation = true;

  const [examData, setExamData] = useState<TicketExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeConflict, setActiveConflict] = useState<ActiveExamInfo | null>(null);
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
    setActiveConflict(null);

    try {
      const response = await api.post<TicketExamData>("/api/v2/tickets/start-visible", {
        ticketId: Number(id),
      });

      if (response.data) {
        setExamData(response.data);
        sessionIdRef.current = response.data.data.sessionId;
        // Active exam cache ni yangilaymiz — yangi session boshlandi
        mutate("/api/v2/exams/active", null, false);
      }
    } catch {
      // Active session bor-yo'qligini tekshirish
      try {
        const activeRes = await api.get<{ data: ActiveExamInfo | null }>("/api/v2/exams/active");
        if (activeRes.data?.data?.sessionId) {
          setActiveConflict(activeRes.data.data);
          return; // Conflict UI ko'rsatamiz, generic error emas
        }
      } catch {
        // Active tekshiruv ham xato — generic error ko'rsatamiz
      }

      setError(t("ticket.startError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) startTicketExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Browser back / URL o'zgartirish orqali chiqish — sessiyani abandon qilamiz
  useEffect(() => {
    return () => {
      if (!submittedRef.current && sessionIdRef.current) {
        navigator.sendBeacon(`/api/v2/exams/${sessionIdRef.current}/abandon`);
      }
    };
  }, []);

  const handleAbandonAndRestart = async () => {
    if (!activeConflict) return;
    setLoading(true);
    try {
      await api.delete(`/api/v2/exams/${activeConflict.sessionId}/abandon`);
      mutate("/api/v2/exams/active", { data: null }, false);
    } catch {
      // Abandon xatosi — baribir qayta urinib ko'ramiz
    }
    hasFetched.current = false;
    setActiveConflict(null);
    await startTicketExam(true);
  };

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

  // Yuklash
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

  // Tugallanmagan imtihon bor — conflict UI
  if (activeConflict) {
    const isSameTicket = activeConflict.ticketId === Number(id);

    return (
      <Center h="100vh">
        <Container size="xs">
          <Paper p="xl" radius="md" withBorder shadow="md" ta="center">
            <ThemeIcon size={64} radius="xl" color="orange" variant="light" mb="md" mx="auto">
              <IconAlertCircle size={32} />
            </ThemeIcon>
            <Title order={3} mb="sm">
              {t("me.stats.resumeExam")}
            </Title>
            <Text c="dimmed" mb="xl" size="sm">
              {isSameTicket
                ? t("me.stats.resumeExamDesc")
                : t("exam.activeSessionDesc", {
                    defaultValue: "Boshqa imtihon tugallanmagan. Uni yakunlab yoki bekor qilib, yangi imtihon boshlashingiz mumkin.",
                  })}
            </Text>
            <Stack gap="sm">
              <Button
                loading={loading}
                leftSection={<IconPlayerPlay size={18} />}
                onClick={handleAbandonAndRestart}
              >
                {t("exam.abandonAndRestart", { defaultValue: "Bekor qilib, yangi boshlash" })}
              </Button>
              {isSameTicket && activeConflict.ticketId && (
                <Button
                  variant="light"
                  leftSection={<IconRefresh size={18} />}
                  onClick={() => navigate(`/tickets/${activeConflict.ticketId}`)}
                >
                  {t("me.stats.continue")}
                </Button>
              )}
              <Button
                variant="subtle"
                color="gray"
                onClick={() => navigate("/tickets")}
              >
                {t("common.back")}
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Center>
    );
  }

  // Xato
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
