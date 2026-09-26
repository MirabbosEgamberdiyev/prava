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
  SegmentedControl,
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
import {
  VEHICLE_CONFIGS,
  DEFAULT_VEHICLE_FOR_CATEGORY,
  getVehiclesByCategory,
} from "./registry/vehicleConfigs";
import { updateVehiclePhysics } from "./engine/vehiclePhysics";
import { checkCollisions } from "./engine/collisionEngine";
import { evaluateSensors } from "./engine/sensorEngine";
import { createPenaltyEvent } from "./engine/penaltyEngine";
import { audioEngine } from "./engine/audioEngine";
import { pollGamepad } from "./engine/gamepadController";
import { SimulationController } from "./engine/SimulationController";
import { simulatorApi } from "./services/simulatorApi";
import SimulatorCanvas3D from "./components/SimulatorCanvas3D";
import HUDOverlay from "./components/HUDOverlay";
import ExerciseNavigatorBar from "./components/ExerciseNavigatorBar";
import { InputNormalizer } from "./engine/inputNormalizer";
import WebGLFallback, { isWebGLAvailable } from "./components/WebGLFallback";
import VehicleSelectorModal from "./components/VehicleSelectorModal";
import type {
  VehicleTelemetry,
  CameraView,
  GearMode,
  PenaltyEvent,
  ExerciseAttemptResult,
  VehicleCategory,
} from "./types";

type ModeType = "training" | "practice" | "exam";

export default function SimulatorDashboard_Page() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { t } = useTranslation();

  const simulatorContainerRef = useRef<HTMLDivElement | null>(null);

  // Active Simulator Mode (Default: "exam" matching reference screenshot)
  const [mode, setMode] = useState<ModeType>("exam");
  const [category, setCategory] = useState<VehicleCategory>("B");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("Chevrolet Cobalt");
  const [vehicleModalOpen, setVehicleModalOpen] = useState<boolean>(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
  const exercise = EXERCISE_REGISTRY[currentExerciseIndex] || EXERCISE_REGISTRY[0];

  const handleCategoryChange = useCallback((newCat: VehicleCategory) => {
    setCategory(newCat);
    const defVehicle = DEFAULT_VEHICLE_FOR_CATEGORY[newCat] || "Chevrolet Cobalt";
    setSelectedVehicle(defVehicle);
    controllerRef.current?.updateVehicle(defVehicle);
  }, []);

  const handleVehicleChange = useCallback((vName: string) => {
    setSelectedVehicle(vName);
    controllerRef.current?.updateVehicle(vName);
  }, []);

  const [cameraView, setCameraView] = useState<CameraView>("chase");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Sync isFullscreen with native browser fullscreen changes
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
    };
  }, []);

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [penalties, setPenalties] = useState<PenaltyEvent[]>([]);
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);
  const [exerciseResults, setExerciseResults] = useState<ExerciseAttemptResult[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const [finishModalOpen, setFinishModalOpen] = useState<boolean>(false);

  // Simulation Controller Reference
  const controllerRef = useRef<SimulationController | null>(null);

  // Vehicle Telemetry
  const [telemetry, setTelemetry] = useState<VehicleTelemetry>({
    category: "B",
    speed: 0,
    rpm: 800,
    gear: "D",
    steeringAngle: 0,
    handbrake: false,
    throttle: 0,
    brake: 0,
    engineStarted: true,
    seatbeltFastened: true,
    lowBeamsOn: true,
    turnSignal: "none",
    posX: exercise.startX,
    posY: exercise.startY,
    rotation: exercise.startRotation,
    rollbackDistance: 0,
    pitch: 0,
    roll: 0,
    wheelHeights: [0, 0, 0, 0],
    estakadaHoldSeconds: 0,
    examState: "PRE_CHECK",
  });

  const keysDownRef = useRef<Record<string, boolean>>({});
  const animFrameRef = useRef<number | null>(null);
  const mobileSteerRef = useRef<number>(0);
  const mobileThrottleRef = useRef<number>(0);
  const mobileBrakeRef = useRef<number>(0);
  const mobileClutchRef = useRef<number>(0);
  const inputNormalizerRef = useRef<InputNormalizer>(new InputNormalizer());
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

  // Initialize or synchronize SimulationController
  useEffect(() => {
    if (!controllerRef.current) {
      controllerRef.current = new SimulationController(
        exercise,
        selectedVehicle,
        {
          onTelemetryUpdate: (telem) => setTelemetry(telem),
          onPenaltyTriggered: (penalty) => {
            setPenalties((prev) => {
              if (
                prev.some(
                  (p) =>
                    p.ruleCode === penalty.ruleCode &&
                    p.exerciseNumber === penalty.exerciseNumber
                )
              ) {
                return prev;
              }
              if (soundEnabled) {
                audioEngine.playPenaltyBuzzer();
              }
              return [...prev, penalty];
            });
          },
          onStationCompleted: (stationNum) => {
            setCompletedExercises((prev) =>
              prev.includes(stationNum) ? prev : [...prev, stationNum]
            );
          },
          onExamFinished: () => {
            setFinishModalOpen(true);
          },
          onVoiceAnnounce: (msg) => {
            if (soundEnabled) {
              audioEngine.playVoiceAlert(msg, lang === "ru" ? "ru-RU" : "uz-UZ");
            }
          },
        },
        lang as "uzl" | "uzc" | "ru"
      );
    } else {
      controllerRef.current.setLanguage(lang as "uzl" | "uzc" | "ru");
      controllerRef.current.updateConfig(selectedVehicle);
    }
  }, [exercise, selectedVehicle, lang, soundEnabled]);

  // Keyboard Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      ensureAudioStarted();
      keysDownRef.current[e.key.toLowerCase()] = true;

      // Engine Ignition Toggle (Key: I)
      if (e.key === "i" || e.key === "I") {
        const started = controllerRef.current?.toggleEngine() ?? true;
        setTelemetry((prev) => ({ ...prev, engineStarted: started }));
      }

      // PRND Gear Selectors (Alt+D for Drive, or P/R/N, keeping 'D' pure for steering right)
      if (e.key === "p" || e.key === "P") {
        controllerRef.current?.setGear("P");
        setTelemetry((prev) => ({ ...prev, gear: "P" }));
      }
      if ((e.key === "r" || e.key === "R") && !keysDownRef.current["w"] && !keysDownRef.current["s"]) {
        controllerRef.current?.setGear("R");
        setTelemetry((prev) => ({ ...prev, gear: "R" }));
      }
      if (e.key === "n" || e.key === "N") {
        controllerRef.current?.setGear("N");
        setTelemetry((prev) => ({ ...prev, gear: "N" }));
      }
      if (e.altKey && (e.key === "d" || e.key === "D")) {
        controllerRef.current?.setGear("D");
        setTelemetry((prev) => ({ ...prev, gear: "D" }));
      }

      // Handbrake Toggle (Space)
      if (e.code === "Space") {
        e.preventDefault();
        const hb = controllerRef.current?.toggleHandbrake() ?? false;
        setTelemetry((prev) => ({ ...prev, handbrake: hb }));
      }

      // Seatbelt Toggle (Key: B)
      if (e.key === "b" || e.key === "B") {
        const sb = controllerRef.current?.toggleSeatbelt() ?? true;
        setTelemetry((prev) => ({ ...prev, seatbeltFastened: sb }));
      }

      // Headlights Toggle (Key: L)
      if (e.key === "l" || e.key === "L") {
        const hl = controllerRef.current?.toggleLights() ?? true;
        setTelemetry((prev) => ({ ...prev, lowBeamsOn: hl }));
      }

      // Left Turn Signal (Key: Q)
      if (e.key === "q" || e.key === "Q") {
        controllerRef.current?.toggleTurnSignal("left");
        setTelemetry((prev) => ({
          ...prev,
          turnSignal: prev.turnSignal === "left" ? "none" : "left",
        }));
      }

      // Right Turn Signal (Key: E)
      if (e.key === "e" || e.key === "E") {
        controllerRef.current?.toggleTurnSignal("right");
        setTelemetry((prev) => ({
          ...prev,
          turnSignal: prev.turnSignal === "right" ? "none" : "right",
        }));
      }

      // Hazard Lights (Key: X)
      if (e.key === "x" || e.key === "X") {
        controllerRef.current?.toggleTurnSignal("hazard");
        setTelemetry((prev) => ({
          ...prev,
          turnSignal: prev.turnSignal === "hazard" ? "none" : "hazard",
        }));
      }

      // Horn (Key: H)
      if (e.key === "h" || e.key === "H") {
        if (!hornActiveRef.current) {
          hornActiveRef.current = true;
          if (soundEnabled) audioEngine.startHorn();
        }
      }

      // Multi-Camera Perspective Toggle (Key: C: Chase -> Cockpit -> Rear -> Top-Down -> Free)
      if (e.key === "c" || e.key === "C") {
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
    controllerRef.current?.setExercise(targetEx);
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
      if (soundEnabled) {
        audioEngine.playVoiceAlert(
          lang === "ru"
            ? "Упражнение выполнено! Переходите к следующему заданию."
            : lang === "uzc"
            ? "Машқ муваффақиятли бажарилди! Кейинги машққа ўтинг."
            : "Mashq muvaffaqiyatli bajarildi! Keyingi mashqqa o'ting.",
          lang === "ru" ? "ru-RU" : "uz-UZ"
        );
      }
      selectExercise(currentExerciseIndex + 2);
    } else {
      const total = penalties.reduce((sum, p) => sum + p.points, 0);
      if (soundEnabled) {
        if (total < 100) {
          audioEngine.playSuccessFanfare();
          audioEngine.playVoiceAlert(
            lang === "ru"
              ? "Поздравляем! Вы успешно сдали практический экзамен по вождению!"
              : lang === "uzc"
              ? "Табриклаймиз! Сиз амалий ҳайдовchilik имтиҳонини муваффақиятли топширдингиз!"
              : "Tabriklaymiz! Siz amaliy haydovchilik imtihonini muvaffaqiyatli topshirdingiz!",
            lang === "ru" ? "ru-RU" : "uz-UZ"
          );
        } else {
          audioEngine.playVoiceAlert(
            lang === "ru"
              ? "Экзамен не сдан. Лимит штрафных баллов превышен."
              : lang === "uzc"
              ? "Имтиҳон топширилмади. Жарима баллари чегарасидан ошди."
              : "Imtihon topshirilmadi. Jarima ballari chegarasidan oshdi.",
            lang === "ru" ? "ru-RU" : "uz-UZ"
          );
        }
      }
      setFinishModalOpen(true);
    }
  }, [currentExerciseIndex, elapsedSeconds, exercise.number, lang, penalties, selectExercise, soundEnabled]);

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

      // Normalize inputs through the master InputNormalizer
      const norm = inputNormalizerRef.current.step(
        {
          keysDown: keys,
          touchThrottle: mobileThrottleRef.current,
          touchBrake: mobileBrakeRef.current,
          touchSteer: mobileSteerRef.current,
          touchClutch: mobileClutchRef.current,
          gamepad: gp.connected ? gp : undefined,
        },
        currentTelem.gear,
        currentTelem.handbrake,
        cameraView,
        currentTelem.speed,
        0.016
      );

      const throttle = norm.throttle;
      const brake = norm.brake;
      const steer = norm.steer;
      const clutch = norm.clutch;

      if (norm.horn && !hornActiveRef.current) {
        hornActiveRef.current = true;
        if (soundEnabled) audioEngine.startHorn();
      } else if (!norm.horn && hornActiveRef.current) {
        hornActiveRef.current = false;
        audioEngine.stopHorn();
      }

      const controller = controllerRef.current;
      let updated: VehicleTelemetry;

      if (controller) {
        const handbrakeActive = controller.getTelemetry().handbrake;
        updated = controller.update(
          { throttle, brake, steer, clutch, handbrake: handbrakeActive },
          0.016,
          elapsedSeconds
        );
      } else {
        const vehicleConfig =
          VEHICLE_CONFIGS[selectedVehicle] || VEHICLE_CONFIGS["Chevrolet Cobalt"];
        updated = updateVehiclePhysics(
          currentTelem,
          { throttle, brake, steer, clutch, handbrake: currentTelem.handbrake },
          vehicleConfig,
          0.016,
          exercise.hasIncline
        );
      }

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
            audioEngine.playVoiceAlert(
              lang === "ru"
                ? "Сбит конус! Начислен штраф."
                : lang === "uzc"
                ? "Конус уриб туширилди! Жарима балингиз ҳисобланди."
                : "Konus urib tushirildi! Jarima balingiz hisoblandi.",
              lang === "ru" ? "ru-RU" : "uz-UZ"
            );
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
          if (soundEnabled) {
            audioEngine.playPenaltyBuzzer();
            audioEngine.playVoiceAlert(
              lang === "ru"
                ? "Откат более двадцати сантиметров! Экзамен не сдан."
                : lang === "uzc"
                ? "Ортга қайтиш 20 сантиметрдан ошди! Имтиҳон топширилмади."
                : "Ortga qaytish 20 santimetrdan oshdi! Imtihon topshirilmadi.",
              lang === "ru" ? "ru-RU" : "uz-UZ"
            );
          }
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
          if (soundEnabled) {
            audioEngine.playPenaltyBuzzer();
            audioEngine.playVoiceAlert(
              lang === "ru"
                ? "Превышение скорости!"
                : lang === "uzc"
                ? "Тезлик меъёрдан оширилди!"
                : "Tezlik me'yordan oshirildi!",
              lang === "ru" ? "ru-RU" : "uz-UZ"
            );
          }
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
  }, [elapsedSeconds, exercise, lang, mode, selectedVehicle, soundEnabled]);

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      simulatorContainerRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const totalPenalties = penalties.reduce((sum, p) => sum + p.points, 0);

  return (
    <>
      <SEO
        title={t("seo.simulatorTitle", "Avtodrom Simulyatori 3D | PravaOnline")}
        description={t("seo.simulatorDesc", "IIV YHXX Davlat amaliy imtihoni 3D simulyatori")}
      />

      <Container size="xl" maw={1800} py="xs" px={{ base: "xs", sm: "sm" }}>
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
                <ActionIcon component="span" aria-hidden="true" size="lg" radius="md" color="blue" variant="filled">
                  <IconSteeringWheel size={20} />
                </ActionIcon>
                <Text size="md" fw={800} c="white" style={{ letterSpacing: "0.3px" }}>
                  {t("simulator.title", "Avtodrom Simulyatori")}
                </Text>
              </Group>

              {/* Center Mode Switcher Tabs */}
              <Group
                gap={4}
                p={3}
                wrap="wrap"
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
                  {t("simulator.training", "O'rganish")}
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
                  {t("simulator.practice", "Mashq qilish")}
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
                  {t("simulator.exam", "Imtihon rejimi")}
                </Button>
              </Group>

              {/* Vehicle Category & Model Selector & Utility Actions */}
              <Group gap="xs" align="center" wrap="wrap">
                {/* Category Selector (B: Sedan, C: Truck, D: Bus) */}
                <SegmentedControl
                  size="xs"
                  value={category}
                  onChange={(val) => handleCategoryChange(val as VehicleCategory)}
                  data={[
                    { label: "B", value: "B" },
                    { label: "C", value: "C" },
                    { label: "D", value: "D" },
                  ]}
                  styles={{
                    root: {
                      backgroundColor: "rgba(15, 23, 42, 0.8)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                    },
                    indicator: {
                      backgroundColor: "#0284c7",
                    },
                    label: {
                      fontWeight: 700,
                      color: "#ffffff",
                      padding: "2px 8px",
                    },
                  }}
                />

                {/* Vehicle Selector Dropdown filtered by category */}
                <Select
                  size="xs"
                  value={selectedVehicle}
                  onChange={(v) => handleVehicleChange(v || DEFAULT_VEHICLE_FOR_CATEGORY[category])}
                  data={getVehiclesByCategory(category).map((vc) => ({
                    value: vc.modelName,
                    label: vc.modelName,
                  }))}
                  leftSection={<IconCar size={15} color="#38bdf8" />}
                  styles={{
                    input: {
                      backgroundColor: "rgba(15, 23, 42, 0.8)",
                      borderColor: "rgba(255, 255, 255, 0.15)",
                      color: "#ffffff",
                      fontWeight: 700,
                      minWidth: "140px",
                    },
                  }}
                />

                {/* Modal View All 7 Vehicles button */}
                <Tooltip label={lang === "ru" ? "Галерея и характеристики 7 авто" : lang === "uzc" ? "7 та машина галереяси ва параметрлар" : "7 ta mashina galereyasi va parametrlar"}>
                  <Button
                    size="xs"
                    variant="light"
                    color="blue"
                    onClick={() => setVehicleModalOpen(true)}
                    style={{ fontWeight: 600, padding: "0 8px" }}
                  >
                    {lang === "ru" ? "Авто..." : lang === "uzc" ? "Машиналар..." : "Mashinalar..."}
                  </Button>
                </Tooltip>

                {/* Camera View Toggle Icon (Chase -> Cockpit -> Rear -> Top-Down -> Free) */}
                <Tooltip label={lang === "ru" ? "Сменить камеру (C)" : lang === "uzc" ? "Камерани алмаштириш (C)" : "Kamera ko'rinishi (C)"}>
                  <ActionIcon
                    size="md"
                    variant="subtle"
                    color="gray"
                    aria-label={t("a11y.cameraView", "Kamera ko'rinishini almashtirish")}
                    onClick={() =>
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
                  >
                    <IconCamera size={18} />
                  </ActionIcon>
                </Tooltip>

                {/* Camera Snapshot Icon */}
                <Tooltip label={lang === "ru" ? "Снимок экрана" : lang === "uzc" ? "Скриншот олиш" : "Skrinshot olish"}>
                  <ActionIcon size="md" variant="subtle" color="gray" aria-label={t("a11y.screenshot", "Skrinshot olish")}>
                    <IconDeviceFloppy size={18} />
                  </ActionIcon>
                </Tooltip>

                {/* Split Screen / PIP Icon */}
                <Tooltip label={lang === "ru" ? "Разделенный экран" : lang === "uzc" ? "Бўлинган экран" : "Bo'lingan экран"}>
                  <ActionIcon size="md" variant="subtle" color="gray" aria-label={t("a11y.splitScreen", "Bo'lingan ekran")}>
                    <IconLayersSubtract size={18} />
                  </ActionIcon>
                </Tooltip>

                {/* Fullscreen Toggle Icon */}
                <Tooltip label={isFullscreen ? (lang === "ru" ? "Выйти" : lang === "uzc" ? "Кичрайтириш" : "Kichraytirish") : (lang === "ru" ? "На весь экран" : lang === "uzc" ? "Тўлиқ экран" : "To'liq экран")}>
                  <ActionIcon
                    size="md"
                    variant="subtle"
                    color="gray"
                    onClick={toggleFullscreen}
                    aria-label={isFullscreen ? t("a11y.exitFullscreen", "To'liq ekrandan chiqish") : t("a11y.enterFullscreen", "To'liq ekran")}
                  >
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
                  {lang === "ru" ? "Завершить экзамен" : lang === "uzc" ? "Имтиҳонни якунлаш" : "Imtihonni yakunlash"}
                </Button>
              </Group>
            </Group>
          </Paper>

          {/* ========================================================= */}
          {/* CENTRAL 3D VIEWPORT WITH ALL FLOATING HUD OVERLAYS        */}
          {/* ========================================================= */}
          <Paper
            ref={simulatorContainerRef}
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
              backgroundColor: "#93c5fd",
              boxShadow: isFullscreen ? "none" : "0 12px 36px rgba(0, 0, 0, 0.4)",
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
                  category={category}
                  modelName={selectedVehicle}
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
                  category={category}
                  onCategoryChange={handleCategoryChange}
                  isFullscreen={isFullscreen}
                  onToggleFullscreen={toggleFullscreen}
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
                  onNextExercise={handleNextExercise}
                  onGearSelect={(g: GearMode) => {
                    controllerRef.current?.setGear(g);
                    setTelemetry((prev) => ({ ...prev, gear: g }));
                  }}
                  onHandbrakeToggle={() => {
                    const hb = controllerRef.current?.toggleHandbrake();
                    setTelemetry((prev) => ({ ...prev, handbrake: hb ?? !prev.handbrake }));
                  }}
                  onSeatbeltToggle={() => {
                    const sb = controllerRef.current?.toggleSeatbelt();
                    setTelemetry((prev) => ({ ...prev, seatbeltFastened: sb ?? !prev.seatbeltFastened }));
                  }}
                  onLightsToggle={() => {
                    const hl = controllerRef.current?.toggleLights();
                    setTelemetry((prev) => ({ ...prev, lowBeamsOn: hl ?? !prev.lowBeamsOn }));
                  }}
                  onTurnSignalToggle={(sig) => {
                    controllerRef.current?.toggleTurnSignal(sig);
                    setTelemetry((prev) => ({
                      ...prev,
                      turnSignal: prev.turnSignal === sig ? "none" : sig,
                    }));
                  }}
                  onThrottleChange={(val) => {
                    mobileThrottleRef.current = val;
                    if (val > 0) ensureAudioStarted();
                  }}
                  onBrakeChange={(val) => {
                    mobileBrakeRef.current = val;
                  }}
                  onSteerChange={(val) => {
                    mobileSteerRef.current = val;
                  }}
                  onClutchChange={(val) => {
                    mobileClutchRef.current = val;
                  }}
                  onHornTrigger={() => {
                    if (soundEnabled) {
                      audioEngine.startHorn();
                      setTimeout(() => audioEngine.stopHorn(), 350);
                    }
                  }}
                  onManualGearSelect={(g) => {
                    controllerRef.current?.setManualGear(g);
                    setTelemetry((prev) => ({ ...prev, manualGear: g }));
                  }}
                  exerciseResults={exerciseResultsMap}
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
        title={lang === "ru" ? "Завершение экзамена" : lang === "uzc" ? "Имтиҳонни якунлаш" : "Imtihonni yakunlash"}
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            {lang === "ru"
              ? "Вы действительно хотите завершить текущую попытку и перейти к результатам?"
              : lang === "uzc"
              ? "Ҳақиқатан ҳам амалий имтиҳонни якунлаб, натижаларни кўрмоқчимисиз?"
              : "Haqiqatan ham amaliy imtihonni yakunlab, natijalarni ko'rmoqchimisiz?"}
          </Text>
          <Group justify="flex-end" gap="xs">
            <Button variant="subtle" color="gray" onClick={() => setFinishModalOpen(false)}>
              {t("common.cancel", "Bekor qilish")}
            </Button>
            <Button color="red" onClick={handleFinishExam}>
              {lang === "ru" ? "Завершить" : lang === "uzc" ? "Якунлаш" : "Yakunlash"}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Vehicle Selector Gallery Modal */}
      <VehicleSelectorModal
        opened={vehicleModalOpen}
        onClose={() => setVehicleModalOpen(false)}
        selectedVehicle={selectedVehicle}
        onSelectVehicle={handleVehicleChange}
        currentCategory={category}
        onCategoryChange={handleCategoryChange}
      />
    </>
  );
}
