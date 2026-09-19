import React from "react";
import { useTranslation } from "react-i18next";
import styles from "./Dashboard.module.css";

interface WelcomeBannerProps {
  displayName: string;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ displayName }) => {
  const { t } = useTranslation();

  return (
    <section className={styles.welcomeSection} aria-label={t("dashboard.welcomeAria", "Xush kelibsiz bo'limi")}>
      <div className={styles.welcomeTextWrap}>
        <h2 className={styles.welcomeHeading}>
          👋 {t("dashboard.greeting", "Xush kelibsiz")},{" "}
          <span className={styles.welcomeUserName}>{displayName}</span>!
        </h2>
        <p className={styles.welcomeSubtitle}>
          {t("dashboard.subtitle", "Haydovchilik imtihoniga tayyorlanishda davom eting. Maqsad yaqin!")}
        </p>
      </div>

      <div className={styles.welcomeRightWrap}>
        <div className={styles.quoteCard}>
          <p style={{ margin: 0 }}>
            {t("dashboard.quote", "“Intizom bugungi harakat — ertangi muvaffaqiyat!”")}
          </p>
        </div>
      </div>
    </section>
  );
};
