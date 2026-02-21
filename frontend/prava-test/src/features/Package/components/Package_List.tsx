import { useState } from "react";
import useSWR from "swr";
import {
  SimpleGrid,
  Skeleton,
  Center,
  Title,
  Text,
  Pagination,
  Paper,
  Stack,
  Group,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Package_Card } from "./Package_Card";
import { TopicFilter } from "../../Topic/components/TopicFilter";
import type { PackageResponse, Package } from "../types";

const PAGE_SIZE = 20;

const Package_List = () => {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(0);
  const [selectedTopicCode, setSelectedTopicCode] = useState<string | null>(null);

  // API endpoint - til o'zgarganda qayta so'rov yuboriladi
  const url = selectedTopicCode
    ? `/api/v1/packages/topic/${selectedTopicCode}?page=${page}&size=${PAGE_SIZE}&sortBy=orderIndex&direction=ASC&lang=${i18n.language}`
    : `/api/v1/packages?page=${page}&size=${PAGE_SIZE}&sortBy=orderIndex&direction=ASC&lang=${i18n.language}`;

  const { data, isLoading, error } = useSWR<PackageResponse>(url);

  // Paketlar ro'yxati
  const packages = data?.data.content ?? [];

  // Jami sahifalar soni
  const totalPages = data?.data.totalPages ?? 0;

  const handleTopicChange = (value: string | null) => {
    setSelectedTopicCode(value);
    setPage(0);
  };

  // Birinchi yuklash - skeleton loader
  if (isLoading) {
    return (
      <>
        <Group justify="space-between" mb="md" wrap="wrap">
          <Title order={3}>{t("package.title")}</Title>
          <TopicFilter
            value={selectedTopicCode}
            onChange={handleTopicChange}
            valueKey="code"
          />
        </Group>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">
          {Array.from({ length: 8 }).map((_, i) => (
            <Paper key={i} withBorder p="md" radius="md">
              <Stack gap="sm">
                <Skeleton height={24} width="60%" radius="sm" />
                <Skeleton height={16} width="40%" radius="sm" />
                <Skeleton height={36} radius="sm" />
              </Stack>
            </Paper>
          ))}
        </SimpleGrid>
      </>
    );
  }

  // Xatolik
  if (error) {
    return (
      <Center>
        <Title order={4} c="red">
          {t("common.errorOccurred")}...
        </Title>
      </Center>
    );
  }

  return (
    <>
      <Group justify="space-between" mb="md" wrap="wrap">
        <Title order={3}>{t("package.title")}</Title>
        <TopicFilter
          value={selectedTopicCode}
          onChange={handleTopicChange}
          valueKey="code"
        />
      </Group>

      {packages.length === 0 ? (
        <Center h={200}>
          <Text c="dimmed">{t("package.notFound")}</Text>
        </Center>
      ) : (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">
            {packages.map((item: Package) => (
              <Package_Card key={item.id} pkg={item} />
            ))}
          </SimpleGrid>

          <Pagination
            mt={"lg"}
            total={totalPages}
            value={page + 1}
            onChange={(value) => setPage(value - 1)}
            size="md"
          />
        </>
      )}
    </>
  );
};

export { Package_List };
