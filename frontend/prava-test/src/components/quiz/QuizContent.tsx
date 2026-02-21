import { useState, useEffect, useRef, useCallback } from "react";
import {
  ActionIcon,
  Box,
  Button,
  Collapse,
  Container,
  Flex,
  Grid,
  Image,
  Paper,
  Text,
  Modal,
  Progress,
  Badge,
  Tooltip,
  Stack,
  Group,
  useComputedColorScheme,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  IconCheck,
  IconX,
  IconChevronLeft,
  IconChevronRight,
  IconTarget,
  IconTrophy,
} from "@tabler/icons-react";
import { useLanguage } from "../../hooks/useLanguage";
import type { Question, Option, AnswersMap } from "../../types";
import classes from "./QuizContent.module.css";

interface QuizContentProps {
  questions: Question[];
  onAnswerSelect: (
    questionIndex: number,
    optionIndex: number,
    timeSpentSeconds: number,
  ) => void;
  onFinish: () => void;
  selectedAnswers: AnswersMap;
  showExplanation?: boolean;
  showProgressBar?: boolean;
  errorLimitMode?: boolean;
  maxErrorPercentage?: number;
  isTimeUp?: boolean;
  isSecureMode?: boolean;
}

export function QuizContent({
  questions,
  onAnswerSelect,
  onFinish,
  selectedAnswers: parentAnswers,
  showExplanation = false,
  showProgressBar = false,
  errorLimitMode = false,
  maxErrorPercentage = 0.1,
  isTimeUp = false,
  isSecureMode = false,
}: QuizContentProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { localize } = useLanguage();
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });

  const [imageModalOpened, setImageModalOpened] = useState(false);
  const [explanationOpen, setExplanationOpen] = useState(false);
  const [resultModalOpened, setResultModalOpened] = useState(false);

  const [timeUpTriggered, setTimeUpTriggered] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(0);

  // Convert parent answers to simple index map
  const selectedAnswers: Record<number, number> = Object.entries(
    parentAnswers,
  ).reduce(
    (acc, [key, value]) => {
      acc[Number(key)] = value.optionIndex;
      return acc;
    },
    {} as Record<number, number>,
  );

  // Reset active quiz when answers are cleared
  useEffect(() => {
    if (Object.keys(parentAnswers).length === 0) {
      setActiveQuiz(0);
    }
  }, [parentAnswers]);

  // Time-up handling for error limit mode
  useEffect(() => {
    if (isTimeUp && !timeUpTriggered && errorLimitMode) {
      setTimeUpTriggered(true);
      setResultModalOpened(true);
    }
  }, [isTimeUp, timeUpTriggered, errorLimitMode]);

  // Auto-advance timer ref (for cleanup)
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ref to always have latest goToNextQuestion (avoid stale closure)
  const goToNextQuestionRef = useRef<() => void>(() => {});

  // Question timing
  const questionStartTime = useRef<number>(Date.now());
  const timeSpentPerQuestion = useRef<Record<number, number>>({});

  useEffect(() => {
    // Clear any pending auto-advance timer when question changes
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
    questionStartTime.current = Date.now();
    setExplanationOpen(false);
  }, [activeQuiz]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
      }
    };
  }, []);

  const currentQuestion = questions[activeQuiz];
  const isAnswered = selectedAnswers[activeQuiz] !== undefined;
  const selectedOptionIndex = selectedAnswers[activeQuiz];
  const isFirstQuestion = activeQuiz === 0;
  const isLastQuestion = activeQuiz === questions.length - 1;
  // Stats
  const correctCount = Object.entries(selectedAnswers).filter(
    ([index, optionIndex]) => {
      const question = questions[Number(index)];
      return question && optionIndex === question.correctOptionIndex;
    },
  ).length;
  const incorrectCount = Object.keys(selectedAnswers).length - correctCount;
  const totalQuestions = questions.length;
  const maxAllowedErrors = Math.floor(totalQuestions * maxErrorPercentage);
  const isPassed = !isTimeUp && incorrectCount <= maxAllowedErrors;
  const correctPercentage =
    totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
  const progressPercentage =
    (Object.keys(selectedAnswers).length / questions.length) * 100;

  const goToNextQuestion = useCallback(() => {
    if (activeQuiz < questions.length - 1) {
      setActiveQuiz((prev) => prev + 1);
    }
  }, [activeQuiz, questions.length]);

  // Keep ref in sync so timers always call the latest version
  goToNextQuestionRef.current = goToNextQuestion;

  const goToPrevQuestion = useCallback(() => {
    if (activeQuiz > 0) {
      setActiveQuiz((prev) => prev - 1);
    }
  }, [activeQuiz]);

  const goToFirstUnanswered = () => {
    const idx = questions.findIndex(
      (_, index) => selectedAnswers[index] === undefined,
    );
    if (idx !== -1) setActiveQuiz(idx);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["F1", "F2", "F3", "F4", "F5"].includes(e.key)) {
        e.preventDefault();
        const optionIndex = parseInt(e.key.replace("F", "")) - 1;
        const options = currentQuestion?.options || [];
        if (optionIndex < options.length) {
          handleSelectAnswer(activeQuiz, optionIndex);
        }
      }
      if (e.key === "ArrowLeft" && !isFirstQuestion) goToPrevQuestion();
      if (e.key === "ArrowRight" && !isLastQuestion) goToNextQuestion();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeQuiz,
    currentQuestion,
    selectedAnswers,
    isFirstQuestion,
    isLastQuestion,
    goToNextQuestion,
    goToPrevQuestion,
  ]);

  const handleSelectAnswer = (questionIndex: number, optionIndex: number) => {
    if (selectedAnswers[questionIndex] !== undefined) return;

    // Clear any pending auto-advance timer
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }

    const timeSpent = Math.floor(
      (Date.now() - questionStartTime.current) / 1000,
    );
    timeSpentPerQuestion.current[questionIndex] = timeSpent;
    onAnswerSelect(questionIndex, optionIndex, timeSpent);

    // Error limit check
    if (errorLimitMode) {
      const question = questions[questionIndex];
      const isCorrect = question && optionIndex === question.correctOptionIndex;
      const newIncorrectCount = incorrectCount + (isCorrect ? 0 : 1);
      if (newIncorrectCount > maxAllowedErrors) {
        setTimeout(() => setResultModalOpened(true), 500);
        return;
      }
    }

    // No auto-advance on last question
    if (questionIndex >= questions.length - 1) return;

    // Auto-advance only when explanation is NOT shown (700ms delay)
    if (!showExplanation) {
      autoAdvanceTimer.current = setTimeout(
        () => goToNextQuestionRef.current(),
        700,
      );
    }
    // When showExplanation=true: wait for user to open & close explanation
  };

  const handleFinishExam = () => {
    if (errorLimitMode) {
      setResultModalOpened(true);
    } else {
      onFinish();
    }
  };

  if (questions.length === 0) {
    return (
      <Box
        bg={computedColorScheme === "light" ? "gray.1" : "dark.8"}
        mih="92vh"
        p="xl"
      >
        <Container>
          <Text ta="center" size="lg" c="dimmed">
            {t("exam.noQuestions")}
          </Text>
        </Container>
      </Box>
    );
  }

  const getOptionStyle = (option: Option) => {
    if (!isAnswered) {
      return {
        cursor: "pointer",
        borderColor: undefined,
        backgroundColor: undefined,
      };
    }

    const isThisSelected = selectedOptionIndex === option.index;
    const isThisCorrect = option.index === currentQuestion.correctOptionIndex;

    // Secure mode: only show blue "selected" border, no correct/incorrect
    if (isSecureMode) {
      if (isThisSelected) {
        return {
          cursor: "default",
          borderColor: "var(--mantine-color-blue-6)",
          backgroundColor:
            computedColorScheme === "light"
              ? "var(--mantine-color-blue-0)"
              : "var(--mantine-color-blue-9)",
        };
      }
      return {
        cursor: "default",
        borderColor: undefined,
        backgroundColor: undefined,
      };
    }

    if (isThisCorrect) {
      return {
        cursor: "default",
        borderColor: "var(--mantine-color-green-6)",
        backgroundColor:
          computedColorScheme === "light"
            ? "var(--mantine-color-green-0)"
            : "var(--mantine-color-green-9)",
      };
    }

    if (isThisSelected && !isThisCorrect) {
      return {
        cursor: "default",
        borderColor: "var(--mantine-color-red-6)",
        backgroundColor:
          computedColorScheme === "light"
            ? "var(--mantine-color-red-0)"
            : "var(--mantine-color-red-9)",
      };
    }

    return {
      cursor: "default",
      borderColor: undefined,
      backgroundColor: undefined,
    };
  };

  const getActionIconProps = (option: Option) => {
    if (!isAnswered) {
      return { variant: "default" as const, color: undefined };
    }

    const isThisSelected = selectedOptionIndex === option.index;
    const isThisCorrect = option.index === currentQuestion.correctOptionIndex;

    // Secure mode: only blue for selected
    if (isSecureMode) {
      if (isThisSelected) return { variant: "filled" as const, color: "blue" };
      return { variant: "default" as const, color: undefined };
    }

    if (isThisCorrect) return { variant: "filled" as const, color: "green" };
    if (isThisSelected && !isThisCorrect)
      return { variant: "filled" as const, color: "red" };
    return { variant: "default" as const, color: undefined };
  };

  return (
    <Box bg={computedColorScheme === "light" ? "gray.1" : "dark.8"} mih="92vh">
      {/* Progress bar for marathon mode */}
      {showProgressBar && (
        <Box
          p="sm"
          style={{
            borderBottom: `1px solid ${computedColorScheme === "light" ? "var(--mantine-color-gray-3)" : "var(--mantine-color-dark-4)"}`,
          }}
        >
          <Container fluid>
            <Flex
              justify="space-between"
              align="center"
              wrap="wrap"
              gap="sm"
            >
              <Flex
                align="center"
                gap="md"
                style={{ flex: 1, minWidth: 200 }}
              >
                <Progress
                  value={progressPercentage}
                  size="lg"
                  radius="xl"
                  style={{ flex: 1 }}
                  color={progressPercentage === 100 ? "green" : "blue"}
                />
                <Text size="sm" fw={500}>
                  {Object.keys(selectedAnswers).length}/{questions.length}
                </Text>
              </Flex>
              <Flex gap="xs" wrap="wrap">
                <Tooltip label={t("exam.correct")}>
                  <Badge
                    size="lg"
                    color="green"
                    variant="light"
                    leftSection={<IconCheck size={14} />}
                  >
                    {correctCount}
                  </Badge>
                </Tooltip>
                <Tooltip label={t("exam.incorrect")}>
                  <Badge
                    size="lg"
                    color="red"
                    variant="light"
                    leftSection={<IconX size={14} />}
                  >
                    {incorrectCount}
                  </Badge>
                </Tooltip>
                <Tooltip label={t("exam.unanswered")}>
                  <Badge
                    size="lg"
                    color="gray"
                    variant="light"
                    leftSection={<IconTarget size={14} />}
                    style={{ cursor: "pointer" }}
                    onClick={goToFirstUnanswered}
                  >
                    {questions.length - Object.keys(selectedAnswers).length}
                  </Badge>
                </Tooltip>
              </Flex>
            </Flex>
          </Container>
        </Box>
      )}

      {/* Question number badge for marathon */}
      {showProgressBar && (
        <Box p="lg" pb={0}>
          <Flex justify="center" align="center" gap="sm" mb="xs">
            <Badge size="lg" variant="filled" color="blue">
              {activeQuiz + 1} / {questions.length}
            </Badge>
          </Flex>
        </Box>
      )}

      {/* Question text */}
      <Box p="lg">
        <Text ta="center" size="lg" fw={500}>
          {localize(currentQuestion?.text)}
        </Text>
      </Box>

      <Container fluid px="lg">
        <Grid gutter="xl">
          {/* Options - left side */}
          <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 2, md: 1 }}>
            {currentQuestion?.options?.map((option: Option) => {
              const style = getOptionStyle(option);
              const iconProps = getActionIconProps(option);
              const isThisSelected = selectedOptionIndex === option.index;
              const isThisCorrect =
                option.index === currentQuestion.correctOptionIndex;

              return (
                <Paper
                  withBorder
                  p="xs"
                  mb="xs"
                  key={option.id}
                  role="button"
                  aria-label={`${t("exam.prev")} F${option.index + 1}`}
                  className={classes.optionPaper}
                  data-clickable={!isAnswered}
                  style={{
                    cursor: style.cursor,
                    borderColor: style.borderColor,
                    backgroundColor: style.backgroundColor,
                  }}
                  onClick={() =>
                    handleSelectAnswer(activeQuiz, option.index)
                  }
                >
                  <Flex gap="sm" align="center">
                    <ActionIcon
                      radius="xs"
                      variant={iconProps.variant}
                      color={iconProps.color}
                    >
                      {isSecureMode ? (
                        "F" + (option.index + 1)
                      ) : isAnswered && isThisCorrect ? (
                        <IconCheck size={16} />
                      ) : isAnswered && isThisSelected && !isThisCorrect ? (
                        <IconX size={16} />
                      ) : (
                        "F" + (option.index + 1)
                      )}
                    </ActionIcon>
                    <Text>{localize(option.text)}</Text>
                  </Flex>
                </Paper>
              );
            })}

            {/* Inline explanation (hidden in secure mode) */}
            {showExplanation &&
              !isSecureMode &&
              isAnswered &&
              currentQuestion?.explanation && (
                <>
                  <Button
                    variant="light"
                    color="blue"
                    fullWidth
                    mt="md"
                    onClick={() => {
                      const wasOpen = explanationOpen;
                      setExplanationOpen((o) => !o);

                      // When closing explanation → auto-advance to next question after 500ms
                      if (wasOpen && !isLastQuestion) {
                        if (autoAdvanceTimer.current) {
                          clearTimeout(autoAdvanceTimer.current);
                        }
                        autoAdvanceTimer.current = setTimeout(
                          () => goToNextQuestionRef.current(),
                          500,
                        );
                      }
                    }}
                  >
                    {explanationOpen
                      ? t("marathon.hideExplanation")
                      : t("marathon.showExplanation")}
                  </Button>
                  <Collapse in={explanationOpen} transitionDuration={300}>
                    <Paper
                      withBorder
                      p="md"
                      mt="xs"
                      style={{
                        borderColor: "var(--mantine-color-blue-3)",
                      }}
                    >
                      <Text size="sm">
                        {localize(currentQuestion?.explanation)}
                      </Text>
                    </Paper>
                  </Collapse>
                </>
              )}
          </Grid.Col>

          {/* Image - right side */}
          <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 1, md: 2 }}>
            <Image
              radius="xs"
              src={currentQuestion?.imageUrl}
              style={{ cursor: "pointer" }}
              fallbackSrc="https://placehold.co/600x400?text=Pravaonline"
              onClick={() => setImageModalOpened(true)}
              aria-label={t("exam.noQuestions")}
            />
          </Grid.Col>
        </Grid>
      </Container>

      {/* Image zoom modal */}
      <Modal
        opened={imageModalOpened}
        onClose={() => setImageModalOpened(false)}
        size="xl"
        centered
        withCloseButton
        padding={0}
      >
        <Image
          src={currentQuestion?.imageUrl}
          fit="contain"
          fallbackSrc="https://placehold.co/600x400?text=Pravaonline"
        />
      </Modal>

      {/* Result modal for error limit mode */}
      {errorLimitMode && (
        <Modal
          opened={resultModalOpened}
          onClose={() => {}}
          size="md"
          centered
          withCloseButton={false}
          closeOnClickOutside={false}
          closeOnEscape={false}
        >
          <Stack align="center" gap="lg" py="md">
            <Text size="xl" fw={700} c={isPassed ? "green" : "red"}>
              {isPassed
                ? t("exam.result.passed")
                : isTimeUp
                  ? t("exam.result.timeUp")
                  : t("exam.result.failed")}
            </Text>

            <Box w="100%">
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">
                  {t("exam.result.score")}
                </Text>
                <Text size="sm" fw={500}>
                  {correctCount} / {totalQuestions}
                </Text>
              </Group>
              <Progress
                value={correctPercentage}
                color={isPassed ? "green" : "red"}
                size="lg"
                radius="xl"
              />
            </Box>

            <Group grow w="100%">
              <Paper withBorder p="md" radius="md" ta="center">
                <Text size="xl" fw={700} c="green">
                  {correctCount}
                </Text>
                <Text size="xs" c="dimmed">
                  {t("exam.correct")}
                </Text>
              </Paper>
              <Paper withBorder p="md" radius="md" ta="center">
                <Text size="xl" fw={700} c="red">
                  {incorrectCount}
                </Text>
                <Text size="xs" c="dimmed">
                  {t("exam.incorrect")}
                </Text>
              </Paper>
              <Paper withBorder p="md" radius="md" ta="center">
                <Text size="xl" fw={700} c="gray">
                  {maxAllowedErrors}
                </Text>
                <Text size="xs" c="dimmed">
                  {t("exam.result.maxErrors")}
                </Text>
              </Paper>
            </Group>

            <Button fullWidth onClick={() => navigate("/me")}>
              {t("exam.result.goHome")}
            </Button>
          </Stack>
        </Modal>
      )}

      {/* Question navigation - bottom */}
      <Container fluid mt="xl" pb="xl">
        <Flex gap="md" justify="center" align="center" wrap="wrap">
          <Button
            variant="filled"
            color="gray"
            leftSection={<IconChevronLeft size={18} />}
            onClick={goToPrevQuestion}
            disabled={isFirstQuestion}
          >
            {t("exam.prev")}
          </Button>

          <Flex
            gap="2px"
            justify="center"
            wrap="wrap"
            style={{ overflowX: "auto", maxWidth: "60vw" }}
          >
            {questions.map((question: Question, i: number) => {
              const wasAnswered = selectedAnswers[i] !== undefined;
              const wasCorrect =
                wasAnswered &&
                selectedAnswers[i] === question.correctOptionIndex;
              const isActive = activeQuiz === i;

              return (
                <ActionIcon
                  size="lg"
                  key={question.id}
                  variant={
                    isActive ? "filled" : wasAnswered ? "filled" : "default"
                  }
                  color={
                    isActive
                      ? "blue"
                      : wasAnswered
                        ? isSecureMode
                          ? "blue"
                          : wasCorrect
                            ? "green"
                            : "red"
                        : undefined
                  }
                  onClick={() => setActiveQuiz(i)}
                  aria-label={`${t("exam.noQuestions")} ${i + 1}`}
                >
                  {i + 1}
                </ActionIcon>
              );
            })}
          </Flex>

          {isLastQuestion ? (
            <Button
              variant="filled"
              rightSection={
                showProgressBar ? (
                  <IconTrophy size={18} />
                ) : (
                  <IconCheck size={18} />
                )
              }
              onClick={handleFinishExam}
            >
              {t("exam.finish")}
            </Button>
          ) : (
            <Button
              variant="filled"
              color="gray"
              rightSection={<IconChevronRight size={18} />}
              onClick={goToNextQuestion}
            >
              {t("exam.next")}
            </Button>
          )}
        </Flex>
      </Container>
    </Box>
  );
}
