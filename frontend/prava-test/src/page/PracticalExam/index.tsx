import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Container,
  Title,
  Text,
  Tabs,
  SimpleGrid,
  Card,
  Badge,
  Group,
  Stack,
  Center,
  Table,
  Paper,
  Button,
  Skeleton,
  Alert,
  Modal,
  ThemeIcon,
} from "@mantine/core";
import {
  IconSteeringWheel,
  IconAlertOctagon,
  IconChecklist,
  IconAlertTriangle,
  IconRefresh,
  IconDeviceGamepad2,
  IconPlayerPlay,
  IconAward,
  IconCompass,
} from "@tabler/icons-react";
import {
  curriculumApi,
  type PracticalExercise,
  type PracticalPenalty,
} from "../../services/curriculumApi";
import { useLanguage } from "../../context/LanguageContext";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import SEO from "../../components/common/SEO";
import { errorKeyFor } from "../../types/errors";
import { pickLocalized } from "../../data/curriculumLocale";
import { fallbackExercises, findFallbackExercise } from "./exercises.data";

// Simulyator marshrutlari o'chirilgan (routes/index.tsx: SHOW_SIMULATOR = false) — bu yerdagi
// simulyator banneri va modal ham yashirin qoladi, o'chirilgan sahifalarga havola ko'rsatilmaydi.
const SHOW_SIMULATOR = false;

type SimulatorMode = "training" | "practice" | "exam";

export default function PracticalExam_Page() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { t } = useTranslation();

  const [exercises, setExercises] = useState<PracticalExercise[]>([]);
  const [penalties, setPenalties] = useState<PracticalPenalty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<SimulatorMode>("training");

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    curriculumApi
      .getPracticalExam()
      .then((data) => {
        setExercises(data.exercises);
        setPenalties(data.penalties);
      })
      .catch((err: unknown) => {
        // 5xx/tarmoq xatolari uchun global toast api.ts'da chiqadi — bu yerda faqat inline xato.
        setError(err);
        setExercises([]);
        setPenalties([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  // Backend mashqlarni qaytarmasa — rasmiy statik ro'yxat (exercises.data.ts).
  const safeExercises = useMemo(
    () => (exercises.length > 0 ? exercises : fallbackExercises()),
    [exercises],
  );
  const safePenalties = penalties;

  const getLocalizedTitle = (e: PracticalExercise) => {
    const fb = findFallbackExercise(e.exercise_number);
    return pickLocalized(
      lang,
      e.title_uzl || fb?.title.uzl,
      e.title_uzc || fb?.title.uzc,
      e.title_ru || fb?.title.ru,
    );
  };

  const getLocalizedDesc = (e: PracticalExercise) => {
    const fb = findFallbackExercise(e.exercise_number);
    return pickLocalized(
      lang,
      e.description_uzl || fb?.description.uzl,
      e.description_uzc || fb?.description.uzc,
      e.description_ru || fb?.description.ru,
    );
  };

  const getLocalizedPenalty = (p: PracticalPenalty) => pickLocalized(lang, p.text_uzl, p.text_uzc, p.text_ru);

  const modeLabel: Record<SimulatorMode, string> = {
    training: t("curriculum.modeTrainingShort"),
    practice: t("curriculum.modePracticeShort"),
    exam: t("curriculum.modeExamShort"),
  };

  const getSeverityBadge = (points: number) => {
    if (points >= 100) {
      return (
        <Badge color="red" variant="filled">
          {t("curriculum.severityWithPoints", { label: t("curriculum.severityMajor"), count: 100 })}
        </Badge>
      );
    }
    if (points >= 20) {
      return (
        <Badge color="orange" variant="filled">
          {t("curriculum.severityWithPoints", { label: t("curriculum.severityMedium"), count: points })}
        </Badge>
      );
    }
    return (
      <Badge color="yellow" variant="light">
        {t("curriculum.severityWithPoints", { label: t("curriculum.severityMinor"), count: points })}
      </Badge>
    );
  };

  return (
    <Container size="xl" py="xl">
      <SEO title={t("seo.practical.title")} description={t("seo.practical.desc")} />

      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={1} fw={900} style={{ letterSpacing: "-0.5px" }}>
              {t("curriculum.autodromTitle")}
            </Title>
            <Text c="dimmed" size="sm" mt={4}>
              {t("curriculum.autodromSubtitle")}
            </Text>
          </div>
          {!loading && !error && (
            <Badge size="lg" variant="filled" color="teal" leftSection={<IconSteeringWheel size={14} />}>
              {t("curriculum.practicalCounts", { exercises: safeExercises.length, penalties: safePenalties.length })}
            </Badge>
          )}
        </Group>

        {!loading && !!error && (
          <Alert
            icon={<IconAlertTriangle size={18} />}
            title={t("common.error")}
            color="red"
            variant="light"
            radius="md"
            role="alert"
          >
            <Group justify="space-between" align="center">
              <Text size="sm">{t(errorKeyFor(error, "curriculum.loadPracticalError"))}</Text>
              <Button
                size="xs"
                color="red"
                variant="light"
                leftSection={<IconRefresh size={14} />}
                onClick={fetchData}
              >
                {t("common.retry")}
              </Button>
            </Group>
          </Alert>
        )}

        {/* Avtodrom 3D Simulator Interactive Banner (Temporarily hidden) */}
        {SHOW_SIMULATOR && (
          <Paper
            p="xl"
            radius="lg"
            withBorder
            style={{
              background: "linear-gradient(135deg, rgba(24, 100, 171, 0.08) 0%, rgba(12, 133, 153, 0.12) 100%)",
              borderColor: "rgba(24, 100, 171, 0.25)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Group justify="space-between" align="center" wrap="wrap" gap="lg">
              <Stack gap="xs" style={{ maxWidth: 680 }}>
                <Group gap="xs">
                  <Badge
                    color="cyan"
                    variant="filled"
                    size="md"
                    leftSection={<IconDeviceGamepad2 size={14} />}
                  >
                    {t("curriculum.simulatorBadge")}
                  </Badge>
                  <Badge color="green" variant="light" size="md">
                    {t("curriculum.simulatorExercises", { count: safeExercises.length })}
                  </Badge>
                </Group>
                <Title order={3} fw={800}>
                  {t("curriculum.simulatorTitle")}
                </Title>
                <Text size="sm" c="dimmed">
                  {t("curriculum.simulatorDesc", { count: safeExercises.length })}
                </Text>
                <Group gap="xs" mt="xs">
                  <Badge variant="outline" color="blue" size="sm">
                    {t("curriculum.modeTraining")}
                  </Badge>
                  <Badge variant="outline" color="cyan" size="sm">
                    {t("curriculum.modePractice")}
                  </Badge>
                  <Badge variant="outline" color="orange" size="sm">
                    {t("curriculum.modeExam")}
                  </Badge>
                </Group>
              </Stack>

              <Button
                size="lg"
                radius="md"
                color="blue"
                leftSection={<IconPlayerPlay size={20} />}
                onClick={() => setSimulatorOpen(true)}
                style={{
                  boxShadow: "0 8px 20px rgba(24, 100, 171, 0.3)",
                }}
              >
                {t("curriculum.startSimulator")}
              </Button>
            </Group>
          </Paper>
        )}

        {!error && (
          <Tabs defaultValue="exercises">
            <Tabs.List mb="lg">
              <Tabs.Tab value="exercises" leftSection={<IconChecklist size={16} />} style={{ fontWeight: 600 }}>
                {t("curriculum.tabExercises")}
              </Tabs.Tab>
              <Tabs.Tab value="penalties" leftSection={<IconAlertOctagon size={16} />} style={{ fontWeight: 600 }}>
                {t("curriculum.tabPenalties")}
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="exercises">
              {loading ? (
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <Card key={idx} shadow="sm" padding="lg" radius="md" withBorder>
                      <Skeleton height={28} width={28} circle mb="sm" />
                      <Skeleton height={20} width="70%" mb="xs" />
                      <Skeleton height={14} width="95%" mb="xs" />
                      <Skeleton height={14} width="80%" />
                    </Card>
                  ))}
                </SimpleGrid>
              ) : safeExercises.length === 0 ? (
                <Center py={60}>
                  <Stack align="center" gap="xs">
                    <IconAlertTriangle size={40} color="gray" />
                    <Text c="dimmed">{t("curriculum.emptyExercises")}</Text>
                    <Button size="xs" variant="subtle" onClick={fetchData}>
                      {t("common.refresh")}
                    </Button>
                  </Stack>
                </Center>
              ) : (
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
                  {safeExercises.map((ex) => (
                    <Card key={ex.id} shadow="sm" padding="lg" radius="md" withBorder>
                      <Group justify="space-between" mb="xs">
                        <Badge color="blue" size="lg" circle>
                          {ex.exercise_number}
                        </Badge>
                        <Text size="xs" c="dimmed">
                          {t("curriculum.colNumber")} {ex.exercise_number}
                        </Text>
                      </Group>

                      <Title order={4} fw={700} mt="xs" mb="sm">
                        {getLocalizedTitle(ex)}
                      </Title>

                      <Text size="sm" c="dimmed" lineClamp={3}>
                        {getLocalizedDesc(ex)}
                      </Text>
                    </Card>
                  ))}
                </SimpleGrid>
              )}
            </Tabs.Panel>

            <Tabs.Panel value="penalties">
              {loading ? (
                <Stack gap="xs">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <Skeleton key={idx} height={40} radius="sm" />
                  ))}
                </Stack>
              ) : safePenalties.length === 0 ? (
                <Center py={60}>
                  <Stack align="center" gap="xs">
                    <IconAlertTriangle size={40} color="gray" />
                    <Text c="dimmed">{t("curriculum.emptyPenalties")}</Text>
                    <Button size="xs" variant="subtle" onClick={fetchData}>
                      {t("common.refresh")}
                    </Button>
                  </Stack>
                </Center>
              ) : (
                <Paper withBorder radius="md" p="md">
                  <Table.ScrollContainer minWidth={560}>
                    <Table striped highlightOnHover verticalSpacing="sm">
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th style={{ width: 60 }}>{t("curriculum.colNumber")}</Table.Th>
                          <Table.Th>{t("curriculum.colViolation")}</Table.Th>
                          <Table.Th style={{ width: 220 }}>{t("curriculum.colPoints")}</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {safePenalties.map((p) => (
                          <Table.Tr key={p.id}>
                            <Table.Td fw={700}>{p.penalty_number}</Table.Td>
                            <Table.Td style={{ fontSize: "0.95rem" }}>
                              {getLocalizedPenalty(p)}
                            </Table.Td>
                            <Table.Td>{getSeverityBadge(p.points)}</Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                </Paper>
              )}
            </Tabs.Panel>
          </Tabs>
        )}
      </Stack>

      {/* Avtodrom 3D Simulator Launcher Modal (Temporarily hidden) */}
      {SHOW_SIMULATOR && (
        <Modal
          opened={simulatorOpen}
          onClose={() => setSimulatorOpen(false)}
          title={
            <Group gap="xs">
              <ThemeIcon color="blue" size="lg" radius="md">
                <IconSteeringWheel size={20} />
              </ThemeIcon>
              <div>
                <Text fw={700} size="md">
                  {t("curriculum.simulatorTitle")}
                </Text>
                <Text size="xs" c="dimmed">
                  v2.0 • WebGL & Rapier 3D Physics
                </Text>
              </div>
            </Group>
          }
          size="lg"
          radius="md"
        >
          <Stack gap="md">
            <Text size="sm">
              {t("curriculum.simulatorDesc", { count: safeExercises.length })}
            </Text>

            <Paper p="md" radius="md" withBorder bg="var(--surface)">
              <Text fw={600} size="sm" mb="xs">
                {t("curriculum.chooseMode")}
              </Text>
              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs">
                <Card
                  padding="sm"
                  radius="sm"
                  withBorder
                  style={{
                    cursor: "pointer",
                    borderColor: selectedMode === "training" ? "var(--mantine-color-blue-6)" : undefined,
                    backgroundColor: selectedMode === "training" ? "rgba(24, 100, 171, 0.08)" : undefined,
                  }}
                  onClick={() => setSelectedMode("training")}
                >
                  <Group gap="xs" mb={4}>
                    <ThemeIcon size="sm" color="blue" variant="light">
                      <IconCompass size={14} />
                    </ThemeIcon>
                    <Text fw={600} size="xs">
                      {modeLabel.training}
                    </Text>
                  </Group>
                  <Text size="xs" c="dimmed">
                    {t("curriculum.modeTrainingDesc")}
                  </Text>
                </Card>

                <Card
                  padding="sm"
                  radius="sm"
                  withBorder
                  style={{
                    cursor: "pointer",
                    borderColor: selectedMode === "practice" ? "var(--mantine-color-cyan-6)" : undefined,
                    backgroundColor: selectedMode === "practice" ? "rgba(12, 133, 153, 0.08)" : undefined,
                  }}
                  onClick={() => setSelectedMode("practice")}
                >
                  <Group gap="xs" mb={4}>
                    <ThemeIcon size="sm" color="cyan" variant="light">
                      <IconRefresh size={14} />
                    </ThemeIcon>
                    <Text fw={600} size="xs">
                      {modeLabel.practice}
                    </Text>
                  </Group>
                  <Text size="xs" c="dimmed">
                    {t("curriculum.modePracticeDesc")}
                  </Text>
                </Card>

                <Card
                  padding="sm"
                  radius="sm"
                  withBorder
                  style={{
                    cursor: "pointer",
                    borderColor: selectedMode === "exam" ? "var(--mantine-color-orange-6)" : undefined,
                    backgroundColor: selectedMode === "exam" ? "rgba(232, 89, 12, 0.08)" : undefined,
                  }}
                  onClick={() => setSelectedMode("exam")}
                >
                  <Group gap="xs" mb={4}>
                    <ThemeIcon size="sm" color="orange" variant="light">
                      <IconAward size={14} />
                    </ThemeIcon>
                    <Text fw={600} size="xs">
                      {modeLabel.exam}
                    </Text>
                  </Group>
                  <Text size="xs" c="dimmed">
                    {t("curriculum.modeExamDesc", { count: safeExercises.length })}
                  </Text>
                </Card>
              </SimpleGrid>
            </Paper>

            <Paper p="md" radius="md" withBorder bg="var(--surface)">
              <Text fw={600} size="sm" mb="xs">
                {t("practicalExam.controlsTitle")}
              </Text>
              <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
                <Paper p="xs" radius="sm" withBorder ta="center">
                  <Badge size="sm" variant="outline">W / ↑</Badge>
                  <Text size="xs" mt={4} c="dimmed">{t("practicalExam.gas")}</Text>
                </Paper>
                <Paper p="xs" radius="sm" withBorder ta="center">
                  <Badge size="sm" variant="outline">S / ↓</Badge>
                  <Text size="xs" mt={4} c="dimmed">{t("practicalExam.brake")}</Text>
                </Paper>
                <Paper p="xs" radius="sm" withBorder ta="center">
                  <Badge size="sm" variant="outline">A / D / ← →</Badge>
                  <Text size="xs" mt={4} c="dimmed">{t("practicalExam.steering")}</Text>
                </Paper>
                <Paper p="xs" radius="sm" withBorder ta="center">
                  <Badge size="sm" variant="outline">SPACE</Badge>
                  <Text size="xs" mt={4} c="dimmed">{t("practicalExam.handbrake")}</Text>
                </Paper>
              </SimpleGrid>
            </Paper>

            <Group justify="flex-end" align="center" mt="xs">
              <Button
                color="blue"
                size="md"
                maw="100%"
                title={t("curriculum.startExercise", { mode: modeLabel[selectedMode] })}
                leftSection={<IconPlayerPlay size={18} />}
                onClick={() => {
                  setSimulatorOpen(false);
                  navigate(`/practical-exam/simulator?mode=${selectedMode}`);
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>
                  {t("curriculum.startExercise", { mode: modeLabel[selectedMode] })}
                </span>
              </Button>
            </Group>
          </Stack>
        </Modal>
      )}
    </Container>
  );
}
