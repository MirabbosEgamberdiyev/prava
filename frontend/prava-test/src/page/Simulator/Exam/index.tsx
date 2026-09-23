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
import { SimulationController, type SimulationInput } from "../engine/SimulationController";
import { simulatorApi } from "../services/simulatorApi";
import SimulatorCanvas3D from "../components/SimulatorCanvas3D";
import HUDOverlay from "../components/HUDOverlay";
import VoiceInstructor from "../components/VoiceInstructor";
import AIInstructorOverlay from "../components/AIInstructorOverlay";
import WebGLFallback, { isWebGLAvailable } from "../components/WebGLFallback";
import type {
  VehicleTelemetry,
  CameraView,
  GearMode,
  PenaltyEvent,
  ExerciseAttemptResult,
  AIInstructorFeedback,
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
  const [aiFeedback, setAiFeedback] = useState<AIInstructorFeedback | null>(null);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);
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
    gear: "P",
    steeringAngle: 0,
    handbrake: true,
    throttle: 0,
    brake: 0,
    clutch: 0,
    engineStarted: true,
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
  const penaltiesRef = useRef<PenaltyEvent[]>([]);
  penaltiesRef.current = penalties;

  const getLoc = useCallback(
    (obj: { uzl: string; uzc: string; ru: string }) => {
      if (lang === "ru") return obj.ru;
      if (lang === "uzc") return obj.uzc;
      return obj.uzl;
    },
    [lang]
  );

  // Finish exam and navigate to result
  const finalizeExam = useCallback(
    async (isPassed: boolean, currentPenalties: PenaltyEvent[]) => {
      if (isFinishing) return;
      setIsFinishing(true);

      if (controllerRef.current) {
        controllerRef.current.stopRecording(isPassed, currentPenalties.reduce((sum, p) => sum + p.points, 0));
      }

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
      if (controllerRef.current) {
        controllerRef.current.setExercise(nextEx);
      }
      setInstructorMsg(getLoc(nextEx.instructorGuide));
    } else {
      // Completed all 12 exercises
      const totalPoints = penaltiesRef.current.reduce((s, p) => s + p.points, 0);
      finalizeExam(totalPoints < 100, penaltiesRef.current);
    }
  }, [currentExIndex, elapsedSeconds, exercise.number, exerciseResults, finalizeExam, getLoc]);

  // Initialize Controller & Session
  useEffect(() => {
    setWebglSupported(isWebGLAvailable());

    const ctrl = new SimulationController(
      exercise,
      "Chevrolet Cobalt",
      {
        onTelemetryUpdate: (telem) => setTelemetry(telem),
        onPenaltyTriggered: (pen) => {
          setPenalties((prev) => {
            const nextPens = [...prev, pen];
            const sum = nextPens.reduce((s, p) => s + p.points, 0);
            if (sum >= 100) {
              finalizeExam(false, nextPens);
            }
            return nextPens;
          });
        },
        onStationCompleted: () => {
          handleExerciseCompleted();
        },
        onExamFinished: (isPassed) => {
          finalizeExam(isPassed, penaltiesRef.current);
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

    simulatorApi.startSession("exam").then((sess) => {
      setSessionId(sess.sessionId);
      ctrl.startRecording(sess.sessionId, "exam");
    });

    setInstructorMsg(getLoc(exercise.instructorGuide));
  }, [exercise, finalizeExam, getLoc, handleExerciseCompleted, lang]);

  // Synchronize language changes with controller
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

  // Physics Loop (60 FPS) through unified SimulationController
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
      if (keys["c"]) clutch = 1.0; // Clutch pedal 'C'

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
        title={`${lang === "ru" ? "Экзамен автодрома" : lang === "uzc" ? "Автодром имтиҳони" : "Avtodrom imtihoni"} | PravaOnline`}
        description="IIV YHXX Davlat amaliy imtihoni 3D simulyatori"
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
              onClick={() => navigate("/simulator")}
            >
              {lang === "ru" ? "Выйти" : lang === "uzc" ? "Чиқиш" : "Chiqish"}
            </Button>
            <Badge color="orange" size="md" variant="filled">
              {lang === "ru"
                ? "ОФИЦИАЛЬНЫЙ ЭКЗАМЕН (100 БАЛЛОВ)"
                : lang === "uzc"
                ? "РАСМИЙ ИМТИҲОН (100 БАЛЛ)"
                : "RASMIY IMTIHON (100 BALL)"}
            </Badge>
          </Group>

          {/* Real-time AI Instructor Guidance Overlay */}
          <AIInstructorOverlay feedback={aiFeedback} />

          {/* Voice Instructor Subtitle */}
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
                showHelpers={false}
                category="B"
                modelName="Chevrolet Cobalt"
              />

              <HUDOverlay
                telemetry={telemetry}
                exercise={exercise}
                elapsedSeconds={elapsedSeconds}
                totalPenalties={totalPenalties}
                maxPenaltyAllowed={100}
                cameraView={cameraView}
                soundEnabled={soundEnabled}
                penalties={penalties}
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
                onNextExercise={handleExerciseCompleted}
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

          {/* Exam Progress Indicator */}
          <Paper p="xs" radius="md" withBorder>
            <Group justify="space-between" align="center">
              <Text size="xs" fw={700} c="dimmed">
                {lang === "ru" ? "Прогресс экзамена:" : lang === "uzc" ? "Имтиҳон жараёни:" : "Imtihon jarayoni:"} {currentExIndex + 1} / 12
              </Text>
              <Badge color="orange" size="sm" variant="light">
                {lang === "ru" ? "Штраф:" : lang === "uzc" ? "Жарима:" : "Jarima:"} {totalPenalties} / 100
              </Badge>
            </Group>
          </Paper>
        </Stack>
      </Container>
    </>
  );
}
