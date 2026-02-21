// features/package/components/PackageTable.tsx

import { Table, Badge, ActionIcon, Group, Text, Tooltip } from "@mantine/core";
import {
  IconEdit,
  IconTrash,
  IconToggleLeft,
  IconToggleRight,
  IconRefresh,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { PackageListItem } from "../types";

interface PackageTableProps {
  packages: PackageListItem[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number) => void;
  onRegenerate: (id: number) => void;
  loading?: boolean;
}

export function PackageTable({
  packages,
  onEdit,
  onDelete,
  onToggleStatus,
  onRegenerate,
  loading = false,
}: PackageTableProps) {
  const { t } = useTranslation();

  if (packages.length === 0 && !loading) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        {t("packages.noData")}
      </Text>
    );
  }

  return (
    <Table.ScrollContainer minWidth={900}>
      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>ID</Table.Th>
            <Table.Th>{t("packages.name")}</Table.Th>
            <Table.Th>{t("packages.topic")}</Table.Th>
            <Table.Th>{t("packages.questions")}</Table.Th>
            <Table.Th>{t("packages.duration")}</Table.Th>
            <Table.Th>{t("packages.passingScore")}</Table.Th>
            <Table.Th>{t("packages.type")}</Table.Th>
            <Table.Th>{t("packages.price")}</Table.Th>
            <Table.Th>{t("packages.status")}</Table.Th>
            <Table.Th>{t("packages.actions")}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {packages.map((pkg) => (
            <Table.Tr key={pkg.id}>
              <Table.Td>{pkg.id}</Table.Td>
              <Table.Td>
                <Text fw={500} lineClamp={1}>{pkg.name}</Text>
                <Text size="xs" c="dimmed" lineClamp={1}>
                  {pkg.description}
                </Text>
              </Table.Td>
              <Table.Td>{pkg.topicName}</Table.Td>
              <Table.Td>
                <Text size="sm">
                  {pkg.actualQuestionCount} / {pkg.questionCount}
                </Text>
              </Table.Td>
              <Table.Td>{pkg.durationMinutes}</Table.Td>
              <Table.Td>{pkg.passingScore}</Table.Td>
              <Table.Td>
                <Badge
                  color={pkg.generationType === "MANUAL" ? "blue" : "grape"}
                >
                  {pkg.generationType}
                </Badge>
              </Table.Td>
              <Table.Td>
                {pkg.isFree ? (
                  <Badge color="green">{t("packages.free")}</Badge>
                ) : (
                  <Text size="sm" fw={500}>
                    {pkg.price.toLocaleString()} {t("packages.currency")}
                  </Text>
                )}
              </Table.Td>
              <Table.Td>
                <Badge color={pkg.isActive ? "green" : "red"}>
                  {pkg.isActive ? t("packages.active") : t("packages.inactive")}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Group gap="xs" wrap="nowrap">
                  <Tooltip label={t("packages.editTooltip")}>
                    <ActionIcon
                      variant="light"
                      color="blue"
                      onClick={() => onEdit(pkg.id)}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                  </Tooltip>

                  <Tooltip
                    label={pkg.isActive ? t("packages.deactivate") : t("packages.activate")}
                  >
                    <ActionIcon
                      variant="light"
                      color={pkg.isActive ? "orange" : "green"}
                      onClick={() => onToggleStatus(pkg.id)}
                    >
                      {pkg.isActive ? (
                        <IconToggleRight size={16} />
                      ) : (
                        <IconToggleLeft size={16} />
                      )}
                    </ActionIcon>
                  </Tooltip>

                  {pkg.generationType === "AUTO" && (
                    <Tooltip label={t("packages.regenerate")}>
                      <ActionIcon
                        variant="light"
                        color="grape"
                        onClick={() => onRegenerate(pkg.id)}
                      >
                        <IconRefresh size={16} />
                      </ActionIcon>
                    </Tooltip>
                  )}

                  <Tooltip label={t("packages.deleteTooltip")}>
                    <ActionIcon
                      variant="light"
                      color="red"
                      onClick={() => onDelete(pkg.id)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
