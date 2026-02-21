// features/ticket/components/TicketDeleteModal.tsx

import { Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import i18n from "../../../utils/i18n";

export function openDeleteConfirmModal(
  ticketName: string,
  onConfirm: () => void,
) {
  modals.openConfirmModal({
    title: i18n.t("tickets.deleteTitle"),
    children: (
      <Text size="sm">
        {i18n.t("tickets.deleteConfirm", { name: ticketName })}
      </Text>
    ),
    labels: {
      confirm: i18n.t("common.delete"),
      cancel: i18n.t("common.cancel"),
    },
    confirmProps: { color: "red" },
    onConfirm,
  });
}
