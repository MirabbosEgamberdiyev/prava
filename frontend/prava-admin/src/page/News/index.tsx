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
  Paper,
} from "@mantine/core";
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconRefresh,
  IconNews,
  IconEye,
} from "@tabler/icons-react";
import useSWR from "swr";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import api from "../../services/api";
import { useTranslation } from "react-i18next";

interface NewsArticle {
  id?: number;
  slug: string;
  titleUzl: string;
  titleUzc?: string;
  titleRu?: string;
  descriptionUzl?: string;
  descriptionUzc?: string;
  descriptionRu?: string;
  contentUzl?: string;
  contentUzc?: string;
  contentRu?: string;
  coverImageUrl?: string;
  isPublished: boolean;
  viewCount?: number;
  publishedAt?: string;
}

const emptyArticle: NewsArticle = {
  slug: "",
  titleUzl: "",
  titleUzc: "",
  titleRu: "",
  descriptionUzl: "",
  descriptionUzc: "",
  descriptionRu: "",
  contentUzl: "",
  contentUzc: "",
  contentRu: "",
  coverImageUrl: "",
  isPublished: false,
};

export default function NewsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [editingArticle, setEditingArticle] = useState<NewsArticle>(emptyArticle);
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
    `/api/v1/admin/news?${queryParams.toString()}`,
    () => api.get(`/api/v1/admin/news?${queryParams.toString()}`).then((res) => res.data?.data)
  );

  const articles: NewsArticle[] = data?.content || [];
  const totalPages: number = data?.totalPages || 1;

  const handleOpenCreate = () => {
    setEditingArticle({ ...emptyArticle });
    setLangTab("uzl");
    openForm();
  };

  const handleOpenEdit = (article: NewsArticle) => {
    setEditingArticle({ ...article });
    setLangTab("uzl");
    openForm();
  };

  const handleSave = async () => {
    if (!editingArticle.titleUzl.trim()) {
      notifications.show({
        title: t("common.error"),
        message: t("newsAdmin.notifications.requiredLotin"),
        color: "red",
      });
      return;
    }

    setSaving(true);
    try {
      if (editingArticle.id) {
        await api.put(`/api/v1/admin/news/${editingArticle.id}`, editingArticle);
        notifications.show({ title: t("common.success"), message: t("newsAdmin.notifications.updateSuccess"), color: "green" });
      } else {
        await api.post("/api/v1/admin/news", editingArticle);
        notifications.show({ title: t("common.success"), message: t("newsAdmin.notifications.createSuccess"), color: "green" });
      }
      closeForm();
      mutate();
    } catch (e: any) {
      notifications.show({
        title: t("common.error"),
        message: e?.response?.data?.message || t("newsAdmin.notifications.error"),
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (article: NewsArticle) => {
    try {
      await api.patch(`/api/v1/admin/news/${article.id}/publish`, {
        isPublished: !article.isPublished,
      });
      notifications.show({
        title: "Yangilandi",
        message: !article.isPublished ? "Yangilik nashr qilindi" : "Yangilik nashrdan olindi",
        color: "blue",
      });
      mutate();
    } catch (e: any) {
      notifications.show({
        title: t("common.error"),
        message: t("newsAdmin.notifications.error"),
        color: "red",
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/api/v1/admin/news/${deletingId}`);
      notifications.show({ title: t("common.success"), message: t("newsAdmin.notifications.deleteSuccess"), color: "green" });
      closeDeleteModal();
      mutate();
    } catch (e: any) {
      notifications.show({ title: t("common.error"), message: t("newsAdmin.notifications.error"), color: "red" });
    }
  };

  return (
    <Stack gap="lg" p="md">
      <Group justify="space-between" align="center">
        <div>
          <Title order={1} fz="h3" fw={700}>{t("newsAdmin.title")}</Title>
          <Text c="dimmed" size="sm">{t("newsAdmin.subtitle")}</Text>
        </div>
        <Group>
          <Button leftSection={<IconPlus size={16} />} onClick={handleOpenCreate}>
            {t("newsAdmin.addBtn")}
          </Button>
          <Button leftSection={<IconRefresh size={16} />} variant="light" onClick={() => mutate()} loading={isValidating}>
            {t("newsAdmin.refresh")}
          </Button>
        </Group>
      </Group>

      <Card withBorder radius="md" p="md">
        <Stack gap="md">
          <TextInput
            placeholder={t("newsAdmin.searchPlaceholder")}
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
              <Text c="red">{t("newsAdmin.errorLoad")}</Text>
              <Button mt="sm" variant="subtle" onClick={() => mutate()}>{t("newsAdmin.retry")}</Button>
            </Paper>
          ) : articles.length === 0 ? (
            <Paper p="xl" withBorder style={{ textAlign: "center" }}>
              <IconNews size={48} color="gray" />
              <Text c="dimmed" mt="xs">{t("newsAdmin.empty")}</Text>
            </Paper>
          ) : (
            <Table striped highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t("newsAdmin.table.id")}</Table.Th>
                  <Table.Th>{t("newsAdmin.table.title")}</Table.Th>
                  <Table.Th>{t("newsAdmin.table.slug")}</Table.Th>
                  <Table.Th>{t("newsAdmin.table.views")}</Table.Th>
                  <Table.Th>{t("newsAdmin.table.status")}</Table.Th>
                  <Table.Th>{t("newsAdmin.table.date")}</Table.Th>
                  <Table.Th style={{ textAlign: "right" }}>{t("newsAdmin.table.actions")}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {articles.map((art) => (
                  <Table.Tr key={art.id}>
                    <Table.Td>#{art.id}</Table.Td>
                    <Table.Td fw={600}>{art.titleUzl}</Table.Td>
                    <Table.Td>
                      <Badge variant="light" color="gray" radius="sm">
                        {art.slug}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <IconEye size={14} color="gray" />
                        <Text size="sm">{art.viewCount || 0}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Switch
                        checked={Boolean(art.isPublished)}
                        onChange={() => handleTogglePublish(art)}
                        label={art.isPublished ? "Nashr qilingan" : "Qoralama"}
                        size="sm"
                      />
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {art.publishedAt ? new Date(art.publishedAt).toLocaleDateString() : "-"}
                      </Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: "right" }}>
                      <Group gap={6} justify="flex-end">
                        <ActionIcon variant="subtle" color="blue" onClick={() => handleOpenEdit(art)}>
                          <IconEdit size={18} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="red" onClick={() => { setDeletingId(art.id!); openDeleteModal(); }}>
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

      {/* Maqola yaratish va tahrirlash modali */}
      <Modal
        opened={formOpened}
        onClose={closeForm}
        title={<Text fw={700} size="lg">{editingArticle.id ? t("newsAdmin.modal.editTitle") : t("newsAdmin.modal.createTitle")}</Text>}
        size="xl"
      >
        <Stack gap="md">
          <Group grow>
            <TextInput
              label="SEO Slug (havola nomi)"
              placeholder="masalan: yhq-yangi-qoidalari-2026"
              value={editingArticle.slug}
              onChange={(e) => setEditingArticle({ ...editingArticle, slug: e.currentTarget.value })}
            />
            <TextInput
              label="Muqova rasm havolasi (Cover Image URL)"
              placeholder="https://... yoki /static/images/..."
              value={editingArticle.coverImageUrl || ""}
              onChange={(e) => setEditingArticle({ ...editingArticle, coverImageUrl: e.currentTarget.value })}
            />
          </Group>

          <Switch
            label="Darhol nashr qilish (Publish live)"
            checked={editingArticle.isPublished}
            onChange={(e) => setEditingArticle({ ...editingArticle, isPublished: e.currentTarget.checked })}
          />

          <Tabs value={langTab} onChange={(val) => setLangTab(val || "uzl")}>
            <Tabs.List>
              <Tabs.Tab value="uzl">O'zbekcha (Lotin)</Tabs.Tab>
              <Tabs.Tab value="uzc">Ўзбекча (Кирилл)</Tabs.Tab>
              <Tabs.Tab value="ru">Русский</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="uzl" pt="md">
              <Stack gap="sm">
                <TextInput
                  label="Sarlavha (Lotin)"
                  required
                  placeholder="Maqola sarlavhasi..."
                  value={editingArticle.titleUzl}
                  onChange={(e) => setEditingArticle({ ...editingArticle, titleUzl: e.currentTarget.value })}
                />
                <Textarea
                  label="Qisqa tavsif / Anons (Lotin)"
                  rows={2}
                  placeholder="Qisqacha mazmuni..."
                  value={editingArticle.descriptionUzl || ""}
                  onChange={(e) => setEditingArticle({ ...editingArticle, descriptionUzl: e.currentTarget.value })}
                />
                <Textarea
                  label="To'liq matn (Lotin)"
                  rows={6}
                  placeholder="Maqola to'liq matni..."
                  value={editingArticle.contentUzl || ""}
                  onChange={(e) => setEditingArticle({ ...editingArticle, contentUzl: e.currentTarget.value })}
                />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="uzc" pt="md">
              <Stack gap="sm">
                <TextInput
                  label="Сарлавҳа (Кирилл)"
                  placeholder="Мақола сарлавҳаси..."
                  value={editingArticle.titleUzc || ""}
                  onChange={(e) => setEditingArticle({ ...editingArticle, titleUzc: e.currentTarget.value })}
                />
                <Textarea
                  label="Қисқа тавсиф (Кирилл)"
                  rows={2}
                  placeholder="Қисқача мазмуни..."
                  value={editingArticle.descriptionUzc || ""}
                  onChange={(e) => setEditingArticle({ ...editingArticle, descriptionUzc: e.currentTarget.value })}
                />
                <Textarea
                  label="Тўлиқ матн (Кирилл)"
                  rows={6}
                  placeholder="Мақола тўлиқ матни..."
                  value={editingArticle.contentUzc || ""}
                  onChange={(e) => setEditingArticle({ ...editingArticle, contentUzc: e.currentTarget.value })}
                />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="ru" pt="md">
              <Stack gap="sm">
                <TextInput
                  label="Заголовок (Русский)"
                  placeholder="Заголовок статьи..."
                  value={editingArticle.titleRu || ""}
                  onChange={(e) => setEditingArticle({ ...editingArticle, titleRu: e.currentTarget.value })}
                />
                <Textarea
                  label="Краткое описание (Русский)"
                  rows={2}
                  placeholder="Анонс статьи..."
                  value={editingArticle.descriptionRu || ""}
                  onChange={(e) => setEditingArticle({ ...editingArticle, descriptionRu: e.currentTarget.value })}
                />
                <Textarea
                  label="Полный текст (Русский)"
                  rows={6}
                  placeholder="Полный текст статьи..."
                  value={editingArticle.contentRu || ""}
                  onChange={(e) => setEditingArticle({ ...editingArticle, contentRu: e.currentTarget.value })}
                />
              </Stack>
            </Tabs.Panel>
          </Tabs>

          <Group justify="flex-end" mt="lg">
            <Button variant="default" onClick={closeForm}>{t("newsAdmin.modal.cancel")}</Button>
            <Button color="blue" onClick={handleSave} loading={saving}>
              {t("newsAdmin.modal.save")}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* O'chirish modali */}
      <Modal opened={deleteModalOpened} onClose={closeDeleteModal} title={t("newsAdmin.modal.delete")}>
        <Text size="sm">{t("newsAdmin.modal.deleteConfirm")}</Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={closeDeleteModal}>{t("newsAdmin.modal.cancel")}</Button>
          <Button color="red" onClick={handleDelete}>{t("newsAdmin.modal.delete")}</Button>
        </Group>
      </Modal>
    </Stack>
  );
}
