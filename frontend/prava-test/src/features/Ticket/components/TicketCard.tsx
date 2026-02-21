import {
  Card,
  Text,
  Group,
  Stack,
  Flex,
  Button,
  Divider,
  Progress,
  Badge,
} from "@mantine/core";
import { IconClock, IconQuestionMark, IconCheck, IconTrophy, IconPercentage } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../../hooks/useLanguage";
import type { Ticket } from "../types";
import classes from "./TicketCard.module.css";
import type { LocalizedText } from "../../../types";

interface TicketStats {
  ticketId: number;
  ticketNumber: number;
  ticketName: LocalizedText;
  totalExams: number;
  passedExams: number;
  averageScore: number;
  bestScore?: number;
  lastAttemptDate?: string;
}

interface TicketCardProps {
  ticket: Ticket;
  onClick?: (ticket: Ticket) => void;
  stats?: TicketStats;
}

export function TicketCard({ ticket, onClick, stats }: TicketCardProps) {
  const { t } = useTranslation();
  const { localize } = useLanguage();

  const hasStats = stats && stats.totalExams > 0;
  const avgScore = hasStats && Number.isFinite(stats.averageScore) ? Math.round(stats.averageScore) : 0;
  const scoreColor = avgScore >= 70 ? "green" : avgScore >= 50 ? "yellow" : "red";
  const passRate = hasStats ? Math.round((stats.passedExams / stats.totalExams) * 100) : 0;

  return (
    <Card
      withBorder
      shadow="sm"
      p="md"
      radius="md"
      className={hasStats ? classes.cardAttempted : classes.cardUnattempted}
      style={{
        cursor: onClick ? "pointer" : "default",
        borderLeftColor: hasStats
          ? `var(--mantine-color-${scoreColor}-5)`
          : undefined,
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick?.(ticket); }}
    >
      <Stack gap="sm">
        <Flex justify="space-between" align="flex-start" gap="sm">
          <Stack gap={4} style={{ flex: 1 }}>
            <Text fw={600} size="sm" lineClamp={2}>
              {localize(ticket.name)}
            </Text>
            {hasStats && (
              <Badge size="sm" variant="light" color={scoreColor}>
                {t("ticket.practiced")}
              </Badge>
            )}
          </Stack>
          <div className={classes.badge}>
            #{ticket.ticketNumber}
          </div>
        </Flex>

        <Group gap="xs" wrap="wrap">
          <Flex align="center" gap={4}>
            <IconQuestionMark size={14} color="var(--mantine-color-blue-5)" />
            <Text size="xs" c="dimmed">
              {ticket.questionCount} {t("package.questions")}
            </Text>
          </Flex>
          <Flex align="center" gap={4}>
            <IconClock size={14} color="var(--mantine-color-orange-5)" />
            <Text size="xs" c="dimmed">
              {ticket.durationMinutes} {t("ticket.minutes")}
            </Text>
          </Flex>
          <Flex align="center" gap={4}>
            <IconCheck size={14} color="var(--mantine-color-green-5)" />
            <Text size="xs" c="dimmed">
              {ticket.passingScore}%
            </Text>
          </Flex>
        </Group>

        {/* Result stats section */}
        {hasStats && (
          <>
            <Divider variant="dashed" />
            <Stack gap={6}>
              <Group justify="space-between" gap="xs">
                <Group gap={4}>
                  <IconTrophy size={14} color="var(--mantine-color-yellow-5)" />
                  <Text size="xs" c="dimmed">
                    {t("ticket.attempts")}: {stats.totalExams}
                  </Text>
                </Group>
                <Badge
                  size="sm"
                  variant="light"
                  color={stats.passedExams > 0 ? "green" : "gray"}
                >
                  {stats.passedExams}/{stats.totalExams}
                </Badge>
              </Group>
              <Group justify="space-between" gap="xs">
                <Group gap={4}>
                  <IconPercentage size={14} color="var(--mantine-color-blue-5)" />
                  <Text size="xs" c="dimmed">{t("ticket.passRate")}</Text>
                </Group>
                <Text size="xs" fw={600} c={passRate >= 50 ? "green" : "red"}>
                  {passRate}%
                </Text>
              </Group>
              <Group justify="space-between" gap="xs">
                <Text size="xs" c="dimmed">{t("ticket.avgScore")}</Text>
                <Text size="xs" fw={600} c={scoreColor}>{avgScore}%</Text>
              </Group>
              {stats.bestScore != null && (
                <Group justify="space-between" gap="xs">
                  <Text size="xs" c="dimmed">{t("ticket.bestScore")}</Text>
                  <Text size="xs" fw={600} c={stats.bestScore >= 70 ? "green" : "red"}>
                    {Math.round(stats.bestScore)}%
                  </Text>
                </Group>
              )}
              {stats.lastAttemptDate && (
                <Group justify="space-between" gap="xs">
                  <Text size="xs" c="dimmed">{t("ticket.lastAttempt")}</Text>
                  <Text size="xs" c="dimmed">
                    {new Date(stats.lastAttemptDate).toLocaleDateString()}
                  </Text>
                </Group>
              )}
              <Progress
                value={avgScore}
                color={scoreColor}
                size="sm"
                radius="xl"
              />
            </Stack>
          </>
        )}

        <Divider variant="dashed" />

        <Button
          onClick={() => onClick?.(ticket)}
          radius="md"
          size="sm"
          fullWidth
          className={classes.startButton}
        >
          {hasStats ? t("ticket.continue") : t("ticket.start")}
        </Button>
      </Stack>
    </Card>
  );
}
