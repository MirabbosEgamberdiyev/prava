import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Stack, Alert, Card, Text, Group, FileButton, Button, Badge, Divider,
  Switch, PasswordInput,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconAlertTriangle, IconUpload, IconShieldLock, IconDatabaseImport,
} from "@tabler/icons-react";
import { useBackupJob } from "../../../features/backup/hooks/useBackupJob";
import { useBackupMutations } from "../../../features/backup/hooks/useBackupMutations";
import type { ImportOptions } from "../../../features/backup/types";
import { DEFAULT_IMPORT_OPTIONS } from "../../../features/backup/types";
import { JobProgress } from "./JobProgress";
import { ImportOptionsPanel } from "./ImportOptionsPanel";

const MAX_IMPORT_SIZE_MB = 1000;

export function ImportTab() {
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
