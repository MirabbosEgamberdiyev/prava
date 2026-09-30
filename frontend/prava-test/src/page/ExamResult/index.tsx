import { ExamResultPage } from "../../features/ExamResult";
import SEO from "../../components/common/SEO";
import { useTranslation } from "react-i18next";

const ExamResult_Page = () => {
  const { t } = useTranslation();
  return (
    <>
      <SEO
        title={t("activeTest.results", "Imtihon natijasi")}
        description={t("exam.resultPageSeoDesc", "Imtihon natijalaringizni batafsil ko'ring va xatolaringizni tahlil qiling.")}
        noIndex={true}
      />

      <ExamResultPage />
    </>
  );
};

export default ExamResult_Page;
