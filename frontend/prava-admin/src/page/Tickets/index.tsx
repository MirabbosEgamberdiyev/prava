// page/Tickets/index.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Paper,
  Title,
  Button,
  Group,
  Stack,
  LoadingOverlay,
  Text,
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { notifications } from "@mantine/notifications";
import Cookies from "js-cookie";

import { useTickets, useDeleteTicket } from "../../features/ticket/hook";
import { TicketPagination } from "../../features/ticket/components/TicketPagination";
import { TicketGrid } from "../../features/ticket/components/TicketGrid";
import { openDeleteConfirmModal } from "../../features/ticket/components/TicketDeleteModal";
import type { TranslatedField } from "../../features/ticket/types";

function getTranslated(field: TranslatedField): string {
  const lang = (Cookies.get("i18next") || "uzl") as keyof TranslatedField;
  return field?.[lang] || field?.uzl || "";
}

function Tickets_Page() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);

  const { tickets, pagination, isLoading, mutate } = useTickets(page, size);
  const { deleteTicket, loading: deleteLoading } = useDeleteTicket();

  // Handlers
  const handleCreate = () => {
    navigate("/tickets/add");
  };

  const handleEdit = (id: number) => {
    navigate(`/tickets/edit/${id}`);
  };

  const handleDelete = (id: number) => {
    const ticket = tickets.find((t) => t.id === id);
    if (!ticket) return;

    openDeleteConfirmModal(getTranslated(ticket.name), async () => {
      try {
        await deleteTicket(id);
        mutate();
      } catch (error: any) {
        notifications.show({
          title: t("common.error"),
          message: error?.response?.data?.message || t("tickets.deleteError"),
          color: "red",
        });
      }
    });
  };

  const isActionLoading = deleteLoading;

  if (isLoading) {
    return (
      <Paper p="md" withBorder>
        <LoadingOverlay visible />
        <Text c="dimmed" ta="center" py="xl">
          {t("common.loading")}
        </Text>
      </Paper>
    );
  }

  return (
    <>
      <Stack gap="md">
        <Paper p="md" withBorder>
          <Group justify="space-between">
            <Title order={2}>{t("tickets.title")}</Title>
            <Button leftSection={<IconPlus size={16} />} onClick={handleCreate}>
              {t("tickets.addNew")}
            </Button>
          </Group>
        </Paper>

        <>
          <LoadingOverlay visible={isActionLoading} />

          <TicketGrid
            tickets={tickets}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={isLoading}
          />

          {pagination && pagination.totalPages > 1 && (
            <TicketPagination
              page={page}
              totalPages={pagination.totalPages}
              size={size}
              totalElements={pagination.totalElements}
              onPageChange={setPage}
              onSizeChange={(newSize) => {
                setSize(newSize);
                setPage(0);
              }}
            />
          )}
        </>
      </Stack>
    </>
  );
}

export default Tickets_Page;
