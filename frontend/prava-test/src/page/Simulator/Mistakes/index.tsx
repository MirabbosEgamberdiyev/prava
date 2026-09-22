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
  Box,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconAlertTriangle,
  IconRefresh,
  IconCheck,
} from "@tabler/icons-react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../../../context/LanguageContext";
import SEO from "../../../components/common/SEO";
import { loadSessionLocally } from "../engine/sessionManager";
import type { SimulatorSessionData } from "../types";

export default function SimulatorMistakes_Page() {
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

  const t_title =
    lang === "ru" ? "Разбор ошибок экзамена" : "Imtihon xatoliklari tahlili";

  if (!session || !session.penalties || session.penalties.length === 0) {
    return (
      <Container size="sm" py="xl">
        <Paper p="xl" radius="md" withBorder ta="center">
          <ThemeIcon size={64} radius="xl" color="green" variant="light" mb="md">
            <IconCheck size={36} />
          </ThemeIcon>
          <Title order={3} mb="xs">
            {lang === "ru" ? "Ошибок не зафиксировано!" : "Hech qanday xatolik qayd etilmagan!"}
          </Title>
          <Text size="sm" c="dimmed" mb="lg">
            {lang === "ru"
              ? "В данной сессии не было допущено ни одной ошибки."
              : "Ushbu imtihon sessiyasida bironta ham jarima olinmagan."}
          </Text>
          <Button color="blue" onClick={() => navigate(`/simulator/result/${sessionId}`)}>
            {lang === "ru" ? "Вернуться к результату" : "Natijaga qaytish"}
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <>
      <SEO title={`${t_title} | PravaOnline`} description="Xatolarni ko'rib chiqish" />

      <Container size="md" py="xl">
        <Stack gap="lg">
          <Group justify="space-between" align="center">
            <Button
              variant="subtle"
              color="gray"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => navigate(`/simulator/result/${sessionId}`)}
            >
              {lang === "ru" ? "Назад к результату" : "Natijaga qaytish"}
            </Button>
            <Badge color="red" size="lg" variant="filled">
              {session.penalties.length} {lang === "ru" ? "ошибок" : "ta xato"}
            </Badge>
          </Group>

          <Paper p="md" radius="md" withBorder bg="var(--surface)">
            <Title order={3} fw={800} mb={4}>
              {t_title}
            </Title>
            <Text size="sm" c="dimmed">
              {lang === "ru"
                ? "Ниже представлен подробный список всех зафиксированных нарушений с пояснениями."
                : "Quyida simulyator tomonidan qayd etilgan barcha qoidabuzarliklar va ularning izohi keltirilgan."}
            </Text>
          </Paper>

          {/* Mistakes Cards */}
          <Stack gap="md">
            {session.penalties.map((pen, idx) => (
              <Card key={pen.id || idx} shadow="xs" padding="lg" radius="md" withBorder>
                <Group justify="space-between" align="flex-start" mb="xs">
                  <Group gap="xs">
                    <ThemeIcon color="red" size="md" variant="light">
                      <IconAlertTriangle size={18} />
                    </ThemeIcon>
                    <Box>
                      <Badge color="gray" size="xs" variant="outline" mb={2}>
                        {pen.exerciseNumber}-mashq
                      </Badge>
                      <Title order={5} fw={700}>
                        {getLoc(pen.title)}
                      </Title>
                    </Box>
                  </Group>
                  <Badge color="red" size="lg">
                    +{pen.points} {lang === "ru" ? "баллов" : "ball"}
                  </Badge>
                </Group>

                <Text size="sm" c="dimmed" mb="md">
                  {getLoc(pen.explanation)}
                </Text>

                <Group justify="flex-end">
                  <Button
                    size="xs"
                    color="cyan"
                    variant="light"
                    leftSection={<IconRefresh size={14} />}
                    onClick={() => navigate(`/simulator/practice/${pen.exerciseNumber}`)}
                  >
                    {lang === "ru"
                      ? `Отработать упражнение ${pen.exerciseNumber}`
                      : `${pen.exerciseNumber}-mashqni alohida mashq qilish`}
                  </Button>
                </Group>
              </Card>
            ))}
          </Stack>
        </Stack>
      </Container>
    </>
  );
}
