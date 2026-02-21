// features/package/components/PackageCard.tsx

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
  IconToggleLeft,
  IconToggleRight,
  IconRefresh,
  IconDots,
  IconClock,
  IconClipboardList,
  IconTarget,
  IconLink,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { PackageListItem } from "../types";

interface PackageCardProps {
  package: PackageListItem;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number) => void;
  onRegenerate: (id: number) => void;
  onAttachQuestions: (id: number) => void;
}

export function PackageCard({
  package: pkg,
  onEdit,
  onDelete,
  onToggleStatus,
  onRegenerate,
  onAttachQuestions,
}: PackageCardProps) {
  const { t } = useTranslation();

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="sm">
        <Group justify="space-between" wrap="nowrap">
          <Text fw={700} size="lg" lineClamp={1}>
            {pkg.name}
          </Text>
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray">
                <IconDots size={18} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconEdit style={{ width: rem(14) }} />}
                onClick={() => onEdit(pkg.id)}
              >
                {t("common.edit")}
              </Menu.Item>
              <Menu.Item
                leftSection={<IconLink style={{ width: rem(14) }} />}
                onClick={() => onAttachQuestions(pkg.id)}
                color="blue"
              >
                {t("packages.attachQuestions")}
              </Menu.Item>
              <Menu.Item
                leftSection={
                  pkg.isActive ? (
                    <IconToggleRight style={{ width: rem(14) }} />
                  ) : (
                    <IconToggleLeft style={{ width: rem(14) }} />
                  )
                }
                onClick={() => onToggleStatus(pkg.id)}
                color={pkg.isActive ? "orange" : "green"}
              >
                {pkg.isActive ? t("packages.deactivate") : t("packages.activate")}
              </Menu.Item>
              {pkg.generationType === "AUTO" && (
                <Menu.Item
                  leftSection={<IconRefresh style={{ width: rem(14) }} />}
                  onClick={() => onRegenerate(pkg.id)}
                  color="grape"
                >
                  {t("packages.regenerate")}
                </Menu.Item>
              )}
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<IconTrash style={{ width: rem(14) }} />}
                onClick={() => onDelete(pkg.id)}
              >
                {t("common.delete")}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>

        <Text size="sm" c="dimmed" lineClamp={2} mih={40}>
          {pkg.description}
        </Text>

        <Group gap="xs">
          <Badge color={pkg.isActive ? "green" : "red"} variant="light">
            {pkg.isActive ? t("packages.active") : t("packages.inactive")}
          </Badge>
          <Badge
            color={pkg.generationType === "MANUAL" ? "blue" : "grape"}
            variant="light"
          >
            {pkg.generationType}
          </Badge>
          {pkg.isFree ? (
            <Badge color="green" variant="light">
              {t("packages.free")}
            </Badge>
          ) : (
            <Badge color="orange" variant="light">
              {pkg.price.toLocaleString()} {t("packages.currency")}
            </Badge>
          )}
        </Group>

        <Stack gap="xs">
          <Group gap="xs">
            <IconClipboardList size={16} color="gray" />
            <Text size="sm" c="dimmed">
              {t("packages.questions")}: {pkg.actualQuestionCount} / {pkg.questionCount}
            </Text>
          </Group>
          <Group gap="xs">
            <IconClock size={16} color="gray" />
            <Text size="sm" c="dimmed">
              {t("packages.time")}: {pkg.durationMinutes} {t("common.minutes")}
            </Text>
          </Group>
          <Group gap="xs">
            <IconTarget size={16} color="gray" />
            <Text size="sm" c="dimmed">
              {t("packages.passingScore")}: {pkg.passingScore}%
            </Text>
          </Group>
        </Stack>
      </Stack>
    </Card>
  );
}
