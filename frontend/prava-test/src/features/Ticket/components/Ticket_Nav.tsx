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
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  IconX,
  IconCheck,
  IconRefresh,
  IconArrowLeft,
  IconAlertTriangle,
} from "@tabler/icons-react";
import LanguagePicker from "../../../components/language/LanguagePicker";
import ColorMode from "../../../components/other/ColorMode";
import api from "../../../api/api";

// Ko'p tilli matn interfeysi
interface LocalizedText {
  uzl: string;
  uzc: string;
  en: string;
  ru: string;
}

// API dan keladigan ma'lumotlar interfeysi
interface TicketExamData {
  success: boolean;
  message: string;
  data: {
    sessionId: number;
    ticketId: number;
    ticketNumber: number;
    ticketName: LocalizedText;
    totalQuestions: number;
    durationMinutes: number;
    passingScore: number;
    startedAt: string;
    expiresAt: string;
    questions: Array<{
      id: number;
      order: number;
      correctOptionIndex: number;
    }>;
  };
}

interface TicketNavProps {
  examData?: TicketExamData;
  answers: Record<number, { optionIndex: number; timeSpentSeconds: number }>;
  onReset?: () => void;
  backUrl?: string;
  onTimeUp?: () => void;
}

export function Ticket_Nav({
  examData,
  answers,
  onReset,
  backUrl = "/tickets",
  onTimeUp,
}: TicketNavProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [opened, { open, close }] = useDisclosure(false);
  const [submitting, setSubmitting] = useState(false);
  const colorScheme = useComputedColorScheme("light", { getInitialValueInEffect: true });
  const isDark = colorScheme === "dark";

  // Timer uchun durationMinutes ni API dan olamiz
  const durationMinutes = examData?.data?.durationMinutes || 30;
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (onTimeUp) {
        onTimeUp();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  // Javoblarni serverga yuborish
  const handleSubmit = async () => {
    if (!examData?.data?.sessionId) {
      notifications.show({
        title: t("common.error"),
        message: t("notification.sessionNotFound"),
        color: "red",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Javoblarni API formatiga o'tkazish
      const formattedAnswers = examData.data.questions.map(
        (question, index) => {
          const answer = answers[index];
          return {
            questionId: question.id,
            selectedOptionIndex: answer?.optionIndex ?? null,
            timeSpentSeconds: answer?.timeSpentSeconds ?? 0,
          };
        }
      );

      await api.post("/api/v2/exams/submit", {
        sessionId: examData.data.sessionId,
        answers: formattedAnswers,
      });

      notifications.show({
        title: t("common.success"),
        message: t("notification.examFinished"),
        color: "green",
      });

      navigate(backUrl, {
        replace: true,
        state: { examFinished: true },
      });
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

  // Vaqtni formatlash (mm:ss)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Vaqt kam qolganda rang o'zgaradi
  const getTimerColor = () => {
    if (timeLeft <= 60) return "red";
    if (timeLeft <= 300) return "yellow";
    return "blue";
  };

  // Javob berilgan savollar soni
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = examData?.data?.totalQuestions || 0;

  // To'g'ri va noto'g'ri javoblar sonini hisoblash
  const correctCount =
    examData?.data?.questions?.reduce((count, question, index) => {
      const answer = answers[index];
      if (answer && answer.optionIndex === question.correctOptionIndex) {
        return count + 1;
      }
      return count;
    }, 0) || 0;

  const incorrectCount = answeredCount - correctCount;
  const unansweredCount = totalQuestions - answeredCount;

  // Barcha savollarga javob berilganmi?
  const allAnswered = answeredCount === totalQuestions;

  // Qayta ishlash
  const handleReset = () => {
    if (onReset) {
      onReset();
    }
    close();
  };

  return (
    <>
      <Flex p="sm" py="xs" justify="space-between" align="center">
        <Group>
          <Button
            rightSection={<IconX size={18} />}
            variant="subtle"
            color="red"
            onClick={open}
            data-finish-button
          >
            {t("exam.finish")}
          </Button>
          <Badge variant="light" size="xl" radius="xs" color={getTimerColor()}>
            {formatTime(timeLeft)}
          </Badge>
        </Group>

        <Group>
          <ColorMode />
          <LanguagePicker />
        </Group>
      </Flex>
      <Divider />

      {/* Yakunlash Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title={t("exam.finishModal.title")}
        centered
        size="580px"
      >
        <Stack>
          {/* Natijalar - 3 ta karta */}
          <SimpleGrid cols={3} spacing="sm">
            <Paper
              p="md"
              ta="center"
              style={{
                backgroundColor: isDark ? "var(--mantine-color-green-9)" : "var(--mantine-color-green-0)",
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
                backgroundColor: isDark ? "var(--mantine-color-red-9)" : "var(--mantine-color-red-0)",
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
                backgroundColor: isDark ? "var(--mantine-color-yellow-9)" : "var(--mantine-color-yellow-0)",
                border: `1px solid ${isDark ? "var(--mantine-color-yellow-7)" : "var(--mantine-color-yellow-3)"}`,
              }}
            >
              <Text size="xl" fw={700} c="yellow.8">
                {unansweredCount}
              </Text>
              <Text size="sm" c="dimmed">
                {t("exam.unanswered")}
              </Text>
            </Paper>
          </SimpleGrid>

          {/* Ogohlantirish matni */}
          {!allAnswered && (
            <Alert
              color="yellow"
              variant="light"
              icon={<IconAlertTriangle size={18} />}
            >
              {t("exam.finishModal.warning", { count: unansweredCount })}
            </Alert>
          )}
          <Grid mt={"sm"}>
            <Grid.Col span={{ base: 6, md: 4 }}>
              <Link to={backUrl} style={{ textDecoration: "none" }}>
                <Button
                  color="gray"
                  leftSection={<IconArrowLeft size={18} />}
                  fullWidth
                >
                  {t("exam.exit")}
                </Button>
              </Link>
            </Grid.Col>
            <Grid.Col span={{ base: 6, md: 4 }}>
              <Button
                color="gray"
                onClick={handleReset}
                disabled={submitting}
                leftSection={<IconRefresh size={18} />}
                fullWidth
              >
                {t("exam.restart")}
              </Button>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Button
                onClick={handleSubmit}
                loading={submitting}
                rightSection={<IconCheck size={18} />}
                disabled={submitting}
                fullWidth
              >
                {t("exam.finish")}
              </Button>
            </Grid.Col>
          </Grid>
        </Stack>
      </Modal>
    </>
  );
}
