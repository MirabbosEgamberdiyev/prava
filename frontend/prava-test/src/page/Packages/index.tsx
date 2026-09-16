import { Package_List } from "../../features/Package";
import SEO from "../../components/common/SEO";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconArrowLeft, IconTags } from "@tabler/icons-react";
import { Container } from "@mantine/core";

const Packages_Page = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <>
      <SEO title={t("seo.packages.title", "Imtihon Paketlari")} description={t("seo.packages.desc", "Imtihon paketlari to'plami")}
        canonical="/packages"
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
            <IconTags size={20} stroke={2} color="var(--mantine-color-blue-5)" />
            <span>{t("packages.title", "Imtihon paketlari")}</span>
          </div>
        </header>
        <main style={{ flex: 1, overflowY: "auto", padding: "14px 16px 32px" }}>
          <Container size="lg">
            <Package_List />
          </Container>
        </main>
      </div>
    </>
  );
};

export default Packages_Page;
