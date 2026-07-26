import { useTranslation } from "react-i18next";
import {
  Card, Group, Text, Badge, Alert, ScrollArea, Table, Tooltip, Button,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconAlertTriangle, IconTable } from "@tabler/icons-react";
import type { TableImportResult } from "../../../features/backup/types";

export function TableResultsCard({ results }: { results: Record<string, TableImportResult> }) {
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
              // red.0/gray.0 dark rejimda deyarli oq qator berardi —
              // -light variantlar ikkala rang sxemasida ham to'g'ri ishlaydi.
              return (
                <Table.Tr
                  key={r.tableName}
                  bg={
                    r.failed > 0
                      ? "var(--mantine-color-red-light)"
                      : isSkipped
                        ? "var(--mantine-color-default-hover)"
                        : undefined
                  }
                >
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
