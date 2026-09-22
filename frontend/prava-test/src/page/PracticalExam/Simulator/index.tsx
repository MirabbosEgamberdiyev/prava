import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Container,
  Paper,
  Group,
  Stack,
  Title,
  Text,
  Badge,
  Button,
  SegmentedControl,
  ActionIcon,
  Modal,
  Table,
  SimpleGrid,
  Card,
  Progress,
  ThemeIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconVolume,
  IconVolumeOff,
  IconPlayerPlay,
  IconPlayerPause,
  IconRefresh,
  IconCheck,
  IconX,
  IconCamera,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../../context/LanguageContext";
import SEO from "../../../components/common/SEO";
import { SIMULATOR_EXERCISES } from "./constants";
import type {
  SimulatorMode,
  GearMode,
  CameraView,
  PenaltyEvent,
  VehicleTelemetry,
} from "./types";

export default function AvtodromSimulator_Page() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { t } = useTranslation();

  // Mode & Exercise state
  const [mode, setMode] = useState<SimulatorMode>("training");
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number>(0);
  const currentExercise = SIMULATOR_EXERCISES[activeExerciseIndex] || SIMULATOR_EXERCISES[0];

  // Simulation run state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [cameraView, setCameraView] = useState<CameraView>("top_down");
  const [resultModalOpen, setResultModalOpen] = useState<boolean>(false);

  // Score & Penalties
  const [penalties, setPenalties] = useState<PenaltyEvent[]>([]);
  const totalPenaltyPoints = useMemo(
    () => penalties.reduce((sum, p) => sum + p.points, 0),
    [penalties]
  );
  const isFailed = totalPenaltyPoints >= 100;

  // Vehicle Telemetry
  const [telemetry, setTelemetry] = useState<VehicleTelemetry>({
    speed: 0,
    rpm: 800,
    gear: "D",
    steeringAngle: 0,
    handbrake: false,
    throttle: 0,
    brake: 0,
    seatbeltFastened: true,
    lowBeamsOn: true,
    turnSignal: "none",
    posX: currentExercise.startX,
    posY: currentExercise.startY,
    rotation: 0,
    rollbackDistance: 0,
  });

  // Instructor message
  const [instructorMsg, setInstructorMsg] = useState<string>("");

  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const keysDownRef = useRef<Record<string, boolean>>({});

  // Localization helper
  const getLoc = useCallback(
    (obj: { uzl: string; uzc: string; ru: string }) => {
      if (lang === "ru") return obj.ru;
      if (lang === "uzc") return obj.uzc;
      return obj.uzl;
    },
    [lang]
  );

  // Audio synthesis helper
  const speakInstructor = useCallback(
    (text: string) => {
      setInstructorMsg(text);
      if (!soundEnabled) return;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === "ru" ? "ru-RU" : "uz-UZ";
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    },
    [lang, soundEnabled]
  );

  // Setup initial exercise position
  const resetToExercise = useCallback(
    (exIndex: number) => {
      const ex = SIMULATOR_EXERCISES[exIndex];
      if (!ex) return;
      setActiveExerciseIndex(exIndex);
      setTelemetry((prev) => ({
        ...prev,
        posX: ex.startX,
        posY: ex.startY,
        rotation: 0,
        speed: 0,
        rpm: 800,
        handbrake: false,
        gear: "D",
      }));
      setElapsedSeconds(0);
      setIsRunning(true);
      setIsPaused(false);
      speakInstructor(getLoc(ex.instructorGuide));
    },
    [getLoc, speakInstructor]
  );

  // Add penalty helper
  const triggerPenalty = useCallback(
    (code: string, points: number, titleObj: { uzl: string; uzc: string; ru: string }) => {
      const newPenalty: PenaltyEvent = {
        id: Math.random().toString(36).substring(2, 9),
        exerciseNumber: currentExercise.number,
        code,
        points,
        title: titleObj,
        timestampSeconds: elapsedSeconds,
      };

      setPenalties((prev) => {
        const next = [...prev, newPenalty];
        const nextTotal = next.reduce((sum, p) => sum + p.points, 0);
        if (nextTotal >= 100 && mode === "exam") {
          setIsRunning(false);
          setResultModalOpen(true);
          speakInstructor(
            lang === "ru"
              ? "Экзамен не сдан! Набрано 100 штрафных баллов."
              : lang === "uzc"
              ? "Имтиҳон топширилмади! 100 жарима балли тўпланди."
              : "Imtihon topshirilmadi! 100 jarima balli to'plandi."
          );
        } else {
          speakInstructor(
            `${getLoc(titleObj)}. +${points} ${t("curriculum.ball", "ball")}`
          );
        }
        return next;
      });
    },
    [currentExercise.number, elapsedSeconds, getLoc, lang, mode, speakInstructor, t]
  );

  // Handle keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysDownRef.current[e.key.toLowerCase()] = true;

      // Quick Gear toggle
      if (e.key === "p" || e.key === "P") setTelemetry((prev) => ({ ...prev, gear: "P", speed: 0 }));
      if (e.key === "r" || e.key === "R") setTelemetry((prev) => ({ ...prev, gear: "R" }));
      if (e.key === "n" || e.key === "N") setTelemetry((prev) => ({ ...prev, gear: "N" }));
      if (e.key === "d" || e.key === "D") setTelemetry((prev) => ({ ...prev, gear: "D" }));

      // Handbrake
      if (e.code === "Space") {
        e.preventDefault();
        setTelemetry((prev) => ({ ...prev, handbrake: !prev.handbrake }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDownRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Timer loop
  useEffect(() => {
    if (!isRunning || isPaused) return;
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, isPaused]);

  // Main Canvas Render & Physics Loop (60 FPS)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let localPosX = telemetry.posX;
    let localPosY = telemetry.posY;
    let localRotation = telemetry.rotation;
    let localSpeed = telemetry.speed;

    const renderLoop = () => {
      if (isRunning && !isPaused) {
        const keys = keysDownRef.current;

        // Throttle / Brake
        let accel = 0;
        if (keys["w"] || keys["arrowup"]) accel += 0.35;
        if (keys["s"] || keys["arrowdown"]) accel -= 0.45;

        // Steering
        let steer = 0;
        if (keys["a"] || keys["arrowleft"]) steer -= 0.045;
        if (keys["d"] || keys["arrowright"]) steer += 0.045;

        if (telemetry.handbrake) {
          localSpeed *= 0.85;
        } else {
          localSpeed += accel;
          // Gear factor
          if (telemetry.gear === "R") {
            localSpeed = Math.max(-15, Math.min(0, localSpeed));
          } else if (telemetry.gear === "D") {
            localSpeed = Math.max(0, Math.min(35, localSpeed));
          } else {
            // N or P
            localSpeed *= 0.95;
          }
        }

        // Apply friction
        localSpeed *= 0.97;
        if (Math.abs(localSpeed) < 0.05) localSpeed = 0;

        // Rotate vehicle
        if (Math.abs(localSpeed) > 0.1) {
          localRotation += steer * (localSpeed > 0 ? 1 : -1);
        }

        // Move vehicle
        const speedKmh = localSpeed;
        const moveDist = (speedKmh * 0.08);
        localPosX += Math.cos(localRotation) * moveDist;
        localPosY += Math.sin(localRotation) * moveDist;

        // Bounds check (Autodrome area: 30 to 570 in X, 30 to 470 in Y)
        if (localPosX < 25 || localPosX > 575 || localPosY < 25 || localPosY > 475) {
          localSpeed = -localSpeed * 0.4;
          localPosX = Math.max(30, Math.min(570, localPosX));
          localPosY = Math.max(30, Math.min(470, localPosY));
          triggerPenalty("1.1.3", 25, {
            uzl: "Belgilangan hududdan tashqariga chiqish",
            uzc: "Белгиланган ҳудуддан ташқарига чиқиш",
            ru: "Выезд за пределы установленной границы упражнения",
          });
        }

        setTelemetry((prev) => ({
          ...prev,
          posX: localPosX,
          posY: localPosY,
          rotation: localRotation,
          speed: Math.round(Math.abs(localSpeed)),
          rpm: Math.round(800 + Math.abs(localSpeed) * 80),
          steeringAngle: Math.round(steer * 700),
        }));
      }

      // Clear Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Autodrome Ground (Asphalt)
      ctx.fillStyle = "#2c3e50";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Track Perimeter Border
      ctx.strokeStyle = "#e74c3c";
      ctx.lineWidth = 6;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

      // 2. Draw Track Lanes & Exercise Markings
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      // Horizontal lane guide
      ctx.beginPath();
      ctx.moveTo(30, 450);
      ctx.lineTo(350, 450);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw 12 Exercise Waypoints & Zones
      SIMULATOR_EXERCISES.forEach((ex, idx) => {
        const isActive = idx === activeExerciseIndex;
        // Exercise Zone Box
        ctx.fillStyle = isActive ? "rgba(52, 152, 219, 0.25)" : "rgba(255, 255, 255, 0.05)";
        ctx.strokeStyle = isActive ? "#3498db" : "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = isActive ? 2 : 1;
        const w = ex.sensorZone.maxX - ex.sensorZone.minX;
        const h = ex.sensorZone.maxY - ex.sensorZone.minY;
        ctx.fillRect(ex.sensorZone.minX, ex.sensorZone.minY, w, h);
        ctx.strokeRect(ex.sensorZone.minX, ex.sensorZone.minY, w, h);

        // Exercise Number Label
        ctx.fillStyle = isActive ? "#f39c12" : "#bdc3c7";
        ctx.font = "bold 11px system-ui";
        ctx.fillText(`${ex.number}`, ex.startX, ex.startY - 15);
      });

      // 3. Draw Cones (Obstacles)
      const cones = [
        { x: 450, y: 300 },
        { x: 470, y: 280 },
        { x: 490, y: 260 },
        { x: 510, y: 240 },
        { x: 420, y: 100 },
        { x: 420, y: 80 },
      ];
      cones.forEach((c) => {
        ctx.fillStyle = "#e67e22";
        ctx.beginPath();
        ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // 4. Draw Vehicle (Chevrolet Cobalt Representation)
      ctx.save();
      ctx.translate(localPosX, localPosY);
      ctx.rotate(localRotation);

      // Chassis shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.fillRect(-18, -10, 36, 20);

      // Vehicle Body (Cobalt Blue)
      ctx.fillStyle = "#1e3799";
      ctx.beginPath();
      ctx.roundRect(-16, -9, 32, 18, 4);
      ctx.fill();
      ctx.strokeStyle = "#4a69bd";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Windshield & Windows
      ctx.fillStyle = "#dff9fb";
      ctx.fillRect(-4, -7, 12, 14);

      // Headlights (Yellow beams if on)
      if (telemetry.lowBeamsOn) {
        ctx.fillStyle = "rgba(246, 229, 141, 0.8)";
        ctx.fillRect(14, -8, 3, 4);
        ctx.fillRect(14, 4, 3, 4);
      }

      // Taillights (Red)
      ctx.fillStyle = telemetry.brake > 0 ? "#ff3838" : "#c0392b";
      ctx.fillRect(-17, -8, 2, 4);
      ctx.fillRect(-17, 4, 2, 4);

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [activeExerciseIndex, isPaused, isRunning, telemetry.brake, telemetry.gear, telemetry.handbrake, telemetry.lowBeamsOn, telemetry.posX, telemetry.posY, telemetry.rotation, telemetry.speed]);

  // Initial instruction
  useEffect(() => {
    speakInstructor(getLoc(currentExercise.instructorGuide));
  }, [currentExercise, getLoc, speakInstructor]);

  return (
    <>
      <SEO
        title={t("curriculum.simulatorTitle", "Avtodrom 3D Simulyatori") + " | PravaOnline"}
        description={t("curriculum.simulatorDesc", "12 ta amaliy mashq bo'yicha interaktiv 3D simulyator")}
      />

      <Container size="xl" py="md">
        <Stack gap="md">
          {/* Header Bar */}
          <Paper p="sm" radius="md" withBorder>
            <Group justify="space-between" align="center" wrap="wrap">
              <Group gap="sm">
                <Button
                  variant="subtle"
                  color="gray"
                  size="xs"
                  leftSection={<IconArrowLeft size={16} />}
                  onClick={() => navigate("/practical-exam")}
                >
                  {t("common.back", "Orqaga")}
                </Button>
                <Title order={4} fw={700}>
                  {t("curriculum.simulatorTitle", "Avtodrom 3D Simulyatori")}
                </Title>
                <Badge color={mode === "exam" ? "orange" : mode === "practice" ? "cyan" : "blue"} variant="filled">
                  {mode.toUpperCase()}
                </Badge>
              </Group>

              <Group gap="xs">
                <SegmentedControl
                  size="xs"
                  value={mode}
                  onChange={(val) => {
                    setMode(val as SimulatorMode);
                    resetToExercise(0);
                  }}
                  data={[
                    { label: "Training", value: "training" },
                    { label: "Practice", value: "practice" },
                    { label: "Exam (100 ball)", value: "exam" },
                  ]}
                />

                <Tooltip label={soundEnabled ? "Ovozni o'chirish" : "Ovozni yoqish"}>
                  <ActionIcon
                    variant="light"
                    color={soundEnabled ? "blue" : "gray"}
                    onClick={() => setSoundEnabled(!soundEnabled)}
                  >
                    {soundEnabled ? <IconVolume size={18} /> : <IconVolumeOff size={18} />}
                  </ActionIcon>
                </Tooltip>

                <Tooltip label="Kamera ko'rinishi">
                  <ActionIcon
                    variant="light"
                    color="gray"
                    onClick={() => {
                      setCameraView(
                        cameraView === "top_down"
                          ? "chase"
                          : cameraView === "chase"
                          ? "first_person"
                          : "top_down"
                      );
                    }}
                  >
                    <IconCamera size={18} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>
          </Paper>

          {/* Telemetry & Exercise Info Bar */}
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
            <Paper p="xs" radius="sm" withBorder ta="center">
              <Text size="xs" c="dimmed">Joriy Mashq ({activeExerciseIndex + 1}/12)</Text>
              <Text fw={700} size="sm" lineClamp={1}>
                {getLoc(currentExercise.title)}
              </Text>
            </Paper>

            <Paper p="xs" radius="sm" withBorder ta="center">
              <Text size="xs" c="dimmed">Vaqt</Text>
              <Text fw={700} size="sm">
                {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, "0")}
              </Text>
            </Paper>

            <Paper p="xs" radius="sm" withBorder ta="center">
              <Text size="xs" c="dimmed">Jarima Ballari</Text>
              <Group justify="center" gap={4}>
                <Text fw={700} size="sm" c={totalPenaltyPoints >= 100 ? "red" : totalPenaltyPoints > 0 ? "orange" : "green"}>
                  {totalPenaltyPoints} / 100
                </Text>
              </Group>
            </Paper>

            <Paper p="xs" radius="sm" withBorder ta="center">
              <Text size="xs" c="dimmed">Uzatma & Spidometr</Text>
              <Text fw={700} size="sm" c="blue">
                [{telemetry.gear}] {telemetry.speed} km/h
              </Text>
            </Paper>
          </SimpleGrid>

          {/* Audio Instructor Speech Bar */}
          {instructorMsg && (
            <Paper
              p="xs"
              radius="sm"
              withBorder
              style={{
                backgroundColor: "rgba(24, 100, 171, 0.08)",
                borderColor: "rgba(24, 100, 171, 0.25)",
              }}
            >
              <Group gap="xs">
                <ThemeIcon size="sm" color="blue" variant="filled">
                  <IconVolume size={14} />
                </ThemeIcon>
                <Text size="sm" fw={500}>
                  {instructorMsg}
                </Text>
              </Group>
            </Paper>
          )}

          {/* Main 3D/2D Interactive Canvas */}
          <Paper
            p={0}
            radius="md"
            withBorder
            style={{
              position: "relative",
              overflow: "hidden",
              backgroundColor: "#1e272e",
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            }}
          >
            <canvas
              ref={canvasRef}
              width={600}
              height={500}
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "520px",
                display: "block",
                cursor: "crosshair",
              }}
            />

            {/* Over-Canvas Floating Controls */}
            <Group
              gap="xs"
              style={{
                position: "absolute",
                bottom: 12,
                left: 12,
                zIndex: 10,
                backgroundColor: "rgba(0,0,0,0.65)",
                padding: "6px 12px",
                borderRadius: "8px",
              }}
            >
              <Button
                size="xs"
                variant={isRunning && !isPaused ? "filled" : "light"}
                color={isRunning && !isPaused ? "yellow" : "green"}
                leftSection={isRunning && !isPaused ? <IconPlayerPause size={14} /> : <IconPlayerPlay size={14} />}
                onClick={() => {
                  if (!isRunning) setIsRunning(true);
                  else setIsPaused(!isPaused);
                }}
              >
                {!isRunning ? "Boshlash" : isPaused ? "Davom ettirish" : "Pauza"}
              </Button>

              <Button
                size="xs"
                variant="subtle"
                color="gray"
                leftSection={<IconRefresh size={14} />}
                onClick={() => resetToExercise(activeExerciseIndex)}
              >
                Qayta qo'yish
              </Button>
            </Group>

            {/* Quick Gear Box Toggle */}
            <Group
              gap={4}
              style={{
                position: "absolute",
                bottom: 12,
                right: 12,
                zIndex: 10,
                backgroundColor: "rgba(0,0,0,0.75)",
                padding: "4px 8px",
                borderRadius: "8px",
              }}
            >
              {(["P", "R", "N", "D"] as GearMode[]).map((g) => (
                <Button
                  key={g}
                  size="compact-xs"
                  variant={telemetry.gear === g ? "filled" : "subtle"}
                  color={telemetry.gear === g ? "blue" : "gray"}
                  onClick={() => setTelemetry((prev) => ({ ...prev, gear: g }))}
                >
                  {g}
                </Button>
              ))}
              <Button
                size="compact-xs"
                variant={telemetry.handbrake ? "filled" : "outline"}
                color={telemetry.handbrake ? "red" : "gray"}
                onClick={() => setTelemetry((prev) => ({ ...prev, handbrake: !prev.handbrake }))}
              >
                (P) Ruchnik
              </Button>
            </Group>
          </Paper>

          {/* Exercise Selector Bar (1 to 12) */}
          <Paper p="xs" radius="sm" withBorder>
            <Group justify="space-between" align="center" mb={6}>
              <Text size="xs" fw={600} c="dimmed">
                Mashqni tanlash (Davlat YHXX standarti):
              </Text>
              {mode !== "exam" && (
                <Text size="xs" c="blue" style={{ cursor: "pointer" }} onClick={() => setResultModalOpen(true)}>
                  Natijalar jadvalini ko'rish
                </Text>
              )}
            </Group>
            <Group gap={6} wrap="wrap">
              {SIMULATOR_EXERCISES.map((ex, idx) => {
                const isActive = idx === activeExerciseIndex;
                return (
                  <Button
                    key={ex.number}
                    size="xs"
                    variant={isActive ? "filled" : "light"}
                    color={isActive ? "blue" : "gray"}
                    onClick={() => resetToExercise(idx)}
                  >
                    {ex.number}. {getLoc(ex.title).split(".")[1] || getLoc(ex.title)}
                  </Button>
                );
              })}
            </Group>
          </Paper>

          {/* Keyboard Controls Legend */}
          <Paper p="sm" radius="sm" withBorder bg="var(--surface)">
            <Text size="xs" fw={600} c="dimmed" mb="xs">
              Klaviatura orqali tezkor boshqaruv:
            </Text>
            <SimpleGrid cols={{ base: 2, sm: 5 }} spacing="xs">
              <Text size="xs">
                <Badge size="xs" variant="outline">W / ↑</Badge> Gaz (Tezlanish)
              </Text>
              <Text size="xs">
                <Badge size="xs" variant="outline">S / ↓</Badge> Tormoz / Orqaga
              </Text>
              <Text size="xs">
                <Badge size="xs" variant="outline">A / D</Badge> Rulni burish
              </Text>
              <Text size="xs">
                <Badge size="xs" variant="outline">SPACE</Badge> Qo'l tormozi (Ruchnik)
              </Text>
              <Text size="xs">
                <Badge size="xs" variant="outline">P / R / N / D</Badge> Uzatmalar
              </Text>
            </SimpleGrid>
          </Paper>
        </Stack>
      </Container>

      {/* Detailed Result Modal with 'Retry Failed Exercise' button */}
      <Modal
        opened={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        title={
          <Group gap="xs">
            <ThemeIcon color={isFailed ? "red" : "green"} size="lg" radius="md">
              {isFailed ? <IconX size={20} /> : <IconCheck size={20} />}
            </ThemeIcon>
            <div>
              <Text fw={700} size="md">
                {isFailed ? "Imtihon Topshirilmadi" : "Imtihon Muvaffaqiyatli Topshirildi!"}
              </Text>
              <Text size="xs" c="dimmed">
                {totalPenaltyPoints} jarima balli • {Math.floor(elapsedSeconds / 60)} daqiqa
              </Text>
            </div>
          </Group>
        }
        size="lg"
        radius="md"
      >
        <Stack gap="md">
          <Card withBorder padding="md" radius="md">
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={600}>Umumiy Jarima Ballari:</Text>
              <Badge size="lg" color={isFailed ? "red" : "green"}>
                {totalPenaltyPoints} / 100 ball
              </Badge>
            </Group>
            <Progress value={Math.min(100, totalPenaltyPoints)} color={isFailed ? "red" : "orange"} size="lg" radius="xl" />
          </Card>

          {penalties.length === 0 ? (
            <Paper p="md" radius="sm" withBorder ta="center">
              <Text size="sm" c="green" fw={600}>
                Ajoyib! Hech qanday jarima ballari olinmadi.
              </Text>
            </Paper>
          ) : (
            <Paper withBorder radius="md" p="xs">
              <Text size="xs" fw={700} mb="xs" c="dimmed">
                Qayd etilgan xatolar ro'yxati:
              </Text>
              <Table striped highlightOnHover verticalSpacing="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>№</Table.Th>
                    <Table.Th>Mashq</Table.Th>
                    <Table.Th>Qoidabuzarlik</Table.Th>
                    <Table.Th>Ball</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {penalties.map((p, i) => (
                    <Table.Tr key={p.id}>
                      <Table.Td>{i + 1}</Table.Td>
                      <Table.Td>{p.exerciseNumber}-mashq</Table.Td>
                      <Table.Td>{getLoc(p.title)}</Table.Td>
                      <Table.Td>
                        <Badge color="red" size="sm">+{p.points}</Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          )}

          <Group justify="space-between" mt="sm">
            <Button
              variant="outline"
              color="gray"
              onClick={() => {
                setResultModalOpen(false);
                navigate("/practical-exam");
              }}
            >
              Amaliy imtihonga qaytish
            </Button>

            <Group gap="xs">
              {isFailed && penalties.length > 0 && (
                <Button
                  color="orange"
                  leftSection={<IconRefresh size={16} />}
                  onClick={() => {
                    // Jump directly to the first failed exercise
                    const firstFailedExNum = penalties[0].exerciseNumber;
                    const idx = SIMULATOR_EXERCISES.findIndex((e) => e.number === firstFailedExNum);
                    setResultModalOpen(false);
                    setPenalties([]);
                    resetToExercise(idx >= 0 ? idx : 0);
                  }}
                >
                  Faqat xato qilingan mashqni qayta o'tish
                </Button>
              )}

              <Button
                color="blue"
                leftSection={<IconRefresh size={16} />}
                onClick={() => {
                  setResultModalOpen(false);
                  setPenalties([]);
                  resetToExercise(0);
                }}
              >
                Qaytadan boshlash
              </Button>
            </Group>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
