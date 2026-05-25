import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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

const MAX_IMPORT_SIZE_MB = 1000;

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
  return new Date(iso).toLocaleString();
}

function fmtKB(kb?: number) {
  if (!kb) return "—";
  return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

// ─── TableResultsCard ─────────────────────────────────────────────────────────

function TableResultsCard({ results }: { results: Record<string, TableImportResult> }) {
  const { t } = useTranslation();
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
        <Text fw={600} size="sm">{t("backup.tableResults.title")}</Text>
        <Group gap="xs">
          <Badge color="green" variant="light">
            {totalInserted.toLocaleString()} {t("backup.tableResults.inserted")}
          </Badge>
          <Badge color="yellow" variant="light">
            {totalSkipped.toLocaleString()} {t("backup.tableResults.skipped")}
          </Badge>
          {totalFailed > 0 && (
            <Badge color="red" variant="light">
              {totalFailed.toLocaleString()} {t("backup.tableResults.failed")}
            </Badge>
          )}
        </Group>
      </Group>

      {hasFailed && (
        <Alert color="orange" icon={<IconAlertTriangle size={14} />} mb="sm">
          {t("backup.tableResults.errorAlert")}
        </Alert>
      )}

      <ScrollArea>
        <Table striped withTableBorder withColumnBorders fz="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t("backup.tableResults.colTable")}</Table.Th>
              <Table.Th ta="right">{t("backup.tableResults.colTotal")}</Table.Th>
              <Table.Th ta="right">{t("backup.tableResults.colInserted")}</Table.Th>
              <Table.Th ta="right">{t("backup.tableResults.colSkipped")}</Table.Th>
              <Table.Th ta="right">{t("backup.tableResults.colFailed")}</Table.Th>
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
          {showAll
            ? t("backup.tableResults.showLess")
            : t("backup.tableResults.showMore", { count: entries.length - 8 })}
        </Button>
      )}
    </Card>
  );
}

// ─── JobProgress card ─────────────────────────────────────────────────────────

function JobProgress({ job, onDownload }: { job: BackupJob; onDownload: () => void }) {
  const { t } = useTranslation();
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
        {t("backup.job.downloadBtn", { size: fmtKB(job.fileSizeKB) })}
      </Button>
      {job.entities && (
        <Text size="xs" c="dimmed">
          {t("backup.job.rowCount", {
            count: String(Object.values(job.entities).reduce((a, b) => a + b, 0)),
          })}
        </Text>
      )}
    </Group>
    )}


      {job.state === "COMPLETED" && job.type === "IMPORT" && (
        <>
          <Alert color="green" mt="sm" icon={<IconCircleCheck size={16} />}>
            {t("backup.job.restoreSuccess")}
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
  const { t } = useTranslation();
  const [open, { toggle }] = useDisclosure(false);

  const set = (key: keyof ImportOptions, val: boolean) =>
    onChange({ ...options, [key]: val });

  const allEnabled = Object.values(options).every(Boolean);
  const toggleAll = () => {
    const val = !allEnabled;
    onChange(Object.fromEntries(
      Object.keys(options).map(k => [k, val])
    ) as unknown as ImportOptions);
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
        {t("backup.importOptions.title", { enabled })}
      </Button>

      <Collapse in={open}>
        <Card withBorder radius="sm" p="sm" mt="xs" bg="gray.0">
          <Group justify="flex-end" mb="sm">
            <Button size="xs" variant="light" onClick={toggleAll}>
              {allEnabled ? t("backup.importOptions.disableAll") : t("backup.importOptions.enableAll")}
            </Button>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
            <Box>
              <Text size="xs" fw={600} c="dimmed" mb={4}>{t("backup.importOptions.groupCore")}</Text>
              <Stack gap={4}>
                <Checkbox size="xs" label={t("backup.importOptions.users")} checked={options.importUsers}
                  onChange={e => set("importUsers", e.currentTarget.checked)} />
                <Checkbox size="xs" label={t("backup.importOptions.topics")} checked={options.importTopics}
                  onChange={e => set("importTopics", e.currentTarget.checked)} />
              </Stack>
            </Box>

            <Box>
              <Text size="xs" fw={600} c="dimmed" mb={4}>{t("backup.importOptions.groupQuestions")}</Text>
              <Stack gap={4}>
                <Checkbox size="xs"
                  label={
                    <Tooltip label={t("backup.importOptions.examPackagesTooltip")}>
                      <span>{t("backup.importOptions.questions")}</span>
                    </Tooltip>
                  }
                  checked={options.importQuestions}
                  onChange={e => set("importQuestions", e.currentTarget.checked)} />
                <Checkbox size="xs"
                  label={
                    <Tooltip label={t("backup.importOptions.examPackagesTooltip")}>
                      <span>{t("backup.importOptions.examPackages")}</span>
                    </Tooltip>
                  }
                  checked={options.importExamPackages}
                  onChange={e => set("importExamPackages", e.currentTarget.checked)} />
              </Stack>
            </Box>

            <Box>
              <Text size="xs" fw={600} c="dimmed" mb={4}>{t("backup.importOptions.groupExam")}</Text>
              <Stack gap={4}>
                <Checkbox size="xs"
                  label={
                    <Tooltip label={t("backup.importOptions.examSessionsTooltip")}>
                      <span>{t("backup.importOptions.examSessions")}</span>
                    </Tooltip>
                  }
                  checked={options.importExamSessions}
                  onChange={e => set("importExamSessions", e.currentTarget.checked)} />
                <Checkbox size="xs" label={t("backup.importOptions.userStatistics")} checked={options.importUserStatistics}
                  onChange={e => set("importUserStatistics", e.currentTarget.checked)} />
              </Stack>
            </Box>

            <Box>
              <Text size="xs" fw={600} c="dimmed" mb={4}>{t("backup.importOptions.groupFinance")}</Text>
              <Stack gap={4}>
                <Checkbox size="xs" label={t("backup.importOptions.payments")} checked={options.importPayments}
                  onChange={e => set("importPayments", e.currentTarget.checked)} />
                <Checkbox size="xs" label={t("backup.importOptions.packageAccess")} checked={options.importUserPackageAccess}
                  onChange={e => set("importUserPackageAccess", e.currentTarget.checked)} />
              </Stack>
            </Box>

            <Box>
              <Text size="xs" fw={600} c="dimmed" mb={4}>{t("backup.importOptions.groupTokens")}</Text>
              <Stack gap={4}>
                <Checkbox size="xs"
                  label={
                    <Tooltip label={t("backup.importOptions.tokensTooltip")}>
                      <span>{t("backup.importOptions.tokens")}</span>
                    </Tooltip>
                  }
                  checked={options.importTokens}
                  onChange={e => set("importTokens", e.currentTarget.checked)} />
                <Checkbox size="xs" label={t("backup.importOptions.media")} checked={options.importMedia}
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
  const { t } = useTranslation();
  const [exportJobId, setExportJobId] = useState<string | null>(null);
  const [encrypt, setEncrypt]         = useState(false);
  const [password, setPassword]       = useState("");
  const [loading, setLoading]         = useState(false);

  const { job }                               = useBackupJob(exportJobId, "export");
  const { startExport, downloadBackup, handleError } = useBackupMutations();

  const canStart = !loading && (job == null || job.state === "COMPLETED" || job.state === "FAILED");

  const handleStart = async () => {
    if (encrypt && !password.trim()) {
      notifications.show({ title: t("backup.common.errorTitle"), message: t("backup.export.encryptRequired"), color: "red" });
      return;
    }
    setLoading(true);
    try {
      const id = await startExport({ encrypt, password: encrypt ? password : undefined });
      setExportJobId(id);
      setPassword("");
      notifications.show({ title: t("backup.export.startedNotif"), message: t("backup.export.startedMsg", { id }), color: "blue" });
    } catch (e) {
      handleError(e, t("backup.export.startError"));
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
      handleError(e, t("backup.export.downloadError"));
    }
  };

  return (
    <Stack gap="md">
      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        {t("backup.export.infoLine1")}{" "}
        {t("backup.export.infoLine2")}
      </Alert>

      <Card withBorder radius="md" p="md">
        <Text fw={600} mb="md">{t("backup.export.settingsTitle")}</Text>

        <Switch
          label={t("backup.export.encryptSwitch")}
          description={t("backup.export.encryptDesc")}
          checked={encrypt}
          onChange={e => setEncrypt(e.currentTarget.checked)}
          mb="sm"
        />

        {encrypt && (
          <PasswordInput
            label={t("backup.export.passwordLabel")}
            placeholder={t("backup.export.passwordPlaceholder")}
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
          {t("backup.export.startBtn")}
        </Button>
      </Card>

      {job && <JobProgress job={job} onDownload={handleDownload} />}

      {job?.state === "COMPLETED" && job.entities && (
        <Card withBorder radius="md" p="md">
          <Text fw={600} mb="sm" size="sm">{t("backup.export.entitiesTitle")}</Text>
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
  const { t } = useTranslation();
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
        title: t("backup.import.fileTooLarge"),
        message: t("backup.import.fileTooLargeMsg", {
          max: MAX_IMPORT_SIZE_MB,
          size: (file.size / 1024 / 1024).toFixed(1),
        }),
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
      notifications.show({ title: t("backup.common.errorTitle"), message: t("backup.import.encryptRequired"), color: "red" });
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
        notifications.show({ title: t("backup.import.startedNotif"), message: t("backup.import.startedMsg", { id }), color: "blue" });
      } catch (e) {
        handleError(e, t("backup.import.startError"));
      } finally {
        setLoading(false);
      }
    };

    if (forceReplace) {
      modals.openConfirmModal({
        title: t("backup.import.forceConfirmTitle"),
        children: (
          <Text size="sm">
            <b>forceReplace=true</b> — {t("backup.import.forceConfirmBody")}
          </Text>
        ),
        labels: { confirm: t("backup.import.confirmYes"), cancel: t("backup.import.confirmNo") },
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
        <b>{t("backup.import.infoMergeLabel")}</b>{" "}{t("backup.import.infoMergeDesc")}{" "}
        <b>{t("backup.import.infoForceLabel")}</b>{" "}{t("backup.import.infoForceDesc")}
      </Alert>

      <Card withBorder radius="md" p="md">
        <Text fw={600} mb="md">{t("backup.import.fileTitle")}</Text>

        <Group mb="md" wrap="wrap">
          <FileButton resetRef={resetRef} onChange={handleFileSelect} accept=".zip">
            {(props) => (
              <Button {...props} variant="light" leftSection={<IconUpload size={16} />}>
                {t("backup.import.selectFile")}
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
            label={t("backup.import.forceSwitch")}
            description={t("backup.import.forceDesc")}
            checked={forceReplace}
            onChange={e => setForceReplace(e.currentTarget.checked)}
            color="red"
          />

          <Switch
            label={t("backup.import.encryptedSwitch")}
            description={t("backup.import.encryptedDesc")}
            checked={encrypted}
            onChange={e => setEncrypted(e.currentTarget.checked)}
          />

          {encrypted && (
            <PasswordInput
              label={t("backup.import.passwordLabel")}
              placeholder={t("backup.import.passwordPlaceholder")}
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
          {forceReplace ? t("backup.import.startForceBtn") : t("backup.import.startMergeBtn")}
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
  const { t } = useTranslation();
  const clearConfirmWord = t("backup.clear.confirmWord");

  const [opts, setOpts]               = useState<ClearOptions>(EMPTY_CLEAR);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState<ClearResult | null>(null);

  const { clearData, handleError } = useBackupMutations();

  const setOpt = (key: keyof ClearOptions, val: boolean) =>
    setOpts(prev => ({ ...prev, [key]: val }));

  const affectedTables = getAffectedTables(opts);
  const isEmpty        = isClearEmpty(opts);
  const canClear       = !isEmpty && confirmText === clearConfirmWord && !loading;

  const handleClear = async () => {
    modals.openConfirmModal({
      title: t("backup.clear.finalConfirmTitle"),
      children: (
        <Stack gap="xs">
          <Text size="sm" c="red" fw={600}>
            {t("backup.clear.irrecoverable")}
          </Text>
          <Text size="sm">
            {t("backup.clear.willClean", { count: affectedTables.length })}
          </Text>
          <List size="xs" spacing={2}>
            {affectedTables.map(table => (
              <List.Item key={table}><Code fz={11}>{table}</Code></List.Item>
            ))}
          </List>
          {opts.clearMedia && (
            <Alert color="red" fz="xs">{t("backup.clear.mediaWillDelete")}</Alert>
          )}
        </Stack>
      ),
      labels: { confirm: t("backup.clear.confirmYes"), cancel: t("backup.clear.confirmNo") },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        setLoading(true);
        try {
          const res = await clearData(opts);
          setResult(res);
          setOpts(EMPTY_CLEAR);
          setConfirmText("");
          notifications.show({
            title: t("backup.clear.successNotif"),
            message: t("backup.clear.successMsg", { count: res.clearedCount }),
            color: "green",
          });
        } catch (e) {
          handleError(e, t("backup.clear.errorMsg"));
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <Stack gap="md">
      <Alert icon={<IconAlertTriangle size={16} />} color="red" variant="filled">
        <Text fw={700} size="sm">{t("backup.clear.dangerAlert")}</Text>
        <Text size="xs" mt={4}>{t("backup.clear.dangerAlertDesc")}</Text>
      </Alert>

      <Card withBorder radius="md" p="md">
        <Text fw={600} mb="md">{t("backup.clear.whatToClean")}</Text>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <Stack gap="md">
            <Box>
              <Text size="xs" fw={600} c="dimmed" mb="xs">{t("backup.clear.groupExam")}</Text>
              <Stack gap={6}>
                <Checkbox size="sm"
                  label={
                    <>
                      <b>{t("backup.clear.examSessions")}</b>
                      <Text size="xs" c="dimmed">{t("backup.clear.examSessionsDesc")}</Text>
                    </>
                  }
                  checked={opts.clearExamSessions}
                  onChange={e => setOpt("clearExamSessions", e.currentTarget.checked)} />
              </Stack>
            </Box>

            <Box>
              <Text size="xs" fw={600} c="dimmed" mb="xs">{t("backup.clear.groupFinance")}</Text>
              <Stack gap={6}>
                <Checkbox size="sm" label={t("backup.clear.payments")}
                  checked={opts.clearPayments} onChange={e => setOpt("clearPayments", e.currentTarget.checked)} />
                <Checkbox size="sm" label={t("backup.clear.packageAccess")}
                  checked={opts.clearUserPackageAccess} onChange={e => setOpt("clearUserPackageAccess", e.currentTarget.checked)} />
              </Stack>
            </Box>

            <Box>
              <Text size="xs" fw={600} c="dimmed" mb="xs">{t("backup.clear.groupStats")}</Text>
              <Stack gap={6}>
                <Checkbox size="sm" label={t("backup.clear.statistics")}
                  checked={opts.clearStatistics} onChange={e => setOpt("clearStatistics", e.currentTarget.checked)} />
                <Checkbox size="sm"
                  label={
                    <>
                      <b>{t("backup.clear.tokens")}</b>
                      <Text size="xs" c="dimmed">{t("backup.clear.tokensDesc")}</Text>
                    </>
                  }
                  checked={opts.clearTokens} onChange={e => setOpt("clearTokens", e.currentTarget.checked)} />
              </Stack>
            </Box>
          </Stack>

          <Stack gap="md">
            <Box>
              <Text size="xs" fw={600} c="orange" mb="xs">{t("backup.clear.groupData")}</Text>
              <Stack gap={6}>
                <Checkbox size="sm" color="orange"
                  label={
                    <>
                      <b>{t("backup.clear.questions")}</b>
                      <Text size="xs" c="dimmed">{t("backup.clear.questionsDesc")}</Text>
                    </>
                  }
                  checked={opts.clearQuestions} onChange={e => setOpt("clearQuestions", e.currentTarget.checked)} />
                <Checkbox size="sm" color="orange"
                  label={
                    <>
                      <b>{t("backup.clear.examPackages")}</b>
                      <Text size="xs" c="dimmed">{t("backup.clear.examPackagesDesc")}</Text>
                    </>
                  }
                  checked={opts.clearExamPackages} onChange={e => setOpt("clearExamPackages", e.currentTarget.checked)} />
              </Stack>
            </Box>

            <Box>
              <Text size="xs" fw={600} c="red" mb="xs">{t("backup.clear.groupCore")}</Text>
              <Stack gap={6}>
                <Checkbox size="sm" color="red"
                  label={
                    <>
                      <b>{t("backup.clear.allUsers")}</b>
                      <Text size="xs" c="dimmed">{t("backup.clear.allUsersDesc")}</Text>
                    </>
                  }
                  checked={opts.clearUsers} onChange={e => setOpt("clearUsers", e.currentTarget.checked)} />
                <Checkbox size="sm" color="red"
                  label={
                    <>
                      <b>{t("backup.clear.allTopics")}</b>
                      <Text size="xs" c="dimmed">{t("backup.clear.allTopicsDesc")}</Text>
                    </>
                  }
                  checked={opts.clearTopics} onChange={e => setOpt("clearTopics", e.currentTarget.checked)} />
                <Checkbox size="sm" color="red"
                  label={
                    <>
                      <b>{t("backup.clear.mediaFiles")}</b>
                      <Text size="xs" c="dimmed">{t("backup.clear.mediaFilesDesc")}</Text>
                    </>
                  }
                  checked={opts.clearMedia} onChange={e => setOpt("clearMedia", e.currentTarget.checked)} />
              </Stack>
            </Box>
          </Stack>
        </SimpleGrid>

        {!isEmpty && (
          <>
            <Divider my="md" />
            <Alert color="orange" icon={<IconAlertTriangle size={14} />} mb="sm">
              <Text size="xs" fw={600} mb={4}>{t("backup.clear.affectedTablesLabel")}</Text>
              <Group gap={4} wrap="wrap">
                {affectedTables.map(table => (
                  <Badge key={table} size="xs" color="orange" variant="outline">
                    {table}
                  </Badge>
                ))}
                {opts.clearMedia && (
                  <Badge size="xs" color="red" variant="outline">
                    {t("backup.clear.mediaFilesTag")}
                  </Badge>
                )}
              </Group>
            </Alert>

            <TextInput
              label={t("backup.clear.confirmLabel")}
              placeholder={t("backup.clear.confirmPlaceholder")}
              value={confirmText}
              onChange={e => setConfirmText(e.currentTarget.value)}
              error={confirmText && confirmText !== clearConfirmWord ? t("backup.clear.confirmWordError") : null}
              mb="sm"
            />

            <Button
              leftSection={<IconTrash size={16} />}
              color="red"
              disabled={!canClear}
              loading={loading}
              onClick={handleClear}
            >
              {t("backup.clear.startBtn", {
                count: affectedTables.length + (opts.clearMedia ? 1 : 0),
              })}
            </Button>
          </>
        )}
      </Card>

      {result && (
        <Card withBorder radius="md" p="md">
          <Group gap="xs" mb="sm">
            <ThemeIcon color="green" variant="light" size="sm"><IconCheck size={14} /></ThemeIcon>
            <Text fw={600} size="sm">{t("backup.clear.resultTitle")}</Text>
          </Group>
          <Group gap="xs" wrap="wrap">
            {result.clearedTables.map(table => (
              <Badge key={table} color="green" variant="light" size="sm">{table}</Badge>
            ))}
            {result.mediaCleared && (
              <Badge color="green" variant="light" size="sm">
                {t("backup.clear.mediaFilesTag")}
              </Badge>
            )}
          </Group>
          <Text size="xs" c="dimmed" mt="xs">
            {t("backup.clear.totalCleaned", { count: result.clearedCount, by: result.clearedBy })}
          </Text>
          <Button size="xs" variant="subtle" mt="xs" onClick={() => setResult(null)}>
            {t("backup.clear.close")}
          </Button>
        </Card>
      )}
    </Stack>
  );
}

// ─── JOBS tab ─────────────────────────────────────────────────────────────────

function JobsTab() {
  const { t } = useTranslation();
  const { jobs, isLoading, isError, refresh } = useAllJobs();
  const { downloadBackup, handleError } = useBackupMutations();

  const handleDownload = async (jobId: string) => {
    try {
      const ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
      await downloadBackup(jobId, `prava-backup-${ts}.zip`);
    } catch (e) {
      handleError(e, t("backup.jobs.downloadError"));
    }
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text fw={600}>{t("backup.jobs.title", { count: jobs.length })}</Text>
        <Button size="xs" variant="light" leftSection={<IconRefresh size={14} />} onClick={() => refresh()}>
          {t("backup.jobs.refresh")}
        </Button>
      </Group>

      {isError ? (
        <Alert color="red" icon={<IconCircleX size={16} />}>
          {t("backup.jobs.loadError")}
        </Alert>
      ) : isLoading ? (
        <Center h={120}><Loader type="bars" /></Center>
      ) : jobs.length === 0 ? (
        <Center h={120}><Text c="dimmed">{t("backup.jobs.empty")}</Text></Center>
      ) : (
        <ScrollArea>
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t("backup.jobs.colType")}</Table.Th>
                <Table.Th>{t("backup.jobs.colStatus")}</Table.Th>
                <Table.Th>{t("backup.jobs.colProgress")}</Table.Th>
                <Table.Th>{t("backup.jobs.colPhase")}</Table.Th>
                <Table.Th>{t("backup.jobs.colStarted")}</Table.Th>
                <Table.Th>{t("backup.jobs.colFinished")}</Table.Th>
                <Table.Th>{t("backup.jobs.colAction")}</Table.Th>
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
                  <Table.Td>
                    {j.type === "EXPORT" && j.state === "COMPLETED" && (
                      <Button
                        size="xs"
                        variant="light"
                        color="blue"
                        leftSection={<IconDownload size={12} />}
                        onClick={() => handleDownload(j.jobId)}
                      >
                        {t("backup.jobs.downloadBtn")}
                      </Button>
                    )}
                  </Table.Td>
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
  const { t } = useTranslation();
  const [tab, setTab] = useState<string | null>("export");

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Group gap="sm">
          <ThemeIcon size="lg" radius="md" variant="light" color="blue">
            <IconDatabaseExport size={20} />
          </ThemeIcon>
          <Title order={3}>{t("backup.title")}</Title>
        </Group>
        <Badge color="red" variant="light" size="lg">{t("backup.superAdmin")}</Badge>
      </Group>

      <Tabs value={tab} onChange={setTab}>
        <Tabs.List>
          <Tabs.Tab value="export" leftSection={<IconDatabaseExport size={15} />}>
            {t("backup.tabs.export")}
          </Tabs.Tab>
          <Tabs.Tab value="import" leftSection={<IconDatabaseImport size={15} />}>
            {t("backup.tabs.import")}
          </Tabs.Tab>
          <Tabs.Tab value="clear" leftSection={<IconTrash size={15} />} color="red">
            {t("backup.tabs.clear")}
          </Tabs.Tab>
          <Tabs.Tab value="jobs" leftSection={<IconList size={15} />}>
            {t("backup.tabs.jobs")}
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
