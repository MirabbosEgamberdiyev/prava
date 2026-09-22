import { useState, useEffect, useRef, useCallback } from "react";
import {
  Container,
  Paper,
  Group,
  Stack,
  Text,
  Badge,
  Button,
} from "@mantine/core";
import {
  IconArrowLeft,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../context/LanguageContext";
import SEO from "../../../components/common/SEO";
import { EXERCISE_REGISTRY } from "../registry/exerciseRegistry";
import { VEHICLE_CONFIGS } from "../registry/vehicleConfigs";
import { updateVehiclePhysics } from "../engine/vehiclePhysics";
import { checkCollisions } from "../engine/collisionEngine";
import { evaluateSensors } from "../engine/sensorEngine";
import { createPenaltyEvent, calculateTotalScore } from "../engine/penaltyEngine";
import { simulatorApi } from "../services/simulatorApi";
import SimulatorCanvas3D from "../components/SimulatorCanvas3D";
import HUDOverlay from "../components/HUDOverlay";
import MobileControls from "../components/MobileControls";
import VoiceInstructor from "../components/VoiceInstructor";
import WebGLFallback, { isWebGLAvailable } from "../components/WebGLFallback";
import type {
  VehicleTelemetry,
  CameraView,
  GearMode,
  PenaltyEvent,
  ExerciseAttemptResult,
} from "../types";

export default function SimulatorExam_Page() {
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const [currentExIndex, setCurrentExIndex] = useState<number>(0);
  const exercise = EXERCISE_REGISTRY[currentExIndex] || EXERCISE_REGISTRY[0];

  const [sessionId, setSessionId] = useState<string>("");
  const [cameraView, setCameraView] = useState<CameraView>("chase");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [penalties, setPenalties] = useState<PenaltyEvent[]>([]);
  const [exerciseResults, setExerciseResults] = useState<ExerciseAttemptResult[]>([]);
  const [instructorMsg, setInstructorMsg] = useState<string>("");
  const [isFinishing, setIsFinishing] = useState<boolean>(false);
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

  // Initialize Session
  useEffect(() => {
    setWebglSupported(isWebGLAvailable());
    simulatorApi.startSession("exam").then((sess) => {
      setSessionId(sess.sessionId);
    });
    setInstructorMsg(getLoc(exercise.instructorGuide));
  }, [exercise, getLoc]);

  // Finish exam and navigate to result
  const finalizeExam = useCallback(
    async (isPassed: boolean, currentPenalties: PenaltyEvent[]) => {
      if (isFinishing) return;
      setIsFinishing(true);
      const total = currentPenalties.reduce((sum, p) => sum + p.points, 0);
      const saved = await simulatorApi.finishSession(
        sessionId || "sim_local_" + Date.now(),
        total,
        elapsedSeconds,
        isPassed,
        exerciseResults
      );
      navigate(`/simulator/result/${saved.sessionId}`);
    },
    [elapsedSeconds, exerciseResults, isFinishing, navigate, sessionId]
  );

  // Move to next exercise or finish exam
  const handleExerciseCompleted = useCallback(() => {
    const exResult: ExerciseAttemptResult = {
      exerciseNumber: exercise.number,
      isPassed: true,
      penaltyPoints: 0,
      timeSpentSeconds: elapsedSeconds,
      penalties: [],
    };
    const nextResults = [...exerciseResults, exResult];
    setExerciseResults(nextResults);

    if (currentExIndex < EXERCISE_REGISTRY.length - 1) {
      const nextIdx = currentExIndex + 1;
      const nextEx = EXERCISE_REGISTRY[nextIdx];
      setCurrentExIndex(nextIdx);
      setTelemetry((prev) => ({
        ...prev,
        posX: nextEx.startX,
        posY: nextEx.startY,
        rotation: nextEx.startRotation,
        speed: 0,
        rollbackDistance: 0,
      }));
      setInstructorMsg(getLoc(nextEx.instructorGuide));
    } else {
      // Completed all 12 exercises
      const score = calculateTotalScore(penalties);
      finalizeExam(score.isPassed, penalties);
    }
  }, [currentExIndex, elapsedSeconds, exercise.number, exerciseResults, finalizeExam, getLoc, penalties]);

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
      if (e.key === "b" || e.key === "B") {
        setTelemetry((prev) => ({ ...prev, seatbeltFastened: !prev.seatbeltFastened }));
      }
      if (e.key === "l" || e.key === "L") {
        setTelemetry((prev) => ({ ...prev, lowBeamsOn: !prev.lowBeamsOn }));
      }
      if (e.key === "q" || e.key === "Q") {
        setTelemetry((prev) => ({
          ...prev,
          turnSignal: prev.turnSignal === "left" ? "none" : "left",
        }));
      }
      if (e.key === "e" || e.key === "E") {
        setTelemetry((prev) => ({
          ...prev,
          turnSignal: prev.turnSignal === "right" ? "none" : "right",
        }));
      }
      if (e.key === "h" || e.key === "H") {
        setTelemetry((prev) => ({
          ...prev,
          turnSignal: prev.turnSignal === "hazard" ? "none" : "hazard",
        }));
      }
      if (e.key === "c" || e.key === "C") {
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
          const nextPens = [...prev, pen];
          const score = calculateTotalScore(nextPens);

          if (!score.isPassed) {
            finalizeExam(false, nextPens);
          } else {
            setInstructorMsg(
              lang === "ru" ? "Сбит конус! +20 штрафных баллов." : "To'siq konusi urildi! +20 jarima bali."
            );
          }
          return nextPens;
        });
      }

      // Sensor check
      const sensor = evaluateSensors(updated, exercise);
      if (sensor.isRollbackViolated) {
        setPenalties((prev) => {
          const pen = createPenaltyEvent("ROLLBACK_EXCEEDED", exercise.number, elapsedSeconds, updated.posX, updated.posY);
          const nextPens = [...prev, pen];
          finalizeExam(false, nextPens);
          return nextPens;
        });
      } else if (sensor.isExerciseCompleted) {
        handleExerciseCompleted();
      }

      currentTelem = updated;
      setTelemetry(updated);
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [elapsedSeconds, exercise, finalizeExam, handleExerciseCompleted, lang]);

  const totalPenalties = penalties.reduce((sum, p) => sum + p.points, 0);

  return (
    <>
      <SEO
        title={`${lang === "ru" ? "Экзамен автодрома" : "Avtodrom imtihoni"} | PravaOnline`}
        description="IIV YHXX Davlat amaliy imtihoni 3D simulyatori"
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
              onClick={() => navigate("/simulator")}
            >
              {lang === "ru" ? "Выйти" : "Chiqish"}
            </Button>
            <Badge color="orange" size="lg" variant="filled">
              {lang === "ru" ? "ОФИЦИАЛЬНЫЙ ЭКЗАМЕН (100 БАЛЛОВ)" : "RASMIY IMTIHON (100 BALL)"}
            </Badge>
          </Group>

          {/* Voice Instructor */}
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
                showHelpers={false}
              />

              <HUDOverlay
                telemetry={telemetry}
                exercise={exercise}
                elapsedSeconds={elapsedSeconds}
                totalPenalties={totalPenalties}
                maxPenaltyAllowed={100}
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
                onGearSelect={(g: GearMode) => setTelemetry((prev) => ({ ...prev, gear: g }))}
                onHandbrakeToggle={() =>
                  setTelemetry((prev) => ({ ...prev, handbrake: !prev.handbrake }))
                }
                onSeatbeltToggle={() =>
                  setTelemetry((prev) => ({ ...prev, seatbeltFastened: !prev.seatbeltFastened }))
                }
                onLightsToggle={() =>
                  setTelemetry((prev) => ({ ...prev, lowBeamsOn: !prev.lowBeamsOn }))
                }
                onTurnSignalToggle={(sig) =>
                  setTelemetry((prev) => ({
                    ...prev,
                    turnSignal: prev.turnSignal === sig ? "none" : sig,
                  }))
                }
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

          {/* Exam Progress Indicator */}
          <Paper p="xs" radius="md" withBorder>
            <Group justify="space-between" align="center">
              <Text size="xs" fw={700} c="dimmed">
                {lang === "ru" ? "Прогресс экзамена:" : "Imtihon jarayoni:"} {currentExIndex + 1} / 12
              </Text>
              <Badge color="orange" size="sm" variant="light">
                {lang === "ru" ? "Штраф:" : "Jarima:"} {totalPenalties} / 100
              </Badge>
            </Group>
          </Paper>
        </Stack>
      </Container>
    </>
  );
}
