import { Box, Group } from "@mantine/core";
import type { VehicleTelemetry, ExerciseDefinition, CameraView, GearMode } from "../types";
import AutodromeMiniMap from "./AutodromeMiniMap";
import ExerciseChecklistCard from "./ExerciseChecklistCard";
import InstrumentCluster from "./InstrumentCluster";

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
  onGearSelect?: (gear: GearMode) => void;
  onHandbrakeToggle?: () => void;
  onSeatbeltToggle?: () => void;
  onLightsToggle?: () => void;
  onTurnSignalToggle?: (sig: "left" | "right" | "hazard") => void;
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
  onGearSelect,
  onHandbrakeToggle,
  onSeatbeltToggle,
  onLightsToggle,
  onTurnSignalToggle,
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
        padding: "12px",
        zIndex: 20,
      }}
    >
      {/* Top HUD: Top-Left Checklist Card & Top-Right Autodrome Mini-Map */}
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        {/* Top-Left Exercise Checklist Card */}
        <ExerciseChecklistCard
          exercise={exercise}
          telemetry={telemetry}
          elapsedSeconds={elapsedSeconds}
          totalPenalties={totalPenalties}
          maxPenaltyAllowed={maxPenaltyAllowed}
          onSeatbeltToggle={onSeatbeltToggle}
          onLightsToggle={onLightsToggle}
          onTurnSignalToggle={onTurnSignalToggle}
          onGearSelect={onGearSelect}
        />

        {/* Top-Right Autodrome Mini-Map */}
        <AutodromeMiniMap
          telemetry={telemetry}
          currentExercise={exercise}
          cameraView={cameraView}
          soundEnabled={soundEnabled}
          onCameraToggle={onCameraToggle}
          onSoundToggle={onSoundToggle}
        />
      </Group>

      {/* Bottom HUD: Photorealistic Instrument Cluster */}
      <Box style={{ width: "100%", pointerEvents: "auto" }}>
        <InstrumentCluster
          telemetry={telemetry}
          onGearSelect={onGearSelect}
          onHandbrakeToggle={onHandbrakeToggle}
          onSeatbeltToggle={onSeatbeltToggle}
          onLightsToggle={onLightsToggle}
          onTurnSignalToggle={onTurnSignalToggle}
        />
      </Box>
    </Box>
  );
}
