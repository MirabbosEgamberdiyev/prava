import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Badge,
  Box,
  Button,
  Code,
  CopyButton,
    Group,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
    ActionIcon,
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
    IconDeviceMobile,
  IconCloudCheck,
  IconWifiOff,
  IconHeadphones,
} from "@tabler/icons-react";
import { QRCodeSVG } from "../../components/common/QRCodeSVG";
import SEO from "../../components/common/SEO";
import { DomainLink } from "../../components/common/DomainLink";
import { getWebAppUrl } from "../../utils/domain";

// ─── Direct Download URLs & App Stores ──────────────────────────────────────────
const WINDOWS_ONLINE_SETUP_URL  = "/api/v1/files/installers/prava-online-setup.exe";
const WINDOWS_PORTABLE_URL      = "/api/v1/files/installers/prava-online.exe";
const WINDOWS_MSI_URL           = "/api/v1/files/installers/prava-online.msi";
const WINDOWS_OFFLINE_SETUP_URL = "/api/v1/files/installers/prava-offline-setup.exe";
const ANDROID_UNIVERSAL_APK_URL = "/api/v1/files/installers/prava-online.apk";
const ANDROID_ARM64_APK_URL     = "/api/v1/files/installers/prava-online-arm64.apk";
const PLAY_STORE_URL            = "https://play.google.com/store/apps/details?id=uz.prava.online";
const APP_STORE_URL             = "https://apps.apple.com/app/prava-online/id0000000000";

export default function Downloads_Page() {
  const { t } = useTranslation();
  const [checksumModalOpened, setChecksumModalOpened] = useState(false);
  const [qrModalOpened, setQrModalOpened] = useState(false);
  const [qrTarget, setQrTarget] = useState<"universal" | "arm64" | "offline" | "online">("universal");

    
  
  
  const getQrUrl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://pravaonline.uz";
    if (qrTarget === "universal") return origin + ANDROID_UNIVERSAL_APK_URL;
    if (qrTarget === "arm64") return origin + ANDROID_ARM64_APK_URL;
    if (qrTarget === "offline") return origin + WINDOWS_OFFLINE_SETUP_URL;
    if (qrTarget === "online") return origin + WINDOWS_ONLINE_SETUP_URL;
    return origin + "/downloads";
  };

  const checksumList = [
    { name: "Prava-Online-Setup.exe (Online)", size: "12.6 MB", sha: "DDE9A0F1F9865D99B816EC1FD644F5DFF914C6C8C51816DDB166B9BC9752EA78" },
    { name: "Prava-Desktop-Offline-Setup.exe (Offline)", size: "160.3 MB", sha: "8E1EE9D159AF4F27BE541DCBC32C4F9052E371D1BD7C622C3CE81ED95C795931" },
    { name: "PravaOnline.apk (Android Universal)", size: "65.3 MB", sha: "0263062D555B214F9D9CC2A4C00E49FD0701633C0C3504B62900D1679DBB55ED" },
    { name: "PravaOnline-arm64.apk (Android 64-bit)", size: "38.5 MB", sha: "4B593A79FD824B7763493805754F0397FF7B4C8721DB38A10E6E46D215728524" },
  ];

  return (
    <>
      <SEO
        title={t("seo.downloads.title", "Yuklab olish — PRAVA-ONLINE ilovalari")}
        description={t("seo.downloads.desc", "Windows kompyuter (Online va Offline) hamda Android/iOS mobil ilovalari.")}
        canonical="/downloads"
      />

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 20px 80px" }}>
        {/* Sleek Minimal Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <Group justify="center" gap="xs" mb="xs">
            <Badge variant="light" color="blue" size="md" radius="sm">
              RASMIY RELIZLAR
            </Badge>
          </Group>
          <Text fw={900} style={{ fontSize: "clamp(24px, 4vw, 36px)", letterSpacing: "-0.5px" }}>
            Ilova va Dasturlarni Yuklab Olish
          </Text>
          <Text c="dimmed" size="sm" mt={6} style={{ maxWidth: 540, margin: "6px auto 16px" }}>
            Kompyuterda (online yoki internetsiz) va mobil telefonda imtihonga eng qulay formatda tayyorlaning.
          </Text>

          <Button
            variant="default"
            size="xs"
            radius="md"
            leftSection={<IconQrcode size={15} color="#2563eb" />}
            onClick={() => setQrModalOpened(true)}
          >
            Telefonga QR-kod bilan yuklab olish
          </Button>
        </div>

        {/* Dual Main Cards Grid */}
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
          {/* ═════════ 1. WINDOWS DESKTOP (ONLINE & OFFLINE) ═════════ */}
          <Paper
            withBorder
            p="xl"
            radius="lg"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <Group justify="space-between" align="center" mb="lg">
              <Group gap="sm">
                <ThemeIcon size={42} radius="md" color="blue" variant="light">
                  <IconBrandWindows size={24} />
                </ThemeIcon>
                <div>
                  <Text fw={800} size="lg">
                    Windows Desktop
                  </Text>
                  <Text size="xs" c="dimmed">
                    Kompyuter va noutbuklar uchun
                  </Text>
                </div>
              </Group>
              <Badge color="blue" variant="light" size="sm">
                WINDOWS 10 / 11
              </Badge>
            </Group>

            <Stack gap="lg" style={{ flex: 1 }}>
              {/* Option A: Windows Online */}
              <Box
                p="md"
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  backgroundColor: "rgba(37, 99, 235, 0.03)",
                }}
              >
                <Group justify="space-between" align="center" mb={6}>
                  <Group gap={6}>
                    <IconCloudCheck size={18} color="#2563eb" />
                    <Text fw={700} size="sm">
                      Online Desktop (Bulutli)
                    </Text>
                  </Group>
                  <Badge color="blue" size="xs" variant="filled">
                    12.6 MB
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed" mb="sm" lh={1.4}>
                  Yengil va tezkor. Natijalar telefon va shaxsiy kabinet bilan real vaqtda sinxronlanadi.
                </Text>

                <Group gap="xs" wrap="wrap">
                  <Button
                    component="a"
                    href={WINDOWS_ONLINE_SETUP_URL}
                    download
                    size="sm"
                    radius="md"
                    color="blue"
                    leftSection={<IconDownload size={15} />}
                    style={{ flex: 1, minWidth: 150 }}
                  >
                    Setup (.exe) — 13 MB
                  </Button>
                  <Button
                    component="a"
                    href={WINDOWS_PORTABLE_URL}
                    download
                    variant="light"
                    color="blue"
                    size="sm"
                    radius="md"
                  >
                    Portable (.exe)
                  </Button>
                  <Button
                    component="a"
                    href={WINDOWS_MSI_URL}
                    download
                    variant="subtle"
                    color="blue"
                    size="xs"
                  >
                    .msi
                  </Button>
                </Group>
              </Box>

              {/* Option B: Windows Offline */}
              <Box p="md"
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  backgroundColor: "rgba(124, 58, 237, 0.03)",
                }}
              >
                <Group justify="space-between" align="center" mb={6}>
                  <Group gap={6}>
                    <IconWifiOff size={18} color="#7c3aed" />
                    <Text fw={700} size="sm">
                      Offline Desktop (Avtomaktab)
                    </Text>
                  </Group>
                  <Badge color="violet" size="xs" variant="filled">
                    160 MB • 100% OFFLINE
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed" mb="sm" lh={1.4}>
                  Avtomaktab sinflari uchun to'liq internetsiz ishlaydi. 1000+ ta testlar va rasmlar dastur ichida o'rnatilgan.
                </Text>

                <Button
                  component="a"
                  href={WINDOWS_OFFLINE_SETUP_URL}
                  download
                  fullWidth
                  size="sm"
                  radius="md"
                  color="violet"
                  leftSection={<IconDownload size={15} />}
                >
                  Oflayn Setup (.exe) — 160 MB
                </Button>
              </Box>
            </Stack>
          </Paper>

          {/* ═════════ 2. MOBIL ILOVA (ANDROID & IOS) ═════════ */}
          <Paper
            withBorder
            p="xl"
            radius="lg"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <Group justify="space-between" align="center" mb="lg">
              <Group gap="sm">
                <ThemeIcon size={42} radius="md" color="teal" variant="light">
                  <IconDeviceMobile size={24} />
                </ThemeIcon>
                <div>
                  <Text fw={800} size="lg">
                    Mobil Ilova
                  </Text>
                  <Text size="xs" c="dimmed">
                    Android va Apple iOS uchun
                  </Text>
                </div>
              </Group>
              <Badge color="teal" variant="light" size="sm">
                ANDROID &amp; IOS
              </Badge>
            </Group>

            <Stack gap="lg" style={{ flex: 1 }}>
              {/* Option A: Android APK & Play Store */}
              <Box p="md"
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  backgroundColor: "rgba(16, 185, 129, 0.03)",
                }}
              >
                <Group justify="space-between" align="center" mb={6}>
                  <Group gap={6}>
                    <IconBrandAndroid size={18} color="#10b981" />
                    <Text fw={700} size="sm">
                      Android (APK &amp; Google Play)
                    </Text>
                  </Group>
                  <Badge color="teal" size="xs" variant="filled">
                    68 MB APK
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed" mb="sm" lh={1.4}>
                  Telefoningizda har qanday joyda test yechish, xatolar ustida ishlash va imtihonga tayyorlanish.
                </Text>

                <Group gap="xs" wrap="wrap">
                  <Button
                    component="a"
                    href={ANDROID_UNIVERSAL_APK_URL}
                    download
                    size="sm"
                    radius="md"
                    color="teal"
                    leftSection={<IconDownload size={15} />}
                    style={{ flex: 1, minWidth: 150 }}
                  >
                    Universal APK (68 MB)
                  </Button>
                  <Button
                    component="a"
                    href={ANDROID_ARM64_APK_URL}
                    download
                    variant="light"
                    color="teal"
                    size="sm"
                    radius="md"
                  >
                    ARM64 (38 MB)
                  </Button>
                  <Button
                    component="a"
                    href={PLAY_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="default"
                    size="sm"
                    radius="md"
                    leftSection={<IconBrandGooglePlay size={14} color="#00e676" />}
                  >
                    Google Play
                  </Button>
                </Group>
              </Box>

              {/* Option B: iOS & Web PWA */}
              <Box p="md"
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  backgroundColor: "rgba(100, 116, 139, 0.03)",
                }}
              >
                <Group justify="space-between" align="center" mb={6}>
                  <Group gap={6}>
                    <IconApple size={18} />
                    <Text fw={700} size="sm">
                      Apple iOS (iPhone &amp; iPad)
                    </Text>
                  </Group>
                  <Badge color="gray" size="xs" variant="light">
                    APP STORE &amp; PWA
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed" mb="sm" lh={1.4}>
                  App Store do'koni orqali yoki Safari brauzeridan bir zumda PWA ilova sifatida o'rnating.
                </Text>

                <Group gap="xs" wrap="wrap">
                  <Button
                    component="a"
                    href={APP_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="sm"
                    radius="md"
                    variant="default"
                    leftSection={<IconApple size={15} />}
                    style={{ flex: 1, minWidth: 130 }}
                  >
                    App Store
                  </Button>
                  <DomainLink href={getWebAppUrl("/auth/login")} style={{ textDecoration: "none", flex: 1 }}>
                    <Button
                      variant="light"
                      color="blue"
                      fullWidth
                      size="sm"
                      radius="md"
                      rightSection={<IconExternalLink size={14} />}
                    >
                      Web Ilovaga o'tish
                    </Button>
                  </DomainLink>
                </Group>
              </Box>
            </Stack>
          </Paper>
        </SimpleGrid>

        {/* Clean, Non-intrusive Footer Info */}
        <Group justify="space-between" align="center" mt={36} p="md" style={{ borderTop: "1px solid var(--border)" }}>
          <Group gap="xs">
            <IconHeadphones size={16} color="#64748b" />
            <Text size="xs" c="dimmed">
              O'rnatishda yordam yoki savollar bo'lsa: <b>@MirabbosEgamberdiyev</b> | <b>+998 88 999 64 99</b>
            </Text>
          </Group>

          <Button
            variant="subtle"
            size="xs"
            color="gray"
            leftSection={<IconShieldCheck size={14} />}
            onClick={() => setChecksumModalOpened(true)}
          >
            Fayllar xavfsizligi va SHA-256
          </Button>
        </Group>
      </div>

      {/* ─── Clean QR Code Modal ─── */}
      <Modal
        opened={qrModalOpened}
        onClose={() => setQrModalOpened(false)}
        title={<Text fw={700}>Mobil qurilmada yuklab olish</Text>}
        centered
        radius="lg"
        size="sm"
      >
        <Stack align="center" gap="md" py="xs">
          <Paper p="md" radius="md" withBorder style={{ backgroundColor: "#ffffff" }}>
            <QRCodeSVG value={getQrUrl()} size={200} level="H" />
          </Paper>
          <Text size="xs" c="dimmed" ta="center">
            Kamerangizni QR-kodga qarating va faylni to'g'ridan-to'g'ri telefoningizga yuklab oling.
          </Text>
          <Group gap="xs">
            <Button
              size="xs"
              variant={qrTarget === "universal" ? "filled" : "default"}
              color="teal"
              onClick={() => setQrTarget("universal")}
            >
              Android APK
            </Button>
            <Button
              size="xs"
              variant={qrTarget === "offline" ? "filled" : "default"}
              color="violet"
              onClick={() => setQrTarget("offline")}
            >
              Windows Offline
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* ─── Checksum Modal (Compact, only on demand) ─── */}
      <Modal
        opened={checksumModalOpened}
        onClose={() => setChecksumModalOpened(false)}
        title={<Text fw={700}>Fayllarning SHA-256 Nazorat Summalari</Text>}
        centered
        radius="lg"
        size="md"
      >
        <Stack gap="sm">
          {checksumList.map((item, idx) => (
            <Paper key={idx} p="xs" withBorder radius="md">
              <Group justify="space-between" mb={4}>
                <Text fw={600} size="xs">
                  {item.name}
                </Text>
                <Badge size="xs" variant="light">
                  {item.size}
                </Badge>
              </Group>
              <Group gap="xs">
                <Code style={{ fontSize: 10, wordBreak: "break-all", flex: 1 }}>{item.sha}</Code>
                <CopyButton value={item.sha}>
                  {({ copied, copy }) => (
                    <ActionIcon size="sm" color={copied ? "teal" : "gray"} variant="subtle" onClick={copy}>
                      {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                    </ActionIcon>
                  )}
                </CopyButton>
              </Group>
            </Paper>
          ))}
        </Stack>
      </Modal>
    </>
  );
}
