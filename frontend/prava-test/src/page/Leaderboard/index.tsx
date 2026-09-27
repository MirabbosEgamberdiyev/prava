import { LeaderboardPage } from "../../features/Leaderboard";
import SEO from "../../components/common/SEO";
import { useTranslation } from "react-i18next";
import { IconTrophy } from "@tabler/icons-react";
import styles from "../../components/dashboard/Dashboard.module.css";

const Leaderboard_Page = () => {
  const { t } = useTranslation();

  return (
    <>
      <SEO
        title={t("seo.leaderboard.title")}
        description={t("seo.leaderboard.desc")}
        canonical="/leaderboard"
        noIndex={true}
      />
      {/* Page Header */}
      <div className={styles.innerPageHeader}>
        <div className={styles.innerPageHeaderLeft}>
          <div className={styles.innerPageTitleRow}>
            <h1 className={styles.innerPageTitle}>
              <IconTrophy
                size={24}
                stroke={2}
                style={{ color: "#f59f00", verticalAlign: "middle", marginRight: 8 }}
              />
              {t("leaderboard.title")}
            </h1>
          </div>
          <p className={styles.innerPageSubtitle}>
            {t(
              "leaderboard.subtitle"
            )}
          </p>
        </div>
      </div>

      {/* Content Container */}
      <div style={{ maxWidth: 1080, width: "100%", margin: "0 auto" }}>
        <LeaderboardPage hideTitle={true} />
      </div>
    </>
  );
};

export default Leaderboard_Page;
