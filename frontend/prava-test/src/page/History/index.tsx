import { ExamHistoryPage } from "../../features/ExamHistory";
import SEO from "../../components/common/SEO";
import { useTranslation } from "react-i18next";
import { IconHistory } from "@tabler/icons-react";
import styles from "../../components/dashboard/Dashboard.module.css";

const History_Page = () => {
  const { t } = useTranslation();

  return (
    <>
      <SEO
        title={t("seo.history.title", "Imtihonlar Tarixi — PravaOnline")}
        description={t("seo.history.desc", "O'tgan imtihonlaringiz natijalarini ko'ring.")}
        canonical="/history"
        noIndex={true}
      />
      {/* Page Header */}
      <div className={styles.innerPageHeader}>
        <div className={styles.innerPageHeaderLeft}>
          <div className={styles.innerPageTitleRow}>
            <h1 className={styles.innerPageTitle}>
              <IconHistory
                size={24}
                stroke={2}
                style={{ color: "var(--primary)", verticalAlign: "middle", marginRight: 8 }}
              />
              {t("history.title", "Imtihonlar tarixi")}
            </h1>
          </div>
          <p className={styles.innerPageSubtitle}>
            {t(
              "history.subtitle",
              "O'tkazilgan barcha imtihonlar, sarflangan vaqt va to'plangan ballar arxivi."
            )}
          </p>
        </div>
      </div>

      {/* Content Container */}
      <div style={{ maxWidth: 1080, width: "100%", margin: "0 auto" }}>
        <ExamHistoryPage hideTitle={true} />
      </div>
    </>
  );
};

export default History_Page;
