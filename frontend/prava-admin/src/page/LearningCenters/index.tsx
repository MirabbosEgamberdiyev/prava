import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Stack, Title, Group, Badge, Button, Text, ThemeIcon,
  TextInput, Select, Table, ScrollArea, Skeleton, Pagination,
  ActionIcon, Tooltip,
  Center, Paper,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconBuilding, IconPlus, IconRefresh, IconSearch,
  IconEdit, IconTrash, IconToggleLeft, IconToggleRight,
  IconDeviceDesktop, IconKey,
} from "@tabler/icons-react";
import { useSWRConfig } from "swr";
import { useLearningCenterList } from "../../features/learningCenter/hooks/useLearningCenters";
import learningCenterService from "../../services/learningCenterService";
import type {
  LearningCenterResponse,
  LearningCenterFilter,
  LearningCenterStatus,
} from "../../features/learningCenter/types";
import { fmtDateTime } from "./components/helpers";
import { StatsCards } from "./components/StatsCards";
import { LearningCenterFormModal } from "./components/LearningCenterFormModal";
import { ComputersModal } from "./components/ComputersModal";

// ─── Table Skeleton ───────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <Table.Tr key={i}>
          {Array.from({ length: 7 }).map((_, j) => (
            <Table.Td key={j}><Skeleton height={20} radius="sm" /></Table.Td>
          ))}
        </Table.Tr>
      ))}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const LearningCenters_Page = () => {
  const { t } = useTranslation();
  const { mutate } = useSWRConfig();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LearningCenterStatus | null>(null);
  const [page,   setPage]   = useState(0);
  const PAGE_SIZE = 15;

  const filter: LearningCenterFilter = {
    page,
    size: PAGE_SIZE,
    search: search || undefined,
    status: status ?? undefined,
  };

  const { page: data, isLoading } = useLearningCenterList(filter);

  // LC form modal
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [editing, setEditing] = useState<LearningCenterResponse | null>(null);

  // Computers modal
  const [selectedLc, setSelectedLc] = useState<LearningCenterResponse | null>(null);

  const centers    = data?.content    ?? [];
  const totalPages = data?.totalPages ?? 0;

  const refreshList = () => mutate(["learning-center-list", JSON.stringify(filter)]);

  const handleCreate = () => { setEditing(null); openForm(); };
  const handleEdit   = (lc: LearningCenterResponse) => { setEditing(lc); openForm(); };
  const handleFormClose = () => { setEditing(null); closeForm(); };

  const handleToggleStatus = (lc: LearningCenterResponse) => {
    const newStatus: LearningCenterStatus = lc.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    modals.openConfirmModal({
      title: t("lc.status.title"),
      children: (
        <Text size="sm">
          {lc.status === "ACTIVE"
            ? t("lc.status.deactivateConfirm", { name: lc.name })
            : t("lc.status.activateConfirm",   { name: lc.name })}
        </Text>
      ),
      labels: {
        confirm: lc.status === "ACTIVE" ? t("lc.status.deactivateBtn") : t("lc.status.activateBtn"),
        cancel:  t("common.cancel"),
      },
      confirmProps: { color: lc.status === "ACTIVE" ? "orange" : "green" },
      onConfirm: async () => {
        try {
          await learningCenterService.setStatus(lc.id, newStatus);
          refreshList();
          mutate("learning-centers-active");
          notifications.show({
            title:   t("lc.notifications.statusChanged"),
            message: lc.name,
            color:   lc.status === "ACTIVE" ? "orange" : "green",
          });
        } catch {
          notifications.show({ title: t("common.error"), message: t("lc.notifications.statusError"), color: "red" });
        }
      },
    });
  };

  const handleDelete = (lc: LearningCenterResponse) => {
    modals.openConfirmModal({
      title: t("lc.delete.title"),
      children: <Text size="sm">{t("lc.delete.confirm", { name: lc.name })}</Text>,
      labels: { confirm: t("common.delete"), cancel: t("common.cancel") },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await learningCenterService.delete(lc.id);
          refreshList();
          mutate("learning-centers-active");
          notifications.show({ title: t("lc.notifications.deleteSuccess"), message: lc.name, color: "green" });
        } catch (err) {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
            ?? t("lc.notifications.deleteError");
          notifications.show({ title: t("common.error"), message: msg, color: "red" });
        }
      },
    });
  };

  const statusOptions = [
    { value: "ACTIVE",   label: t("common.active") },
    { value: "INACTIVE", label: t("common.inactive") },
  ];

  return (
    <Stack gap="md">
      {/* Header */}
      <Group justify="space-between" wrap="wrap">
        <Group gap="sm">
          <ThemeIcon size="lg" radius="md" variant="light" color="teal">
            <IconBuilding size={20} />
          </ThemeIcon>
          <div>
            <Title order={3}>{t("lc.title")}</Title>
            <Text size="xs" c="dimmed">{t("lc.subtitle")}</Text>
          </div>
        </Group>
        <Group gap="xs">
          <Badge color="red" variant="light" size="lg">{t("common.superAdmin")}</Badge>
          <Tooltip label={t("common.refresh")}>
            <ActionIcon variant="light" onClick={refreshList} aria-label={t("common.refresh")}><IconRefresh size={16} /></ActionIcon>
          </Tooltip>
          <Button leftSection={<IconPlus size={16} />} color="teal" onClick={handleCreate}>
            {t("lc.createBtn")}
          </Button>
        </Group>
      </Group>

      {/* Stats */}
      {!isLoading && <StatsCards centers={centers} />}

      {/* Filters */}
      <Group gap="sm" wrap="wrap">
        <TextInput
          placeholder={t("lc.filter.search")}
          leftSection={<IconSearch size={14} />}
          value={search}
          onChange={(e) => { setSearch(e.currentTarget.value); setPage(0); }}
          style={{ flex: 1, minWidth: 200 }}
        />
        <Select
          placeholder={t("lc.filter.status")}
          data={statusOptions}
          value={status}
          onChange={(v) => { setStatus(v as LearningCenterStatus | null); setPage(0); }}
          clearable
          style={{ minWidth: 150 }}
        />
      </Group>

      {/* Table */}
      <Paper withBorder radius="md">
        <ScrollArea>
          <Table striped highlightOnHover withColumnBorders fz="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>#</Table.Th>
                <Table.Th>{t("lc.table.name")}</Table.Th>
                <Table.Th>{t("lc.table.contact")}</Table.Th>
                <Table.Th>{t("lc.table.codes")}</Table.Th>
                <Table.Th>{t("lc.table.computers")}</Table.Th>
                <Table.Th>{t("lc.table.status")}</Table.Th>
                <Table.Th>{t("lc.table.createdAt")}</Table.Th>
                <Table.Th>{t("lc.table.actions")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isLoading ? (
                <TableSkeleton />
              ) : centers.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={8}>
                    <Center py="xl">
                      <Stack align="center" gap="xs">
                        <IconBuilding size={32} style={{ opacity: 0.3 }} />
                        <Text c="dimmed" size="sm">{t("common.noData")}</Text>
                      </Stack>
                    </Center>
                  </Table.Td>
                </Table.Tr>
              ) : (
                centers.map((lc) => (
                  <Table.Tr key={lc.id}>
                    <Table.Td>
                      <Text size="xs" c="dimmed">{lc.id}</Text>
                    </Table.Td>

                    <Table.Td>
                      <Text size="sm" fw={600} truncate maw={180}>{lc.name}</Text>
                      {lc.address && (
                        <Text size="xs" c="dimmed" truncate maw={180}>{lc.address}</Text>
                      )}
                    </Table.Td>

                    <Table.Td>
                      {lc.contactPerson && (
                        <Text size="sm" truncate maw={140}>{lc.contactPerson}</Text>
                      )}
                      {lc.phone && (
                        <Text size="xs" c="dimmed">{lc.phone}</Text>
                      )}
                    </Table.Td>

                    <Table.Td>
                      <Group gap={4} wrap="nowrap">
                        <Tooltip label={t("lc.table.totalCodes")}>
                          <Group gap={4}>
                            <IconKey size={12} style={{ opacity: 0.5 }} />
                            <Text size="sm" fw={500}>{lc.totalCodes ?? 0}</Text>
                          </Group>
                        </Tooltip>
                        <Text size="xs" c="dimmed">/ {lc.activeCodes ?? 0} {t("lc.table.activeShort")}</Text>
                      </Group>
                    </Table.Td>

                    {/* Computers column — click opens the computers modal */}
                    <Table.Td>
                      <Tooltip label={t("computer.title")}>
                        <Group
                          gap={4}
                          wrap="nowrap"
                          style={{ cursor: "pointer" }}
                          onClick={() => setSelectedLc(lc)}
                        >
                          <IconDeviceDesktop size={13} style={{ opacity: 0.6, color: "var(--mantine-color-cyan-6)" }} />
                          <Text size="sm" c="cyan" fw={500}>{lc.computerCount ?? 0}</Text>
                        </Group>
                      </Tooltip>
                    </Table.Td>

                    <Table.Td>
                      <Badge
                        color={lc.status === "ACTIVE" ? "green" : "gray"}
                        variant="light"
                        size="sm"
                      >
                        {lc.status === "ACTIVE" ? t("common.active") : t("common.inactive")}
                      </Badge>
                    </Table.Td>

                    <Table.Td>
                      <Text size="xs" c="dimmed">{fmtDateTime(lc.createdAt)}</Text>
                    </Table.Td>

                    <Table.Td>
                      <Group gap={4} wrap="nowrap">
                        <Tooltip label={t("computer.title")}>
                          <ActionIcon size="sm" variant="subtle" color="cyan" onClick={() => setSelectedLc(lc)} aria-label={t("computer.title")}>
                            <IconDeviceDesktop size={14} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label={t("common.edit")}>
                          <ActionIcon size="sm" variant="subtle" color="blue" onClick={() => handleEdit(lc)} aria-label={t("common.edit")}>
                            <IconEdit size={14} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label={lc.status === "ACTIVE" ? t("lc.status.deactivateBtn") : t("lc.status.activateBtn")}>
                          <ActionIcon
                            size="sm" variant="subtle"
                            color={lc.status === "ACTIVE" ? "orange" : "green"}
                            onClick={() => handleToggleStatus(lc)}
                           aria-label={lc.status === "ACTIVE" ? t("lc.status.deactivateBtn") : t("lc.status.activateBtn")}>
                            {lc.status === "ACTIVE" ? <IconToggleLeft size={14} /> : <IconToggleRight size={14} />}
                          </ActionIcon>
                        </Tooltip>

                        {lc.status === "INACTIVE" && (
                          <Tooltip label={t("common.delete")}>
                            <ActionIcon size="sm" variant="subtle" color="red" onClick={() => handleDelete(lc)} aria-label={t("common.delete")}>
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
              {t("lc.table.total", { count: data?.totalElements ?? 0 })}
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

      {/* LC Create/Edit Modal */}
      <LearningCenterFormModal
        key={editing ? `lc-edit-${editing.id}` : "lc-new"}
        opened={formOpened}
        editing={editing}
        onClose={handleFormClose}
        onSuccess={() => {
          refreshList();
          mutate("learning-centers-active");
        }}
      />

      {/* Computers management modal */}
      <ComputersModal
        lc={selectedLc}
        onClose={() => setSelectedLc(null)}
      />
    </Stack>
  );
};

export default LearningCenters_Page;
