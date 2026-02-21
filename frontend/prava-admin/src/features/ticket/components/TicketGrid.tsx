// features/ticket/components/TicketGrid.tsx

import { SimpleGrid, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { TicketCard } from "./TicketCard";
import type { TicketListItem } from "../types";

interface TicketGridProps {
  tickets: TicketListItem[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  loading?: boolean;
}

export function TicketGrid({
  tickets,
  onEdit,
  onDelete,
  loading = false,
}: TicketGridProps) {
  const { t } = useTranslation();

  if (tickets.length === 0 && !loading) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        {t("common.noData")}
      </Text>
    );
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">
      {tickets.map((ticket) => (
        <TicketCard
          key={ticket.id}
          ticket={ticket}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </SimpleGrid>
  );
}
