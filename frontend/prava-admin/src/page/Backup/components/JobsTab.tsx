import { useTranslation } from "react-i18next";
import {
  Stack, Group, Text, Button, Alert, Center, Loader, ScrollArea, Table,
  Badge, Tooltip, Progress,
} from "@mantine/core";
import {
  IconRefresh, IconCircleX, IconDatabaseExport, IconDatabaseImport, IconDownload,
} from "@tabler/icons-react";
import { useAllJobs } from "../../../features/backup/hooks/useBackupJob";
import { useBackupMutations } from "../../../features/backup/hooks/useBackupMutations";
import { stateColor, fmtDate } from "./helpers";

export function JobsTab() {
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
