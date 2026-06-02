import { Box, Group, Text, SimpleGrid, Paper, ThemeIcon } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { AppReleaseResponse, AppPlatform } from "../types";
import { PLATFORM_META } from "../types";
import AppReleaseCard from "./AppReleaseCard";

interface Props {
  platform:   AppPlatform;
  releases:   AppReleaseResponse[];
  onDownload: (r: AppReleaseResponse) => void;
}

export default function PlatformSection({ platform, releases, onDownload }: Props) {
  const { t } = useTranslation();
  const pm = PLATFORM_META[platform];

  if (!releases || releases.length === 0) return null;

  return (
    <Box mb="xl">
      {/* Section header */}
      <Paper
        withBorder
        radius="md"
        p="sm"
        mb="md"
        style={{
          background: `linear-gradient(135deg, ${pm.color === "blue" ? "#e7f5ff" : pm.color === "orange" ? "#fff4e6" : pm.color === "gray" ? "#f8f9fa" : pm.color === "teal" ? "#e6fcf5" : "#fff"}, transparent)`,
        }}
      >
        <Group gap="sm">
          <ThemeIcon
            size="lg"
            radius="md"
            variant="gradient"
            gradient={{ from: pm.color, to: pm.color, deg: 45 }}
          >
            <span style={{ fontSize: 18 }}>{pm.emoji}</span>
          </ThemeIcon>
          <Box>
            <Text fw={700} size="lg">{pm.label}</Text>
            <Text size="xs" c="dimmed">{releases.length} {t("downloads.variant")}</Text>
          </Box>
        </Group>
      </Paper>

      {/* Cards */}
      <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, lg: 4 }} spacing="sm">
        {releases.map((r) => (
          <AppReleaseCard key={r.id} release={r} onDownload={onDownload} />
        ))}
      </SimpleGrid>
    </Box>
  );
}
