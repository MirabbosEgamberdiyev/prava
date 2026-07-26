import { useState, useMemo } from "react";
import useSWR from "swr";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import {
  Alert, Badge, Box, Button, Card, Center, Code,
  Container, CopyButton, Divider, Group, Modal, Paper, ScrollArea,
  SegmentedControl, SimpleGrid, Skeleton, Stack, Tabs, Text,
  ThemeIcon, Title, Tooltip, ActionIcon,
} from "@mantine/core";
import {
  IconApple, IconApps, IconBrandWindows, IconCheck, IconCloud,
  IconCloudOff, IconCopy, IconDownload, IconTerminal2,
  IconAlertCircle, IconBrandGooglePlay, IconBrandAndroid,
  IconDeviceMobile, IconExternalLink, IconDeviceDesktop,
  IconWorld, IconDeviceMobileMessage, IconCircleCheck,
} from "@tabler/icons-react";
import { useInstallPrompt } from "../../hooks/useInstallPrompt";
import { getLatestReleases, getDownloadUrl } from "../../api/applicationService";
import type { AppReleaseResponse, AppCategory } from "../../features/Downloads/types";
import { getReleaseNotes } from "../../features/Downloads/types";
import SEO from "../../components/common/SEO";
import dayjs from "dayjs";

// ─── Constants ───────────────────────────────────────────────────────────────
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=uz.prava.online";
const APP_STORE_URL  = "https://apps.apple.com/app/prava-online/id0000000000";

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

// ─── Download Detail Modal ───────────────────────────────────────────────────
function DownloadDetailModal({ r, onClose }: { r: AppReleaseResponse | null; onClose: () => void }) {
  const { t } = useTranslation();
  if (!r) return null;
  const notes = getReleaseNotes(r, i18n.language);
  const dlUrl = getDownloadUrl(r.id);
  const color = PLATFORM_COLORS[r.platform] ?? "gray";
  const cat   = (r.appCategory ?? "OFFLINE") as AppCategory;

  return (
    <Modal opened={!!r} onClose={onClose} size="md"
      title={<Group gap="xs"><ThemeIcon color={color} variant="light" size="md">{PLATFORM_ICONS[r.platform]}</ThemeIcon><Text fw={700}>{r.appName}</Text><Badge color={color} variant="light">v{r.version}</Badge></Group>}>
      <Stack gap="md">
        <Group gap="xs">
          <Badge color={cat === "ONLINE" ? "teal" : "blue"} variant="light"
            leftSection={cat === "ONLINE" ? <IconCloud size={12}/> : <IconCloudOff size={12}/>}>
            {cat === "ONLINE" ? t("dl.online") : t("dl.offline")}
          </Badge>
        </Group>
        <Group gap="xl">
          {r.releaseDate && <Box><Text size="xs" c="dimmed">{t("dl.date")}</Text><Text size="sm" fw={500}>{dayjs(r.releaseDate).format("DD.MM.YYYY")}</Text></Box>}
          {r.fileSize && <Box><Text size="xs" c="dimmed">{t("dl.size")}</Text><Text size="sm" fw={500}>{r.fileSizeFormatted ?? fmtSize(r.fileSize)}</Text></Box>}
          <Box><Text size="xs" c="dimmed">{t("dl.downloads")}</Text><Text size="sm" fw={500}>{(r.downloadCount ?? 0).toLocaleString()}</Text></Box>
        </Group>
        {notes && (<><Divider /><Box><Text size="sm" fw={600} mb="xs">{t("dl.releaseNotes")}</Text><ScrollArea.Autosize mah={140}><Text size="sm" c="dimmed" style={{ whiteSpace: "pre-wrap" }}>{notes}</Text></ScrollArea.Autosize></Box></>)}
        {r.checksum && (<><Divider /><Box><Text size="xs" c="dimmed" mb={4}>SHA-256</Text><Group gap="xs" wrap="nowrap"><Code style={{ fontSize: 10, wordBreak: "break-all", flex: 1 }}>{r.checksum}</Code><CopyButton value={r.checksum} timeout={2000}>{({ copied, copy }) => (<Tooltip label={copied ? "✓" : t("dl.copy")}><ActionIcon variant={copied ? "filled" : "default"} color={copied ? "green" : "gray"} size="sm" onClick={copy}>{copied ? <IconCheck size={12}/> : <IconCopy size={12}/>}</ActionIcon></Tooltip>)}</CopyButton></Group></Box></>)}
        <Divider />
        <Button fullWidth size="md" color={color} leftSection={<IconDownload size={18}/>} component="a" href={dlUrl} disabled={!r.downloadUrl}>
          {t("dl.downloadBtn")} {r.fileSizeFormatted ? `(${r.fileSizeFormatted})` : ""}
        </Button>
      </Stack>
    </Modal>
  );
}

// ─── Desktop Release Card ────────────────────────────────────────────────────
function ReleaseCard({ r, onOpen }: { r: AppReleaseResponse; onOpen: (r: AppReleaseResponse) => void }) {
  const { t } = useTranslation();
  const color = PLATFORM_COLORS[r.platform] ?? "gray";

  return (
    <Card withBorder radius="md" padding="md" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Group gap="xs" mb="xs">
        <ThemeIcon color={color} variant="light" size="md" radius="md">
          {PLATFORM_ICONS[r.platform] ?? <IconApps size={16}/>}
        </ThemeIcon>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" fw={700} truncate>{r.appName}</Text>
        </Box>
        <Badge color="green" variant="light" size="sm">v{r.version}</Badge>
      </Group>
      <Group gap="md" mb="xs">
        {r.fileSize && <Text size="xs" c="dimmed">{r.fileSizeFormatted ?? fmtSize(r.fileSize)}</Text>}
        {r.releaseDate && <Text size="xs" c="dimmed">{dayjs(r.releaseDate).format("DD.MM.YYYY")}</Text>}
        <Text size="xs" c="dimmed">↓ {(r.downloadCount ?? 0).toLocaleString()}</Text>
      </Group>
      <Button mt="auto" fullWidth size="sm" variant="light" color={color}
        leftSection={<IconDownload size={15}/>} onClick={() => onOpen(r)} disabled={!r.downloadUrl}>
        {t("dl.downloadBtn")}
      </Button>
    </Card>
  );
}

// ─── Desktop Section ─────────────────────────────────────────────────────────
function DesktopSection({
  releases, isLoading, error, onOpen,
}: {
  releases: AppReleaseResponse[];
  isLoading: boolean;
  error: unknown;
  onOpen: (r: AppReleaseResponse) => void;
}) {
  const { t } = useTranslation();
  const [category, setCategory] = useState<AppCategory>("OFFLINE");
  const [platform, setPlatform] = useState<string>("ALL");

  const inCategory = useMemo(
    () => releases.filter(r => (r.appCategory ?? "OFFLINE") === category),
    [releases, category]
  );
  const filtered = useMemo(
    () => inCategory.filter(r => platform === "ALL" || r.platform === platform),
    [inCategory, platform]
  );

  const onlineCount  = releases.filter(r => r.appCategory === "ONLINE").length;
  const offlineCount = releases.length - onlineCount;

  return (
    <Stack gap="md">
      {/* Online / Offline */}
      <SegmentedControl fullWidth value={category}
        onChange={v => { setCategory(v as AppCategory); setPlatform("ALL"); }}
        data={[
          { value: "OFFLINE", label: (<Group gap={6} justify="center"><IconCloudOff size={14}/><Text size="sm" fw={600}>{t("dl.offline")}</Text><Badge size="xs" variant="light" circle>{offlineCount}</Badge></Group>) },
          { value: "ONLINE",  label: (<Group gap={6} justify="center"><IconCloud size={14}/><Text size="sm" fw={600}>{t("dl.online")}</Text><Badge size="xs" variant="light" circle>{onlineCount}</Badge></Group>) },
        ]}
      />

      {/* Platform tabs */}
      <Tabs value={platform} onChange={v => setPlatform(v ?? "ALL")} variant="pills">
        <Tabs.List>
          <Tabs.Tab value="ALL" leftSection={<IconApps size={14}/>}>
            {t("dl.all")} {inCategory.length > 0 && <Badge size="xs" ml={4} variant="light" circle>{inCategory.length}</Badge>}
          </Tabs.Tab>
          {(["WINDOWS", "LINUX", "MACOS"] as const).map(p => {
            const cnt = inCategory.filter(r => r.platform === p).length;
            return (
              <Tabs.Tab key={p} value={p} leftSection={PLATFORM_ICONS[p]}>
                {p === "WINDOWS" ? "Windows" : p === "LINUX" ? "Linux" : "macOS"}
                {cnt > 0 && <Badge size="xs" ml={4} variant="light" circle>{cnt}</Badge>}
              </Tabs.Tab>
            );
          })}
        </Tabs.List>
      </Tabs>

      {isLoading && (
        <SimpleGrid cols={{ base: 1, xs: 2, sm: 3 }} spacing="sm">
          {[1,2,3].map(i => <Skeleton key={i} height={130} radius="md"/>)}
        </SimpleGrid>
      )}

      {!!error && !isLoading && (
        <Alert icon={<IconAlertCircle size={16}/>} color="red">{t("dl.loadError")}</Alert>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <Center py={60}>
          <Stack align="center" gap="xs">
            <IconDeviceDesktop size={48} color="var(--mantine-color-dimmed)" style={{ opacity: 0.4 }}/>
            <Text c="dimmed" size="sm">{t("dl.noDesktop")}</Text>
          </Stack>
        </Center>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <SimpleGrid cols={{ base: 1, xs: 2, sm: 3 }} spacing="sm">
          {filtered.map(r => <ReleaseCard key={r.id} r={r} onOpen={onOpen}/>)}
        </SimpleGrid>
      )}
    </Stack>
  );
}

// ─── PWA Install ─────────────────────────────────────────────────────────────
/**
 * PWA "Bosh ekranga o'rnatish" bloki.
 * `useInstallPrompt` hooki bor edi, lekin hech qayerda ishlatilmagan —
 * ya'ni brauzerdan ilova o'rnatish imkoniyati foydalanuvchiga umuman
 * ko'rsatilmagan. Tarjimalar (`pwa.*`) 4 tilda allaqachon mavjud edi.
 */
function InstallPwaBlock() {
  const { t } = useTranslation();
  const { isInstallable, isInstalled, isStandalone, isIOS, install } =
    useInstallPrompt();
  const [installing, setInstalling] = useState(false);

  // Ilova ichida ochilgan bo'lsa — hech narsa ko'rsatmaymiz
  if (isStandalone) return null;

  const handleInstall = async () => {
    if (installing) return;
    setInstalling(true);
    try {
      await install();
    } finally {
      setInstalling(false);
    }
  };

  if (isInstalled) {
    return (
      <Group gap={6} justify="center" mt="xs">
        <IconCircleCheck size={16} color="var(--mantine-color-teal-6)" />
        <Text size="xs" c="dimmed">{t("pwa.installed")}</Text>
      </Group>
    );
  }

  if (isInstallable) {
    return (
      <Button
        fullWidth
        mt="xs"
        radius="md"
        size="md"
        variant="light"
        color="blue"
        loading={installing}
        leftSection={<IconDeviceMobileMessage size={16} />}
        onClick={handleInstall}
      >
        {t("pwa.installApp")}
      </Button>
    );
  }

  if (isIOS) {
    return (
      <Text size="xs" c="dimmed" ta="center" mt="xs">
        {t("pwa.iosInstallBanner")}
      </Text>
    );
  }

  return null;
}

// ─── Mobile Section ──────────────────────────────────────────────────────────
function MobileSection() {
  const { t } = useTranslation();

  const stores = [
    {
      platform: "Android",
      icon: <IconBrandAndroid size={28}/>,
      storeIcon: <IconBrandGooglePlay size={16}/>,
      storeName: "Google Play",
      url: PLAY_STORE_URL,
      gradient: "linear-gradient(135deg, #a8e063 0%, #56ab2f 100%)",
      color: "green" as const,
      desc: t("dl.androidDesc"),
      features: [t("dl.androidF1"), t("dl.androidF2"), t("dl.androidF3")],
    },
    {
      platform: "iOS",
      icon: <IconApple size={28}/>,
      storeIcon: <IconApple size={16}/>,
      storeName: "App Store",
      url: APP_STORE_URL,
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "violet" as const,
      desc: t("dl.iosDesc"),
      features: [t("dl.iosF1"), t("dl.iosF2"), t("dl.iosF3")],
    },
    {
      platform: "Web",
      icon: <IconWorld size={28}/>,
      storeIcon: <IconExternalLink size={16}/>,
      storeName: "pravaonline.uz",
      url: "https://pravaonline.uz",
      gradient: "linear-gradient(135deg, #4dabf7 0%, #1971c2 100%)",
      color: "blue" as const,
      desc: t("dl.webDesc"),
      features: [t("dl.webF1"), t("dl.webF2"), t("dl.webF3")],
    },
  ];

  return (
    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
      {stores.map(s => (
        <Paper key={s.platform} radius="lg" p={0} style={{ overflow: "hidden", border: "none" }} shadow="md">
          {/* Gradient header */}
          <Box p="xl" pb="lg" style={{ background: s.gradient }}>
            <Stack align="center" gap="xs">
              <ThemeIcon size={56} radius="xl" variant="white" color={s.color}>
                {s.icon}
              </ThemeIcon>
              <Text fw={800} c="white" size="xl">{s.platform}</Text>
              <Text size="xs" c="white" ta="center" style={{ opacity: 0.9 }}>{s.desc}</Text>
            </Stack>
          </Box>
          {/* Features + Button */}
          <Box p="md">
            <Stack gap={6} mb="md">
              {s.features.map((f, i) => (
                <Group key={i} gap={6} wrap="nowrap">
                  <ThemeIcon size={18} radius="xl" color={s.color} variant="light">
                    <IconCheck size={10} stroke={3}/>
                  </ThemeIcon>
                  <Text size="xs" c="dimmed">{f}</Text>
                </Group>
              ))}
            </Stack>
            <Button component="a" href={s.url} target="_blank" rel="noopener noreferrer"
              fullWidth radius="md" size="md" color={s.color} variant="filled"
              leftSection={s.storeIcon} rightSection={<IconExternalLink size={14}/>}>
              {s.storeName}
            </Button>
            {s.platform === "Web" && <InstallPwaBlock />}
          </Box>
        </Paper>
      ))}
    </SimpleGrid>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function Downloads_Page() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<AppReleaseResponse | null>(null);
  const [section, setSection]   = useState<"desktop" | "mobile">("mobile");

  const { data: releases, isLoading, error } = useSWR(
    ["downloads", i18n.language],
    () => getLatestReleases(i18n.language),
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );

  return (
    <>
      <SEO title={t("dl.pageTitle")} description={t("dl.pageDesc")} />

      <Container size="xl" py="xl" px={{ base: "md", sm: "lg" }}>
        <Stack gap="xl">

          {/* Page Header */}
          <Box ta="center">
            <ThemeIcon size={64} radius="xl" variant="gradient"
              gradient={{ from: "blue", to: "cyan", deg: 135 }} mx="auto" mb="md">
              <IconApps size={32}/>
            </ThemeIcon>
            <Title order={1} mb={4}>{t("dl.title")}</Title>
            <Text size="md" c="dimmed" maw={500} mx="auto">{t("dl.subtitle")}</Text>
          </Box>

          {/* Section Switcher: Desktop / Mobile */}
          <SegmentedControl fullWidth size="lg" radius="xl" value={section}
            onChange={v => setSection(v as "desktop" | "mobile")}
            data={[
              { value: "mobile",  label: (<Group gap={8} justify="center"><IconDeviceMobile size={18}/><Text fw={600}>{t("dl.mobile")}</Text></Group>) },
              { value: "desktop", label: (<Group gap={8} justify="center"><IconDeviceDesktop size={18}/><Text fw={600}>{t("dl.desktop")}</Text></Group>) },
            ]}
          />

          {/* Mobile Section */}
          {section === "mobile" && <MobileSection />}

          {/* Desktop Section */}
          {section === "desktop" && (
            <DesktopSection
              releases={releases ?? []}
              isLoading={isLoading}
              error={error}
              onOpen={setSelected}
            />
          )}

        </Stack>
      </Container>

      <DownloadDetailModal r={selected} onClose={() => setSelected(null)}/>
    </>
  );
}
