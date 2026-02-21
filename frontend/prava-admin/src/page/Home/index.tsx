import {
  Grid,
  Card,
  Text,
  Group,
  Stack,
  Title,
  Badge,
  Table,
  Center,
  Loader,
  Progress,
  Paper,
  ThemeIcon,
  Pagination,
  RingProgress,
  SimpleGrid,
  Skeleton,
} from "@mantine/core";
import {
  IconUsers,
  IconQuestionMark,
  IconFolder,
  IconTicket,
  IconClipboardCheck,
  IconTrendingUp,
  IconPlayerPlay,
  IconCalendarEvent,
  IconChartBar,
  IconCircleCheck,
  IconCircleX,
  IconTarget,
} from "@tabler/icons-react";
import { useState } from "react";
import { useDashboardStats, useTopicStats, useRecentExams } from "../../features/dashboard";
import { formatDate } from "../../utils/formatDate";
import { useTranslation } from "react-i18next";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const StatCard = ({ title, value, icon, color, subtitle }: StatCardProps) => (
  <Card shadow="sm" padding="lg" radius="md" withBorder>
    <Group justify="space-between" align="flex-start">
      <Stack gap={4}>
        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
          {title}
        </Text>
        <Text size="xl" fw={700}>
          {value}
        </Text>
        {subtitle && (
          <Text size="xs" c="dimmed">
            {subtitle}
          </Text>
        )}
      </Stack>
      <ThemeIcon size={48} radius="md" variant="light" color={color}>
        {icon}
      </ThemeIcon>
    </Group>
  </Card>
);

const DashboardSkeleton = () => (
  <Stack gap="md">
    <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} height={110} radius="md" />
      ))}
    </SimpleGrid>
    <Grid>
      <Grid.Col span={{ base: 12, md: 8 }}>
        <Skeleton height={400} radius="md" />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Skeleton height={400} radius="md" />
      </Grid.Col>
    </Grid>
  </Stack>
);

const Home_Page = () => {
  const { t } = useTranslation();
  const { stats, isLoading: statsLoading } = useDashboardStats();
  const { topics, isLoading: topicsLoading } = useTopicStats();
  const [examPage, setExamPage] = useState(0);
  const { exams, totalPages, isLoading: examsLoading } = useRecentExams(examPage, 8);

  if (statsLoading) return <DashboardSkeleton />;

  if (!stats) {
    return (
      <Center h={400}>
        <Text c="dimmed">{t("dashboard.noData")}</Text>
      </Center>
    );
  }

  return (
    <Stack gap="md">
      <Title order={3}>{t("dashboard.title")}</Title>

      {/* Row 1: Asosiy statistikalar */}
      <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>
        <StatCard
          title={t("dashboard.totalUsers")}
          value={stats.totalUsers}
          icon={<IconUsers size={24} />}
          color="blue"
          subtitle={t("dashboard.activeToday", { count: stats.activeUsersToday })}
        />
        <StatCard
          title={t("dashboard.totalQuestions")}
          value={stats.totalQuestions}
          icon={<IconQuestionMark size={24} />}
          color="violet"
        />
        <StatCard
          title={t("dashboard.totalPackages")}
          value={stats.totalPackages}
          icon={<IconFolder size={24} />}
          color="teal"
        />
        <StatCard
          title={t("dashboard.totalTickets")}
          value={stats.totalTickets}
          icon={<IconTicket size={24} />}
          color="orange"
        />
      </SimpleGrid>

      {/* Row 2: Imtihon statistikalari */}
      <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>
        <StatCard
          title={t("dashboard.examsToday")}
          value={stats.examsToday}
          icon={<IconCalendarEvent size={24} />}
          color="cyan"
          subtitle={t("dashboard.thisWeek", { count: stats.examsThisWeek })}
        />
        <StatCard
          title={t("dashboard.activeExams")}
          value={stats.activeExams}
          icon={<IconPlayerPlay size={24} />}
          color="green"
        />
        <StatCard
          title={t("dashboard.passRate")}
          value={`${(stats.passRate ?? 0).toFixed(1)}%`}
          icon={<IconTrendingUp size={24} />}
          color="lime"
          subtitle={`${stats.passedExams} / ${stats.completedExams}`}
        />
        <StatCard
          title={t("dashboard.avgScore")}
          value={(stats.averageScore ?? 0).toFixed(1)}
          icon={<IconTarget size={24} />}
          color="grape"
        />
      </SimpleGrid>

      <Grid>
        {/* Recent Exams */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Text fw={600} size="lg">
                <IconClipboardCheck size={20} style={{ marginRight: 8, verticalAlign: "middle" }} />
                {t("dashboard.recentExams")}
              </Text>
              <Badge variant="light" size="lg">
                {t("dashboard.total")}: {stats.totalExams}
              </Badge>
            </Group>

            {examsLoading ? (
              <Center h={200}>
                <Loader size="sm" />
              </Center>
            ) : exams.length === 0 ? (
              <Center h={200}>
                <Text c="dimmed">{t("dashboard.noExams")}</Text>
              </Center>
            ) : (
              <>
                <Table.ScrollContainer minWidth={600}>
                  <Table striped highlightOnHover withTableBorder verticalSpacing="sm" fz="sm">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>{t("dashboard.user")}</Table.Th>
                        <Table.Th>{t("dashboard.package")}</Table.Th>
                        <Table.Th ta="center">{t("dashboard.score")}</Table.Th>
                        <Table.Th ta="center">{t("dashboard.result")}</Table.Th>
                        <Table.Th>{t("dashboard.date")}</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {exams.map((exam) => (
                        <Table.Tr key={exam.sessionId}>
                          <Table.Td>
                            <Text size="sm" fw={500} lineClamp={1}>
                              {exam.userName || "-"}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" lineClamp={1}>
                              {exam.packageName || (exam.ticketNumber ? `${t("dashboard.ticket")} #${exam.ticketNumber}` : exam.topicName || "-")}
                            </Text>
                          </Table.Td>
                          <Table.Td ta="center">
                            <Text size="sm" fw={600}>
                              {exam.correctCount}/{exam.totalQuestions}
                            </Text>
                          </Table.Td>
                          <Table.Td ta="center">
                            <Badge
                              size="sm"
                              variant="light"
                              color={exam.isPassed ? "green" : exam.status === "IN_PROGRESS" ? "yellow" : "red"}
                            >
                              {exam.isPassed
                                ? t("dashboard.passed")
                                : exam.status === "IN_PROGRESS"
                                  ? t("dashboard.inProgress")
                                  : t("dashboard.failed")}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" c="dimmed">
                              {formatDate(exam.startedAt)}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
                {totalPages > 1 && (
                  <Center mt="md">
                    <Pagination
                      total={totalPages}
                      value={examPage + 1}
                      onChange={(p) => setExamPage(p - 1)}
                      size="sm"
                    />
                  </Center>
                )}
              </>
            )}
          </Card>
        </Grid.Col>

        {/* Exam Type Distribution + Pass/Fail Ring */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="md">
            {/* O'tish/Yiqilish diagrammasi */}
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Text fw={600} mb="md">
                <IconChartBar size={18} style={{ marginRight: 8, verticalAlign: "middle" }} />
                {t("dashboard.examResults")}
              </Text>
              <Center>
                <RingProgress
                  size={160}
                  thickness={16}
                  roundCaps
                  label={
                    <Center>
                      <Stack gap={0} align="center">
                        <Text size="lg" fw={700}>
                          {(stats.passRate ?? 0).toFixed(0)}%
                        </Text>
                        <Text size="xs" c="dimmed">
                          {t("dashboard.passRate")}
                        </Text>
                      </Stack>
                    </Center>
                  }
                  sections={[
                    { value: stats.passRate || 0, color: "green" },
                    { value: 100 - (stats.passRate || 0), color: "red" },
                  ]}
                />
              </Center>
              <Group justify="center" mt="md" gap="xl">
                <Group gap={6}>
                  <IconCircleCheck size={16} color="var(--mantine-color-green-6)" />
                  <Text size="sm">
                    {t("dashboard.passed")}: {stats.passedExams}
                  </Text>
                </Group>
                <Group gap={6}>
                  <IconCircleX size={16} color="var(--mantine-color-red-6)" />
                  <Text size="sm">
                    {t("dashboard.failed")}: {stats.failedExams}
                  </Text>
                </Group>
              </Group>
            </Card>

            {/* Imtihon turlari */}
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Text fw={600} mb="md">
                {t("dashboard.examTypes")}
              </Text>
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text size="sm">{t("dashboard.packageExams")}</Text>
                  <Badge variant="light" color="blue">
                    {stats.packageExams}
                  </Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">{t("dashboard.ticketExams")}</Text>
                  <Badge variant="light" color="orange">
                    {stats.ticketExams}
                  </Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">{t("dashboard.marathonExams")}</Text>
                  <Badge variant="light" color="grape">
                    {stats.marathonExams}
                  </Badge>
                </Group>
              </Stack>

              <Text fw={600} mt="lg" mb="sm">
                {t("dashboard.period")}
              </Text>
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text size="sm">{t("dashboard.today")}</Text>
                  <Text size="sm" fw={600}>{stats.examsToday}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">{t("dashboard.week")}</Text>
                  <Text size="sm" fw={600}>{stats.examsThisWeek}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">{t("dashboard.month")}</Text>
                  <Text size="sm" fw={600}>{stats.examsThisMonth}</Text>
                </Group>
              </Stack>
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>

      {/* Topic Statistics */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text fw={600} size="lg" mb="md">
          {t("dashboard.topicStats")}
        </Text>
        {topicsLoading ? (
          <Center h={100}>
            <Loader size="sm" />
          </Center>
        ) : topics.length === 0 ? (
          <Center h={100}>
            <Text c="dimmed">{t("dashboard.noTopics")}</Text>
          </Center>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
            {topics.map((topic, idx) => (
              <Paper key={idx} withBorder p="md" radius="md">
                <Text fw={600} size="sm" mb="xs" lineClamp={1}>
                  {topic.topic}
                </Text>
                <Group justify="space-between" mb={6}>
                  <Text size="xs" c="dimmed">
                    {t("dashboard.questions")}: {topic.totalQuestions}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {t("dashboard.exams")}: {topic.totalExams}
                  </Text>
                </Group>
                <Progress.Root size="xl" radius="xl">
                  <Progress.Section value={topic.averageScore || 0} color={(topic.averageScore ?? 0) >= 70 ? "green" : (topic.averageScore ?? 0) >= 50 ? "yellow" : "red"}>
                    <Progress.Label>{(topic.averageScore ?? 0).toFixed(0)}%</Progress.Label>
                  </Progress.Section>
                </Progress.Root>
                <Group justify="space-between" mt={6}>
                  <Text size="xs" c="green">
                    {t("dashboard.passed")}: {topic.passedExams ?? 0}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {t("dashboard.avgScore")}: {(topic.averageScore ?? 0).toFixed(1)}
                  </Text>
                </Group>
              </Paper>
            ))}
          </SimpleGrid>
        )}
      </Card>

      {/* Popular Packages & Tickets */}
      {((stats.popularPackages?.length > 0) || (stats.popularTickets?.length > 0)) && (
        <Grid>
          {stats.popularPackages?.length > 0 && (
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Text fw={600} mb="md">
                  {t("dashboard.popularPackages")}
                </Text>
                <Stack gap="xs">
                  {stats.popularPackages.map((pkg, idx) => (
                    <Paper key={idx} withBorder p="sm" radius="sm">
                      <Group justify="space-between">
                        <Group gap="xs">
                          <Badge size="sm" circle variant="filled" color="blue">
                            {idx + 1}
                          </Badge>
                          <Text size="sm" fw={500} lineClamp={1}>
                            {pkg.packageName}
                          </Text>
                        </Group>
                        <Group gap="xs">
                          <Badge size="sm" variant="light">
                            {pkg.examCount} {t("dashboard.exams")}
                          </Badge>
                          <Badge size="sm" variant="light" color="green">
                            {(pkg.averageScore ?? 0).toFixed(0)}%
                          </Badge>
                        </Group>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              </Card>
            </Grid.Col>
          )}
          {stats.popularTickets?.length > 0 && (
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Text fw={600} mb="md">
                  {t("dashboard.popularTickets")}
                </Text>
                <Stack gap="xs">
                  {stats.popularTickets.map((ticket, idx) => (
                    <Paper key={idx} withBorder p="sm" radius="sm">
                      <Group justify="space-between">
                        <Group gap="xs">
                          <Badge size="sm" circle variant="filled" color="orange">
                            {idx + 1}
                          </Badge>
                          <Text size="sm" fw={500}>
                            {t("dashboard.ticket")} #{ticket.ticketNumber}
                          </Text>
                        </Group>
                        <Group gap="xs">
                          <Badge size="sm" variant="light">
                            {ticket.examCount} {t("dashboard.exams")}
                          </Badge>
                          <Badge size="sm" variant="light" color="green">
                            {(ticket.averageScore ?? 0).toFixed(0)}%
                          </Badge>
                        </Group>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              </Card>
            </Grid.Col>
          )}
        </Grid>
      )}
    </Stack>
  );
};

export default Home_Page;
