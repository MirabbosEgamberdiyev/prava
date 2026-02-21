/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
  Stack,
  Title,
  Card,
  Group,
  Text,
  Badge,
  Table,
  Center,
  Loader,
  Paper,
  SimpleGrid,
  Progress,
  TextInput,
  Button,
  Tabs,
  NumberInput,
} from "@mantine/core";
import {
  IconChartBar,
  IconSearch,
  IconCalendar,
  IconUser,
  IconFolder,
  IconTicket,
  IconTrophy,
  IconPackage,
  IconQuestionMark,
} from "@tabler/icons-react";
import useSWR from "swr";
import api from "../../services/api";
import { useTranslation } from "react-i18next";
import { QuestionStats } from "../../features/question/components/QuestionStats";
import { StatisticsFilter } from "../../features/statistics/components/StatisticsFilter";

const Statistics_Page = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<string | null>("overview");
  const [userSearchId, setUserSearchId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");

  // Overview: today, this-week, this-month
  const { data: todayData, isLoading: todayLoading } = useSWR(
    ["/api/v2/admin/statistics/today", i18n.language],
    async ([url]) => (await api.get(url)).data
  );
  const { data: weekData } = useSWR(
    ["/api/v2/admin/statistics/this-week", i18n.language],
    async ([url]) => (await api.get(url)).data
  );
  const { data: monthData } = useSWR(
    ["/api/v2/admin/statistics/this-month", i18n.language],
    async ([url]) => (await api.get(url)).data
  );

  // Topic statistics (V1)
  const { data: topicStatsData } = useSWR(
    ["/api/v1/statistics/topics", i18n.language],
    async ([url]) => (await api.get(url)).data
  );

  // Marathon statistics
  const { data: marathonData } = useSWR(
    activeTab === "marathon" ? ["/api/v2/admin/statistics/marathon", i18n.language] : null,
    async ([url]) => (await api.get(url)).data
  );

  // User statistics
  const { data: userStatsData, isLoading: userStatsLoading } = useSWR(
    selectedUserId ? [`/api/v2/admin/statistics/user/${selectedUserId}`, i18n.language] : null,
    async ([url]) => (await api.get(url)).data
  );

  // User marathon statistics
  const { data: userMarathonData } = useSWR(
    selectedUserId && activeTab === "users"
      ? [`/api/v2/admin/statistics/user/${selectedUserId}/marathon`, i18n.language]
      : null,
    async ([url]) => (await api.get(url)).data
  );

  // Package statistics (V2)
  const { data: packageStatsData, isLoading: packageStatsLoading } = useSWR(
    selectedPackageId && activeTab === "packages"
      ? [`/api/v2/admin/statistics/package/${selectedPackageId}`, i18n.language]
      : null,
    async ([url]) => (await api.get(url)).data
  );

  // Ticket statistics (V2)
  const { data: ticketStatsData, isLoading: ticketStatsLoading } = useSWR(
    selectedTicketId && activeTab === "tickets"
      ? [`/api/v2/admin/statistics/ticket/${selectedTicketId}`, i18n.language]
      : null,
    async ([url]) => (await api.get(url)).data
  );

  // Topic statistics (V2)
  const { data: topicDetailData, isLoading: topicDetailLoading } = useSWR(
    selectedTopicId && activeTab === "topics"
      ? [`/api/v2/admin/statistics/topic/${selectedTopicId}`, i18n.language]
      : null,
    async ([url]) => (await api.get(url)).data
  );

  // Global leaderboard
  const { data: leaderboardData } = useSWR(
    activeTab === "marathon" ? ["/api/v1/statistics/leaderboard/global", i18n.language] : null,
    async ([url]) => (await api.get(url)).data
  );

  const renderSummaryCards = (data: any, label: string) => {
    if (!data?.data) return null;
    const s = data.data.summary || data.data;
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text fw={600} mb="md">{label}</Text>
        <SimpleGrid cols={{ base: 2, md: 4 }}>
          <Paper withBorder p="sm" radius="sm">
            <Text size="xs" c="dimmed">{t("statistics.totalExams")}</Text>
            <Text size="lg" fw={700}>{s.totalExams || 0}</Text>
          </Paper>
          <Paper withBorder p="sm" radius="sm">
            <Text size="xs" c="dimmed">{t("statistics.passedExams")}</Text>
            <Text size="lg" fw={700} c="green">{s.passedExams || 0}</Text>
          </Paper>
          <Paper withBorder p="sm" radius="sm">
            <Text size="xs" c="dimmed">{t("statistics.failedExams")}</Text>
            <Text size="lg" fw={700} c="red">{s.failedExams || 0}</Text>
          </Paper>
          <Paper withBorder p="sm" radius="sm">
            <Text size="xs" c="dimmed">{t("statistics.passRate")}</Text>
            <Text size="lg" fw={700}>{(s.passRate || 0).toFixed(1)}%</Text>
          </Paper>
          <Paper withBorder p="sm" radius="sm">
            <Text size="xs" c="dimmed">{t("statistics.avgScore")}</Text>
            <Text size="lg" fw={700}>{(s.averageScore || 0).toFixed(1)}</Text>
          </Paper>
          <Paper withBorder p="sm" radius="sm">
            <Text size="xs" c="dimmed">{t("statistics.bestScore")}</Text>
            <Text size="lg" fw={700}>{s.bestScore || 0}</Text>
          </Paper>
          <Paper withBorder p="sm" radius="sm">
            <Text size="xs" c="dimmed">{t("statistics.accuracy")}</Text>
            <Text size="lg" fw={700}>{(s.accuracy || 0).toFixed(1)}%</Text>
          </Paper>
          <Paper withBorder p="sm" radius="sm">
            <Text size="xs" c="dimmed">{t("statistics.totalTime")}</Text>
            <Text size="lg" fw={700}>{((s.totalTimeSpentSeconds || 0) / 3600).toFixed(1)}</Text>
          </Paper>
        </SimpleGrid>
      </Card>
    );
  };

  if (todayLoading) {
    return (
      <Center h={400}>
        <Loader type="bars" />
      </Center>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>
          <IconChartBar size={24} style={{ marginRight: 8, verticalAlign: "middle" }} />
          {t("statistics.title")}
        </Title>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="overview" leftSection={<IconCalendar size={16} />}>
            {t("statistics.overview")}
          </Tabs.Tab>
          <Tabs.Tab value="topics" leftSection={<IconFolder size={16} />}>
            {t("statistics.topicsTab")}
          </Tabs.Tab>
          <Tabs.Tab value="packages" leftSection={<IconPackage size={16} />}>
            {t("statistics.packagesTab")}
          </Tabs.Tab>
          <Tabs.Tab value="tickets" leftSection={<IconTicket size={16} />}>
            {t("statistics.ticketsTab")}
          </Tabs.Tab>
          <Tabs.Tab value="marathon" leftSection={<IconTrophy size={16} />}>
            {t("statistics.marathon")}
          </Tabs.Tab>
          <Tabs.Tab value="users" leftSection={<IconUser size={16} />}>
            {t("statistics.usersTab")}
          </Tabs.Tab>
          <Tabs.Tab value="questions" leftSection={<IconQuestionMark size={16} />}>
            {t("statistics.questionsTab")}
          </Tabs.Tab>
        </Tabs.List>

        {/* Umumiy statistika */}
        <Tabs.Panel value="overview" pt="md">
          <Stack gap="md">
            {renderSummaryCards(todayData, t("statistics.todayStats"))}
            {renderSummaryCards(weekData, t("statistics.weekStats"))}
            {renderSummaryCards(monthData, t("statistics.monthStats"))}
            <StatisticsFilter />
          </Stack>
        </Tabs.Panel>

        {/* Mavzular bo'yicha */}
        <Tabs.Panel value="topics" pt="md">
          <Stack gap="md">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Text fw={600} mb="md">{t("statistics.topicStatsTitle")}</Text>
              {topicStatsData?.data ? (
                <Table striped highlightOnHover withTableBorder verticalSpacing="sm" fz="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>{t("statistics.topicHeader")}</Table.Th>
                      <Table.Th ta="center">{t("statistics.questionsHeader")}</Table.Th>
                      <Table.Th ta="center">{t("statistics.examsHeader")}</Table.Th>
                      <Table.Th ta="center">{t("statistics.avgScoreHeader")}</Table.Th>
                      <Table.Th ta="center">{t("statistics.passedHeader")}</Table.Th>
                      <Table.Th>{t("statistics.progress")}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {(Array.isArray(topicStatsData.data) ? topicStatsData.data : []).map(
                      (topic: any, idx: number) => (
                        <Table.Tr key={idx}>
                          <Table.Td>
                            <Text size="sm" fw={500}>{topic.topic}</Text>
                          </Table.Td>
                          <Table.Td ta="center">{topic.totalQuestions}</Table.Td>
                          <Table.Td ta="center">{topic.totalExams}</Table.Td>
                          <Table.Td ta="center">
                            <Badge variant="light" color={topic.averageScore >= 70 ? "green" : "orange"}>
                              {topic.averageScore?.toFixed(1) || 0}
                            </Badge>
                          </Table.Td>
                          <Table.Td ta="center">{topic.passedExams}</Table.Td>
                          <Table.Td>
                            <Progress value={topic.averageScore || 0} color={topic.averageScore >= 70 ? "green" : "orange"} size="lg" radius="xl" />
                          </Table.Td>
                        </Table.Tr>
                      )
                    )}
                  </Table.Tbody>
                </Table>
              ) : (
                <Center h={100}>
                  <Text c="dimmed">{t("statistics.noData")}</Text>
                </Center>
              )}
            </Card>

            {/* V2 Topic detail statistics */}
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Text fw={600} mb="md">{t("statistics.topicDetailTitle")}</Text>
              <Group mb="md">
                <NumberInput
                  placeholder={t("statistics.enterTopicId")}
                  value={selectedTopicId ? Number(selectedTopicId) : ""}
                  onChange={(v) => setSelectedTopicId(v ? String(v) : "")}
                  w={200}
                />
              </Group>
              {topicDetailLoading && <Center h={100}><Loader size="sm" /></Center>}
              {topicDetailData && renderSummaryCards(topicDetailData, `${t("statistics.topicHeader")} #${selectedTopicId}`)}
            </Card>
          </Stack>
        </Tabs.Panel>

        {/* Paketlar bo'yicha */}
        <Tabs.Panel value="packages" pt="md">
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Text fw={600} mb="md">{t("statistics.packageStatsTitle")}</Text>
            <Group mb="md">
              <NumberInput
                placeholder={t("statistics.enterPackageId")}
                value={selectedPackageId ? Number(selectedPackageId) : ""}
                onChange={(v) => setSelectedPackageId(v ? String(v) : "")}
                w={200}
              />
            </Group>
            {packageStatsLoading && <Center h={100}><Loader size="sm" /></Center>}
            {packageStatsData && renderSummaryCards(packageStatsData, `${t("statistics.packagesTab")} #${selectedPackageId}`)}
            {selectedPackageId && !packageStatsLoading && !packageStatsData?.data && (
              <Center h={100}><Text c="dimmed">{t("statistics.dataNotFound")}</Text></Center>
            )}
          </Card>
        </Tabs.Panel>

        {/* Biletlar bo'yicha */}
        <Tabs.Panel value="tickets" pt="md">
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Text fw={600} mb="md">{t("statistics.ticketStatsTitle")}</Text>
            <Group mb="md">
              <NumberInput
                placeholder={t("statistics.enterTicketId")}
                value={selectedTicketId ? Number(selectedTicketId) : ""}
                onChange={(v) => setSelectedTicketId(v ? String(v) : "")}
                w={200}
              />
            </Group>
            {ticketStatsLoading && <Center h={100}><Loader size="sm" /></Center>}
            {ticketStatsData && renderSummaryCards(ticketStatsData, `${t("statistics.ticketsTab")} #${selectedTicketId}`)}
            {selectedTicketId && !ticketStatsLoading && !ticketStatsData?.data && (
              <Center h={100}><Text c="dimmed">{t("statistics.dataNotFound")}</Text></Center>
            )}
          </Card>
        </Tabs.Panel>

        {/* Marafon */}
        <Tabs.Panel value="marathon" pt="md">
          <Stack gap="md">
            {renderSummaryCards(marathonData, t("statistics.marathonStats"))}

            {/* Global leaderboard */}
            {leaderboardData?.data && (
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Text fw={600} mb="md">{t("statistics.globalLeaderboard")}</Text>
                <Table striped highlightOnHover withTableBorder verticalSpacing="sm" fz="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>#</Table.Th>
                      <Table.Th>{t("statistics.leaderUser")}</Table.Th>
                      <Table.Th ta="center">{t("statistics.leaderScore")}</Table.Th>
                      <Table.Th ta="center">{t("statistics.leaderExams")}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {(Array.isArray(leaderboardData.data) ? leaderboardData.data : []).map(
                      (entry: any, idx: number) => (
                        <Table.Tr key={idx}>
                          <Table.Td>
                            <Badge variant="light" color={idx < 3 ? "yellow" : "gray"}>
                              {idx + 1}
                            </Badge>
                          </Table.Td>
                          <Table.Td>{entry.fullName || entry.userName || `User #${entry.userId}`}</Table.Td>
                          <Table.Td ta="center">{entry.averageScore?.toFixed(1) || entry.score || 0}</Table.Td>
                          <Table.Td ta="center">{entry.totalExams || 0}</Table.Td>
                        </Table.Tr>
                      )
                    )}
                  </Table.Tbody>
                </Table>
              </Card>
            )}
          </Stack>
        </Tabs.Panel>

        {/* Foydalanuvchi bo'yicha */}
        <Tabs.Panel value="users" pt="md">
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Text fw={600} mb="md">{t("statistics.userStatsTitle")}</Text>
            <Group mb="md">
              <TextInput
                placeholder={t("statistics.enterUserId")}
                leftSection={<IconSearch size={16} />}
                value={userSearchId}
                onChange={(e) => setUserSearchId(e.currentTarget.value)}
                onKeyDown={(e) => e.key === "Enter" && setSelectedUserId(userSearchId)}
                style={{ flex: 1, maxWidth: 300 }}
              />
              <Button onClick={() => setSelectedUserId(userSearchId)} variant="light">
                {t("statistics.searchBtn")}
              </Button>
            </Group>

            {userStatsLoading && (
              <Center h={100}><Loader size="sm" /></Center>
            )}

            {userStatsData && renderSummaryCards(userStatsData, t("statistics.userV2Label", { id: selectedUserId }))}
            {userMarathonData && renderSummaryCards(userMarathonData, t("statistics.userMarathonLabel", { id: selectedUserId }))}

            {selectedUserId && !userStatsLoading && !userStatsData?.data && (
              <Center h={100}>
                <Text c="dimmed">{t("statistics.dataNotFound")}</Text>
              </Center>
            )}
          </Card>
        </Tabs.Panel>

        {/* Savollar bo'yicha statistika */}
        <Tabs.Panel value="questions" pt="md">
          <QuestionStats />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};

export default Statistics_Page;
