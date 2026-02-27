import { TicketList } from "../../features/Ticket";
import SEO from "../../components/common/SEO";

const Tickets_Page = () => {
  return (
    <>
      <SEO
        title="Biletlar - YHXBB imtihon biletlari"
        description="YHXBB imtihon biletlarini yeching. Har bir biletda real imtihon savollari mavjud."
        canonical="/tickets"
        noIndex={true}
      />
      <TicketList />
    </>
  );
};

export default Tickets_Page;
