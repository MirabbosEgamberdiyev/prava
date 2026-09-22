import { Box, Group, Stack } from "@mantine/core";
import type { VehicleTelemetry, ExerciseDefinition, CameraView, GearMode, ExerciseAttemptResult } from "../types";
import AutodromeMiniMap from "./AutodromeMiniMap";
import ExerciseChecklistCard from "./ExerciseChecklistCard";
import ExamStatusCard from "./ExamStatusCard";
import FloatingControlsTiles from "./FloatingControlsTiles";
import InstrumentCluster from "./InstrumentCluster";
import GearStickWidget from "./GearStickWidget";

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
}: Props) {
  return (
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
        padding: "10px",
        zIndex: 20,
      }}
    >
      {/* 1. TOP HUD: Top-Left Checklist Card & Top-Right Mini-Map */}
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

        {/* Top-Right: Autodrome Mini-Map Radar & Exam Status Card below it */}
        <Stack gap="xs" align="flex-end">
          <AutodromeMiniMap
            telemetry={telemetry}
            currentExercise={exercise}
            cameraView={cameraView}
            soundEnabled={soundEnabled}
            onCameraToggle={onCameraToggle}
            onSoundToggle={onSoundToggle}
            exerciseResults={exerciseResults}
          />

          {/* Middle-Right: Exam Status Card (Penalties + Timer + Next button) */}
          <ExamStatusCard
            totalPenalties={totalPenalties}
            maxPenaltyAllowed={maxPenaltyAllowed}
            elapsedSeconds={elapsedSeconds}
            onNextExercise={onNextExercise}
          />
        </Stack>
      </Group>

      {/* 2. BOTTOM HUD: Floating Controls, Instrument Cluster, and PRND Gear Stick */}
      <Group justify="space-between" align="flex-end" wrap="nowrap">
        {/* Bottom-Left: Keyboard Controls & Shortcuts Tiles */}
        <FloatingControlsTiles />

        {/* Bottom-Center: Realistic Vehicle Dashboard Instrument Cluster */}
        <Box style={{ flex: 1, maxWidth: "500px", margin: "0 auto" }}>
          <InstrumentCluster
            telemetry={telemetry}
            onHandbrakeToggle={onHandbrakeToggle}
            onSeatbeltToggle={onSeatbeltToggle}
            onLightsToggle={onLightsToggle}
            onTurnSignalToggle={onTurnSignalToggle}
          />
        </Box>

        {/* Bottom-Right: PRND Stick & Vertical Pedal Sliders */}
        <GearStickWidget
          gear={telemetry.gear}
          throttle={telemetry.throttle}
          brake={telemetry.brake}
          onGearSelect={onGearSelect}
        />
      </Group>
    </Box>
  );
}
