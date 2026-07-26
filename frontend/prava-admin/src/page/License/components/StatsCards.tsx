import { useTranslation } from "react-i18next";
import { SimpleGrid, Card, Skeleton, Text } from "@mantine/core";
import { useLicenseStats } from "../../../features/license/hooks/useLicense";

export function StatsCards() {
  const { t } = useTranslation();
  const { stats, isLoading } = useLicenseStats();

  const cards = [
    { key: "total",       color: "blue",   label: t("license.stats.total") },
    { key: "active",      color: "green",  label: t("license.stats.active") },
    { key: "expiring",    color: "orange", label: t("license.stats.expiring") },
    { key: "expired",     color: "red",    label: t("license.stats.expired") },
    { key: "deactivated", color: "gray",   label: t("license.stats.deactivated") },
  ] as const;

  return (
    <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} spacing="sm">
      {cards.map(({ key, color, label }) => (
        <Card key={key} withBorder radius="md" p="md">
          {isLoading ? (
            <Skeleton height={40} />
          ) : (
            <>
              <Text size="xs" c="dimmed" fw={500}>{label}</Text>
              {/* Tipografika theme.ts tokenidan — inline fontSize emas */}
              <Text fz="h4" fw={700} c={color} mt={4} lh={1.2}>
                {stats?.[key] ?? 0}
              </Text>
            </>
          )}
        </Card>
      ))}
    </SimpleGrid>
  );
}
