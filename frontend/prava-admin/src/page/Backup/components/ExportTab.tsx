import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Stack, Alert, Card, Text, Switch, PasswordInput, Button, SimpleGrid, Paper,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconInfoCircle, IconShieldLock, IconPlayerPlay,
} from "@tabler/icons-react";
import { useBackupJob } from "../../../features/backup/hooks/useBackupJob";
import { useBackupMutations } from "../../../features/backup/hooks/useBackupMutations";
import { JobProgress } from "./JobProgress";

export function ExportTab() {
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
