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
import { useLanguage } from "../../../context/LanguageContext";
import SEO from "../../../components/common/SEO";
import { EXERCISE_REGISTRY } from "../registry/exerciseRegistry";
import { VEHICLE_CONFIGS } from "../registry/vehicleConfigs";
import { updateVehiclePhysics } from "../engine/vehiclePhysics";
import { checkCollisions } from "../engine/collisionEngine";
import { evaluateSensors } from "../engine/sensorEngine";
import { createPenaltyEvent } from "../engine/penaltyEngine";
import SimulatorCanvas3D from "../components/SimulatorCanvas3D";
import HUDOverlay from "../components/HUDOverlay";
import MobileControls from "../components/MobileControls";
import VoiceInstructor from "../components/VoiceInstructor";
import WebGLFallback, { isWebGLAvailable } from "../components/WebGLFallback";
import type { VehicleTelemetry, CameraView, GearMode, PenaltyEvent } from "../types";

export default function ExercisePractice_Page() {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const exNum = parseInt(exerciseId || "1", 10);
  const exercise = EXERCISE_REGISTRY.find((e) => e.number === exNum) || EXERCISE_REGISTRY[0];

  const [attemptCount, setAttemptCount] = useState<number>(1);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [cameraView, setCameraView] = useState<CameraView>("chase");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [penalties, setPenalties] = useState<PenaltyEvent[]>([]);
  const [instructorMsg, setInstructorMsg] = useState<string>("");
  const [attemptFinishedModal, setAttemptFinishedModal] = useState<boolean>(false);
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
    turnSignal: "none",
    posX: exercise.startX,
    posY: exercise.startY,
    rotation: exercise.startRotation,
    rollbackDistance: 0,
  });

  const keysDownRef = useRef<Record<string, boolean>>({});
  const animFrameRef = useRef<number | null>(null);

  const getLoc = useCallback(
    (obj: { uzl: string; uzc: string; ru: string }) => {
      if (lang === "ru") return obj.ru;
      if (lang === "uzc") return obj.uzc;
      return obj.uzl;
    },
    [lang]
  );

  useEffect(() => {
    setWebglSupported(isWebGLAvailable());
    setInstructorMsg(getLoc(exercise.instructorGuide));
  }, [exercise, getLoc]);

  // Restart attempt
  const restartAttempt = useCallback(() => {
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
      turnSignal: "none",
      posX: exercise.startX,
      posY: exercise.startY,
      rotation: exercise.startRotation,
      rollbackDistance: 0,
    });
    setPenalties([]);
    setElapsedSeconds(0);
    setInstructorMsg(getLoc(exercise.instructorGuide));
    setAttemptCount((c) => c + 1);
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
        setPenalties((prev) => {
          if (prev.some((p) => p.ruleCode === "CONE_COLLISION" && elapsedSeconds - p.occurredAtSeconds < 3)) {
            return prev;
          }
          const pen = createPenaltyEvent("CONE_COLLISION", exercise.number, elapsedSeconds, updated.posX, updated.posY);
          setInstructorMsg(
            lang === "ru" ? "Сбит конус! +20 штрафных баллов." : "To'siq konusi urildi! +20 jarima bali."
          );
          return [...prev, pen];
        });
      }

      // Sensor check for completion
      const sensor = evaluateSensors(updated, exercise);
      if (sensor.isExerciseCompleted && !attemptFinishedModal) {
        setAttemptFinishedModal(true);
        const total = penalties.reduce((sum, p) => sum + p.points, 0);
        setBestScore((b) => (b === null ? total : Math.min(b, total)));
      }

      currentTelem = updated;
      setTelemetry(updated);
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [attemptFinishedModal, elapsedSeconds, exercise, lang, penalties]);

  const totalPenalties = penalties.reduce((sum, p) => sum + p.points, 0);

  return (
    <>
      <SEO
        title={`${getLoc(exercise.title)} | ${lang === "ru" ? "Тренировка" : "Mashq qilish"} | PravaOnline`}
        description={getLoc(exercise.description)}
      />

      <Container size="xl" py="sm">
        <Stack gap="sm">
          {/* Header Bar */}
          <Group justify="space-between" align="center">
            <Button
              variant="subtle"
              color="gray"
              size="xs"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => navigate("/simulator/practice")}
            >
              {lang === "ru" ? "Все упражнения" : "Barcha mashqlar"}
            </Button>

            <Group gap="xs">
              <Badge color="cyan" size="lg" variant="filled">
                {lang === "ru" ? `Попытка #${attemptCount}` : `${attemptCount}-urinish`}
              </Badge>
              {bestScore !== null && (
                <Badge color="green" size="lg" variant="light" leftSection={<IconTrophy size={14} />}>
                  {lang === "ru" ? `Лучший результат: ${bestScore} б.` : `Eng yaxshi: ${bestScore} ball`}
                </Badge>
              )}
            </Group>
          </Group>

          {/* Instructor Voice Box */}
          <VoiceInstructor message={instructorMsg} soundEnabled={soundEnabled} />

          {/* Main 3D Canvas */}
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
                totalPenalties={totalPenalties}
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

          {/* Action Bar */}
          <Paper p="xs" radius="md" withBorder>
            <Group justify="space-between" align="center">
              <Text size="sm" fw={600} lineClamp={1}>
                {getLoc(exercise.title)}
              </Text>
              <Button
                color="cyan"
                size="xs"
                leftSection={<IconRefresh size={14} />}
                onClick={restartAttempt}
              >
                {lang === "ru" ? "Начать заново" : "Qaytadan boshlash"}
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
              {lang === "ru" ? "Попытка завершена!" : "Urinish yakunlandi!"}
            </Text>
          </Group>
        }
        radius="md"
      >
        <Stack gap="md">
          <Group justify="space-between">
            <Text size="sm">{lang === "ru" ? "Штрафные баллы:" : "Jarima ballari:"}</Text>
            <Badge size="lg" color={totalPenalties === 0 ? "green" : "orange"}>
              {totalPenalties} {lang === "ru" ? "баллов" : "ball"}
            </Badge>
          </Group>
          <Group justify="space-between">
            <Text size="sm">{lang === "ru" ? "Затраченное время:" : "Sarflangan vaqt:"}</Text>
            <Text fw={700} size="sm">
              {elapsedSeconds} {lang === "ru" ? "сек." : "soniya"}
            </Text>
          </Group>

          {penalties.length > 0 && (
            <Paper withBorder p="xs" radius="sm">
              <Text size="xs" fw={700} c="dimmed" mb="xs">
                {lang === "ru" ? "Ошибки в этой попытке:" : "Ushbu urinishdagi xatolar:"}
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
              {lang === "ru" ? "К списку упражнений" : "Mashqlar ro'yxatiga"}
            </Button>
            <Button
              color="cyan"
              leftSection={<IconRefresh size={16} />}
              onClick={() => {
                setAttemptFinishedModal(false);
                restartAttempt();
              }}
            >
              {lang === "ru" ? "Еще одна попытка" : "Yana urinish"}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
