import { useState } from "react";
import {
  Stack,
  Title,
  Card,
  Table,
  Group,
  TextInput,
  Select,
  Badge,
  ActionIcon,
  Button,
  Modal,
  Text,
  Pagination,
  Skeleton,
  Paper,
  Code,
} from "@mantine/core";
import {
  IconSearch,
  IconEye,
  IconRefresh,
  IconHistory,
  IconClock,
  IconDeviceDesktop,
} from "@tabler/icons-react";
import useSWR from "swr";
import { useDisclosure } from "@mantine/hooks";
import api from "../../services/api";

interface AuditLog {
  id: number;
  adminId?: number;
  adminUsername: string;
  action: string;
  entityName?: string;
  entityId?: string;
  details?: string;
  clientIp?: string;
  createdAt: string;
}

const actionColors: Record<string, string> = {
  CREATE: "green",
  UPDATE: "blue",
  DELETE: "red",
  STATUS_CHANGE: "yellow",
  RESET_PASSWORD: "orange",
  FORCE_LOGOUT: "grape",
  EXPORT: "cyan",
  IMPORT: "indigo",
};

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [action, setAction] = useState<string>("");
  const [searchAdmin, setSearchAdmin] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const [detailModalOpened, { open: openDetailModal, close: closeDetailModal }] = useDisclosure(false);

  const queryParams = new URLSearchParams({
    page: String(page - 1),
    size: String(pageSize),
  });
  if (action) queryParams.set("action", action);
  if (searchAdmin.trim()) queryParams.set("adminUsername", searchAdmin.trim());

  const { data, error, mutate, isValidating } = useSWR(
    `/api/v1/admin/audit-logs?${queryParams.toString()}`,
    () => api.get(`/api/v1/admin/audit-logs?${queryParams.toString()}`).then((res) => res.data?.data)
  );

  const logs: AuditLog[] = data?.content || [];
  const totalPages: number = data?.totalPages || 1;

  const handleOpenDetail = (log: AuditLog) => {
    setSelectedLog(log);
    openDetailModal();
  };

  return (
    <Stack gap="lg" p="md">
      <Group justify="space-between" align="center">
        <div>
          <Title order={2} fw={700}>Xavfsizlik va Admin Harakatlari Jurnali (Audit Logs)</Title>
          <Text c="dimmed" size="sm">Barcha ma'muriy amallar, kim, qachon, qaysi IP dan o'zgartirgani to'liq qayd etiladi</Text>
        </div>
        <Button leftSection={<IconRefresh size={16} />} variant="light" onClick={() => mutate()} loading={isValidating}>
          Yangilash
        </Button>
      </Group>

      <Card withBorder radius="md" p="md">
        <Stack gap="md">
          <Group>
            <TextInput
              placeholder="Admin foydalanuvchi nomi..."
              leftSection={<IconSearch size={16} />}
              value={searchAdmin}
              onChange={(e) => { setSearchAdmin(e.currentTarget.value); setPage(1); }}
              style={{ flex: 1 }}
            />
            <Select
              placeholder="Amal turi (Action)"
              clearable
              data={[
                { value: "CREATE", label: "CREATE (Yaratish)" },
                { value: "UPDATE", label: "UPDATE (Yangilash)" },
                { value: "DELETE", label: "DELETE (O'chirish)" },
                { value: "STATUS_CHANGE", label: "STATUS_CHANGE (Holat o'zgartirish)" },
                { value: "RESET_PASSWORD", label: "RESET_PASSWORD (Parol tiklash)" },
                { value: "FORCE_LOGOUT", label: "FORCE_LOGOUT (Majburiy chiqarish)" },
                { value: "EXPORT", label: "EXPORT (Eksport)" },
                { value: "IMPORT", label: "IMPORT (Import)" },
              ]}
              value={action}
              onChange={(val) => { setAction(val || ""); setPage(1); }}
              style={{ width: 260 }}
            />
          </Group>

          {isValidating && !data ? (
            <Stack gap="xs">
              <Skeleton height={45} />
              <Skeleton height={45} />
              <Skeleton height={45} />
            </Stack>
          ) : error ? (
            <Paper p="xl" withBorder style={{ textAlign: "center" }}>
              <Text c="red">Audit loglarini yuklab bo'lmadi</Text>
              <Button mt="sm" variant="subtle" onClick={() => mutate()}>Qayta urinish</Button>
            </Paper>
          ) : logs.length === 0 ? (
            <Paper p="xl" withBorder style={{ textAlign: "center" }}>
              <IconHistory size={48} color="gray" />
              <Text c="dimmed" mt="xs">Hozircha audit loglari yozilmagan</Text>
            </Paper>
          ) : (
            <Table striped highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>Admin</Table.Th>
                  <Table.Th>Amal</Table.Th>
                  <Table.Th>Modul / Entity</Table.Th>
                  <Table.Th>Entity ID</Table.Th>
                  <Table.Th>Mijoz IP</Table.Th>
                  <Table.Th>Sana & Vaqt</Table.Th>
                  <Table.Th style={{ textAlign: "right" }}>Tafsilotlar</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {logs.map((item) => (
                  <Table.Tr key={item.id}>
                    <Table.Td>#{item.id}</Table.Td>
                    <Table.Td fw={600}>
                      <Badge variant="light" color="indigo">{item.adminUsername || "system"}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={actionColors[item.action] || "gray"} variant="filled">
                        {item.action}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{item.entityName || "-"}</Table.Td>
                    <Table.Td>{item.entityId ? `#${item.entityId}` : "-"}</Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <IconDeviceDesktop size={14} color="gray" />
                        <Text size="xs" ff="monospace">{item.clientIp || "127.0.0.1"}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <IconClock size={14} color="gray" />
                        <Text size="xs" c="dimmed">
                          {item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td style={{ textAlign: "right" }}>
                      <ActionIcon variant="subtle" color="blue" onClick={() => handleOpenDetail(item)}>
                        <IconEye size={18} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}

          {totalPages > 1 && (
            <Group justify="center" mt="md">
              <Pagination total={totalPages} value={page} onChange={setPage} />
            </Group>
          )}
        </Stack>
      </Card>

      {/* Audit Log Tafsilotlari */}
      <Modal
        opened={detailModalOpened}
        onClose={closeDetailModal}
        title={<Text fw={700} size="lg">Harakat tafsilotlari #{selectedLog?.id}</Text>}
        size="md"
      >
        {selectedLog && (
          <Stack gap="md">
            <Group grow>
              <div>
                <Text size="xs" c="dimmed">Admin foydalanuvchi</Text>
                <Text fw={600}>{selectedLog.adminUsername}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Amal turi</Text>
                <Badge color={actionColors[selectedLog.action] || "gray"}>{selectedLog.action}</Badge>
              </div>
            </Group>

            <Group grow>
              <div>
                <Text size="xs" c="dimmed">Modul / Ob'ekt</Text>
                <Text fw={500}>{selectedLog.entityName || "-"} (ID: {selectedLog.entityId || "-"})</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">IP manzil</Text>
                <Text ff="monospace">{selectedLog.clientIp || "127.0.0.1"}</Text>
              </div>
            </Group>

            <div>
              <Text size="xs" c="dimmed" mb="xs">Amal tafsilotlari / Parametrlar</Text>
              <Paper withBorder p="sm" bg="gray.0">
                <Code block style={{ whiteSpace: "pre-wrap" }}>
                  {selectedLog.details || "Tafsilotlar yozilmagan"}
                </Code>
              </Paper>
            </div>

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={closeDetailModal}>Yopish</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
