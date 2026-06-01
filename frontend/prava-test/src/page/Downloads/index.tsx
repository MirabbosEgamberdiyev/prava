import { useState } from "react";
import useSWR from "swr";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import {
  Box, Center, Stack, Text, Title, Group,
  ThemeIcon, Alert, SimpleGrid, Skeleton, Badge,
} from "@mantine/core";
import {
  IconAlertCircle, IconApps, IconCloudDownload,
} from "@tabler/icons-react";

import { getLatestReleases } from "../../api/applicationService";
import type { AppPlatform, AppReleaseResponse } from "../../features/Downloads/types";
import {
  PLATFORM_META, groupByPlatform,
} from "../../features/Downloads/types";
import PlatformSection  from "../../features/Downloads/components/PlatformSection";
import DownloadModal    from "../../features/Downloads/components/DownloadModal";
import SEO              from "../../components/common/SEO";

// Platformalar ko'rsatish tartibi
const PLATFORM_ORDER: AppPlatform[] = ["WINDOWS", "LINUX", "MACOS", "ANDROID", "IOS", "WEB"];

function SkeletonSection() {
  return (
    <Box mb="xl">
      <Skeleton height={56} radius="md" mb="md" />
      <SimpleGrid cols={{ base: 1, xs: 2, sm: 3 }} spacing="sm">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height={160} radius="md" />
        ))}
      </SimpleGrid>
    </Box>
  );
}

export default function Downloads_Page() {
  const { t } = useTranslation();
  const lang   = i18n.language;

  const [selected, setSelected] = useState<AppReleaseResponse | null>(null);

  const { data: releases, isLoading, error } = useSWR(
    ["app-releases-latest", lang],
    () => getLatestReleases(lang),
    {
      revalidateOnFocus:   false,
      dedupingInterval:    60_000,  // 1 daqiqa cache
    }
  );

  const grouped    = releases ? groupByPlatform(releases) : {};
  const totalCount = releases?.length ?? 0;
  const totalDl    = releases?.reduce((s, r) => s + (r.downloadCount ?? 0), 0) ?? 0;

  return (
    <>
      <SEO
        title={t("downloads.pageTitle")}
        description={t("downloads.pageDesc")}
      />

      <Stack gap="xl">

        {/* Page header */}
        <Box>
          <Group gap="sm" mb="xs">
            <ThemeIcon size="xl" radius="md" variant="gradient"
              gradient={{ from: "blue", to: "cyan", deg: 45 }}>
              <IconApps size={22} />
            </ThemeIcon>
            <Box>
              <Title order={2}>{t("downloads.title")}</Title>
              <Text size="sm" c="dimmed">{t("downloads.subtitle")}</Text>
            </Box>
          </Group>

          {!isLoading && !error && totalCount > 0 && (
            <Group gap="sm" mt="sm" wrap="wrap">
              <Badge size="lg" variant="light" color="blue" leftSection={<IconApps size={14}/>}>
                {totalCount} {t("downloads.versions")}
              </Badge>
              <Badge size="lg" variant="light" color="teal" leftSection={<IconCloudDownload size={14}/>}>
                {totalDl.toLocaleString()} {t("downloads.totalDownloads")}
              </Badge>
              {PLATFORM_ORDER
                .filter((p) => grouped[p] && grouped[p]!.length > 0)
                .map((p) => {
                  const pm = PLATFORM_META[p];
                  return (
                    <Badge key={p} size="md" variant="dot" color={pm.color}>
                      {pm.emoji} {pm.label}
                    </Badge>
                  );
                })}
            </Group>
          )}
        </Box>

        {/* Loading */}
        {isLoading && (
          <>
            <SkeletonSection />
            <SkeletonSection />
          </>
        )}

        {/* Error */}
        {error && !isLoading && (
          <Alert icon={<IconAlertCircle size={18}/>} color="red" title={t("common.error")}>
            {t("downloads.loadError")}
          </Alert>
        )}

        {/* Empty */}
        {!isLoading && !error && totalCount === 0 && (
          <Center py={80}>
            <Stack align="center" gap="xs">
              <IconApps size={64} color="var(--mantine-color-dimmed)" />
              <Text fw={600} size="lg">{t("downloads.noApps")}</Text>
              <Text size="sm" c="dimmed">{t("downloads.noAppsSub")}</Text>
            </Stack>
          </Center>
        )}

        {/* Platform sections */}
        {!isLoading && !error && totalCount > 0 && (
          <>
            {PLATFORM_ORDER
              .filter((p) => grouped[p] && grouped[p]!.length > 0)
              .map((platform) => (
                <PlatformSection
                  key={platform}
                  platform={platform}
                  releases={grouped[platform]!}
                  onDownload={setSelected}
                />
              ))}
          </>
        )}
      </Stack>

      {/* Download detail modal */}
      <DownloadModal
        release={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
