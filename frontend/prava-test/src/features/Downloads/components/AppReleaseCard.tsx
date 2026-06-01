import {
  Card, Group, Badge, Text, Button, Stack, Box, Divider,
  ThemeIcon, Tooltip,
} from "@mantine/core";
import {
  IconCalendar, IconDownload, IconFile, IconStar,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import type { AppReleaseResponse } from "../types";
import { APP_TYPE_LABELS, PLATFORM_META } from "../types";

interface Props {
  release:       AppReleaseResponse;
  onDownload:    (r: AppReleaseResponse) => void;
}

export default function AppReleaseCard({ release, onDownload }: Props) {
  const { t } = useTranslation();
  const pm    = PLATFORM_META[release.platform];

  return (
    <Card withBorder radius="md" p="md" h="100%"
      style={{ display: "flex", flexDirection: "column", transition: "box-shadow .15s" }}
      className="app-release-card"
    >
      {/* Header */}
      <Group justify="space-between" mb="xs" wrap="nowrap">
        <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" fw={700} truncate="end" style={{ flex: 1 }}>
            {APP_TYPE_LABELS[release.appType]}
          </Text>
        </Group>
        <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
          {release.isLatest && (
            <Tooltip label={t("downloads.latestVersion")}>
              <ThemeIcon size="sm" color="yellow" variant="light" radius="xl">
                <IconStar size={12} />
              </ThemeIcon>
            </Tooltip>
          )}
          <Badge color="green" variant="light" size="sm">
            v{release.version}
          </Badge>
        </Group>
      </Group>

      {/* Meta */}
      <Stack gap={4} mb="sm" style={{ flex: 1 }}>
        {release.releaseDate && (
          <Group gap={6}>
            <IconCalendar size={13} color="var(--mantine-color-dimmed)" />
            <Text size="xs" c="dimmed">
              {dayjs(release.releaseDate).format("DD.MM.YYYY")}
            </Text>
          </Group>
        )}
        {release.fileSizeFormatted && (
          <Group gap={6}>
            <IconFile size={13} color="var(--mantine-color-dimmed)" />
            <Text size="xs" c="dimmed">{release.fileSizeFormatted}</Text>
          </Group>
        )}
        <Group gap={6}>
          <IconDownload size={13} color="var(--mantine-color-dimmed)" />
          <Text size="xs" c="dimmed">
            {release.downloadCount.toLocaleString()} {t("downloads.times")}
          </Text>
        </Group>
      </Stack>

      <Divider mb="sm" />

      {/* Download tugmasi */}
      <Button
        fullWidth
        size="sm"
        variant="gradient"
        gradient={{ from: pm.color, to: pm.color, deg: 45 }}
        leftSection={<IconDownload size={15} />}
        disabled={!release.downloadUrl}
        onClick={() => onDownload(release)}
      >
        {t("downloads.download")}
      </Button>
    </Card>
  );
}
