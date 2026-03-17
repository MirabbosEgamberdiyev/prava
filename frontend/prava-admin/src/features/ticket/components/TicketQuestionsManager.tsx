// features/ticket/components/TicketQuestionsManager.tsx

import { useState } from "react";
import {
  Stack,
  Group,
  Text,
  ActionIcon,
  Button,
  Paper,
  Badge,
  Alert,
  ThemeIcon,
  Box,
} from "@mantine/core";
import {
  IconPlus,
  IconRefresh,
  IconTrash,
  IconAlertCircle,
  IconListNumbers,
} from "@tabler/icons-react";
import Cookies from "js-cookie";
import { QuestionPickerModal } from "./QuestionPickerModal";
import type { TicketQuestionItem, TranslatedField } from "../types";
import type { Question } from "../../question/types";

// Internal unified type
interface ManagedQuestion {
  id: number;
  text: string;
  imageUrl?: string;
}

function resolveText(
  text: TranslatedField | string | null | undefined,
): string {
  if (!text) return "(matn yo'q)";
  if (typeof text === "string") return text;
  const lang = (Cookies.get("i18next") || "uzl") as keyof TranslatedField;
  return text[lang] || text.uzl || "";
}

function toManaged(q: TicketQuestionItem): ManagedQuestion {
  return {
    id: q.id,
    text: resolveText(q.text),
    imageUrl: q.imageUrl,
  };
}

function fromAdminQuestion(q: Question): ManagedQuestion {
  return {
    id: q.id,
    text: q.text || "(matn yo'q)",
    imageUrl: q.imageUrl || undefined,
  };
}

interface TicketQuestionsManagerProps {
  initialQuestions?: TicketQuestionItem[];
  topicId?: number;
  onChange: (questionIds: number[]) => void;
}

const MIN_QUESTIONS = 10;

export function TicketQuestionsManager({
  initialQuestions = [],
  topicId,
  onChange,
}: TicketQuestionsManagerProps) {
  const [questions, setQuestions] = useState<ManagedQuestion[]>(
    initialQuestions.map(toManaged),
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);

  const excludeIds = questions.map((q) => q.id);

  const updateQuestions = (newList: ManagedQuestion[]) => {
    setQuestions(newList);
    onChange(newList.map((q) => q.id));
  };

  const handleAdd = (q: Question) => {
    const managed = fromAdminQuestion(q);
    updateQuestions([...questions, managed]);
  };

  const handleReplace = (q: Question) => {
    if (replaceIndex === null) return;
    const managed = fromAdminQuestion(q);
    const newList = [...questions];
    newList[replaceIndex] = managed;
    updateQuestions(newList);
    setReplaceIndex(null);
  };

  const handleRemove = (index: number) => {
    updateQuestions(questions.filter((_, i) => i !== index));
  };

  const openAdd = () => {
    setReplaceIndex(null);
    setPickerOpen(true);
  };

  const openReplace = (index: number) => {
    setReplaceIndex(index);
    setPickerOpen(true);
  };

  const handlePickerSelect = (q: Question) => {
    if (replaceIndex !== null) {
      handleReplace(q);
    } else {
      handleAdd(q);
    }
  };

  // Picker uchun exclude: almashtirish holatida shu indeksdagini chiqarib, qolganlarni exclude
  const pickerExclude =
    replaceIndex !== null
      ? questions
          .filter((_, i) => i !== replaceIndex)
          .map((q) => q.id)
      : excludeIds;

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="center">
        <Group gap="xs">
          <ThemeIcon size="sm" color="blue" variant="light">
            <IconListNumbers size={14} />
          </ThemeIcon>
          <Text fw={600} size="sm">
            Savollar ro&apos;yxati
          </Text>
          <Badge
            color={questions.length >= MIN_QUESTIONS ? "green" : "orange"}
            variant="light"
            size="sm"
          >
            {questions.length} / {Math.max(questions.length, MIN_QUESTIONS)} ta
          </Badge>
        </Group>
        <Button
          size="xs"
          leftSection={<IconPlus size={14} />}
          variant="light"
          onClick={openAdd}
        >
          Savol qo&apos;shish
        </Button>
      </Group>

      {questions.length < MIN_QUESTIONS && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="orange"
          variant="light"
          p="xs"
        >
          <Text size="xs">
            Kamida {MIN_QUESTIONS} ta savol kerak (hozir: {questions.length})
          </Text>
        </Alert>
      )}

      {questions.length === 0 ? (
        <Paper p="md" withBorder style={{ borderStyle: "dashed" }}>
          <Text c="dimmed" ta="center" size="sm">
            Hali savollar tanlanmagan. &quot;Savol qo&apos;shish&quot; tugmasini
            bosing.
          </Text>
        </Paper>
      ) : (
        <Stack gap={4}>
          {questions.map((q, index) => (
            <Paper key={`${q.id}-${index}`} p="xs" withBorder>
              <Group gap="sm" wrap="nowrap" align="flex-start">
                <Badge
                  size="sm"
                  color="blue"
                  variant="filled"
                  style={{ flexShrink: 0, minWidth: 28 }}
                >
                  {index + 1}
                </Badge>

                {q.imageUrl ? (
                  <Box
                    style={{
                      width: 32,
                      height: 32,
                      flexShrink: 0,
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={q.imageUrl}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </Box>
                ) : null}

                <Text
                  size="sm"
                  lineClamp={2}
                  style={{ flex: 1, minWidth: 0, paddingTop: 2 }}
                >
                  {q.text}
                </Text>

                <Group gap={4} style={{ flexShrink: 0 }}>
                  <ActionIcon
                    size="sm"
                    variant="light"
                    color="blue"
                    onClick={() => openReplace(index)}
                    title="Almashtirish"
                  >
                    <IconRefresh size={13} />
                  </ActionIcon>
                  <ActionIcon
                    size="sm"
                    variant="light"
                    color="red"
                    onClick={() => handleRemove(index)}
                    title="O'chirish"
                  >
                    <IconTrash size={13} />
                  </ActionIcon>
                </Group>
              </Group>
            </Paper>
          ))}
        </Stack>
      )}

      <QuestionPickerModal
        opened={pickerOpen}
        onClose={() => {
          setPickerOpen(false);
          setReplaceIndex(null);
        }}
        onSelect={handlePickerSelect}
        defaultTopicId={topicId || undefined}
        excludeIds={pickerExclude}
      />

    </Stack>
  );
}
