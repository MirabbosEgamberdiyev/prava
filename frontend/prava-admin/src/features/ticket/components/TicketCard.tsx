// features/ticket/components/TicketCard.tsx

import {
  Card,
  Text,
  Badge,
  Group,
  Stack,
  ActionIcon,
  Menu,
  rem,
} from "@mantine/core";
import {
  IconEdit,
  IconTrash,
  IconDots,
  IconClock,
  IconClipboardList,
  IconTarget,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { TicketListItem, TranslatedField } from "../types";
import Cookies from "js-cookie";

function getTranslated(field: TranslatedField): string {
  const lang = (Cookies.get("i18next") || "uzl") as keyof TranslatedField;
  return field?.[lang] || field?.uzl || "";
}

interface TicketCardProps {
  ticket: TicketListItem;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export function TicketCard({
  ticket,
  onEdit,
  onDelete,
}: TicketCardProps) {
  const { t } = useTranslation();

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="sm">
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs" wrap="nowrap">
            <Badge color="blue" variant="filled" size="lg">
              #{ticket.ticketNumber}
            </Badge>
            <Text fw={700} size="lg" lineClamp={1}>
              {getTranslated(ticket.name)}
            </Text>
          </Group>
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray">
                <IconDots size={18} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconEdit style={{ width: rem(14) }} />}
                onClick={() => onEdit(ticket.id)}
              >
                {t("tickets.editAction")}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<IconTrash style={{ width: rem(14) }} />}
                onClick={() => onDelete(ticket.id)}
              >
                {t("tickets.deleteAction")}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>

        <Text size="sm" c="dimmed" lineClamp={2} mih={40}>
          {getTranslated(ticket.description)}
        </Text>

        <Group gap="xs">
          {ticket.topicName && (
            <Badge color="grape" variant="light">
              {getTranslated(ticket.topicName)}
            </Badge>
          )}
          {ticket.packageName && (
            <Badge color="orange" variant="light">
              {getTranslated(ticket.packageName)}
            </Badge>
          )}
        </Group>

        <Stack gap="xs">
          <Group gap="xs">
            <IconClipboardList size={16} color="gray" />
            <Text size="sm" c="dimmed">
              {t("tickets.questionsLabel")}: {ticket.questionIds?.length || 0} / {ticket.questionCount}
            </Text>
          </Group>
          <Group gap="xs">
            <IconClock size={16} color="gray" />
            <Text size="sm" c="dimmed">
              {t("tickets.durationLabel")}: {t("tickets.durationMinutes", { min: ticket.durationMinutes })}
            </Text>
          </Group>
          <Group gap="xs">
            <IconTarget size={16} color="gray" />
            <Text size="sm" c="dimmed">
              {t("tickets.passingScoreLabel")}: {ticket.passingScore}%
            </Text>
          </Group>
        </Stack>
      </Stack>
    </Card>
  );
}
