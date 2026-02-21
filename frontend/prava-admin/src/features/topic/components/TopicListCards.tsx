import { useState, useMemo } from "react";
import {
  Badge,
  ActionIcon,
  Group,
  Text,
  Image,
  Center,
  Loader,
  Stack,
  Card,
  Grid,
  Menu,
  Pagination,
  TextInput,
} from "@mantine/core";
import {
  IconEdit,
  IconTrash,
  IconDotsVertical,
  IconSearch,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useTopics } from "../hooks/useTopics";
import type { Topic } from "../types";
import { useDeleteTopic } from "../hooks/useDeleteTopic";
import { useEditTopic } from "../hooks/useEditTopic";
import { TopicEditDrawer } from "./TopicEditDrawer"; // Drawerga o'zgartirildi

const TopicListCards = () => {
  const { t } = useTranslation();
  const [activePage, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const pageSize = 20;

  // Ma'lumotlarni yuklash va yangilash (mutate)
  const { topics, totalPages, isLoading, isError, mutate } = useTopics(
    activePage,
    pageSize
  );

  const filteredTopics = useMemo(() => {
    if (!searchTerm.trim()) return topics;
    const lower = searchTerm.toLowerCase();
    return topics.filter(
      (topic: Topic) =>
        (topic.nameUzl || topic.name || "").toLowerCase().includes(lower) ||
        (topic.code || "").toLowerCase().includes(lower),
    );
  }, [topics, searchTerm]);

  // O'chirish logikasi
  const { confirmDelete } = useDeleteTopic(mutate);

  // Tahrirlash (Drawer) logikasi
  const { editingTopic, setEditingTopic, isSubmitting, handleUpdate } =
    useEditTopic(mutate);

  if (isLoading) {
    return (
      <Center h={400}>
        <Loader color="blue" type="bars" />
      </Center>
    );
  }

  if (isError) {
    return (
      <Center h={200}>
        <Text c="red" fw={500}>
          {t("topics.errorLoading")}
        </Text>
      </Center>
    );
  }

  if (topics.length === 0) {
    return (
      <Center h={200}>
        <Text c="dimmed">{t("common.noData")}</Text>
      </Center>
    );
  }

  return (
    <Stack gap="xl">
      <TextInput
        placeholder={t("topics.searchPlaceholder")}
        leftSection={<IconSearch size={16} />}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.currentTarget.value)}
        mb="xs"
      />
      <Grid gutter="md">
        {filteredTopics.map((topic: Topic) => (
          <Grid.Col
            key={topic.id}
            span={{ base: 12, xs: 6, sm: 12, md: 6, lg: 4 }}
          >
            <Card shadow="sm" padding="sm" radius="md" withBorder h="100%">
              <Group justify="space-between" align="flex-start" mb="md">
                <Image
                  src={topic.iconUrl}
                  w={50}
                  h={50}
                  fallbackSrc="https://placehold.co/50x50?text=Icon"
                  radius="sm"
                />
                <Menu shadow="md" width={160} position="bottom-end">
                  <Menu.Target>
                    <ActionIcon variant="subtle" color="gray">
                      <IconDotsVertical size={18} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Label>{t("topics.actions")}</Menu.Label>
                    <Menu.Item
                      leftSection={<IconEdit size={14} />}
                      color="orange"
                      onClick={() => setEditingTopic(topic)} // Drawerni ochish va ma'lumotni yuborish
                    >
                      {t("topics.editAction")}
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                      color="red"
                      leftSection={<IconTrash size={14} />}
                      onClick={() =>
                        confirmDelete(topic.id, topic.nameUzl || topic.name)
                      }
                    >
                      {t("topics.deleteAction")}
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>

              <Stack gap={4} mb="lg" style={{ flex: 1 }}>
                <Text fw={700} size="lg" lineClamp={1}>
                  {topic.nameUzl || topic.name || t("topics.noName")}
                </Text>
                <Text size="xs" c="dimmed" fw={600}>
                  CODE: {topic.code}
                </Text>
                <Text size="sm" c="dimmed" lineClamp={2} mt="xs" h={40}>
                  {topic.descriptionUzl ||
                    topic.description ||
                    t("topics.noDescription")}
                </Text>
              </Stack>

              <Group
                justify="space-between"
                mt="auto"
                pt="md"
                style={{ borderTop: "1px solid #f1f3f5" }}
              >
                <Badge
                  variant="light"
                  color={topic.isActive ? "blue" : "yellow"}
                  size="sm"
                >
                  {topic.isActive ? t("topics.activeStatus") : t("topics.inactiveStatus")}
                </Badge>
                <Text size="xs" fw={500} c="dimmed">
                  {t("topics.order")}: {topic.displayOrder}
                </Text>
              </Group>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      {/* Tahrirlash Draweri (Modal o'rniga) */}
      <TopicEditDrawer
        topic={editingTopic}
        opened={!!editingTopic}
        onClose={() => setEditingTopic(null)}
        onSubmit={handleUpdate}
        loading={isSubmitting}
      />

      {totalPages > 1 && (
        <Pagination
          total={totalPages}
          value={activePage}
          onChange={setPage}
          color="blue"
          radius="sm"
          mt="sm"
        />
      )}
    </Stack>
  );
};

export { TopicListCards };
