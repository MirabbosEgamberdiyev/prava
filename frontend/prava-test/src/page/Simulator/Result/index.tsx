import { useState, useEffect, useRef } from "react";
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
  Collapse,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconCheck,
  IconX,
  IconRefresh,
  IconListDetails,
  IconVideo,
  IconVideoOff,
} from "@tabler/icons-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../../context/LanguageContext";
import SEO from "../../../components/common/SEO";
import { loadSessionLocally } from "../engine/sessionManager";
import { loadReplayLocally, ReplayPlayer } from "../engine/replayEngine";
import { EXERCISE_REGISTRY } from "../registry/exerciseRegistry";
import SimulatorCanvas3D from "../components/SimulatorCanvas3D";
import ReplayScrubber from "../components/ReplayScrubber";
import type { SimulatorSessionData, ReplayRecording, VehicleTelemetry, PenaltyEvent } from "../types";

export default function SimulatorResult_Page() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { t } = useTranslation();

  const [session, setSession] = useState<SimulatorSessionData | null>(null);
  const [replayRecording, setReplayRecording] = useState<ReplayRecording | null>(null);
  const [showReplay, setShowReplay] = useState<boolean>(true);
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState<number>(0);

  const [replayTelemetry, setReplayTelemetry] = useState<VehicleTelemetry>({
    speed: 0,
    rpm: 800,
    gear: "P",
    steeringAngle: 0,
    handbrake: true,
    throttle: 0,
    brake: 0,
    seatbeltFastened: true,
    lowBeamsOn: true,
    turnSignal: "none",
    posX: EXERCISE_REGISTRY[0].startX,
    posY: EXERCISE_REGISTRY[0].startY,
    rotation: EXERCISE_REGISTRY[0].startRotation,
    rollbackDistance: 0,
  });

  const playerRef = useRef<ReplayPlayer | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (sessionId) {
      const s = loadSessionLocally(sessionId);
      if (s) setSession(s);

      const rec = loadReplayLocally(sessionId);
      if (rec && rec.frames && rec.frames.length > 0) {
        setReplayRecording(rec);
        const player = new ReplayPlayer(rec, (telem) => {
          setReplayTelemetry(telem);
        });
        playerRef.current = player;

        // Start playback animation loop
        const loop = () => {
          if (playerRef.current) {
            playerRef.current.tick();
            setCurrentTimeSeconds(playerRef.current.getCurrentTimeSeconds());
          }
          animFrameRef.current = requestAnimationFrame(loop);
        };
        animFrameRef.current = requestAnimationFrame(loop);
      }
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [sessionId]);

  const handleSeek = (secs: number) => {
    if (playerRef.current) {
      playerRef.current.seekSeconds(secs);
      setCurrentTimeSeconds(secs);
    }
  };

  const handlePenaltyClick = (penalty: PenaltyEvent) => {
    handleSeek(penalty.occurredAtSeconds);
  };

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
            {t("simulator.resultNotFound", "Natija topilmadi")}
          </Title>
          <Button color="blue" onClick={() => navigate("/simulator")}>
            {t("simulator.backToSimulator", "Simulyatorga qaytish")}
          </Button>
        </Paper>
      </Container>
    );
  }

  const isPassed = session.isPassed;
  const mins = Math.floor(session.timeSpentSeconds / 60);
  const secs = session.timeSpentSeconds % 60;
  const unitMin = lang === "ru" ? "мин." : lang === "uzc" ? "дақ." : "daq.";
  const unitSec = lang === "ru" ? "сек." : lang === "uzc" ? "сон." : "son.";
  const timeFormatted = `${mins} ${unitMin} ${secs} ${unitSec}`;

  // Find first failed exercise to retry
  const firstFailedExNum =
    session.penalties && session.penalties.length > 0
      ? session.penalties[0].exerciseNumber
      : null;

  return (
    <>
      <SEO
        title={`${isPassed ? t("simulator.passed", "Imtihon topshirildi") : t("simulator.failed", "Imtihon topshirilmadi")} | PravaOnline`}
        description="Natija tahlili va 3D replay"
      />

      <Container size="md" py="xl">
        <Stack gap="lg">
          {/* Header Pass/Fail Card */}
          <Paper
            p={{ base: "md", sm: "xl" }}
            radius="lg"
            withBorder
            style={{
              borderColor: isPassed ? "#2ecc71" : "#e74c3c",
              backgroundColor: isPassed ? "rgba(46, 204, 113, 0.05)" : "rgba(231, 76, 60, 0.05)",
            }}
          >
            <Group justify="flex-start" align="center" gap="lg" wrap="wrap">
              <ThemeIcon
                size={64}
                radius="xl"
                color={isPassed ? "green" : "red"}
                variant="filled"
              >
                {isPassed ? <IconCheck size={38} /> : <IconX size={38} />}
              </ThemeIcon>

              <Stack gap={4} style={{ flex: 1, minWidth: "220px" }}>
                <Badge
                  size="lg"
                  variant="filled"
                  color={isPassed ? "green" : "red"}
                >
                  {isPassed
                    ? t("simulator.statusPassed", "IMTIHON TOPSHIRILDI!")
                    : t("simulator.statusFailed", "IMTIHON TOPSHIRILMADI")}
                </Badge>
                <Title order={2} fw={800} mt="xs" style={{ wordBreak: "break-word" }}>
                  {isPassed
                    ? (lang === "ru"
                      ? "Поздравляем с успешной сдачей!"
                      : lang === "uzc"
                      ? "Муваффақиятли топширилганингиз билан табриклаймиз!"
                      : "Muvaffaqiyatli topshirilganingiz bilan tabriklaymiz!")
                    : (lang === "ru"
                    ? "Превышен лимит штрафных баллов"
                    : lang === "uzc"
                    ? "Жарима баллари чегарасидан ошиб кетилди"
                    : "Jarima ballari chegarasidan oshib ketildi")}
                </Title>
                <Text size="sm" c="dimmed">
                  {t("simulator.elapsedTime", "Sarflangan vaqt:")} {timeFormatted}
                </Text>
              </Stack>
            </Group>
          </Paper>

          {/* 3D Interactive Replay Player Section */}
          {replayRecording && playerRef.current && (
            <Paper p="md" radius="lg" withBorder bg="var(--surface)">
              <Group justify="space-between" align="center" mb="sm" wrap="wrap" gap="xs">
                <Group gap="xs">
                  <ThemeIcon color="cyan" variant="light" size="md">
                    <IconVideo size={18} />
                  </ThemeIcon>
                  <Title order={4} fw={700}>
                    {lang === "ru"
                      ? "Интерактивный 3D Replay экзамена"
                      : lang === "uzc"
                      ? "Имтиҳоннинг интерактив 3D Replay таҳлили"
                      : "Imtihonning interaktiv 3D Replay tahlili"}
                  </Title>
                </Group>

                <Button
                  size="xs"
                  variant="subtle"
                  color="gray"
                  leftSection={showReplay ? <IconVideoOff size={14} /> : <IconVideo size={14} />}
                  onClick={() => setShowReplay(!showReplay)}
                >
                  {showReplay
                    ? (lang === "ru" ? "Скрыть плеер" : lang === "uzc" ? "Плеерни яшириш" : "Pleyerni yashirish")
                    : (lang === "ru" ? "Показать плеер" : lang === "uzc" ? "Плеерни кўрсатиш" : "Pleyerni ko'rsatish")}
                </Button>
              </Group>

              <Collapse in={showReplay}>
                <Stack gap="xs">
                  <Paper
                    radius="md"
                    withBorder
                    style={{
                      position: "relative",
                      overflow: "hidden",
                      height: "clamp(260px, 45vh, 480px)",
                      backgroundColor: "#1a252f",
                    }}
                  >
                    <SimulatorCanvas3D
                      telemetry={replayTelemetry}
                      exercise={EXERCISE_REGISTRY[0]}
                      cameraView="chase"
                      showHelpers={false}
                      historicalPath={replayRecording.frames.map((f) => ({ x: f.posX, y: f.posY }))}
                    />
                  </Paper>

                  {/* Scrubber Timeline */}
                  <ReplayScrubber
                    player={playerRef.current}
                    recording={replayRecording}
                    currentTimeSeconds={currentTimeSeconds}
                    onSeek={handleSeek}
                    onPenaltyClick={handlePenaltyClick}
                  />
                </Stack>
              </Collapse>
            </Paper>
          )}

          {/* Stats Breakdown */}
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            <Paper p="md" radius="md" withBorder ta="center">
              <Text size="xs" c="dimmed" fw={600}>
                {t("simulator.finalPenalty", "Yakuniy jarima")}
              </Text>
              <Text size="xl" fw={800} c={isPassed ? "green" : "red"}>
                {session.totalPenaltyPoints} / 100
              </Text>
            </Paper>

            <Paper p="md" radius="md" withBorder ta="center">
              <Text size="xs" c="dimmed" fw={600}>
                {t("simulator.recordedErrors", "Qayd etilgan xatolar")}
              </Text>
              <Text size="xl" fw={800} c="orange">
                {session.penalties ? session.penalties.length : 0}
              </Text>
            </Paper>

            <Paper p="md" radius="md" withBorder ta="center">
              <Text size="xs" c="dimmed" fw={600}>
                {t("simulator.vehicle", "Avtomobil")}
              </Text>
              <Text size="md" fw={700} c="blue" lineClamp={1}>
                {session.vehicleModel}
              </Text>
            </Paper>
          </SimpleGrid>

          {/* 12 Exercises Performance Grid */}
          <Paper p="md" radius="md" withBorder>
            <Title order={4} fw={700} mb="sm">
              {lang === "ru"
                ? "Результаты по 12 упражнениям автодрома:"
                : lang === "uzc"
                ? "Автодромнинг 12 та машқи бўйича натижалар:"
                : "Avtodromning 12 ta mashqi bo'yicha natijalar:"}
            </Title>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xs">
              {EXERCISE_REGISTRY.map((ex) => {
                const exPenalties = session.penalties?.filter(
                  (p) => p.exerciseNumber === ex.number
                ) || [];
                const exPenaltyPoints = exPenalties.reduce((sum, p) => sum + p.points, 0);
                const isExPassed = exPenaltyPoints === 0;

                return (
                  <Paper
                    key={ex.number}
                    p="xs"
                    radius="sm"
                    withBorder
                    style={{
                      backgroundColor: isExPassed
                        ? "rgba(34, 197, 94, 0.05)"
                        : "rgba(239, 68, 68, 0.05)",
                      borderColor: isExPassed
                        ? "rgba(34, 197, 94, 0.25)"
                        : "rgba(239, 68, 68, 0.3)",
                    }}
                  >
                    <Group justify="space-between" align="center" wrap="nowrap">
                      <Group gap="xs" wrap="nowrap" style={{ overflow: "hidden" }}>
                        <ThemeIcon
                          size="sm"
                          radius="xl"
                          color={isExPassed ? "green" : "red"}
                          variant="light"
                        >
                          {isExPassed ? <IconCheck size={12} /> : <IconX size={12} />}
                        </ThemeIcon>
                        <Text size="xs" fw={700} lineClamp={1}>
                          {getLoc(ex.title)}
                        </Text>
                      </Group>
                      {isExPassed ? (
                        <Badge size="xs" color="green" variant="light">
                          {lang === "ru" ? "0 штр." : lang === "uzc" ? "0 балл" : "0 ball"}
                        </Badge>
                      ) : (
                        <Group gap={4} wrap="nowrap">
                          <Badge size="xs" color="red" variant="filled">
                            +{exPenaltyPoints}
                          </Badge>
                          <Button
                            size="compact-xs"
                            variant="subtle"
                            color="orange"
                            onClick={() => navigate(`/simulator/practice/${ex.number}`)}
                          >
                            {lang === "ru" ? "Повтор" : lang === "uzc" ? "Машқ" : "Mashq"}
                          </Button>
                        </Group>
                      )}
                    </Group>
                  </Paper>
                );
              })}
            </SimpleGrid>
          </Paper>

          {/* Mistakes Table if any */}
          {session.penalties && session.penalties.length > 0 && (
            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Title order={4} fw={700}>
                  {t("simulator.errorList", "Qayd etilgan xatolar ro'yxati:")}
                </Title>
                <Button
                  size="xs"
                  variant="subtle"
                  leftSection={<IconListDetails size={14} />}
                  onClick={() => navigate(`/simulator/mistakes/${session.sessionId}`)}
                >
                  {t("simulator.detailedReview", "Batafsil tahlil")}
                </Button>
              </Group>

              <Table.ScrollContainer minWidth={480}>
                <Table striped highlightOnHover verticalSpacing="xs">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>№</Table.Th>
                      <Table.Th>{t("simulator.thExercise", "Mashq")}</Table.Th>
                      <Table.Th>{t("simulator.thViolation", "Qoidabuzarlik")}</Table.Th>
                      <Table.Th>{t("simulator.thPenalty", "Jarima")}</Table.Th>
                      {replayRecording && <Table.Th>{lang === "ru" ? "Replay" : "Replay"}</Table.Th>}
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
                        {replayRecording && (
                          <Table.Td>
                            <Button
                              size="compact-xs"
                              variant="light"
                              color="cyan"
                              leftSection={<IconVideo size={12} />}
                              onClick={() => {
                                setShowReplay(true);
                                handleSeek(p.occurredAtSeconds);
                              }}
                            >
                              {lang === "ru" ? "Смотреть" : lang === "uzc" ? "Кўриш" : "Ko'rish"}
                            </Button>
                          </Table.Td>
                        )}
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Paper>
          )}

          {/* Action Buttons */}
          <Group justify="space-between" wrap="wrap" gap="xs" mt="md">
            <Button
              variant="outline"
              color="gray"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => navigate("/simulator")}
              w={{ base: "100%", sm: "auto" }}
            >
              {t("simulator.backToMenu", "Simulyator menyusiga")}
            </Button>

            <Group gap="xs" wrap="wrap" style={{ flex: 1, justifyContent: "flex-end" }}>
              {/* Retry Failed Exercise Button */}
              {!isPassed && firstFailedExNum !== null && (
                <Button
                  color="orange"
                  variant="filled"
                  leftSection={<IconRefresh size={16} />}
                  onClick={() => navigate(`/simulator/practice/${firstFailedExNum}`)}
                  w={{ base: "100%", sm: "auto" }}
                >
                  {lang === "ru"
                    ? "Отработать ошибку (Mashq)"
                    : lang === "uzc"
                    ? "Фақат хато қилинган машқни қайта ўтиш"
                    : "Faqat xato qilingan mashqni qayta o'tish"}
                </Button>
              )}

              <Button
                color="blue"
                variant="filled"
                leftSection={<IconRefresh size={16} />}
                onClick={() => navigate("/simulator/exam")}
                w={{ base: "100%", sm: "auto" }}
              >
                {t("simulator.retakeExam", "Qaytadan imtihon topshirish")}
              </Button>
            </Group>
          </Group>
        </Stack>
      </Container>
    </>
  );
}
