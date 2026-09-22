import { Paper, Group, Stack, Text, Badge, Box, ThemeIcon } from "@mantine/core";
import {
  IconCheck,
  IconClock,
  IconAlertTriangle,
  IconShieldCheck,
  IconBulb,
  IconArrowLeft,
  IconSteeringWheel,
  IconGauge,
} from "@tabler/icons-react";
import type { VehicleTelemetry, ExerciseDefinition, GearMode } from "../types";
import { useLanguage } from "../../../context/LanguageContext";

interface Props {
  exercise: ExerciseDefinition;
  telemetry: VehicleTelemetry;
  elapsedSeconds: number;
  totalPenalties: number;
  maxPenaltyAllowed: number;
  onSeatbeltToggle?: () => void;
  onLightsToggle?: () => void;
  onTurnSignalToggle?: (sig: "left" | "right" | "hazard") => void;
  onGearSelect?: (gear: GearMode) => void;
}

export default function ExerciseChecklistCard({
  exercise,
  telemetry,
  elapsedSeconds,
  totalPenalties,
  maxPenaltyAllowed,
  onSeatbeltToggle,
  onLightsToggle,
  onTurnSignalToggle,
  onGearSelect,
}: Props) {
  const { lang } = useLanguage();

  const getLoc = (obj: { uzl: string; uzc: string; ru: string }) => {
    if (lang === "ru") return obj.ru;
    if (lang === "uzc") return obj.uzc;
    return obj.uzl;
  };

  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const timeFormatted = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  const isFailed = totalPenalties >= maxPenaltyAllowed;

  // Checklist condition evaluations
  const isSeatbeltOk = telemetry.seatbeltFastened;
  const isLightsOk = telemetry.lowBeamsOn;
  const isSignalOk =
    exercise.number === 1
      ? telemetry.turnSignal === "left"
      : exercise.number === 7 || exercise.number === 11
      ? telemetry.gear === "R"
      : exercise.hasIncline
      ? telemetry.handbrake
      : true;

  const isGearOk =
    exercise.number === 7 || exercise.number === 11
      ? telemetry.gear === "R"
      : telemetry.gear === "D";

  const isMovementOk = telemetry.speed > 1.5;

  return (
    <Paper
      radius="md"
      withBorder
      style={{
        pointerEvents: "auto",
        backgroundColor: "rgba(15, 23, 42, 0.88)",
        backdropFilter: "blur(10px)",
        borderColor: "rgba(255, 255, 255, 0.18)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.45)",
        width: "300px",
        overflow: "hidden",
      }}
    >
      {/* Exercise Header */}
      <Box
        px="sm"
        py={8}
        style={{
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          backgroundColor: "rgba(30, 41, 59, 0.6)",
        }}
      >
        <Group justify="space-between" align="center" wrap="nowrap">
          <Group gap="xs" wrap="nowrap">
            <Badge color="blue" size="md" radius="sm" variant="filled">
              {exercise.number}
            </Badge>
            <Box style={{ overflow: "hidden" }}>
              <Text size="xs" fw={700} c="white" lineClamp={1}>
                {getLoc(exercise.title)}
              </Text>
              <Text size="9px" c="#94a3b8" lineClamp={1}>
                {getLoc(exercise.instructorGuide)}
              </Text>
            </Box>
          </Group>
        </Group>
      </Box>

      {/* Step-by-Step Interactive Checklist */}
      <Stack gap={6} p="xs">
        {/* Step 1: Seatbelt */}
        <Group
          justify="space-between"
          align="center"
          p={4}
          style={{
            cursor: "pointer",
            borderRadius: "6px",
            backgroundColor: isSeatbeltOk
              ? "rgba(34, 197, 94, 0.1)"
              : "rgba(255, 255, 255, 0.03)",
            border: `1px solid ${isSeatbeltOk ? "rgba(34, 197, 94, 0.3)" : "rgba(255, 255, 255, 0.06)"}`,
            transition: "all 0.15s ease",
          }}
          onClick={onSeatbeltToggle}
          title={lang === "ru" ? "Нажмите для переключения ремня (B)" : "Kamar holatini o'zgartirish (B)"}
        >
          <Group gap={6}>
            <IconShieldCheck size={14} color={isSeatbeltOk ? "#22c55e" : "#94a3b8"} />
            <Text size="11px" fw={600} c={isSeatbeltOk ? "#e2e8f0" : "#94a3b8"}>
              {lang === "ru" ? "Ремень безопасности" : "Xavfsizlik kamari taqilgan"}
            </Text>
          </Group>
          <ThemeIcon
            size={18}
            radius="xl"
            color={isSeatbeltOk ? "green" : "dark"}
            variant={isSeatbeltOk ? "filled" : "outline"}
          >
            {isSeatbeltOk && <IconCheck size={11} />}
          </ThemeIcon>
        </Group>

        {/* Step 2: Low-beam Headlights */}
        <Group
          justify="space-between"
          align="center"
          p={4}
          style={{
            cursor: "pointer",
            borderRadius: "6px",
            backgroundColor: isLightsOk
              ? "rgba(34, 197, 94, 0.1)"
              : "rgba(255, 255, 255, 0.03)",
            border: `1px solid ${isLightsOk ? "rgba(34, 197, 94, 0.3)" : "rgba(255, 255, 255, 0.06)"}`,
            transition: "all 0.15s ease",
          }}
          onClick={onLightsToggle}
          title={lang === "ru" ? "Нажмите для включения фар (L)" : "Chiroqlarni yoqish (L)"}
        >
          <Group gap={6}>
            <IconBulb size={14} color={isLightsOk ? "#22c55e" : "#94a3b8"} />
            <Text size="11px" fw={600} c={isLightsOk ? "#e2e8f0" : "#94a3b8"}>
              {lang === "ru" ? "Ближний свет фар" : "Yaqin chiroqlar yoqilgan"}
            </Text>
          </Group>
          <ThemeIcon
            size={18}
            radius="xl"
            color={isLightsOk ? "green" : "dark"}
            variant={isLightsOk ? "filled" : "outline"}
          >
            {isLightsOk && <IconCheck size={11} />}
          </ThemeIcon>
        </Group>

        {/* Step 3: Turn Signal / Specific Pre-Condition */}
        <Group
          justify="space-between"
          align="center"
          p={4}
          style={{
            cursor: "pointer",
            borderRadius: "6px",
            backgroundColor: isSignalOk
              ? "rgba(34, 197, 94, 0.1)"
              : "rgba(255, 255, 255, 0.03)",
            border: `1px solid ${isSignalOk ? "rgba(34, 197, 94, 0.3)" : "rgba(255, 255, 255, 0.06)"}`,
            transition: "all 0.15s ease",
          }}
          onClick={() => onTurnSignalToggle?.("left")}
          title={lang === "ru" ? "Поворотник (Q)" : "Burilish signali (Q)"}
        >
          <Group gap={6}>
            <IconArrowLeft size={14} color={isSignalOk ? "#22c55e" : "#94a3b8"} />
            <Text size="11px" fw={600} c={isSignalOk ? "#e2e8f0" : "#94a3b8"}>
              {exercise.number === 1
                ? lang === "ru"
                  ? "Левый сигнал поворота"
                  : "Chap burilish ko'rsatkichi"
                : exercise.hasIncline
                ? lang === "ru"
                  ? "Ручной тормоз на уклоне"
                  : "Qo'l tormozi tortilgan"
                : lang === "ru"
                ? "Контроль траектории"
                : "Yo'nalish nazorati"}
            </Text>
          </Group>
          <ThemeIcon
            size={18}
            radius="xl"
            color={isSignalOk ? "green" : "dark"}
            variant={isSignalOk ? "filled" : "outline"}
          >
            {isSignalOk && <IconCheck size={11} />}
          </ThemeIcon>
        </Group>

        {/* Step 4: Gear Selector */}
        <Group
          justify="space-between"
          align="center"
          p={4}
          style={{
            cursor: "pointer",
            borderRadius: "6px",
            backgroundColor: isGearOk
              ? "rgba(34, 197, 94, 0.1)"
              : "rgba(255, 255, 255, 0.03)",
            border: `1px solid ${isGearOk ? "rgba(34, 197, 94, 0.3)" : "rgba(255, 255, 255, 0.06)"}`,
            transition: "all 0.15s ease",
          }}
          onClick={() => onGearSelect?.(exercise.number === 7 || exercise.number === 11 ? "R" : "D")}
          title={lang === "ru" ? "Передача D или R" : "Uzatmani tanlash (D/R)"}
        >
          <Group gap={6}>
            <IconSteeringWheel size={14} color={isGearOk ? "#22c55e" : "#94a3b8"} />
            <Text size="11px" fw={600} c={isGearOk ? "#e2e8f0" : "#94a3b8"}>
              {exercise.number === 7 || exercise.number === 11
                ? lang === "ru"
                  ? "Селектор в 'R' (задний ход)"
                  : "Uzatma 'R' holatida"
                : lang === "ru"
                ? "Селектор в 'D' (Drive)"
                : "Uzatma 'D' holatida"}
            </Text>
          </Group>
          <ThemeIcon
            size={18}
            radius="xl"
            color={isGearOk ? "green" : "dark"}
            variant={isGearOk ? "filled" : "outline"}
          >
            {isGearOk && <IconCheck size={11} />}
          </ThemeIcon>
        </Group>

        {/* Step 5: Movement */}
        <Group
          justify="space-between"
          align="center"
          p={4}
          style={{
            borderRadius: "6px",
            backgroundColor: isMovementOk
              ? "rgba(34, 197, 94, 0.1)"
              : "rgba(255, 255, 255, 0.03)",
            border: `1px solid ${isMovementOk ? "rgba(34, 197, 94, 0.3)" : "rgba(255, 255, 255, 0.06)"}`,
          }}
        >
          <Group gap={6}>
            <IconGauge size={14} color={isMovementOk ? "#22c55e" : "#94a3b8"} />
            <Text size="11px" fw={600} c={isMovementOk ? "#e2e8f0" : "#94a3b8"}>
              {lang === "ru" ? "Начало движения" : "Harakatni boshlang"}
            </Text>
          </Group>
          <ThemeIcon
            size={18}
            radius="xl"
            color={isMovementOk ? "green" : "dark"}
            variant={isMovementOk ? "filled" : "outline"}
          >
            {isMovementOk && <IconCheck size={11} />}
          </ThemeIcon>
        </Group>
      </Stack>

      {/* Footer: Timer and Penalty Points Card */}
      <Box
        px="sm"
        py={6}
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          backgroundColor: "rgba(15, 23, 42, 0.95)",
        }}
      >
        <Group justify="space-between" align="center">
          {/* Timer */}
          <Group gap={4}>
            <IconClock size={14} color="#38bdf8" />
            <Text size="11px" fw={700} c="white" style={{ fontFamily: "monospace" }}>
              {timeFormatted}
            </Text>
          </Group>

          {/* Penalty Score */}
          <Group gap={4}>
            <IconAlertTriangle size={14} color={isFailed ? "#ef4444" : totalPenalties > 0 ? "#f59e0b" : "#22c55e"} />
            <Text
              size="11px"
              fw={800}
              c={isFailed ? "#ef4444" : totalPenalties > 0 ? "#f59e0b" : "#22c55e"}
            >
              {lang === "ru" ? "Штраф" : "Jarima"}: {totalPenalties} / {maxPenaltyAllowed}
            </Text>
          </Group>
        </Group>
      </Box>
    </Paper>
  );
}
