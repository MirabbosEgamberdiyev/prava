import { Paper, Group, Stack, Text, Badge, Box, ThemeIcon } from "@mantine/core";
import {
  IconCheck,
  IconBulb,
} from "@tabler/icons-react";
import type { VehicleTelemetry, ExerciseDefinition, GearMode } from "../types";
import { useLanguage } from "../../../context/LanguageContext";

interface Props {
  exercise: ExerciseDefinition;
  telemetry: VehicleTelemetry;
  onSeatbeltToggle?: () => void;
  onLightsToggle?: () => void;
  onTurnSignalToggle?: (sig: "left" | "right" | "hazard") => void;
  onGearSelect?: (gear: GearMode) => void;
  onHandbrakeToggle?: () => void;
}

export default function ExerciseChecklistCard({
  exercise,
  telemetry,
  onSeatbeltToggle,
  onLightsToggle,
  onTurnSignalToggle,
  onGearSelect,
  onHandbrakeToggle,
}: Props) {
  const { lang } = useLanguage();

  const getLoc = (obj: { uzl: string; uzc: string; ru: string }) => {
    if (lang === "ru") return obj.ru;
    if (lang === "uzc") return obj.uzc;
    return obj.uzl;
  };

  // 6 specific checklist items matching screenshot
  const isSeatbeltOk = telemetry.seatbeltFastened;
  const isLightsOk = telemetry.lowBeamsOn;
  const isSignalOk = telemetry.turnSignal === "left";
  const isGearOk = telemetry.gear === "D";
  const isHandbrakeReleased = !telemetry.handbrake;
  const isMovingOk = telemetry.speed > 1.5;

  const checklistItems = [
    {
      id: "seatbelt",
      label: {
        uzl: "Xavfsizlik kamari taqing",
        uzc: "Хавфсизлик камари тақинг",
        ru: "Пристегните ремень безопасности",
      },
      isPassed: isSeatbeltOk,
      onClick: onSeatbeltToggle,
    },
    {
      id: "lights",
      label: {
        uzl: "Yaqin chiroqlar yoqilsin",
        uzc: "Яқин чироқлар ёқилсин",
        ru: "Включите ближний свет фар",
      },
      isPassed: isLightsOk,
      onClick: onLightsToggle,
    },
    {
      id: "signal",
      label: {
        uzl: "Chap burilish ko'rsatkichi",
        uzc: "Чап бурилиш кўрсаткичи",
        ru: "Левый указатель поворота",
      },
      isPassed: isSignalOk,
      onClick: () => onTurnSignalToggle?.("left"),
    },
    {
      id: "gear",
      label: {
        uzl: "Boshqaruv D holatida",
        uzc: "Бошқарув D ҳолатида",
        ru: "Селектор в положении D",
      },
      isPassed: isGearOk,
      onClick: () => onGearSelect?.("D"),
    },
    {
      id: "handbrake",
      label: {
        uzl: "Ruchnikni tushiring",
        uzc: "Ручникни туширинг",
        ru: "Опустите стояночный тормоз",
      },
      isPassed: isHandbrakeReleased,
      onClick: onHandbrakeToggle,
    },
    {
      id: "speed",
      label: {
        uzl: "Sekin harakatlaning",
        uzc: "Секин ҳаракатланинг",
        ru: "Начните плавное движение",
      },
      isPassed: isMovingOk,
      onClick: undefined,
    },
  ];

  return (
    <Paper
      radius="md"
      withBorder
      style={{
        pointerEvents: "auto",
        backgroundColor: "rgba(15, 23, 42, 0.88)",
        backdropFilter: "blur(12px)",
        borderColor: "rgba(255, 255, 255, 0.16)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.45)",
        width: "290px",
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
        <Group gap="xs" wrap="nowrap" align="center">
          <Badge color="blue" size="lg" radius="sm" variant="filled" style={{ fontWeight: 800 }}>
            {exercise.number}
          </Badge>
          <Box>
            <Text size="10px" c="#94a3b8" fw={600}>
              {exercise.number} / 12
            </Text>
            <Text size="xs" fw={800} c="white" lineClamp={1}>
              {getLoc(exercise.title)}
            </Text>
          </Box>
        </Group>
      </Box>

      {/* Checklist items */}
      <Stack gap={5} p="xs">
        {checklistItems.map((item) => (
          <Group
            key={item.id}
            justify="space-between"
            align="center"
            p={4}
            style={{
              cursor: item.onClick ? "pointer" : "default",
              borderRadius: "6px",
              backgroundColor: item.isPassed
                ? "rgba(34, 197, 94, 0.12)"
                : "rgba(255, 255, 255, 0.03)",
              border: `1px solid ${item.isPassed ? "rgba(34, 197, 94, 0.35)" : "rgba(255, 255, 255, 0.06)"}`,
              transition: "all 0.15s ease",
            }}
            onClick={item.onClick}
          >
            <Group gap={8}>
              <ThemeIcon
                size={18}
                radius="xl"
                color={item.isPassed ? "green" : "gray"}
                variant={item.isPassed ? "filled" : "outline"}
                style={{
                  borderColor: item.isPassed ? undefined : "#64748b",
                  backgroundColor: item.isPassed ? undefined : "transparent",
                }}
              >
                {item.isPassed && <IconCheck size={11} />}
              </ThemeIcon>
              <Text size="11px" fw={item.isPassed ? 700 : 500} c={item.isPassed ? "white" : "#cbd5e1"}>
                {getLoc(item.label)}
              </Text>
            </Group>
          </Group>
        ))}

        {/* Maslahat (Tip box at bottom of card) */}
        <Paper
          p={8}
          radius="sm"
          mt={4}
          style={{
            backgroundColor: "rgba(2, 132, 199, 0.15)",
            border: "1px solid rgba(56, 189, 248, 0.3)",
          }}
        >
          <Group gap={6} align="flex-start" wrap="nowrap">
            <IconBulb size={16} color="#38bdf8" style={{ flexShrink: 0, marginTop: "1px" }} />
            <Box>
              <Text size="10px" fw={800} c="#38bdf8">
                {lang === "ru" ? "Совет" : "Maslahat"}
              </Text>
              <Text size="9.5px" c="#e2e8f0" lh={1.3}>
                {lang === "ru"
                  ? "Запустите двигатель, пристегните ремень и включите левый сигнал поворота."
                  : "Dvigatelni ishga tushiring, xavfsizlik kamarini taqing va chap burilish chirog'ini yoqing."}
              </Text>
            </Box>
          </Group>
        </Paper>
      </Stack>
    </Paper>
  );
}
