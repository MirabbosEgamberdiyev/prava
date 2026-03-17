// features/ticket/components/QuestionPickerModal.tsx

import { useState } from "react";
import {
  Modal,
  TextInput,
  Stack,
  Text,
  Group,
  Badge,
  Loader,
  ScrollArea,
  UnstyledButton,
  Pagination,
  Select,
  Box,
} from "@mantine/core";
import { IconSearch, IconPhoto } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useQuestions } from "../../question/hooks/useQuestions";
import { useTopicOptions } from "../../topic/hooks/useTopics";
import type { Question } from "../../question/types";

interface QuestionPickerModalProps {
  opened: boolean;
  onClose: () => void;
  onSelect: (question: Question) => void;
  defaultTopicId?: number;
  excludeIds?: number[];
}

export function QuestionPickerModal({
  opened,
  onClose,
  onSelect,
  defaultTopicId,
  excludeIds = [],
}: QuestionPickerModalProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [topicId, setTopicId] = useState<number | null>(defaultTopicId ?? null);

  const { options: topicOptions, isLoading: topicsLoading } = useTopicOptions();
  const { questions, pagination, isLoading } = useQuestions(page, 10, search, topicId);

  const filtered = questions.filter((q) => !excludeIds.includes(q.id) && q.isActive);

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleTopicChange = (val: string | null) => {
    setTopicId(val ? parseInt(val) : null);
    setPage(1);
  };

  const handleSelect = (q: Question) => {
    onSelect(q);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Savol tanlash"
      size="lg"
      centered
    >
      <Stack gap="md">
        <Group gap="sm">
          <TextInput
            placeholder={t("common.search")}
            value={search}
            onChange={(e) => handleSearch(e.currentTarget.value)}
            leftSection={<IconSearch size={14} />}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Mavzu"
            data={topicOptions}
            value={topicId?.toString() ?? null}
            onChange={handleTopicChange}
            disabled={topicsLoading}
            clearable
            searchable
            style={{ minWidth: 160 }}
          />
        </Group>

        <ScrollArea h={380}>
          {isLoading ? (
            <Group justify="center" py="xl">
              <Loader size="sm" />
            </Group>
          ) : filtered.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl" size="sm">
              {t("common.noData")}
            </Text>
          ) : (
            <Stack gap={6}>
              {filtered.map((q) => (
                <UnstyledButton
                  key={q.id}
                  onClick={() => handleSelect(q)}
                  style={(theme) => ({
                    padding: theme.spacing.sm,
                    borderRadius: theme.radius.sm,
                    border: `1px solid ${theme.colors.gray[3]}`,
                    backgroundColor: theme.white,
                    transition: "background-color 0.1s",
                    "&:hover": {
                      backgroundColor: theme.colors.blue[0],
                      borderColor: theme.colors.blue[4],
                    },
                  })}
                >
                  <Group gap="sm" wrap="nowrap" align="flex-start">
                    <Box
                      w={40}
                      h={40}
                      style={{
                        borderRadius: 4,
                        backgroundColor: "#f1f3f5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        overflow: "hidden",
                      }}
                    >
                      {q.imageUrl ? (
                        <img
                          src={q.imageUrl}
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <IconPhoto size={18} color="#868e96" />
                      )}
                    </Box>
                    <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                      <Text size="sm" lineClamp={2}>
                        {q.text || "(matn yo'q)"}
                      </Text>
                      <Group gap={4}>
                        {q.topic && (
                          <Badge size="xs" color="grape" variant="light">
                            {q.topic.name}
                          </Badge>
                        )}
                        <Badge size="xs" color="gray" variant="light">
                          ID: {q.id}
                        </Badge>
                      </Group>
                    </Stack>
                  </Group>
                </UnstyledButton>
              ))}
            </Stack>
          )}
        </ScrollArea>

        {pagination.totalPages > 1 && (
          <Group justify="center">
            <Pagination
              value={page}
              onChange={setPage}
              total={pagination.totalPages}
              size="sm"
            />
          </Group>
        )}
      </Stack>
    </Modal>
  );
}
