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
} from "@mantine/core";
import {
  IconArrowLeft,
  IconClock,
  IconPlayerPlay,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../../context/LanguageContext";
import SEO from "../../../components/common/SEO";
import { EXERCISE_REGISTRY } from "../registry/exerciseRegistry";

export default function SimulatorPracticeList_Page() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { t } = useTranslation();

  const getLoc = (obj: { uzl: string; uzc: string; ru: string }) => {
    if (lang === "ru") return obj.ru;
    if (lang === "uzc") return obj.uzc;
    return obj.uzl;
  };

  const t_title =
    lang === "ru"
      ? "Тренировка упражнений (Practice)"
      : lang === "uzc"
      ? "Машқ қилиш режими (Practice)"
      : "Mashq qilish rejimi (Practice)";

  const t_subtitle =
    lang === "ru"
      ? "Выберите любое из 12 официальных упражнений автодрома для неограниченной отработки"
      : lang === "uzc"
      ? "Чексиз такрорлаш учун автодромнинг 12 та расмий машқидан бирини танланг"
      : "Cheksiz takrorlash uchun avtodromning 12 ta rasmiy mashqidan birini tanlang";

  return (
    <>
      <SEO title={`${t_title} | PravaOnline`} description={t_subtitle} />

      <Container size="xl" maw={1800} py="lg">
        <Stack gap="lg">
          {/* Header Bar */}
          <Group justify="space-between" align="center" wrap="wrap" gap="xs">
            <Button
              variant="subtle"
              color="gray"
              leftSection={<IconArrowLeft size={18} />}
              onClick={() => navigate("/simulator")}
            >
              {t("simulator.backToMenu", "Simulyator menyusi")}
            </Button>
            <Badge color="cyan" size="md" variant="filled">
              {t("simulator.practiceMode", "MASHQ REJIMI")}
            </Badge>
          </Group>

          {/* Hero Banner */}
          <Paper p="xl" radius="md" withBorder bg="var(--surface)">
            <Title order={2} fw={800} mb="xs">
              {t_title}
            </Title>
            <Text size="sm" c="dimmed">
              {t_subtitle}
            </Text>
          </Paper>

          {/* 12 Exercises Grid */}
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {EXERCISE_REGISTRY.map((ex) => (
              <Card key={ex.number} shadow="xs" padding="lg" radius="md" withBorder>
                <Group justify="space-between" mb="xs">
                  <Badge size="lg" color="cyan" circle>
                    {ex.number}
                  </Badge>
                  <Group gap={6}>
                    <IconClock size={14} color="gray" />
                    <Text size="xs" c="dimmed">
                      {ex.timeLimitSeconds} {t("simulator.secondsUnit", "soniya")}
                    </Text>
                  </Group>
                </Group>

                <Title order={4} fw={700} mb="xs" lineClamp={1}>
                  {getLoc(ex.title)}
                </Title>

                <Text size="xs" c="dimmed" lineClamp={3} mb="md">
                  {getLoc(ex.description)}
                </Text>

                <Button
                  fullWidth
                  color="cyan"
                  variant="light"
                  leftSection={<IconPlayerPlay size={16} />}
                  onClick={() => navigate(`/simulator/practice/${ex.number}`)}
                  mt="auto"
                >
                  {t("simulator.practiceAction", "Mashq qilish")}
                </Button>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </>
  );
}
