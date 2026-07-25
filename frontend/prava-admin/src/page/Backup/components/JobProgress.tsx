import { useTranslation } from "react-i18next";
import { Card, Group, Text, Badge, Progress, Alert, ThemeIcon, Code, Button } from "@mantine/core";
import { IconClock, IconCircleX, IconCircleCheck, IconDownload } from "@tabler/icons-react";
import type { BackupJob } from "../../../features/backup/types";
import { stateColor, stateIcon, fmtKB } from "./helpers";
import { TableResultsCard } from "./TableResultsCard";

export function JobProgress({ job, onDownload }: { job: BackupJob; onDownload: () => void }) {
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
              {String(t("backup.job.rowCount", {
                count: Object.values(job.entities).reduce((a, b) => a + b, 0),
              }))}
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
