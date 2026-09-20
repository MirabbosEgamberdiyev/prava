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
  Button,
} from "@mantine/core";
import {
  IconUsers,
  IconQuestionMark,
  IconFolder,
  IconTicket,
  IconClipboardCheck,
  IconPlayerPlay,
  IconChartBar,
  IconCircleCheck,
  IconCircleX,
  IconTarget,
  IconAlertTriangle,
  IconUserPlus,
  IconLogin,
  IconAlignBoxLeftTop,
  IconMail,
  IconHeartHandshake,
  IconDownload,
  IconPlus,
  IconSettings,
  IconRoadSign,
  IconTrafficLights,
  IconBook,
  IconGavel,
  IconSteeringWheel,
  IconMapPin,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboardStats, useTopicStats, useRecentExams } from "../../features/dashboard";
import { useCurriculumStats } from "../../features/curriculum";
import { formatDate } from "../../utils/formatDate";
import { useTranslation } from "react-i18next";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  onClick?: () => void;
}

const StatCard = ({ title, value, icon, color, subtitle, onClick }: StatCardProps) => (
  <Card
    shadow="sm"
    padding="lg"
    radius="md"
    withBorder
    style={{ cursor: onClick ? "pointer" : "default" }}
    onClick={onClick}
  >
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
      {Array.from({ length: 12 }).map((_, i) => (
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
  const navigate = useNavigate();
  const { stats, isLoading: statsLoading, isError: statsError, refresh: refreshStats } =
    useDashboardStats();
  const { topics, isLoading: topicsLoading, isError: topicsError } = useTopicStats();
  const { stats: curriculumStats } = useCurriculumStats();
  const [examPage, setExamPage] = useState(0);
  const {
    exams,
    totalPages,
    isLoading: examsLoading,
    isError: examsError,
  } = useRecentExams(examPage, 8);

  useEffect(() => {
    if (totalPages > 0 && examPage > totalPages - 1) setExamPage(totalPages - 1);
  }, [totalPages, examPage]);

  if (statsLoading) return <DashboardSkeleton />;

  if (statsError) {
    return (
      <Center h={400}>
        <Stack align="center" gap="sm">
          <IconAlertTriangle size={40} color="var(--mantine-color-red-6)" />
          <Text c="red">{t("common.errorLoading")}</Text>
          <Button variant="light" onClick={() => refreshStats()}>
            {t("common.refresh")}
          </Button>
        </Stack>
      </Center>
    );
  }

  if (!stats) {
    return (
      <Center h={400}>
        <Text c="dimmed">{t("dashboard.noData")}</Text>
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      {/* Header & Quick Actions */}
      <Group justify="space-between" align="center" wrap="wrap">
        <div>
          <Title order={1} fz="h3">{t("dashboard.title")}</Title>
          <Text size="sm" c="dimmed">Avtomaktab imtihon tizimi real vaqt nazorat paneli</Text>
        </div>
        <Button variant="light" color="blue" onClick={() => refreshStats()} size="sm">
          {t("common.refresh")}
        </Button>
      </Group>

      {/* Quick Actions Panel */}
      <Card shadow="xs" padding="sm" radius="md" withBorder>
        <Stack gap="xs">
          <Text size="xs" fw={700} c="dimmed" tt="uppercase">
            Tezkor Amallar (Quick Actions)
          </Text>
          <Group gap="xs" wrap="wrap">
            <Button
              size="xs"
              variant="light"
              color="violet"
              leftSection={<IconPlus size={14} />}
              onClick={() => navigate("/questions/add")}
            >
              Yangi savol
            </Button>
            <Button
              size="xs"
              variant="light"
              color="orange"
              leftSection={<IconPlus size={14} />}
              onClick={() => navigate("/tickets/add")}
            >
              Yangi bilet
            </Button>
            <Button
              size="xs"
              variant="light"
              color="indigo"
              leftSection={<IconPlus size={14} />}
              onClick={() => navigate("/topics/add")}
            >
              Yangi mavzu
            </Button>
            <Button
              size="xs"
              variant="light"
              color="blue"
              leftSection={<IconUsers size={14} />}
              onClick={() => navigate("/users")}
            >
              Foydalanuvchilar
            </Button>
            <Button
              size="xs"
              variant="light"
              color="teal"
              leftSection={<IconMail size={14} />}
              onClick={() => navigate("/contact")}
            >
              Murojaatlar
            </Button>
            <Button
              size="xs"
              variant="light"
              color="cyan"
              leftSection={<IconHeartHandshake size={14} />}
              onClick={() => navigate("/partners")}
            >
              Hamkorlar
            </Button>
            <Button
              size="xs"
              variant="light"
              color="green"
              leftSection={<IconDownload size={14} />}
              onClick={() => navigate("/downloads")}
            >
              Yuklab olishlar
            </Button>
            <Button
              size="xs"
              variant="light"
              color="blue"
              leftSection={<IconRoadSign size={14} />}
              onClick={() => navigate("/signs")}
            >
              Yo'l belgilari
            </Button>
            <Button
              size="xs"
              variant="light"
              color="teal"
              leftSection={<IconTrafficLights size={14} />}
              onClick={() => navigate("/markings")}
            >
              Yo'l chiziqlari
            </Button>
            <Button
              size="xs"
              variant="light"
              color="indigo"
              leftSection={<IconBook size={14} />}
              onClick={() => navigate("/rules")}
            >
              YHQ Qoidalar
            </Button>
            <Button
              size="xs"
              variant="light"
              color="red"
              leftSection={<IconGavel size={14} />}
              onClick={() => navigate("/fines")}
            >
              Jarimalar
            </Button>
            <Button
              size="xs"
              variant="light"
              color="grape"
              leftSection={<IconSteeringWheel size={14} />}
              onClick={() => navigate("/autodrom")}
            >
              Avtodrom
            </Button>
            <Button
              size="xs"
              variant="light"
              color="cyan"
              leftSection={<IconMapPin size={14} />}
              onClick={() => navigate("/exam-centers")}
            >
              Imtihon markazlari
            </Button>
            <Button
              size="xs"
              variant="light"
              color="gray"
              leftSection={<IconSettings size={14} />}
              onClick={() => navigate("/settings")}
            >
              Sozlamalar
            </Button>
          </Group>
        </Stack>
      </Card>

      {/* Row 1: Foydalanuvchilar va Faollik (4 Metrika) */}
      <Stack gap="xs">
        <Text size="sm" fw={700} c="dimmed">FOYDALANUVCHILAR VA FAOLLIK</Text>
        <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>
          <StatCard
            title={t("dashboard.totalUsers")}
            value={stats.totalUsers}
            icon={<IconUsers size={24} />}
            color="blue"
            subtitle={`Faol: ${stats.activeUsers ?? stats.activeUsersToday ?? 0}`}
            onClick={() => navigate("/users")}
          />
          <StatCard
            title="Faol Foydalanuvchilar"
            value={stats.activeUsers ?? stats.activeUsersToday ?? 0}
            icon={<IconUsers size={24} />}
            color="teal"
            subtitle="Tizimda bloklanmaganlar"
            onClick={() => navigate("/users")}
          />
          <StatCard
            title="Bugun Qo'shilganlar"
            value={stats.todayRegistrations ?? 0}
            icon={<IconUserPlus size={24} />}
            color="cyan"
            subtitle="Oxirgi 24 soatda"
          />
          <StatCard
            title="24 Soatda Kirganlar"
            value={stats.loginsLast24h ?? 0}
            icon={<IconLogin size={24} />}
            color="indigo"
            subtitle="Faol sessiyalar"
          />
        </SimpleGrid>
      </Stack>

      {/* Row 2: Kontent va Savollar Bazasi (4 Metrika) */}
      <Stack gap="xs">
        <Text size="sm" fw={700} c="dimmed">KONTENT VA SAVOLLAR BAZASI</Text>
        <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>
          <StatCard
            title={t("dashboard.totalQuestions")}
            value={stats.totalQuestions}
            icon={<IconQuestionMark size={24} />}
            color="violet"
            subtitle={`Faol: ${stats.activeQuestions ?? stats.totalQuestions}`}
            onClick={() => navigate("/questions")}
          />
          <StatCard
            title="Jami Mavzular"
            value={stats.totalTopics ?? 0}
            icon={<IconAlignBoxLeftTop size={24} />}
            color="grape"
            subtitle="Yo'l harakati qoidalari"
            onClick={() => navigate("/topics")}
          />
          <StatCard
            title={t("dashboard.totalTickets")}
            value={stats.totalTickets}
            icon={<IconTicket size={24} />}
            color="orange"
            subtitle="Rasmiy biletlar"
            onClick={() => navigate("/tickets")}
          />
          <StatCard
            title={t("dashboard.totalPackages")}
            value={stats.totalPackages}
            icon={<IconFolder size={24} />}
            color="yellow"
            subtitle="Tayyor to'plamlar"
            onClick={() => navigate("/packages")}
          />
        </SimpleGrid>
      </Stack>

      {/* Row 2.5: Ta'lim va O'quv Dasturi (Curriculum) */}
      <Stack gap="xs">
        <Text size="sm" fw={700} c="dimmed">TA'LIM VA O'QUV DASTURI (CURRICULUM)</Text>
        <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 5 }}>
          <StatCard
            title="Yo'l Belgilari"
            value={curriculumStats?.totalSigns ?? 0}
            icon={<IconRoadSign size={24} />}
            color="blue"
            subtitle="8 ta rasmiy toifa"
            onClick={() => navigate("/signs")}
          />
          <StatCard
            title="Yo'l Chiziqlari"
            value={curriculumStats?.totalMarkings ?? 0}
            icon={<IconTrafficLights size={24} />}
            color="teal"
            subtitle="Gorizontal & Vertikal"
            onClick={() => navigate("/markings")}
          />
          <StatCard
            title="Imtihon Markazlari"
            value={curriculumStats?.totalExamCenters ?? 0}
            icon={<IconMapPin size={24} />}
            color="cyan"
            subtitle="14 ta hududiy markaz"
            onClick={() => navigate("/exam-centers")}
          />
          <StatCard
            title="Avtodrom Mashqlari"
            value={curriculumStats?.totalPracticalExercises ?? 0}
            icon={<IconSteeringWheel size={24} />}
            color="grape"
            subtitle="Davlat amaliy standarti"
            onClick={() => navigate("/autodrom")}
          />
          <StatCard
            title="Jarima Ballari"
            value={curriculumStats?.totalPenalties ?? 0}
            icon={<IconGavel size={24} />}
            color="red"
            subtitle="Qoidabuzarlik mezonlari"
            onClick={() => navigate("/fines")}
          />
        </SimpleGrid>
      </Stack>

      {/* Row 3: Imtihonlar va Natijalar (4 Metrika) */}
      <Stack gap="xs">
        <Text size="sm" fw={700} c="dimmed">IMTIHONLAR VA NATIJALAR</Text>
        <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>
          <StatCard
            title="Jami Imtihonlar"
            value={stats.totalExams}
            icon={<IconClipboardCheck size={24} />}
            color="blue"
            subtitle={`Bugun: ${stats.examsToday}`}
            onClick={() => navigate("/exams")}
          />
          <StatCard
            title="Muvaffaqiyatli"
            value={stats.passedExams}
            icon={<IconCircleCheck size={24} />}
            color="green"
            subtitle={`${(stats.passRate ?? 0).toFixed(1)}% o'tish ko'rsatkichi`}
            onClick={() => navigate("/exams")}
          />
          <StatCard
            title="Yiqilganlar"
            value={stats.failedExams}
            icon={<IconCircleX size={24} />}
            color="red"
            subtitle="Qayta topshirish kerak"
            onClick={() => navigate("/exams")}
          />
          <StatCard
            title={t("dashboard.avgScore")}
            value={(stats.averageScore ?? 0).toFixed(1)}
            icon={<IconTarget size={24} />}
            color="lime"
            subtitle="O'rtacha to'g'ri javoblar"
          />
        </SimpleGrid>
      </Stack>

      {/* Row 4: CRM va Tarqatish (3 Metrika + Faol Imtihonlar) */}
      <Stack gap="xs">
        <Text size="sm" fw={700} c="dimmed">CRM VA ILOVA STATISTIKASI</Text>
        <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>
          <StatCard
            title="Sayt Murojaatlari"
            value={stats.contactInquiriesCount ?? 0}
            icon={<IconMail size={24} />}
            color="pink"
            subtitle="Foydalanuvchi xabarlari"
            onClick={() => navigate("/contact")}
          />
          <StatCard
            title="Hamkorlik Arizalari"
            value={stats.partnerLeadsCount ?? 0}
            icon={<IconHeartHandshake size={24} />}
            color="teal"
            subtitle="Avtomaktab arizalari"
            onClick={() => navigate("/partners")}
          />
          <StatCard
            title="Ilova Yuklab Olishlar"
            value={stats.totalDownloads ?? 0}
            icon={<IconDownload size={24} />}
            color="cyan"
            subtitle="Desktop & Mobil platformalar"
            onClick={() => navigate("/downloads")}
          />
          <StatCard
            title={t("dashboard.activeExams")}
            value={stats.activeExams}
            icon={<IconPlayerPlay size={24} />}
            color="indigo"
            subtitle="Ayni paytda test ishlayotganlar"
          />
        </SimpleGrid>
      </Stack>

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
            ) : examsError ? (
              <Center h={200}>
                <Text c="red" size="sm">{t("common.errorLoading")}</Text>
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
        ) : topicsError ? (
          <Center h={100}>
            <Text c="red" size="sm">{t("common.errorLoading")}</Text>
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
