import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Stack, Title, Group, Badge, Button, Text, ThemeIcon,
  TextInput, Select, Table, ScrollArea, Skeleton, Pagination,
  Card, SimpleGrid, ActionIcon, Tooltip, CopyButton, Modal,
  Textarea, Divider, Alert, Code, Center,
  Paper, Box,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconKey, IconPlus, IconRefresh, IconSearch, IconCopy,
  IconCheck, IconBan, IconTrash, IconInfoCircle, IconAlertTriangle,
  IconEye,
} from "@tabler/icons-react";
import { useLicenseStats, useLicenseList } from "../../features/license/hooks/useLicense";
import { useLicenseMutations } from "../../features/license/hooks/useLicenseMutations";
import type {
  ActivationCodeResponse,
  ActivationCodeGroup,
  ActivationCodeRequest,
} from "../../features/license/types";
import { useSWRConfig } from "swr";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupColor(group: ActivationCodeGroup): string {
  switch (group) {
    case "ACTIVE":      return "green";
    case "EXPIRING":    return "orange";
    case "EXPIRED":     return "red";
    case "DEACTIVATED": return "gray";
    default:            return "blue";
  }
}

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString();
}

function fmtDateTime(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

// ─── Stats Cards ──────────────────────────────────────────────────────────────

function StatsCards() {
  const { t } = useTranslation();
  const { stats, isLoading } = useLicenseStats();

  const cards = [
    { key: "total",       color: "blue",   label: t("license.stats.total") },
    { key: "active",      color: "green",  label: t("license.stats.active") },
    { key: "expiring",    color: "orange", label: t("license.stats.expiring") },
    { key: "expired",     color: "red",    label: t("license.stats.expired") },
    { key: "deactivated", color: "gray",   label: t("license.stats.deactivated") },
  ] as const;

  return (
    <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} spacing="sm">
      {cards.map(({ key, color, label }) => (
        <Card key={key} withBorder radius="md" p="md">
          {isLoading ? (
            <Skeleton height={40} />
          ) : (
            <>
              <Text size="xs" c="dimmed" fw={500}>{label}</Text>
              <Text
                size="xl"
                fw={700}
                c={color}
                style={{ fontSize: "1.6rem", lineHeight: 1.2, marginTop: 4 }}
              >
                {stats?.[key] ?? 0}
              </Text>
            </>
          )}
        </Card>
      ))}
    </SimpleGrid>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({
  code,
  onClose,
}: {
  code: ActivationCodeResponse | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  if (!code) return null;

  return (
    <Modal
      opened={!!code}
      onClose={onClose}
      title={<Text fw={700} size="lg">{t("license.detail.title")}</Text>}
      size="lg"
      radius="md"
    >
      <Stack gap="sm">
        <Group justify="space-between">
          <Badge color={groupColor(code.displayGroup)} variant="filled" size="lg">
            {t(`license.group.${code.displayGroup.toLowerCase()}`)}
          </Badge>
          {code.daysUntilExpiry !== undefined && code.daysUntilExpiry >= 0 && (
            <Text size="sm" c="dimmed">
              {t("license.detail.daysLeft", { count: code.daysUntilExpiry })}
            </Text>
          )}
        </Group>

        <Divider />

        <SimpleGrid cols={2} spacing="xs">
          <Box>
            <Text size="xs" c="dimmed">{t("license.table.client")}</Text>
            <Text size="sm" fw={500}>{code.clientFullName}</Text>
          </Box>
          {code.clientPhone && (
            <Box>
              <Text size="xs" c="dimmed">{t("license.table.phone")}</Text>
              <Text size="sm">{code.clientPhone}</Text>
            </Box>
          )}
          {code.learningCenter && (
            <Box>
              <Text size="xs" c="dimmed">{t("license.table.learningCenter")}</Text>
              <Text size="sm">{code.learningCenter}</Text>
            </Box>
          )}
          <Box>
            <Text size="xs" c="dimmed">{t("license.table.machineId")}</Text>
            <Code fz="xs">{code.machineId}</Code>
          </Box>
          <Box>
            <Text size="xs" c="dimmed">{t("license.table.startDate")}</Text>
            <Text size="sm">{fmtDate(code.startDate)}</Text>
          </Box>
          <Box>
            <Text size="xs" c="dimmed">{t("license.table.endDate")}</Text>
            <Text size="sm">{fmtDate(code.endDate)}</Text>
          </Box>
          <Box>
            <Text size="xs" c="dimmed">{t("license.table.generatedBy")}</Text>
            <Text size="sm">{code.generatedBy ?? "—"}</Text>
          </Box>
          <Box>
            <Text size="xs" c="dimmed">{t("license.table.createdAt")}</Text>
            <Text size="sm">{fmtDateTime(code.createdAt)}</Text>
          </Box>
        </SimpleGrid>

        {code.notes && (
          <>
            <Divider />
            <Box>
              <Text size="xs" c="dimmed" mb={4}>{t("license.table.notes")}</Text>
              <Text size="sm">{code.notes}</Text>
            </Box>
          </>
        )}

        <Divider />
        <Box>
          <Group justify="space-between" mb={4}>
            <Text size="xs" c="dimmed">{t("license.detail.licenseKey")}</Text>
            <CopyButton value={code.licenseKey} timeout={2000}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? t("license.detail.copied") : t("license.detail.copy")}>
                  <ActionIcon size="xs" variant="subtle" color={copied ? "green" : "gray"} onClick={copy}>
                    {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
          <Code
            block
            fz="xs"
            style={{
              wordBreak: "break-all",
              maxHeight: 120,
              overflow: "auto",
              userSelect: "all",
            }}
          >
            {code.licenseKey}
          </Code>
        </Box>
      </Stack>
    </Modal>
  );
}

// ─── Generate Modal ───────────────────────────────────────────────────────────

function GenerateModal({
  opened,
  onClose,
  onSuccess,
}: {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const { generate, handleError } = useLicenseMutations();
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<ActivationCodeResponse | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const oneYear = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split("T")[0];

  const form = useForm<ActivationCodeRequest>({
    initialValues: {
      machineId: "",
      startDate: today,
      endDate: oneYear,
      clientFirstName: "",
      clientLastName: "",
      clientPhone: "",
      learningCenter: "",
      notes: "",
    },
    validate: {
      machineId: (v) =>
        !v.trim() ? t("license.validation.machineIdRequired") :
        v.trim().length < 4 ? t("license.validation.machineIdMin") : null,
      startDate: (v) => !v ? t("license.validation.startDateRequired") : null,
      endDate: (v, vals) =>
        !v ? t("license.validation.endDateRequired") :
        v < vals.startDate ? t("license.validation.endBeforeStart") : null,
      clientPhone: (v) => {
        if (!v) return null;
        return /^[+]?[0-9\s\-(]{7,20}$/.test(v) ? null : t("license.validation.phoneFormat");
      },
    },
  });

  const handleSubmit = async (values: ActivationCodeRequest) => {
    setLoading(true);
    try {
      const req: ActivationCodeRequest = {
        ...values,
        clientFirstName: values.clientFirstName?.trim() || undefined,
        clientLastName:  values.clientLastName?.trim()  || undefined,
        clientPhone:     values.clientPhone?.trim()     || undefined,
        learningCenter:  values.learningCenter?.trim()  || undefined,
        notes:           values.notes?.trim()           || undefined,
      };
      const result = await generate(req);
      setGeneratedCode(result);
      onSuccess();
      notifications.show({
        title: t("license.notifications.generateSuccess"),
        message: t("license.notifications.generateSuccessMsg"),
        color: "green",
      });
    } catch (e) {
      handleError(e, t("license.notifications.generateError"));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setGeneratedCode(null);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={<Text fw={700} size="lg">{t("license.generate.title")}</Text>}
      size="lg"
      radius="md"
    >
      {generatedCode ? (
        <Stack gap="md">
          <Alert icon={<IconCheck size={16} />} color="green" title={t("license.generate.successTitle")}>
            {t("license.generate.successMsg")}
          </Alert>

          <SimpleGrid cols={2} spacing="xs">
            <Box>
              <Text size="xs" c="dimmed">{t("license.table.client")}</Text>
              <Text size="sm" fw={500}>{generatedCode.clientFullName}</Text>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">{t("license.table.machineId")}</Text>
              <Code fz="xs">{generatedCode.machineId}</Code>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">{t("license.table.startDate")}</Text>
              <Text size="sm">{fmtDate(generatedCode.startDate)}</Text>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">{t("license.table.endDate")}</Text>
              <Text size="sm">{fmtDate(generatedCode.endDate)}</Text>
            </Box>
          </SimpleGrid>

          <Box>
            <Group justify="space-between" mb={6}>
              <Text size="sm" fw={600}>{t("license.detail.licenseKey")}</Text>
              <CopyButton value={generatedCode.licenseKey} timeout={2000}>
                {({ copied, copy }) => (
                  <Button
                    size="xs"
                    variant="light"
                    color={copied ? "green" : "blue"}
                    leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                    onClick={copy}
                  >
                    {copied ? t("license.detail.copied") : t("license.detail.copy")}
                  </Button>
                )}
              </CopyButton>
            </Group>
            <Code
              block
              fz="xs"
              style={{
                wordBreak: "break-all",
                userSelect: "all",
                maxHeight: 140,
                overflow: "auto",
              }}
            >
              {generatedCode.licenseKey}
            </Code>
          </Box>

          <Button fullWidth onClick={handleClose}>{t("common.close")}</Button>
        </Stack>
      ) : (
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <Alert icon={<IconInfoCircle size={14} />} color="blue" variant="light">
              {t("license.generate.info")}
            </Alert>

            <TextInput
              label={t("license.generate.machineId")}
              placeholder={t("license.generate.machineIdPlaceholder")}
              required
              {...form.getInputProps("machineId")}
            />

            <SimpleGrid cols={2} spacing="sm">
              <TextInput
                type="date"
                label={t("license.generate.startDate")}
                required
                {...form.getInputProps("startDate")}
              />
              <TextInput
                type="date"
                label={t("license.generate.endDate")}
                required
                {...form.getInputProps("endDate")}
              />
            </SimpleGrid>

            <Divider label={t("license.generate.clientInfo")} labelPosition="left" />

            <SimpleGrid cols={2} spacing="sm">
              <TextInput
                label={t("license.generate.firstName")}
                placeholder={t("license.generate.optional")}
                {...form.getInputProps("clientFirstName")}
              />
              <TextInput
                label={t("license.generate.lastName")}
                placeholder={t("license.generate.optional")}
                {...form.getInputProps("clientLastName")}
              />
            </SimpleGrid>

            <TextInput
              label={t("license.generate.phone")}
              placeholder={t("license.generate.optional")}
              {...form.getInputProps("clientPhone")}
            />

            <TextInput
              label={t("license.generate.learningCenter")}
              placeholder={t("license.generate.optional")}
              {...form.getInputProps("learningCenter")}
            />

            <Textarea
              label={t("license.generate.notes")}
              placeholder={t("license.generate.optional")}
              rows={2}
              {...form.getInputProps("notes")}
            />

            <Group justify="flex-end" mt="xs">
              <Button variant="default" onClick={handleClose}>{t("common.cancel")}</Button>
              <Button
                type="submit"
                loading={loading}
                leftSection={<IconKey size={16} />}
              >
                {t("license.generate.submit")}
              </Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  );
}

// ─── Deactivate Modal ─────────────────────────────────────────────────────────

function DeactivateModal({
  code,
  onClose,
  onSuccess,
}: {
  code: ActivationCodeResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const { deactivate, handleError } = useLicenseMutations();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");

  if (!code) return null;

  const handleDeactivate = async () => {
    setLoading(true);
    try {
      await deactivate(code.id, notes.trim() || undefined);
      onSuccess();
      notifications.show({
        title: t("license.notifications.deactivateSuccess"),
        message: t("license.notifications.deactivateSuccessMsg"),
        color: "orange",
      });
      onClose();
    } catch (e) {
      handleError(e, t("license.notifications.deactivateError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={!!code}
      onClose={onClose}
      title={<Text fw={700} size="lg" c="orange">{t("license.deactivate.title")}</Text>}
      size="md"
      radius="md"
    >
      <Stack gap="md">
        <Alert icon={<IconAlertTriangle size={16} />} color="orange">
          {t("license.deactivate.confirm", { client: code.clientFullName })}
        </Alert>

        <Box>
          <Text size="xs" c="dimmed">{t("license.table.machineId")}</Text>
          <Code fz="xs">{code.machineId}</Code>
        </Box>

        <Textarea
          label={t("license.deactivate.notesLabel")}
          placeholder={t("license.deactivate.notesPlaceholder")}
          value={notes}
          onChange={(e) => setNotes(e.currentTarget.value)}
          rows={3}
        />

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>{t("common.cancel")}</Button>
          <Button color="orange" loading={loading} onClick={handleDeactivate} leftSection={<IconBan size={16} />}>
            {t("license.deactivate.submit")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

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
  const [search, setSearch]   = useState("");
  const [group, setGroup]     = useState<string | null>(null);
  const [page, setPage]       = useState(0);
  const PAGE_SIZE = 15;

  const filter = {
    page,
    size: PAGE_SIZE,
    search: search || undefined,
    group: (group as ActivationCodeGroup) || undefined,
  };

  const { page: data, isLoading } = useLicenseList(filter);
  const { refresh: refreshStats } = useLicenseStats();

  // Modals
  const [generateOpened, { open: openGenerate, close: closeGenerate }] = useDisclosure(false);
  const [detailCode, setDetailCode] = useState<ActivationCodeResponse | null>(null);
  const [deactivateCode, setDeactivateCode] = useState<ActivationCodeResponse | null>(null);

  const { deleteCode, handleError } = useLicenseMutations();

  const handleRefreshAll = () => {
    mutate("license-stats");
    mutate(["license-list", JSON.stringify(filter)]);
  };

  const handleMutationSuccess = () => {
    handleRefreshAll();
    refreshStats();
  };

  const handleDelete = (code: ActivationCodeResponse) => {
    modals.openConfirmModal({
      title: t("license.delete.title"),
      children: (
        <Text size="sm">
          {t("license.delete.confirm", { client: code.clientFullName })}
        </Text>
      ),
      labels: { confirm: t("license.delete.submit"), cancel: t("common.cancel") },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await deleteCode(code.id);
          handleRefreshAll();
          notifications.show({
            title: t("license.notifications.deleteSuccess"),
            message: t("license.notifications.deleteSuccessMsg"),
            color: "green",
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

  const codes = data?.content ?? [];
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
            <ActionIcon variant="light" onClick={handleRefreshAll}>
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
      </Group>

      {/* Table */}
      <Paper withBorder radius="md">
        <ScrollArea>
          <Table striped highlightOnHover withColumnBorders fz="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>#</Table.Th>
                <Table.Th>{t("license.table.client")}</Table.Th>
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
                  <Table.Td colSpan={8}>
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
                    <Table.Td>
                      <Text size="sm" fw={500} truncate maw={160}>
                        {code.clientFullName}
                      </Text>
                      {code.clientPhone && (
                        <Text size="xs" c="dimmed">{code.clientPhone}</Text>
                      )}
                    </Table.Td>
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
                          <Text size="xs" c="dimmed">
                            {code.daysUntilExpiry}d
                          </Text>
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
                            size="sm"
                            variant="subtle"
                            color="blue"
                            onClick={() => setDetailCode(code)}
                          >
                            <IconEye size={14} />
                          </ActionIcon>
                        </Tooltip>

                        {/* Copy token */}
                        <CopyButton value={code.licenseKey} timeout={2000}>
                          {({ copied, copy }) => (
                            <Tooltip label={copied ? t("license.detail.copied") : t("license.detail.copy")}>
                              <ActionIcon
                                size="sm"
                                variant="subtle"
                                color={copied ? "green" : "gray"}
                                onClick={copy}
                              >
                                {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </CopyButton>

                        {/* Deactivate */}
                        {(code.displayGroup === "ACTIVE" || code.displayGroup === "EXPIRING") && (
                          <Tooltip label={t("license.deactivate.btn")}>
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="orange"
                              onClick={() => setDeactivateCode(code)}
                            >
                              <IconBan size={14} />
                            </ActionIcon>
                          </Tooltip>
                        )}

                        {/* Delete */}
                        {(code.displayGroup === "EXPIRED" || code.displayGroup === "DEACTIVATED") && (
                          <Tooltip label={t("common.delete")}>
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="red"
                              onClick={() => handleDelete(code)}
                            >
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
