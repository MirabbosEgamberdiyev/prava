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
  Textarea,
  Tabs,
  Paper,
} from "@mantine/core";
import {
  IconSearch,
  IconEye,
  IconTrash,
  IconRefresh,
  IconClock,
  IconDeviceFloppy,
  IconHeartHandshake,
} from "@tabler/icons-react";
import useSWR from "swr";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import api from "../../services/api";

interface PartnerLead {
  id: number;
  companyName: string;
  contactPerson: string;
  phone: string;
  email?: string;
  region?: string;
  computerCount?: string;
  comment?: string;
  status: "NEW" | "CONTACTED" | "NEGOTIATION" | "CONVERTED" | "REJECTED";
  adminNote?: string;
  sourceIp?: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  NEW: "blue",
  CONTACTED: "cyan",
  NEGOTIATION: "yellow",
  CONVERTED: "green",
  REJECTED: "red",
};

const statusLabels: Record<string, string> = {
  NEW: "Yangi (NEW)",
  CONTACTED: "Bog'lanildi",
  NEGOTIATION: "Muzokarada",
  CONVERTED: "Muvaffaqiyatli (Mijoz)",
  REJECTED: "Rad etildi",
};

export default function PartnersPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<PartnerLead | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [adminNote, setAdminNote] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const queryParams = new URLSearchParams({
    page: String(page - 1),
    size: String(pageSize),
  });
  if (activeTab !== "ALL") queryParams.set("status", activeTab);
  if (search.trim()) queryParams.set("search", search.trim());

  const { data, error, mutate, isValidating } = useSWR(
    `/api/v1/admin/partner-leads?${queryParams.toString()}`,
    () => api.get(`/api/v1/admin/partner-leads?${queryParams.toString()}`).then((res) => res.data?.data)
  );

  const leads: PartnerLead[] = data?.content || [];
  const totalPages: number = data?.totalPages || 1;

  const handleOpenDetail = (lead: PartnerLead) => {
    setSelectedLead(lead);
    setNewStatus(lead.status);
    setAdminNote(lead.adminNote || "");
    openModal();
  };

  const handleSaveStatus = async () => {
    if (!selectedLead) return;
    setSaving(true);
    try {
      await api.patch(`/api/v1/admin/partner-leads/${selectedLead.id}/status`, {
        status: newStatus,
        adminNote: adminNote.trim(),
      });
      notifications.show({
        title: "Muvaffaqiyatli",
        message: "Hamkorlik statusi yangilandi",
        color: "green",
      });
      closeModal();
      mutate();
    } catch (e: any) {
      notifications.show({
        title: "Xatolik",
        message: e?.response?.data?.message || "Statusni yangilab bo'lmadi",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/api/v1/admin/partner-leads/${deletingId}`);
      notifications.show({
        title: "O'chirildi",
        message: "Arizani o'chirildi",
        color: "green",
      });
      closeDeleteModal();
      mutate();
    } catch (e: any) {
      notifications.show({
        title: "Xatolik",
        message: e?.response?.data?.message || "O'chirib bo'lmadi",
        color: "red",
      });
    }
  };

  return (
    <Stack gap="lg" p="md">
      <Group justify="space-between" align="center">
        <div>
          <Title order={2} fw={700}>Hamkorlik Arizalari (B2B Leads)</Title>
          <Text c="dimmed" size="sm">
            Avtomaktablar va korporativ mijozlardan kelgan litsenziya so'rovlari
          </Text>
        </div>
        <Button
          leftSection={<IconRefresh size={16} />}
          variant="light"
          onClick={() => mutate()}
          loading={isValidating}
        >
          Yangilash
        </Button>
      </Group>

      <Card withBorder radius="md" p="md">
        <Stack gap="md">
          <Tabs value={activeTab} onChange={(val) => { setActiveTab(val || "ALL"); setPage(1); }}>
            <Tabs.List>
              <Tabs.Tab value="ALL">Barchasi</Tabs.Tab>
              <Tabs.Tab value="NEW" color="blue">Yangi</Tabs.Tab>
              <Tabs.Tab value="CONTACTED" color="cyan">Bog'lanildi</Tabs.Tab>
              <Tabs.Tab value="NEGOTIATION" color="yellow">Muzokarada</Tabs.Tab>
              <Tabs.Tab value="CONVERTED" color="green">Muvaffaqiyatli</Tabs.Tab>
              <Tabs.Tab value="REJECTED" color="red">Rad etildi</Tabs.Tab>
            </Tabs.List>
          </Tabs>

          <Group justify="space-between">
            <TextInput
              placeholder="Tashkilot, mas'ul shaxs, telefon bo'yicha qidirish..."
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => { setSearch(e.currentTarget.value); setPage(1); }}
              style={{ flex: 1 }}
            />
          </Group>

          {isValidating && !data ? (
            <Stack gap="xs">
              <Skeleton height={40} />
              <Skeleton height={40} />
              <Skeleton height={40} />
            </Stack>
          ) : error ? (
            <Paper p="xl" withBorder style={{ textAlign: "center" }}>
              <Text c="red" fw={500}>Ma'lumotlarni yuklab bo'lmadi</Text>
              <Button mt="sm" variant="subtle" onClick={() => mutate()}>Qayta urinish</Button>
            </Paper>
          ) : leads.length === 0 ? (
            <Paper p="xl" withBorder style={{ textAlign: "center" }}>
              <IconHeartHandshake size={48} color="var(--mantine-color-gray-5)" />
              <Text c="dimmed" mt="xs">Hech qanday hamkorlik arizasi mavjud emas</Text>
            </Paper>
          ) : (
            <Table striped highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>Avtomaktab / Tashkilot</Table.Th>
                  <Table.Th>Mas'ul shaxs</Table.Th>
                  <Table.Th>Telefon</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Kompyuterlar</Table.Th>
                  <Table.Th>Hudud</Table.Th>
                  <Table.Th>Holat</Table.Th>
                  <Table.Th>Sana</Table.Th>
                  <Table.Th style={{ textAlign: "right" }}>Amallar</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {leads.map((lead) => (
                  <Table.Tr key={lead.id}>
                    <Table.Td>#{lead.id}</Table.Td>
                    <Table.Td fw={600}>{lead.companyName}</Table.Td>
                    <Table.Td>{lead.contactPerson}</Table.Td>
                    <Table.Td>
                      <Text size="sm" c="blue" component="a" href={`tel:${lead.phone}`}>
                        {lead.phone}
                      </Text>
                    </Table.Td>
                    <Table.Td>{lead.email || "-"}</Table.Td>
                    <Table.Td>{lead.computerCount ? `${lead.computerCount} ta` : "-"}</Table.Td>
                    <Table.Td>{lead.region || "-"}</Table.Td>
                    <Table.Td>
                      <Badge color={statusColors[lead.status] || "gray"} variant="filled">
                        {statusLabels[lead.status] || lead.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <IconClock size={14} color="gray" />
                        <Text size="xs" c="dimmed">
                          {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "-"}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td style={{ textAlign: "right" }}>
                      <Group gap={6} justify="flex-end">
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          title="Batafsil / Status o'zgartirish"
                          onClick={() => handleOpenDetail(lead)}
                        >
                          <IconEye size={18} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          title="O'chirish"
                          onClick={() => { setDeletingId(lead.id); openDeleteModal(); }}
                        >
                          <IconTrash size={18} />
                        </ActionIcon>
                      </Group>
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

      {/* Lead Status & Notes Modal */}
      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title={<Text fw={700} size="lg">Hamkorlik so'rovi #{selectedLead?.id} — {selectedLead?.companyName}</Text>}
        size="lg"
      >
        {selectedLead && (
          <Stack gap="md">
            <Group grow>
              <div>
                <Text size="xs" c="dimmed">Tashkilot nomi</Text>
                <Text fw={600}>{selectedLead.companyName}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Mas'ul shaxs</Text>
                <Text fw={600}>{selectedLead.contactPerson}</Text>
              </div>
            </Group>

            <Group grow>
              <div>
                <Text size="xs" c="dimmed">Telefon</Text>
                <Text fw={600} c="blue">{selectedLead.phone}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Email</Text>
                <Text fw={500}>{selectedLead.email || "-"}</Text>
              </div>
            </Group>

            <Group grow>
              <div>
                <Text size="xs" c="dimmed">Hudud</Text>
                <Text>{selectedLead.region || "-"}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Kompyuterlar soni</Text>
                <Text>{selectedLead.computerCount || "-"}</Text>
              </div>
            </Group>

            <div>
              <Text size="xs" c="dimmed">Mijozning arizadagi izohi</Text>
              <Paper withBorder p="xs" bg="gray.0">
                <Text size="sm">{selectedLead.comment || "Izoh ko'rsatilmagan"}</Text>
              </Paper>
            </div>

            <Select
              label="Hamkorlik bosqichi (Lead Status)"
              data={[
                { value: "NEW", label: "Yangi (NEW)" },
                { value: "CONTACTED", label: "Bog'lanildi (CONTACTED)" },
                { value: "NEGOTIATION", label: "Muzokarada (NEGOTIATION)" },
                { value: "CONVERTED", label: "Muvaffaqiyatli Mijoz (CONVERTED)" },
                { value: "REJECTED", label: "Rad etildi (REJECTED)" },
              ]}
              value={newStatus}
              onChange={(val) => setNewStatus(val || "NEW")}
            />

            <Textarea
              label="Admin izohi (Ichki yozuvlar)"
              placeholder="Masalan: Direktor bilan gaplashildi, 15 ta kompyuter uchun demo versiya o'rnatildi..."
              rows={3}
              value={adminNote}
              onChange={(e) => setAdminNote(e.currentTarget.value)}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={closeModal}>Yopish</Button>
              <Button
                leftSection={<IconDeviceFloppy size={16} />}
                color="blue"
                onClick={handleSaveStatus}
                loading={saving}
              >
                Saqlash
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* O'chirish modali */}
      <Modal opened={deleteModalOpened} onClose={closeDeleteModal} title="Arizani o'chirish">
        <Text size="sm">Haqiqatan ham bu hamkorlik arizasini o'chirib tashlamoqchimisiz?</Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={closeDeleteModal}>Bekor qilish</Button>
          <Button color="red" onClick={handleDelete}>O'chirish</Button>
        </Group>
      </Modal>
    </Stack>
  );
}
