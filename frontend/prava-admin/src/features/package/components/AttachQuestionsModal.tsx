/* eslint-disable @typescript-eslint/no-unused-vars */
// features/package/components/AttachQuestionsModal.tsx

import { useState } from "react";
import {
  Modal,
  Stack,
  TextInput,
  Button,
  Group,
  Checkbox,
  Text,
  Badge,
  Paper,
  LoadingOverlay,
  Pagination,
  Select,
} from "@mantine/core";
import { IconSearch, IconCheck } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useQuestions } from "../../question/hooks/useQuestions";
import type { Question } from "../../question/types";

interface AttachQuestionsModalProps {
  opened: boolean;
  onClose: () => void;
  packageId?: number;
  packageName: string;
  onAttach: (questionIds: number[]) => Promise<void>;
}

export function AttachQuestionsModal({
  opened,
  onClose,
  packageId: _packageId,
  packageName,
  onAttach,
}: AttachQuestionsModalProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { questions, pagination, isLoading } = useQuestions(page, 20);

  // Filter questions
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = search
      ? (q.text || "").toLowerCase().includes(search.toLowerCase())
      : true;
    const matchesDifficulty = difficulty ? q.difficulty === difficulty : true;
    return matchesSearch && matchesDifficulty;
  });

  const handleToggle = (questionId: number) => {
    setSelectedIds((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId],
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredQuestions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredQuestions.map((q) => q.id));
    }
  };

  const handleAttach = async () => {
    if (selectedIds.length === 0) return;

    setLoading(true);
    try {
      await onAttach(selectedIds);
      setSelectedIds([]);
      onClose();
    } catch (error) {
      console.error("Attach error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearch("");
    setDifficulty(null);
    setSelectedIds([]);
    setPage(1);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Stack gap={4}>
          <Text fw={600} size="lg">
            {t("packages.form.attachQuestions")}
          </Text>
          <Text size="sm" c="dimmed">
            {packageName}
          </Text>
        </Stack>
      }
      size="xl"
      closeOnClickOutside={false}
    >
      <Stack gap="md">
        {/* Filters */}
        <Group gap="sm">
          <TextInput
            placeholder={t("packages.form.searchQuestions")}
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder={t("packages.form.difficulty")}
            data={[
              { value: "EASY", label: t("packages.form.easy") },
              { value: "MEDIUM", label: t("packages.form.medium") },
              { value: "HARD", label: t("packages.form.hard") },
            ]}
            value={difficulty}
            onChange={setDifficulty}
            clearable
            style={{ width: 150 }}
          />
          <Button variant="light" onClick={handleReset}>
            {t("packages.form.clear")}
          </Button>
        </Group>

        {/* Select All */}
        <Group justify="space-between">
          <Checkbox
            label={
              selectedIds.length === filteredQuestions.length &&
              filteredQuestions.length > 0
                ? t("packages.form.allSelected")
                : t("packages.form.selectAll")
            }
            checked={
              selectedIds.length === filteredQuestions.length &&
              filteredQuestions.length > 0
            }
            onChange={handleSelectAll}
            disabled={filteredQuestions.length === 0}
          />
          <Text size="sm" c="dimmed">
            {t("packages.form.questionsSelected", { count: selectedIds.length })}
          </Text>
        </Group>

        {/* Questions List */}
        <Stack
          gap="xs"
          style={{
            maxHeight: 400,
            overflowY: "auto",
            position: "relative",
          }}
        >
          <LoadingOverlay visible={isLoading} />

          {filteredQuestions.length === 0 && !isLoading && (
            <Text c="dimmed" ta="center" py="xl">
              {t("common.noData")}
            </Text>
          )}

          {filteredQuestions.map((question) => (
            <QuestionItem
              key={question.id}
              question={question}
              selected={selectedIds.includes(question.id)}
              onToggle={() => handleToggle(question.id)}
            />
          ))}
        </Stack>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Group justify="center">
            <Pagination
              total={pagination.totalPages}
              value={page}
              onChange={setPage}
              size="sm"
            />
          </Group>
        )}

        {/* Actions */}
        <Group justify="flex-end" mt="md">
          <Button variant="light" onClick={onClose} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleAttach}
            disabled={selectedIds.length === 0}
            loading={loading}
            leftSection={<IconCheck size={16} />}
          >
            {t("packages.form.attach")} ({selectedIds.length})
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

// Question Item Component
interface QuestionItemProps {
  question: Question;
  selected: boolean;
  onToggle: () => void;
}

function QuestionItem({ question, selected, onToggle }: QuestionItemProps) {
  const { t } = useTranslation();

  const difficultyColor = {
    EASY: "green",
    MEDIUM: "yellow",
    HARD: "red",
  };

  const difficultyKey = {
    EASY: "packages.form.easy",
    MEDIUM: "packages.form.medium",
    HARD: "packages.form.hard",
  };

  return (
    <Paper
      p="sm"
      withBorder
      style={{
        cursor: "pointer",
        backgroundColor: selected
          ? "var(--mantine-color-blue-light)"
          : undefined,
        borderColor: selected ? "var(--mantine-color-blue-6)" : undefined,
      }}
      onClick={onToggle}
    >
      <Group wrap="nowrap" gap="sm">
        <Checkbox checked={selected} onChange={onToggle} />
        <Stack gap={4} style={{ flex: 1 }}>
          <Text size="sm" lineClamp={2}>
            {question.text}
          </Text>
          <Group gap="xs">
            <Badge
              size="xs"
              color={difficultyColor[question.difficulty!]}
              variant="light"
            >
              {t(difficultyKey[question.difficulty!])}
            </Badge>
            <Badge size="xs" variant="light">
              {question.topic?.name}
            </Badge>
            {question.isActive && (
              <Badge size="xs" color="green" variant="light">
                {t("common.active")}
              </Badge>
            )}
          </Group>
        </Stack>
      </Group>
    </Paper>
  );
}
