import { useState } from "react";
import {
  Title, Paper, Text, Group, Stack, Badge, Center, Loader,
  ActionIcon, Tooltip, Collapse, Image, Alert, Button,
  ThemeIcon, Box,
} from "@mantine/core";
import {
  IconBookmark, IconBookmarkOff, IconCheck, IconX,
  IconRefresh, IconChevronDown, IconChevronRight,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import useSWR from "swr";
import { useLanguage } from "../../hooks/useLanguage";
import { EmptyState } from "../../components/common/EmptyState";
import SEO from "../../components/common/SEO";
import { getImageUrl } from "../../utils/imageUtils";
import api from "../../api/api";
import type { LocalizedText } from "../../types";

interface OptionItem {
  text: LocalizedText;
}

interface SavedQuestionItem {
  questionId: number;
  savedAt: string;
  text?: LocalizedText;
  imageUrl?: string;
  options?: OptionItem[];
  correctOptionIndex?: number;
  explanation?: LocalizedText;
  topicId?: number;
  topicName?: LocalizedText;
}

const SavedQuestions_Page = () => {
  const { t } = useTranslation();
  const { localize } = useLanguage();
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data: rawResponse, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: SavedQuestionItem[];
  }>("/api/v1/app/saved-questions", { refreshInterval: 0 });

  const entries: SavedQuestionItem[] = (() => {
    if (!rawResponse) return [];
    const d = rawResponse.data;
    if (Array.isArray(d)) return d;
    if (Array.isArray(rawResponse)) return rawResponse as unknown as SavedQuestionItem[];
    return [];
  })();

  const handleRemove = async (questionId: number) => {
    try {
      await api.post(`/api/v1/app/saved-questions/${questionId}`);
      mutate();
    } catch (e) {
      console.warn("Failed to remove saved question:", e);
    }
  };

  const toggle = (id: number) => setExpanded(expanded === id ? null : id);

  return (
    <>
      <SEO
        title="Saqlangan savollar"
        description="Belgilangan muhim savollaringizni ko'ring va takrorlang."
        canonical="/saved-questions"
        noIndex={true}
      />

      <Group justify="space-between" align="center" mb="lg">
        <Group gap="sm">
          <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: "blue", to: "cyan" }}>
            <IconBookmark size={20} />
          </ThemeIcon>
          <div>
            <Title order={2}>{t("saved.title")}</Title>
            {entries.length > 0 && (
              <Text size="xs" c="dimmed">{entries.length} {t("common.questions")}</Text>
            )}
          </div>
        </Group>
        <Tooltip label={t("common.refresh")}>
          <ActionIcon variant="light" size="lg" onClick={() => mutate()}>
            <IconRefresh size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>

      {error && !isLoading && (
        <Alert color="red" icon={<IconBookmark size={16} />} mb="md">
          {t("common.loadError", { defaultValue: "Ma'lumotlarni yuklashda xatolik" })}
          <Button size="xs" variant="light" ml="sm" onClick={() => mutate()}>
            {t("common.retry")}
          </Button>
        </Alert>
      )}

      {isLoading && (
        <Center py={60}><Loader size="lg" /></Center>
      )}

      {!isLoading && !error && entries.length === 0 && (
        <EmptyState
          icon={<IconBookmark size={48} color="blue" style={{ opacity: 0.5 }} />}
          title={t("saved.emptyTitle")}
          description={t("saved.emptySub")}
        />
      )}

      {!isLoading && entries.length > 0 && (
        <Stack gap="sm">
          {entries.map((entry) => {
            const isOpen = expanded === entry.questionId;
            const opts = entry.options || [];
            const img = getImageUrl(entry.imageUrl);

            return (
              <Paper key={entry.questionId} withBorder radius="md" shadow="sm" p={0} style={{ overflow: "hidden" }}>
                <Group
                  px="md" py="sm"
                  justify="space-between"
                  wrap="nowrap"
                  style={{ cursor: "pointer" }}
                  onClick={() => toggle(entry.questionId)}
                >
                  <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                    <ThemeIcon color="blue" variant="light" size="sm" radius="xl">
                      <IconBookmark size={12} />
                    </ThemeIcon>
                    <Text size="sm" fw={500} lineClamp={isOpen ? undefined : 2} style={{ flex: 1 }}>
                      {localize(entry.text)}
                    </Text>
                  </Group>
                  <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
                    {entry.topicName && (
                      <Badge color="blue" variant="light" size="xs">
                        {localize(entry.topicName)}
                      </Badge>
                    )}
                    <Tooltip label={t("saved.remove")}>
                      <ActionIcon
                        variant="light" color="gray" size="sm"
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleRemove(entry.questionId); }}
                      >
                        <IconBookmarkOff size={14} />
                      </ActionIcon>
                    </Tooltip>
                    {isOpen ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
                  </Group>
                </Group>

                <Collapse in={isOpen}>
                  <Box px="md" pb="md">
                    {img && (
                      <Center mb="sm">
                        <Image src={img} alt="" radius="md" maw={400} fit="contain" />
                      </Center>
                    )}
                    <Stack gap={4}>
                      {opts.map((opt, idx) => {
                        const isCorrect = idx === entry.correctOptionIndex;
                        return (
                          <Paper
                            key={idx}
                            withBorder
                            radius="sm"
                            px="sm" py={6}
                            bg={isCorrect ? "green.0" : undefined}
                            style={{ borderColor: isCorrect ? "var(--mantine-color-green-4)" : undefined }}
                          >
                            <Group gap="xs" wrap="nowrap">
                              {isCorrect
                                ? <IconCheck size={14} color="green" />
                                : <IconX size={14} color="var(--mantine-color-dimmed)" />
                              }
                              <Text size="sm" c={isCorrect ? "green.8" : undefined}>
                                {localize(opt.text)}
                              </Text>
                            </Group>
                          </Paper>
                        );
                      })}
                    </Stack>
                    {entry.explanation && localize(entry.explanation) && (
                      <Alert color="blue" variant="light" mt="sm" radius="md">
                        <Text size="xs">{localize(entry.explanation)}</Text>
                      </Alert>
                    )}
                  </Box>
                </Collapse>
              </Paper>
            );
          })}
        </Stack>
      )}
    </>
  );
};

export default SavedQuestions_Page;
