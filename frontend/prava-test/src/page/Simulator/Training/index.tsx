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
import { useLanguage } from "../../../context/LanguageContext";
import SEO from "../../../components/common/SEO";
import { EXERCISE_REGISTRY } from "../registry/exerciseRegistry";
import { VEHICLE_CONFIGS } from "../registry/vehicleConfigs";
import { updateVehiclePhysics } from "../engine/vehiclePhysics";
import { checkCollisions } from "../engine/collisionEngine";
import { evaluateSensors } from "../engine/sensorEngine";
import SimulatorCanvas3D from "../components/SimulatorCanvas3D";
import HUDOverlay from "../components/HUDOverlay";
import MobileControls from "../components/MobileControls";
import VoiceInstructor from "../components/VoiceInstructor";
import TrainingHelpers from "../components/TrainingHelpers";
import WebGLFallback, { isWebGLAvailable } from "../components/WebGLFallback";
import type { VehicleTelemetry, CameraView, GearMode } from "../types";

export default function SimulatorTraining_Page() {
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
  const exercise = EXERCISE_REGISTRY[currentExerciseIndex] || EXERCISE_REGISTRY[0];

  const [cameraView, setCameraView] = useState<CameraView>("chase");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [instructorMsg, setInstructorMsg] = useState<string>("");
  const [completedModalOpen, setCompletedModalOpen] = useState<boolean>(false);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);

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
    setTelemetry({
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
      posX: ex.startX,
      posY: ex.startY,
      rotation: ex.startRotation,
      rollbackDistance: 0,
    });
    setElapsedSeconds(0);
    setInstructorMsg(getLoc(ex.instructorGuide));
  }, [getLoc]);

  // Initial instruction
  useEffect(() => {
    setInstructorMsg(getLoc(exercise.instructorGuide));
  }, [exercise, getLoc]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysDownRef.current[e.key.toLowerCase()] = true;
      if (e.key === "p" || e.key === "P") setTelemetry((prev) => ({ ...prev, gear: "P" }));
      if (e.key === "r" || e.key === "R") setTelemetry((prev) => ({ ...prev, gear: "R" }));
      if (e.key === "n" || e.key === "N") setTelemetry((prev) => ({ ...prev, gear: "N" }));
      if (e.key === "d" || e.key === "D") setTelemetry((prev) => ({ ...prev, gear: "D" }));
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
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Physics Loop (60 FPS)
  useEffect(() => {
    let currentTelem = telemetry;

    const loop = () => {
      const keys = keysDownRef.current;
      let throttle = 0;
      let brake = 0;
      let steer = 0;

      if (keys["w"] || keys["arrowup"]) throttle = 1.0;
      if (keys["s"] || keys["arrowdown"]) brake = 1.0;
      if (keys["a"] || keys["arrowleft"]) steer = -1.0;
      if (keys["d"] || keys["arrowright"]) steer = 1.0;

      const updated = updateVehiclePhysics(
        currentTelem,
        { throttle, brake, steer, handbrake: currentTelem.handbrake },
        VEHICLE_CONFIGS["Chevrolet Cobalt"],
        0.016,
        exercise.hasIncline
      );

      // Collisions check
      const col = checkCollisions(updated, exercise);
      if (col.hasCollision && col.type === "cone") {
        setInstructorMsg(
          lang === "ru"
            ? "Внимание! Вы задели конус. В режиме обучения повторите маневр."
            : "Diqqat! Konusga tegdiniz. Mashqni ehtiyotkorlik bilan takrorlang."
        );
      }

      // Sensor check for completion
      const sensor = evaluateSensors(updated, exercise);
      if (sensor.isExerciseCompleted && !completedModalOpen) {
        setCompletedModalOpen(true);
        setInstructorMsg(
          lang === "ru"
            ? "Отлично! Упражнение успешно выполнено."
            : "Ajoyib! Mashq muvaffaqiyatli bajarildi."
        );
      }

      currentTelem = updated;
      setTelemetry(updated);
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [completedModalOpen, exercise, lang]);

  return (
    <>
      <SEO
        title={`${lang === "ru" ? "Обучение" : "O'rganish"} | ${getLoc(exercise.title)} | PravaOnline`}
        description={getLoc(exercise.description)}
      />

      <Container size="xl" py="sm">
        <Stack gap="sm">
          {/* Top Navigation */}
          <Group justify="space-between" align="center">
            <Button
              variant="subtle"
              color="gray"
              size="xs"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => navigate("/simulator")}
            >
              {lang === "ru" ? "Главная симулятора" : "Simulyator paneli"}
            </Button>
            <Badge color="blue" size="lg" variant="filled">
              {lang === "ru" ? "РЕЖИМ ОБУЧЕНИЯ" : "O'RGANISH REJIMI"}
            </Badge>
          </Group>

          {/* Voice Instructor Box */}
          <VoiceInstructor message={instructorMsg} soundEnabled={soundEnabled} />

          {/* Training Guidance Helpers */}
          <TrainingHelpers telemetry={telemetry} exercise={exercise} />

          {/* Main 3D Canvas / Fallback */}
          {!webglSupported ? (
            <WebGLFallback onRetry={() => setWebglSupported(isWebGLAvailable())} />
          ) : (
            <Paper
              radius="lg"
              withBorder
              style={{
                position: "relative",
                overflow: "hidden",
                height: "500px",
                backgroundColor: "#1a252f",
              }}
            >
              <SimulatorCanvas3D
                telemetry={telemetry}
                exercise={exercise}
                cameraView={cameraView}
                showHelpers={true}
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
                  setCameraView(
                    cameraView === "chase"
                      ? "first_person"
                      : cameraView === "first_person"
                      ? "top_down"
                      : "chase"
                  )
                }
                onSoundToggle={() => setSoundEnabled(!soundEnabled)}
              />

              {/* Mobile controls overlay */}
              <MobileControls
                onThrottleStart={() => {
                  keysDownRef.current["w"] = true;
                }}
                onThrottleEnd={() => {
                  keysDownRef.current["w"] = false;
                }}
                onBrakeStart={() => {
                  keysDownRef.current["s"] = true;
                }}
                onBrakeEnd={() => {
                  keysDownRef.current["s"] = false;
                }}
                onSteerLeftStart={() => {
                  keysDownRef.current["a"] = true;
                }}
                onSteerLeftEnd={() => {
                  keysDownRef.current["a"] = false;
                }}
                onSteerRightStart={() => {
                  keysDownRef.current["d"] = true;
                }}
                onSteerRightEnd={() => {
                  keysDownRef.current["d"] = false;
                }}
                onGearSelect={(g: GearMode) => setTelemetry((prev) => ({ ...prev, gear: g }))}
                onHandbrakeToggle={() =>
                  setTelemetry((prev) => ({ ...prev, handbrake: !prev.handbrake }))
                }
                activeGear={telemetry.gear}
                handbrakeActive={telemetry.handbrake}
              />
            </Paper>
          )}

          {/* Bottom Exercise Switcher */}
          <Paper p="xs" radius="md" withBorder>
            <Group justify="space-between" align="center" mb={6}>
              <Text size="xs" fw={700} c="dimmed">
                {lang === "ru" ? "Упражнение (1-12):" : "Mashqni tanlash (1-12):"}
              </Text>
              <Button
                size="xs"
                variant="light"
                color="gray"
                leftSection={<IconRefresh size={14} />}
                onClick={() => resetExercise(currentExerciseIndex)}
              >
                {lang === "ru" ? "Сбросить положение" : "Mashqni qayta boshlash"}
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
              {lang === "ru" ? "Упражнение выполнено!" : "Mashq muvaffaqiyatli bajarildi!"}
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
              {lang === "ru" ? "Повторить" : "Qayta mashq"}
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
                {lang === "ru" ? "Следующее упражнение" : "Keyingi mashq"}
              </Button>
            ) : (
              <Button
                color="green"
                onClick={() => {
                  setCompletedModalOpen(false);
                  navigate("/simulator");
                }}
              >
                {lang === "ru" ? "Завершить обучение" : "O'rganishni yakunlash"}
              </Button>
            )}
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
