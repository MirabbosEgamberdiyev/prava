// features/package/components/PackageGrid.tsx

import { SimpleGrid, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { PackageCard } from "./PackageCard";
import type { PackageListItem } from "../types";

interface PackageGridProps {
  packages: PackageListItem[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number) => void;
  onRegenerate: (id: number) => void;
  onAttachQuestions: (id: number) => void;
  loading?: boolean;
}

export function PackageGrid({
  packages,
  onEdit,
  onDelete,
  onToggleStatus,
  onRegenerate,
  onAttachQuestions,
  loading = false,
}: PackageGridProps) {
  const { t } = useTranslation();

  if (packages.length === 0 && !loading) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        {t("common.noDataFound")}
      </Text>
    );
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">
      {packages.map((pkg) => (
        <PackageCard
          key={pkg.id}
          package={pkg}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleStatus={onToggleStatus}
          onRegenerate={onRegenerate}
          onAttachQuestions={onAttachQuestions}
        />
      ))}
    </SimpleGrid>
  );
}
