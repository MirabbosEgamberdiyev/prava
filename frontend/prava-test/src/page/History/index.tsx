import { ExamHistoryPage } from "../../features/ExamHistory";
import SEO from "../../components/common/SEO";

const History_Page = () => {
  return (
    <>
      <SEO
        title="Imtihon tarixi"
        description="O'tgan imtihonlaringiz natijalarini ko'ring va tahlil qiling."
        canonical="/history"
        noIndex={true}
      />
      <ExamHistoryPage />
    </>
  );
};

export default History_Page;
