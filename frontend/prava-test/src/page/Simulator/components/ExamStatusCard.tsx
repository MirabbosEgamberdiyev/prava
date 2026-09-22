import { Paper, Stack, Group, Text, Button, Box } from "@mantine/core";
import { IconAlertTriangle, IconClock, IconArrowRight } from "@tabler/icons-react";
import { useLanguage } from "../../../context/LanguageContext";

interface Props {
  totalPenalties: number;
  maxPenaltyAllowed: number;
  elapsedSeconds: number;
  maxTimeSeconds?: number;
  onNextExercise?: () => void;
}

export default function ExamStatusCard({
  totalPenalties,
  maxPenaltyAllowed = 100,
  elapsedSeconds,
  maxTimeSeconds = 1500, // 25:00 minutes
  onNextExercise,
}: Props) {
  const { lang } = useLanguage();

  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const timeFormatted = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  const maxMins = Math.floor(maxTimeSeconds / 60);
  const maxSecs = maxTimeSeconds % 60;
  const maxTimeFormatted = `${maxMins.toString().padStart(2, "0")}:${maxSecs.toString().padStart(2, "0")}`;

  const isFailed = totalPenalties >= maxPenaltyAllowed;

  return (
    <Paper
      radius="md"
      withBorder
      p="sm"
      style={{
        pointerEvents: "auto",
        backgroundColor: "rgba(15, 23, 42, 0.88)",
        backdropFilter: "blur(12px)",
        borderColor: "rgba(255, 255, 255, 0.16)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.45)",
        width: "220px",
      }}
    >
      <Stack gap="xs">
        {/* Jarima ballari (Penalty points) */}
        <Box>
          <Text size="xs" c="#94a3b8" fw={500} mb={2}>
            {lang === "ru" ? "Штрафные баллы" : "Jarima ballari"}
          </Text>
          <Group gap={6} align="center">
            <IconAlertTriangle
              size={18}
              color={isFailed ? "#ef4444" : totalPenalties > 0 ? "#f59e0b" : "#eab308"}
            />
            <Text
              fw={900}
              size="lg"
              c={isFailed ? "#ef4444" : totalPenalties > 0 ? "#f59e0b" : "white"}
              style={{ fontFamily: "monospace" }}
            >
              {totalPenalties} / {maxPenaltyAllowed}
            </Text>
          </Group>
        </Box>

        {/* Vaqt (Time elapsed / limit) */}
        <Box>
          <Text size="xs" c="#94a3b8" fw={500} mb={2}>
            {lang === "ru" ? "Время" : "Vaqt"}
          </Text>
          <Group gap={6} align="center">
            <IconClock size={18} color="#38bdf8" />
            <Text fw={800} size="md" c="white" style={{ fontFamily: "monospace" }}>
              {timeFormatted}{" "}
              <Text span size="xs" c="#64748b">
                / {maxTimeFormatted}
              </Text>
            </Text>
          </Group>
        </Box>

        {/* Keyingi mashqqa o'tish (Advance to next exercise) */}
        <Button
          fullWidth
          size="xs"
          color="blue"
          variant="filled"
          rightSection={<IconArrowRight size={14} />}
          onClick={onNextExercise}
          style={{
            fontWeight: 700,
            boxShadow: "0 4px 14px rgba(2, 132, 199, 0.4)",
          }}
        >
          {lang === "ru" ? "Следующее упражнение" : "Keyingi mashqqa o'tish"}
        </Button>
      </Stack>
    </Paper>
  );
}
