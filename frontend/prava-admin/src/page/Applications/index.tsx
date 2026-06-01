import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  ActionIcon, Badge, Box, Button, Card, Divider, Flex, FileInput,
  Grid, Group, Modal, NumberInput, Progress, Select, Stack, Switch,
  Table, Text, TextInput, Textarea, Title, Tooltip,
  Paper, SimpleGrid, Loader, Center, Anchor, CopyButton,
  Menu,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconApps, IconCheck, IconChevronLeft, IconChevronRight,
  IconCloudDownload, IconCopy, IconDeviceDesktop, IconDots,
  IconEdit, IconExternalLink, IconFilter, IconPackage,
  IconPlayerPlay, IconPlus, IconRefresh, IconSearch,
  IconStar, IconStarFilled, IconTrash, IconUpload, IconX,
} from "@tabler/icons-react";
import dayjs from "dayjs";

import {
  createRelease, deleteRelease, listReleases,
  setReleaseLatest, setReleaseStatus, updateRelease, uploadInstallerFile,
} from "../../services/applicationService";
import type {
  AppPlatform, AppReleaseFilter, AppReleaseRequest,
  AppReleaseResponse, AppReleaseStatus, AppType, PageResponse,
} from "../../features/applications/types";
import {
  APP_TYPE_LABELS, PLATFORM_LABELS, PLATFORM_TYPES, STATUS_COLORS,
} from "../../features/applications/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORMS = Object.keys(PLATFORM_LABELS) as AppPlatform[];
const ALL_STATUSES: AppReleaseStatus[] = ["DRAFT", "ACTIVE", "DEPRECATED", "YANKED"];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatsCard({
  icon, value, label, color,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <Card withBorder radius="md" p="md">
      <Group gap="sm">
        <Box
          w={40} h={40}
          style={{
            borderRadius: 8,
            background: `var(--mantine-color-${color}-light)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Box c={`${color}.6`}>{icon}</Box>
        </Box>
        <Box>
          <Text fw={700} size="xl" lh={1}>{value}</Text>
          <Text size="xs" c="dimmed" mt={2}>{label}</Text>
        </Box>
      </Group>
    </Card>
  );
}

// ─── Form modal ───────────────────────────────────────────────────────────────

interface FormValues extends Omit<AppReleaseRequest, "releaseDate"> {
  releaseDate: Date | null;
}

function ReleaseFormModal({
  opened, onClose, editing, onSaved,
}: {
  opened:   boolean;
  onClose:  () => void;
  editing:  AppReleaseResponse | null;
  onSaved:  () => void;
}) {
  const { t } = useTranslation();
  const [saving, setSaving]           = useState(false);
  const [uploadFile, setUploadFile]   = useState<File | null>(null);
  const [uploadPct, setUploadPct]     = useState(0);
  const [uploading, setUploading]     = useState(false);
  const savedIdRef                    = useRef<number | null>(null);

  const form = useForm<FormValues>({
    initialValues: {
      appName:             "",
      platform:            "WINDOWS",
      appType:             "WINDOWS_EXE",
      version:             "",
      versionCode:         1000,
      status:              "DRAFT",
      isLatest:            false,
      isForceUpdate:       false,
      minSupportedVersion: "",
      releaseNotesUzl:     "",
      releaseNotesUzc:     "",
      releaseNotesRu:      "",
      releaseNotesEn:      "",
      releaseDate:         null,
      downloadUrl:         "",
      fileSize:            undefined,
      checksum:            "",
    },
    validate: {
      appName:     (v) => v.trim() ? null : t("validation.required"),
      version:     (v) => /^\d+\.\d+\.\d+$/.test(v) ? null : t("apps.versionFormatError"),
      versionCode: (v) => v > 0 ? null : t("validation.required"),
      platform:    (v) => v ? null : t("validation.required"),
      appType:     (v) => v ? null : t("validation.required"),
    },
  });

  // Editing bo'lsa formni to'ldirish
  useEffect(() => {
    if (editing) {
      form.setValues({
        appName:             editing.appName,
        platform:            editing.platform,
        appType:             editing.appType,
        version:             editing.version,
        versionCode:         editing.versionCode,
        status:              editing.status,
        isLatest:            editing.isLatest,
        isForceUpdate:       editing.isForceUpdate,
        minSupportedVersion: editing.minSupportedVersion ?? "",
        releaseNotesUzl:     editing.releaseNotesUzl ?? "",
        releaseNotesUzc:     editing.releaseNotesUzc ?? "",
        releaseNotesRu:      editing.releaseNotesRu  ?? "",
        releaseNotesEn:      editing.releaseNotesEn  ?? "",
        releaseDate:         editing.releaseDate ? new Date(editing.releaseDate) : null,
        downloadUrl:         editing.downloadUrl ?? "",
        fileSize:            editing.fileSize,
        checksum:            editing.checksum ?? "",
      });
    } else {
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, opened]);

  // Platform o'zgarganda appType ni auto-select qilish
  const handlePlatformChange = (val: string | null) => {
    const p = val as AppPlatform;
    form.setFieldValue("platform", p);
    const types = PLATFORM_TYPES[p] ?? [];
    if (types.length > 0) form.setFieldValue("appType", types[0]);
  };

  const handleSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const req: AppReleaseRequest = {
        ...values,
        releaseDate: values.releaseDate ? dayjs(values.releaseDate).format("YYYY-MM-DD") : undefined,
        minSupportedVersion: values.minSupportedVersion?.trim() || undefined,
        downloadUrl: values.downloadUrl?.trim() || undefined,
        checksum:    values.checksum?.trim()    || undefined,
      };

      let savedId: number;
      if (editing) {
        const resp = await updateRelease(editing.id, req);
        savedId = resp.id;
        notifications.show({ color: "green", message: t("apps.updateSuccess") });
      } else {
        const resp = await createRelease(req);
        savedId = resp.id;
        notifications.show({ color: "green", message: t("apps.createSuccess") });
      }
      savedIdRef.current = savedId;

      // Fayl tanlangan bo'lsa — yuklash
      if (uploadFile) {
        setSaving(false);
        setUploading(true);
        setUploadPct(0);
        try {
          await uploadInstallerFile(savedId, uploadFile, setUploadPct);
          notifications.show({ color: "teal", message: t("apps.uploadSuccess") });
        } catch (uploadErr: any) {
          notifications.show({
            color: "orange",
            title: t("apps.uploadWarning"),
            message: uploadErr?.response?.data?.message ?? String(uploadErr),
          });
        } finally {
          setUploading(false);
          setUploadPct(0);
        }
      }

      onSaved();
      onClose();
    } catch (e: any) {
      notifications.show({
        color: "red",
        title: t("common.error"),
        message: e?.response?.data?.message ?? String(e),
      });
    } finally {
      setSaving(false);
    }
  };

  const availableTypes = PLATFORM_TYPES[form.values.platform as AppPlatform] ?? [];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconPackage size={18} />
          <Text fw={600}>{editing ? t("apps.editRelease") : t("apps.addRelease")}</Text>
        </Group>
      }
      size="xl"
      scrollAreaComponent={Modal.NativeScrollArea}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">

          {/* ── Asosiy ma'lumotlar ── */}
          <Paper withBorder p="sm" radius="sm">
            <Text size="sm" fw={600} c="dimmed" mb="sm">{t("apps.basicInfo")}</Text>
            <Grid>
              <Grid.Col span={12}>
                <TextInput
                  label={t("apps.appName")}
                  placeholder="Prava Desktop Online"
                  required
                  {...form.getInputProps("appName")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label={t("apps.platform")}
                  required
                  data={PLATFORMS.map((p) => ({
                    value: p,
                    label: `${PLATFORM_LABELS[p].emoji} ${PLATFORM_LABELS[p].label}`,
                  }))}
                  value={form.values.platform}
                  onChange={handlePlatformChange}
                  error={form.errors.platform}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label={t("apps.appType")}
                  required
                  data={availableTypes.map((t) => ({
                    value: t,
                    label: APP_TYPE_LABELS[t],
                  }))}
                  {...form.getInputProps("appType")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <TextInput
                  label={t("apps.version")}
                  placeholder="1.2.3"
                  required
                  {...form.getInputProps("version")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <NumberInput
                  label={t("apps.versionCode")}
                  placeholder="10203"
                  required
                  min={1}
                  {...form.getInputProps("versionCode")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Select
                  label={t("apps.status")}
                  data={ALL_STATUSES.map((s) => ({ value: s, label: t(`apps.status_${s}`) }))}
                  {...form.getInputProps("status")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <DatePickerInput
                  label={t("apps.releaseDate")}
                  placeholder="2025-01-01"
                  clearable
                  valueFormat="YYYY-MM-DD"
                  {...form.getInputProps("releaseDate")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label={t("apps.minSupportedVersion")}
                  placeholder="1.0.0"
                  {...form.getInputProps("minSupportedVersion")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Switch
                  label={t("apps.isLatest")}
                  description={t("apps.isLatestDesc")}
                  checked={form.values.isLatest}
                  onChange={(e) => form.setFieldValue("isLatest", e.currentTarget.checked)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Switch
                  label={t("apps.isForceUpdate")}
                  description={t("apps.isForceUpdateDesc")}
                  color="red"
                  checked={form.values.isForceUpdate}
                  onChange={(e) => form.setFieldValue("isForceUpdate", e.currentTarget.checked)}
                />
              </Grid.Col>
            </Grid>
          </Paper>

          {/* ── Fayl ── */}
          <Paper withBorder p="sm" radius="sm">
            <Text size="sm" fw={600} c="dimmed" mb="sm">{t("apps.fileInfo")}</Text>
            <Grid>
              {/* Fayl yuklash */}
              <Grid.Col span={12}>
                <FileInput
                  label={t("apps.uploadFile")}
                  description={t("apps.uploadFileDesc")}
                  placeholder={t("apps.uploadFilePlaceholder")}
                  leftSection={<IconUpload size={14} />}
                  accept=".exe,.msi,.deb,.rpm,.AppImage,.dmg,.pkg,.tar.gz,.zip"
                  clearable
                  value={uploadFile}
                  onChange={setUploadFile}
                />
                {uploadFile && (
                  <Text size="xs" c="dimmed" mt={4}>
                    {uploadFile.name} — {(uploadFile.size / 1024 / 1024).toFixed(1)} MB
                  </Text>
                )}
              </Grid.Col>

              {/* Yoki URL qo'lda kiritish */}
              <Grid.Col span={12}>
                <Text size="xs" c="dimmed" ta="center">— {t("apps.orManualUrl")} —</Text>
              </Grid.Col>
              <Grid.Col span={12}>
                <TextInput
                  label={t("apps.downloadUrl")}
                  placeholder="https://github.com/... yoki /api/v1/files/..."
                  leftSection={<IconExternalLink size={14} />}
                  disabled={!!uploadFile}
                  {...form.getInputProps("downloadUrl")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <NumberInput
                  label={t("apps.fileSize")}
                  placeholder="Baytlarda (auto fayl yuklanganda)"
                  min={0}
                  disabled={!!uploadFile}
                  {...form.getInputProps("fileSize")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="SHA-256 Checksum"
                  placeholder="Auto-hisoblanadi yoki qo'lda kiriting"
                  disabled={!!uploadFile}
                  {...form.getInputProps("checksum")}
                />
              </Grid.Col>
            </Grid>

            {/* Upload progress */}
            {uploading && (
              <Box mt="sm">
                <Text size="xs" c="dimmed" mb={4}>{t("apps.uploading")} {uploadPct}%</Text>
                <Progress value={uploadPct} animated striped />
              </Box>
            )}
          </Paper>

          {/* ── Release notes ── */}
          <Paper withBorder p="sm" radius="sm">
            <Text size="sm" fw={600} c="dimmed" mb="sm">{t("apps.releaseNotes")}</Text>
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Textarea
                  label="O'zbekcha (lotin)"
                  placeholder="Yangiliklar..."
                  rows={3}
                  {...form.getInputProps("releaseNotesUzl")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Textarea
                  label="O'zbekcha (kirill)"
                  placeholder="Янгиликлар..."
                  rows={3}
                  {...form.getInputProps("releaseNotesUzc")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Textarea
                  label="Ruscha"
                  placeholder="Что нового..."
                  rows={3}
                  {...form.getInputProps("releaseNotesRu")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Textarea
                  label="English"
                  placeholder="What's new..."
                  rows={3}
                  {...form.getInputProps("releaseNotesEn")}
                />
              </Grid.Col>
            </Grid>
          </Paper>

          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose} disabled={saving || uploading}>
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              loading={saving || uploading}
              leftSection={<IconCheck size={16} />}
              disabled={saving || uploading}
            >
              {uploading
                ? `${t("apps.uploading")} ${uploadPct}%`
                : editing ? t("common.save") : t("apps.create")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Applications_Page() {
  const { t } = useTranslation();

  // ── State ────────────────────────────────────────────────────────────────
  const [data, setData]           = useState<PageResponse<AppReleaseResponse> | null>(null);
  const [loading, setLoading]     = useState(true);
  const [formOpen, setFormOpen]   = useState(false);
  const [editing, setEditing]     = useState<AppReleaseResponse | null>(null);

  const [filter, setFilter] = useState<AppReleaseFilter>({
    page: 0, size: 15, sortBy: "releaseDate", sortDir: "desc",
  });

  // Summary stats
  const totalDownloads = data?.content.reduce((s, r) => s + (r.downloadCount ?? 0), 0) ?? 0;
  const activeCount    = data?.content.filter((r) => r.status === "ACTIVE").length ?? 0;
  const latestCount    = data?.content.filter((r) => r.isLatest).length ?? 0;

  // ── Load ─────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listReleases(filter);
      setData(res);
    } catch {
      notifications.show({ color: "red", message: t("common.loadError") });
    } finally {
      setLoading(false);
    }
  }, [filter, t]);

  useEffect(() => { load(); }, [load]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleAdd    = () => { setEditing(null); setFormOpen(true); };
  const handleEdit   = (r: AppReleaseResponse) => { setEditing(r);  setFormOpen(true); };
  const handleSaved  = () => load();

  const handleDelete = (id: number, name: string) => {
    modals.openConfirmModal({
      title: t("apps.deleteTitle"),
      children: <Text size="sm">{t("apps.deleteConfirm", { name })}</Text>,
      labels: { confirm: t("common.delete"), cancel: t("common.cancel") },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await deleteRelease(id);
          notifications.show({ color: "green", message: t("apps.deleteSuccess") });
          load();
        } catch (e: any) {
          notifications.show({ color: "red", message: e?.response?.data?.message ?? String(e) });
        }
      },
    });
  };

  const handleSetStatus = async (id: number, status: AppReleaseStatus) => {
    try {
      await setReleaseStatus(id, status);
      notifications.show({ color: "green", message: t("apps.statusChanged") });
      load();
    } catch (e: any) {
      notifications.show({ color: "red", message: e?.response?.data?.message ?? String(e) });
    }
  };

  const handleSetLatest = async (id: number) => {
    try {
      await setReleaseLatest(id);
      notifications.show({ color: "teal", message: t("apps.setLatestSuccess") });
      load();
    } catch (e: any) {
      notifications.show({ color: "red", message: e?.response?.data?.message ?? String(e) });
    }
  };

  // ── Pagination ────────────────────────────────────────────────────────────
  const goPage = (p: number) => setFilter((f) => ({ ...f, page: p }));

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Stack gap="lg">

      {/* Header */}
      <Group justify="space-between">
        <Group gap="xs">
          <IconApps size={24} />
          <Title order={3}>{t("nav.applications")}</Title>
          {data && (
            <Badge variant="light" size="lg">
              {data.totalElements}
            </Badge>
          )}
        </Group>
        <Group>
          <ActionIcon variant="subtle" onClick={load} loading={loading}>
            <IconRefresh size={18} />
          </ActionIcon>
          <Button leftSection={<IconPlus size={16} />} onClick={handleAdd}>
            {t("apps.addRelease")}
          </Button>
        </Group>
      </Group>

      {/* Stats */}
      <SimpleGrid cols={{ base: 2, sm: 4 }}>
        <StatsCard
          icon={<IconApps size={20} />}
          value={data?.totalElements ?? 0}
          label={t("apps.totalReleases")}
          color="blue"
        />
        <StatsCard
          icon={<IconPlayerPlay size={20} />}
          value={activeCount}
          label={t("apps.activeReleases")}
          color="green"
        />
        <StatsCard
          icon={<IconStarFilled size={20} />}
          value={latestCount}
          label={t("apps.latestReleases")}
          color="yellow"
        />
        <StatsCard
          icon={<IconCloudDownload size={20} />}
          value={totalDownloads.toLocaleString()}
          label={t("apps.totalDownloads")}
          color="teal"
        />
      </SimpleGrid>

      {/* Filters */}
      <Card withBorder radius="md" p="sm">
        <Grid align="flex-end" gutter="sm">
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <TextInput
              placeholder={t("apps.searchByName")}
              leftSection={<IconSearch size={14} />}
              value={filter.appName ?? ""}
              onChange={(e) => setFilter((f) => ({ ...f, appName: e.target.value, page: 0 }))}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 6, sm: 2 }}>
            <Select
              placeholder={t("apps.platform")}
              clearable
              data={PLATFORMS.map((p) => ({
                value: p, label: `${PLATFORM_LABELS[p].emoji} ${PLATFORM_LABELS[p].label}`,
              }))}
              value={filter.platform ?? null}
              onChange={(v) => setFilter((f) => ({
                ...f, platform: (v as AppPlatform) ?? undefined, page: 0,
              }))}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 6, sm: 2 }}>
            <Select
              placeholder={t("apps.status")}
              clearable
              data={ALL_STATUSES.map((s) => ({ value: s, label: t(`apps.status_${s}`) }))}
              value={filter.status ?? null}
              onChange={(v) => setFilter((f) => ({
                ...f, status: (v as AppReleaseStatus) ?? undefined, page: 0,
              }))}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 2 }}>
            <TextInput
              placeholder={t("apps.versionSearch")}
              leftSection={<IconFilter size={14} />}
              value={filter.version ?? ""}
              onChange={(e) => setFilter((f) => ({ ...f, version: e.target.value, page: 0 }))}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Button
              variant="subtle"
              leftSection={<IconX size={14} />}
              onClick={() => setFilter({ page: 0, size: 15, sortBy: "releaseDate", sortDir: "desc" })}
            >
              {t("common.clearFilters")}
            </Button>
          </Grid.Col>
        </Grid>
      </Card>

      {/* Table */}
      <Card withBorder radius="md" p={0}>
        {loading ? (
          <Center p="xl"><Loader /></Center>
        ) : !data?.content.length ? (
          <Center p="xl">
            <Stack align="center" gap="xs">
              <IconApps size={48} color="gray" />
              <Text c="dimmed">{t("apps.noReleases")}</Text>
              <Button size="sm" leftSection={<IconPlus size={14} />} onClick={handleAdd}>
                {t("apps.addFirst")}
              </Button>
            </Stack>
          </Center>
        ) : (
          <Table.ScrollContainer minWidth={800}>
            <Table striped highlightOnHover withColumnBorders verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t("apps.appName")}</Table.Th>
                  <Table.Th>{t("apps.platform")}</Table.Th>
                  <Table.Th>{t("apps.version")}</Table.Th>
                  <Table.Th>{t("apps.status")}</Table.Th>
                  <Table.Th>{t("apps.releaseDate")}</Table.Th>
                  <Table.Th>{t("apps.fileSize")}</Table.Th>
                  <Table.Th>{t("apps.downloadCount")}</Table.Th>
                  <Table.Th w={80}>{t("common.actions")}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.content.map((r) => {
                  const pl = PLATFORM_LABELS[r.platform];
                  return (
                    <Table.Tr key={r.id}>
                      {/* App name + type + badges */}
                      <Table.Td>
                        <Stack gap={2}>
                          <Group gap="xs">
                            <Text fw={600} size="sm">{r.appName}</Text>
                            {r.isLatest && (
                              <Tooltip label={t("apps.isLatest")}>
                                <Badge color="yellow" size="xs" leftSection={<IconStarFilled size={10} />}>
                                  Latest
                                </Badge>
                              </Tooltip>
                            )}
                            {r.isForceUpdate && (
                              <Badge color="red" size="xs">Force</Badge>
                            )}
                          </Group>
                          <Text size="xs" c="dimmed">{APP_TYPE_LABELS[r.appType]}</Text>
                        </Stack>
                      </Table.Td>

                      {/* Platform */}
                      <Table.Td>
                        <Badge color={pl.color} variant="light" leftSection={<span>{pl.emoji}</span>}>
                          {pl.label}
                        </Badge>
                      </Table.Td>

                      {/* Version */}
                      <Table.Td>
                        <Text size="sm" ff="monospace" fw={500}>v{r.version}</Text>
                        <Text size="xs" c="dimmed">#{r.versionCode}</Text>
                      </Table.Td>

                      {/* Status */}
                      <Table.Td>
                        <Badge color={STATUS_COLORS[r.status]} variant="light">
                          {t(`apps.status_${r.status}`)}
                        </Badge>
                      </Table.Td>

                      {/* Release date */}
                      <Table.Td>
                        <Text size="sm">
                          {r.releaseDate ? dayjs(r.releaseDate).format("DD.MM.YYYY") : "—"}
                        </Text>
                      </Table.Td>

                      {/* File size */}
                      <Table.Td>
                        <Text size="sm">{r.fileSizeFormatted ?? "—"}</Text>
                        {r.checksum && (
                          <CopyButton value={r.checksum} timeout={2000}>
                            {({ copied, copy }) => (
                              <Tooltip label={copied ? "Nusxalandi!" : "SHA-256 nusxalash"}>
                                <Anchor size="xs" c="dimmed" onClick={copy} style={{ cursor: "pointer" }}>
                                  <Group gap={2}>
                                    {copied ? <IconCheck size={10} /> : <IconCopy size={10} />}
                                    {r.checksum!.slice(0, 8)}...
                                  </Group>
                                </Anchor>
                              </Tooltip>
                            )}
                          </CopyButton>
                        )}
                      </Table.Td>

                      {/* Downloads */}
                      <Table.Td>
                        <Group gap={4}>
                          <IconCloudDownload size={14} />
                          <Text size="sm">{r.downloadCount.toLocaleString()}</Text>
                        </Group>
                        {r.downloadUrl && (
                          <Anchor
                            size="xs" c="blue"
                            href={r.downloadUrl} target="_blank"
                          >
                            <Group gap={2}>
                              <IconExternalLink size={10} />
                              Link
                            </Group>
                          </Anchor>
                        )}
                      </Table.Td>

                      {/* Actions */}
                      <Table.Td>
                        <Menu shadow="md" width={220}>
                          <Menu.Target>
                            <ActionIcon variant="subtle">
                              <IconDots size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconEdit size={14} />}
                              onClick={() => handleEdit(r)}
                            >
                              {t("common.edit")}
                            </Menu.Item>

                            <Menu.Divider />

                            {/* Status o'zgartirish */}
                            {r.status !== "ACTIVE" && (
                              <Menu.Item
                                leftSection={<IconPlayerPlay size={14} />}
                                color="green"
                                onClick={() => handleSetStatus(r.id, "ACTIVE")}
                              >
                                {t("apps.activate")}
                              </Menu.Item>
                            )}
                            {r.status !== "DEPRECATED" && r.status !== "DRAFT" && (
                              <Menu.Item
                                leftSection={<IconX size={14} />}
                                color="yellow"
                                onClick={() => handleSetStatus(r.id, "DEPRECATED")}
                              >
                                {t("apps.deprecate")}
                              </Menu.Item>
                            )}
                            {r.status !== "YANKED" && (
                              <Menu.Item
                                leftSection={<IconX size={14} />}
                                color="red"
                                onClick={() => handleSetStatus(r.id, "YANKED")}
                              >
                                {t("apps.yank")}
                              </Menu.Item>
                            )}
                            {r.status !== "DRAFT" && (
                              <Menu.Item
                                leftSection={<IconDeviceDesktop size={14} />}
                                color="gray"
                                onClick={() => handleSetStatus(r.id, "DRAFT")}
                              >
                                {t("apps.toDraft")}
                              </Menu.Item>
                            )}

                            {/* Set latest */}
                            {r.status === "ACTIVE" && !r.isLatest && (
                              <>
                                <Menu.Divider />
                                <Menu.Item
                                  leftSection={<IconStar size={14} />}
                                  color="yellow"
                                  onClick={() => handleSetLatest(r.id)}
                                >
                                  {t("apps.setLatest")}
                                </Menu.Item>
                              </>
                            )}

                            <Menu.Divider />
                            <Menu.Item
                              leftSection={<IconTrash size={14} />}
                              color="red"
                              onClick={() => handleDelete(r.id, `${r.appName} v${r.version}`)}
                            >
                              {t("common.delete")}
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <>
            <Divider />
            <Group justify="space-between" px="md" py="sm">
              <Text size="sm" c="dimmed">
                {t("common.total")}: {data.totalElements} | {t("common.page")} {data.number + 1} / {data.totalPages}
              </Text>
              <Group gap="xs">
                <ActionIcon
                  variant="default"
                  disabled={data.first}
                  onClick={() => goPage(data.number - 1)}
                >
                  <IconChevronLeft size={16} />
                </ActionIcon>
                <ActionIcon
                  variant="default"
                  disabled={data.last}
                  onClick={() => goPage(data.number + 1)}
                >
                  <IconChevronRight size={16} />
                </ActionIcon>
              </Group>
            </Group>
          </>
        )}
      </Card>

      {/* Form Modal */}
      <ReleaseFormModal
        opened={formOpen}
        onClose={() => setFormOpen(false)}
        editing={editing}
        onSaved={handleSaved}
      />
    </Stack>
  );
}
