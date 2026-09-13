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
  IconMail,
  IconClock,
  IconDeviceFloppy,
} from "@tabler/icons-react";
import useSWR from "swr";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import api from "../../services/api";

interface ContactInquiry {
  id: number;
  ticketId: string;
  organization: string;
  fullName: string;
  phone: string;
  telegram?: string;
  region?: string;
  organizationType?: string;
  computerCount?: string;
  comment?: string;
  status: "NEW" | "IN_PROGRESS" | "ANSWERED" | "CLOSED";
  adminNote?: string;
  clientIp?: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  NEW: "blue",
  IN_PROGRESS: "yellow",
  ANSWERED: "green",
  CLOSED: "gray",
};

const statusLabels: Record<string, string> = {
  NEW: "Yangi",
  IN_PROGRESS: "Jarayonda",
  ANSWERED: "Javob berildi",
  CLOSED: "Yopildi",
};

export default function ContactInquiriesPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);
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
    `/api/v1/admin/contact-inquiries?${queryParams.toString()}`,
    () => api.get(`/api/v1/admin/contact-inquiries?${queryParams.toString()}`).then((res) => res.data?.data)
  );

  const inquiries: ContactInquiry[] = data?.content || [];
  const totalPages: number = data?.totalPages || 1;

  const handleOpenDetail = (inquiry: ContactInquiry) => {
    setSelectedInquiry(inquiry);
    setNewStatus(inquiry.status);
    setAdminNote(inquiry.adminNote || "");
    openModal();
  };

  const handleSaveStatus = async () => {
    if (!selectedInquiry) return;
    setSaving(true);
    try {
      await api.patch(`/api/v1/admin/contact-inquiries/${selectedInquiry.id}/status`, {
        status: newStatus,
        adminNote: adminNote.trim(),
      });
      notifications.show({
        title: "Muvaffaqiyatli",
        message: "Murojaat holati yangilandi",
        color: "green",
      });
      closeModal();
      mutate();
    } catch (e: any) {
      notifications.show({
        title: "Xatolik",
        message: e?.response?.data?.message || "Holatni yangilab bo'lmadi",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/api/v1/admin/contact-inquiries/${deletingId}`);
      notifications.show({
        title: "O'chirildi",
        message: "Murojaat o'chirildi",
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
          <Title order={2} fw={700}>Murojaatlar Boshqaruvi (CRM)</Title>
          <Text c="dimmed" size="sm">
            Saytning /contact va boshqa kanallardan kelgan so'rovlar jurnali
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
              <Tabs.Tab value="IN_PROGRESS" color="yellow">Jarayonda</Tabs.Tab>
              <Tabs.Tab value="ANSWERED" color="green">Javob berildi</Tabs.Tab>
              <Tabs.Tab value="CLOSED" color="gray">Yopildi</Tabs.Tab>
            </Tabs.List>
          </Tabs>

          <Group justify="space-between">
            <TextInput
              placeholder="Tashkilot, ism, telefon yoki Ticket ID bo'yicha qidirish..."
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
          ) : inquiries.length === 0 ? (
            <Paper p="xl" withBorder style={{ textAlign: "center" }}>
              <IconMail size={48} color="var(--mantine-color-gray-5)" />
              <Text c="dimmed" mt="xs">Hech qanday murojaat topilmadi</Text>
            </Paper>
          ) : (
            <Table striped highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Ticket ID</Table.Th>
                  <Table.Th>Tashkilot</Table.Th>
                  <Table.Th>Mas'ul shaxs</Table.Th>
                  <Table.Th>Telefon</Table.Th>
                  <Table.Th>Telegram</Table.Th>
                  <Table.Th>Hudud</Table.Th>
                  <Table.Th>Holat</Table.Th>
                  <Table.Th>Sana</Table.Th>
                  <Table.Th style={{ textAlign: "right" }}>Amallar</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {inquiries.map((inq) => (
                  <Table.Tr key={inq.id}>
                    <Table.Td>
                      <Badge variant="light" color="indigo" radius="sm">
                        {inq.ticketId}
                      </Badge>
                    </Table.Td>
                    <Table.Td fw={600}>{inq.organization}</Table.Td>
                    <Table.Td>{inq.fullName}</Table.Td>
                    <Table.Td>
                      <Text size="sm" c="blue" component="a" href={`tel:${inq.phone}`}>
                        {inq.phone}
                      </Text>
                    </Table.Td>
                    <Table.Td>{inq.telegram || "-"}</Table.Td>
                    <Table.Td>{inq.region || "-"}</Table.Td>
                    <Table.Td>
                      <Badge color={statusColors[inq.status] || "gray"} variant="filled">
                        {statusLabels[inq.status] || inq.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <IconClock size={14} color="gray" />
                        <Text size="xs" c="dimmed">
                          {inq.createdAt ? new Date(inq.createdAt).toLocaleDateString() : "-"}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td style={{ textAlign: "right" }}>
                      <Group gap={6} justify="flex-end">
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          title="Ko'rish / Holat berish"
                          onClick={() => handleOpenDetail(inq)}
                        >
                          <IconEye size={18} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          title="O'chirish"
                          onClick={() => { setDeletingId(inq.id); openDeleteModal(); }}
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

      {/* Murojaat tafsilotlari va status modali */}
      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title={<Text fw={700} size="lg">Murojaat tafsilotlari #{selectedInquiry?.ticketId}</Text>}
        size="lg"
      >
        {selectedInquiry && (
          <Stack gap="md">
            <Group grow>
              <div>
                <Text size="xs" c="dimmed">Tashkilot</Text>
                <Text fw={600}>{selectedInquiry.organization}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Mas'ul shaxs</Text>
                <Text fw={600}>{selectedInquiry.fullName}</Text>
              </div>
            </Group>

            <Group grow>
              <div>
                <Text size="xs" c="dimmed">Telefon</Text>
                <Text fw={600} c="blue">{selectedInquiry.phone}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Telegram</Text>
                <Text fw={500}>{selectedInquiry.telegram || "-"}</Text>
              </div>
            </Group>

            <Group grow>
              <div>
                <Text size="xs" c="dimmed">Hudud</Text>
                <Text>{selectedInquiry.region || "-"}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Tashkilot turi</Text>
                <Text>{selectedInquiry.organizationType || "-"}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Kompyuterlar soni</Text>
                <Text>{selectedInquiry.computerCount || "-"}</Text>
              </div>
            </Group>

            <div>
              <Text size="xs" c="dimmed">Mijoz izohi</Text>
              <Paper withBorder p="xs" bg="gray.0">
                <Text size="sm">{selectedInquiry.comment || "Izoh qoldirilmagan"}</Text>
              </Paper>
            </div>

            <Select
              label="Murojaat holati"
              data={[
                { value: "NEW", label: "Yangi (NEW)" },
                { value: "IN_PROGRESS", label: "Jarayonda (IN_PROGRESS)" },
                { value: "ANSWERED", label: "Javob berildi (ANSWERED)" },
                { value: "CLOSED", label: "Yopildi (CLOSED)" },
              ]}
              value={newStatus}
              onChange={(val) => setNewStatus(val || "NEW")}
            />

            <Textarea
              label="Admin ichki izohi / Qaydlar"
              placeholder="Masalan: 12-sentyabrda qo'ng'iroq qilindi, shartnoma yuborildi..."
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

      {/* O'chirishni tasdiqlash modali */}
      <Modal opened={deleteModalOpened} onClose={closeDeleteModal} title="O'chirishni tasdiqlash">
        <Text size="sm">Haqiqatan ham bu murojaatni o'chirib tashlamoqchimisiz?</Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={closeDeleteModal}>Bekor qilish</Button>
          <Button color="red" onClick={handleDelete}>O'chirish</Button>
        </Group>
      </Modal>
    </Stack>
  );
}
