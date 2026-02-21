// page/Tickets/Add_Ticket_Page/Add_Ticket_Page.tsx

import { useNavigate } from "react-router-dom";
import { Paper, Title, Stack, Breadcrumbs, Anchor } from "@mantine/core";
import { useTranslation } from "react-i18next";

import {
  TicketForm,
  useCreateTicket,
  type TicketFormData,
} from "../../../features/ticket";

function Add_Ticket_Page() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { createTicket, loading } = useCreateTicket();

  const handleSubmit = async (values: TicketFormData) => {
    try {
      await createTicket(values);
      navigate("/tickets");
    } catch (error) {
      console.error("Create error:", error);
    }
  };

  const handleCancel = () => {
    navigate("/tickets");
  };

  const breadcrumbItems = [
    { title: t("breadcrumb.home"), href: "/" },
    { title: t("tickets.title"), href: "/tickets" },
    { title: t("tickets.addNew"), href: "#" },
  ];

  return (
    <>
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
            {t("tickets.addNew")}
          </Title>

          <TicketForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
          />
        </Paper>
      </Stack>
    </>
  );
}

export default Add_Ticket_Page;
