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
  SimpleGrid,
  Table,
  ThemeIcon,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconCheck,
  IconX,
  IconRefresh,
  IconListDetails,
} from "@tabler/icons-react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../../../context/LanguageContext";
import SEO from "../../../components/common/SEO";
import { loadSessionLocally } from "../engine/sessionManager";
import type { SimulatorSessionData } from "../types";

export default function SimulatorResult_Page() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const [session, setSession] = useState<SimulatorSessionData | null>(null);

  useEffect(() => {
    if (sessionId) {
      const s = loadSessionLocally(sessionId);
      if (s) setSession(s);
    }
  }, [sessionId]);

  const getLoc = (obj: { uzl: string; uzc: string; ru: string }) => {
    if (lang === "ru") return obj.ru;
    if (lang === "uzc") return obj.uzc;
    return obj.uzl;
  };

  if (!session) {
    return (
      <Container size="sm" py="xl">
        <Paper p="xl" radius="md" withBorder ta="center">
          <Title order={3} mb="sm">
            {lang === "ru" ? "Результат не найден" : "Natija topilmadi"}
          </Title>
          <Button color="blue" onClick={() => navigate("/simulator")}>
            {lang === "ru" ? "Вернуться в симулятор" : "Simulyatorga qaytish"}
          </Button>
        </Paper>
      </Container>
    );
  }

  const isPassed = session.isPassed;
  const mins = Math.floor(session.timeSpentSeconds / 60);
  const secs = session.timeSpentSeconds % 60;
  const timeFormatted = `${mins} ${lang === "ru" ? "мин." : "daq."} ${secs} ${lang === "ru" ? "сек." : "son."}`;

  // Find first failed exercise to retry
  const firstFailedExNum =
    session.penalties && session.penalties.length > 0
      ? session.penalties[0].exerciseNumber
      : null;

  return (
    <>
      <SEO
        title={`${isPassed ? (lang === "ru" ? "Экзамен сдан" : "Imtihon topshirildi") : (lang === "ru" ? "Экзамен не сдан" : "Imtihon topshirilmadi")} | PravaOnline`}
        description="Natija tahlili"
      />

      <Container size="md" py="xl">
        <Stack gap="lg">
          {/* Header Pass/Fail Card */}
          <Paper
            p="xl"
            radius="lg"
            withBorder
            style={{
              borderColor: isPassed ? "#2ecc71" : "#e74c3c",
              backgroundColor: isPassed ? "rgba(46, 204, 113, 0.05)" : "rgba(231, 76, 60, 0.05)",
            }}
          >
            <Group justify="center" align="center" gap="xl">
              <ThemeIcon
                size={80}
                radius="xl"
                color={isPassed ? "green" : "red"}
                variant="filled"
              >
                {isPassed ? <IconCheck size={48} /> : <IconX size={48} />}
              </ThemeIcon>

              <Stack gap={4}>
                <Badge
                  size="xl"
                  variant="filled"
                  color={isPassed ? "green" : "red"}
                >
                  {isPassed
                    ? lang === "ru"
                      ? "ЭКЗАМЕН СДАН!"
                      : "IMTIHON TOPSHIRILDI!"
                    : lang === "ru"
                    ? "ЭКЗАМЕН НЕ СДАН"
                    : "IMTIHON TOPSHIRILMADI"}
                </Badge>
                <Title order={2} fw={800} mt="xs">
                  {isPassed
                    ? lang === "ru"
                      ? "Поздравляем с успешной сдачей!"
                      : "Muvaffaqiyatli topshirilganingiz bilan tabriklaymiz!"
                    : lang === "ru"
                    ? "Превышен лимит штрафных баллов"
                    : "Jarima ballari chegarasidan oshib ketildi"}
                </Title>
                <Text size="sm" c="dimmed">
                  {lang === "ru" ? "Затраченное время:" : "Sarflangan vaqt:"} {timeFormatted}
                </Text>
              </Stack>
            </Group>
          </Paper>

          {/* Stats Breakdown */}
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            <Paper p="md" radius="md" withBorder ta="center">
              <Text size="xs" c="dimmed" fw={600}>
                {lang === "ru" ? "Итоговый штраф" : "Yakuniy jarima"}
              </Text>
              <Text size="xl" fw={800} c={isPassed ? "green" : "red"}>
                {session.totalPenaltyPoints} / 100
              </Text>
            </Paper>

            <Paper p="md" radius="md" withBorder ta="center">
              <Text size="xs" c="dimmed" fw={600}>
                {lang === "ru" ? "Зафиксировано ошибок" : "Qayd etilgan xatolar"}
              </Text>
              <Text size="xl" fw={800} c="orange">
                {session.penalties ? session.penalties.length : 0}
              </Text>
            </Paper>

            <Paper p="md" radius="md" withBorder ta="center">
              <Text size="xs" c="dimmed" fw={600}>
                {lang === "ru" ? "Автомобиль" : "Avtomobil"}
              </Text>
              <Text size="md" fw={700} c="blue" lineClamp={1}>
                {session.vehicleModel}
              </Text>
            </Paper>
          </SimpleGrid>

          {/* Mistakes Table if any */}
          {session.penalties && session.penalties.length > 0 && (
            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Title order={4} fw={700}>
                  {lang === "ru" ? "Список допущенных ошибок:" : "Qayd etilgan xatolar ro'yxati:"}
                </Title>
                <Button
                  size="xs"
                  variant="subtle"
                  leftSection={<IconListDetails size={14} />}
                  onClick={() => navigate(`/simulator/mistakes/${session.sessionId}`)}
                >
                  {lang === "ru" ? "Подробный разбор" : "Batafsil tahlil"}
                </Button>
              </Group>

              <Table striped highlightOnHover verticalSpacing="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>№</Table.Th>
                    <Table.Th>{lang === "ru" ? "Упражнение" : "Mashq"}</Table.Th>
                    <Table.Th>{lang === "ru" ? "Нарушение" : "Qoidabuzarlik"}</Table.Th>
                    <Table.Th>{lang === "ru" ? "Штраф" : "Jarima"}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {session.penalties.map((p, idx) => (
                    <Table.Tr key={p.id || idx}>
                      <Table.Td>{idx + 1}</Table.Td>
                      <Table.Td fw={600}>{p.exerciseNumber}-mashq</Table.Td>
                      <Table.Td>{getLoc(p.title)}</Table.Td>
                      <Table.Td>
                        <Badge color="red" size="sm">
                          +{p.points}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          )}

          {/* Action Buttons */}
          <Group justify="space-between" wrap="wrap" mt="md">
            <Button
              variant="outline"
              color="gray"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => navigate("/simulator")}
            >
              {lang === "ru" ? "В меню симулятора" : "Simulyator menyusiga"}
            </Button>

            <Group gap="xs">
              {/* Retry Failed Exercise Button */}
              {!isPassed && firstFailedExNum !== null && (
                <Button
                  color="orange"
                  variant="filled"
                  leftSection={<IconRefresh size={16} />}
                  onClick={() => navigate(`/simulator/practice/${firstFailedExNum}`)}
                >
                  {lang === "ru"
                    ? "Отработать ошибку (Mashq)"
                    : "Faqat xato qilingan mashqni qayta o'tish"}
                </Button>
              )}

              <Button
                color="blue"
                variant="filled"
                leftSection={<IconRefresh size={16} />}
                onClick={() => navigate("/simulator/exam")}
              >
                {lang === "ru" ? "Сдать заново" : "Qaytadan imtihon topshirish"}
              </Button>
            </Group>
          </Group>
        </Stack>
      </Container>
    </>
  );
}
