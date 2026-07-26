import { useTranslation } from "react-i18next";
import { SimpleGrid, Card, Skeleton, Text, NumberFormatter } from "@mantine/core";
import { useLearningCenterStats } from "../../../features/learningCenter/hooks/useLearningCenters";

export function StatsCards() {
  const { t } = useTranslation();
  const { stats, isLoading } = useLearningCenterStats();

  const cards = [
    { value: stats.total,       color: "blue",   label: t("lc.stats.total") },
    { value: stats.active,      color: "green",  label: t("lc.stats.active") },
    { value: stats.inactive,    color: "gray",   label: t("lc.stats.inactive") },
    { value: stats.totalCodes,  color: "violet", label: t("lc.stats.totalCodes") },
    { value: stats.activeCodes, color: "teal",   label: t("lc.stats.activeCodes") },
    { value: stats.computers,   color: "cyan",   label: t("lc.stats.computers") },
  ];

  return (
    <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }} spacing="sm">
      {cards.map(({ value, color, label }, i) => (
        <Card key={i} withBorder radius="md" p="md">
          {isLoading ? (
            <Skeleton height={40} />
          ) : (
            <>
              <Text size="xs" c="dimmed" fw={500}>{label}</Text>
              {/* Tipografika theme.ts tokenidan — inline fontSize emas */}
              <Text fz="h4" fw={700} c={color} mt={4} lh={1.2}>
                <NumberFormatter value={value} thousandSeparator />
              </Text>
            </>
          )}
        </Card>
      ))}
    </SimpleGrid>
  );
}
