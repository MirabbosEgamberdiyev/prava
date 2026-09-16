import { ExamHistoryPage } from "../../features/ExamHistory";
import SEO from "../../components/common/SEO";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconArrowLeft, IconHistory } from "@tabler/icons-react";
import { Container } from "@mantine/core";

const History_Page = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <>
      <SEO title={t("seo.history.title", "Imtihonlar Tarixi")} description={t("seo.history.desc", "O'tgan imtihonlaringiz natijalarini ko'ring.")}
        canonical="/history"
        noIndex={true}
      />
      <div className="review-screen">
        <header className="review-header">
          <button
            className="review-back-btn"
            onClick={() => navigate("/me")}
            type="button"
          >
            <IconArrowLeft size={18} stroke={2} />
            {t("common.back", "Orqaga")}
          </button>
          <div className="review-header-title">
            <IconHistory size={20} stroke={2} color="var(--mantine-color-blue-5)" />
            <span>{t("history.title", "Imtihonlar tarixi")}</span>
          </div>
        </header>
        <main style={{ flex: 1, overflowY: "auto", padding: "14px 16px 32px" }}>
          <Container size="lg">
            <ExamHistoryPage />
          </Container>
        </main>
      </div>
    </>
  );
};

export default History_Page;
