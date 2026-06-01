import {
  Modal, Stack, Group, Badge, Text, Button, Divider,
  CopyButton, Tooltip, ActionIcon, Box, ScrollArea, Code,
  ThemeIcon, List,
} from "@mantine/core";
import {
  IconCheck, IconCopy, IconDownload, IconInfoCircle,
  IconShieldCheck, IconFileInfo,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import type { AppReleaseResponse } from "../types";
import {
  APP_TYPE_LABELS, PLATFORM_META, getReleaseNotes,
} from "../types";
import { getDownloadUrl } from "../../../api/applicationService";
import dayjs from "dayjs";

interface Props {
  release:  AppReleaseResponse | null;
  onClose:  () => void;
}

export default function DownloadModal({ release, onClose }: Props) {
  const { t } = useTranslation();
  const lang   = i18n.language;

  if (!release) return null;

  const pm      = PLATFORM_META[release.platform];
  const notes   = getReleaseNotes(release, lang);
  const dlUrl   = getDownloadUrl(release.id);

  const handleDownload = () => {
    // Backend 302 redirect — yangi tabda ochish yoki to'g'ridan-to'g'ri link
    window.open(dlUrl, "_blank", "noopener");
  };

  return (
    <Modal
      opened={!!release}
      onClose={onClose}
      title={
        <Group gap="xs">
          <span style={{ fontSize: 20 }}>{pm.emoji}</span>
          <Text fw={700}>{release.appName}</Text>
          <Badge color={pm.color} variant="light">v{release.version}</Badge>
        </Group>
      }
      size="md"
    >
      <Stack gap="md">

        {/* Platform + tur */}
        <Group gap="xs" wrap="wrap">
          <Badge
            variant="gradient"
            gradient={{ from: pm.color, to: pm.color, deg: 45 }}
            leftSection={<span>{pm.emoji}</span>}
            size="lg"
          >
            {pm.label}
          </Badge>
          <Badge variant="outline" color="gray" size="lg">
            {APP_TYPE_LABELS[release.appType]}
          </Badge>
          {release.isForceUpdate && (
            <Badge color="red" size="sm">{t("downloads.forceUpdate")}</Badge>
          )}
        </Group>

        {/* Meta */}
        <Group gap="xl" wrap="wrap">
          {release.releaseDate && (
            <Box>
              <Text size="xs" c="dimmed">{t("downloads.releaseDate")}</Text>
              <Text size="sm" fw={500}>{dayjs(release.releaseDate).format("DD.MM.YYYY")}</Text>
            </Box>
          )}
          {release.fileSizeFormatted && (
            <Box>
              <Text size="xs" c="dimmed">{t("downloads.fileSize")}</Text>
              <Text size="sm" fw={500}>{release.fileSizeFormatted}</Text>
            </Box>
          )}
          <Box>
            <Text size="xs" c="dimmed">{t("downloads.downloadCount")}</Text>
            <Text size="sm" fw={500}>{release.downloadCount.toLocaleString()}</Text>
          </Box>
        </Group>

        <Divider />

        {/* Release notes */}
        {notes && (
          <>
            <Box>
              <Group gap="xs" mb="xs">
                <ThemeIcon variant="light" size="sm" color="blue">
                  <IconInfoCircle size={14} />
                </ThemeIcon>
                <Text size="sm" fw={600}>{t("downloads.releaseNotes")}</Text>
              </Group>
              <ScrollArea.Autosize mah={160}>
                <Text size="sm" c="dimmed" style={{ whiteSpace: "pre-wrap" }}>
                  {notes}
                </Text>
              </ScrollArea.Autosize>
            </Box>
            <Divider />
          </>
        )}

        {/* SHA-256 checksum */}
        {release.checksum && (
          <>
            <Box>
              <Group gap="xs" mb="xs">
                <ThemeIcon variant="light" size="sm" color="green">
                  <IconShieldCheck size={14} />
                </ThemeIcon>
                <Text size="sm" fw={600}>{t("downloads.checksum")}</Text>
              </Group>
              <Group gap="xs" wrap="nowrap">
                <Code
                  block
                  style={{
                    fontSize: 11, wordBreak: "break-all",
                    flex: 1, padding: "6px 10px",
                  }}
                >
                  {release.checksum}
                </Code>
                <CopyButton value={release.checksum} timeout={2000}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? t("downloads.copied") : t("downloads.copyHash")}>
                      <ActionIcon
                        variant={copied ? "filled" : "default"}
                        color={copied ? "green" : "gray"}
                        onClick={copy}
                      >
                        {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
            </Box>
            <Divider />
          </>
        )}

        {/* O'rnatish bo'yicha qisqa yo'riqnoma */}
        <Box>
          <Group gap="xs" mb="xs">
            <ThemeIcon variant="light" size="sm" color="orange">
              <IconFileInfo size={14} />
            </ThemeIcon>
            <Text size="sm" fw={600}>{t("downloads.installGuide")}</Text>
          </Group>
          <List size="xs" c="dimmed" spacing={4}>
            <InstallHints platform={release.platform} appType={release.appType} t={t} />
          </List>
        </Box>

        <Divider />

        {/* Download tugmasi */}
        {release.downloadUrl ? (
          <Button
            fullWidth
            size="md"
            leftSection={<IconDownload size={18} />}
            style={{ background: pm.gradient }}
            onClick={handleDownload}
          >
            {t("downloads.download")} ({release.fileSizeFormatted ?? "..."})
          </Button>
        ) : (
          <Text size="sm" c="dimmed" ta="center">
            {t("downloads.noFileYet")}
          </Text>
        )}
      </Stack>
    </Modal>
  );
}

function InstallHints({
  platform, appType, t,
}: {
  platform: AppReleaseResponse["platform"];
  appType:  AppReleaseResponse["appType"];
  t: (k: string) => string;
}) {
  switch (platform) {
    case "WINDOWS":
      return (
        <>
          <List.Item>{t("downloads.hints.winAdmin")}</List.Item>
          <List.Item>{t("downloads.hints.winRun")}</List.Item>
          {appType === "WINDOWS_MSI" && (
            <List.Item>{t("downloads.hints.winMsi")}</List.Item>
          )}
        </>
      );
    case "LINUX":
      if (appType === "LINUX_DEB")
        return <List.Item>{t("downloads.hints.linuxDeb")}</List.Item>;
      if (appType === "LINUX_RPM")
        return <List.Item>{t("downloads.hints.linuxRpm")}</List.Item>;
      if (appType === "LINUX_APPIMAGE")
        return <List.Item>{t("downloads.hints.linuxAppImage")}</List.Item>;
      return <List.Item>{t("downloads.hints.linuxGeneral")}</List.Item>;
    case "MACOS":
      return (
        <>
          <List.Item>{t("downloads.hints.macOpen")}</List.Item>
          <List.Item>{t("downloads.hints.macDrag")}</List.Item>
        </>
      );
    default:
      return <List.Item>{t("downloads.hints.general")}</List.Item>;
  }
}
