import { useState } from "react";
import {
  Stack,
  Title,
  Card,
  Table,
  Group,
  TextInput,
  Badge,
  ActionIcon,
  Button,
  Modal,
  Text,
  Pagination,
  Skeleton,
  Textarea,
  Tabs,
  Switch,
  NumberInput,
  Paper,
} from "@mantine/core";
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconRefresh,
  IconHelp,
} from "@tabler/icons-react";
import useSWR from "swr";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import api from "../../services/api";

interface FaqItem {
  id?: number;
  questionUzl: string;
  questionUzc?: string;
  questionRu?: string;
  answerUzl: string;
  answerUzc?: string;
  answerRu?: string;
  category?: string;
  sortOrder?: number;
  isActive: boolean;
}

const emptyFaq: FaqItem = {
  questionUzl: "",
  questionUzc: "",
  questionRu: "",
  answerUzl: "",
  answerUzc: "",
  answerRu: "",
  category: "GENERAL",
  sortOrder: 0,
  isActive: true,
};

export default function FaqPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [editingFaq, setEditingFaq] = useState<FaqItem>(emptyFaq);
  const [saving, setSaving] = useState(false);
  const [langTab, setLangTab] = useState<string>("uzl");

  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const queryParams = new URLSearchParams({
    page: String(page - 1),
    size: String(pageSize),
  });
  if (search.trim()) queryParams.set("search", search.trim());

  const { data, error, mutate, isValidating } = useSWR(
    `/api/v1/admin/faqs?${queryParams.toString()}`,
    () => api.get(`/api/v1/admin/faqs?${queryParams.toString()}`).then((res) => res.data?.data)
  );

  const faqs: FaqItem[] = data?.content || [];
  const totalPages: number = data?.totalPages || 1;

  const handleOpenCreate = () => {
    setEditingFaq({ ...emptyFaq });
    setLangTab("uzl");
    openForm();
  };

  const handleOpenEdit = (faq: FaqItem) => {
    setEditingFaq({ ...faq });
    setLangTab("uzl");
    openForm();
  };

  const handleSave = async () => {
    if (!editingFaq.questionUzl.trim() || !editingFaq.answerUzl.trim()) {
      notifications.show({
        title: "Xatolik",
        message: "Lotin tilidagi savol va javob maydonlari majburiy",
        color: "red",
      });
      return;
    }

    setSaving(true);
    try {
      if (editingFaq.id) {
        await api.put(`/api/v1/admin/faqs/${editingFaq.id}`, editingFaq);
        notifications.show({ title: "Muvaffaqiyatli", message: "FAQ yangilandi", color: "green" });
      } else {
        await api.post("/api/v1/admin/faqs", editingFaq);
        notifications.show({ title: "Muvaffaqiyatli", message: "Yangi FAQ yaratildi", color: "green" });
      }
      closeForm();
      mutate();
    } catch (e: any) {
      notifications.show({
        title: "Xatolik",
        message: e?.response?.data?.message || "Saqlab bo'lmadi",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/api/v1/admin/faqs/${deletingId}`);
      notifications.show({ title: "O'chirildi", message: "FAQ o'chirildi", color: "green" });
      closeDeleteModal();
      mutate();
    } catch (e: any) {
      notifications.show({ title: "Xatolik", message: "O'chirib bo'lmadi", color: "red" });
    }
  };

  return (
    <Stack gap="lg" p="md">
      <Group justify="space-between" align="center">
        <div>
          <Title order={2} fw={700}>Ko'p Beriladigan Savollar (FAQ CMS)</Title>
          <Text c="dimmed" size="sm">Foydalanuvchilar va avtomaktablar uchun ko'p tilli qo'llanma savollari</Text>
        </div>
        <Group>
          <Button leftSection={<IconPlus size={16} />} onClick={handleOpenCreate}>
            Yangi savol qo'shish
          </Button>
          <Button leftSection={<IconRefresh size={16} />} variant="light" onClick={() => mutate()} loading={isValidating}>
            Yangilash
          </Button>
        </Group>
      </Group>

      <Card withBorder radius="md" p="md">
        <Stack gap="md">
          <TextInput
            placeholder="Savol yoki javob bo'yicha qidirish..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => { setSearch(e.currentTarget.value); setPage(1); }}
          />

          {isValidating && !data ? (
            <Stack gap="xs">
              <Skeleton height={45} />
              <Skeleton height={45} />
              <Skeleton height={45} />
            </Stack>
          ) : error ? (
            <Paper p="xl" withBorder style={{ textAlign: "center" }}>
              <Text c="red">FAQ ma'lumotlarini yuklab bo'lmadi</Text>
              <Button mt="sm" variant="subtle" onClick={() => mutate()}>Qayta urinish</Button>
            </Paper>
          ) : faqs.length === 0 ? (
            <Paper p="xl" withBorder style={{ textAlign: "center" }}>
              <IconHelp size={48} color="gray" />
              <Text c="dimmed" mt="xs">Hozircha FAQ elementlari yo'q</Text>
            </Paper>
          ) : (
            <Table striped highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Tartib</Table.Th>
                  <Table.Th>Savol (Lotin)</Table.Th>
                  <Table.Th>Kategoriya</Table.Th>
                  <Table.Th>Holat</Table.Th>
                  <Table.Th style={{ textAlign: "right" }}>Amallar</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {faqs.map((f) => (
                  <Table.Tr key={f.id}>
                    <Table.Td>
                      <Badge variant="light" color="indigo">{f.sortOrder || 0}</Badge>
                    </Table.Td>
                    <Table.Td fw={600}>{f.questionUzl}</Table.Td>
                    <Table.Td>
                      <Badge variant="outline" color="cyan">{f.category || "GENERAL"}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={f.isActive ? "green" : "gray"}>
                        {f.isActive ? "Faol" : "Nofaol"}
                      </Badge>
                    </Table.Td>
                    <Table.Td style={{ textAlign: "right" }}>
                      <Group gap={6} justify="flex-end">
                        <ActionIcon variant="subtle" color="blue" onClick={() => handleOpenEdit(f)}>
                          <IconEdit size={18} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="red" onClick={() => { setDeletingId(f.id!); openDeleteModal(); }}>
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

      {/* FAQ tahrirlash modali */}
      <Modal
        opened={formOpened}
        onClose={closeForm}
        title={<Text fw={700} size="lg">{editingFaq.id ? "Savolni tahrirlash" : "Yangi FAQ savol"}</Text>}
        size="lg"
      >
        <Stack gap="md">
          <Group grow>
            <TextInput
              label="Kategoriya"
              placeholder="GENERAL, PAYMENT, EXAM, DESKTOP"
              value={editingFaq.category || "GENERAL"}
              onChange={(e) => setEditingFaq({ ...editingFaq, category: e.currentTarget.value })}
            />
            <NumberInput
              label="Tartib raqami"
              value={editingFaq.sortOrder ?? 0}
              onChange={(val) => setEditingFaq({ ...editingFaq, sortOrder: Number(val) || 0 })}
            />
          </Group>

          <Switch
            label="Faollik holati (Saytda ko'rinadi)"
            checked={editingFaq.isActive}
            onChange={(e) => setEditingFaq({ ...editingFaq, isActive: e.currentTarget.checked })}
          />

          <Tabs value={langTab} onChange={(val) => setLangTab(val || "uzl")}>
            <Tabs.List>
              <Tabs.Tab value="uzl">Lotin (uz)</Tabs.Tab>
              <Tabs.Tab value="uzc">Кирилл (uz_cyrl)</Tabs.Tab>
              <Tabs.Tab value="ru">Русский (ru)</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="uzl" pt="md">
              <Stack gap="sm">
                <TextInput
                  label="Savol (Lotin)"
                  required
                  placeholder="Savolni kiriting..."
                  value={editingFaq.questionUzl}
                  onChange={(e) => setEditingFaq({ ...editingFaq, questionUzl: e.currentTarget.value })}
                />
                <Textarea
                  label="Javob (Lotin)"
                  required
                  rows={4}
                  placeholder="Javob matnini kiriting..."
                  value={editingFaq.answerUzl}
                  onChange={(e) => setEditingFaq({ ...editingFaq, answerUzl: e.currentTarget.value })}
                />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="uzc" pt="md">
              <Stack gap="sm">
                <TextInput
                  label="Савол (Кирилл)"
                  placeholder="Саволни киритинг..."
                  value={editingFaq.questionUzc || ""}
                  onChange={(e) => setEditingFaq({ ...editingFaq, questionUzc: e.currentTarget.value })}
                />
                <Textarea
                  label="Жавоб (Кирилл)"
                  rows={4}
                  placeholder="Жавоб матнини киритинг..."
                  value={editingFaq.answerUzc || ""}
                  onChange={(e) => setEditingFaq({ ...editingFaq, answerUzc: e.currentTarget.value })}
                />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="ru" pt="md">
              <Stack gap="sm">
                <TextInput
                  label="Вопрос (Русский)"
                  placeholder="Введите вопрос..."
                  value={editingFaq.questionRu || ""}
                  onChange={(e) => setEditingFaq({ ...editingFaq, questionRu: e.currentTarget.value })}
                />
                <Textarea
                  label="Ответ (Русский)"
                  rows={4}
                  placeholder="Введите ответ..."
                  value={editingFaq.answerRu || ""}
                  onChange={(e) => setEditingFaq({ ...editingFaq, answerRu: e.currentTarget.value })}
                />
              </Stack>
            </Tabs.Panel>
          </Tabs>

          <Group justify="flex-end" mt="lg">
            <Button variant="default" onClick={closeForm}>Bekor qilish</Button>
            <Button color="blue" onClick={handleSave} loading={saving}>
              Saqlash
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* O'chirish modali */}
      <Modal opened={deleteModalOpened} onClose={closeDeleteModal} title="FAQ ni o'chirish">
        <Text size="sm">Haqiqatan ham bu savolni butunlay o'chirib tashlamoqchimisiz?</Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={closeDeleteModal}>Bekor qilish</Button>
          <Button color="red" onClick={handleDelete}>O'chirish</Button>
        </Group>
      </Modal>
    </Stack>
  );
}
