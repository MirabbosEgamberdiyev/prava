import { useTranslation } from "react-i18next";
import { SimpleGrid, Card, Text, NumberFormatter } from "@mantine/core";
import type { LearningCenterResponse } from "../../../features/learningCenter/types";

export function StatsCards({ centers }: { centers: LearningCenterResponse[] }) {
  const { t } = useTranslation();
  const total      = centers.length;
  const active     = centers.filter(c => c.status === "ACTIVE").length;
  const inactive   = centers.filter(c => c.status === "INACTIVE").length;
  const totalCodes = centers.reduce((s, c) => s + (c.totalCodes   ?? 0), 0);
  const activeCodes= centers.reduce((s, c) => s + (c.activeCodes  ?? 0), 0);
  const computers  = centers.reduce((s, c) => s + (c.computerCount?? 0), 0);

  const cards = [
    { value: total,       color: "blue",   label: t("lc.stats.total") },
    { value: active,      color: "green",  label: t("lc.stats.active") },
    { value: inactive,    color: "gray",   label: t("lc.stats.inactive") },
    { value: totalCodes,  color: "violet", label: t("lc.stats.totalCodes") },
    { value: activeCodes, color: "teal",   label: t("lc.stats.activeCodes") },
    { value: computers,   color: "cyan",   label: t("lc.stats.computers") },
  ];

  return (
    <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }} spacing="sm">
      {cards.map(({ value, color, label }, i) => (
        <Card key={i} withBorder radius="md" p="md">
          <Text size="xs" c="dimmed" fw={500}>{label}</Text>
          <Text size="xl" fw={700} c={color} style={{ fontSize: "1.5rem", lineHeight: 1.2, marginTop: 4 }}>
            <NumberFormatter value={value} thousandSeparator />
          </Text>
        </Card>
      ))}
    </SimpleGrid>
  );
}
