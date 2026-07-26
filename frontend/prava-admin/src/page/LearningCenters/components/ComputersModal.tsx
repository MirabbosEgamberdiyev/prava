import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal, Text, Stack, Group, Button, Divider, ScrollArea, Table, Skeleton,
  Center, Code, Badge, Tooltip, ActionIcon, Pagination,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useSWRConfig } from "swr";
import {
  IconDeviceDesktop, IconPlus, IconKey, IconEdit, IconToggleLeft,
  IconToggleRight, IconTrash, IconAlertTriangle,
} from "@tabler/icons-react";
import { useComputerList } from "../../../features/computer/hooks/useComputers";
import computerService from "../../../services/computerService";
import type { LearningCenterResponse } from "../../../features/learningCenter/types";
import type { ComputerResponse, ComputerStatus } from "../../../features/computer/types";
import { ComputerFormModal } from "./ComputerFormModal";

export function ComputersModal({
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
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  /**
   * Ilgari `lc` bo'lmaganda ham filtrsiz so'rov ketardi (butun tizimdagi
   * kompyuterlar) — modal yopiq turganida ham har 30 soniyada. Endi markaz
   * tanlanmagan bo'lsa so'rov umuman yuborilmaydi.
   *
   * Bundan tashqari `size: 50` qattiq belgilangan va sahifalash yo'q edi:
   * 50 dan ortiq kompyuteri bor markazda qolganlari ko'rinmasdi, garchi
   * yuqorida "Jami: N" to'g'ri raqamni yozib tursa ham.
   */
  const { page: data, isLoading, isError, refresh } = useComputerList(
    lc ? { lcId: lc.id, page, size: PAGE_SIZE } : null,
  );

  const computers  = data?.content    ?? [];
  const totalPages = data?.totalPages ?? 0;

  // Markaz almashsa sahifani boshidan boshlaymiz
  useEffect(() => { setPage(0); }, [lc?.id]);

  // Oxirgi sahifadagi kompyuterlar o'chirilsa diapazondan chiqib ketmasin
  useEffect(() => {
    if (totalPages > 0 && page > totalPages - 1) setPage(totalPages - 1);
  }, [totalPages, page]);

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
                ) : isError ? (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <Center py="lg">
                        <Stack align="center" gap="xs">
                          <IconAlertTriangle size={28} color="var(--mantine-color-red-6)" />
                          <Text c="red" size="sm">{t("common.errorLoading")}</Text>
                          <Button size="xs" variant="light" onClick={() => refresh()}>
                            {t("common.refresh")}
                          </Button>
                        </Stack>
                      </Center>
                    </Table.Td>
                  </Table.Tr>
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
                          <Text size="xs" c="dimmed">
                            / {c.activeCodes ?? 0} {t("lc.table.activeShort")}
                          </Text>
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
                            <ActionIcon size="sm" variant="subtle" color="blue" onClick={() => handleEditComputer(c)} aria-label={t("common.edit")}>
                              <IconEdit size={13} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label={c.status === "ACTIVE" ? t("computer.status.deactivateBtn") : t("computer.status.activateBtn")}>
                            <ActionIcon
                              size="sm" variant="subtle"
                              color={c.status === "ACTIVE" ? "orange" : "green"}
                              onClick={() => handleToggleStatus(c)}
                             aria-label={c.status === "ACTIVE" ? t("computer.status.deactivateBtn") : t("computer.status.activateBtn")}>
                              {c.status === "ACTIVE" ? <IconToggleLeft size={13} /> : <IconToggleRight size={13} />}
                            </ActionIcon>
                          </Tooltip>
                          {c.status === "INACTIVE" && (
                            <Tooltip label={t("common.delete")}>
                              <ActionIcon size="sm" variant="subtle" color="red" onClick={() => handleDeleteComputer(c)} aria-label={t("common.delete")}>
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

          {totalPages > 1 && (
            <Group justify="center">
              <Pagination
                value={page + 1}
                onChange={(p) => setPage(p - 1)}
                total={totalPages}
                size="sm"
              />
            </Group>
          )}
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
