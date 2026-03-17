import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { mutate } from "swr";
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
  SimpleGrid,
  ThemeIcon,
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
  IconClock,
} from "@tabler/icons-react";
import LanguagePicker from "../language/LanguagePicker";
import ColorMode from "../other/ColorMode";
import api from "../../api/api";
import type { AnswersMap } from "../../types";

export interface QuizNavHandle {
  openFinishModal: () => void;
}

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
  backUrl?: string;
  onTimeUp?: () => void;
  isSecureMode?: boolean;
  onGuestFinish?: () => void;
  onGuestViewResults?: () => void;
  onSubmitSuccess?: () => void;
}

export const QuizNav = forwardRef<QuizNavHandle, QuizNavProps>(function QuizNav({
  sessionId,
  questions = [],
  totalQuestions = 0,
  durationMinutes = 30,
  answers,
  onReset,
  backUrl = "/packages",
  onTimeUp,
  isSecureMode = false,
  onGuestFinish,
  onGuestViewResults,
  onSubmitSuccess,
}: QuizNavProps, ref) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [opened, { open, close }] = useDisclosure(false);
  const [submitting, setSubmitting] = useState(false);

  useImperativeHandle(ref, () => ({ openFinishModal: open }), [open]);

  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const isTimeUp = timeLeft <= 0;

  useEffect(() => {
    if (isTimeUp) {
      onTimeUp?.();
      open();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimeUp, onTimeUp]);

  const handleSubmit = async (navigateTo: string) => {
    if (submitting) return;

    if (!sessionId) {
      // Guest mode: no API call needed
      close();
      if (navigateTo === backUrl) {
        onGuestFinish?.();
      } else {
        onGuestViewResults?.();
      }
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

      // Active exam SWR cache ni tozalaymiz — /me da banner qayta chiqmasin
      mutate("/api/v2/exams/active", { data: null }, false);
      onSubmitSuccess?.();
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
        title={
          <Text fw={700} size="lg">
            {t("exam.finishModal.title")}
          </Text>
        }
        centered
        size="440px"
        radius="lg"
        closeOnClickOutside={!isTimeUp}
        closeOnEscape={!isTimeUp}
        withCloseButton={!isTimeUp}
        padding="xl"
      >
        <Stack gap="lg">
          {/* Stats */}
          {isSecureMode ? (
            <SimpleGrid cols={2} spacing="sm">
              <Stack
                align="center"
                gap={6}
                p="sm"
                style={{ borderRadius: 12, border: "1px solid var(--mantine-color-blue-5)" }}
              >
                <ThemeIcon size={44} radius="xl" color="blue" variant="light">
                  <IconCheck size={22} />
                </ThemeIcon>
                <Text size="xl" fw={800} c="blue">
                  {answeredCount}
                </Text>
                <Text size="xs" c="dimmed" ta="center">
                  {t("exam.answered")}
                </Text>
              </Stack>
              <Stack
                align="center"
                gap={6}
                p="sm"
                style={{ borderRadius: 12, border: "1px solid var(--mantine-color-yellow-5)" }}
              >
                <ThemeIcon size={44} radius="xl" color="yellow" variant="light">
                  <IconClock size={22} />
                </ThemeIcon>
                <Text size="xl" fw={800} c="yellow.6">
                  {unansweredCount}
                </Text>
                <Text size="xs" c="dimmed" ta="center">
                  {t("exam.unanswered")}
                </Text>
              </Stack>
            </SimpleGrid>
          ) : (
            <SimpleGrid cols={3} spacing="sm">
              <Stack
                align="center"
                gap={6}
                p="sm"
                style={{ borderRadius: 12, border: "1px solid var(--mantine-color-green-5)" }}
              >
                <ThemeIcon size={44} radius="xl" color="green" variant="light">
                  <IconCheck size={22} />
                </ThemeIcon>
                <Text size="xl" fw={800} c="green">
                  {correctCount}
                </Text>
                <Text size="xs" c="dimmed" ta="center">
                  {t("exam.correct")}
                </Text>
              </Stack>
              <Stack
                align="center"
                gap={6}
                p="sm"
                style={{ borderRadius: 12, border: "1px solid var(--mantine-color-red-5)" }}
              >
                <ThemeIcon size={44} radius="xl" color="red" variant="light">
                  <IconX size={22} />
                </ThemeIcon>
                <Text size="xl" fw={800} c="red">
                  {incorrectCount}
                </Text>
                <Text size="xs" c="dimmed" ta="center">
                  {t("exam.incorrect")}
                </Text>
              </Stack>
              <Stack
                align="center"
                gap={6}
                p="sm"
                style={{ borderRadius: 12, border: "1px solid var(--mantine-color-default-border)" }}
              >
                <ThemeIcon size={44} radius="xl" color="gray" variant="light">
                  <IconClock size={22} />
                </ThemeIcon>
                <Text size="xl" fw={800} c="dimmed">
                  {unansweredCount}
                </Text>
                <Text size="xs" c="dimmed" ta="center">
                  {t("exam.unanswered")}
                </Text>
              </Stack>
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

          <Divider />

          {/* Actions */}
          <Stack gap="xs">
            {/* Primary: Submit & view results */}
            <Button
              onClick={() => handleSubmit(backUrl)}
              loading={submitting}
              rightSection={<IconCheck size={18} />}
              disabled={submitting}
              fullWidth
              size="md"
              radius="md"
            >
              {t("exam.finish")}
            </Button>

            <Button
              variant="light"
              color="blue"
              onClick={() => handleSubmit(`/exam/result/${sessionId}`)}
              loading={submitting}
              rightSection={<IconChartBar size={18} />}
              disabled={submitting}
              fullWidth
              size="md"
              radius="md"
            >
              {t("exam.viewResults")}
            </Button>

            {/* Secondary: Exit / Restart */}
            <Flex gap="xs">
              <Button
                color="gray"
                variant="light"
                leftSection={<IconArrowLeft size={16} />}
                fullWidth
                radius="md"
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
              <Button
                color="gray"
                variant="light"
                onClick={handleReset}
                disabled={submitting || isTimeUp}
                leftSection={<IconRefresh size={16} />}
                fullWidth
                radius="md"
              >
                {t("exam.restart")}
              </Button>
            </Flex>
          </Stack>
        </Stack>
      </Modal>
    </>
  );
});
