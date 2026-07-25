import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Stack, Title, Group, Badge, Button, Text, ThemeIcon,
  TextInput, Select, Table, ScrollArea, Skeleton, Pagination,
  ActionIcon, Tooltip, CopyButton,
  Code, Center,
  Paper,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconKey, IconPlus, IconRefresh, IconSearch, IconCopy,
  IconCheck, IconBan, IconTrash,
  IconEye, IconBuilding, IconDeviceDesktop, IconPlayerPlay,
} from "@tabler/icons-react";
import { useLicenseStats, useLicenseList } from "../../features/license/hooks/useLicense";
import { useLicenseMutations } from "../../features/license/hooks/useLicenseMutations";
import type {
  ActivationCodeResponse,
  ActivationCodeGroup,
} from "../../features/license/types";
import { useSWRConfig } from "swr";
import { useLearningCentersActive } from "../../features/learningCenter/hooks/useLearningCenters";
import { useComputersAllActive } from "../../features/computer/hooks/useComputers";
import { groupColor, fmtDate } from "./components/helpers";
import { StatsCards } from "./components/StatsCards";
import { DetailModal } from "./components/DetailModal";
import { GenerateModal } from "./components/GenerateModal";
import { DeactivateModal } from "./components/DeactivateModal";

// ─── Table Skeleton ───────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <Table.Tr key={i}>
          {Array.from({ length: 8 }).map((_, j) => (
            <Table.Td key={j}><Skeleton height={20} radius="sm" /></Table.Td>
          ))}
        </Table.Tr>
      ))}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const License_Page = () => {
  const { t } = useTranslation();
  const { mutate } = useSWRConfig();

  // Filter state
  const [search,  setSearch]  = useState("");
  const [group,   setGroup]   = useState<string | null>(null);
  const [lcId,    setLcId]    = useState<number | null>(null);
  const [compId,  setCompId]  = useState<number | null>(null);
  const [page,    setPage]    = useState(0);
  const PAGE_SIZE = 15;

  const { centers }   = useLearningCentersActive();
  const { computers } = useComputersAllActive();

  const filter = {
    page,
    size: PAGE_SIZE,
    search:           search || undefined,
    group:            (group as ActivationCodeGroup) || undefined,
    computerId:       compId  ?? undefined,
    learningCenterId: lcId    ?? undefined,
  };

  const { page: data, isLoading } = useLicenseList(filter);
  const { refresh: refreshStats } = useLicenseStats();

  // Modals
  const [generateOpened, { open: openGenerate, close: closeGenerate }] = useDisclosure(false);
  const [detailCode,     setDetailCode]     = useState<ActivationCodeResponse | null>(null);
  const [deactivateCode, setDeactivateCode] = useState<ActivationCodeResponse | null>(null);

  const { deleteCode, reactivate, handleError } = useLicenseMutations();

  const handleRefreshAll = () => {
    mutate("license-stats");
    mutate(["license-list", JSON.stringify(filter)]);
  };

  const handleMutationSuccess = () => {
    handleRefreshAll();
    refreshStats();
  };

  const handleReactivate = (code: ActivationCodeResponse) => {
    modals.openConfirmModal({
      title: t("license.reactivate.title"),
      children: (
        <Text size="sm">
          {t("license.reactivate.confirm", {
            computer: code.computerName ?? code.machineId,
          })}
        </Text>
      ),
      labels:       { confirm: t("license.reactivate.submit"), cancel: t("common.cancel") },
      confirmProps: { color: "green" },
      onConfirm: async () => {
        try {
          await reactivate(code.id);
          handleRefreshAll();
          notifications.show({
            title:   t("license.notifications.reactivateSuccess"),
            message: t("license.notifications.reactivateSuccessMsg"),
            color:   "green",
          });
        } catch (e) {
          handleError(e, t("license.notifications.reactivateError"));
        }
      },
    });
  };

  const handleDelete = (code: ActivationCodeResponse) => {
    modals.openConfirmModal({
      title: t("license.delete.title"),
      children: (
        <Text size="sm">
          {t("license.delete.confirm", {
            computer: code.computerName ?? code.machineId,
          })}
        </Text>
      ),
      labels:       { confirm: t("license.delete.submit"), cancel: t("common.cancel") },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await deleteCode(code.id);
          handleRefreshAll();
          notifications.show({
            title:   t("license.notifications.deleteSuccess"),
            message: t("license.notifications.deleteSuccessMsg"),
            color:   "green",
          });
        } catch (e) {
          handleError(e, t("license.notifications.deleteError"));
        }
      },
    });
  };

  const groupOptions = [
    { value: "ACTIVE",      label: t("license.group.active") },
    { value: "EXPIRING",    label: t("license.group.expiring") },
    { value: "EXPIRED",     label: t("license.group.expired") },
    { value: "DEACTIVATED", label: t("license.group.deactivated") },
  ];

  const codes      = data?.content    ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <Stack gap="md">
      {/* Header */}
      <Group justify="space-between" wrap="wrap">
        <Group gap="sm">
          <ThemeIcon size="lg" radius="md" variant="light" color="blue">
            <IconKey size={20} />
          </ThemeIcon>
          <div>
            <Title order={3}>{t("license.title")}</Title>
            <Text size="xs" c="dimmed">{t("license.subtitle")}</Text>
          </div>
        </Group>
        <Group gap="xs">
          <Badge color="red" variant="light" size="lg">{t("common.superAdmin")}</Badge>
          <Tooltip label={t("common.refresh")}>
            <ActionIcon variant="light" onClick={handleRefreshAll} aria-label={t("common.refresh")}>
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
          <Button leftSection={<IconPlus size={16} />} onClick={openGenerate}>
            {t("license.generate.btn")}
          </Button>
        </Group>
      </Group>

      {/* Stats */}
      <StatsCards />

      {/* Filters */}
      <Group gap="sm" wrap="wrap">
        <TextInput
          placeholder={t("license.filter.search")}
          leftSection={<IconSearch size={14} />}
          value={search}
          onChange={(e) => { setSearch(e.currentTarget.value); setPage(0); }}
          style={{ flex: 1, minWidth: 200 }}
        />
        <Select
          placeholder={t("license.filter.group")}
          data={groupOptions}
          value={group}
          onChange={(v) => { setGroup(v); setPage(0); }}
          clearable
          style={{ minWidth: 160 }}
        />
        <Select
          placeholder={t("license.filter.learningCenter")}
          data={centers.map(c => ({ value: String(c.id), label: c.name }))}
          value={lcId ? String(lcId) : null}
          onChange={(v) => { setLcId(v ? Number(v) : null); setCompId(null); setPage(0); }}
          clearable
          searchable
          leftSection={<IconBuilding size={14} />}
          style={{ minWidth: 180 }}
        />
        <Select
          placeholder={t("license.filter.computer")}
          data={computers
            .filter(c => !lcId || c.learningCenterId === lcId)
            .map(c => ({ value: String(c.id), label: c.name }))}
          value={compId ? String(compId) : null}
          onChange={(v) => { setCompId(v ? Number(v) : null); setPage(0); }}
          clearable
          searchable
          leftSection={<IconDeviceDesktop size={14} />}
          style={{ minWidth: 160 }}
        />
      </Group>

      {/* Table */}
      <Paper withBorder radius="md">
        <ScrollArea>
          <Table striped highlightOnHover withColumnBorders fz="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>#</Table.Th>
                <Table.Th>{t("license.table.computer")}</Table.Th>
                <Table.Th>{t("license.table.learningCenter")}</Table.Th>
                <Table.Th>{t("license.table.machineId")}</Table.Th>
                <Table.Th>{t("license.table.startDate")}</Table.Th>
                <Table.Th>{t("license.table.endDate")}</Table.Th>
                <Table.Th>{t("license.table.status")}</Table.Th>
                <Table.Th>{t("license.table.generatedBy")}</Table.Th>
                <Table.Th>{t("license.table.actions")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isLoading ? (
                <TableSkeleton />
              ) : codes.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={9}>
                    <Center py="xl">
                      <Stack align="center" gap="xs">
                        <IconKey size={32} style={{ opacity: 0.3 }} />
                        <Text c="dimmed" size="sm">{t("common.noData")}</Text>
                      </Stack>
                    </Center>
                  </Table.Td>
                </Table.Tr>
              ) : (
                codes.map((code) => (
                  <Table.Tr key={code.id}>
                    <Table.Td>
                      <Text size="xs" c="dimmed">{code.id}</Text>
                    </Table.Td>

                    {/* Computer column */}
                    <Table.Td>
                      <Group gap={4} wrap="nowrap">
                        <IconDeviceDesktop size={12} style={{ opacity: 0.4 }} />
                        <Text size="sm" fw={500} truncate maw={140}>
                          {code.computerName ?? "—"}
                        </Text>
                      </Group>
                      {code.macAddress && (
                        <Text size="xs" c="dimmed" truncate maw={140}>{code.macAddress}</Text>
                      )}
                    </Table.Td>

                    {/* Learning center column */}
                    <Table.Td>
                      {code.learningCenterName ? (
                        <Text size="xs" truncate maw={140}>{code.learningCenterName}</Text>
                      ) : (
                        <Text size="xs" c="dimmed">—</Text>
                      )}
                    </Table.Td>

                    {/* Machine ID column */}
                    <Table.Td>
                      <Tooltip label={code.machineId}>
                        <Code fz="xs" style={{ cursor: "help" }}>
                          {code.machineId.slice(0, 12)}…
                        </Code>
                      </Tooltip>
                    </Table.Td>

                    <Table.Td>
                      <Text size="xs">{fmtDate(code.startDate)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs">{fmtDate(code.endDate)}</Text>
                    </Table.Td>

                    <Table.Td>
                      <Group gap={4} wrap="nowrap">
                        <Badge
                          color={groupColor(code.displayGroup)}
                          variant="light"
                          size="sm"
                        >
                          {t(`license.group.${code.displayGroup.toLowerCase()}`)}
                        </Badge>
                        {code.daysUntilExpiry !== undefined && code.daysUntilExpiry >= 0 && (
                          <Text size="xs" c="dimmed">{code.daysUntilExpiry}d</Text>
                        )}
                      </Group>
                    </Table.Td>

                    <Table.Td>
                      <Text size="xs" c="dimmed" truncate maw={120}>
                        {code.generatedBy ?? "—"}
                      </Text>
                    </Table.Td>

                    <Table.Td>
                      <Group gap={4} wrap="nowrap">
                        {/* View detail */}
                        <Tooltip label={t("common.view")}>
                          <ActionIcon
                            size="sm" variant="subtle" color="blue"
                            onClick={() => setDetailCode(code)}
                           aria-label={t("common.view")}>
                            <IconEye size={14} />
                          </ActionIcon>
                        </Tooltip>

                        {/* Copy token */}
                        <CopyButton value={code.licenseKey} timeout={2000}>
                          {({ copied, copy }) => (
                            <Tooltip label={copied ? t("license.detail.copied") : t("license.detail.copy")}>
                              <ActionIcon
                                size="sm" variant="subtle"
                                color={copied ? "green" : "gray"}
                                onClick={copy}
                               aria-label={copied ? t("license.detail.copied") : t("license.detail.copy")}>
                                {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </CopyButton>

                        {/* Deactivate */}
                        {(code.displayGroup === "ACTIVE" || code.displayGroup === "EXPIRING") && (
                          <Tooltip label={t("license.deactivate.btn")}>
                            <ActionIcon
                              size="sm" variant="subtle" color="orange"
                              onClick={() => setDeactivateCode(code)}
                             aria-label={t("license.deactivate.btn")}>
                              <IconBan size={14} />
                            </ActionIcon>
                          </Tooltip>
                        )}

                        {/* Reactivate — only DEACTIVATED codes */}
                        {code.displayGroup === "DEACTIVATED" && (
                          <Tooltip label={t("license.reactivate.btn")}>
                            <ActionIcon
                              size="sm" variant="subtle" color="green"
                              onClick={() => handleReactivate(code)}
                             aria-label={t("license.reactivate.btn")}>
                              <IconPlayerPlay size={14} />
                            </ActionIcon>
                          </Tooltip>
                        )}

                        {/* Delete */}
                        {(code.displayGroup === "EXPIRED" || code.displayGroup === "DEACTIVATED") && (
                          <Tooltip label={t("common.delete")}>
                            <ActionIcon
                              size="sm" variant="subtle" color="red"
                              onClick={() => handleDelete(code)}
                             aria-label={t("common.delete")}>
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>

        {totalPages > 1 && (
          <Group justify="space-between" p="sm">
            <Text size="xs" c="dimmed">
              {t("license.table.total", { count: data?.totalElements ?? 0 })}
            </Text>
            <Pagination
              value={page + 1}
              onChange={(p) => setPage(p - 1)}
              total={totalPages}
              size="sm"
            />
          </Group>
        )}
      </Paper>

      {/* Modals */}
      <GenerateModal
        opened={generateOpened}
        onClose={closeGenerate}
        onSuccess={handleMutationSuccess}
      />
      <DetailModal code={detailCode} onClose={() => setDetailCode(null)} />
      <DeactivateModal
        code={deactivateCode}
        onClose={() => setDeactivateCode(null)}
        onSuccess={handleMutationSuccess}
      />
    </Stack>
  );
};

export default License_Page;
