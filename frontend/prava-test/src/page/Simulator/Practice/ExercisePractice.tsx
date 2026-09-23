import { useState, useEffect, useRef, useCallback } from "react";
import {
  Container,
  Paper,
  Group,
  Stack,
  Text,
  Badge,
  Button,
  Modal,
  Table,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconRefresh,
  IconCheck,
  IconTrophy,
} from "@tabler/icons-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../../context/LanguageContext";
import SEO from "../../../components/common/SEO";
import { EXERCISE_REGISTRY } from "../registry/exerciseRegistry";
import { SimulationController, type SimulationInput } from "../engine/SimulationController";
import SimulatorCanvas3D from "../components/SimulatorCanvas3D";
import HUDOverlay from "../components/HUDOverlay";
import VoiceInstructor from "../components/VoiceInstructor";
import AIInstructorOverlay from "../components/AIInstructorOverlay";
import WebGLFallback, { isWebGLAvailable } from "../components/WebGLFallback";
import type { VehicleTelemetry, CameraView, GearMode, PenaltyEvent, AIInstructorFeedback } from "../types";

export default function ExercisePractice_Page() {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { t } = useTranslation();

  const exNum = parseInt(exerciseId || "1", 10);
  const exercise = EXERCISE_REGISTRY.find((e) => e.number === exNum) || EXERCISE_REGISTRY[0];

  const [attemptCount, setAttemptCount] = useState<number>(1);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [cameraView, setCameraView] = useState<CameraView>("chase");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [penalties, setPenalties] = useState<PenaltyEvent[]>([]);
  const [instructorMsg, setInstructorMsg] = useState<string>("");
  const [aiFeedback, setAiFeedback] = useState<AIInstructorFeedback | null>(null);
  const [attemptFinishedModal, setAttemptFinishedModal] = useState<boolean>(false);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFs);
    return () => document.removeEventListener("fullscreenchange", handleFs);
  }, []);

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
    posX: exercise.startX,
    posY: exercise.startY,
    rotation: exercise.startRotation,
    rollbackDistance: 0,
  });

  const keysDownRef = useRef<Record<string, boolean>>({});
  const animFrameRef = useRef<number | null>(null);
  const controllerRef = useRef<SimulationController | null>(null);

  const getLoc = useCallback(
    (obj: { uzl: string; uzc: string; ru: string }) => {
      if (lang === "ru") return obj.ru;
      if (lang === "uzc") return obj.uzc;
      return obj.uzl;
    },
    [lang]
  );

  // Restart attempt
  const restartAttempt = useCallback(() => {
    setPenalties([]);
    setElapsedSeconds(0);
    setAttemptCount((c) => c + 1);
    setInstructorMsg(getLoc(exercise.instructorGuide));

    if (controllerRef.current) {
      controllerRef.current.setExercise(exercise);
    }
  }, [exercise, getLoc]);

  // Controller setup
  useEffect(() => {
    setWebglSupported(isWebGLAvailable());

    const ctrl = new SimulationController(
      exercise,
      "Chevrolet Cobalt",
      {
        onTelemetryUpdate: (telem) => setTelemetry(telem),
        onStationCompleted: () => {
          setAttemptFinishedModal(true);
          setBestScore((b) => {
            const currentPoints = penalties.reduce((sum, p) => sum + p.points, 0);
            return b === null ? currentPoints : Math.min(b, currentPoints);
          });
          setInstructorMsg(
            lang === "ru"
              ? "Отлично! Упражнение выполнено."
              : lang === "uzc"
              ? "Ажойиб! Машқ бажарилди."
              : "Ajoyib! Mashq bajarildi."
          );
        },
        onPenaltyTriggered: (pen) => {
          setPenalties((prev) => [...prev, pen]);
          setInstructorMsg(
            lang === "ru"
              ? "Зафиксировано нарушение!"
              : lang === "uzc"
              ? "Қоидабузарлик қайд этилди!"
              : "Qoidabuzarlik qayd etildi!"
          );
        },
        onVoiceAnnounce: (msg) => {
          setInstructorMsg(msg);
        },
        onAIInstructorFeedback: (fb) => {
          setAiFeedback(fb);
        },
      },
      lang
    );

    controllerRef.current = ctrl;
    setInstructorMsg(getLoc(exercise.instructorGuide));
  }, [exercise, getLoc, lang, penalties]);

  // Synchronize language changes
  useEffect(() => {
    if (controllerRef.current) {
      controllerRef.current.setLanguage(lang);
    }
  }, [lang]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysDownRef.current[e.key.toLowerCase()] = true;
      if (e.key === "p" || e.key === "P") controllerRef.current?.setGear("P");
      if (e.key === "r" || e.key === "R") controllerRef.current?.setGear("R");
      if (e.key === "n" || e.key === "N") controllerRef.current?.setGear("N");
      if (e.key === "d" || e.key === "D") controllerRef.current?.setGear("D");
      if (e.code === "Space") {
        e.preventDefault();
        controllerRef.current?.toggleHandbrake();
      }
      if (e.key === "b" || e.key === "B") {
        controllerRef.current?.toggleSeatbelt();
      }
      if (e.key === "l" || e.key === "L") {
        controllerRef.current?.toggleLights();
      }
      if (e.key === "i" || e.key === "I") {
        controllerRef.current?.toggleEngine();
      }
      if (e.key === "q" || e.key === "Q") {
        controllerRef.current?.toggleTurnSignal("left");
      }
      if (e.key === "e" || e.key === "E") {
        controllerRef.current?.toggleTurnSignal("right");
      }
      if (e.key === "h" || e.key === "H") {
        controllerRef.current?.toggleTurnSignal("hazard");
      }
      if (e.key === "v" || e.key === "V") {
        setCameraView((prev) =>
          prev === "chase" ? "first_person" : prev === "first_person" ? "top_down" : "chase"
        );
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
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Physics Loop (60 FPS)
  useEffect(() => {
    const loop = () => {
      const keys = keysDownRef.current;
      let throttle = 0;
      let brake = 0;
      let steer = 0;
      let clutch = 0;

      if (keys["w"] || keys["arrowup"]) throttle = 1.0;
      if (keys["s"] || keys["arrowdown"]) brake = 1.0;
      if (keys["a"] || keys["arrowleft"]) steer = -1.0;
      if (keys["d"] || keys["arrowright"]) steer = 1.0;
      if (keys["c"]) clutch = 1.0;

      const input: SimulationInput = {
        throttle,
        brake,
        steer,
        clutch,
        handbrake: telemetry.handbrake,
      };

      if (controllerRef.current) {
        controllerRef.current.update(input, 0.016, elapsedSeconds);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [elapsedSeconds, telemetry.handbrake]);

  const totalPenalties = penalties.reduce((sum, p) => sum + p.points, 0);

  return (
    <>
      <SEO
        title={`${getLoc(exercise.title)} | ${lang === "ru" ? "Тренировка" : lang === "uzc" ? "Машқ қилиш" : "Mashq qilish"} | PravaOnline`}
        description={getLoc(exercise.description)}
      />

      <Container size="xl" maw={1800} py="xs" px={{ base: "xs", sm: "sm" }}>
        <Stack gap="xs">
          {/* Header Bar */}
          <Group justify="space-between" align="center" wrap="wrap" gap="xs">
            <Button
              variant="subtle"
              color="gray"
              size="xs"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => navigate("/simulator/practice")}
            >
              {t("simulator.toExerciseList", "Barcha mashqlar")}
            </Button>

            <Group gap="xs" wrap="wrap">
              <Badge color="cyan" size="md" variant="filled">
                {t("simulator.practiceAttempt", { count: attemptCount, defaultValue: `${attemptCount}-urinish` })}
              </Badge>
              {bestScore !== null && (
                <Badge color="green" size="md" variant="light" leftSection={<IconTrophy size={14} />}>
                  {t("simulator.bestScore", { score: bestScore, defaultValue: `Eng yaxshi: ${bestScore} ball` })}
                </Badge>
              )}
            </Group>
          </Group>

          {/* Real-time AI Instructor Guidance Overlay */}
          <AIInstructorOverlay feedback={aiFeedback} />

          {/* Instructor Voice Box */}
          <VoiceInstructor message={instructorMsg} soundEnabled={soundEnabled} />

          {/* Main 3D Canvas */}
          {!webglSupported ? (
            <WebGLFallback onRetry={() => setWebglSupported(isWebGLAvailable())} />
          ) : (
            <Paper
              radius={isFullscreen ? 0 : "lg"}
              withBorder={!isFullscreen}
              style={{
                position: "relative",
                overflow: "hidden",
                height: isFullscreen ? "100vh" : "clamp(350px, 64vh, 720px)",
                minHeight: isFullscreen ? "100vh" : "340px",
                maxHeight: isFullscreen ? "100vh" : undefined,
                width: isFullscreen ? "100vw" : "100%",
                borderRadius: isFullscreen ? 0 : undefined,
                border: isFullscreen ? "none" : undefined,
                backgroundColor: "#1a252f",
              }}
            >
              <SimulatorCanvas3D
                telemetry={telemetry}
                exercise={exercise}
                cameraView={cameraView}
                showHelpers={true}
                idealTrajectory={exercise.helperPath}
                category="B"
                modelName="Chevrolet Cobalt"
              />

              <HUDOverlay
                telemetry={telemetry}
                exercise={exercise}
                elapsedSeconds={elapsedSeconds}
                totalPenalties={totalPenalties}
                maxPenaltyAllowed={20}
                cameraView={cameraView}
                soundEnabled={soundEnabled}
                onCameraToggle={() =>
                  setCameraView((prev) =>
                    prev === "chase"
                      ? "first_person"
                      : prev === "first_person"
                      ? "rear"
                      : prev === "rear"
                      ? "top_down"
                      : prev === "top_down"
                      ? "free"
                      : "chase"
                  )
                }
                onSoundToggle={() => setSoundEnabled(!soundEnabled)}
                onGearSelect={(g: GearMode) => controllerRef.current?.setGear(g)}
                onHandbrakeToggle={() => controllerRef.current?.toggleHandbrake()}
                onSeatbeltToggle={() => controllerRef.current?.toggleSeatbelt()}
                onLightsToggle={() => controllerRef.current?.toggleLights()}
                onTurnSignalToggle={(sig) => controllerRef.current?.toggleTurnSignal(sig)}
                onNextExercise={() => setAttemptFinishedModal(true)}
                onThrottleChange={(val) => {
                  keysDownRef.current["w"] = val > 0;
                }}
                onBrakeChange={(val) => {
                  keysDownRef.current["s"] = val > 0;
                }}
                onSteerChange={(val) => {
                  keysDownRef.current["a"] = val < -0.05;
                  keysDownRef.current["d"] = val > 0.05;
                }}
                onClutchChange={(val) => {
                  controllerRef.current?.setClutch(val);
                  setTelemetry((prev) => ({ ...prev, clutch: val }));
                }}
                onManualGearSelect={(g) => {
                  controllerRef.current?.setManualGear(g);
                  setTelemetry((prev) => ({ ...prev, manualGear: g }));
                }}
                showClutch={telemetry.transmissionMode === "manual"}
              />
            </Paper>
          )}

          {/* Quick Actions */}
          <Paper p="xs" radius="md" withBorder>
            <Group justify="space-between" align="center">
              <Text size="xs" fw={700} c="dimmed">
                {exercise.number}-mashq: {getLoc(exercise.title)}
              </Text>
              <Button
                size="xs"
                variant="light"
                color="orange"
                leftSection={<IconRefresh size={14} />}
                onClick={restartAttempt}
              >
                {t("simulator.retryAttempt", "Qaytadan urinish")}
              </Button>
            </Group>
          </Paper>
        </Stack>
      </Container>

      {/* Attempt Finished Modal */}
      <Modal
        opened={attemptFinishedModal}
        onClose={() => setAttemptFinishedModal(false)}
        title={
          <Group gap="xs">
            <IconCheck size={22} color="#2ecc71" />
            <Text fw={700}>
              {t("simulator.attemptDone", "Urinish yakunlandi!")}
            </Text>
          </Group>
        }
        radius="md"
        size="md"
      >
        <Stack gap="md">
          <Group justify="space-between">
            <Text size="sm">{t("simulator.penaltyPoints", "Jarima ballari:")}</Text>
            <Badge color={totalPenalties === 0 ? "green" : "red"} size="lg">
              {totalPenalties} {t("simulator.pointsUnit", "ball")}
            </Badge>
          </Group>
          <Group justify="space-between">
            <Text size="sm">{t("simulator.elapsedTime", "Sarflangan vaqt:")}</Text>
            <Text fw={700} size="sm">
              {elapsedSeconds} {t("simulator.secondsUnit", "soniya")}
            </Text>
          </Group>

          {penalties.length > 0 && (
            <Paper withBorder p="xs" radius="sm">
              <Text size="xs" fw={700} c="dimmed" mb="xs">
                {t("simulator.attemptErrors", "Ushbu urinishdagi xatolar:")}
              </Text>
              <Table striped highlightOnHover verticalSpacing="xs">
                <Table.Tbody>
                  {penalties.map((p) => (
                    <Table.Tr key={p.id}>
                      <Table.Td style={{ fontSize: "12px" }}>{getLoc(p.title)}</Table.Td>
                      <Table.Td>
                        <Badge size="xs" color="red">+{p.points}</Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          )}

          <Group justify="space-between" mt="md">
            <Button
              variant="outline"
              color="gray"
              onClick={() => {
                setAttemptFinishedModal(false);
                navigate("/simulator/practice");
              }}
            >
              {t("simulator.toExerciseList", "Mashqlar ro'yxatiga")}
            </Button>
            <Button
              color="cyan"
              leftSection={<IconRefresh size={16} />}
              onClick={() => {
                setAttemptFinishedModal(false);
                restartAttempt();
              }}
            >
              {t("simulator.anotherAttempt", "Yana urinish")}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
