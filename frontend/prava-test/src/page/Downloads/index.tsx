import { useState, useMemo } from "react";
import useSWR from "swr";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import {
  Box, Button, Card, Center, Container, Divider, Group, Modal,
  ScrollArea, SimpleGrid, Skeleton, Stack, Tabs, SegmentedControl,
  Text, ThemeIcon, Title, Badge, Code, CopyButton,
  Tooltip, ActionIcon, Alert, Paper,
} from "@mantine/core";
import {
  IconApple, IconApps, IconBrandWindows, IconCheck,
  IconCloud, IconCloudOff, IconCopy, IconDownload,
  IconTerminal2, IconAlertCircle,
} from "@tabler/icons-react";
import { getLatestReleases, getDownloadUrl } from "../../api/applicationService";
import type { AppReleaseResponse, AppCategory } from "../../features/Downloads/types";
import { getReleaseNotes } from "../../features/Downloads/types";
import SEO from "../../components/common/SEO";
import dayjs from "dayjs";

// ─── Platform meta ────────────────────────────────────────────────────────────
type PlatformKey = "ALL" | "WINDOWS" | "LINUX" | "MACOS";

const PLATFORMS: { key: PlatformKey; labelKey?: string; label?: string; icon: React.ReactNode }[] = [
  { key: "ALL",     labelKey: "downloads.all", icon: <IconApps size={16}/> },
  { key: "WINDOWS", label: "Windows",  icon: <IconBrandWindows size={16}/> },
  { key: "LINUX",   label: "Linux",    icon: <IconTerminal2 size={16}/> },
  { key: "MACOS",   label: "macOS",    icon: <IconApple size={16}/> },
];

const PLATFORM_COLORS: Record<string, string> = { WINDOWS: "blue", LINUX: "orange", MACOS: "gray" };
const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  WINDOWS: <IconBrandWindows size={20}/>,
  LINUX:   <IconTerminal2 size={20}/>,
  MACOS:   <IconApple size={20}/>,
};

function fmtSize(bytes?: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024 ** 2) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 ** 2).toFixed(1) + " MB";
}

// ─── Download Modal ───────────────────────────────────────────────────────────
function DownloadDetailModal({ r, onClose }: { r: AppReleaseResponse | null; onClose: () => void }) {
  const { t } = useTranslation();
  if (!r) return null;

  const lang  = i18n.language;
  const notes = getReleaseNotes(r, lang);
  const dlUrl = getDownloadUrl(r.id);
  const color = PLATFORM_COLORS[r.platform] ?? "gray";
  const cat   = (r.appCategory ?? "OFFLINE") as AppCategory;

  return (
    <Modal
      opened={!!r}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon color={color} variant="light" size="md">
            {PLATFORM_ICONS[r.platform] ?? <IconApps size={18}/>}
          </ThemeIcon>
          <Text fw={700}>{r.appName}</Text>
          <Badge color={color} variant="light">v{r.version}</Badge>
        </Group>
      }
      size="sm"
    >
      <Stack gap="md">
        {/* Online/Offline badge */}
        <Group gap="xs">
          <Badge
            color={cat === "ONLINE" ? "teal" : "blue"}
            variant="light"
            leftSection={cat === "ONLINE" ? <IconCloud size={12}/> : <IconCloudOff size={12}/>}
          >
            {cat === "ONLINE" ? t("downloads.onlineApp") : t("downloads.offlineApp")}
          </Badge>
          <Text size="xs" c="dimmed">
            {cat === "ONLINE" ? t("downloads.onlineDesc") : t("downloads.offlineDesc")}
          </Text>
        </Group>

        {/* Meta */}
        <Group gap="xl">
          {r.releaseDate && (
            <Box>
              <Text size="xs" c="dimmed">{t("downloads.releaseDate")}</Text>
              <Text size="sm" fw={500}>{dayjs(r.releaseDate).format("DD.MM.YYYY")}</Text>
            </Box>
          )}
          {r.fileSize && (
            <Box>
              <Text size="xs" c="dimmed">{t("downloads.fileSize")}</Text>
              <Text size="sm" fw={500}>{r.fileSizeFormatted ?? fmtSize(r.fileSize)}</Text>
            </Box>
          )}
          <Box>
            <Text size="xs" c="dimmed">{t("downloads.downloadCount")}</Text>
            <Text size="sm" fw={500}>{(r.downloadCount ?? 0).toLocaleString()} {t("downloads.times")}</Text>
          </Box>
        </Group>

        {/* Release notes */}
        {notes && (
          <>
            <Divider />
            <Box>
              <Text size="sm" fw={600} mb="xs">{t("downloads.releaseNotes")}</Text>
              <ScrollArea.Autosize mah={120}>
                <Text size="sm" c="dimmed" style={{ whiteSpace: "pre-wrap" }}>{notes}</Text>
              </ScrollArea.Autosize>
            </Box>
          </>
        )}

        {/* Checksum */}
        {r.checksum && (
          <>
            <Divider />
            <Box>
              <Text size="xs" c="dimmed" mb={4}>SHA-256</Text>
              <Group gap="xs" wrap="nowrap">
                <Code style={{ fontSize: 10, wordBreak: "break-all", flex: 1 }}>{r.checksum}</Code>
                <CopyButton value={r.checksum} timeout={2000}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? t("downloads.copied") : t("downloads.copyHash")}>
                      <ActionIcon variant={copied ? "filled" : "default"} color={copied ? "green" : "gray"} size="sm" onClick={copy}>
                        {copied ? <IconCheck size={12}/> : <IconCopy size={12}/>}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
            </Box>
          </>
        )}

        <Divider />

        <Button
          fullWidth size="md" color={color}
          leftSection={<IconDownload size={18}/>}
          component="a" href={dlUrl} disabled={!r.downloadUrl}
        >
          {t("downloads.download")} {r.fileSizeFormatted ? `(${r.fileSizeFormatted})` : ""}
        </Button>
      </Stack>
    </Modal>
  );
}

// ─── App Card ─────────────────────────────────────────────────────────────────
function AppCard({ r, onOpen }: { r: AppReleaseResponse; onOpen: (r: AppReleaseResponse) => void }) {
  const { t } = useTranslation();
  const color = PLATFORM_COLORS[r.platform] ?? "gray";
  const cat   = (r.appCategory ?? "OFFLINE") as AppCategory;

  return (
    <Card withBorder radius="md" p="md" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Group gap="xs">
        <ThemeIcon color={color} variant="light" size="md" radius="md">
          {PLATFORM_ICONS[r.platform] ?? <IconApps size={16}/>}
        </ThemeIcon>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" fw={700} truncate>{r.appName}</Text>
          <Group gap={4}>
            <Badge
              color={cat === "ONLINE" ? "teal" : "blue"}
              variant="light"
              size="xs"
              leftSection={cat === "ONLINE" ? <IconCloud size={10}/> : <IconCloudOff size={10}/>}
            >
              {cat === "ONLINE" ? t("downloads.onlineApp") : t("downloads.offlineApp")}
            </Badge>
          </Group>
        </Box>
        <Badge color={color} variant="light" size="sm">v{r.version}</Badge>
      </Group>

      {(r.fileSize || r.releaseDate) && (
        <Group gap="md">
          {r.fileSize && <Text size="xs" c="dimmed">{r.fileSizeFormatted ?? fmtSize(r.fileSize)}</Text>}
          {r.releaseDate && <Text size="xs" c="dimmed">{dayjs(r.releaseDate).format("DD.MM.YYYY")}</Text>}
        </Group>
      )}

      <Button
        mt="auto" fullWidth size="sm" variant="light" color={color}
        leftSection={<IconDownload size={15}/>}
        onClick={() => onOpen(r)}
        disabled={!r.downloadUrl}
      >
        {t("downloads.download")}
      </Button>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Downloads_Page() {
  const { t } = useTranslation();
  const lang  = i18n.language;

  const [category, setCategory] = useState<AppCategory>("OFFLINE");
  const [tab,      setTab]      = useState<PlatformKey>("ALL");
  const [selected, setSelected] = useState<AppReleaseResponse | null>(null);

  const { data: releases, isLoading, error } = useSWR(
    ["downloads", lang],
    () => getLatestReleases(lang),
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );

  // Avval kategoriya, keyin platforma bo'yicha filter
  const inCategory = useMemo(
    () => (releases ?? []).filter(r => (r.appCategory ?? "OFFLINE") === category),
    [releases, category]
  );
  const filtered = useMemo(
    () => inCategory.filter(r => tab === "ALL" || r.platform === tab),
    [inCategory, tab]
  );

  // Har kategoriya uchun nechta ilova
  const onlineCount  = (releases ?? []).filter(r => r.appCategory === "ONLINE").length;
  const offlineCount = (releases ?? []).filter(r => (r.appCategory ?? "OFFLINE") === "OFFLINE").length;

  return (
    <>
      <SEO title={t("downloads.pageTitle")} description={t("downloads.pageDesc")} />

      <Container size="xl" py="md" px={{ base: "md", sm: "lg" }}>
      <Stack gap="lg">
        {/* Header */}
        <Group gap="sm">
          <ThemeIcon size="xl" radius="md" variant="gradient" gradient={{ from: "blue", to: "cyan", deg: 45 }}>
            <IconApps size={22}/>
          </ThemeIcon>
          <Box>
            <Title order={2}>{t("downloads.title")}</Title>
            <Text size="sm" c="dimmed">{t("downloads.subtitle")}</Text>
          </Box>
        </Group>

        {/* Online / Offline toggle */}
        <Paper withBorder radius="md" p="md">
          <SegmentedControl
            fullWidth
            size="md"
            value={category}
            onChange={v => { setCategory(v as AppCategory); setTab("ALL"); }}
            data={[
              {
                value: "OFFLINE",
                label: (
                  <Group gap={8} justify="center">
                    <IconCloudOff size={16}/>
                    <Box>
                      <Text size="sm" fw={600}>{t("downloads.offlineApp")}</Text>
                      <Text size="xs" c="dimmed">{t("downloads.offlineToggle", { count: offlineCount })}</Text>
                    </Box>
                  </Group>
                ),
              },
              {
                value: "ONLINE",
                label: (
                  <Group gap={8} justify="center">
                    <IconCloud size={16}/>
                    <Box>
                      <Text size="sm" fw={600}>{t("downloads.onlineApp")}</Text>
                      <Text size="xs" c="dimmed">{t("downloads.onlineToggle", { count: onlineCount })}</Text>
                    </Box>
                  </Group>
                ),
              },
            ]}
          />
        </Paper>

        {/* Platforma tablari */}
        <Tabs value={tab} onChange={v => setTab((v ?? "ALL") as PlatformKey)} variant="pills">
          <Tabs.List>
            {PLATFORMS.map(p => {
              const cnt = p.key === "ALL"
                ? inCategory.length
                : inCategory.filter(r => r.platform === p.key).length;
              return (
                <Tabs.Tab key={p.key} value={p.key} leftSection={p.icon}>
                  {p.labelKey ? t(p.labelKey) : p.label}
                  {cnt > 0 && (
                    <Badge size="xs" ml={4} variant="light" circle>{cnt}</Badge>
                  )}
                </Tabs.Tab>
              );
            })}
          </Tabs.List>
        </Tabs>

        {/* Loading */}
        {isLoading && (
          <SimpleGrid cols={{ base: 1, xs: 2, sm: 3 }} spacing="sm">
            {[1,2,3].map(i => <Skeleton key={i} height={140} radius="md"/>)}
          </SimpleGrid>
        )}

        {/* Error */}
        {error && !isLoading && (
          <Alert icon={<IconAlertCircle size={16}/>} color="red">{t("downloads.loadError")}</Alert>
        )}

        {/* Empty */}
        {!isLoading && !error && filtered.length === 0 && (
          <Center py={80}>
            <Stack align="center" gap="xs">
              <IconApps size={56} color="var(--mantine-color-dimmed)"/>
              <Text fw={600}>{t("downloads.noApps")}</Text>
              <Text size="sm" c="dimmed">
                {category === "ONLINE"
                  ? t("downloads.noOnlineApps")
                  : t("downloads.noOfflineApps")}
              </Text>
            </Stack>
          </Center>
        )}

        {/* Cards */}
        {!isLoading && !error && filtered.length > 0 && (
          <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, lg: 4 }} spacing="sm">
            {filtered.map(r => (
              <AppCard key={r.id} r={r} onOpen={setSelected}/>
            ))}
          </SimpleGrid>
        )}
      </Stack>

      </Container>

      <DownloadDetailModal r={selected} onClose={() => setSelected(null)}/>
    </>
  );
}
