// page/Tickets/Edit_Ticket_Page/Edit_Ticket_Page.tsx

import { useParams, useNavigate } from "react-router-dom";
import {
  Paper,
  Title,
  Stack,
  Breadcrumbs,
  Anchor,
  LoadingOverlay,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import {
  EditTicketForm,
  useTicketDetail,
  useUpdateTicket,
  type TicketFormData,
} from "../../../features/ticket";

function Edit_Ticket_Page() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { updateTicket, loading: updateLoading } = useUpdateTicket();
  const { ticket: ticketData, isLoading } = useTicketDetail(
    id ? parseInt(id) : null,
  );

  const handleSubmit = async (values: Partial<TicketFormData>) => {
    if (!id) return;

    try {
      await updateTicket(parseInt(id), values as TicketFormData);
      navigate("/tickets");
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  const handleCancel = () => {
    navigate("/tickets");
  };

  const breadcrumbItems = [
    { title: t("breadcrumb.home"), href: "/" },
    { title: t("tickets.title"), href: "/tickets" },
    { title: t("common.edit"), href: "#" },
  ];

  if (isLoading || !ticketData) {
    return (
      <Paper p="md" withBorder pos="relative" h={400}>
        <LoadingOverlay visible />
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      <Breadcrumbs>
        {breadcrumbItems.map((item, index) =>
          item.href === "#" ? (
            <span key={index}>{item.title}</span>
          ) : (
            <Anchor key={index} onClick={() => navigate(item.href)}>
              {item.title}
            </Anchor>
          ),
        )}
      </Breadcrumbs>

      <Paper p="md" withBorder>
        <Title order={2} mb="md">
          {t("tickets.editTicket")}
        </Title>

        <EditTicketForm
          initialData={ticketData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={updateLoading}
        />
      </Paper>
    </Stack>
  );
}

export default Edit_Ticket_Page;
