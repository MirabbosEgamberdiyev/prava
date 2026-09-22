import { Paper, Group, Text, Badge, RingProgress, Stack, Box, ActionIcon, Tooltip } from "@mantine/core";
import {
  IconClock,
  IconAlertTriangle,
  IconArrowLeft,
  IconArrowRight,
  IconCamera,
  IconVolume,
  IconVolumeOff,
} from "@tabler/icons-react";
import type { VehicleTelemetry, ExerciseDefinition, CameraView } from "../types";
import { useLanguage } from "../../../context/LanguageContext";

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
}: Props) {
  const { lang } = useLanguage();

  const getLoc = (obj: { uzl: string; uzc: string; ru: string }) => {
    if (lang === "ru") return obj.ru;
    if (lang === "uzc") return obj.uzc;
    return obj.uzl;
  };

  const isFailed = totalPenalties >= 100;
  const speedPercentage = Math.min(100, (telemetry.speed / 50) * 100);

  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const timeFormatted = `${mins}:${secs.toString().padStart(2, "0")}`;

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
      {/* Top HUD: Exercise Title, Time, Score & Camera Controls */}
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        {/* Current Exercise Badge */}
        <Paper
          p="xs"
          radius="md"
          withBorder
          style={{
            pointerEvents: "auto",
            backgroundColor: "rgba(26, 37, 47, 0.85)",
            backdropFilter: "blur(6px)",
            borderColor: "rgba(255, 255, 255, 0.15)",
            maxWidth: "380px",
          }}
        >
          <Group gap="xs" wrap="nowrap">
            <Badge color="blue" size="lg" radius="sm">
              {exercise.number}
            </Badge>
            <Box>
              <Text size="xs" c="dimmed">
                {lang === "ru" ? "Текущее упражнение" : "Joriy mashq"}
              </Text>
              <Text size="sm" fw={700} c="white" lineClamp={1}>
                {getLoc(exercise.title)}
              </Text>
            </Box>
          </Group>
        </Paper>

        {/* Score & Time & Settings */}
        <Group gap="xs" style={{ pointerEvents: "auto" }}>
          {/* Timer */}
          <Paper
            px="sm"
            py="xs"
            radius="md"
            withBorder
            style={{
              backgroundColor: "rgba(26, 37, 47, 0.85)",
              backdropFilter: "blur(6px)",
              borderColor: "rgba(255, 255, 255, 0.15)",
            }}
          >
            <Group gap={6}>
              <IconClock size={16} color="#3498db" />
              <Text size="sm" fw={700} c="white" style={{ fontFamily: "monospace" }}>
                {timeFormatted}
              </Text>
            </Group>
          </Paper>

          {/* Penalty Score */}
          <Paper
            px="sm"
            py="xs"
            radius="md"
            withBorder
            style={{
              backgroundColor: "rgba(26, 37, 47, 0.85)",
              backdropFilter: "blur(6px)",
              borderColor: isFailed ? "#e74c3c" : "rgba(255, 255, 255, 0.15)",
            }}
          >
            <Group gap={6}>
              <IconAlertTriangle size={16} color={isFailed ? "#e74c3c" : "#f39c12"} />
              <Text
                size="sm"
                fw={800}
                c={isFailed ? "#e74c3c" : totalPenalties > 0 ? "#f39c12" : "#2ecc71"}
              >
                {totalPenalties} / {maxPenaltyAllowed}
              </Text>
            </Group>
          </Paper>

          {/* Camera View Switcher */}
          <Tooltip label={`Kamera: ${cameraView}`}>
            <ActionIcon
              size="lg"
              radius="md"
              variant="filled"
              color="dark"
              style={{ backgroundColor: "rgba(26, 37, 47, 0.85)" }}
              onClick={onCameraToggle}
            >
              <IconCamera size={18} />
            </ActionIcon>
          </Tooltip>

          {/* Sound Toggle */}
          <Tooltip label={soundEnabled ? "Ovozni o'chirish" : "Ovozni yoqish"}>
            <ActionIcon
              size="lg"
              radius="md"
              variant="filled"
              color={soundEnabled ? "blue" : "dark"}
              style={{ backgroundColor: "rgba(26, 37, 47, 0.85)" }}
              onClick={onSoundToggle}
            >
              {soundEnabled ? <IconVolume size={18} /> : <IconVolumeOff size={18} />}
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      {/* Bottom HUD: Speedometer, Gear, RPM, Handbrake */}
      <Group justify="space-between" align="flex-end">
        {/* Speedometer & RPM Gauges */}
        <Paper
          p="xs"
          radius="lg"
          withBorder
          style={{
            pointerEvents: "auto",
            backgroundColor: "rgba(26, 37, 47, 0.9)",
            backdropFilter: "blur(8px)",
            borderColor: "rgba(255, 255, 255, 0.15)",
          }}
        >
          <Group gap="md" align="center">
            {/* Speed Gauge Ring */}
            <RingProgress
              size={90}
              thickness={8}
              roundCaps
              sections={[
                {
                  value: speedPercentage,
                  color: telemetry.speed > 35 ? "red" : telemetry.speed > 20 ? "orange" : "blue",
                },
              ]}
              label={
                <Box ta="center">
                  <Text fw={800} size="md" c="white" lh={1}>
                    {telemetry.speed}
                  </Text>
                  <Text size="9px" c="dimmed" lh={1}>
                    km/h
                  </Text>
                </Box>
              }
            />

            {/* Gear & RPM & Handbrake Indicators */}
            <Stack gap={4}>
              {/* Gear Modes */}
              <Group gap={4}>
                {(["P", "R", "N", "D"] as const).map((g) => (
                  <Badge
                    key={g}
                    size="sm"
                    variant={telemetry.gear === g ? "filled" : "outline"}
                    color={telemetry.gear === g ? "blue" : "gray"}
                  >
                    {g}
                  </Badge>
                ))}
              </Group>

              <Group gap="xs">
                <Text size="xs" c="dimmed" style={{ fontFamily: "monospace" }}>
                  RPM: {telemetry.rpm}
                </Text>
                {telemetry.handbrake && (
                  <Badge size="xs" color="red" variant="filled">
                    PARK
                  </Badge>
                )}
              </Group>
            </Stack>
          </Group>
        </Paper>

        {/* Turn Signals and Incline info */}
        <Paper
          px="sm"
          py="xs"
          radius="md"
          withBorder
          style={{
            pointerEvents: "auto",
            backgroundColor: "rgba(26, 37, 47, 0.85)",
            backdropFilter: "blur(6px)",
            borderColor: "rgba(255, 255, 255, 0.15)",
          }}
        >
          <Group gap="xs">
            <ActionIcon
              size="sm"
              variant={telemetry.turnSignal === "left" ? "filled" : "subtle"}
              color={telemetry.turnSignal === "left" ? "green" : "gray"}
            >
              <IconArrowLeft size={14} />
            </ActionIcon>
            <ActionIcon
              size="sm"
              variant={telemetry.turnSignal === "right" ? "filled" : "subtle"}
              color={telemetry.turnSignal === "right" ? "green" : "gray"}
            >
              <IconArrowRight size={14} />
            </ActionIcon>
            {exercise.hasIncline && (
              <Badge size="xs" color="orange" variant="light">
                16% Qiyalik • Rollback: {telemetry.rollbackDistance}m
              </Badge>
            )}
          </Group>
        </Paper>
      </Group>
    </Box>
  );
}
