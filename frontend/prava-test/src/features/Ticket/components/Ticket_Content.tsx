import { useState, useEffect, useRef, useCallback } from "react";
import {
  ActionIcon,
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Image,
  Paper,
  Text,
  Modal,
  useComputedColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import {
  IconCheck,
  IconX,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
// Ko'p tilli matn interfeysi
interface LocalizedText {
  uzl: string;
  uzc: string;
  en: string;
  ru: string;
}

// Option interfeysi
interface Option {
  id: number;
  index: number;
  text: LocalizedText;
}

// Question interfeysi
interface Question {
  id: number;
  order: number;
  text: LocalizedText;
  imageUrl?: string | null;
  options: Option[];
  correctOptionIndex: number;
  explanation: LocalizedText;
}

// ExamData interfeysi
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
    questions: Question[];
  };
}

interface TicketContentProps {
  examData: TicketExamData;
  onAnswerSelect: (
    questionIndex: number,
    optionIndex: number,
    timeSpentSeconds: number
  ) => void;
  onFinish: () => void;
  selectedAnswers: Record<
    number,
    { optionIndex: number; timeSpentSeconds: number }
  >;
}

// Tilni olish funksiyasi
type LanguageKey = "uzl" | "uzc" | "en" | "ru";

function getLocalizedText(
  text: LocalizedText | string | undefined,
  lang: LanguageKey
): string {
  if (!text) return "";
  if (typeof text === "string") return text;
  return text[lang] || text.uzl || "";
}

export function Ticket_Content({
  examData,
  onAnswerSelect,
  onFinish,
  selectedAnswers: parentAnswers,
}: TicketContentProps) {
  const { t, i18n } = useTranslation();
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });

  // Rasmni kattalashtirish uchun modal
  const [imageModalOpened, { open: openImageModal, close: closeImageModal }] =
    useDisclosure(false);

  // Tilni i18n event orqali kuzatish (polling o'rniga)
  const [lang, setLang] = useState<LanguageKey>(
    (i18n.language || "uzl") as LanguageKey
  );

  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setLang(lng as LanguageKey);
    };
    i18n.on("languageChanged", handleLanguageChanged);
    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, [i18n]);

  // API dan kelgan savollar
  const questions = examData?.data?.questions || [];

  const [activeQuiz, setActiveQuiz] = useState(0);

  // Parent dan kelgan javoblarni local formatga o'tkazish
  const selectedAnswers: Record<number, number> = Object.entries(
    parentAnswers
  ).reduce(
    (acc, [key, value]) => {
      acc[Number(key)] = value.optionIndex;
      return acc;
    },
    {} as Record<number, number>
  );

  // Parent answers o'zgarganda (reset bo'lganda) activeQuiz ni ham 0 ga qaytarish
  useEffect(() => {
    if (Object.keys(parentAnswers).length === 0) {
      setActiveQuiz(0);
    }
  }, [parentAnswers]);

  // Har bir savol uchun sarflangan vaqt
  const questionStartTime = useRef<number>(Date.now());
  const timeSpentPerQuestion = useRef<Record<number, number>>({});

  // Savol o'zgarganda vaqtni yangilash
  useEffect(() => {
    questionStartTime.current = Date.now();
  }, [activeQuiz]);

  // Joriy savol
  const currentQuestion = questions[activeQuiz];

  // Bu savolga javob berilganmi?
  const isAnswered = selectedAnswers[activeQuiz] !== undefined;
  const selectedOptionIndex = selectedAnswers[activeQuiz];

  // Birinchi va oxirgi savolmi?
  const isFirstQuestion = activeQuiz === 0;
  const isLastQuestion = activeQuiz === questions.length - 1;

  // Barcha savollarga javob berilganmi?
  const allAnswered = Object.keys(selectedAnswers).length === questions.length;

  // Keyingi savolga o'tish
  const goToNextQuestion = useCallback(() => {
    if (activeQuiz < questions.length - 1) {
      setActiveQuiz((prev) => prev + 1);
    }
  }, [activeQuiz, questions.length]);

  // Avvalgi savolga o'tish
  const goToPrevQuestion = useCallback(() => {
    if (activeQuiz > 0) {
      setActiveQuiz((prev) => prev - 1);
    }
  }, [activeQuiz]);

  // F1, F2, F3, F4, F5 klaviatura tugmalari bilan javob tanlash
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F1" ||
        e.key === "F2" ||
        e.key === "F3" ||
        e.key === "F4" ||
        e.key === "F5"
      ) {
        e.preventDefault();

        const optionIndex = parseInt(e.key.replace("F", "")) - 1;
        const options = currentQuestion?.options || [];

        if (optionIndex < options.length) {
          handleSelectAnswer(activeQuiz, optionIndex);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeQuiz, currentQuestion, selectedAnswers]);

  // Javobni tanlash (faqat bir marta)
  const handleSelectAnswer = (questionIndex: number, optionIndex: number) => {
    if (selectedAnswers[questionIndex] !== undefined) {
      return;
    }

    const timeSpent = Math.floor(
      (Date.now() - questionStartTime.current) / 1000
    );
    timeSpentPerQuestion.current[questionIndex] = timeSpent;

    onAnswerSelect(questionIndex, optionIndex, timeSpent);

    // 1 soniyadan keyin keyingi savolga o'tish
    if (questionIndex < questions.length - 1) {
      setTimeout(() => {
        goToNextQuestion();
      }, 1000);
    }
  };

  // Agar savollar bo'sh bo'lsa
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

  // Variant uchun rang aniqlash
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

  // ActionIcon rangi
  const getActionIconProps = (option: Option) => {
    if (!isAnswered) {
      return { variant: "default" as const, color: undefined };
    }

    const isThisSelected = selectedOptionIndex === option.index;
    const isThisCorrect = option.index === currentQuestion.correctOptionIndex;

    if (isThisCorrect) {
      return { variant: "filled" as const, color: "green" };
    }

    if (isThisSelected && !isThisCorrect) {
      return { variant: "filled" as const, color: "red" };
    }

    return { variant: "default" as const, color: undefined };
  };

  return (
    <Box bg={computedColorScheme === "light" ? "gray.1" : "dark.8"} mih="92vh">
      {/* Savol matni */}
      <Box p="lg">
        <Text ta="center" size="lg" fw={500}>
          {getLocalizedText(currentQuestion?.text, lang)}
        </Text>
      </Box>

      <Container fluid px="lg">
        <Grid gutter="xl">
          {/* Javoblar - chapda */}
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
                  style={{
                    cursor: style.cursor,
                    borderColor: style.borderColor,
                    backgroundColor: style.backgroundColor,
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => handleSelectAnswer(activeQuiz, option.index)}
                >
                  <Flex gap="sm" align="center">
                    <ActionIcon
                      radius="xs"
                      variant={iconProps.variant}
                      color={iconProps.color}
                    >
                      {isAnswered && isThisCorrect ? (
                        <IconCheck size={16} />
                      ) : isAnswered && isThisSelected && !isThisCorrect ? (
                        <IconX size={16} />
                      ) : (
                        "F" + (option.index + 1)
                      )}
                    </ActionIcon>
                    <Text>{getLocalizedText(option.text, lang)}</Text>
                  </Flex>
                </Paper>
              );
            })}
          </Grid.Col>

          {/* Rasm - o'ngda */}
          <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 1, md: 2 }}>
            <Image
              radius="xs"
              src={currentQuestion?.imageUrl}
              style={{ cursor: "pointer" }}
              fallbackSrc="https://placehold.co/600x400?text=Pravaonline"
              onClick={openImageModal}
            />
          </Grid.Col>
        </Grid>
      </Container>

      {/* Rasmni kattalashtirish modali */}
      <Modal
        opened={imageModalOpened}
        onClose={closeImageModal}
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

      {/* Savol raqamlari - pastda */}
      <Container fluid mt="xl" pb="xl">
        <Flex gap="md" justify="center" align="center" wrap="wrap">
          {/* Avvalgi tugmasi */}
          <Button
            variant="filled"
            color="gray"
            leftSection={<IconChevronLeft size={18} />}
            onClick={goToPrevQuestion}
            disabled={isFirstQuestion}
          >
            {t("exam.prev")}
          </Button>

          {/* Savol raqamlari */}
          <Flex gap="2px" justify="center" wrap="wrap">
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
                        ? wasCorrect
                          ? "green"
                          : "red"
                        : undefined
                  }
                  onClick={() => setActiveQuiz(i)}
                >
                  {i + 1}
                </ActionIcon>
              );
            })}
          </Flex>

          {/* Keyingi yoki Yakunlash tugmasi */}
          {isLastQuestion ? (
            <Button
              variant="filled"
              rightSection={<IconCheck size={18} />}
              onClick={onFinish}
              disabled={!allAnswered}
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
