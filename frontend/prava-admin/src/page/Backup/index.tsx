import { useRef, useState } from "react";
import {
  Stack,
  Title,
  Group,
  Badge,
  Tabs,
  Button,
  Card,
  Text,
  Progress,
  Alert,
  Switch,
  PasswordInput,
  Divider,
  Table,
  ScrollArea,
  Center,
  Loader,
  ThemeIcon,
  SimpleGrid,
  Paper,
  Code,
  Tooltip,
  FileButton,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconDatabaseExport,
  IconDatabaseImport,
  IconDownload,
  IconUpload,
  IconRefresh,
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconPlayerPlay,
  IconShieldLock,
  IconList,
  IconInfoCircle,
} from "@tabler/icons-react";
import { useBackupJob, useAllJobs } from "../../features/backup/hooks/useBackupJob";
import { useBackupMutations } from "../../features/backup/hooks/useBackupMutations";
import type { BackupJob, JobState } from "../../features/backup/types";

// ─── helpers ────────────────────────────────────────────────────────────────

function stateColor(s: JobState) {
  return s === "COMPLETED" ? "green"
       : s === "FAILED"    ? "red"
       : s === "RUNNING"   ? "blue"
       : s === "PENDING"   ? "yellow"
       : "gray";
}

function stateIcon(s: JobState) {
  if (s === "COMPLETED") return <IconCircleCheck size={16} />;
  if (s === "FAILED")    return <IconCircleX    size={16} />;
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

// ─── JobProgress card ────────────────────────────────────────────────────────

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
        <Badge color={stateColor(job.state)} variant="light">
          {job.state}
        </Badge>
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
        <Group mt="sm" gap="xs">
          <Button
            size="xs"
            leftSection={<IconDownload size={14} />}
            onClick={onDownload}
          >
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
        <Alert color="green" mt="sm" icon={<IconCircleCheck size={16} />}>
          Restore muvaffaqiyatli tugadi
          {job.summary && (
            <Code block mt={6} style={{ fontSize: 11, maxHeight: 160, overflow: "auto" }}>
              {job.summary}
            </Code>
          )}
        </Alert>
      )}
    </Card>
  );
}

// ─── EXPORT tab ─────────────────────────────────────────────────────────────

function ExportTab() {
  const [exportJobId, setExportJobId]   = useState<string | null>(null);
  const [encrypt, setEncrypt]           = useState(false);
  const [password, setPassword]         = useState("");
  const [loading, setLoading]           = useState(false);

  const { job } = useBackupJob(exportJobId, "export");
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
        Backup <b>ZIP</b> format: barcha jadvallar, rasmlar va manifest fayl. Jarayon fon
        (async) da ishlaydi — sahifani yopish mumkin.
      </Alert>

      <Card withBorder radius="md" p="md">
        <Text fw={600} mb="md">Backup sozlamalari</Text>

        <Switch
          label="AES-256-GCM shifrlash"
          description="Backup faylini parol bilan shifrlash"
          checked={encrypt}
          onChange={(e) => setEncrypt(e.currentTarget.checked)}
          mb="sm"
        />

        {encrypt && (
          <PasswordInput
            label="Shifrlash paroli"
            placeholder="Kamida 8 belgi"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            leftSection={<IconShieldLock size={16} />}
            mb="sm"
            required
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

      {job && (
        <JobProgress job={job} onDownload={handleDownload} />
      )}

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

// ─── IMPORT tab ─────────────────────────────────────────────────────────────

function ImportTab() {
  const [importJobId, setImportJobId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [forceReplace, setForceReplace] = useState(false);
  const [encrypted, setEncrypted]       = useState(false);
  const [password, setPassword]         = useState("");
  const [loading, setLoading]           = useState(false);
  const resetRef                        = useRef<() => void>(null);

  const { job } = useBackupJob(importJobId, "import");
  const { startImport, handleError } = useBackupMutations();

  const canStart = !!selectedFile && !loading &&
    (job == null || job.state === "COMPLETED" || job.state === "FAILED");

  const handleStart = () => {
    if (!selectedFile) return;

    const doImport = async () => {
      setLoading(true);
      try {
        const id = await startImport({
          file: selectedFile,
          forceReplace,
          password: encrypted ? password : undefined,
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

        <Group mb="md">
          <FileButton
            resetRef={resetRef}
            onChange={setSelectedFile}
            accept=".zip"
          >
            {(props) => (
              <Button
                {...props}
                variant="light"
                leftSection={<IconUpload size={16} />}
              >
                ZIP fayl tanlash
              </Button>
            )}
          </FileButton>

          {selectedFile && (
            <Group gap="xs">
              <Text size="sm" fw={500}>{selectedFile.name}</Text>
              <Badge variant="light" color="gray">
                {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
              </Badge>
              <Button
                size="xs"
                variant="subtle"
                color="red"
                onClick={() => { setSelectedFile(null); resetRef.current?.(); }}
              >
                ✕
              </Button>
            </Group>
          )}
        </Group>

        <Divider mb="md" />

        <Switch
          label="Force replace (TRUNCATE + restore)"
          description="Mavjud ma'lumotlarni o'chirib to'liq restore — yangi server uchun"
          checked={forceReplace}
          onChange={(e) => setForceReplace(e.currentTarget.checked)}
          color="red"
          mb="sm"
        />

        <Switch
          label="Backup shifrlangan"
          description="Backup AES-256-GCM bilan shifrlangan bo'lsa"
          checked={encrypted}
          onChange={(e) => setEncrypted(e.currentTarget.checked)}
          mb="sm"
        />

        {encrypted && (
          <PasswordInput
            label="Shifrlash paroli"
            placeholder="Backup yaratilingan parol"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            leftSection={<IconShieldLock size={16} />}
            mb="sm"
            required
          />
        )}

        <Button
          leftSection={<IconDatabaseImport size={16} />}
          loading={loading}
          disabled={!canStart}
          color={forceReplace ? "red" : "blue"}
          onClick={handleStart}
          mt="xs"
        >
          {forceReplace ? "Force restore boshlash" : "Merge restore boshlash"}
        </Button>
      </Card>

      {job && (
        <JobProgress job={job} onDownload={() => {}} />
      )}
    </Stack>
  );
}

// ─── JOBS tab ────────────────────────────────────────────────────────────────

function JobsTab() {
  const { jobs, isLoading, refresh } = useAllJobs();

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text fw={600}>Barcha joblar ({jobs.length})</Text>
        <Button size="xs" variant="light" leftSection={<IconRefresh size={14} />} onClick={() => refresh()}>
          Yangilash
        </Button>
      </Group>

      {isLoading ? (
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
                    <Badge color={stateColor(j.state)} variant="light">
                      {j.state}
                    </Badge>
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
                    <Text size="xs" c="dimmed" truncate maw={160}>{j.phase}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs">{fmtDate(j.startedAt)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs">{fmtDate(j.completedAt)}</Text>
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

// ─── Page ────────────────────────────────────────────────────────────────────

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
          <Tabs.Tab value="jobs" leftSection={<IconList size={15} />}>
            Joblar
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="export" pt="md"><ExportTab /></Tabs.Panel>
        <Tabs.Panel value="import" pt="md"><ImportTab /></Tabs.Panel>
        <Tabs.Panel value="jobs"   pt="md"><JobsTab   /></Tabs.Panel>
      </Tabs>
    </Stack>
  );
};

export default Backup_Page;
