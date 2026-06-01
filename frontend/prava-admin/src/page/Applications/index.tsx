import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  ActionIcon, Badge, Box, Button, Center, Divider, FileButton,
  Group, Loader, Modal, SegmentedControl, Stack, Switch,
  Table, Text, TextInput, Textarea, Title, Tooltip,
  Paper, SimpleGrid, ThemeIcon, Progress,
} from "@mantine/core";
import {
  IconApps, IconCheck, IconCloudDownload, IconCloud,
  IconCloudOff, IconEdit, IconFileUpload, IconTerminal2,
  IconApple, IconPlus, IconRefresh, IconTrash, IconX,
  IconBrandWindows,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import api from "../../services/api";
import type { AppReleaseResponse, AppCategory } from "../../features/applications/types";
import dayjs from "dayjs";

// ─── API ─────────────────────────────────────────────────────────────────────
const BASE = "/api/v1/admin/app-releases";

async function fetchList(): Promise<AppReleaseResponse[]> {
  const r = await api.get<{ data: { content: AppReleaseResponse[] } | AppReleaseResponse[] }>(
    BASE + "?page=0&size=200&sortBy=createdAt&sortDir=desc"
  );
  const d = r.data.data;
  return Array.isArray(d) ? d : (d as any).content ?? [];
}
async function deleteRelease(id: number) { await api.delete(`${BASE}/${id}`); }
async function toggleStatus(id: number, active: boolean) {
  await api.patch(`${BASE}/${id}/status`, { status: active ? "ACTIVE" : "DRAFT" });
}

// ─── Platforma metadata ──────────────────────────────────────────────────────
const EXT_MAP: Record<string, { label: string; platform: string }> = {
  ".exe":      { label: "Windows (.exe)",    platform: "WINDOWS" },
  ".msi":      { label: "Windows (.msi)",    platform: "WINDOWS" },
  ".deb":      { label: "Linux (.deb)",      platform: "LINUX"   },
  ".rpm":      { label: "Linux (.rpm)",      platform: "LINUX"   },
  ".appimage": { label: "Linux (.AppImage)", platform: "LINUX"   },
  ".tar.gz":   { label: "Linux (.tar.gz)",   platform: "LINUX"   },
  ".dmg":      { label: "macOS (.dmg)",      platform: "MACOS"   },
  ".pkg":      { label: "macOS (.pkg)",      platform: "MACOS"   },
};

function detectFromFilename(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".tar.gz")) return EXT_MAP[".tar.gz"];
  const ext = lower.slice(lower.lastIndexOf("."));
  return EXT_MAP[ext] ?? null;
}

const PLATFORM_COLORS: Record<string, string> = { WINDOWS: "blue", LINUX: "orange", MACOS: "gray" };
const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  WINDOWS: <IconBrandWindows size={14} />,
  LINUX:   <IconTerminal2 size={14} />,
  MACOS:   <IconApple size={14} />,
};
const PLATFORM_LABEL: Record<string, string> = { WINDOWS: "Windows", LINUX: "Linux", MACOS: "macOS" };

function fmtSize(bytes?: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024 ** 2) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 ** 3) return (bytes / 1024 ** 2).toFixed(1) + " MB";
  return (bytes / 1024 ** 3).toFixed(2) + " GB";
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModal({ opened, onClose, editing, onSaved }: {
  opened: boolean; onClose: () => void;
  editing: AppReleaseResponse | null; onSaved: () => void;
}) {
  const { t } = useTranslation();

  const [category, setCategory] = useState<AppCategory>("OFFLINE");
  const [appName,  setAppName]  = useState("");
  const [version,  setVersion]  = useState("");
  const [desc,     setDesc]     = useState("");
  const [active,   setActive]   = useState(true);
  const [file,     setFile]     = useState<File | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (opened) {
      setCategory((editing?.appCategory as AppCategory) ?? "OFFLINE");
      setAppName(editing?.appName ?? "");
      setVersion(editing?.version ?? "");
      setDesc(editing?.releaseNotesUzl ?? "");
      setActive(editing ? editing.status === "ACTIVE" : true);
      setFile(null);
      setProgress(0);
    }
  }, [opened, editing]);

  const detected = file ? detectFromFilename(file.name) : null;

  const handleSave = async () => {
    if (!appName.trim()) { notifications.show({ color: "red", message: "Ilova nomini kiriting" }); return; }
    if (!version.trim()) { notifications.show({ color: "red", message: "Versiyani kiriting" }); return; }
    if (!editing && !file) { notifications.show({ color: "red", message: "Faylni tanlang" }); return; }

    setSaving(true);
    const form = new FormData();
    form.append("appName",     appName.trim());
    form.append("version",     version.trim());
    form.append("appCategory", category);
    form.append("isActive",    String(active));
    if (desc.trim()) form.append("description", desc.trim());
    if (file)        form.append("file", file);

    try {
      const endpoint = editing
        ? `${BASE}/${editing.id}/quick-update`
        : `${BASE}/quick-upload`;
      const method = editing ? "put" : "post";

      // KATTA fayllar uchun 30 daqiqa timeout (global 10s yetmaydi)
      await api[method](endpoint, form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30 * 60 * 1000, // 30 daqiqa
        onUploadProgress: (e) => { if (e.total) setProgress(Math.round(e.loaded / e.total * 100)); },
      });

      notifications.show({ color: "green", message: editing ? t("apps.updateSuccess") : t("apps.createSuccess") });
      onSaved();
      onClose();
    } catch (err: any) {
      notifications.show({ color: "red", title: t("common.error"), message: err?.response?.data?.message ?? String(err) });
    } finally {
      setSaving(false);
      setProgress(0);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Group gap="xs"><IconApps size={18}/><Text fw={700}>{editing ? t("apps.editRelease") : t("apps.addRelease")}</Text></Group>}
      size="md"
    >
      <Stack gap="md">

        {/* Ilova kategoriyasi: Online / Offline */}
        <Box>
          <Text size="sm" fw={500} mb={6}>Ilova turi</Text>
          <SegmentedControl
            fullWidth
            value={category}
            onChange={v => setCategory(v as AppCategory)}
            data={[
              {
                value: "OFFLINE",
                label: (
                  <Group gap={6} justify="center">
                    <IconCloudOff size={15}/>
                    <span>Offline</span>
                  </Group>
                ),
              },
              {
                value: "ONLINE",
                label: (
                  <Group gap={6} justify="center">
                    <IconCloud size={15}/>
                    <span>Online</span>
                  </Group>
                ),
              },
            ]}
          />
          <Text size="xs" c="dimmed" mt={4}>
            {category === "ONLINE"
              ? "🌐 Server bilan ishlaydi — internet kerak (ma'lumotlar baza serverda)"
              : "💾 Internetsiz ishlaydi — barcha ma'lumotlar lokal kompyuterda"}
          </Text>
        </Box>

        {/* Nom + Versiya */}
        <Group grow>
          <TextInput
            label="Ilova nomi"
            placeholder={category === "ONLINE" ? "Prava Online" : "Prava Offline"}
            value={appName}
            onChange={e => setAppName(e.target.value)}
            required
          />
          <TextInput
            label="Versiya"
            placeholder="1.0.0"
            value={version}
            onChange={e => setVersion(e.target.value)}
            required
          />
        </Group>

        {/* Fayl yuklash */}
        <Box>
          <Text size="sm" fw={500} mb={6}>
            Installer fayl {!editing && <span style={{color:"red"}}>*</span>}
          </Text>
          <FileButton
            onChange={setFile}
            accept=".exe,.msi,.deb,.rpm,.AppImage,.dmg,.pkg,.tar.gz,.zip"
          >
            {(props) => (
              <Paper
                {...props}
                withBorder radius="md" p="md"
                style={{
                  cursor: "pointer", textAlign: "center", borderStyle: "dashed",
                  borderColor: file ? "var(--mantine-color-green-5)" : "var(--mantine-color-dimmed)",
                  background: file ? "var(--mantine-color-green-0)" : undefined,
                  transition: "all .15s",
                }}
              >
                {file ? (
                  <Stack gap={4} align="center">
                    <ThemeIcon color="green" variant="light" size="lg" radius="xl"><IconCheck size={20}/></ThemeIcon>
                    <Text size="sm" fw={600}>{file.name}</Text>
                    {detected && (
                      <Group gap={4}>
                        <Badge color={PLATFORM_COLORS[detected.platform]} size="sm" leftSection={PLATFORM_ICONS[detected.platform]}>
                          {detected.label}
                        </Badge>
                        <Text size="xs" c="dimmed">— {fmtSize(file.size)}</Text>
                      </Group>
                    )}
                    <Text size="xs" c="dimmed">(qayta tanlash)</Text>
                  </Stack>
                ) : (
                  <Stack gap={4} align="center">
                    <ThemeIcon variant="light" size="lg" radius="xl"><IconFileUpload size={20}/></ThemeIcon>
                    <Text size="sm" fw={500}>Faylni tanlang yoki shu yerga tashlang</Text>
                    <Text size="xs" c="dimmed">.exe · .msi · .deb · .rpm · .AppImage · .dmg · .pkg</Text>
                    {editing?.downloadUrl && <Text size="xs" c="green">Hozirgi fayl saqlanadi</Text>}
                  </Stack>
                )}
              </Paper>
            )}
          </FileButton>
        </Box>

        {/* Tavsif */}
        <Textarea
          label="Tavsif (ixtiyoriy)"
          placeholder="Bu versiyada nima yangi..."
          rows={2}
          value={desc}
          onChange={e => setDesc(e.target.value)}
        />

        <Switch
          label={<Text size="sm">Faollashtirish</Text>}
          checked={active}
          onChange={e => setActive(e.currentTarget.checked)}
        />

        {saving && progress > 0 && (
          <Box>
            <Text size="xs" c="dimmed" mb={4}>Yuklanmoqda... {progress}%</Text>
            <Progress value={progress} animated size="sm" />
          </Box>
        )}

        <Divider />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={saving}>{t("common.cancel")}</Button>
          <Button onClick={handleSave} loading={saving} leftSection={<IconCheck size={15}/>}>
            {saving ? `${progress}%` : editing ? t("common.save") : t("apps.create")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Applications_Page() {
  const { t } = useTranslation();
  const [items,    setItems]    = useState<AppReleaseResponse[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [catFilter, setCatFilter] = useState<"ALL" | AppCategory>("ALL");
  const [modal,    setModal]    = useState(false);
  const [editing,  setEditing]  = useState<AppReleaseResponse | null>(null);

  const load = () => {
    setLoading(true);
    fetchList()
      .then(setItems)
      .catch(() => notifications.show({ color: "red", message: t("common.loadError") }))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = items.filter(it => {
    const cat = (it.appCategory ?? "OFFLINE") as AppCategory;
    if (catFilter !== "ALL" && cat !== catFilter) return false;
    if (!search) return true;
    return it.appName?.toLowerCase().includes(search.toLowerCase())
      || it.version?.toLowerCase().includes(search.toLowerCase());
  });

  const onlineCount  = items.filter(r => r.appCategory === "ONLINE").length;
  const offlineCount = items.length - onlineCount;
  const totalDl      = items.reduce((s, r) => s + (r.downloadCount ?? 0), 0);
  const activeCount  = items.filter(r => r.status === "ACTIVE").length;

  const handleDelete = (r: AppReleaseResponse) => {
    modals.openConfirmModal({
      title: t("apps.deleteTitle"),
      children: <Text size="sm">{t("apps.deleteConfirm", { name: `${r.appName} v${r.version}` })}</Text>,
      labels: { confirm: t("common.delete"), cancel: t("common.cancel") },
      confirmProps: { color: "red" },
      onConfirm: () => deleteRelease(r.id).then(() => {
        notifications.show({ color: "green", message: t("apps.deleteSuccess") });
        load();
      }).catch(() => {}),
    });
  };

  const handleToggle = (r: AppReleaseResponse) => {
    toggleStatus(r.id, r.status !== "ACTIVE").then(load).catch(() => {});
  };

  return (
    <Box>
      <Group justify="space-between" mb="md">
        <Group gap="sm">
          <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: "blue", to: "cyan", deg: 45 }}>
            <IconApps size={20}/>
          </ThemeIcon>
          <Title order={3}>{t("nav.applications")}</Title>
        </Group>
        <Group>
          <ActionIcon variant="default" onClick={load} title={t("common.refresh")}>
            <IconRefresh size={16}/>
          </ActionIcon>
          <Button leftSection={<IconPlus size={16}/>} onClick={() => { setEditing(null); setModal(true); }}>
            {t("apps.addRelease")}
          </Button>
        </Group>
      </Group>

      {/* Stats */}
      <SimpleGrid cols={{ base: 2, sm: 4 }} mb="md">
        {[
          { label: "Online ilovalar",  value: onlineCount,  color: "teal",   icon: <IconCloud size={18}/> },
          { label: "Offline ilovalar", value: offlineCount, color: "blue",   icon: <IconCloudOff size={18}/> },
          { label: "Faol relizlar",    value: activeCount,  color: "green",  icon: <IconCheck size={18}/> },
          { label: "Jami yuklab olishlar", value: totalDl,  color: "orange", icon: <IconCloudDownload size={18}/> },
        ].map(s => (
          <Paper key={s.label} withBorder radius="md" p="sm">
            <Group>
              <ThemeIcon color={s.color} variant="light" size="md">{s.icon}</ThemeIcon>
              <Box>
                <Text size="xl" fw={700}>{s.value.toLocaleString()}</Text>
                <Text size="xs" c="dimmed">{s.label}</Text>
              </Box>
            </Group>
          </Paper>
        ))}
      </SimpleGrid>

      {/* Filterlar */}
      <Group mb="md" gap="sm" align="flex-end">
        <Box style={{ flex: 1 }}>
          <TextInput
            placeholder={t("apps.searchByName")}
            value={search}
            onChange={e => setSearch(e.target.value)}
            leftSection={<IconApps size={14}/>}
            rightSection={search ? <ActionIcon variant="subtle" onClick={() => setSearch("")}><IconX size={14}/></ActionIcon> : null}
          />
        </Box>
        <SegmentedControl
          value={catFilter}
          onChange={v => setCatFilter(v as any)}
          data={[
            { value: "ALL",     label: "Barchasi" },
            { value: "ONLINE",  label: (<Group gap={4} justify="center"><IconCloud size={13}/><span>Online</span></Group>) },
            { value: "OFFLINE", label: (<Group gap={4} justify="center"><IconCloudOff size={13}/><span>Offline</span></Group>) },
          ]}
        />
      </Group>

      {/* Table */}
      {loading ? (
        <Center py={60}><Loader /></Center>
      ) : filtered.length === 0 ? (
        <Center py={60}>
          <Stack align="center" gap="xs">
            <IconApps size={48} color="var(--mantine-color-dimmed)"/>
            <Text c="dimmed">{t("apps.noReleases")}</Text>
            <Button size="sm" onClick={() => { setEditing(null); setModal(true); }}>
              + {t("apps.addFirst")}
            </Button>
          </Stack>
        </Center>
      ) : (
        <Paper withBorder radius="md">
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Ilova</Table.Th>
                <Table.Th>Turi</Table.Th>
                <Table.Th>Platforma</Table.Th>
                <Table.Th>Versiya</Table.Th>
                <Table.Th>Hajmi</Table.Th>
                <Table.Th>Yuklab olingan</Table.Th>
                <Table.Th>{t("common.status")}</Table.Th>
                <Table.Th>{t("common.actions")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.map(r => {
                const cat = (r.appCategory ?? "OFFLINE") as AppCategory;
                return (
                  <Table.Tr key={r.id}>
                    <Table.Td>
                      <Text size="sm" fw={600}>{r.appName}</Text>
                      {r.releaseDate && <Text size="xs" c="dimmed">{dayjs(r.releaseDate).format("DD.MM.YYYY")}</Text>}
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={cat === "ONLINE" ? "teal" : "blue"}
                        variant="light"
                        leftSection={cat === "ONLINE" ? <IconCloud size={12}/> : <IconCloudOff size={12}/>}
                      >
                        {cat === "ONLINE" ? "Online" : "Offline"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={PLATFORM_COLORS[r.platform] ?? "gray"}
                        leftSection={PLATFORM_ICONS[r.platform]}
                        variant="light"
                        size="sm"
                      >
                        {PLATFORM_LABEL[r.platform] ?? r.platform}
                      </Badge>
                    </Table.Td>
                    <Table.Td><Text size="sm" ff="monospace">v{r.version}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="dimmed">{r.fileSizeFormatted ?? fmtSize(r.fileSize)}</Text></Table.Td>
                    <Table.Td><Text size="sm">{(r.downloadCount ?? 0).toLocaleString()}</Text></Table.Td>
                    <Table.Td>
                      <Switch size="sm" checked={r.status === "ACTIVE"} onChange={() => handleToggle(r)} color="green" />
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <Tooltip label={t("common.edit")}>
                          <ActionIcon variant="light" onClick={() => { setEditing(r); setModal(true); }}>
                            <IconEdit size={15}/>
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label={t("common.delete")}>
                          <ActionIcon variant="light" color="red" onClick={() => handleDelete(r)}>
                            <IconTrash size={15}/>
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Paper>
      )}

      <UploadModal opened={modal} onClose={() => setModal(false)} editing={editing} onSaved={load} />
    </Box>
  );
}
