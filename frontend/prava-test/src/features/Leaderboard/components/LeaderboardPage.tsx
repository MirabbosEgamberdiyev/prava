import {
  Badge,
  Center,
  Flex,
  Loader,
  Pagination,
  Paper,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
  useComputedColorScheme,
} from "@mantine/core";
import { IconFlame, IconMedal } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import useSWR from "swr";
import type { LeaderboardResponse, TopicsResponse } from "../types";

export function LeaderboardPage() {
  const { t } = useTranslation();
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });
  const [page, setPage] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const { data: topicsResponse } = useSWR<TopicsResponse>(
    "/api/v1/admin/topics/with-questions",
  );

  const leaderboardUrl = selectedTopic
    ? `/api/v1/statistics/leaderboard/${selectedTopic}?page=${page}&size=20`
    : `/api/v1/statistics/leaderboard/global?page=${page}&size=20`;

  const { data: leaderboardResponse, isLoading } =
    useSWR<LeaderboardResponse>(leaderboardUrl);

  const leaderboard = leaderboardResponse?.data;
  const topics = topicsResponse?.data || [];

  const topicOptions = [
    { value: "", label: t("leaderboard.global") },
    ...topics.map((topic) => ({
      value: String(topic.id),
      label: topic.name,
    })),
  ];

  const handleTopicChange = (value: string | null) => {
    setSelectedTopic(value || null);
    setPage(0);
  };

  const getMedalColor = (rank: number) => {
    if (rank === 1) return "yellow";
    if (rank === 2) return "gray";
    if (rank === 3) return "#cd7f32";
    return undefined;
  };

  const getMedalIcon = (rank: number) => {
    if (rank <= 3) {
      return <IconMedal size={28} color={getMedalColor(rank)} />;
    }
    return null;
  };

  const top3 = leaderboard?.content.slice(0, 3) || [];
  const restEntries = leaderboard?.content.slice(3) || [];

  return (
    <>
      <Title order={2} mb="md">
        {t("leaderboard.title")}
      </Title>

      <Select
        data={topicOptions}
        value={selectedTopic || ""}
        onChange={handleTopicChange}
        placeholder={t("leaderboard.selectTopic")}
        mb="lg"
        radius="md"
        clearable={false}
      />

      {isLoading && (
        <Center py="xl">
          <Loader size="md" />
        </Center>
      )}

      {!isLoading && (!leaderboard || leaderboard.content.length === 0) && (
        <Paper p="xl" radius="md" withBorder shadow="sm" ta="center">
          <Text c="dimmed">{t("leaderboard.empty")}</Text>
        </Paper>
      )}

      {leaderboard && leaderboard.content.length > 0 && (
        <Stack gap="lg">
          {/* Top 3 Cards */}
          {top3.length > 0 && (
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              {top3.map((entry) => (
                <Paper
                  key={entry.userId}
                  p="lg"
                  radius="md"
                  withBorder
                  shadow="sm"
                  ta="center"
                  style={{
                    borderColor:
                      entry.rank === 1
                        ? "var(--mantine-color-yellow-5)"
                        : entry.rank === 2
                          ? "var(--mantine-color-gray-5)"
                          : "var(--mantine-color-orange-5)",
                    backgroundColor: entry.isCurrentUser
                      ? computedColorScheme === "light"
                        ? "var(--mantine-color-blue-0)"
                        : "var(--mantine-color-blue-9)"
                      : undefined,
                  }}
                >
                  <Stack align="center" gap="xs">
                    {getMedalIcon(entry.rank)}
                    <Text fw={700} size="lg">
                      {entry.fullName}
                    </Text>
                    <Badge size="lg" color={entry.rank === 1 ? "yellow" : entry.rank === 2 ? "gray" : "orange"}>
                      #{entry.rank}
                    </Badge>
                    <Text size="sm" c="dimmed">
                      {t("leaderboard.bestScore")}: {(entry.bestScore ?? 0).toFixed(0)}%
                    </Text>
                    <Text size="sm" c="dimmed">
                      {t("leaderboard.avgScore")}: {(entry.averageScore ?? 0).toFixed(0)}%
                    </Text>
                    <Flex align="center" gap={4}>
                      <IconFlame size={14} color="orange" />
                      <Text size="sm" c="dimmed">
                        {entry.currentStreak}
                      </Text>
                    </Flex>
                  </Stack>
                </Paper>
              ))}
            </SimpleGrid>
          )}

          {/* Table for rest */}
          {restEntries.length > 0 && (
            <Paper withBorder radius="md" shadow="sm">
              <ScrollArea type="auto">
              <Table striped highlightOnHover miw={600}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t("leaderboard.rank")}</Table.Th>
                    <Table.Th>{t("leaderboard.name")}</Table.Th>
                    <Table.Th ta="center">{t("leaderboard.bestScore")}</Table.Th>
                    <Table.Th ta="center">{t("leaderboard.avgScore")}</Table.Th>
                    <Table.Th ta="center">{t("leaderboard.totalExams")}</Table.Th>
                    <Table.Th ta="center">
                      <IconFlame size={16} />
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {restEntries.map((entry) => (
                    <Table.Tr
                      key={entry.userId}
                      style={{
                        backgroundColor: entry.isCurrentUser
                          ? computedColorScheme === "light"
                            ? "var(--mantine-color-blue-0)"
                            : "var(--mantine-color-blue-9)"
                          : undefined,
                      }}
                    >
                      <Table.Td>
                        <Badge variant="light" color="blue">
                          #{entry.rank}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={entry.isCurrentUser ? 700 : 400}>
                          {entry.fullName}
                          {entry.isCurrentUser && (
                            <Badge size="xs" ml="xs" variant="filled" color="blue">
                              {t("leaderboard.you")}
                            </Badge>
                          )}
                        </Text>
                      </Table.Td>
                      <Table.Td ta="center">
                        {(entry.bestScore ?? 0).toFixed(0)}%
                      </Table.Td>
                      <Table.Td ta="center">
                        {(entry.averageScore ?? 0).toFixed(0)}%
                      </Table.Td>
                      <Table.Td ta="center">{entry.totalExams}</Table.Td>
                      <Table.Td ta="center">{entry.currentStreak}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
              </ScrollArea>
            </Paper>
          )}

          {leaderboard.totalPages > 1 && (
            <Flex justify="center">
              <Pagination
                value={page + 1}
                onChange={(p) => setPage(p - 1)}
                total={leaderboard.totalPages}
              />
            </Flex>
          )}
        </Stack>
      )}
    </>
  );
}
