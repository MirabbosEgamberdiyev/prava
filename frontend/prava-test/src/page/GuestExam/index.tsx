import { useEffect, useState, useRef } from "react";
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
} from "@mantine/core";
import {
  IconAlertCircle,
  IconLock,
  IconUserPlus,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { QuizContent } from "../../components/quiz/QuizContent";
import { QuizNav } from "../../components/quiz/QuizNav";
import type { Question, AnswersMap } from "../../types";

const GUEST_EXAM_KEY = "guestExamCount";

interface GuestExamJson {
  totalQuestions: number;
  durationMinutes: number;
  passingScore: number;
  questions: Question[];
}

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

    fetch("/data/guest-exam.json")
      .then((res) => res.json())
      .then((data: GuestExamJson) => {
        setQuestions(data.questions);
        setDurationMinutes(data.durationMinutes);
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
      <QuizNav
        questions={questions}
        totalQuestions={questions.length}
        durationMinutes={durationMinutes}
        answers={answers}
        onReset={handleReset}
        backUrl="/"
        isSecureMode={false}
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
    </>
  );
};

export default GuestExamPage;
