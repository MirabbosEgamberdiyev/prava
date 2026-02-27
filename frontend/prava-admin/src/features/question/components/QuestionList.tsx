import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Image,
  Text,
  Badge,
  Group,
  Stack,
  ActionIcon,
  Pagination,
  Center,
  Loader,
  Divider,
  Grid,
  Tooltip,
  Paper,
  Box,
  useMantineColorScheme,
} from "@mantine/core";
import {
  IconEdit,
  IconTrash,
  IconEye,
  IconCircleCheckFilled,
  IconChartBar,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useQuestions } from "../hooks/useQuestions";
import { QuestionViewModal } from "./QuestionViewModal";
import { QuestionDeleteModal } from "./QuestionDeleteModal";
import { getImageUrl } from "../../../utils/imageUtils";
import type { Question } from "../types";

const difficultyColors: Record<string, string> = {
  EASY: "green",
  MEDIUM: "yellow",
  HARD: "red",
};

interface QuestionListProps {
  searchQuery?: string;
  topicId?: number | null;
}

export const QuestionList = ({ searchQuery, topicId }: QuestionListProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const [activePage, setPage] = useState(1);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(
    null,
  );

  const { questions, pagination, isLoading, isError, mutate } = useQuestions(
    activePage,
    20,
    searchQuery,
    topicId,
  );

  const handleView = (question: Question) => {
    setSelectedQuestionId(question.id);
    setViewModalOpen(true);
  };

  const handleEdit = (question: Question) => {
    navigate(`/questions/edit/${question.id}`);
  };

  const handleDeleteClick = (question: Question) => {
    setSelectedQuestionId(question.id);
    setDeleteModalOpen(true);
  };

  if (isLoading) {
    return (
      <Center h={400}>
        <Loader color="blue" type="bars" />
      </Center>
    );
  }

  if (isError) {
    return (
      <Center h={200}>
        <Text c="red" fw={500}>
          {t("questions.errorLoading")}
        </Text>
      </Center>
    );
  }

  if (questions.length === 0) {
    return (
      <Center h={200}>
        <Text c="dimmed">{t("common.noData")}</Text>
      </Center>
    );
  }

  return (
    <Box>
      <Stack gap="md">
        {questions.map((q: Question) => (
          <Card key={q.id} shadow="sm" padding="md" radius="md" withBorder>
            <Grid gutter="lg">
              {/* ✅ Rasm — getImageUrl orqali to'g'ri URL */}
              {q.imageUrl && (
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Image
                    src={getImageUrl(q.imageUrl)}
                    radius="md"
                    h={160}
                    fallbackSrc="https://placehold.co/400x300?text=No+image"
                    fit="contain"
                    bg="gray.0"
                  />
                </Grid.Col>
              )}

              <Grid.Col span={{ base: 12, md: q.imageUrl ? 8 : 12 }}>
                <Stack gap="xs">
                  <Group justify="space-between" align="flex-start">
                    <Stack gap={2}>
                      <Group gap="xs">
                        <Badge size="xs" variant="filled" color="blue">
                          ID: {q.id}
                        </Badge>
                        {q.topic && (
                          <Badge size="xs" variant="light" color="gray">
                            {q.topic.name}
                          </Badge>
                        )}
                      </Group>
                      <Text fw={700} size="lg" mt="sm" lineClamp={2}>
                        {q.text || t("common.noData")}
                      </Text>
                    </Stack>

                    <Group gap={5}>
                      <Tooltip label={t("questions.viewTooltip")}>
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => handleView(q)}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label={t("questions.editTooltip")}>
                        <ActionIcon
                          variant="light"
                          color="orange"
                          onClick={() => handleEdit(q)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label={t("questions.deleteTooltip")}>
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => handleDeleteClick(q)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Group>

                  <Text size="sm" c="dimmed" lineClamp={2}>
                    {q.explanation}
                  </Text>

                  <Group mt="md" gap="xl">
                    {q.difficulty && (
                      <Badge
                        color={difficultyColors[q.difficulty]}
                        variant="dot"
                      >
                        {q.difficulty}
                      </Badge>
                    )}
                    <Group gap={5} c="dimmed">
                      <IconChartBar size={16} />
                      <Text size="xs">
                        {t("questions.successRate", { rate: q.successRate })}
                      </Text>
                    </Group>
                  </Group>
                </Stack>
              </Grid.Col>
            </Grid>

            <Divider my="md" variant="dashed" />

            <Text size="xs" fw={700} c="dimmed" mb="xs" tt="uppercase">
              {t("questions.options")}:
            </Text>
            <Grid gutter="xs">
              {q.options && q.options.length > 0 ? (
                q.options.map((option) => (
                  <Grid.Col span={{ base: 12, sm: 6 }} key={option.id}>
                    <Paper
                      withBorder
                      p="xs"
                      radius="xs"
                      bg={
                        q.correctAnswerIndex === option.optionIndex
                          ? isDark
                            ? "green.9"
                            : "green.0"
                          : "transparent"
                      }
                      style={{
                        borderColor:
                          q.correctAnswerIndex === option.optionIndex
                            ? isDark
                              ? "var(--mantine-color-green-7)"
                              : "var(--mantine-color-green-4)"
                            : "",
                      }}
                    >
                      <Group gap="xs" wrap="nowrap">
                        {q.correctAnswerIndex === option.optionIndex ? (
                          <IconCircleCheckFilled
                            size={16}
                            color="var(--mantine-color-green-6)"
                          />
                        ) : (
                          <Text size="xs" fw={700} c="dimmed">
                            {String.fromCharCode(65 + option.optionIndex)}:
                          </Text>
                        )}
                        <Text size="xs" lineClamp={1}>
                          {option.text}
                        </Text>
                      </Group>
                    </Paper>
                  </Grid.Col>
                ))
              ) : (
                <Grid.Col span={12}>
                  <Text size="xs" c="dimmed">
                    {t("common.noData")}
                  </Text>
                </Grid.Col>
              )}
            </Grid>
          </Card>
        ))}
      </Stack>

      {pagination.totalPages > 1 && (
        <Pagination
          total={pagination.totalPages}
          value={activePage}
          onChange={setPage}
          withEdges
          siblings={8}
          mt="lg"
        />
      )}

      <QuestionViewModal
        opened={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        questionId={selectedQuestionId}
      />

      <QuestionDeleteModal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        questionId={selectedQuestionId}
        onSuccess={() => mutate()}
      />
    </Box>
  );
};
