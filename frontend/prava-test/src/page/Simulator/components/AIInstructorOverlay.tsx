import { Box, Paper, Group, Stack, Text, ThemeIcon, Transition } from "@mantine/core";
import {
  IconSteeringWheel,
  IconGauge,
  IconAlertTriangle,
  IconShieldCheck,
  IconInfoCircle,
} from "@tabler/icons-react";
import type { AIInstructorFeedback } from "../types";
import { useLanguage } from "../../../context/LanguageContext";

interface Props {
  feedback: AIInstructorFeedback | null;
}

export default function AIInstructorOverlay({ feedback }: Props) {
  const { lang } = useLanguage();

  if (!feedback) return null;

  const getLoc = (obj: { uzl: string; uzc: string; ru: string }) => {
    if (lang === "ru") return obj.ru;
    if (lang === "uzc") return obj.uzc;
    return obj.uzl;
  };

  const getCategoryIcon = () => {
    switch (feedback.category) {
      case "steering":
        return <IconSteeringWheel size={20} />;
      case "speed":
        return <IconGauge size={20} />;
      case "checklist":
        return <IconShieldCheck size={20} />;
      case "hazard":
        return <IconAlertTriangle size={20} />;
      default:
        return <IconInfoCircle size={20} />;
    }
  };

  const getColor = () => {
    switch (feedback.severity) {
      case "danger":
        return "red";
      case "warning":
        return "yellow";
      case "success":
        return "green";
      default:
        return "cyan";
    }
  };

  return (
    <Box
      style={{
        position: "absolute",
        top: 60,
        left: 12,
        right: 12,
        display: "flex",
        justifyContent: "center",
        zIndex: 35,
        pointerEvents: "none",
      }}
    >
      <Transition mounted={!!feedback} transition="slide-down" duration={250}>
        {(styles) => (
          <Paper
            style={{
              ...styles,
              backgroundColor: "rgba(15, 23, 42, 0.92)",
              backdropFilter: "blur(12px)",
              border: `1.5px solid var(--mantine-color-${getColor()}-6)`,
              boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
              padding: "6px 14px",
              borderRadius: 24,
              maxWidth: 480,
              width: "100%",
            }}
          >
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon color={getColor()} variant="light" size="md" radius="xl">
              {getCategoryIcon()}
            </ThemeIcon>
            <Stack gap={1} style={{ overflow: "hidden" }}>
              <Text size="11px" fw={700} c={getColor()} tt="uppercase" lineClamp={1}>
                {lang === "ru"
                  ? "Совет инструктора"
                  : lang === "uzc"
                  ? "Инструктор маслаҳати"
                  : "Yo'riqchi maslahati"}
              </Text>
              <Text size="xs" fw={600} c="white" lineClamp={2}>
                {getLoc(feedback.message)}
              </Text>
            </Stack>
          </Group>
        </Paper>
      )}
    </Transition>
    </Box>
  );
}
