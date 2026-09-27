import { useTranslation } from 'react-i18next';
import { ExamResultPage } from "../../features/ExamResult";
import SEO from "../../components/common/SEO";

const ExamResult_Page = () => {
  const { t } = useTranslation();
  return (
    <>
      <SEO title={t("seo.examResult.title")} description={t("seo.examResult.desc")}
        noIndex={true}
      />

      <ExamResultPage />
    </>
  );
};

export default ExamResult_Page;
