import { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Title,
  Text,
  Badge,
  Button,
  Group,
  Stack,
  Card,
  ThemeIcon,
  SimpleGrid,
  Box,
  Progress,
  Table,
} from "@mantine/core";
import {
  IconChartBar,
  IconCheck,
  IconX,
  IconClock,
  IconFlame,
  IconRefresh,
  IconArrowLeft,
  IconAlertTriangle,
  IconSteeringWheel,
  IconArrowRight,
  IconCalendar,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../context/LanguageContext";
import SEO from "../../../components/common/SEO";
import { simulatorApi } from "../services/simulatorApi";
import { loadAllSessionsLocally } from "../engine/sessionManager";
import { EXERCISE_REGISTRY } from "../registry/exerciseRegistry";
import type { UserSimulatorStats, SimulatorSessionData } from "../types";

export default function SimulatorStatistics_Page() {
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const [stats, setStats] = useState<UserSimulatorStats | null>(null);
  const [recentSessions, setRecentSessions] = useState<SimulatorSessionData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const getLoc = (obj: { uzl: string; uzc: string; ru: string }) => {
    if (lang === "ru") return obj.ru;
    if (lang === "uzc") return obj.uzc;
    return obj.uzl;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await simulatorApi.getUserStats();
      setStats(data);
      const allSessions = loadAllSessionsLocally();
      setRecentSessions(allSessions.slice(0, 10));
    } catch (e) {
      console.error("Error loading simulator statistics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} ${lang === "ru" ? "мин" : "daq"} ${secs < 10 ? "0" : ""}${secs} ${lang === "ru" ? "сек" : "son"}`;
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(lang === "ru" ? "ru-RU" : "uz-UZ", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoStr;
    }
  };

  const t_meta_title =
    lang === "ru"
      ? "Статистика автодрома — PravaOnline"
      : lang === "uzc"
      ? "Автодром статистикаси — PravaOnline"
      : "Avtodrom statistikasi — PravaOnline";

  const t_title =
    lang === "ru"
      ? "Статистика и аналитика автодрома"
      : lang === "uzc"
      ? "Автодром статистикаси ва таҳлили"
      : "Avtodrom statistikasi va tahlili";

  const t_subtitle =
    lang === "ru"
      ? "Ваш прогресс по практическим упражнениям, процент успешной сдачи и анализ слабых мест"
      : lang === "uzc"
      ? "Амалий машқлар бўйича прогрессингиз, муваффақият фоизи ва кучсиз нуқталар таҳлили"
      : "Amaliy mashqlar bo'yicha progressiz, muvaffaqiyat foizi va zaif nuqtalar tahlili";

  return (
    <>
      <SEO
        title={t_meta_title}
        description={t_subtitle}
        keywords="avtodrom statistikasi, права статистика, imtihon tahlili, yhxx amaliy imtihon"
      />

      <Box bg="gray.0" py="xl" style={{ minHeight: "85vh" }}>
        <Container size="lg">
          <Group justify="space-between" mb="lg" wrap="wrap">
            <Button
              variant="subtle"
              color="gray"
              leftSection={<IconArrowLeft size={18} />}
              onClick={() => navigate("/simulator")}
            >
              {lang === "ru"
                ? "Главная автодрома"
                : lang === "uzc"
                ? "Автодром бош саҳифаси"
                : "Avtodrom bosh sahifasi"}
            </Button>
            <Button
              variant="light"
              leftSection={<IconRefresh size={18} />}
              loading={loading}
              onClick={loadData}
            >
              {lang === "ru" ? "Обновить данные" : "Yangilash"}
            </Button>
          </Group>

          {/* Header Title Card */}
          <Paper p="lg" radius="md" withBorder mb="xl" bg="white">
            <Group gap="md">
              <ThemeIcon size={48} radius="md" color="blue" variant="light">
                <IconChartBar size={28} />
              </ThemeIcon>
              <Box style={{ flex: 1 }}>
                <Title order={2} fw={700}>
                  {t_title}
                </Title>
                <Text size="sm" c="dimmed">
                  {t_subtitle}
                </Text>
              </Box>
              <Group gap="xs">
                <Button
                  variant="filled"
                  color="blue"
                  leftSection={<IconSteeringWheel size={18} />}
                  onClick={() => navigate("/simulator/exam")}
                >
                  {lang === "ru" ? "Сдать экзамен" : "Imtihon topshirish"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/simulator/practice")}
                >
                  {lang === "ru" ? "Каталог упражнений" : "Mashqlar katalogi"}
                </Button>
              </Group>
            </Group>
          </Paper>

          {/* 4 Big KPI Cards */}
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md" mb="xl">
            <Card p="md" radius="md" withBorder bg="white">
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                  {lang === "ru" ? "Всего попыток" : "Jami urinishlar"}
                </Text>
                <ThemeIcon color="blue" variant="light" size="sm" radius="xl">
                  <IconSteeringWheel size={14} />
                </ThemeIcon>
              </Group>
              <Title order={2} fw={800}>
                {stats?.totalSessions || 0}
              </Title>
              <Text size="xs" c="dimmed" mt={4}>
                {lang === "ru"
                  ? `Сдано: ${stats?.passedSessions || 0} / Не сдано: ${stats?.failedSessions || 0}`
                  : `Topshirdi: ${stats?.passedSessions || 0} / Yiqildi: ${stats?.failedSessions || 0}`}
              </Text>
            </Card>

            <Card p="md" radius="md" withBorder bg="white">
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                  {lang === "ru" ? "Процент сдачи" : "Muvaffaqiyat ko'rsatkichi"}
                </Text>
                <ThemeIcon
                  color={(stats?.passRate || 0) >= 70 ? "green" : "orange"}
                  variant="light"
                  size="sm"
                  radius="xl"
                >
                  <IconCheck size={14} />
                </ThemeIcon>
              </Group>
              <Title order={2} fw={800} c={(stats?.passRate || 0) >= 70 ? "green.7" : "orange.7"}>
                {stats?.passRate || 0}%
              </Title>
              <Progress
                value={stats?.passRate || 0}
                color={(stats?.passRate || 0) >= 70 ? "green" : "orange"}
                size="sm"
                radius="xl"
                mt={8}
              />
            </Card>

            <Card p="md" radius="md" withBorder bg="white">
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                  {lang === "ru" ? "Средний штраф" : "O'rtacha jarima"}
                </Text>
                <ThemeIcon color="red" variant="light" size="sm" radius="xl">
                  <IconAlertTriangle size={14} />
                </ThemeIcon>
              </Group>
              <Title order={2} fw={800} c={(stats?.averageScore || 0) > 99 ? "red.7" : "dark"}>
                {stats?.averageScore || 0}{" "}
                <Text span size="sm" fw={500} c="dimmed">
                  {lang === "ru" ? "баллов" : "ball"}
                </Text>
              </Title>
              <Text size="xs" c="dimmed" mt={4}>
                {lang === "ru" ? "Лимит сдачи: до 99 баллов" : "Imtihon chegarasi: 99 ballgacha"}
              </Text>
            </Card>

            <Card p="md" radius="md" withBorder bg="white">
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                  {lang === "ru" ? "Среднее время" : "O'rtacha vaqt"}
                </Text>
                <ThemeIcon color="cyan" variant="light" size="sm" radius="xl">
                  <IconClock size={14} />
                </ThemeIcon>
              </Group>
              <Title order={2} fw={800}>
                {formatDuration(stats?.averageTimeSeconds || 0)}
              </Title>
              <Text size="xs" c="dimmed" mt={4}>
                {lang === "ru"
                  ? `Лучший результат: ${stats?.bestScore ?? 0} баллов`
                  : `Eng yaxshi natija: ${stats?.bestScore ?? 0} ball`}
              </Text>
            </Card>
          </SimpleGrid>

          {/* Weak Exercises Breakdown */}
          <Paper p="lg" radius="md" withBorder mb="xl" bg="white">
            <Group justify="space-between" mb="md">
              <Group gap="xs">
                <ThemeIcon size={32} radius="md" color="orange" variant="light">
                  <IconFlame size={20} />
                </ThemeIcon>
                <div>
                  <Title order={4} fw={700}>
                    {lang === "ru"
                      ? "Анализ слабых мест (Частые ошибки)"
                      : lang === "uzc"
                      ? "Кучсиз нуқталар таҳлили (Кўп хато қилинган машқлар)"
                      : "Kuchsiz nuqtalar tahlili (Ko'p xato qilingan mashqlar)"}
                  </Title>
                  <Text size="xs" c="dimmed">
                    {lang === "ru"
                      ? "Упражнения, на которых вы чаще всего получали штрафные баллы"
                      : "Eng ko'p jarima ballari to'plangan mashqlar ro'yxati"}
                  </Text>
                </div>
              </Group>
            </Group>

            {!stats || !stats.weakExercises || stats.weakExercises.length === 0 ? (
              <Box py="xl" ta="center">
                <ThemeIcon size={48} radius="xl" color="green" variant="light" mb="sm">
                  <IconCheck size={28} />
                </ThemeIcon>
                <Text fw={600} size="md">
                  {lang === "ru"
                    ? "У вас пока нет критических ошибок!"
                    : "Hozircha tizimda jiddiy xatoliklar qayd etilmagan!"}
                </Text>
                <Text size="sm" c="dimmed" mt={4}>
                  {lang === "ru"
                    ? "Пройдите экзамен или тренировку, чтобы собрать статистику"
                    : "Statistikani to'plash uchun imtihon yoki mashg'ulotni boshlang"}
                </Text>
              </Box>
            ) : (
              <Stack gap="sm">
                {stats.weakExercises.map((w, idx) => {
                  const exerciseDef = EXERCISE_REGISTRY.find(
                    (e) => e.number === w.exerciseNumber
                  );
                  const title = exerciseDef ? getLoc(exerciseDef.title) : getLoc(w.title);
                  const maxFails = stats.weakExercises[0]?.failCount || 1;
                  const ratio = Math.round((w.failCount / maxFails) * 100);

                  return (
                    <Paper
                      key={w.exerciseNumber}
                      p="md"
                      radius="md"
                      withBorder
                      style={{
                        borderColor: idx === 0 ? "var(--mantine-color-red-3)" : undefined,
                      }}
                    >
                      <Group justify="space-between" wrap="nowrap">
                        <Group gap="sm" style={{ flex: 1, minWidth: 0 }}>
                          <Badge
                            size="lg"
                            circle
                            color={idx === 0 ? "red" : idx === 1 ? "orange" : "blue"}
                            variant="filled"
                          >
                            {w.exerciseNumber}
                          </Badge>
                          <Box style={{ flex: 1, minWidth: 0 }}>
                            <Text fw={600} truncate>
                              {title}
                            </Text>
                            <Progress
                              value={ratio}
                              color={idx === 0 ? "red" : "orange"}
                              size="sm"
                              radius="xl"
                              mt={6}
                            />
                          </Box>
                        </Group>

                        <Group gap="md" wrap="nowrap">
                          <Badge color="red" variant="light" size="md">
                            {w.failCount}{" "}
                            {lang === "ru" ? "ошибок" : "ta xato"}
                          </Badge>
                          <Button
                            size="xs"
                            variant="light"
                            color="blue"
                            rightSection={<IconArrowRight size={14} />}
                            onClick={() =>
                              navigate(
                                `/simulator/practice/${exerciseDef?.code || "EX_" + w.exerciseNumber}`
                              )
                            }
                          >
                            {lang === "ru" ? "Тренировать" : "Mashq qilish"}
                          </Button>
                        </Group>
                      </Group>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Paper>

          {/* Recent Sessions Table */}
          <Paper p="lg" radius="md" withBorder bg="white">
            <Group justify="space-between" mb="md">
              <Group gap="xs">
                <ThemeIcon size={32} radius="md" color="blue" variant="light">
                  <IconCalendar size={20} />
                </ThemeIcon>
                <div>
                  <Title order={4} fw={700}>
                    {lang === "ru"
                      ? "История последних заездов"
                      : lang === "uzc"
                      ? "Охирги ҳайдашлар тарихи"
                      : "Oxirgi haydashlar tarixi"}
                  </Title>
                  <Text size="xs" c="dimmed">
                    {lang === "ru"
                      ? "Последние 10 сессий симулятора"
                      : "Oxirgi 10 ta amaliy mashg'ulot natijasi"}
                  </Text>
                </div>
              </Group>
            </Group>

            {recentSessions.length === 0 ? (
              <Box py="xl" ta="center">
                <Text c="dimmed">
                  {lang === "ru"
                    ? "Пока не завершено ни одной сессии"
                    : "Hali bironta ham sessiya yakunlanmagan"}
                </Text>
              </Box>
            ) : (
              <Box style={{ overflowX: "auto" }}>
                <Table verticalSpacing="sm" highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>{lang === "ru" ? "Дата" : "Sana"}</Table.Th>
                      <Table.Th>{lang === "ru" ? "Режим" : "Rejim"}</Table.Th>
                      <Table.Th>{lang === "ru" ? "Автомобиль" : "Avtomobil"}</Table.Th>
                      <Table.Th>{lang === "ru" ? "Штрафные баллы" : "Jarima ballari"}</Table.Th>
                      <Table.Th>{lang === "ru" ? "Время" : "Vaqt"}</Table.Th>
                      <Table.Th>{lang === "ru" ? "Статус" : "Holat"}</Table.Th>
                      <Table.Th ta="right">{lang === "ru" ? "Действие" : "Amal"}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {recentSessions.map((s) => {
                      const isPassed = s.isPassed;
                      return (
                        <Table.Tr key={s.sessionId}>
                          <Table.Td>{formatDate(s.startedAt)}</Table.Td>
                          <Table.Td>
                            <Badge
                              variant="dot"
                              color={
                                s.mode === "exam"
                                  ? "indigo"
                                  : s.mode === "training"
                                  ? "teal"
                                  : "blue"
                              }
                            >
                              {s.mode.toUpperCase()}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{s.vehicleModel || "Chevrolet Cobalt"}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              color={s.totalPenaltyPoints >= 100 ? "red" : s.totalPenaltyPoints > 0 ? "orange" : "green"}
                              variant="light"
                            >
                              {s.totalPenaltyPoints} {lang === "ru" ? "балл" : "ball"}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{formatDuration(s.timeSpentSeconds)}</Text>
                          </Table.Td>
                          <Table.Td>
                            {isPassed ? (
                              <Badge color="green" variant="filled" leftSection={<IconCheck size={12} />}>
                                {lang === "ru" ? "СДАНО" : "O'TDI"}
                              </Badge>
                            ) : (
                              <Badge color="red" variant="filled" leftSection={<IconX size={12} />}>
                                {lang === "ru" ? "НЕ СДАНО" : "O'TMADI"}
                              </Badge>
                            )}
                          </Table.Td>
                          <Table.Td ta="right">
                            <Group gap="xs" justify="flex-end">
                              <Button
                                size="xs"
                                variant="subtle"
                                onClick={() => navigate(`/simulator/result/${s.sessionId}`)}
                              >
                                {lang === "ru" ? "Результат" : "Natija"}
                              </Button>
                              {s.penalties && s.penalties.length > 0 && (
                                <Button
                                  size="xs"
                                  variant="light"
                                  color="orange"
                                  onClick={() => navigate(`/simulator/mistakes/${s.sessionId}`)}
                                >
                                  {lang === "ru" ? "Ошибки" : "Xatolar"}
                                </Button>
                              )}
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </Box>
            )}
          </Paper>
        </Container>
      </Box>
    </>
  );
}
