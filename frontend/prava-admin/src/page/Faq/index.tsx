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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
        title: t("common.error"),
        message: t("faqAdmin.notifications.requiredLotin"),
        color: "red",
      });
      return;
    }

    setSaving(true);
    try {
      if (editingFaq.id) {
        await api.put(`/api/v1/admin/faqs/${editingFaq.id}`, editingFaq);
        notifications.show({ title: t("common.success"), message: t("faqAdmin.notifications.updateSuccess"), color: "green" });
      } else {
        await api.post("/api/v1/admin/faqs", editingFaq);
        notifications.show({ title: t("common.success"), message: t("faqAdmin.notifications.createSuccess"), color: "green" });
      }
      closeForm();
      mutate();
    } catch (e: any) {
      notifications.show({
        title: t("common.error"),
        message: e?.response?.data?.message || t("faqAdmin.notifications.error"),
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
      notifications.show({ title: t("common.success"), message: t("faqAdmin.notifications.deleteSuccess"), color: "green" });
      closeDeleteModal();
      mutate();
    } catch (e: any) {
      notifications.show({ title: t("common.error"), message: t("faqAdmin.notifications.error"), color: "red" });
    }
  };

  return (
    <Stack gap="lg" p="md">
      <Group justify="space-between" align="center">
        <div>
          <Title order={1} fz="h3" fw={700}>{t("faqAdmin.title")}</Title>
          <Text c="dimmed" size="sm">{t("faqAdmin.subtitle")}</Text>
        </div>
        <Group>
          <Button leftSection={<IconPlus size={16} />} onClick={handleOpenCreate}>
            {t("faqAdmin.addBtn")}
          </Button>
          <Button leftSection={<IconRefresh size={16} />} variant="light" onClick={() => mutate()} loading={isValidating}>
            {t("faqAdmin.refresh")}
          </Button>
        </Group>
      </Group>

      <Card withBorder radius="md" p="md">
        <Stack gap="md">
          <TextInput
            placeholder={t("faqAdmin.searchPlaceholder")}
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
              <Text c="red">{t("faqAdmin.errorLoad")}</Text>
              <Button mt="sm" variant="subtle" onClick={() => mutate()}>{t("faqAdmin.retry")}</Button>
            </Paper>
          ) : faqs.length === 0 ? (
            <Paper p="xl" withBorder style={{ textAlign: "center" }}>
              <IconHelp size={48} color="gray" />
              <Text c="dimmed" mt="xs">{t("faqAdmin.empty")}</Text>
            </Paper>
          ) : (
            <Table striped highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t("faqAdmin.table.order")}</Table.Th>
                  <Table.Th>{t("faqAdmin.table.question")}</Table.Th>
                  <Table.Th>{t("faqAdmin.table.category")}</Table.Th>
                  <Table.Th>{t("faqAdmin.table.status")}</Table.Th>
                  <Table.Th style={{ textAlign: "right" }}>{t("faqAdmin.table.actions")}</Table.Th>
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
        title={<Text fw={700} size="lg">{editingFaq.id ? t("faqAdmin.modal.editTitle") : t("faqAdmin.modal.createTitle")}</Text>}
        size="lg"
      >
        <Stack gap="md">
          <Group grow>
            <TextInput
              label={t("faqAdmin.modal.categoryLabel")}
              placeholder={t("faqAdmin.modal.categoryPlaceholder")}
              value={editingFaq.category || "GENERAL"}
              onChange={(e) => setEditingFaq({ ...editingFaq, category: e.currentTarget.value })}
            />
            <NumberInput
              label={t("faqAdmin.modal.orderLabel")}
              value={editingFaq.sortOrder ?? 0}
              onChange={(val) => setEditingFaq({ ...editingFaq, sortOrder: Number(val) || 0 })}
            />
          </Group>

          <Switch
            label={t("faqAdmin.modal.activeLabel")}
            checked={editingFaq.isActive}
            onChange={(e) => setEditingFaq({ ...editingFaq, isActive: e.currentTarget.checked })}
          />

          <Tabs value={langTab} onChange={(val) => setLangTab(val || "uzl")}>
            <Tabs.List>
              <Tabs.Tab value="uzl">{t("faqAdmin.modal.tabUzl")}</Tabs.Tab>
              <Tabs.Tab value="uzc">{t("faqAdmin.modal.tabUzc")}</Tabs.Tab>
              <Tabs.Tab value="ru">{t("faqAdmin.modal.tabRu")}</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="uzl" pt="md">
              <Stack gap="sm">
                <TextInput
                  label={`${t("faqAdmin.modal.questionLabel")} (Lotin)`}
                  required
                  placeholder={t("faqAdmin.modal.questionPlaceholder")}
                  value={editingFaq.questionUzl}
                  onChange={(e) => setEditingFaq({ ...editingFaq, questionUzl: e.currentTarget.value })}
                />
                <Textarea
                  label={`${t("faqAdmin.modal.answerLabel")} (Lotin)`}
                  required
                  rows={4}
                  placeholder={t("faqAdmin.modal.answerPlaceholder")}
                  value={editingFaq.answerUzl}
                  onChange={(e) => setEditingFaq({ ...editingFaq, answerUzl: e.currentTarget.value })}
                />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="uzc" pt="md">
              <Stack gap="sm">
                <TextInput
                  label={`${t("faqAdmin.modal.questionLabel")} (Кирилл)`}
                  placeholder={t("faqAdmin.modal.questionPlaceholder")}
                  value={editingFaq.questionUzc || ""}
                  onChange={(e) => setEditingFaq({ ...editingFaq, questionUzc: e.currentTarget.value })}
                />
                <Textarea
                  label={`${t("faqAdmin.modal.answerLabel")} (Кирилл)`}
                  rows={4}
                  placeholder={t("faqAdmin.modal.answerPlaceholder")}
                  value={editingFaq.answerUzc || ""}
                  onChange={(e) => setEditingFaq({ ...editingFaq, answerUzc: e.currentTarget.value })}
                />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="ru" pt="md">
              <Stack gap="sm">
                <TextInput
                  label={`${t("faqAdmin.modal.questionLabel")} (Русский)`}
                  placeholder={t("faqAdmin.modal.questionPlaceholder")}
                  value={editingFaq.questionRu || ""}
                  onChange={(e) => setEditingFaq({ ...editingFaq, questionRu: e.currentTarget.value })}
                />
                <Textarea
                  label={`${t("faqAdmin.modal.answerLabel")} (Русский)`}
                  rows={4}
                  placeholder={t("faqAdmin.modal.answerPlaceholder")}
                  value={editingFaq.answerRu || ""}
                  onChange={(e) => setEditingFaq({ ...editingFaq, answerRu: e.currentTarget.value })}
                />
              </Stack>
            </Tabs.Panel>
          </Tabs>

          <Group justify="flex-end" mt="lg">
            <Button variant="default" onClick={closeForm}>{t("faqAdmin.modal.cancel")}</Button>
            <Button color="blue" onClick={handleSave} loading={saving}>
              {t("faqAdmin.modal.save")}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* O'chirish modali */}
      <Modal opened={deleteModalOpened} onClose={closeDeleteModal} title={t("faqAdmin.modal.delete")}>
        <Text size="sm">{t("faqAdmin.modal.deleteConfirm")}</Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={closeDeleteModal}>{t("faqAdmin.modal.cancel")}</Button>
          <Button color="red" onClick={handleDelete}>{t("faqAdmin.modal.delete")}</Button>
        </Group>
      </Modal>
    </Stack>
  );
}
