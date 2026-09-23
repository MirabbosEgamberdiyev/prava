import { Modal, Stack, Group, Text, Badge, Paper, ThemeIcon, Button, ScrollArea } from "@mantine/core";
import { IconAlertTriangle, IconCheck, IconClock, IconPlayerPlay } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../../context/LanguageContext";
import type { PenaltyEvent } from "../types";

interface Props {
  opened: boolean;
  onClose: () => void;
  penalties: PenaltyEvent[];
  onSeekReplay?: (seconds: number) => void;
}

export default function ErrorJournalModal({
  opened,
  onClose,
  penalties,
  onSeekReplay,
}: Props) {
  const { t } = useTranslation();
  const { lang } = useLanguage();

  const getLoc = (obj: { uzl: string; uzc: string; ru: string }) => {
    if (lang === "ru") return obj.ru;
    if (lang === "uzc") return obj.uzc;
    return obj.uzl;
  };

  const totalPoints = penalties.reduce((sum, p) => sum + p.points, 0);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon color="red" variant="light" size="md">
            <IconAlertTriangle size={18} />
          </ThemeIcon>
          <Text fw={700} size="md">
            {t("simulator.errorJournalTitle", "Xatolar jurnali")}
          </Text>
          <Badge color={totalPoints >= 100 ? "red" : totalPoints > 0 ? "orange" : "green"} variant="filled">
            {totalPoints} {t("simulator.penaltyUnit", "ball")}
          </Badge>
        </Group>
      }
      size="lg"
      centered
      radius="md"
    >
      {penalties.length === 0 ? (
        <Paper p="xl" withBorder style={{ textAlign: "center", backgroundColor: "rgba(34, 197, 94, 0.05)" }}>
          <ThemeIcon size={48} radius="xl" color="green" variant="light" mb="sm">
            <IconCheck size={28} />
          </ThemeIcon>
          <Text fw={600} size="sm">
            {t("simulator.noErrorsRecorded", "Hozircha hech qanday xatolik qayd etilmadi")}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            {t("simulator.keepDrivingCarefully", "Avtomobilni ehtiyotkorlik bilan boshqarishda davom eting.")}
          </Text>
        </Paper>
      ) : (
        <ScrollArea.Autosize mah={480} offsetScrollbars>
          <Stack gap="xs">
            {penalties.map((penalty, idx) => {
              const isCritical = penalty.points >= 100;
              return (
                <Paper
                  key={penalty.id || idx}
                  p="sm"
                  radius="sm"
                  withBorder
                  style={{
                    borderColor: isCritical ? "#ef4444" : "rgba(255, 255, 255, 0.12)",
                    backgroundColor: isCritical ? "rgba(239, 68, 68, 0.08)" : "rgba(15, 23, 42, 0.4)",
                  }}
                >
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Stack gap={2} style={{ flex: 1 }}>
                      <Group gap="xs" wrap="wrap">
                        <Badge size="xs" color="gray" variant="outline" leftSection={<IconClock size={10} />}>
                          {formatTime(penalty.occurredAtSeconds)}
                        </Badge>
                        <Badge size="xs" color="blue" variant="light">
                          {t("simulator.exercise", "Mashq")} #{penalty.exerciseNumber}
                        </Badge>
                        <Badge
                          size="xs"
                          variant="filled"
                          color={isCritical ? "red" : penalty.points >= 20 ? "orange" : "yellow"}
                        >
                          -{penalty.points} {t("simulator.penaltyUnit", "ball")}
                        </Badge>
                      </Group>
                      <Text fw={700} size="xs" mt={2}>
                        {getLoc(penalty.title)}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {getLoc(penalty.explanation)}
                      </Text>
                    </Stack>

                    {onSeekReplay && (
                      <Button
                        size="compact-xs"
                        variant="light"
                        color="blue"
                        leftSection={<IconPlayerPlay size={12} />}
                        onClick={() => {
                          onSeekReplay(penalty.occurredAtSeconds);
                          onClose();
                        }}
                      >
                        {t("simulator.viewReplay", "Replay")}
                      </Button>
                    )}
                  </Group>
                </Paper>
              );
            })}
          </Stack>
        </ScrollArea.Autosize>
      )}
    </Modal>
  );
}
