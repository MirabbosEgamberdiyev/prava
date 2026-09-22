import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Container,
  Paper,
  Group,
  Stack,
  Text,
  Button,
  Select,
  ActionIcon,
  Tooltip,
  Modal,
} from "@mantine/core";
import {
  IconSteeringWheel,
  IconSchool,
  IconChecklist,
  IconCertificate,
  IconCamera,
  IconMaximize,
  IconMinimize,
  IconLayersSubtract,
  IconDeviceFloppy,
  IconCar,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useTranslation } from "react-i18next";
import SEO from "../../components/common/SEO";
import { EXERCISE_REGISTRY } from "./registry/exerciseRegistry";
import { VEHICLE_CONFIGS } from "./registry/vehicleConfigs";
import { updateVehiclePhysics } from "./engine/vehiclePhysics";
import { checkCollisions } from "./engine/collisionEngine";
import { evaluateSensors } from "./engine/sensorEngine";
import { createPenaltyEvent } from "./engine/penaltyEngine";
import { audioEngine } from "./engine/audioEngine";
import { pollGamepad } from "./engine/gamepadController";
import { simulatorApi } from "./services/simulatorApi";
import SimulatorCanvas3D from "./components/SimulatorCanvas3D";
import HUDOverlay from "./components/HUDOverlay";
import ExerciseNavigatorBar from "./components/ExerciseNavigatorBar";
import MobileControls from "./components/MobileControls";
import WebGLFallback, { isWebGLAvailable } from "./components/WebGLFallback";
import type {
  VehicleTelemetry,
  CameraView,
  GearMode,
  PenaltyEvent,
  ExerciseAttemptResult,
} from "./types";

type ModeType = "training" | "practice" | "exam";

export default function SimulatorDashboard_Page() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { t } = useTranslation();

  const simulatorContainerRef = useRef<HTMLDivElement | null>(null);

  // Active Simulator Mode (Default: "exam" matching reference screenshot)
  const [mode, setMode] = useState<ModeType>("exam");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("Cobalt");
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
  const exercise = EXERCISE_REGISTRY[currentExerciseIndex] || EXERCISE_REGISTRY[0];

  const [cameraView, setCameraView] = useState<CameraView>("chase");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [penalties, setPenalties] = useState<PenaltyEvent[]>([]);
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);
  const [exerciseResults, setExerciseResults] = useState<ExerciseAttemptResult[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const [finishModalOpen, setFinishModalOpen] = useState<boolean>(false);

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
  const mobileSteerRef = useRef<number>(0);
  const mobileThrottleRef = useRef<number>(0);
  const mobileBrakeRef = useRef<number>(0);
  const lastReverseBeepRef = useRef<number>(0);
  const hornActiveRef = useRef<boolean>(false);
  const audioStartedRef = useRef<boolean>(false);

  // Sync mute state with AudioEngine
  useEffect(() => {
    audioEngine.setMuted(!soundEnabled);
  }, [soundEnabled]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      audioEngine.stopEngine();
      audioEngine.stopHorn();
    };
  }, []);

  const ensureAudioStarted = useCallback(() => {
    if (!audioStartedRef.current && soundEnabled) {
      audioEngine.startEngine();
      audioStartedRef.current = true;
    }
  }, [soundEnabled]);

  // Check WebGL availability & start session
  useEffect(() => {
    setWebglSupported(isWebGLAvailable());
    simulatorApi.startSession(mode).then((sess) => {
      setSessionId(sess.sessionId);
    });
  }, [mode]);

  // Keyboard Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      ensureAudioStarted();
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
        setTelemetry((prev) => {
          const next = prev.turnSignal === "left" ? "none" : "left";
          if (soundEnabled) audioEngine.playBlinkerClick(next === "left");
          return { ...prev, turnSignal: next };
        });
      }
      if (e.key === "e" || e.key === "E") {
        setTelemetry((prev) => {
          const next = prev.turnSignal === "right" ? "none" : "right";
          if (soundEnabled) audioEngine.playBlinkerClick(next === "right");
          return { ...prev, turnSignal: next };
        });
      }
      if (e.key === "x" || e.key === "X") {
        setTelemetry((prev) => {
          const next = prev.turnSignal === "hazard" ? "none" : "hazard";
          if (soundEnabled) audioEngine.playBlinkerClick(next === "hazard");
          return { ...prev, turnSignal: next };
        });
      }
      if (e.key === "h" || e.key === "H") {
        if (!hornActiveRef.current) {
          hornActiveRef.current = true;
          if (soundEnabled) audioEngine.startHorn();
        }
      }
      if (e.key === "c" || e.key === "C") {
        setCameraView((prev) =>
          prev === "chase" ? "first_person" : prev === "first_person" ? "top_down" : "chase"
        );
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDownRef.current[e.key.toLowerCase()] = false;
      if (e.key === "h" || e.key === "H") {
        hornActiveRef.current = false;
        audioEngine.stopHorn();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [ensureAudioStarted, soundEnabled]);

  // Timer loop
  useEffect(() => {
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Map of exercise results by exercise number
  const exerciseResultsMap = useMemo(() => {
    const map: Record<number, ExerciseAttemptResult> = {};
    exerciseResults.forEach((r) => {
      map[r.exerciseNumber] = r;
    });
    return map;
  }, [exerciseResults]);

  // Jump to specific exercise
  const selectExercise = useCallback((exNum: number) => {
    const targetIdx = exNum - 1;
    const targetEx = EXERCISE_REGISTRY[targetIdx];
    if (!targetEx) return;

    setCurrentExerciseIndex(targetIdx);
    setTelemetry((prev) => ({
      ...prev,
      speed: 0,
      rpm: 800,
      gear: targetEx.number === 7 || targetEx.number === 11 ? "R" : "D",
      handbrake: false,
      throttle: 0,
      brake: 0,
      posX: targetEx.startX,
      posY: targetEx.startY,
      rotation: targetEx.startRotation,
      rollbackDistance: 0,
    }));
  }, []);

  // Advance to next exercise
  const handleNextExercise = useCallback(() => {
    const completedNum = exercise.number;
    setCompletedExercises((prev) => (prev.includes(completedNum) ? prev : [...prev, completedNum]));

    const exResult: ExerciseAttemptResult = {
      exerciseNumber: completedNum,
      isPassed: true,
      penaltyPoints: 0,
      timeSpentSeconds: elapsedSeconds,
      penalties: [],
    };
    setExerciseResults((prev) => [...prev, exResult]);

    if (currentExerciseIndex < EXERCISE_REGISTRY.length - 1) {
      selectExercise(currentExerciseIndex + 2);
    } else {
      const total = penalties.reduce((sum, p) => sum + p.points, 0);
      if (soundEnabled && total < 100) {
        audioEngine.playSuccessFanfare();
      }
      setFinishModalOpen(true);
    }
  }, [currentExerciseIndex, elapsedSeconds, exercise.number, penalties, selectExercise, soundEnabled]);

  // Finish exam action
  const handleFinishExam = useCallback(async () => {
    const total = penalties.reduce((sum, p) => sum + p.points, 0);
    const isPassed = total < 100;
    const saved = await simulatorApi.finishSession(
      sessionId || "sim_local_" + Date.now(),
      total,
      elapsedSeconds,
      isPassed,
      exerciseResults
    );
    navigate(`/simulator/result/${saved.sessionId}`);
  }, [elapsedSeconds, exerciseResults, navigate, penalties, sessionId]);

  // Physics Simulation Loop (60 FPS) with Gamepad and Audio Synthesis
  useEffect(() => {
    let currentTelem = telemetry;

    const loop = () => {
      const keys = keysDownRef.current;
      const gp = pollGamepad();

      let throttle = 0;
      let brake = 0;
      let steer = 0;

      if (keys["w"] || keys["arrowup"]) throttle = 1.0;
      if (keys["s"] || keys["arrowdown"]) brake = 1.0;
      if (keys["a"] || keys["arrowleft"]) steer = -1.0;
      if (keys["d"] || keys["arrowright"]) steer = 1.0;

      // Merge mobile touch controls
      throttle = Math.max(throttle, mobileThrottleRef.current);
      brake = Math.max(brake, mobileBrakeRef.current);
      if (Math.abs(mobileSteerRef.current) > 0.05) {
        steer = mobileSteerRef.current;
      }

      // Merge HTML5 Gamepad API
      if (gp.connected) {
        throttle = Math.max(throttle, gp.throttle);
        brake = Math.max(brake, gp.brake);
        if (Math.abs(gp.steer) > 0.05) {
          steer = gp.steer;
        }
        if (gp.gearChange && gp.gearChange !== currentTelem.gear) {
          setTelemetry((prev) => ({ ...prev, gear: gp.gearChange! }));
        }
        if (gp.handbrake && !currentTelem.handbrake) {
          setTelemetry((prev) => ({ ...prev, handbrake: true }));
        }
        if (gp.horn && !hornActiveRef.current) {
          hornActiveRef.current = true;
          if (soundEnabled) audioEngine.startHorn();
        } else if (!gp.horn && hornActiveRef.current && !keys["h"]) {
          hornActiveRef.current = false;
          audioEngine.stopHorn();
        }
      }

      const vehicleConfig =
        VEHICLE_CONFIGS[selectedVehicle] || VEHICLE_CONFIGS["Chevrolet Cobalt"];

      const updated = updateVehiclePhysics(
        currentTelem,
        { throttle, brake, steer, handbrake: currentTelem.handbrake },
        vehicleConfig,
        0.016,
        exercise.hasIncline
      );

      // Web Audio Real-time Synthesis Modulation
      if (soundEnabled) {
        audioEngine.updateEngine(updated.rpm, throttle);
        if (brake > 0.45 && Math.abs(updated.speed) > 7) {
          audioEngine.triggerBrakeScreech(brake);
        }
        if (updated.gear === "R" && Date.now() - lastReverseBeepRef.current > 1250) {
          lastReverseBeepRef.current = Date.now();
          audioEngine.playReverseBeep();
        }
      }

      // Check for obstacle collisions
      const col = checkCollisions(updated, exercise);
      if (col.hasCollision && col.type === "cone") {
        setPenalties((prev) => {
          const exists = prev.some(
            (p) => p.exerciseNumber === exercise.number && p.ruleCode === "CONE_KNOCKED"
          );
          if (exists) return prev;
          if (soundEnabled) {
            audioEngine.playCollisionSound();
            audioEngine.playPenaltyBuzzer();
          }
          const pen = createPenaltyEvent(
            "CONE_KNOCKED",
            exercise.number,
            elapsedSeconds,
            updated.posX,
            updated.posY
          );
          return [...prev, pen];
        });
      }

      // Check sensor zones & rules
      const sensor = evaluateSensors(updated, exercise);
      if (sensor.isRollbackViolated) {
        setPenalties((prev) => {
          const exists = prev.some((p) => p.ruleCode === "ROLLBACK_EXCEEDED");
          if (exists) return prev;
          if (soundEnabled) audioEngine.playPenaltyBuzzer();
          const pen = createPenaltyEvent(
            "ROLLBACK_EXCEEDED",
            exercise.number,
            elapsedSeconds,
            updated.posX,
            updated.posY
          );
          return [...prev, pen];
        });
      }

      if (sensor.isSpeedViolated) {
        setPenalties((prev) => {
          const exists = prev.some(
            (p) => p.exerciseNumber === exercise.number && p.ruleCode === "SPEED_EXCEEDED"
          );
          if (exists) return prev;
          if (soundEnabled) audioEngine.playPenaltyBuzzer();
          const pen = createPenaltyEvent(
            "SPEED_EXCEEDED",
            exercise.number,
            elapsedSeconds,
            updated.posX,
            updated.posY
          );
          return [...prev, pen];
        });
      }

      // In Training mode, automatically acknowledge completion when stop zone reached
      if (mode === "training" && sensor.isExerciseCompleted) {
        setCompletedExercises((prev) =>
          prev.includes(exercise.number) ? prev : [...prev, exercise.number]
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
  }, [elapsedSeconds, exercise, mode, selectedVehicle, soundEnabled]);

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      simulatorContainerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const totalPenalties = penalties.reduce((sum, p) => sum + p.points, 0);

  return (
    <>
      <SEO
        title={t("seo.simulatorTitle", "Avtodrom Simulyatori 3D | PravaOnline")}
        description={t("seo.simulatorDesc", "IIV YHXX Davlat amaliy imtihoni 3D simulyatori")}
      />

      <Container size="xl" py="xs" px={{ base: "xs", sm: "sm" }}>
        <Stack gap="xs">
          {/* ========================================================= */}
          {/* TOP ACTION BAR MATCHING REFERENCE SCREENSHOT              */}
          {/* ========================================================= */}
          <Paper
            p="xs"
            radius="md"
            withBorder
            style={{
              backgroundColor: "#0d1526",
              borderColor: "rgba(255, 255, 255, 0.12)",
            }}
          >
            <Group justify="space-between" align="center" wrap="wrap" gap="xs">
              {/* Left: Car Badge & Title */}
              <Group gap="xs" align="center">
                <ActionIcon size="lg" radius="md" color="blue" variant="filled">
                  <IconSteeringWheel size={20} />
                </ActionIcon>
                <Text size="md" fw={800} c="white" style={{ letterSpacing: "0.3px" }}>
                  {lang === "ru" ? "Автодром Симулятор" : "Avtodrom Simulyatori"}
                </Text>
              </Group>

              {/* Center Mode Switcher Tabs matching screenshot */}
              <Group
                gap={4}
                p={3}
                style={{
                  backgroundColor: "rgba(15, 23, 42, 0.8)",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                {/* 1. O'rganish (Training) */}
                <Button
                  size="xs"
                  variant={mode === "training" ? "filled" : "subtle"}
                  color={mode === "training" ? "blue" : "gray"}
                  leftSection={<IconSchool size={15} />}
                  onClick={() => setMode("training")}
                  style={{ fontWeight: 700 }}
                >
                  {lang === "ru" ? "Обучение" : "O'rganish"}
                </Button>

                {/* 2. Mashq qilish (Practice) */}
                <Button
                  size="xs"
                  variant={mode === "practice" ? "filled" : "subtle"}
                  color={mode === "practice" ? "blue" : "gray"}
                  leftSection={<IconChecklist size={15} />}
                  onClick={() => setMode("practice")}
                  style={{ fontWeight: 700 }}
                >
                  {lang === "ru" ? "Тренировка" : "Mashq qilish"}
                </Button>

                {/* 3. Imtihon rejimi (Exam - active in screenshot) */}
                <Button
                  size="xs"
                  variant={mode === "exam" ? "filled" : "subtle"}
                  color={mode === "exam" ? "blue" : "gray"}
                  leftSection={<IconCertificate size={15} />}
                  onClick={() => setMode("exam")}
                  style={{ fontWeight: 700 }}
                >
                  {lang === "ru" ? "Режим экзамена" : "Imtihon rejimi"}
                </Button>
              </Group>

              {/* Vehicle Selector & Utility Actions */}
              <Group gap="xs" align="center">
                {/* Vehicle Selector Dropdown ("Cobalt v") */}
                <Select
                  size="xs"
                  value={selectedVehicle}
                  onChange={(v) => setSelectedVehicle(v || "Cobalt")}
                  data={["Cobalt", "Gentra", "Nexia 3", "Malibu"]}
                  leftSection={<IconCar size={15} color="#38bdf8" />}
                  styles={{
                    input: {
                      backgroundColor: "rgba(15, 23, 42, 0.8)",
                      borderColor: "rgba(255, 255, 255, 0.15)",
                      color: "#ffffff",
                      fontWeight: 700,
                      width: "110px",
                    },
                  }}
                />

                {/* Camera View Toggle Icon */}
                <Tooltip label={lang === "ru" ? "Сменить камеру (C)" : "Kamera ko'rinishi (C)"}>
                  <ActionIcon
                    size="md"
                    variant="subtle"
                    color="gray"
                    onClick={() =>
                      setCameraView((prev) =>
                        prev === "chase" ? "first_person" : prev === "first_person" ? "top_down" : "chase"
                      )
                    }
                  >
                    <IconCamera size={18} />
                  </ActionIcon>
                </Tooltip>

                {/* Camera Snapshot Icon */}
                <Tooltip label={lang === "ru" ? "Снимок экрана" : "Skrinshot olish"}>
                  <ActionIcon size="md" variant="subtle" color="gray">
                    <IconDeviceFloppy size={18} />
                  </ActionIcon>
                </Tooltip>

                {/* Split Screen / PIP Icon */}
                <Tooltip label={lang === "ru" ? "Разделенный экран" : "Bo'lingan ekran"}>
                  <ActionIcon size="md" variant="subtle" color="gray">
                    <IconLayersSubtract size={18} />
                  </ActionIcon>
                </Tooltip>

                {/* Fullscreen Toggle Icon */}
                <Tooltip label={isFullscreen ? (lang === "ru" ? "Выйти" : "Kichraytirish") : (lang === "ru" ? "На весь экран" : "To'liq ekran")}>
                  <ActionIcon size="md" variant="subtle" color="gray" onClick={toggleFullscreen}>
                    {isFullscreen ? <IconMinimize size={18} /> : <IconMaximize size={18} />}
                  </ActionIcon>
                </Tooltip>

                {/* Red Button: Imtihonni yakunlash (Finish Exam) */}
                <Button
                  size="xs"
                  color="red"
                  variant="filled"
                  radius="xl"
                  onClick={() => setFinishModalOpen(true)}
                  style={{
                    fontWeight: 700,
                    backgroundColor: "#ef4444",
                    boxShadow: "0 4px 14px rgba(239, 68, 68, 0.4)",
                  }}
                >
                  {lang === "ru" ? "Завершить экзамен" : "Imtihonni yakunlash"}
                </Button>
              </Group>
            </Group>
          </Paper>

          {/* ========================================================= */}
          {/* CENTRAL 3D VIEWPORT WITH ALL FLOATING HUD OVERLAYS        */}
          {/* ========================================================= */}
          <Paper
            ref={simulatorContainerRef}
            radius="lg"
            withBorder
            style={{
              position: "relative",
              overflow: "hidden",
              height: "560px",
              backgroundColor: "#93c5fd",
              boxShadow: "0 12px 36px rgba(0, 0, 0, 0.4)",
            }}
          >
            {!webglSupported ? (
              <WebGLFallback onRetry={() => setWebglSupported(isWebGLAvailable())} />
            ) : (
              <>
                <SimulatorCanvas3D
                  telemetry={telemetry}
                  exercise={exercise}
                  cameraView={cameraView}
                  showHelpers={mode === "training"}
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
                    setCameraView((prev) =>
                      prev === "chase" ? "first_person" : prev === "first_person" ? "top_down" : "chase"
                    )
                  }
                  onSoundToggle={() => setSoundEnabled(!soundEnabled)}
                  onNextExercise={handleNextExercise}
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
                  exerciseResults={exerciseResultsMap}
                />

                {/* Mobile Touch Controls for small screens */}
                <MobileControls
                  onThrottleStart={() => {
                    mobileThrottleRef.current = 1.0;
                    ensureAudioStarted();
                  }}
                  onThrottleEnd={() => {
                    mobileThrottleRef.current = 0.0;
                  }}
                  onBrakeStart={() => {
                    mobileBrakeRef.current = 1.0;
                  }}
                  onBrakeEnd={() => {
                    mobileBrakeRef.current = 0.0;
                  }}
                  onSteerLeftStart={() => {
                    mobileSteerRef.current = -1.0;
                  }}
                  onSteerLeftEnd={() => {
                    mobileSteerRef.current = 0.0;
                  }}
                  onSteerRightStart={() => {
                    mobileSteerRef.current = 1.0;
                  }}
                  onSteerRightEnd={() => {
                    mobileSteerRef.current = 0.0;
                  }}
                  onSteerAnalog={(val) => {
                    mobileSteerRef.current = val;
                  }}
                  onGearSelect={(g: GearMode) => setTelemetry((prev) => ({ ...prev, gear: g }))}
                  onHandbrakeToggle={() =>
                    setTelemetry((prev) => ({ ...prev, handbrake: !prev.handbrake }))
                  }
                  onHornTrigger={() => {
                    if (soundEnabled) {
                      audioEngine.startHorn();
                      setTimeout(() => audioEngine.stopHorn(), 350);
                    }
                  }}
                  onCameraToggle={() =>
                    setCameraView((prev) =>
                      prev === "chase" ? "first_person" : prev === "first_person" ? "top_down" : "chase"
                    )
                  }
                  activeGear={telemetry.gear}
                  handbrakeActive={telemetry.handbrake}
                />
              </>
            )}
          </Paper>

          {/* ========================================================= */}
          {/* BOTTOM SECTION: 12-EXERCISE NAVIGATOR GRID                */}
          {/* ========================================================= */}
          <ExerciseNavigatorBar
            currentExerciseNumber={exercise.number}
            completedExercises={completedExercises}
            onSelectExercise={selectExercise}
          />
        </Stack>
      </Container>

      {/* Confirmation Modal: Finish Exam */}
      <Modal
        opened={finishModalOpen}
        onClose={() => setFinishModalOpen(false)}
        title={lang === "ru" ? "Завершение экзамена" : "Imtihonni yakunlash"}
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            {lang === "ru"
              ? "Вы действительно хотите завершить текущую попытку и перейти к результатам?"
              : "Haqiqatan ham amaliy imtihonni yakunlab, natijalarni ko'rmoqchimisiz?"}
          </Text>
          <Group justify="flex-end" gap="xs">
            <Button variant="subtle" color="gray" onClick={() => setFinishModalOpen(false)}>
              {lang === "ru" ? "Отмена" : "Bekor qilish"}
            </Button>
            <Button color="red" onClick={handleFinishExam}>
              {lang === "ru" ? "Завершить" : "Yakunlash"}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
