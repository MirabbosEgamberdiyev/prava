import {
  Modal,
  SimpleGrid,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  useComputedColorScheme,
} from "@mantine/core";
import { IconEye, IconLock } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

export type ExamMode = "visible" | "secure" | "simple" | "explanatory";

interface ExamModeModalProps {
  opened: boolean;
  onClose: () => void;
  onSelect: (mode: ExamMode) => void;
}

export function ExamModeModal({ opened, onClose, onSelect }: ExamModeModalProps) {
  const { t } = useTranslation();
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("examMode.title")}
      centered
      size="md"
    >
      <SimpleGrid cols={2} spacing="md">
        <Paper
          p="lg"
          radius="md"
          withBorder
          ta="center"
          style={{
            cursor: "pointer",
            borderColor: "var(--mantine-color-green-5)",
            backgroundColor:
              computedColorScheme === "light"
                ? "var(--mantine-color-green-0)"
                : "var(--mantine-color-green-9)",
            transition: "transform 0.15s ease",
          }}
          onClick={() => {
            onSelect("visible");
            onClose();
          }}
        >
          <Stack align="center" gap="sm">
            <ThemeIcon size="xl" radius="xl" color="green" variant="light">
              <IconEye size={28} />
            </ThemeIcon>
            <Text fw={600}>{t("examMode.practice")}</Text>
            <Text size="xs" c="dimmed">
              {t("examMode.practiceDesc")}
            </Text>
          </Stack>
        </Paper>

        <Paper
          p="lg"
          radius="md"
          withBorder
          ta="center"
          style={{
            cursor: "pointer",
            borderColor: "var(--mantine-color-red-5)",
            backgroundColor:
              computedColorScheme === "light"
                ? "var(--mantine-color-red-0)"
                : "var(--mantine-color-red-9)",
            transition: "transform 0.15s ease",
          }}
          onClick={() => {
            onSelect("secure");
            onClose();
          }}
        >
          <Stack align="center" gap="sm">
            <ThemeIcon size="xl" radius="xl" color="red" variant="light">
              <IconLock size={28} />
            </ThemeIcon>
            <Text fw={600}>{t("examMode.realExam")}</Text>
            <Text size="xs" c="dimmed">
              {t("examMode.realExamDesc")}
            </Text>
          </Stack>
        </Paper>
      </SimpleGrid>
    </Modal>
  );
}
