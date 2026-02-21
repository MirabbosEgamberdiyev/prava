import {
  Alert,
  Button,
  Title,
  SegmentedControl,
  Stack,
  SimpleGrid,
  Paper,
  Text,
  Group,
  RingProgress,
  Progress,
  Table,
  Badge,
  Center,
  Loader,
  ScrollArea,
  Tabs,
  ThemeIcon,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconChartBar,
  IconPackage,
  IconTicket,
  IconTrophy,
  IconClipboardList,
  IconClock,
  IconCheck,
  IconX,
  IconMinus,
  IconRefresh,
} from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import useSWR from "swr";
import { useLanguage } from "../../hooks/useLanguage";
import type { LocalizedText } from "../../types";

type TimePeriod = "today" | "week" | "month" | "all";

interface StatData {
  totalExams: number;
  passedExams: number;
  failedExams: number;
  averageScore: number;
  bestScore: number;
  totalCorrectAnswers: number;
  totalIncorrectAnswers: number;
  totalUnanswered: number;
  totalQuestions: number;
  totalTimeSpentSeconds: number;
  accuracy: number;
  currentStreak: number;
  longestStreak: number;
  packageStats?: PackageStatItem[];
  ticketStats?: TicketStatItem[];
  topicStats?: TopicStatItem[];
  marathonStats?: MarathonStatItem;
}

interface PackageStatItem {
  packageId: number;
  packageName: LocalizedText;
  totalExams: number;
  passedExams: number;
  failedExams: number;
  averageScore: number;
  bestScore: number;
}

interface TicketStatItem {
  ticketId: number;
  ticketNumber: number;
  ticketName: LocalizedText;
  totalExams: number;
  passedExams: number;
  averageScore: number;
  bestScore?: number;
  lastAttemptDate?: string;
}

interface TopicStatItem {
  topicId: number;
  topicName: LocalizedText;
  topicCode: string;
  totalExams: number;
  passedExams: number;
  averageScore: number;
  accuracy: number;
}

interface MarathonStatItem {
  totalExams: number;
  passedExams: number;
  failedExams: number;
  averageScore: number;
  totalCorrectAnswers: number;
  totalQuestions: number;
  accuracy: number;
}

const periodToUrl: Record<TimePeriod, string> = {
  today: "/api/v2/my-statistics/today",
  week: "/api/v2/my-statistics/this-week",
  month: "/api/v2/my-statistics/this-month",
  all: "/api/v2/my-statistics",
};

function formatTime(seconds: number, hLabel = "h", mLabel = "m"): string {
  if (!seconds) return `0${mLabel}`;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}${hLabel} ${mins}${mLabel}`;
  return `${mins}${mLabel}`;
}

const StatCard = ({
  label,
  value,
  icon,
  color = "blue",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}) => (
  <Paper p="md" radius="md" withBorder shadow="sm">
    <Group justify="space-between" mb="xs">
      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
        {label}
      </Text>
      <ThemeIcon variant="light" color={color} size="sm" radius="xl">
        {icon}
      </ThemeIcon>
    </Group>
    <Text size="xl" fw={700} c={color}>
      {value}
    </Text>
  </Paper>
);

function safePercent(value: number | undefined | null): string {
  const num = value ?? 0;
  return isNaN(num) ? "0.0" : num.toFixed(1);
}

const Statistics_Page = () => {
  const { t } = useTranslation();
  const { localize } = useLanguage();
  const [period, setPeriod] = useState<TimePeriod>("all");

  const { data: rawResponse, error, isLoading, isValidating, mutate } = useSWR<{ data: Record<string, unknown> }>(
    periodToUrl[period],
    { refreshInterval: 30_000 }
  );

  // Map backend nested response (summary.*) to flat StatData
  const stats: StatData | null = rawResponse?.data ? (() => {
    const d = rawResponse.data;
    // Support both flat (StatData) and nested (ComprehensiveStatisticsResponse) formats
    const summary = (d.summary as Record<string, unknown>) ?? d;
    return {
      totalExams: (summary.totalExams as number) ?? 0,
      passedExams: (summary.passedExams as number) ?? 0,
      failedExams: (summary.failedExams as number) ?? 0,
      averageScore: (summary.averageScore as number) ?? 0,
      bestScore: (summary.bestScore as number) ?? 0,
      totalCorrectAnswers: (summary.correctAnswers as number) ?? (summary.totalCorrectAnswers as number) ?? 0,
      totalIncorrectAnswers: (summary.wrongAnswers as number) ?? (summary.totalIncorrectAnswers as number) ?? 0,
      totalUnanswered: (summary.unansweredQuestions as number) ?? (summary.totalUnanswered as number) ?? 0,
      totalQuestions: (summary.totalQuestions as number) ?? 0,
      totalTimeSpentSeconds: (summary.totalTimeSpentSeconds as number) ?? 0,
      accuracy: (summary.accuracy as number) ?? 0,
      currentStreak: (summary.currentStreak as number) ?? 0,
      longestStreak: (summary.longestStreak as number) ?? 0,
      ticketStats: (d.ticketStats as TicketStatItem[]) ?? [],
      packageStats: (d.packageStats as PackageStatItem[]) ?? [],
      topicStats: (d.topicStats as TopicStatItem[]) ?? [],
      marathonStats: (d.marathonStats as MarathonStatItem) ?? null,
    };
  })() : null;

  const passRate =
    stats && stats.totalExams > 0
      ? Math.round((stats.passedExams / stats.totalExams) * 100)
      : 0;

  return (
    <>
      <Group justify="space-between" align="center" mb="lg">
        <Group gap="sm">
          <Title order={2}>{t("statistics.title")}</Title>
          {isValidating && !isLoading && (
            <Loader size="xs" />
          )}
        </Group>
        <Tooltip label={t("statistics.refreshing")}>
          <ActionIcon
            variant="light"
            size="lg"
            onClick={() => mutate()}
            loading={isValidating}
          >
            <IconRefresh size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <SegmentedControl
        value={period}
        onChange={(v) => setPeriod(v as TimePeriod)}
        data={[
          { label: t("statistics.today"), value: "today" },
          { label: t("statistics.thisWeek"), value: "week" },
          { label: t("statistics.thisMonth"), value: "month" },
          { label: t("statistics.allTime"), value: "all" },
        ]}
        fullWidth
        mb="lg"
      />

      {error && !isLoading && (
        <Alert color="red" icon={<IconAlertCircle size={16} />} mb="md">
          {t("statistics.loadError")}
          <Button size="xs" variant="light" ml="sm" onClick={() => mutate()}>
            {t("common.retry")}
          </Button>
        </Alert>
      )}

      {isLoading && (
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      )}

      {!isLoading && stats && (
        <Tabs defaultValue="overview">
          <Tabs.List mb="md">
            <Tabs.Tab value="overview" leftSection={<IconChartBar size={16} />}>
              {t("statistics.overview")}
            </Tabs.Tab>
            <Tabs.Tab value="packages" leftSection={<IconPackage size={16} />}>
              {t("statistics.packages")}
            </Tabs.Tab>
            <Tabs.Tab value="tickets" leftSection={<IconTicket size={16} />}>
              {t("statistics.tickets")}
            </Tabs.Tab>
            <Tabs.Tab value="marathon" leftSection={<IconTrophy size={16} />}>
              {t("statistics.marathon")}
            </Tabs.Tab>
          </Tabs.List>

          {/* Overview Tab */}
          <Tabs.Panel value="overview">
            <Stack gap="lg">
              {/* Main Stats Grid */}
              <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
                <StatCard
                  label={t("statistics.totalExams")}
                  value={stats.totalExams}
                  icon={<IconClipboardList size={14} />}
                  color="blue"
                />
                <StatCard
                  label={t("statistics.passed")}
                  value={stats.passedExams}
                  icon={<IconCheck size={14} />}
                  color="green"
                />
                <StatCard
                  label={t("statistics.failed")}
                  value={stats.failedExams}
                  icon={<IconX size={14} />}
                  color="red"
                />
                <StatCard
                  label={t("statistics.avgScore")}
                  value={`${safePercent(stats.averageScore)}%`}
                  icon={<IconChartBar size={14} />}
                  color="cyan"
                />
                <StatCard
                  label={t("statistics.bestScore")}
                  value={`${safePercent(stats.bestScore)}%`}
                  icon={<IconTrophy size={14} />}
                  color="yellow"
                />
                <StatCard
                  label={t("statistics.timeSpent")}
                  value={formatTime(stats.totalTimeSpentSeconds, t("statistics.hours"), t("statistics.minutes"))}
                  icon={<IconClock size={14} />}
                  color="teal"
                />
                <StatCard
                  label={t("statistics.currentStreak")}
                  value={stats.currentStreak ?? 0}
                  icon={<IconTrophy size={14} />}
                  color="orange"
                />
                <StatCard
                  label={t("statistics.longestStreak")}
                  value={stats.longestStreak ?? 0}
                  icon={<IconTrophy size={14} />}
                  color="grape"
                />
              </SimpleGrid>

              {/* Pass Rate Ring */}
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <Paper p="lg" radius="md" withBorder shadow="sm">
                  <Text size="sm" fw={600} mb="md">
                    {t("statistics.passRate")}
                  </Text>
                  <Center>
                    <RingProgress
                      size={160}
                      thickness={14}
                      roundCaps
                      label={
                        <Text size="lg" ta="center" fw={700}>
                          {passRate}%
                        </Text>
                      }
                      sections={[
                        { value: passRate, color: passRate >= 70 ? "green" : passRate >= 50 ? "yellow" : "red" },
                      ]}
                    />
                  </Center>
                  <Group justify="center" mt="md" gap="lg">
                    <Group gap="xs">
                      <Badge size="xs" color="green" circle />
                      <Text size="xs" c="dimmed">
                        {t("statistics.passed")}: {stats.passedExams}
                      </Text>
                    </Group>
                    <Group gap="xs">
                      <Badge size="xs" color="red" circle />
                      <Text size="xs" c="dimmed">
                        {t("statistics.failed")}: {stats.failedExams}
                      </Text>
                    </Group>
                  </Group>
                </Paper>

                {/* Answer Accuracy */}
                <Paper p="lg" radius="md" withBorder shadow="sm">
                  <Text size="sm" fw={600} mb="md">
                    {t("statistics.answerAccuracy")}
                  </Text>
                  {stats.totalQuestions > 0 ? (
                    <>
                      <Center>
                        <RingProgress
                          size={160}
                          thickness={14}
                          roundCaps
                          label={
                            <Text size="lg" ta="center" fw={700}>
                              {safePercent(stats.accuracy)}%
                            </Text>
                          }
                          sections={[
                            {
                              value: stats.totalQuestions > 0 ? (stats.totalCorrectAnswers / stats.totalQuestions) * 100 : 0,
                              color: "green",
                              tooltip: `${t("statistics.correct")}: ${stats.totalCorrectAnswers}`,
                            },
                            {
                              value: stats.totalQuestions > 0 ? (stats.totalIncorrectAnswers / stats.totalQuestions) * 100 : 0,
                              color: "red",
                              tooltip: `${t("statistics.incorrect")}: ${stats.totalIncorrectAnswers}`,
                            },
                            {
                              value: stats.totalQuestions > 0 ? ((stats.totalUnanswered ?? 0) / stats.totalQuestions) * 100 : 0,
                              color: "gray",
                              tooltip: `${t("statistics.unanswered")}: ${stats.totalUnanswered ?? 0}`,
                            },
                          ]}
                        />
                      </Center>
                      <Group justify="center" mt="md" gap="lg">
                        <Group gap="xs">
                          <Badge size="xs" color="green" circle />
                          <Text size="xs" c="dimmed">
                            {stats.totalCorrectAnswers}
                          </Text>
                        </Group>
                        <Group gap="xs">
                          <Badge size="xs" color="red" circle />
                          <Text size="xs" c="dimmed">
                            {stats.totalIncorrectAnswers}
                          </Text>
                        </Group>
                        <Group gap="xs">
                          <Badge size="xs" color="gray" circle />
                          <Text size="xs" c="dimmed">
                            {stats.totalUnanswered ?? 0}
                          </Text>
                        </Group>
                      </Group>
                    </>
                  ) : (
                    <Center py="xl">
                      <Text c="dimmed">{t("statistics.noData")}</Text>
                    </Center>
                  )}
                </Paper>
              </SimpleGrid>

              {/* Topic Stats */}
              {stats.topicStats && stats.topicStats.length > 0 && (
                <Paper p="md" radius="md" withBorder shadow="sm">
                  <Text size="sm" fw={600} mb="md">
                    {t("statistics.byTopic")}
                  </Text>
                  <Stack gap="sm">
                    {stats.topicStats.map((topic) => (
                      <div key={topic.topicId}>
                        <Group justify="space-between" mb={4}>
                          <Text size="sm">{localize(topic.topicName)}</Text>
                          <Group gap="xs">
                            <Badge size="xs" variant="light">
                              {topic.totalExams} {t("statistics.exams")}
                            </Badge>
                            <Text size="xs" c="dimmed">
                              {safePercent(topic.averageScore)}%
                            </Text>
                          </Group>
                        </Group>
                        <Progress
                          value={topic.accuracy ?? topic.averageScore ?? 0}
                          color={topic.averageScore >= 70 ? "green" : topic.averageScore >= 50 ? "yellow" : "red"}
                          size="sm"
                          radius="xl"
                        />
                      </div>
                    ))}
                  </Stack>
                </Paper>
              )}
            </Stack>
          </Tabs.Panel>

          {/* Packages Tab */}
          <Tabs.Panel value="packages">
            {stats.packageStats && stats.packageStats.length > 0 ? (
              <Paper withBorder radius="md" shadow="sm">
                <ScrollArea type="auto">
                  <Table striped highlightOnHover miw={600}>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>{t("statistics.packageName")}</Table.Th>
                        <Table.Th ta="center">{t("statistics.totalExams")}</Table.Th>
                        <Table.Th ta="center">{t("statistics.passed")}</Table.Th>
                        <Table.Th ta="center">{t("statistics.failed")}</Table.Th>
                        <Table.Th ta="center">{t("statistics.avgScore")}</Table.Th>
                        <Table.Th ta="center">{t("statistics.bestScore")}</Table.Th>
                        <Table.Th ta="center">{t("statistics.progress")}</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {stats.packageStats.map((pkg) => {
                        const pkgPassRate =
                          pkg.totalExams > 0
                            ? Math.round((pkg.passedExams / pkg.totalExams) * 100)
                            : 0;
                        return (
                          <Table.Tr key={pkg.packageId}>
                            <Table.Td fw={500}>{localize(pkg.packageName)}</Table.Td>
                            <Table.Td ta="center">{pkg.totalExams}</Table.Td>
                            <Table.Td ta="center">
                              <Badge size="sm" color="green" variant="light">
                                {pkg.passedExams}
                              </Badge>
                            </Table.Td>
                            <Table.Td ta="center">
                              <Badge size="sm" color="red" variant="light">
                                {pkg.failedExams}
                              </Badge>
                            </Table.Td>
                            <Table.Td ta="center">{safePercent(pkg.averageScore)}%</Table.Td>
                            <Table.Td ta="center">{safePercent(pkg.bestScore)}%</Table.Td>
                            <Table.Td ta="center" w={120}>
                              <Progress
                                value={pkgPassRate}
                                color={pkgPassRate >= 70 ? "green" : pkgPassRate >= 50 ? "yellow" : "red"}
                                size="sm"
                                radius="xl"
                              />
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </Paper>
            ) : (
              <Paper p="xl" radius="md" withBorder ta="center">
                <IconPackage size={48} color="gray" style={{ opacity: 0.5 }} />
                <Text c="dimmed" mt="sm">
                  {t("statistics.noPackageData")}
                </Text>
              </Paper>
            )}
          </Tabs.Panel>

          {/* Tickets Tab */}
          <Tabs.Panel value="tickets">
            {stats.ticketStats && stats.ticketStats.length > 0 ? (
              <Paper withBorder radius="md" shadow="sm">
                <ScrollArea type="auto">
                  <Table striped highlightOnHover miw={500}>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th w={60}>#</Table.Th>
                        <Table.Th>{t("statistics.ticketName")}</Table.Th>
                        <Table.Th ta="center">{t("statistics.totalExams")}</Table.Th>
                        <Table.Th ta="center">{t("statistics.passed")}</Table.Th>
                        <Table.Th ta="center">{t("statistics.avgScore")}</Table.Th>
                        <Table.Th ta="center">{t("statistics.bestScore")}</Table.Th>
                        <Table.Th ta="center">{t("statistics.lastAttempt")}</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {stats.ticketStats.map((ticket) => (
                        <Table.Tr key={ticket.ticketId}>
                          <Table.Td>{ticket.ticketNumber}</Table.Td>
                          <Table.Td fw={500}>{localize(ticket.ticketName)}</Table.Td>
                          <Table.Td ta="center">{ticket.totalExams}</Table.Td>
                          <Table.Td ta="center">
                            <Badge
                              size="sm"
                              color={ticket.passedExams > 0 ? "green" : "gray"}
                              variant="light"
                            >
                              {ticket.passedExams}/{ticket.totalExams}
                            </Badge>
                          </Table.Td>
                          <Table.Td ta="center">{safePercent(ticket.averageScore)}%</Table.Td>
                          <Table.Td ta="center">{safePercent(ticket.bestScore)}%</Table.Td>
                          <Table.Td ta="center">
                            {ticket.lastAttemptDate
                              ? new Date(ticket.lastAttemptDate).toLocaleDateString()
                              : "—"}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </Paper>
            ) : (
              <Paper p="xl" radius="md" withBorder ta="center">
                <IconTicket size={48} color="gray" style={{ opacity: 0.5 }} />
                <Text c="dimmed" mt="sm">
                  {t("statistics.noTicketData")}
                </Text>
              </Paper>
            )}
          </Tabs.Panel>

          {/* Marathon Tab */}
          <Tabs.Panel value="marathon">
            {stats.marathonStats && stats.marathonStats.totalExams > 0 ? (
              <Stack gap="md">
                <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
                  <StatCard
                    label={t("statistics.totalExams")}
                    value={stats.marathonStats.totalExams}
                    icon={<IconClipboardList size={14} />}
                    color="blue"
                  />
                  <StatCard
                    label={t("statistics.passed")}
                    value={stats.marathonStats.passedExams}
                    icon={<IconCheck size={14} />}
                    color="green"
                  />
                  <StatCard
                    label={t("statistics.failed")}
                    value={stats.marathonStats.failedExams}
                    icon={<IconX size={14} />}
                    color="red"
                  />
                  <StatCard
                    label={t("statistics.avgScore")}
                    value={`${safePercent(stats.marathonStats.averageScore)}%`}
                    icon={<IconChartBar size={14} />}
                    color="cyan"
                  />
                </SimpleGrid>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <Paper p="lg" radius="md" withBorder shadow="sm">
                    <Text size="sm" fw={600} mb="md">
                      {t("statistics.marathonPassRate")}
                    </Text>
                    <Center>
                      <RingProgress
                        size={140}
                        thickness={12}
                        roundCaps
                        label={
                          <Text size="md" ta="center" fw={700}>
                            {stats.marathonStats.totalExams > 0
                              ? Math.round(
                                  (stats.marathonStats.passedExams / stats.marathonStats.totalExams) * 100
                                )
                              : 0}
                            %
                          </Text>
                        }
                        sections={[
                          {
                            value:
                              stats.marathonStats.totalExams > 0
                                ? (stats.marathonStats.passedExams / stats.marathonStats.totalExams) * 100
                                : 0,
                            color: "green",
                          },
                        ]}
                      />
                    </Center>
                  </Paper>

                  <Paper p="lg" radius="md" withBorder shadow="sm">
                    <Text size="sm" fw={600} mb="md">
                      {t("statistics.marathonAccuracy")}
                    </Text>
                    <Center>
                      <RingProgress
                        size={140}
                        thickness={12}
                        roundCaps
                        label={
                          <Text size="md" ta="center" fw={700}>
                            {safePercent(stats.marathonStats.accuracy)}%
                          </Text>
                        }
                        sections={[
                          {
                            value: stats.marathonStats.accuracy ?? 0,
                            color: "cyan",
                          },
                        ]}
                      />
                    </Center>
                    <Group justify="center" mt="sm">
                      <Text size="xs" c="dimmed">
                        {stats.marathonStats.totalCorrectAnswers}/{stats.marathonStats.totalQuestions}{" "}
                        {t("statistics.correct").toLowerCase()}
                      </Text>
                    </Group>
                  </Paper>
                </SimpleGrid>
              </Stack>
            ) : (
              <Paper p="xl" radius="md" withBorder ta="center">
                <IconTrophy size={48} color="gray" style={{ opacity: 0.5 }} />
                <Text c="dimmed" mt="sm">
                  {t("statistics.noMarathonData")}
                </Text>
              </Paper>
            )}
          </Tabs.Panel>
        </Tabs>
      )}

      {!isLoading && !stats && (
        <Paper p="xl" radius="md" withBorder ta="center">
          <IconMinus size={48} color="gray" style={{ opacity: 0.5 }} />
          <Text c="dimmed" mt="sm">
            {t("statistics.noData")}
          </Text>
        </Paper>
      )}
    </>
  );
};

export default Statistics_Page;
