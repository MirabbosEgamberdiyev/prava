import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Stack, Title, Group, Badge, Button, Text, ThemeIcon,
  TextInput, Select, Table, ScrollArea, Skeleton, Pagination,
  Card, SimpleGrid, ActionIcon, Tooltip, Modal,
  Textarea, Alert, Center, Paper,
  NumberFormatter, Code, Divider,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconBuilding, IconPlus, IconRefresh, IconSearch,
  IconEdit, IconTrash, IconToggleLeft, IconToggleRight,
  IconInfoCircle, IconDeviceDesktop, IconKey,
} from "@tabler/icons-react";
import { useSWRConfig } from "swr";
import { useLearningCenterList } from "../../features/learningCenter/hooks/useLearningCenters";
import { useComputerList } from "../../features/computer/hooks/useComputers";
import learningCenterService from "../../services/learningCenterService";
import computerService from "../../services/computerService";
import type {
  LearningCenterResponse,
  LearningCenterRequest,
  LearningCenterFilter,
  LearningCenterStatus,
} from "../../features/learningCenter/types";
import type {
  ComputerResponse,
  ComputerRequest,
  ComputerStatus,
} from "../../features/computer/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDateTime(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

// ─── Stats Cards ──────────────────────────────────────────────────────────────

function StatsCards({ centers }: { centers: LearningCenterResponse[] }) {
  const { t } = useTranslation();
  const total      = centers.length;
  const active     = centers.filter(c => c.status === "ACTIVE").length;
  const inactive   = centers.filter(c => c.status === "INACTIVE").length;
  const totalCodes = centers.reduce((s, c) => s + (c.totalCodes   ?? 0), 0);
  const activeCodes= centers.reduce((s, c) => s + (c.activeCodes  ?? 0), 0);
  const computers  = centers.reduce((s, c) => s + (c.computerCount?? 0), 0);

  const cards = [
    { value: total,       color: "blue",   label: t("lc.stats.total") },
    { value: active,      color: "green",  label: t("lc.stats.active") },
    { value: inactive,    color: "gray",   label: t("lc.stats.inactive") },
    { value: totalCodes,  color: "violet", label: t("lc.stats.totalCodes") },
    { value: activeCodes, color: "teal",   label: t("lc.stats.activeCodes") },
    { value: computers,   color: "cyan",   label: t("lc.stats.computers") },
  ];

  return (
    <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }} spacing="sm">
      {cards.map(({ value, color, label }, i) => (
        <Card key={i} withBorder radius="md" p="md">
          <Text size="xs" c="dimmed" fw={500}>{label}</Text>
          <Text size="xl" fw={700} c={color} style={{ fontSize: "1.5rem", lineHeight: 1.2, marginTop: 4 }}>
            <NumberFormatter value={value} thousandSeparator />
          </Text>
        </Card>
      ))}
    </SimpleGrid>
  );
}

// ─── LC Form Modal ────────────────────────────────────────────────────────────

function LearningCenterFormModal({
  opened,
  editing,
  onClose,
  onSuccess,
}: {
  opened: boolean;
  editing: LearningCenterResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const form = useForm<LearningCenterRequest>({
    initialValues: editing
      ? {
          name:          editing.name,
          address:       editing.address       ?? "",
          phone:         editing.phone         ?? "",
          contactPerson: editing.contactPerson ?? "",
          email:         editing.email         ?? "",
          notes:         editing.notes         ?? "",
        }
      : { name: "", address: "", phone: "", contactPerson: "", email: "", notes: "" },
    validate: {
      name:  (v) => !v.trim() ? t("lc.validation.nameRequired") : null,
      email: (v) => v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? t("lc.validation.emailInvalid") : null,
    },
  });

  const handleClose = () => { form.reset(); onClose(); };

  const handleSubmit = async (values: LearningCenterRequest) => {
    setLoading(true);
    try {
      const req: LearningCenterRequest = {
        name:          values.name.trim(),
        address:       values.address?.trim()       || undefined,
        phone:         values.phone?.trim()         || undefined,
        contactPerson: values.contactPerson?.trim() || undefined,
        email:         values.email?.trim()         || undefined,
        notes:         values.notes?.trim()         || undefined,
      };
      if (editing) {
        await learningCenterService.update(editing.id, req);
        notifications.show({ title: t("lc.notifications.updateSuccess"), message: req.name, color: "green" });
      } else {
        await learningCenterService.create(req);
        notifications.show({ title: t("lc.notifications.createSuccess"), message: req.name, color: "green" });
      }
      onSuccess();
      handleClose();
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? t("common.serverError");
      notifications.show({ title: t("common.error"), message: msg, color: "red" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={<Text fw={700} size="lg">{editing ? t("lc.form.editTitle") : t("lc.form.createTitle")}</Text>}
      size="lg"
      radius="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <Alert icon={<IconInfoCircle size={14} />} color="blue" variant="light">
            {t("lc.form.info")}
          </Alert>

          <TextInput label={t("lc.form.name")} placeholder={t("lc.form.namePlaceholder")} required {...form.getInputProps("name")} />
          <TextInput label={t("lc.form.address")} placeholder={t("lc.form.optional")} {...form.getInputProps("address")} />

          <SimpleGrid cols={2} spacing="sm">
            <TextInput label={t("lc.form.phone")} placeholder={t("lc.form.optional")} {...form.getInputProps("phone")} />
            <TextInput label={t("lc.form.contactPerson")} placeholder={t("lc.form.optional")} {...form.getInputProps("contactPerson")} />
          </SimpleGrid>

          <TextInput label={t("lc.form.email")} placeholder={t("lc.form.optional")} type="email" {...form.getInputProps("email")} />
          <Textarea label={t("lc.form.notes")} placeholder={t("lc.form.optional")} rows={2} {...form.getInputProps("notes")} />

          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={handleClose}>{t("common.cancel")}</Button>
            <Button type="submit" loading={loading} leftSection={<IconBuilding size={16} />}>
              {editing ? t("common.save") : t("lc.form.createBtn")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

// ─── Computer Form Modal ──────────────────────────────────────────────────────

function ComputerFormModal({
  opened,
  editing,
  lcId,
  onClose,
  onSuccess,
}: {
  opened: boolean;
  editing: ComputerResponse | null;
  lcId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const form = useForm<ComputerRequest>({
    initialValues: editing
      ? {
          name:             editing.name,
          machineId:        editing.machineId,
          macAddress:       editing.macAddress  ?? "",
          deviceId:         editing.deviceId    ?? "",
          learningCenterId: editing.learningCenterId,
          notes:            editing.notes        ?? "",
        }
      : {
          name:             "",
          machineId:        "",
          macAddress:       "",
          deviceId:         "",
          learningCenterId: lcId,
          notes:            "",
        },
    validate: {
      name:             (v) => !v.trim() ? t("computer.validation.nameRequired") : null,
      machineId:        (v) =>
        !v.trim() ? t("computer.validation.machineIdRequired") :
        v.trim().length < 4 ? t("computer.validation.machineIdMin") : null,
      learningCenterId: (v) => !v ? t("computer.validation.learningCenterRequired") : null,
    },
  });

  const handleClose = () => { form.reset(); onClose(); };

  const handleSubmit = async (values: ComputerRequest) => {
    setLoading(true);
    try {
      const req: ComputerRequest = {
        name:             values.name.trim(),
        machineId:        values.machineId.trim(),
        macAddress:       values.macAddress?.trim()  || undefined,
        deviceId:         values.deviceId?.trim()    || undefined,
        learningCenterId: lcId,
        notes:            values.notes?.trim()       || undefined,
      };
      if (editing) {
        await computerService.update(editing.id, req);
        notifications.show({ title: t("computer.notifications.updateSuccess"), message: req.name, color: "green" });
      } else {
        await computerService.create(req);
        notifications.show({ title: t("computer.notifications.createSuccess"), message: req.name, color: "green" });
      }
      onSuccess();
      handleClose();
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? t("common.serverError");
      notifications.show({ title: t("common.error"), message: msg, color: "red" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={<Text fw={700} size="lg">{editing ? t("computer.form.editTitle") : t("computer.form.createTitle")}</Text>}
      size="md"
      radius="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput
            label={t("computer.form.name")}
            placeholder={t("computer.form.namePlaceholder")}
            required
            {...form.getInputProps("name")}
          />
          <TextInput
            label={t("computer.form.machineId")}
            placeholder={t("computer.form.machineIdPlaceholder")}
            required
            {...form.getInputProps("machineId")}
          />
          <SimpleGrid cols={2} spacing="sm">
            <TextInput
              label={t("computer.form.macAddress")}
              placeholder={t("computer.form.macAddressPlaceholder")}
              {...form.getInputProps("macAddress")}
            />
            <TextInput
              label={t("computer.form.deviceId")}
              placeholder={t("computer.form.deviceIdPlaceholder")}
              {...form.getInputProps("deviceId")}
            />
          </SimpleGrid>
          <Textarea
            label={t("computer.form.notes")}
            placeholder={t("computer.form.optional")}
            rows={2}
            {...form.getInputProps("notes")}
          />

          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={handleClose}>{t("common.cancel")}</Button>
            <Button type="submit" loading={loading} leftSection={<IconDeviceDesktop size={16} />}>
              {editing ? t("common.save") : t("computer.form.createBtn")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

// ─── Computers Modal (list + CRUD for one LC) ─────────────────────────────────

function ComputersModal({
  lc,
  onClose,
}: {
  lc: LearningCenterResponse | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { mutate } = useSWRConfig();

  const [compFormOpened, { open: openCompForm, close: closeCompForm }] = useDisclosure(false);
  const [editingComp, setEditingComp] = useState<ComputerResponse | null>(null);

  const filter = lc ? { lcId: lc.id, size: 50 } : {};
  const { page: data, isLoading, refresh } = useComputerList(filter);

  const computers = data?.content ?? [];

  const refreshComputers = () => {
    refresh();
    mutate("computers-all-active");
    mutate(lc ? ["computers-by-lc", lc.id] : null);
  };

  const handleAddComputer = () => {
    setEditingComp(null);
    openCompForm();
  };

  const handleEditComputer = (c: ComputerResponse) => {
    setEditingComp(c);
    openCompForm();
  };

  const handleToggleStatus = (c: ComputerResponse) => {
    const newStatus: ComputerStatus = c.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    modals.openConfirmModal({
      title: t("common.status"),
      children: (
        <Text size="sm">
          {c.status === "ACTIVE"
            ? t("computer.status.deactivateConfirm", { name: c.name })
            : t("computer.status.activateConfirm", { name: c.name })}
        </Text>
      ),
      labels: {
        confirm: c.status === "ACTIVE" ? t("computer.status.deactivateBtn") : t("computer.status.activateBtn"),
        cancel:  t("common.cancel"),
      },
      confirmProps: { color: c.status === "ACTIVE" ? "orange" : "green" },
      onConfirm: async () => {
        try {
          await computerService.setStatus(c.id, newStatus);
          refreshComputers();
          notifications.show({ title: t("computer.notifications.statusChanged"), message: c.name, color: c.status === "ACTIVE" ? "orange" : "green" });
        } catch {
          notifications.show({ title: t("common.error"), message: t("computer.notifications.statusError"), color: "red" });
        }
      },
    });
  };

  const handleDeleteComputer = (c: ComputerResponse) => {
    modals.openConfirmModal({
      title: t("computer.delete.title"),
      children: <Text size="sm">{t("computer.delete.confirm", { name: c.name })}</Text>,
      labels: { confirm: t("common.delete"), cancel: t("common.cancel") },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await computerService.deleteComputer(c.id);
          refreshComputers();
          notifications.show({ title: t("computer.notifications.deleteSuccess"), message: c.name, color: "green" });
        } catch (err) {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
            ?? t("computer.notifications.deleteError");
          notifications.show({ title: t("common.error"), message: msg, color: "red" });
        }
      },
    });
  };

  if (!lc) return null;

  return (
    <>
      <Modal
        opened={!!lc}
        onClose={onClose}
        title={
          <Group gap="xs">
            <IconDeviceDesktop size={18} />
            <Text fw={700} size="lg">{t("computer.title")} — {lc.name}</Text>
          </Group>
        }
        size="xl"
        radius="md"
      >
        <Stack gap="sm">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              {t("computer.table.total", { count: data?.totalElements ?? 0 })}
            </Text>
            <Button size="xs" leftSection={<IconPlus size={14} />} onClick={handleAddComputer}>
              {t("computer.addBtn")}
            </Button>
          </Group>

          <Divider />

          <ScrollArea>
            <Table striped highlightOnHover withColumnBorders fz="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t("computer.table.name")}</Table.Th>
                  <Table.Th>{t("computer.table.machineId")}</Table.Th>
                  <Table.Th>{t("computer.table.macAddress")}</Table.Th>
                  <Table.Th>{t("computer.table.codes")}</Table.Th>
                  <Table.Th>{t("computer.table.status")}</Table.Th>
                  <Table.Th>{t("computer.table.actions")}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Table.Tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <Table.Td key={j}><Skeleton height={18} radius="sm" /></Table.Td>
                      ))}
                    </Table.Tr>
                  ))
                ) : computers.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <Center py="lg">
                        <Stack align="center" gap="xs">
                          <IconDeviceDesktop size={28} style={{ opacity: 0.3 }} />
                          <Text c="dimmed" size="sm">{t("common.noData")}</Text>
                        </Stack>
                      </Center>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  computers.map((c) => (
                    <Table.Tr key={c.id}>
                      <Table.Td>
                        <Text size="sm" fw={500} truncate maw={160}>{c.name}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Code fz="xs">{c.machineId.slice(0, 16)}{c.machineId.length > 16 ? "…" : ""}</Code>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed">{c.macAddress ?? "—"}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4} wrap="nowrap">
                          <IconKey size={11} style={{ opacity: 0.4 }} />
                          <Text size="xs">{c.totalCodes ?? 0}</Text>
                          <Text size="xs" c="dimmed">/ {c.activeCodes ?? 0} faol</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={c.status === "ACTIVE" ? "green" : "gray"} variant="light" size="xs">
                          {c.status === "ACTIVE" ? t("common.active") : t("common.inactive")}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4} wrap="nowrap">
                          <Tooltip label={t("common.edit")}>
                            <ActionIcon size="sm" variant="subtle" color="blue" onClick={() => handleEditComputer(c)}>
                              <IconEdit size={13} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label={c.status === "ACTIVE" ? t("computer.status.deactivateBtn") : t("computer.status.activateBtn")}>
                            <ActionIcon
                              size="sm" variant="subtle"
                              color={c.status === "ACTIVE" ? "orange" : "green"}
                              onClick={() => handleToggleStatus(c)}
                            >
                              {c.status === "ACTIVE" ? <IconToggleLeft size={13} /> : <IconToggleRight size={13} />}
                            </ActionIcon>
                          </Tooltip>
                          {c.status === "INACTIVE" && (
                            <Tooltip label={t("common.delete")}>
                              <ActionIcon size="sm" variant="subtle" color="red" onClick={() => handleDeleteComputer(c)}>
                                <IconTrash size={13} />
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
        </Stack>
      </Modal>

      {lc && (
        <ComputerFormModal
          key={editingComp ? `comp-edit-${editingComp.id}` : "comp-new"}
          opened={compFormOpened}
          editing={editingComp}
          lcId={lc.id}
          onClose={() => { setEditingComp(null); closeCompForm(); }}
          onSuccess={() => { setEditingComp(null); refreshComputers(); closeCompForm(); }}
        />
      )}
    </>
  );
}

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
            <ActionIcon variant="light" onClick={refreshList}><IconRefresh size={16} /></ActionIcon>
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
                          <ActionIcon size="sm" variant="subtle" color="cyan" onClick={() => setSelectedLc(lc)}>
                            <IconDeviceDesktop size={14} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label={t("common.edit")}>
                          <ActionIcon size="sm" variant="subtle" color="blue" onClick={() => handleEdit(lc)}>
                            <IconEdit size={14} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label={lc.status === "ACTIVE" ? t("lc.status.deactivateBtn") : t("lc.status.activateBtn")}>
                          <ActionIcon
                            size="sm" variant="subtle"
                            color={lc.status === "ACTIVE" ? "orange" : "green"}
                            onClick={() => handleToggleStatus(lc)}
                          >
                            {lc.status === "ACTIVE" ? <IconToggleLeft size={14} /> : <IconToggleRight size={14} />}
                          </ActionIcon>
                        </Tooltip>

                        {lc.status === "INACTIVE" && (
                          <Tooltip label={t("common.delete")}>
                            <ActionIcon size="sm" variant="subtle" color="red" onClick={() => handleDelete(lc)}>
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
