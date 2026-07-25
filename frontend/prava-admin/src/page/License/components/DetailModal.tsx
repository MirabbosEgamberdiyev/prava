import { useTranslation } from "react-i18next";
import {
  Modal, Text, Stack, Group, Badge, Divider, SimpleGrid, Box, Code,
  CopyButton, Tooltip, ActionIcon,
} from "@mantine/core";
import { IconCheck, IconCopy, IconDeviceDesktop, IconBuilding } from "@tabler/icons-react";
import type { ActivationCodeResponse } from "../../../features/license/types";
import { groupColor, fmtDate, fmtDateTime } from "./helpers";

export function DetailModal({
  code,
  onClose,
}: {
  code: ActivationCodeResponse | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  if (!code) return null;

  return (
    <Modal
      opened={!!code}
      onClose={onClose}
      title={<Text fw={700} size="lg">{t("license.detail.title")}</Text>}
      size="lg"
      radius="md"
    >
      <Stack gap="sm">
        <Group justify="space-between">
          <Badge color={groupColor(code.displayGroup)} variant="filled" size="lg">
            {t(`license.group.${code.displayGroup.toLowerCase()}`)}
          </Badge>
          {code.daysUntilExpiry !== undefined && code.daysUntilExpiry >= 0 && (
            <Text size="sm" c="dimmed">
              {t("license.detail.daysLeft", { count: code.daysUntilExpiry })}
            </Text>
          )}
        </Group>

        <Divider />

        <SimpleGrid cols={2} spacing="xs">
          {code.computerName && (
            <Box>
              <Text size="xs" c="dimmed">{t("license.table.computer")}</Text>
              <Group gap={4}>
                <IconDeviceDesktop size={12} style={{ opacity: 0.5 }} />
                <Text size="sm" fw={500}>{code.computerName}</Text>
              </Group>
            </Box>
          )}
          {code.macAddress && (
            <Box>
              <Text size="xs" c="dimmed">{t("license.table.macAddress")}</Text>
              <Code fz="xs">{code.macAddress}</Code>
            </Box>
          )}
          {code.learningCenterName && (
            <Box>
              <Text size="xs" c="dimmed">{t("license.table.learningCenter")}</Text>
              <Group gap={4}>
                <IconBuilding size={12} style={{ opacity: 0.5 }} />
                <Text size="sm">{code.learningCenterName}</Text>
              </Group>
            </Box>
          )}
          <Box>
            <Text size="xs" c="dimmed">{t("license.table.machineId")}</Text>
            <Code fz="xs">{code.machineId}</Code>
          </Box>
          <Box>
            <Text size="xs" c="dimmed">{t("license.table.startDate")}</Text>
            <Text size="sm">{fmtDate(code.startDate)}</Text>
          </Box>
          <Box>
            <Text size="xs" c="dimmed">{t("license.table.endDate")}</Text>
            <Text size="sm">{fmtDate(code.endDate)}</Text>
          </Box>
          <Box>
            <Text size="xs" c="dimmed">{t("license.table.generatedBy")}</Text>
            <Text size="sm">{code.generatedBy ?? "—"}</Text>
          </Box>
          <Box>
            <Text size="xs" c="dimmed">{t("license.table.createdAt")}</Text>
            <Text size="sm">{fmtDateTime(code.createdAt)}</Text>
          </Box>
        </SimpleGrid>

        {code.notes && (
          <>
            <Divider />
            <Box>
              <Text size="xs" c="dimmed" mb={4}>{t("license.table.notes")}</Text>
              <Text size="sm">{code.notes}</Text>
            </Box>
          </>
        )}

        <Divider />
        <Box>
          <Group justify="space-between" mb={4}>
            <Text size="xs" c="dimmed">{t("license.detail.licenseKey")}</Text>
            <CopyButton value={code.licenseKey} timeout={2000}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? t("license.detail.copied") : t("license.detail.copy")}>
                  <ActionIcon size="xs" variant="subtle" color={copied ? "green" : "gray"} onClick={copy} aria-label={copied ? t("license.detail.copied") : t("license.detail.copy")}>
                    {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
          <Code
            block
            fz="xs"
            style={{
              wordBreak: "break-all",
              maxHeight: 120,
              overflow: "auto",
              userSelect: "all",
            }}
          >
            {code.licenseKey}
          </Code>
        </Box>
      </Stack>
    </Modal>
  );
}
