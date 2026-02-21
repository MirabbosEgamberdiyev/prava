// features/package/components/PackagePagination.tsx

import { Group, Pagination, Select, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

interface PackagePaginationProps {
  page: number;
  totalPages: number;
  size: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
}

export function PackagePagination({
  page,
  totalPages,
  size,
  totalElements,
  onPageChange,
  onSizeChange,
}: PackagePaginationProps) {
  const { t } = useTranslation();
  const startItem = page * size + 1;
  const endItem = Math.min((page + 1) * size, totalElements);

  return (
    <Group justify="space-between" mt="md">
      <Group gap="xs">
        <Text size="sm" c="dimmed">
          {t("pagination.perPage")}:
        </Text>
        <Select
          size="sm"
          value={size.toString()}
          onChange={(value) => onSizeChange(parseInt(value || "10"))}
          data={[
            { value: "10", label: "10" },
            { value: "25", label: "25" },
            { value: "50", label: "50" },
            { value: "100", label: "100" },
          ]}
          style={{ width: 80 }}
        />
        <Text size="sm" c="dimmed">
          {t("pagination.total")}: {totalElements} | {t("pagination.showing")}: {startItem}-{endItem}
        </Text>
      </Group>

      <Pagination
        total={totalPages}
        value={page + 1}
        onChange={(value) => onPageChange(value - 1)}
        size="sm"
      />
    </Group>
  );
}
