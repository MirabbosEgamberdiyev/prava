import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Divider,
  Flex,
  Group,
  Modal,
  Text,
  Stack,
  Paper,
  SimpleGrid,
  Grid,
  useComputedColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  IconX,
  IconCheck,
  IconRefresh,
  IconArrowLeft,
  IconAlertTriangle,
  IconChartBar,
} from "@tabler/icons-react";
import LanguagePicker from "../language/LanguagePicker";
import ColorMode from "../other/ColorMode";
import api from "../../api/api";
import type { AnswersMap } from "../../types";

interface QuizNavProps {
  sessionId?: number;
  questions?: Array<{
    id: number;
    order: number;
    correctOptionIndex: number;
  }>;
  totalQuestions?: number;
  durationMinutes?: number;
  answers: AnswersMap;
  onReset?: () => void;
  onOpenFinishModal?: () => void;
  backUrl?: string;
  onTimeUp?: () => void;
  isSecureMode?: boolean;
}

export function QuizNav({
  sessionId,
  questions = [],
  totalQuestions = 0,
  durationMinutes = 30,
  answers,
  onReset,
  backUrl = "/packages",
  onTimeUp,
  isSecureMode = false,
}: QuizNavProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [opened, { open, close }] = useDisclosure(false);
  const [submitting, setSubmitting] = useState(false);
  const colorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });
  const isDark = colorScheme === "dark";

  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);

  const isTimeUp = timeLeft <= 0;

  useEffect(() => {
    if (isTimeUp) {
      onTimeUp?.();
      open(); // Vaqt tugaganda modalni avtomatik ochish
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimeUp, onTimeUp]);

  const handleSubmit = async (navigateTo: string) => {
    // Double-submit prevention
    if (submitting) return;

    if (!sessionId) {
      notifications.show({
        title: t("common.error"),
        message: t("notification.sessionNotFound"),
        color: "red",
      });
      return;
    }

    setSubmitting(true);

    try {
      const formattedAnswers = questions.map((question, index) => {
        const answer = answers[index];
        return {
          questionId: question.id,
          selectedOptionIndex: answer?.optionIndex ?? null,
          timeSpentSeconds: answer?.timeSpentSeconds ?? 0,
        };
      });

      await api.post("/api/v2/exams/submit", {
        sessionId,
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
    } finally {
      setSubmitting(false);
      close();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimerColor = () => {
    if (timeLeft <= 60) return "red";
    if (timeLeft <= 300) return "yellow";
    return "blue";
  };

  const answeredCount = Object.keys(answers).length;

  const correctCount =
    questions.reduce((count, question, index) => {
      const answer = answers[index];
      if (answer && answer.optionIndex === question.correctOptionIndex) {
        return count + 1;
      }
      return count;
    }, 0) || 0;

  const incorrectCount = answeredCount - correctCount;
  const unansweredCount = totalQuestions - answeredCount;
  const allAnswered = answeredCount === totalQuestions;

  const handleReset = () => {
    onReset?.();
    close();
  };

  return (
    <>
      <Flex p="sm" py="xs" justify="space-between" align="center">
        <Group>
          <Button
            rightSection={<IconX size={18} />}
            variant="light"
            color="red"
            onClick={open}
            data-finish-button
          >
            {t("exam.finish")}
          </Button>
          <Badge
            variant="light"
            size="xl"
            radius="xs"
            color={getTimerColor()}
            aria-label={t("exam.finish")}
          >
            {formatTime(timeLeft)}
          </Badge>
        </Group>

        <Group>
          <ColorMode />
          <LanguagePicker />
        </Group>
      </Flex>
      <Divider />

      {/* Finish Modal */}
      <Modal
        opened={opened}
        onClose={isTimeUp ? () => {} : close}
        title={t("exam.finishModal.title")}
        centered
        size="580px"
        closeOnClickOutside={!isTimeUp}
        closeOnEscape={!isTimeUp}
        withCloseButton={!isTimeUp}
      >
        <Stack>
          {isSecureMode ? (
            <SimpleGrid cols={2} spacing="sm">
              <Paper
                p="md"
                ta="center"
                style={{
                  backgroundColor: isDark
                    ? "var(--mantine-color-blue-9)"
                    : "var(--mantine-color-blue-0)",
                  border: `1px solid ${isDark ? "var(--mantine-color-blue-7)" : "var(--mantine-color-blue-3)"}`,
                }}
              >
                <Text size="xl" fw={700} c="blue">
                  {answeredCount}
                </Text>
                <Text size="sm" c="dimmed">
                  {t("exam.answered")}
                </Text>
              </Paper>
              <Paper
                p="md"
                ta="center"
                style={{
                  backgroundColor: isDark
                    ? "var(--mantine-color-yellow-9)"
                    : "var(--mantine-color-yellow-0)",
                  border: `1px solid ${isDark ? "var(--mantine-color-yellow-7)" : "var(--mantine-color-yellow-3)"}`,
                }}
              >
                <Text size="xl" fw={700} c={isDark ? "yellow.2" : "yellow.9"}>
                  {unansweredCount}
                </Text>
                <Text size="sm" c={isDark ? "yellow.3" : "dark.6"}>
                  {t("exam.unanswered")}
                </Text>
              </Paper>
            </SimpleGrid>
          ) : (
            <SimpleGrid cols={3} spacing="sm">
              <Paper
                p="md"
                ta="center"
                style={{
                  backgroundColor: isDark
                    ? "var(--mantine-color-green-9)"
                    : "var(--mantine-color-green-0)",
                  border: `1px solid ${isDark ? "var(--mantine-color-green-7)" : "var(--mantine-color-green-3)"}`,
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
                  backgroundColor: isDark
                    ? "var(--mantine-color-red-9)"
                    : "var(--mantine-color-red-0)",
                  border: `1px solid ${isDark ? "var(--mantine-color-red-7)" : "var(--mantine-color-red-3)"}`,
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
                  backgroundColor: isDark
                    ? "var(--mantine-color-yellow-9)"
                    : "var(--mantine-color-yellow-0)",
                  border: `1px solid ${isDark ? "var(--mantine-color-yellow-7)" : "var(--mantine-color-yellow-3)"}`,
                }}
              >
                <Text size="xl" fw={700} c={isDark ? "yellow.2" : "yellow.9"}>
                  {unansweredCount}
                </Text>
                <Text size="sm" c={isDark ? "yellow.3" : "dark.6"}>
                  {t("exam.unanswered")}
                </Text>
              </Paper>
            </SimpleGrid>
          )}

          {!allAnswered && (
            <Alert
              color="yellow"
              variant="light"
              icon={<IconAlertTriangle size={18} />}
            >
              {t("exam.finishModal.warning", { count: unansweredCount })}
            </Alert>
          )}
          <Grid mt="sm">
            <Grid.Col span={{ base: 6 }}>
              <Button
                color="gray"
                leftSection={<IconArrowLeft size={18} />}
                fullWidth
                disabled={isTimeUp}
                onClick={async () => {
                  if (sessionId) {
                    try {
                      await api.delete(`/api/v2/exams/${sessionId}/abandon`);
                    } catch {
                      // Ignore abandon errors
                    }
                  }
                  close();
                  navigate(backUrl, { replace: true });
                }}
              >
                {t("exam.exit")}
              </Button>
            </Grid.Col>
            <Grid.Col span={{ base: 6 }}>
              <Button
                color="gray"
                onClick={handleReset}
                disabled={submitting || isTimeUp}
                leftSection={<IconRefresh size={18} />}
                fullWidth
              >
                {t("exam.restart")}
              </Button>
            </Grid.Col>
            <Grid.Col span={{ base: 6 }}>
              <Button
                onClick={() => handleSubmit(backUrl)}
                loading={submitting}
                rightSection={<IconCheck size={18} />}
                disabled={submitting || (!allAnswered && !isTimeUp)}
                fullWidth
              >
                {t("exam.finish")}
              </Button>
            </Grid.Col>
            <Grid.Col span={{ base: 6 }}>
              <Button
                variant="light"
                color="blue"
                onClick={() => handleSubmit(`/exam/result/${sessionId}`)}
                loading={submitting}
                rightSection={<IconChartBar size={18} />}
                disabled={submitting || (!allAnswered && !isTimeUp)}
                fullWidth
              >
                {t("exam.viewResults")}
              </Button>
            </Grid.Col>
          </Grid>
        </Stack>
      </Modal>
    </>
  );
}
