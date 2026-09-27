import { useState } from "react";
import useSWR from "swr";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import {
  Badge,
  Box,
  Button,
  Code,
  CopyButton,
  Divider,
  Group,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
  ActionIcon,
  Table,
  Paper,
} from "@mantine/core";
import {
  IconApple,
  IconBrandWindows,
  IconCheck,
  IconCopy,
  IconDownload,
  IconBrandGooglePlay,
  IconBrandAndroid,
  IconExternalLink,
  IconShieldCheck,
  IconQrcode,
  IconSparkles,
} from "@tabler/icons-react";
import { useInstallPrompt } from "../../hooks/useInstallPrompt";
import { getLatestReleases } from "../../api/applicationService";
import type { AppReleaseResponse } from "../../features/Downloads/types";
import { QRCodeSVG } from "../../components/common/QRCodeSVG";
import SEO from "../../components/common/SEO";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=uz.prava.online";
const APP_STORE_URL  = "https://apps.apple.com/app/prava-online/id0000000000";
const WINDOWS_DIRECT_URL = "/api/v1/files/installers/prava-online-setup.exe";
const ANDROID_APK_URL = "/api/v1/files/installers/prava-online.apk";

export default function Downloads_Page() {
  const { t } = useTranslation();
  const [selectedRelease, setSelectedRelease] = useState<AppReleaseResponse | null>(null);
  const [qrModalOpened, setQrModalOpened] = useState(false);

  const { isInstallable, install } = useInstallPrompt();
  const [installingPwa, setInstallingPwa] = useState(false);

  const { data: releases } = useSWR(
    ["downloads", i18n.language],
    () => getLatestReleases(i18n.language),
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );

  const handlePwaInstall = async () => {
    if (installingPwa) return;
    setInstallingPwa(true);
    try {
      await install();
    } finally {
      setInstallingPwa(false);
    }
  };

  const platforms = [
    {
      id: "windows",
      title: "Windows",
      tag: t("dl.recommended"),
      badgeColor: "blue",
      icon: IconBrandWindows,
      version: "v2.4.0",
      type: t("dl.windowsType"),
      desc: t(
        "dl.windowsFullDesc"
      ),
      primaryAction: {
        label: t("dl.downloadExe"),
        url: WINDOWS_DIRECT_URL,
        isExternal: false,
      },
      secondaryAction: {
        label: t("dl.viewChecksum"),
        action: () => {
          const winRelease = releases?.find((r) => r.platform === "WINDOWS");
          // Fallback when the releases API is unavailable: no fabricated
          // download count / checksum / file size — those are only shown from real data.
          const fallbackWinRelease: AppReleaseResponse = {
            id: 1,
            platform: "WINDOWS",
            appName: "Prava Online Desktop",
            appType: "WINDOWS_EXE",
            version: "2.4.0",
            versionCode: 240,
            status: "ACTIVE",
            isLatest: true,
            isForceUpdate: false,
            downloadCount: 0,
            downloadUrl: WINDOWS_DIRECT_URL,
            releaseDate: new Date().toISOString(),
            appCategory: "OFFLINE",
          };
          setSelectedRelease(winRelease || fallbackWinRelease);
        },
      },
      features: [
        t("dl.winF1"),
        t("dl.winF2"),
        t("dl.winF3"),
      ],
    },
    {
      id: "android",
      title: "Android",
      tag: "Google Play & APK",
      badgeColor: "teal",
      icon: IconBrandAndroid,
      version: "v2.1.2",
      type: t("dl.androidType"),
      desc: t(
        "dl.androidFullDesc"
      ),
      primaryAction: {
        label: "Google Play",
        url: PLAY_STORE_URL,
        isExternal: true,
        icon: IconBrandGooglePlay,
      },
      secondaryAction: {
        label: t("dl.downloadApk"),
        url: ANDROID_APK_URL,
      },
      features: [
        t("dl.andF1"),
        t("dl.andF2"),
        t("dl.andF3"),
      ],
    },
    {
      id: "ios",
      title: "iOS / iPadOS",
      tag: "Apple App Store & PWA",
      badgeColor: "gray",
      icon: IconApple,
      version: "v2.1.0",
      type: t("dl.iosType"),
      desc: t(
        "dl.iosFullDesc"
      ),
      primaryAction: {
        label: "App Store",
        url: APP_STORE_URL,
        isExternal: true,
        icon: IconApple,
      },
      secondaryAction: {
        label: isInstallable
          ? t("pwa.installApp")
          : t("dl.iosGuide"),
        action: isInstallable ? handlePwaInstall : undefined,
        url: !isInstallable ? "https://t.me/pravaonlineuz" : undefined,
      },
      features: [
        t("dl.iosF1"),
        t("dl.iosF2"),
        t("dl.iosF3"),
      ],
    },
  ];

  const systemRequirements = [
    {
      platform: "Windows",
      minOs: "Windows 10 / 11 (64-bit)",
      ram: "2 GB RAM",
      disk: "350 MB",
      extra: "DirectX 11 yoki undan yuqori",
    },
    {
      platform: "Android",
      minOs: "Android 8.0 (Oreo) va undan yuqori",
      ram: "2 GB RAM",
      disk: "120 MB",
      extra: "Google Play xizmatlari",
    },
    {
      platform: "iOS",
      minOs: "iOS 14.0 / iPadOS 14.0 yoki undan yuqori",
      ram: "2 GB RAM",
      disk: "100 MB",
      extra: "Safari PWA yoki App Store",
    },
  ];

  return (
    <>
      <SEO
        title={t("seo.downloads.title")}
        description={t("seo.downloads.desc")}
        keywords="prava online ilova, prava online dastur, prava online yuklab olish, prava desktop yuklash, prava online windows, haydovchilik testi dasturi, haydovchilik guvohnomasiga tayyorlanish dasturi, prava online android, prava app"
        canonical="/downloads"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Prava Online",
          operatingSystem: "Windows 10+, Android, iOS",
          applicationCategory: "EducationalApplication",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "UZS",
          },
          downloadUrl: "https://pravaonline.uz/downloads",
        }}
      />

      <div className="saas-page-container">
        {/* Header */}
        <div className="saas-header-block">
          <div className="saas-badge-pill">
            <IconSparkles size={13} />
            <span>{t("dl.badge")}</span>
          </div>
          <h1 className="saas-page-title">{t("dl.title")}</h1>
          <p className="saas-page-subtitle">
            {t(
              "dl.subtitle"
            )}
          </p>

          <Group gap="sm" mt="xs">
            <Button
              variant="light"
              color="blue"
              radius="md"
              leftSection={<IconQrcode size={16} />}
              onClick={() => setQrModalOpened(true)}
            >
              {t("dl.scanQr")}
            </Button>
          </Group>
        </div>

        {/* Primary Platform Cards Grid */}
        <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg" mb={64}>
          {platforms.map((p) => (
            <div
              key={p.id}
              className="saas-card"
              style={{
                display: "flex",
                flexDirection: "column",
                position: "relative",
                height: "100%",
                padding: "24px",
              }}
            >
              <Group justify="space-between" align="flex-start" mb="md" h={48}>
                <ThemeIcon size={48} radius="md" color={p.badgeColor} variant="light">
                  <p.icon size={26} />
                </ThemeIcon>
                <Badge color={p.badgeColor} variant="light" size="sm">
                  {p.tag}
                </Badge>
              </Group>

              <Text fw={800} size="lg" mb={2}>
                {p.title}
              </Text>
              <Text size="xs" c="dimmed" fw={600} mb="xs">
                {p.type} • {p.version}
              </Text>
              <Text
                size="sm"
                c="dimmed"
                lh={1.6}
                mb="md"
                style={{
                  minHeight: 48,
                }}
              >
                {p.desc}
              </Text>

              <Divider mb="md" />

              <Stack gap={8} mb="lg">
                {p.features.map((f, i) => (
                  <Group key={i} gap={8} wrap="nowrap" align="center">
                    <ThemeIcon size={18} radius="xl" color="teal" variant="light" style={{ flexShrink: 0 }}>
                      <IconCheck size={12} stroke={3} />
                    </ThemeIcon>
                    <Text size="xs" c="dimmed" style={{ lineHeight: 1.3 }}>
                      {f}
                    </Text>
                  </Group>
                ))}
              </Stack>

              <Stack gap="xs" mt="auto">
                <Button
                  component="a"
                  href={p.primaryAction.url}
                  target={p.primaryAction.isExternal ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  fullWidth
                  size="md"
                  radius="md"
                  h={46}
                  fw={600}
                  color={p.badgeColor}
                  className="saas-interactive-btn"
                  leftSection={<IconDownload size={16} />}
                  rightSection={p.primaryAction.isExternal ? <IconExternalLink size={14} /> : undefined}
                >
                  {p.primaryAction.label}
                </Button>

                {p.secondaryAction ? (
                  <Button
                    variant="subtle"
                    fullWidth
                    size="xs"
                    h={32}
                    color="gray"
                    onClick={'action' in p.secondaryAction && p.secondaryAction.action ? p.secondaryAction.action : undefined}
                    component={'url' in p.secondaryAction && p.secondaryAction.url ? "a" : undefined}
                    href={'url' in p.secondaryAction && p.secondaryAction.url ? p.secondaryAction.url : undefined}
                    target={'url' in p.secondaryAction && p.secondaryAction.url?.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                  >
                    {p.secondaryAction.label}
                  </Button>
                ) : (
                  <Box h={32} />
                )}
              </Stack>
            </div>
          ))}
        </SimpleGrid>

        {/* Security & Integrity Banner */}
        <div className="saas-card" style={{ marginBottom: 64, padding: "32px" }}>
          <Group justify="space-between" align="center" wrap="wrap" gap="lg">
            <Group gap="md">
              <ThemeIcon size={52} radius="lg" color="teal" variant="light">
                <IconShieldCheck size={28} />
              </ThemeIcon>
              <div>
                <Text fw={700} size="md">
                  {t("dl.securityTitle")}
                </Text>
                <Text size="sm" c="dimmed" maw={620} lh={1.5}>
                  {t(
                    "dl.securityDesc"
                  )}
                </Text>
              </div>
            </Group>
            <Badge size="lg" color="teal" variant="outline">
              {t("downloads.virusTotalVerified")}
            </Badge>
          </Group>
        </div>

        {/* System Requirements Table */}
        <div className="saas-card">
          <Text fw={700} size="md" mb="xs">
            {t("dl.sysReqTitle")}
          </Text>
          <Text size="xs" c="dimmed" mb="md">
            {t("dl.sysReqSub")}
          </Text>

          {/* Desktop/Tablet Table View */}
          <Box visibleFrom="sm">
            <Table.ScrollContainer minWidth={580}>
              <Table striped highlightOnHover withTableBorder={false} style={{ fontSize: 13 }}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t("dl.tblPlatform")}</Table.Th>
                    <Table.Th>{t("dl.tblOs")}</Table.Th>
                    <Table.Th>{t("dl.tblRam")}</Table.Th>
                    <Table.Th>{t("dl.tblDisk")}</Table.Th>
                    <Table.Th>{t("dl.tblExtra")}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {systemRequirements.map((row) => (
                    <Table.Tr key={row.platform}>
                      <Table.Td fw={600}>{row.platform}</Table.Td>
                      <Table.Td>{row.minOs}</Table.Td>
                      <Table.Td>{row.ram}</Table.Td>
                      <Table.Td>{row.disk}</Table.Td>
                      <Table.Td c="dimmed">{row.extra}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Box>

          {/* Mobile Responsive Cards View */}
          <Stack gap="xs" hiddenFrom="sm">
            {systemRequirements.map((row) => (
              <Paper
                key={row.platform}
                withBorder
                p="sm"
                radius="md"
                style={{ backgroundColor: "var(--surface)" }}
              >
                <Group justify="space-between" mb={6}>
                  <Text fw={700} size="sm">
                    {row.platform}
                  </Text>
                  <Badge size="xs" variant="light" color="blue">
                    {row.ram}
                  </Badge>
                </Group>
                <Stack gap={4}>
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">
                      {t("dl.tblOs")}:
                    </Text>
                    <Text size="xs" fw={500} ta="right" maw="60%">
                      {row.minOs}
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">
                      {t("dl.tblDisk")}:
                    </Text>
                    <Text size="xs" fw={500}>
                      {row.disk}
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">
                      {t("dl.tblExtra")}:
                    </Text>
                    <Text size="xs" c="dimmed" ta="right" maw="60%">
                      {row.extra}
                    </Text>
                  </Group>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </div>
      </div>

      {/* QR Code Modal for Mobile Installation */}
      <Modal
        opened={qrModalOpened}
        onClose={() => setQrModalOpened(false)}
        title={<Text fw={700}>{t("dl.qrModalTitle")}</Text>}
        centered
        radius="md"
        size="sm"
      >
        <Stack align="center" gap="md" py="sm" ta="center">
          <Box p="md" style={{ background: "#ffffff", borderRadius: 12, border: "1px solid var(--border)" }}>
            <QRCodeSVG value="https://pravaonline.uz/downloads" size={180} />
          </Box>
          <Text size="sm" c="dimmed">
            {t(
              "dl.qrModalDesc"
            )}
          </Text>
          <Button variant="light" fullWidth onClick={() => setQrModalOpened(false)}>
            {t("common.close")}
          </Button>
        </Stack>
      </Modal>

      {/* Release Details & Checksum Modal */}
      {selectedRelease && (
        <Modal
          opened={!!selectedRelease}
          onClose={() => setSelectedRelease(null)}
          title={<Text fw={700}>{selectedRelease.appName} {selectedRelease.version}</Text>}
          size="md"
          centered
          radius="md"
        >
          <Stack gap="md">
            {selectedRelease.fileSizeFormatted && (
              <Group justify="space-between">
                <Text size="xs" c="dimmed">{t("dl.size")}:</Text>
                <Text size="sm" fw={600}>{selectedRelease.fileSizeFormatted}</Text>
              </Group>
            )}
            {selectedRelease.checksum && (
              <Box>
                <Text size="xs" c="dimmed" mb={4}>{t("dl.sha256")}</Text>
                <Group gap="xs" wrap="nowrap">
                  <Code style={{ fontSize: 10, wordBreak: "break-all", flex: 1 }}>
                    {selectedRelease.checksum}
                  </Code>
                  <CopyButton value={selectedRelease.checksum} timeout={2000}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? t("common.copied") : t("common.copy")}>
                        <ActionIcon variant={copied ? "filled" : "default"} color={copied ? "green" : "gray"} size="sm" onClick={copy}>
                          {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                </Group>
              </Box>
            )}
            <Divider />
            <Button
              component="a"
              href={selectedRelease.downloadUrl || WINDOWS_DIRECT_URL}
              fullWidth
              color="blue"
              leftSection={<IconDownload size={16} />}
            >
              {t("dl.downloadNow")}
            </Button>
          </Stack>
        </Modal>
      )}
    </>
  );
}
