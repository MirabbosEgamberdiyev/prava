import {
  Badge,
  Center,
  Flex,
  Group,
  Loader,
  Pagination,
  Paper,
  Progress,
  ScrollArea,
  SegmentedControl,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconClock } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import useSWR from "swr";
import { useLanguage } from "../../../hooks/useLanguage";
import type { ExamHistoryResponse, ExamHistoryItem, HistoryFilterStatus } from "../types";

export function ExamHistoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { lang, localize } = useLanguage();
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<HistoryFilterStatus>("ALL");

  const apiUrl =
    filter === "ALL"
      ? `/api/v2/exams/history?page=${page}&size=20&sortBy=startedAt&direction=DESC&lang=${lang}`
      : `/api/v2/exams/history/status/${filter}?page=${page}&size=20&lang=${lang}`;

  const { data: historyResponse, isLoading } =
    useSWR<ExamHistoryResponse>(apiUrl);

  const history = historyResponse?.data;

  const filterOptions = [
    { label: t("history.all"), value: "ALL" },
    { label: t("history.completed"), value: "COMPLETED" },
    { label: t("history.failed"), value: "FAILED" },
    { label: t("history.inProgress"), value: "IN_PROGRESS" },
    { label: t("history.abandoned"), value: "ABANDONED" },
  ];

  const handleFilterChange = (value: string) => {
    setFilter(value as HistoryFilterStatus);
    setPage(0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (item: ExamHistoryItem) => {
    if (item.status === "IN_PROGRESS") return "blue";
    if (item.status === "ABANDONED") return "gray";
    return item.passed ? "green" : "red";
  };

  const getStatusLabel = (item: ExamHistoryItem) => {
    if (item.status === "IN_PROGRESS") return t("history.inProgress");
    if (item.status === "ABANDONED") return t("history.abandoned");
    return item.passed ? t("history.passedLabel") : t("history.failedLabel");
  };

  const getExamName = (item: ExamHistoryItem) => {
    if (item.packageName) return localize(item.packageName);
    if (item.ticketName)
      return `${localize(item.ticketName)} #${item.ticketNumber}`;
    if (item.isMarathon) return t("marathon.title");
    return t("history.exam");
  };

  return (
    <>
      <Title order={2} mb="md">
        {t("history.title")}
      </Title>

      <ScrollArea type="auto">
        <SegmentedControl
          value={filter}
          onChange={handleFilterChange}
          data={filterOptions}
          mb="lg"
          fullWidth
          size="sm"
          radius="md"
        />
      </ScrollArea>

      {isLoading && (
        <Center py="xl">
          <Loader size="md" />
        </Center>
      )}

      {!isLoading && (!history || history.content.length === 0) && (
        <Paper p="xl" radius="md" withBorder shadow="sm" ta="center">
          <Text c="dimmed">{t("history.empty")}</Text>
        </Paper>
      )}

      {history && history.content.length > 0 && (
        <Stack gap="sm">
          {history.content.map((item) => (
            <Paper
              key={item.sessionId}
              p="md"
              radius="md"
              withBorder
              shadow="sm"
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/exam/result/${item.sessionId}`)}
            >
              <Flex
                justify="space-between"
                align={{ base: "flex-start", sm: "center" }}
                direction={{ base: "column", sm: "row" }}
                gap="sm"
              >
                <Stack gap={4} style={{ flex: 1 }}>
                  <Group gap="xs">
                    <Text fw={600}>{getExamName(item)}</Text>
                    <Badge
                      size="sm"
                      color={getStatusColor(item)}
                      variant="light"
                    >
                      {getStatusLabel(item)}
                    </Badge>
                  </Group>
                  <Group gap="xs">
                    <Text size="xs" c="dimmed">
                      {formatDate(item.startedAt)}
                    </Text>
                    {item.totalTimeSpentSeconds > 0 && (
                      <Flex align="center" gap={4}>
                        <IconClock size={12} color="gray" />
                        <Text size="xs" c="dimmed">
                          {formatDuration(item.totalTimeSpentSeconds)}
                        </Text>
                      </Flex>
                    )}
                  </Group>
                </Stack>

                <Flex
                  align="center"
                  gap="md"
                  w={{ base: "100%", sm: 200 }}
                  justify="flex-end"
                >
                  <Stack gap={2} style={{ flex: 1, minWidth: 100 }}>
                    <Progress
                      value={item.percentage}
                      size="lg"
                      radius="xl"
                      color={getStatusColor(item)}
                    />
                    <Text size="xs" c="dimmed" ta="right">
                      {item.correctAnswers}/{item.totalQuestions} (
                      {item.percentage.toFixed(0)}%)
                    </Text>
                  </Stack>
                </Flex>
              </Flex>
            </Paper>
          ))}

          {history.totalPages > 1 && (
            <Flex justify="center" mt="md">
              <Pagination
                value={page + 1}
                onChange={(p) => setPage(p - 1)}
                total={history.totalPages}
              />
            </Flex>
          )}
        </Stack>
      )}
    </>
  );
}
