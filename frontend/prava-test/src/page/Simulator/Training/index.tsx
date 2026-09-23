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
} from "@mantine/core";
import {
  IconArrowLeft,
  IconRefresh,
  IconCheck,
  IconArrowRight,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../../context/LanguageContext";
import SEO from "../../../components/common/SEO";
import { EXERCISE_REGISTRY } from "../registry/exerciseRegistry";
import { SimulationController, type SimulationInput } from "../engine/SimulationController";
import SimulatorCanvas3D from "../components/SimulatorCanvas3D";
import HUDOverlay from "../components/HUDOverlay";
import VoiceInstructor from "../components/VoiceInstructor";
import AIInstructorOverlay from "../components/AIInstructorOverlay";
import TrainingHelpers from "../components/TrainingHelpers";
import WebGLFallback, { isWebGLAvailable } from "../components/WebGLFallback";
import type { VehicleTelemetry, CameraView, GearMode, AIInstructorFeedback } from "../types";

export default function SimulatorTraining_Page() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { t } = useTranslation();

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
  const exercise = EXERCISE_REGISTRY[currentExerciseIndex] || EXERCISE_REGISTRY[0];

  const [cameraView, setCameraView] = useState<CameraView>("chase");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [instructorMsg, setInstructorMsg] = useState<string>("");
  const [aiFeedback, setAiFeedback] = useState<AIInstructorFeedback | null>(null);
  const [completedModalOpen, setCompletedModalOpen] = useState<boolean>(false);
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
    turnSignal: "left",
    posX: exercise.startX,
    posY: exercise.startY,
    rotation: exercise.startRotation,
    rollbackDistance: 0,
  });

  const keysDownRef = useRef<Record<string, boolean>>({});
  const animFrameRef = useRef<number | null>(null);
  const controllerRef = useRef<SimulationController | null>(null);

  // Check WebGL availability
  useEffect(() => {
    setWebglSupported(isWebGLAvailable());
  }, []);

  const getLoc = useCallback(
    (obj: { uzl: string; uzc: string; ru: string }) => {
      if (lang === "ru") return obj.ru;
      if (lang === "uzc") return obj.uzc;
      return obj.uzl;
    },
    [lang]
  );

  // Reset to current exercise
  const resetExercise = useCallback((idx: number) => {
    const ex = EXERCISE_REGISTRY[idx];
    if (!ex) return;
    setCurrentExerciseIndex(idx);
    setElapsedSeconds(0);
    setInstructorMsg(getLoc(ex.instructorGuide));

    if (controllerRef.current) {
      controllerRef.current.setExercise(ex);
    }
  }, [getLoc]);

  // Initial Controller setup
  useEffect(() => {
    const ctrl = new SimulationController(
      exercise,
      "Chevrolet Cobalt",
      {
        onTelemetryUpdate: (telem) => setTelemetry(telem),
        onStationCompleted: () => {
          setCompletedModalOpen(true);
          setInstructorMsg(
            lang === "ru"
              ? "Отлично! Упражнение успешно выполнено."
              : lang === "uzc"
              ? "Ажойиб! Машқ муваффақиятли бажарилди."
              : "Ajoyib! Mashq muvaffaqiyatli bajarildi."
          );
        },
        onPenaltyTriggered: () => {
          setInstructorMsg(
            lang === "ru"
              ? "Внимание! Вы задели разметку или конус. Попробуйте еще раз."
              : lang === "uzc"
              ? "Диққат! Сиз чизиқ ёки конусни босдингиз. Қайта уриниб кўринг."
              : "Diqqat! Siz chiziq yoki konusni bosdingiz. Qayta urinib ko'ring."
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
  }, [exercise, getLoc, lang]);

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

  // Physics Loop (60 FPS) via SimulationController
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

  return (
    <>
      <SEO
        title={`${lang === "ru" ? "Обучение" : lang === "uzc" ? "Ўрганиш" : "O'rganish"} | ${getLoc(exercise.title)} | PravaOnline`}
        description={getLoc(exercise.description)}
      />

      <Container size="xl" maw={1800} py="xs" px={{ base: "xs", sm: "sm" }}>
        <Stack gap="xs">
          {/* Top Navigation */}
          <Group justify="space-between" align="center" wrap="wrap" gap="xs">
            <Button
              variant="subtle"
              color="gray"
              size="xs"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => navigate("/simulator")}
            >
              {t("simulator.trainingPanel", "Simulyator paneli")}
            </Button>
            <Badge color="blue" size="md" variant="filled">
              {t("simulator.trainingMode", "O'RGANISH REJIMI")}
            </Badge>
          </Group>

          {/* Real-time AI Instructor Guidance Overlay */}
          <AIInstructorOverlay feedback={aiFeedback} />

          {/* Voice Instructor Box */}
          <VoiceInstructor message={instructorMsg} soundEnabled={soundEnabled} />

          {/* Training Guidance Helpers */}
          <TrainingHelpers telemetry={telemetry} exercise={exercise} />

          {/* Main 3D Canvas / Fallback */}
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
                totalPenalties={0}
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
                onNextExercise={() => resetExercise((currentExerciseIndex + 1) % EXERCISE_REGISTRY.length)}
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

          {/* Bottom Exercise Switcher */}
          <Paper p="xs" radius="md" withBorder>
            <Group justify="space-between" align="center" mb={6}>
              <Text size="xs" fw={700} c="dimmed">
                {t("simulator.selectExercise", "Mashqni tanlash (1-12):")}
              </Text>
              <Button
                size="xs"
                variant="light"
                color="gray"
                leftSection={<IconRefresh size={14} />}
                onClick={() => resetExercise(currentExerciseIndex)}
              >
                {t("simulator.resetPosition", "Mashqni qayta boshlash")}
              </Button>
            </Group>
            <Group gap={6} wrap="wrap">
              {EXERCISE_REGISTRY.map((ex, idx) => (
                <Button
                  key={ex.number}
                  size="xs"
                  variant={idx === currentExerciseIndex ? "filled" : "light"}
                  color={idx === currentExerciseIndex ? "blue" : "gray"}
                  onClick={() => resetExercise(idx)}
                >
                  {ex.number}. {getLoc(ex.title).split(".")[1] || getLoc(ex.title)}
                </Button>
              ))}
            </Group>
          </Paper>
        </Stack>
      </Container>

      {/* Exercise Completed Modal */}
      <Modal
        opened={completedModalOpen}
        onClose={() => setCompletedModalOpen(false)}
        title={
          <Group gap="xs">
            <IconCheck size={22} color="#2ecc71" />
            <Text fw={700}>
              {t("simulator.exerciseDone", "Mashq muvaffaqiyatli bajarildi!")}
            </Text>
          </Group>
        }
        radius="md"
        size="md"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            {lang === "ru"
              ? "Вы успешно завершили текущее упражнение. Желаете перейти к следующему или повторить?"
              : lang === "uzc"
              ? "Сиз жорий машқни тўлиқ бажардингиз. Кейинги машққа ўтишни хоҳлайсизми ёки такрорлайсизми?"
              : "Siz joriy mashqni to'liq bajardingiz. Keyingi mashqqa o'tishni xohlaysizmi yoki takrorlaysizmi?"}
          </Text>

          <Group justify="space-between" mt="md">
            <Button
              variant="outline"
              color="gray"
              leftSection={<IconRefresh size={16} />}
              onClick={() => {
                setCompletedModalOpen(false);
                resetExercise(currentExerciseIndex);
              }}
            >
              {t("simulator.repeatExercise", "Qayta mashq")}
            </Button>

            {currentExerciseIndex < EXERCISE_REGISTRY.length - 1 ? (
              <Button
                color="blue"
                rightSection={<IconArrowRight size={16} />}
                onClick={() => {
                  setCompletedModalOpen(false);
                  resetExercise(currentExerciseIndex + 1);
                }}
              >
                {t("simulator.nextExercise", "Keyingi mashq")}
              </Button>
            ) : (
              <Button
                color="green"
                onClick={() => {
                  setCompletedModalOpen(false);
                  navigate("/simulator");
                }}
              >
                {t("simulator.finishTraining", "O'rganishni yakunlash")}
              </Button>
            )}
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
