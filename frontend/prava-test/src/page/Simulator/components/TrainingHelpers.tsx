import { Paper, Group, Text, Badge, ThemeIcon } from "@mantine/core";
import { IconCompass, IconHandStop } from "@tabler/icons-react";
import type { VehicleTelemetry, ExerciseDefinition } from "../types";
import { useLanguage } from "../../../context/LanguageContext";

interface Props {
  telemetry: VehicleTelemetry;
  exercise: ExerciseDefinition;
}

export default function TrainingHelpers({ telemetry, exercise }: Props) {
  const { lang } = useLanguage();

  // Distance to target
  const dx = exercise.targetX - telemetry.posX;
  const dy = exercise.targetY - telemetry.posY;
  const distance = Math.round(Math.sqrt(dx * dx + dy * dy));

  // Determine steering recommendation
  const angleToTarget = Math.atan2(dy, dx);
  let diffAngle = angleToTarget - telemetry.rotation;
  while (diffAngle > Math.PI) diffAngle -= 2 * Math.PI;
  while (diffAngle < -Math.PI) diffAngle += 2 * Math.PI;

  let steerAdvice = lang === "ru" ? "Прямо" : "To'g'riga";
  if (diffAngle > 0.3) {
    steerAdvice = lang === "ru" ? "Поверните направо" : "O'ngga buring";
  } else if (diffAngle < -0.3) {
    steerAdvice = lang === "ru" ? "Поверните налево" : "Chapga buring";
  }

  const isBrakingZone = distance < 35 && telemetry.speed > 8;

  return (
    <Paper
      px="md"
      py="xs"
      radius="md"
      withBorder
      style={{
        backgroundColor: "rgba(24, 100, 171, 0.15)",
        backdropFilter: "blur(6px)",
        borderColor: "rgba(24, 100, 171, 0.35)",
      }}
    >
      <Group justify="space-between" align="center" wrap="wrap">
        <Group gap="xs">
          <ThemeIcon size="sm" color="cyan" variant="filled">
            <IconCompass size={14} />
          </ThemeIcon>
          <Text size="xs" fw={700} c="cyan">
            {lang === "ru" ? "Траектория:" : "Trayektoriya:"} {steerAdvice}
          </Text>
        </Group>

        {isBrakingZone && (
          <Badge color="red" variant="filled" size="sm" leftSection={<IconHandStop size={12} />}>
            {lang === "ru" ? "Зона торможения!" : "Tormozlash zonasi!"}
          </Badge>
        )}

        <Text size="xs" c="dimmed">
          {lang === "ru" ? "До цели:" : "Marragacha:"} {distance}m
        </Text>
      </Group>
    </Paper>
  );
}
