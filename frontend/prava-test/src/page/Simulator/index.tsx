import { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Title,
  Text,
  Badge,
  Button,
  SimpleGrid,
  Card,
  Group,
  Stack,
  ThemeIcon,
  Select,
  Progress,
} from "@mantine/core";
import {
  IconSteeringWheel,
  IconCompass,
  IconRefresh,
  IconAward,
  IconChartBar,
  IconPlayerPlay,
  IconArrowLeft,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import SEO from "../../components/common/SEO";
import { simulatorApi } from "./services/simulatorApi";
import type { UserSimulatorStats } from "./types";

export default function SimulatorDashboard_Page() {
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const [selectedVehicle, setSelectedVehicle] = useState<string>("Chevrolet Cobalt");
  const [stats, setStats] = useState<UserSimulatorStats | null>(null);

  useEffect(() => {
    simulatorApi.getUserStats().then(setStats).catch(() => {});
  }, []);

  const t_title =
    lang === "ru"
      ? "3D Симулятор Автодрома"
      : lang === "uzc"
      ? "Автодром 3D Симулятори"
      : "Avtodrom 3D Simulyatori";

  const t_subtitle =
    lang === "ru"
      ? "Интерактивная подготовка к практическому экзамену ГСБДД на 3D автодроме"
      : lang === "uzc"
      ? "ЙҲХХ Давлат амалий имтиҳонига 3D автодромда интерактив тайёргарлик"
      : "YHXX Davlat amaliy imtihoniga 3D avtodromda interaktiv tayyorgarlik";

  return (
    <>
      <SEO title={`${t_title} | PravaOnline`} description={t_subtitle} />

      <Container size="xl" py="lg">
        <Stack gap="xl">
          {/* Header Back & Title */}
          <Group justify="space-between" align="center">
            <Button
              variant="subtle"
              color="gray"
              leftSection={<IconArrowLeft size={18} />}
              onClick={() => navigate("/practical-exam")}
            >
              {lang === "ru" ? "Назад к экзамену" : "Amaliy imtihonga qaytish"}
            </Button>

            <Group gap="xs">
              <Button
                variant="light"
                color="blue"
                leftSection={<IconChartBar size={18} />}
                onClick={() => navigate("/simulator/statistics")}
              >
                {lang === "ru" ? "Моя статистика" : "Statistika"}
              </Button>
            </Group>
          </Group>

          {/* Hero Banner */}
          <Paper
            p="xl"
            radius="lg"
            withBorder
            style={{
              background:
                "linear-gradient(135deg, rgba(24, 100, 171, 0.1) 0%, rgba(12, 133, 153, 0.15) 100%)",
              borderColor: "rgba(24, 100, 171, 0.3)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Group justify="space-between" align="center" wrap="wrap" gap="xl">
              <Stack gap="xs" style={{ maxWidth: 640 }}>
                <Group gap="xs">
                  <Badge color="blue" size="lg" variant="filled" leftSection={<IconSteeringWheel size={14} />}>
                    WebGL 3D
                  </Badge>
                  <Badge color="green" size="lg" variant="light">
                    12 {lang === "ru" ? "Упражнений" : "ta Mashq"}
                  </Badge>
                  <Badge color="cyan" size="lg" variant="light">
                    60 FPS
                  </Badge>
                </Group>
                <Title order={2} fw={800}>
                  {t_title}
                </Title>
                <Text size="sm" c="dimmed">
                  {t_subtitle}
                </Text>

                {/* Vehicle Selector */}
                <Group gap="xs" mt="xs" align="center">
                  <Text size="xs" fw={700} c="dimmed">
                    {lang === "ru" ? "Автомобиль:" : "Avtomobil:"}
                  </Text>
                  <Select
                    size="xs"
                    value={selectedVehicle}
                    onChange={(v) => setSelectedVehicle(v || "Chevrolet Cobalt")}
                    data={["Chevrolet Cobalt", "Chevrolet Gentra", "Chevrolet Malibu"]}
                    style={{ width: 180 }}
                  />
                </Group>
              </Stack>

              {/* Quick Overall Stats Widget */}
              {stats && stats.totalSessions > 0 && (
                <Paper p="md" radius="md" withBorder bg="var(--surface)" style={{ minWidth: 220 }}>
                  <Text size="xs" c="dimmed" fw={600}>
                    {lang === "ru" ? "Результаты попыток:" : "Urinishlar natijasi:"}
                  </Text>
                  <Group justify="space-between" mt={4}>
                    <Text size="xl" fw={800} c="blue">
                      {stats.passedSessions} / {stats.totalSessions}
                    </Text>
                    <Badge color={stats.passRate >= 70 ? "green" : "orange"} size="md">
                      {stats.passRate}% {lang === "ru" ? "сдано" : "o'tish"}
                    </Badge>
                  </Group>
                  <Progress value={stats.passRate} mt="xs" size="sm" color="blue" radius="xl" />
                </Paper>
              )}
            </Group>
          </Paper>

          {/* 3 Main Operating Modes */}
          <Title order={3} fw={700}>
            {lang === "ru" ? "Выберите режим симулятора:" : "Simulyator rejimini tanlang:"}
          </Title>

          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
            {/* 1. TRAINING MODE */}
            <Card shadow="sm" padding="xl" radius="md" withBorder>
              <ThemeIcon size={52} radius="md" color="blue" variant="light" mb="md">
                <IconCompass size={28} />
              </ThemeIcon>
              <Badge color="blue" variant="light" size="sm" mb="xs">
                {lang === "ru" ? "ДЛЯ НОВИЧКОВ" : "O'RGANUVCHILAR UCHUN"}
              </Badge>
              <Title order={4} fw={700} mb="xs">
                {lang === "ru" ? "Обучение (Training)" : "O'rganish (Training)"}
              </Title>
              <Text size="sm" c="dimmed" mb="lg">
                {lang === "ru"
                  ? "Пошаговые подсказки траектории, неограниченное время, голосовой инструктор и помощь при рулении."
                  : "Qadam-baqadam yordamchi trayektoriya, cheksiz vaqt, ovozli instruktor va rul yo'naltirgichi."}
              </Text>
              <Button
                fullWidth
                color="blue"
                variant="filled"
                leftSection={<IconPlayerPlay size={18} />}
                onClick={() => navigate("/simulator/training")}
                mt="auto"
              >
                {lang === "ru" ? "Начать обучение" : "O'rganishni boshlash"}
              </Button>
            </Card>

            {/* 2. PRACTICE MODE */}
            <Card shadow="sm" padding="xl" radius="md" withBorder>
              <ThemeIcon size={52} radius="md" color="cyan" variant="light" mb="md">
                <IconRefresh size={28} />
              </ThemeIcon>
              <Badge color="cyan" variant="light" size="sm" mb="xs">
                {lang === "ru" ? "ОТРАБОТКА ЭЛЕМЕНТОВ" : "YAKKA MASHQLAR"}
              </Badge>
              <Title order={4} fw={700} mb="xs">
                {lang === "ru" ? "Тренировка (Practice)" : "Mashq qilish (Practice)"}
              </Title>
              <Text size="sm" c="dimmed" mb="lg">
                {lang === "ru"
                  ? "Отрабатывайте сложные упражнения (эстакада, парковка, змейка) с неограниченными повторами."
                  : "O'zingiz qiynalgan mashqlarni (estakada, parkovka, garaj) alohida tanlab cheksiz takrorlang."}
              </Text>
              <Button
                fullWidth
                color="cyan"
                variant="filled"
                leftSection={<IconRefresh size={18} />}
                onClick={() => navigate("/simulator/practice")}
                mt="auto"
              >
                {lang === "ru" ? "Выбрать упражнение" : "Mashqni tanlash"}
              </Button>
            </Card>

            {/* 3. EXAM SIMULATION MODE */}
            <Card shadow="sm" padding="xl" radius="md" withBorder>
              <ThemeIcon size={52} radius="md" color="orange" variant="light" mb="md">
                <IconAward size={28} />
              </ThemeIcon>
              <Badge color="orange" variant="filled" size="sm" mb="xs">
                {lang === "ru" ? "СТАНДАРТ ГСБДД" : "DAVLAT STANDARTI"}
              </Badge>
              <Title order={4} fw={700} mb="xs">
                {lang === "ru" ? "Экзамен (Exam Simulation)" : "Real Imtihon (100 Ball)"}
              </Title>
              <Text size="sm" c="dimmed" mb="lg">
                {lang === "ru"
                  ? "12 упражнений подряд по официальным правилам. Подсказки выключены. Лимит штрафных баллов — 100."
                  : "12 ta mashq ketma-ket, rasmiy 100 ballik qat'iy nazorat. Yordamchilar o'chirilgan, real imtihon muhiti."}
              </Text>
              <Button
                fullWidth
                color="orange"
                variant="filled"
                leftSection={<IconPlayerPlay size={18} />}
                onClick={() => navigate("/simulator/exam")}
                mt="auto"
              >
                {lang === "ru" ? "Сдать экзамен" : "Imtihon topshirish"}
              </Button>
            </Card>
          </SimpleGrid>
        </Stack>
      </Container>
    </>
  );
}
