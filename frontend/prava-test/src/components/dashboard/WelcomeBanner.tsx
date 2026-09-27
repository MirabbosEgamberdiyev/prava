import React from "react";
import { useTranslation } from "react-i18next";
import styles from "./Dashboard.module.css";

interface WelcomeBannerProps {
  displayName: string;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ displayName }) => {
  const { t } = useTranslation();

  return (
    <section className={styles.welcomeSection} aria-label={t("dashboard.welcomeAria")}>
      <div className={styles.welcomeTextWrap}>
        <h1 className={styles.welcomeHeading}>
          👋 {t("dashboard.greeting")},{" "}
          <span className={styles.welcomeUserName}>{displayName}</span>!
        </h1>
        <p className={styles.welcomeSubtitle}>
          {t("dashboard.subtitle")}
        </p>
      </div>

      <div className={styles.welcomeRightWrap}>
        <div className={styles.quoteCard}>
          <p style={{ margin: 0 }}>
            {t("dashboard.quote")}
          </p>
        </div>
      </div>
    </section>
  );
};
