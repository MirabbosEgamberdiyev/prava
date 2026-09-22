import { Package_List } from "../../features/Package";
import SEO from "../../components/common/SEO";
import { useTranslation } from "react-i18next";
import { IconTags } from "@tabler/icons-react";
import styles from "../../components/dashboard/Dashboard.module.css";

const Packages_Page = () => {
  const { t } = useTranslation();

  return (
    <>
      <SEO
        title={t("seo.packages.title", "Imtihon Paketlari — PravaOnline")}
        description={t("seo.packages.desc", "Mavzular va toifalar bo'yicha imtihon paketlari to'plami.")}
        canonical="/packages"
        noIndex={true}
      />
      {/* Page Header */}
      <div className={styles.innerPageHeader}>
        <div className={styles.innerPageHeaderLeft}>
          <div className={styles.innerPageTitleRow}>
            <h1 className={styles.innerPageTitle}>
              <IconTags
                size={24}
                stroke={2}
                style={{ color: "var(--primary)", verticalAlign: "middle", marginRight: 8 }}
              />
              {t("packages.title", "Imtihon paketlari")}
            </h1>
          </div>
          <p className={styles.innerPageSubtitle}>
            {t(
              "packages.subtitle",
              "Mavzular va yo'nalishlar bo'yicha saralangan maxsus savollar to'plami."
            )}
          </p>
        </div>
      </div>

      {/* Content Container */}
      <div style={{ maxWidth: 1200, width: "100%", margin: "0 auto" }}>
        <Package_List hideTitle={true} />
      </div>
    </>
  );
};

export default Packages_Page;
