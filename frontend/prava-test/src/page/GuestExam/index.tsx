import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Center,
  Loader,
  Text,
  Title,
  Button,
  Paper,
  Stack,
  ThemeIcon,
  Container,
  Alert,
  Modal,
  SimpleGrid,
  Progress,
  Group,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconLock,
  IconUserPlus,
  IconChartBar,
  IconHome,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import SEO from "../../components/common/SEO";
import { QuizContent } from "../../components/quiz/QuizContent";
import { QuizNav } from "../../components/quiz/QuizNav";
import type { Question, AnswersMap } from "../../types";

const GUEST_EXAM_KEY = "guestExamCount";

const GuestExamPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [guestResultOpened, setGuestResultOpened] = useState(false);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const count = parseInt(localStorage.getItem(GUEST_EXAM_KEY) || "0", 10);
    if (count >= 1) {
      setLimitReached(true);
      setLoading(false);
      return;
    }

    fetch("/api/v1/public/guest-exam")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const exam = data?.data;
        if (!exam?.questions?.length) throw new Error("No questions");
        setQuestions(exam.questions);
        setDurationMinutes(exam.durationMinutes ?? 20);
        localStorage.setItem(GUEST_EXAM_KEY, String(count + 1));
      })
      .catch((err) => {
        console.error("Guest exam load failed:", err);
        setError(t("exam.loadError"));
      })
      .finally(() => setLoading(false));
  }, []);

  // Auto-redirect when limit reached
  useEffect(() => {
    if (!limitReached) return;
    const interval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate("/", { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [limitReached, navigate]);

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

  const handleFinish = () => setGuestResultOpened(true);

  // Compute stats from answers + questions
  const { correctCount, incorrectCount, unansweredCount } = useMemo(() => {
    const correct = questions.reduce((count, q, i) => {
      return count + (answers[i]?.optionIndex === q.correctOptionIndex ? 1 : 0);
    }, 0);
    const answered = Object.keys(answers).length;
    return {
      correctCount: correct,
      incorrectCount: answered - correct,
      unansweredCount: questions.length - answered,
    };
  }, [questions, answers]);

  const correctPercentage =
    questions.length > 0 ? (correctCount / questions.length) * 100 : 0;

  if (loading) {
    return (
      <Center h="100vh">
        <Box ta="center">
          <Loader size="lg" mb="md" />
          <Text c="dimmed">{t("common.loading")}</Text>
        </Box>
      </Center>
    );
  }

  if (limitReached) {
    return (
      <Center h="100vh">
        <Container size="xs">
          <Paper p="xl" radius="md" withBorder shadow="md" ta="center">
            <ThemeIcon size={64} radius="xl" color="orange" variant="light" mb="md" mx="auto">
              <IconLock size={32} />
            </ThemeIcon>
            <Title order={3} mb="sm">
              {t("guestExam.limitReached")}
            </Title>
            <Text c="dimmed" mb="sm">
              {t("guestExam.registerPrompt")}
            </Text>
            <Text size="sm" c="dimmed" mb="md">
              {t("guestExam.redirecting", { seconds: redirectCountdown })}
            </Text>
            <Stack gap="sm">
              <Button
                size="md"
                leftSection={<IconUserPlus size={18} />}
                onClick={() => navigate("/auth/register")}
              >
                {t("register.register")}
              </Button>
              <Button
                variant="light"
                size="md"
                onClick={() => navigate("/")}
              >
                {t("notFound.backHome")}
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Center>
    );
  }

  if (error) {
    return (
      <Center h="100vh">
        <Box ta="center">
          <Title order={3} mb="md" c="red">
            {error}
          </Title>
          <Button onClick={() => navigate("/")}>
            {t("notFound.backHome")}
          </Button>
        </Box>
      </Center>
    );
  }

  if (questions.length === 0) {
    return (
      <Center h="100vh">
        <Box ta="center">
          <Title order={3} mb="md">
            {t("exam.notFound")}
          </Title>
          <Button onClick={() => navigate("/")}>
            {t("notFound.backHome")}
          </Button>
        </Box>
      </Center>
    );
  }

  return (
    <>
      <SEO
        title="Imtihonni sinab ko'ring - Bepul YHXBB testi online"
        description="Ro'yxatdan o'tmasdan haydovchilik guvohnomasi imtihonini bepul sinab ko'ring. Real imtihon formatida YHXBB savollarini yechib ko'ring. O'zbekistonda haydovchilik guvohnomasi uchun online test."
        keywords="prava test bepul, haydovchilik imtihoni sinash, YHXBB test online, prava sinov, bepul prava test, бесплатный тест ПДД, haydovchilik guvohnomasi test, avtomaktab test online"
        canonical="/try-exam"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Quiz",
          name: "Haydovchilik guvohnomasi sinov imtihoni",
          description: "YHXBB imtihonini bepul sinab ko'ring - real imtihon formati",
          educationalLevel: "Beginner",
          inLanguage: ["uz", "ru", "en"],
          isAccessibleForFree: true,
          provider: { "@type": "Organization", name: "Prava Online", url: "https://pravaonline.uz" },
        }}
      />
      <QuizNav
        questions={questions}
        totalQuestions={questions.length}
        durationMinutes={durationMinutes}
        answers={answers}
        onReset={handleReset}
        backUrl="/"
        isSecureMode={false}
        onGuestFinish={() => navigate("/")}
        onGuestViewResults={() => setGuestResultOpened(true)}
      />
      <Alert
        icon={<IconAlertCircle size={16} />}
        color="yellow"
        mx="md"
        mt="xs"
        mb={0}
        radius="md"
      >
        {t("guestExam.resultNotSaved")}
      </Alert>
      <QuizContent
        questions={questions}
        onAnswerSelect={handleAnswerSelect}
        onFinish={handleFinish}
        selectedAnswers={answers}
        showExplanation={true}
        isSecureMode={false}
      />

      {/* Guest Result Modal */}
      <Modal
        opened={guestResultOpened}
        onClose={() => setGuestResultOpened(false)}
        title={t("exam.finishModal.title")}
        centered
        size="500px"
      >
        <Stack gap="md">
          <SimpleGrid cols={3} spacing="sm">
            <Paper
              p="md"
              ta="center"
              style={{
                backgroundColor: "var(--mantine-color-green-0)",
                border: "1px solid var(--mantine-color-green-3)",
              }}
            >
              <Text size="xl" fw={700} c="green">
                {correctCount}
              </Text>
              <Text size="sm" c="dimmed">
                {t("exam.correct")}
              </Text>
            </Paper>
            <Paper
              p="md"
              ta="center"
              style={{
                backgroundColor: "var(--mantine-color-red-0)",
                border: "1px solid var(--mantine-color-red-3)",
              }}
            >
              <Text size="xl" fw={700} c="red">
                {incorrectCount}
              </Text>
              <Text size="sm" c="dimmed">
                {t("exam.incorrect")}
              </Text>
            </Paper>
            <Paper
              p="md"
              ta="center"
              style={{
                backgroundColor: "var(--mantine-color-yellow-0)",
                border: "1px solid var(--mantine-color-yellow-3)",
              }}
            >
              <Text size="xl" fw={700} c="yellow.9">
                {unansweredCount}
              </Text>
              <Text size="sm" c="dimmed">
                {t("exam.unanswered")}
              </Text>
            </Paper>
          </SimpleGrid>

          <Box>
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">
                {t("exam.result.score")}
              </Text>
              <Text size="sm" fw={500}>
                {correctCount} / {questions.length}
              </Text>
            </Group>
            <Progress
              value={correctPercentage}
              color={correctPercentage >= 90 ? "green" : correctPercentage >= 60 ? "yellow" : "red"}
              size="lg"
              radius="xl"
            />
          </Box>

          <Stack gap="sm" mt="sm">
            <Button
              fullWidth
              leftSection={<IconChartBar size={18} />}
              onClick={() => {
                setGuestResultOpened(false);
                // Stay on page to review answers
              }}
            >
              {t("exam.viewResults")}
            </Button>
            <Button
              fullWidth
              variant="light"
              leftSection={<IconUserPlus size={18} />}
              onClick={() => navigate("/auth/register")}
            >
              {t("register.register")}
            </Button>
            <Button
              fullWidth
              variant="subtle"
              color="gray"
              leftSection={<IconHome size={18} />}
              onClick={() => navigate("/")}
            >
              {t("notFound.backHome")}
            </Button>
          </Stack>
        </Stack>
      </Modal>
    </>
  );
};

export default GuestExamPage;
