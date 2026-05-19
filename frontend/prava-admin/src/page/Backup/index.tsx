import { useRef, useState } from "react";
import {
  Stack, Title, Group, Badge, Tabs, Button, Card, Text, Progress,
  Alert, Switch, PasswordInput, Divider, Table, ScrollArea, Center,
  Loader, ThemeIcon, SimpleGrid, Paper, Code, Tooltip, FileButton,
  Checkbox, Collapse, TextInput, List, Box,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconDatabaseExport, IconDatabaseImport, IconDownload, IconUpload,
  IconRefresh, IconAlertTriangle, IconCircleCheck, IconCircleX, IconClock,
  IconPlayerPlay, IconShieldLock, IconList, IconInfoCircle, IconChevronDown,
  IconChevronUp, IconTrash, IconTable, IconCheck,
} from "@tabler/icons-react";
import { useBackupJob, useAllJobs } from "../../features/backup/hooks/useBackupJob";
import { useBackupMutations } from "../../features/backup/hooks/useBackupMutations";
import type {
  BackupJob, JobState, TableImportResult, ImportOptions, ClearOptions, ClearResult,
} from "../../features/backup/types";
import {
  DEFAULT_IMPORT_OPTIONS, getAffectedTables, isClearEmpty,
} from "../../features/backup/types";

const MAX_IMPORT_SIZE_MB = 500;
const CLEAR_CONFIRM_WORD = "tozalash";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stateColor(s: JobState) {
  return s === "COMPLETED" ? "green"
       : s === "FAILED"    ? "red"
       : s === "RUNNING"   ? "blue"
       : s === "PENDING"   ? "yellow"
       : "gray";
}

function stateIcon(s: JobState) {
  if (s === "COMPLETED") return <IconCircleCheck size={16} />;
  if (s === "FAILED")    return <IconCircleX     size={16} />;
  if (s === "RUNNING" || s === "PENDING") return <IconClock size={16} />;
  return null;
}

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("uz-UZ");
}

function fmtKB(kb?: number) {
  if (!kb) return "—";
  return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

// ─── TableResultsCard ─────────────────────────────────────────────────────────

function TableResultsCard({ results }: { results: Record<string, TableImportResult> }) {
  const entries = Object.values(results);
  const totalInserted = entries.reduce((a, r) => a + r.inserted, 0);
  const totalSkipped  = entries.reduce((a, r) => a + r.skipped, 0);
  const totalFailed   = entries.reduce((a, r) => a + r.failed, 0);
  const hasFailed     = entries.some(r => r.failed > 0 || (r.error && r.error !== "skipped by ImportOptions"));
  const [showAll, { toggle }] = useDisclosure(false);

  const visible = showAll ? entries : entries.slice(0, 8);

  return (
    <Card withBorder radius="md" p="md" mt="sm">
      <Group justify="space-between" mb="sm">
        <Text fw={600} size="sm">Jadval natijalari</Text>
        <Group gap="xs">
          <Badge color="green" variant="light">{totalInserted.toLocaleString()} kiritildi</Badge>
          <Badge color="yellow" variant="light">{totalSkipped.toLocaleString()} o'tkazildi</Badge>
          {totalFailed > 0 && <Badge color="red" variant="light">{totalFailed.toLocaleString()} xato</Badge>}
        </Group>
      </Group>

      {hasFailed && (
        <Alert color="orange" icon={<IconAlertTriangle size={14} />} mb="sm">
          Ba'zi jadvallar import qilinmadi. Quyida xatoliklarni ko'ring.
        </Alert>
      )}

      <ScrollArea>
        <Table striped withTableBorder withColumnBorders fz="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Jadval</Table.Th>
              <Table.Th ta="right">Jami</Table.Th>
              <Table.Th ta="right">Kiritildi</Table.Th>
              <Table.Th ta="right">O'tkazildi</Table.Th>
              <Table.Th ta="right">Xato</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {visible.map((r) => {
              const isSkipped = r.error === "skipped by ImportOptions";
              return (
                <Table.Tr key={r.tableName} bg={r.failed > 0 ? "red.0" : isSkipped ? "gray.0" : undefined}>
                  <Table.Td>
                    <Group gap={4}>
                      <IconTable size={12} style={{ opacity: 0.5 }} />
                      <Text size="xs" c={isSkipped ? "dimmed" : undefined}>{r.tableName}</Text>
                      {isSkipped && <Badge size="xs" color="gray" variant="light">skip</Badge>}
                    </Group>
                  </Table.Td>
                  <Table.Td ta="right"><Text size="xs">{r.totalRows.toLocaleString()}</Text></Table.Td>
                  <Table.Td ta="right">
                    <Text size="xs" c={r.inserted > 0 ? "green" : "dimmed"}>{r.inserted.toLocaleString()}</Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text size="xs" c={r.skipped > 0 ? "yellow.7" : "dimmed"}>{r.skipped.toLocaleString()}</Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Tooltip label={r.error ?? ""} disabled={!r.error || isSkipped}>
                      <Text size="xs" c={r.failed > 0 ? "red" : "dimmed"}>
                        {r.failed > 0 ? r.failed.toLocaleString() : "—"}
                      </Text>
                    </Tooltip>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      {entries.length > 8 && (
        <Button size="xs" variant="subtle" mt="xs" onClick={toggle} fullWidth>
          {showAll ? "Kamroq ko'rsatish" : `Yana ${entries.length - 8} ta ko'rsatish`}
        </Button>
      )}
    </Card>
  );
}

// ─── JobProgress card ─────────────────────────────────────────────────────────

function JobProgress({ job, onDownload }: { job: BackupJob; onDownload: () => void }) {
  const active = job.state === "RUNNING" || job.state === "PENDING";

  return (
    <Card withBorder radius="md" p="md">
      <Group justify="space-between" mb="xs">
        <Group gap="xs">
          <ThemeIcon color={stateColor(job.state)} variant="light" size="sm">
            {stateIcon(job.state) ?? <IconClock size={14} />}
          </ThemeIcon>
          <Text fw={600} size="sm">{job.phase}</Text>
        </Group>
        <Badge color={stateColor(job.state)} variant="light">{job.state}</Badge>
      </Group>

      <Progress
        value={job.progressPercent}
        animated={active}
        color={stateColor(job.state)}
        size="md"
        radius="xl"
        mb="xs"
      />
      <Text size="xs" c="dimmed">{job.progressPercent}%</Text>

      {job.state === "FAILED" && job.error && (
        <Alert color="red" mt="sm" icon={<IconCircleX size={16} />}>
          {job.error}
        </Alert>
      )}

      {job.state === "COMPLETED" && job.type === "EXPORT" && (
        <Group mt="sm" gap="xs" wrap="wrap">
          <Button size="xs" leftSection={<IconDownload size={14} />} onClick={onDownload}>
            ZIP yuklash ({fmtKB(job.fileSizeKB)})
          </Button>
          {job.entities && (
            <Text size="xs" c="dimmed">
              {Object.values(job.entities).reduce((a, b) => a + b, 0).toLocaleString()} qator
            </Text>
          )}
        </Group>
      )}

      {job.state === "COMPLETED" && job.type === "IMPORT" && (
        <>
          <Alert color="green" mt="sm" icon={<IconCircleCheck size={16} />}>
            Restore muvaffaqiyatli tugadi
          </Alert>
          {job.tableResults && <TableResultsCard results={job.tableResults} />}
          {!job.tableResults && job.summary && (
            <Code block mt={6} style={{ fontSize: 11, maxHeight: 160, overflow: "auto" }}>
              {job.summary}
            </Code>
          )}
        </>
      )}
    </Card>
  );
}

// ─── ImportOptions panel ──────────────────────────────────────────────────────

interface ImportOptionsPanelProps {
  options: ImportOptions;
  onChange: (opts: ImportOptions) => void;
}

function ImportOptionsPanel({ options, onChange }: ImportOptionsPanelProps) {
  const [open, { toggle }] = useDisclosure(false);

  const set = (key: keyof ImportOptions, val: boolean) =>
    onChange({ ...options, [key]: val });

  const allEnabled = Object.values(options).every(Boolean);
  const toggleAll  = () => {
    const val = !allEnabled;
    onChange(Object.fromEntries(
      Object.keys(options).map(k => [k, val])
    ) as ImportOptions);
  };

  const enabled = Object.values(options).filter(Boolean).length;

  return (
    <Box>
      <Button
        variant="subtle"
        size="xs"
        rightSection={open ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
        onClick={toggle}
        px={0}
      >
        Import opsiyalari ({enabled}/10 aktiv)
      </Button>

      <Collapse in={open}>
        <Card withBorder radius="sm" p="sm" mt="xs" bg="gray.0">
          <Group justify="flex-end" mb="sm">
            <Button size="xs" variant="light" onClick={toggleAll}>
              {allEnabled ? "Hammasini o'chirish" : "Hammasini yoqish"}
            </Button>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
            <Box>
              <Text size="xs" fw={600} c="dimmed" mb={4}>Asosiy ma'lumotlar</Text>
              <Stack gap={4}>
                <Checkbox size="xs" label="Userlar (users)" checked={options.importUsers}
                  onChange={e => set("importUsers", e.currentTarget.checked)} />
                <Checkbox size="xs" label="Topiklar (topics)" checked={options.importTopics}
                  onChange={e => set("importTopics", e.currentTarget.checked)} />
              </Stack>
            </Box>

            <Box>
              <Text size="xs" fw={600} c="dimmed" mb={4}>Savollar & Paketlar</Text>
              <Stack gap={4}>
                <Checkbox size="xs"
                  label={<Tooltip label="questions, question_options, join tables"><span>Savollar</span></Tooltip>}
                  checked={options.importQuestions}
                  onChange={e => set("importQuestions", e.currentTarget.checked)} />
                <Checkbox size="xs"
                  label={<Tooltip label="exam_packages, tickets"><span>Exam paketlar & Ticketlar</span></Tooltip>}
                  checked={options.importExamPackages}
                  onChange={e => set("importExamPackages", e.currentTarget.checked)} />
              </Stack>
            </Box>

            <Box>
              <Text size="xs" fw={600} c="dimmed" mb={4}>Imtihon faoliyati</Text>
              <Stack gap={4}>
                <Checkbox size="xs"
                  label={<Tooltip label="exam_sessions, exam_answers"><span>Imtihon sessiyalari & Javoblar</span></Tooltip>}
                  checked={options.importExamSessions}
                  onChange={e => set("importExamSessions", e.currentTarget.checked)} />
                <Checkbox size="xs" label="Foydalanuvchi statistikasi" checked={options.importUserStatistics}
                  onChange={e => set("importUserStatistics", e.currentTarget.checked)} />
              </Stack>
            </Box>

            <Box>
              <Text size="xs" fw={600} c="dimmed" mb={4}>Moliyaviy & Kirish</Text>
              <Stack gap={4}>
                <Checkbox size="xs" label="To'lovlar (payments)" checked={options.importPayments}
                  onChange={e => set("importPayments", e.currentTarget.checked)} />
                <Checkbox size="xs" label="Paket kirishlar" checked={options.importUserPackageAccess}
                  onChange={e => set("importUserPackageAccess", e.currentTarget.checked)} />
              </Stack>
            </Box>

            <Box>
              <Text size="xs" fw={600} c="dimmed" mb={4}>Tokenlar & Media</Text>
              <Stack gap={4}>
                <Checkbox size="xs"
                  label={<Tooltip label="refresh_tokens, verification_codes"><span>Auth tokenlar</span></Tooltip>}
                  checked={options.importTokens}
                  onChange={e => set("importTokens", e.currentTarget.checked)} />
                <Checkbox size="xs" label="Media fayllar (rasmlar)" checked={options.importMedia}
                  onChange={e => set("importMedia", e.currentTarget.checked)} />
              </Stack>
            </Box>
          </SimpleGrid>
        </Card>
      </Collapse>
    </Box>
  );
}

// ─── EXPORT tab ───────────────────────────────────────────────────────────────

function ExportTab() {
  const [exportJobId, setExportJobId] = useState<string | null>(null);
  const [encrypt, setEncrypt]         = useState(false);
  const [password, setPassword]       = useState("");
  const [loading, setLoading]         = useState(false);

  const { job }                               = useBackupJob(exportJobId, "export");
  const { startExport, downloadBackup, handleError } = useBackupMutations();

  const canStart = !loading && (job == null || job.state === "COMPLETED" || job.state === "FAILED");

  const handleStart = async () => {
    if (encrypt && !password.trim()) {
      notifications.show({ title: "Xato", message: "Shifrlash uchun parol kiritish shart", color: "red" });
      return;
    }
    setLoading(true);
    try {
      const id = await startExport({ encrypt, password: encrypt ? password : undefined });
      setExportJobId(id);
      setPassword(""); // parolni xavfsizlik uchun tozalash
      notifications.show({ title: "Backup boshlandi", message: `Job ID: ${id}`, color: "blue" });
    } catch (e) {
      handleError(e, "Backup ishga tushmadi");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!job || !exportJobId) return;
    try {
      const ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
      await downloadBackup(exportJobId, `prava-backup-${ts}.zip`);
    } catch (e) {
      handleError(e, "Yuklab olishda xato");
    }
  };

  return (
    <Stack gap="md">
      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        Backup <b>ZIP</b> format: barcha jadvallar, rasmlar va manifest fayl.
        Jarayon fon (async) da ishlaydi — sahifani yopish mumkin.
      </Alert>

      <Card withBorder radius="md" p="md">
        <Text fw={600} mb="md">Backup sozlamalari</Text>

        <Switch
          label="AES-256-GCM shifrlash"
          description="Backup faylini parol bilan shifrlash"
          checked={encrypt}
          onChange={e => setEncrypt(e.currentTarget.checked)}
          mb="sm"
        />

        {encrypt && (
          <PasswordInput
            label="Shifrlash paroli"
            placeholder="Kamida 8 belgi"
            value={password}
            onChange={e => setPassword(e.currentTarget.value)}
            leftSection={<IconShieldLock size={16} />}
            mb="sm"
            required
            minLength={8}
          />
        )}

        <Button
          leftSection={<IconPlayerPlay size={16} />}
          loading={loading}
          disabled={!canStart}
          onClick={handleStart}
          mt="xs"
        >
          Backup yaratishni boshlash
        </Button>
      </Card>

      {job && <JobProgress job={job} onDownload={handleDownload} />}

      {job?.state === "COMPLETED" && job.entities && (
        <Card withBorder radius="md" p="md">
          <Text fw={600} mb="sm" size="sm">Eksport tarkibi</Text>
          <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="xs">
            {Object.entries(job.entities).map(([table, count]) => (
              <Paper key={table} withBorder p="xs" radius="sm">
                <Text size="xs" c="dimmed" truncate>{table}</Text>
                <Text fw={700} size="sm">{count.toLocaleString()}</Text>
              </Paper>
            ))}
          </SimpleGrid>
        </Card>
      )}
    </Stack>
  );
}

// ─── IMPORT tab ───────────────────────────────────────────────────────────────

function ImportTab() {
  const [importJobId, setImportJobId]   = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [forceReplace, setForceReplace] = useState(false);
  const [encrypted, setEncrypted]       = useState(false);
  const [password, setPassword]         = useState("");
  const [loading, setLoading]           = useState(false);
  const [importOptions, setImportOptions] = useState<ImportOptions>(DEFAULT_IMPORT_OPTIONS);
  const resetRef = useRef<() => void>(null);

  const { job }                        = useBackupJob(importJobId, "import");
  const { startImport, handleError }   = useBackupMutations();

  const canStart = !!selectedFile && !loading &&
    (job == null || job.state === "COMPLETED" || job.state === "FAILED");

  const handleFileSelect = (file: File | null) => {
    if (!file) { setSelectedFile(null); return; }
    if (file.size > MAX_IMPORT_SIZE_MB * 1024 * 1024) {
      notifications.show({
        title: "Fayl juda katta",
        message: `Maksimal hajm: ${MAX_IMPORT_SIZE_MB} MB. Fayl: ${(file.size / 1024 / 1024).toFixed(1)} MB`,
        color: "red",
      });
      resetRef.current?.();
      return;
    }
    setSelectedFile(file);
  };

  const handleStart = () => {
    if (!selectedFile) return;

    if (encrypted && !password.trim()) {
      notifications.show({ title: "Xato", message: "Shifrlangan backup uchun parol kiritish shart", color: "red" });
      return;
    }

    const doImport = async () => {
      setLoading(true);
      try {
        const id = await startImport({
          file: selectedFile,
          forceReplace,
          password: encrypted ? password : undefined,
          options: importOptions,
        });
        setImportJobId(id);
        notifications.show({ title: "Restore boshlandi", message: `Job ID: ${id}`, color: "blue" });
      } catch (e) {
        handleError(e, "Restore ishga tushmadi");
      } finally {
        setLoading(false);
      }
    };

    if (forceReplace) {
      modals.openConfirmModal({
        title: "⚠️ Diqqat: Ma'lumotlar o'chiriladi!",
        children: (
          <Text size="sm">
            <b>forceReplace=true</b> — barcha mavjud jadvallar <b>TRUNCATE</b> qilinib,
            backup ma'lumotlari bilan to'ldiriladi. Bu amalni qaytarib bo'lmaydi.
            Davom etasizmi?
          </Text>
        ),
        labels: { confirm: "Ha, o'chirib restore qilaman", cancel: "Bekor qilish" },
        confirmProps: { color: "red" },
        onConfirm: doImport,
      });
    } else {
      doImport();
    }
  };

  return (
    <Stack gap="md">
      <Alert icon={<IconAlertTriangle size={16} />} color="yellow" variant="light">
        <b>Merge rejimi (default):</b> mavjud ID'lar o'tkazib yuboriladi.{" "}
        <b>Force rejim:</b> barcha jadvallar TRUNCATE qilinib qayta to'ldiriladi —
        yangi server uchun ishlatiladi.
      </Alert>

      <Card withBorder radius="md" p="md">
        <Text fw={600} mb="md">Backup faylini yuklash</Text>

        <Group mb="md" wrap="wrap">
          <FileButton resetRef={resetRef} onChange={handleFileSelect} accept=".zip">
            {(props) => (
              <Button {...props} variant="light" leftSection={<IconUpload size={16} />}>
                ZIP fayl tanlash
              </Button>
            )}
          </FileButton>

          {selectedFile && (
            <Group gap="xs">
              <Text size="sm" fw={500} maw={240} truncate>{selectedFile.name}</Text>
              <Badge variant="light" color={selectedFile.size > 100 * 1024 * 1024 ? "orange" : "gray"}>
                {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
              </Badge>
              <Button
                size="xs" variant="subtle" color="red"
                onClick={() => { setSelectedFile(null); resetRef.current?.(); }}
              >
                ✕
              </Button>
            </Group>
          )}
        </Group>

        <Divider mb="md" />

        <Stack gap="sm">
          <Switch
            label="Force replace (TRUNCATE + restore)"
            description="Mavjud ma'lumotlarni o'chirib to'liq restore — yangi server uchun"
            checked={forceReplace}
            onChange={e => setForceReplace(e.currentTarget.checked)}
            color="red"
          />

          <Switch
            label="Backup shifrlangan"
            description="Backup AES-256-GCM bilan shifrlangan bo'lsa"
            checked={encrypted}
            onChange={e => setEncrypted(e.currentTarget.checked)}
          />

          {encrypted && (
            <PasswordInput
              label="Shifrlash paroli"
              placeholder="Backup yaratilingan parol"
              value={password}
              onChange={e => setPassword(e.currentTarget.value)}
              leftSection={<IconShieldLock size={16} />}
              required
            />
          )}
        </Stack>

        <Divider my="md" />

        <ImportOptionsPanel options={importOptions} onChange={setImportOptions} />

        <Button
          leftSection={<IconDatabaseImport size={16} />}
          loading={loading}
          disabled={!canStart}
          color={forceReplace ? "red" : "blue"}
          onClick={handleStart}
          mt="md"
        >
          {forceReplace ? "Force restore boshlash" : "Merge restore boshlash"}
        </Button>
      </Card>

      {job && <JobProgress job={job} onDownload={() => {}} />}
    </Stack>
  );
}

// ─── CLEAR tab ────────────────────────────────────────────────────────────────

const EMPTY_CLEAR: ClearOptions = {
  clearUsers: false, clearTopics: false, clearQuestions: false,
  clearExamPackages: false, clearExamSessions: false, clearPayments: false,
  clearUserPackageAccess: false, clearStatistics: false, clearTokens: false,
  clearMedia: false,
};

function ClearTab() {
  const [opts, setOpts]           = useState<ClearOptions>(EMPTY_CLEAR);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<ClearResult | null>(null);

  const { clearData, handleError } = useBackupMutations();

  const setOpt = (key: keyof ClearOptions, val: boolean) =>
    setOpts(prev => ({ ...prev, [key]: val }));

  const affectedTables = getAffectedTables(opts);
  const isEmpty        = isClearEmpty(opts);
  const canClear       = !isEmpty && confirmText === CLEAR_CONFIRM_WORD && !loading;

  const handleClear = async () => {
    modals.openConfirmModal({
      title: "⚠️ OXIRGI OGOHLANTIRISH",
      children: (
        <Stack gap="xs">
          <Text size="sm" c="red" fw={600}>
            Bu amal qaytarib bo'lmaydi!
          </Text>
          <Text size="sm">
            Quyidagi {affectedTables.length} ta jadval tozalanadi:
          </Text>
          <List size="xs" spacing={2}>
            {affectedTables.map(t => <List.Item key={t}><Code fz={11}>{t}</Code></List.Item>)}
          </List>
          {opts.clearMedia && (
            <Alert color="red" fz="xs">Media fayllari ham o'chiriladi!</Alert>
          )}
        </Stack>
      ),
      labels: { confirm: "Ha, tozalayman", cancel: "Bekor qilish" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        setLoading(true);
        try {
          const res = await clearData(opts);
          setResult(res);
          setOpts(EMPTY_CLEAR);
          setConfirmText("");
          notifications.show({
            title: "Tozalash bajarildi",
            message: `${res.clearedCount} ta jadval tozalandi`,
            color: "green",
          });
        } catch (e) {
          handleError(e, "Tozalashda xato yuz berdi");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <Stack gap="md">
      <Alert icon={<IconAlertTriangle size={16} />} color="red" variant="filled">
        <Text fw={700} size="sm">⚠️ DIQQAT! Bu amal qaytarib bo'lmaydi!</Text>
        <Text size="xs" mt={4}>
          Tozalashdan oldin albatta yangi backup yarating. clearUsers yoki clearTopics
          tanlanganda ularga bog'liq barcha jadvallar ham tozalanadi.
        </Text>
      </Alert>

      <Card withBorder radius="md" p="md">
        <Text fw={600} mb="md">Nima tozalansin?</Text>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <Stack gap="md">
            <Box>
              <Text size="xs" fw={600} c="dimmed" mb="xs">Imtihon faoliyati</Text>
              <Stack gap={6}>
                <Checkbox size="sm"
                  label={<><b>Imtihon sessiyalari</b><Text size="xs" c="dimmed">exam_sessions, exam_answers</Text></>}
                  checked={opts.clearExamSessions}
                  onChange={e => setOpt("clearExamSessions", e.currentTarget.checked)} />
              </Stack>
            </Box>

            <Box>
              <Text size="xs" fw={600} c="dimmed" mb="xs">Moliyaviy</Text>
              <Stack gap={6}>
                <Checkbox size="sm" label="To'lovlar (payments)"
                  checked={opts.clearPayments} onChange={e => setOpt("clearPayments", e.currentTarget.checked)} />
                <Checkbox size="sm" label="Paket kirishlar (user_package_access)"
                  checked={opts.clearUserPackageAccess} onChange={e => setOpt("clearUserPackageAccess", e.currentTarget.checked)} />
              </Stack>
            </Box>

            <Box>
              <Text size="xs" fw={600} c="dimmed" mb="xs">Statistika & Tokenlar</Text>
              <Stack gap={6}>
                <Checkbox size="sm" label="Foydalanuvchi statistikasi"
                  checked={opts.clearStatistics} onChange={e => setOpt("clearStatistics", e.currentTarget.checked)} />
                <Checkbox size="sm"
                  label={<><b>Auth tokenlar</b><Text size="xs" c="dimmed">refresh_tokens, verification_codes</Text></>}
                  checked={opts.clearTokens} onChange={e => setOpt("clearTokens", e.currentTarget.checked)} />
              </Stack>
            </Box>
          </Stack>

          <Stack gap="md">
            <Box>
              <Text size="xs" fw={600} c="orange" mb="xs">⚠️ Ma'lumotlar (kaskad!)</Text>
              <Stack gap={6}>
                <Checkbox size="sm" color="orange"
                  label={<><b>Savollar</b><Text size="xs" c="dimmed">questions, options, join tables</Text></>}
                  checked={opts.clearQuestions} onChange={e => setOpt("clearQuestions", e.currentTarget.checked)} />
                <Checkbox size="sm" color="orange"
                  label={<><b>Exam paketlar & Ticketlar</b><Text size="xs" c="dimmed">exam_packages, tickets</Text></>}
                  checked={opts.clearExamPackages} onChange={e => setOpt("clearExamPackages", e.currentTarget.checked)} />
              </Stack>
            </Box>

            <Box>
              <Text size="xs" fw={600} c="red" mb="xs">🔴 Asosiy ma'lumotlar (ENG XAVFLI!)</Text>
              <Stack gap={6}>
                <Checkbox size="sm" color="red"
                  label={<><b>Barcha userlar</b><Text size="xs" c="dimmed">users va barcha bog'liq jadvallar</Text></>}
                  checked={opts.clearUsers} onChange={e => setOpt("clearUsers", e.currentTarget.checked)} />
                <Checkbox size="sm" color="red"
                  label={<><b>Barcha topiklar</b><Text size="xs" c="dimmed">topics va barcha bog'liq jadvallar</Text></>}
                  checked={opts.clearTopics} onChange={e => setOpt("clearTopics", e.currentTarget.checked)} />
                <Checkbox size="sm" color="red"
                  label={<><b>Media fayllar</b><Text size="xs" c="dimmed">uploads katalogidagi barcha fayllar</Text></>}
                  checked={opts.clearMedia} onChange={e => setOpt("clearMedia", e.currentTarget.checked)} />
              </Stack>
            </Box>
          </Stack>
        </SimpleGrid>

        {!isEmpty && (
          <>
            <Divider my="md" />
            <Alert color="orange" icon={<IconAlertTriangle size={14} />} mb="sm">
              <Text size="xs" fw={600} mb={4}>Tozalanadigan jadvallar:</Text>
              <Group gap={4} wrap="wrap">
                {affectedTables.map(t => (
                  <Badge key={t} size="xs" color="orange" variant="outline">
                    {t}
                  </Badge>
                ))}
                {opts.clearMedia && (
                  <Badge size="xs" color="red" variant="outline">media fayllar</Badge>
                )}
              </Group>
            </Alert>

            <TextInput
              label={`Tasdiqlash uchun "${CLEAR_CONFIRM_WORD}" so'zini yozing`}
              placeholder={CLEAR_CONFIRM_WORD}
              value={confirmText}
              onChange={e => setConfirmText(e.currentTarget.value)}
              error={confirmText && confirmText !== CLEAR_CONFIRM_WORD ? "To'g'ri so'z emas" : null}
              mb="sm"
            />

            <Button
              leftSection={<IconTrash size={16} />}
              color="red"
              disabled={!canClear}
              loading={loading}
              onClick={handleClear}
            >
              Tozalashni boshlash ({affectedTables.length + (opts.clearMedia ? 1 : 0)} ta ob'ekt)
            </Button>
          </>
        )}
      </Card>

      {result && (
        <Card withBorder radius="md" p="md">
          <Group gap="xs" mb="sm">
            <ThemeIcon color="green" variant="light" size="sm"><IconCheck size={14} /></ThemeIcon>
            <Text fw={600} size="sm">Tozalash natijasi</Text>
          </Group>
          <Group gap="xs" wrap="wrap">
            {result.clearedTables.map(t => (
              <Badge key={t} color="green" variant="light" size="sm">{t}</Badge>
            ))}
            {result.mediaCleared && (
              <Badge color="green" variant="light" size="sm">media fayllar</Badge>
            )}
          </Group>
          <Text size="xs" c="dimmed" mt="xs">
            Jami {result.clearedCount} ta jadval tozalandi. ({result.clearedBy} tomonidan)
          </Text>
          <Button size="xs" variant="subtle" mt="xs" onClick={() => setResult(null)}>
            Yopish
          </Button>
        </Card>
      )}
    </Stack>
  );
}

// ─── JOBS tab ─────────────────────────────────────────────────────────────────

function JobsTab() {
  const { jobs, isLoading, isError, refresh } = useAllJobs();

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text fw={600}>Barcha joblar ({jobs.length})</Text>
        <Button size="xs" variant="light" leftSection={<IconRefresh size={14} />} onClick={() => refresh()}>
          Yangilash
        </Button>
      </Group>

      {isError ? (
        <Alert color="red" icon={<IconCircleX size={16} />}>
          Joblarni yuklashda xatolik yuz berdi. Sahifani yangilang yoki qayta urinib ko'ring.
        </Alert>
      ) : isLoading ? (
        <Center h={120}><Loader type="bars" /></Center>
      ) : jobs.length === 0 ? (
        <Center h={120}><Text c="dimmed">Hali hech qanday job yo'q</Text></Center>
      ) : (
        <ScrollArea>
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Tur</Table.Th>
                <Table.Th>Holat</Table.Th>
                <Table.Th>Jarayon</Table.Th>
                <Table.Th>Bosqich</Table.Th>
                <Table.Th>Boshlandi</Table.Th>
                <Table.Th>Tugadi</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {jobs.map((j) => (
                <Table.Tr key={j.jobId}>
                  <Table.Td>
                    <Badge
                      color={j.type === "EXPORT" ? "blue" : "violet"}
                      variant="light"
                      leftSection={
                        j.type === "EXPORT"
                          ? <IconDatabaseExport size={12} />
                          : <IconDatabaseImport size={12} />
                      }
                    >
                      {j.type}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={stateColor(j.state)} variant="light">{j.state}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Tooltip label={`${j.progressPercent}%`}>
                      <Progress
                        value={j.progressPercent}
                        color={stateColor(j.state)}
                        size="sm"
                        style={{ minWidth: 80 }}
                        animated={j.state === "RUNNING"}
                      />
                    </Tooltip>
                  </Table.Td>
                  <Table.Td>
                    <Tooltip label={j.phase} disabled={j.phase?.length <= 25}>
                      <Text size="xs" c="dimmed" truncate maw={160}>{j.phase}</Text>
                    </Tooltip>
                  </Table.Td>
                  <Table.Td><Text size="xs">{fmtDate(j.startedAt)}</Text></Table.Td>
                  <Table.Td><Text size="xs">{fmtDate(j.completedAt)}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      )}
    </Stack>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const Backup_Page = () => {
  const [tab, setTab] = useState<string | null>("export");

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Group gap="sm">
          <ThemeIcon size="lg" radius="md" variant="light" color="blue">
            <IconDatabaseExport size={20} />
          </ThemeIcon>
          <Title order={3}>Backup & Restore</Title>
        </Group>
        <Badge color="red" variant="light" size="lg">SUPER ADMIN</Badge>
      </Group>

      <Tabs value={tab} onChange={setTab}>
        <Tabs.List>
          <Tabs.Tab value="export" leftSection={<IconDatabaseExport size={15} />}>
            Backup (Export)
          </Tabs.Tab>
          <Tabs.Tab value="import" leftSection={<IconDatabaseImport size={15} />}>
            Restore (Import)
          </Tabs.Tab>
          <Tabs.Tab value="clear" leftSection={<IconTrash size={15} />} color="red">
            Tozalash
          </Tabs.Tab>
          <Tabs.Tab value="jobs" leftSection={<IconList size={15} />}>
            Joblar
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="export" pt="md"><ExportTab /></Tabs.Panel>
        <Tabs.Panel value="import" pt="md"><ImportTab /></Tabs.Panel>
        <Tabs.Panel value="clear"  pt="md"><ClearTab  /></Tabs.Panel>
        <Tabs.Panel value="jobs"   pt="md"><JobsTab   /></Tabs.Panel>
      </Tabs>
    </Stack>
  );
};

export default Backup_Page;
