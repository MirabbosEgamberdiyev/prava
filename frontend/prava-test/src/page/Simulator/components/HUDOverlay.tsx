import { useState } from "react";
import { Box, Group, Stack, Button, Badge, Text, ActionIcon, Modal, Tooltip } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconMap, IconChecklist, IconEye, IconAlertTriangle, IconMaximize, IconMinimize } from "@tabler/icons-react";
import type {
  VehicleTelemetry,
  ExerciseDefinition,
  CameraView,
  GearMode,
  ExerciseAttemptResult,
  PenaltyEvent,
  VehicleCategory,
} from "../types";
import { useLanguage } from "../../../context/LanguageContext";
import { useTranslation } from "react-i18next";
import AutodromeMiniMap from "./AutodromeMiniMap";
import ExerciseChecklistCard from "./ExerciseChecklistCard";
import ExamStatusCard from "./ExamStatusCard";
import DrivingControlsHUD from "./DrivingControlsHUD";
import MirrorsHUD from "./MirrorsHUD";
import ErrorJournalModal from "./ErrorJournalModal";

interface Props {
  telemetry: VehicleTelemetry;
  exercise: ExerciseDefinition;
  elapsedSeconds: number;
  totalPenalties: number;
  maxPenaltyAllowed: number;
  cameraView: CameraView;
  soundEnabled: boolean;
  onCameraToggle: () => void;
  onSoundToggle: () => void;
  onNextExercise?: () => void;
  onGearSelect?: (gear: GearMode) => void;
  onHandbrakeToggle?: () => void;
  onSeatbeltToggle?: () => void;
  onLightsToggle?: () => void;
  onTurnSignalToggle?: (sig: "left" | "right" | "hazard") => void;
  exerciseResults?: Record<number, ExerciseAttemptResult>;
  penalties?: PenaltyEvent[];
  category?: VehicleCategory;
  onCategoryChange?: (cat: VehicleCategory) => void;
  onSeekReplay?: (seconds: number) => void;
  onThrottleChange?: (val: number) => void;
  onBrakeChange?: (val: number) => void;
  onSteerChange?: (val: number) => void;
  onClutchChange?: (val: number) => void;
  onHornTrigger?: () => void;
  showClutch?: boolean;
  manualGear?: "R" | "N" | "1" | "2" | "3" | "4" | "5";
  onManualGearSelect?: (gear: "R" | "N" | "1" | "2" | "3" | "4" | "5") => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export default function HUDOverlay({
  telemetry,
  exercise,
  elapsedSeconds,
  totalPenalties,
  maxPenaltyAllowed,
  cameraView,
  soundEnabled,
  onCameraToggle,
  onSoundToggle,
  onNextExercise,
  onGearSelect,
  onHandbrakeToggle,
  onSeatbeltToggle,
  onLightsToggle,
  onTurnSignalToggle,
  exerciseResults,
  penalties,
  category,
  onSeekReplay,
  onThrottleChange,
  onBrakeChange,
  onSteerChange,
  onClutchChange,
  onHornTrigger,
  showClutch = false,
  manualGear,
  onManualGearSelect,
  isFullscreen = false,
  onToggleFullscreen,
}: Props) {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isCompactHeight = useMediaQuery("(max-height: 620px)");
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [miniMapExpanded, setMiniMapExpanded] = useState(false);
  const [mirrorsOpen, setMirrorsOpen] = useState(false);
  const [errorJournalOpen, setErrorJournalOpen] = useState(false);

  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const timeFormatted = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  const getLoc = (obj: { uzl: string; uzc: string; ru: string }) => {
    if (lang === "ru") return obj.ru;
    if (lang === "uzc") return obj.uzc;
    return obj.uzl;
  };

  return (
    <>
      <Box
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: isMobile ? "6px" : "10px",
          zIndex: 20,
        }}
      >
        {/* 1. TOP HUD: Responsive Top Row */}
        {isMobile ? (
          <Group justify="space-between" align="center" wrap="nowrap" style={{ width: "100%", pointerEvents: "auto" }}>
            {/* Left: Station Pill Button */}
            <Button
              size="xs"
              variant="filled"
              radius="xl"
              leftSection={
                <Badge color="blue" size="xs" circle>
                  {exercise.number}
                </Badge>
              }
              onClick={() => setChecklistModalOpen(true)}
              style={{
                backgroundColor: "rgba(15, 23, 42, 0.88)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                maxWidth: "140px",
                height: 28,
                padding: "0 8px",
              }}
            >
              <Text size="11px" fw={700} truncate c="white">
                {getLoc(exercise.title)}
              </Text>
            </Button>

            {/* Center: Penalty & Time Badges */}
            <Group gap={4} wrap="nowrap">
              <Badge
                size="sm"
                color={totalPenalties >= maxPenaltyAllowed ? "red" : totalPenalties > 0 ? "orange" : "gray"}
                variant="filled"
                style={{
                  backgroundColor: totalPenalties >= maxPenaltyAllowed ? "#ef4444" : "rgba(15, 23, 42, 0.88)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                }}
              >
                {totalPenalties}/{maxPenaltyAllowed}
              </Badge>
              <Badge
                size="sm"
                variant="filled"
                color="dark"
                style={{
                  backgroundColor: "rgba(15, 23, 42, 0.88)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  fontFamily: "monospace",
                }}
              >
                {timeFormatted}
              </Badge>
            </Group>

            {/* Right: Quick Action Icons (Mirrors, Errors, Map) */}
            <Group gap={4} wrap="nowrap">
              {/* Mirrors Toggle */}
              <Tooltip label={t("simulator.mirrors", "Ko'zgular")}>
                <ActionIcon
                  size="md"
                  variant="filled"
                  color={mirrorsOpen ? "blue" : "dark"}
                  radius="xl"
                  onClick={() => setMirrorsOpen((prev) => !prev)}
                  aria-label={t("simulator.mirrors", "Ko'zgular")}
                  style={{
                    backgroundColor: mirrorsOpen ? undefined : "rgba(15, 23, 42, 0.88)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                  }}
                >
                  <IconEye size={16} />
                </ActionIcon>
              </Tooltip>

              {/* Error Journal Trigger */}
              <Tooltip label={t("simulator.errorJournalTitle", "Xatolar jurnali")}>
                <ActionIcon
                  size="md"
                  variant="filled"
                  color={(penalties?.length || 0) > 0 ? "orange" : "dark"}
                  radius="xl"
                  onClick={() => setErrorJournalOpen(true)}
                  aria-label={t("simulator.errorJournalTitle", "Xatolar jurnali")}
                  style={{
                    backgroundColor: (penalties?.length || 0) > 0 ? undefined : "rgba(15, 23, 42, 0.88)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                  }}
                >
                  <IconAlertTriangle size={16} />
                </ActionIcon>
              </Tooltip>

              {/* Map Toggle */}
              <Tooltip label={t("simulator.map", "Xarita")}>
                <ActionIcon
                  size="md"
                  variant="filled"
                  color={miniMapExpanded ? "blue" : "dark"}
                  radius="xl"
                  onClick={() => setMiniMapExpanded((prev) => !prev)}
                  aria-label={t("simulator.map", "Xarita")}
                  style={{
                    backgroundColor: miniMapExpanded ? undefined : "rgba(15, 23, 42, 0.88)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                  }}
                >
                  <IconMap size={16} />
                </ActionIcon>
              </Tooltip>

              {/* Fullscreen Toggle */}
              {onToggleFullscreen && (
                <Tooltip label={isFullscreen ? (lang === "ru" ? "Выйти" : "Kichraytirish") : (lang === "ru" ? "На весь экран" : "To'liq ekran")}>
                  <ActionIcon
                    size="md"
                    variant="filled"
                    color="dark"
                    radius="xl"
                    onClick={onToggleFullscreen}
                    aria-label={t("simulator.fullscreen", "To'liq ekran")}
                    style={{
                      backgroundColor: "rgba(15, 23, 42, 0.88)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                    }}
                  >
                    {isFullscreen ? <IconMinimize size={16} /> : <IconMaximize size={16} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
          </Group>
        ) : (
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            {/* Top-Left: Checklist Card (6 steps + tip box) */}
            <ExerciseChecklistCard
              exercise={exercise}
              telemetry={telemetry}
              onSeatbeltToggle={onSeatbeltToggle}
              onLightsToggle={onLightsToggle}
              onTurnSignalToggle={onTurnSignalToggle}
              onGearSelect={onGearSelect}
              onHandbrakeToggle={onHandbrakeToggle}
            />

            {/* Top-Right: Quick Toolbar, Autodrome Mini-Map Radar & Exam Status Card */}
            <Stack gap="xs" align="flex-end">
              <Group gap={6} wrap="nowrap" style={{ pointerEvents: "auto" }}>
                {category && (
                  <Badge
                    size="sm"
                    variant="filled"
                    color="blue"
                    style={{
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      backgroundColor: "rgba(15, 23, 42, 0.88)",
                    }}
                  >
                    {t("simulator.category", "Kategoriya")}: {category}
                  </Badge>
                )}
                <Button
                  size="xs"
                  variant={mirrorsOpen ? "filled" : "default"}
                  color="blue"
                  leftSection={<IconEye size={14} />}
                  onClick={() => setMirrorsOpen((prev) => !prev)}
                  style={{
                    backgroundColor: mirrorsOpen ? undefined : "rgba(15, 23, 42, 0.88)",
                    color: "white",
                    borderColor: "rgba(255, 255, 255, 0.15)",
                    height: 28,
                  }}
                >
                  {t("simulator.mirrors", "Ko'zgular")}
                </Button>

                {onToggleFullscreen && (
                  <Tooltip label={isFullscreen ? (lang === "ru" ? "Выйти из полноэкранного" : "Kichraytirish") : (lang === "ru" ? "На весь экран" : "To'liq ekran")}>
                    <ActionIcon
                      size="sm"
                      variant="filled"
                      color="dark"
                      radius="sm"
                      onClick={onToggleFullscreen}
                      style={{
                        backgroundColor: "rgba(15, 23, 42, 0.88)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        height: 28,
                        width: 28,
                      }}
                    >
                      {isFullscreen ? <IconMinimize size={15} /> : <IconMaximize size={15} />}
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>

              <AutodromeMiniMap
                telemetry={telemetry}
                currentExercise={exercise}
                cameraView={cameraView}
                soundEnabled={soundEnabled}
                onCameraToggle={onCameraToggle}
                onSoundToggle={onSoundToggle}
                exerciseResults={exerciseResults}
              />

              {/* Middle-Right: Exam Status Card (Penalties + Timer + Next button + Error Journal) */}
              <ExamStatusCard
                totalPenalties={totalPenalties}
                maxPenaltyAllowed={maxPenaltyAllowed}
                elapsedSeconds={elapsedSeconds}
                onNextExercise={onNextExercise}
                onOpenErrorJournal={() => setErrorJournalOpen(true)}
                penaltiesCount={penalties?.length || 0}
                compact={Boolean(isCompactHeight)}
              />
            </Stack>
          </Group>
        )}

        {/* Floating Mini-Map on Mobile when user taps Map icon */}
        {isMobile && miniMapExpanded && (
          <Box
            style={{
              position: "absolute",
              top: 42,
              right: 8,
              zIndex: 35,
              pointerEvents: "auto",
            }}
          >
            <AutodromeMiniMap
              telemetry={telemetry}
              currentExercise={exercise}
              cameraView={cameraView}
              soundEnabled={soundEnabled}
              onCameraToggle={onCameraToggle}
              onSoundToggle={onSoundToggle}
              exerciseResults={exerciseResults}
            />
          </Box>
        )}

        {/* 2. BOTTOM HUD: Master Collision-Free Driving Controls System */}
        <DrivingControlsHUD
          telemetry={telemetry}
          activeGear={telemetry.gear}
          handbrakeActive={telemetry.handbrake}
          onThrottleChange={onThrottleChange || (() => {})}
          onBrakeChange={onBrakeChange || (() => {})}
          onSteerChange={onSteerChange || (() => {})}
          onClutchChange={onClutchChange}
          onGearSelect={onGearSelect || (() => {})}
          onHandbrakeToggle={onHandbrakeToggle || (() => {})}
          onHornTrigger={onHornTrigger}
          onCameraToggle={onCameraToggle}
          onSeatbeltToggle={onSeatbeltToggle}
          onLightsToggle={onLightsToggle}
          onTurnSignalToggle={onTurnSignalToggle}
          showClutch={telemetry.transmissionMode === "manual" || showClutch}
          manualGear={telemetry.manualGear || manualGear}
          onManualGearSelect={onManualGearSelect}
        />
      </Box>

      {/* Mobile Checklist Modal */}
      {isMobile && (
        <Modal
          opened={checklistModalOpen}
          onClose={() => setChecklistModalOpen(false)}
          title={
            <Group gap="xs">
              <IconChecklist size={20} color="#38bdf8" />
              <Text fw={700} size="sm">
                {exercise.number}-mashq qoidalari
              </Text>
            </Group>
          }
          radius="md"
          size="sm"
          styles={{
            body: { padding: 8 },
          }}
        >
          <ExerciseChecklistCard
            exercise={exercise}
            telemetry={telemetry}
            onSeatbeltToggle={onSeatbeltToggle}
            onLightsToggle={onLightsToggle}
            onTurnSignalToggle={onTurnSignalToggle}
            onGearSelect={onGearSelect}
            onHandbrakeToggle={onHandbrakeToggle}
          />
        </Modal>
      )}

      {/* 3. Floating Wing & Center Rearview Mirrors HUD */}
      {mirrorsOpen && (
        <MirrorsHUD telemetry={telemetry} onClose={() => setMirrorsOpen(false)} />
      )}

      {/* 4. Live Error Journal Modal */}
      <ErrorJournalModal
        opened={errorJournalOpen}
        onClose={() => setErrorJournalOpen(false)}
        penalties={penalties || []}
        onSeekReplay={onSeekReplay}
      />
    </>
  );
}
