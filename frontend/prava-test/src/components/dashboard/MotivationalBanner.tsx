import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  IconTargetArrow,
  IconCheck,
  IconArrowRight,
} from "@tabler/icons-react";
import styles from "./Dashboard.module.css";

export const MotivationalBanner: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section
      className={styles.motivationalCard}
      aria-label={t("dashboard.motivationalTitle", "Motivatsion banner")}
    >
      <div className={styles.motivationalLeft}>
        <div className={styles.motivationalTitleWrap}>
          <div className={styles.motivationalTargetIcon}>
            <IconTargetArrow size={28} stroke={2.2} />
          </div>
          <div>
            <h3 className={styles.motivationalHeading}>
              {t(
                "dashboard.banner.title",
                "Haydovchilik orzularingiz endilikda yanada yaqin!"
              )}
            </h3>
            <p className={styles.motivationalSubtitle}>
              {t(
                "dashboard.banner.subtitle",
                "Muntazam o'qish, to'g'ri tahlil va amaliy testlar bilan siz albatta maqsadingizga erishasiz!"
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          className={styles.motivationalCtaBtn}
          onClick={() => navigate("/topics")}
        >
          <span>
            {t("dashboard.banner.continueBtn", "O'qishni davom ettirish")}
          </span>
          <IconArrowRight size={16} stroke={2.5} />
        </button>

        <div className={styles.motivationalFeatures}>
          <div className={styles.motivationalFeatureItem}>
            <IconCheck size={16} stroke={3} className={styles.motivationalFeatureCheck} />
            <span>{t("dashboard.banner.benefit1", "Rasmiy savollar bazasi")}</span>
          </div>
          <div className={styles.motivationalFeatureItem}>
            <IconCheck size={16} stroke={3} className={styles.motivationalFeatureCheck} />
            <span>{t("dashboard.banner.benefit2", "Doimiy yangilanish")}</span>
          </div>
          <div className={styles.motivationalFeatureItem}>
            <IconCheck size={16} stroke={3} className={styles.motivationalFeatureCheck} />
            <span>{t("dashboard.banner.benefit3", "Natija kafolatlanadi")}</span>
          </div>
        </div>
      </div>

      <div className={styles.motivationalRightGraphic}>
        <div className={styles.speechBubble}>
          {t("dashboard.banner.quote", "Bilim haydovchilik erkinligiga olib boradi!")}
        </div>

        {/* Scenic Road Vector Illustration */}
        <svg
          viewBox="0 0 340 180"
          className={styles.motivationalRoadIllustration}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Mountains */}
          <path
            d="M20 120 L90 60 L160 120 Z"
            fill="#93c5fd"
            opacity="0.6"
          />
          <path
            d="M110 120 L180 50 L250 120 Z"
            fill="#60a5fa"
            opacity="0.5"
          />
          <path
            d="M210 130 L270 70 L330 130 Z"
            fill="#93c5fd"
            opacity="0.6"
          />

          {/* Green Hills */}
          <path
            d="M0 130 Q100 90 200 120 T340 110 L340 180 L0 180 Z"
            fill="#86efac"
            opacity="0.8"
          />
          <path
            d="M0 145 Q80 120 180 140 T340 130 L340 180 L0 180 Z"
            fill="#4ade80"
          />

          {/* Trees */}
          <polygon points="40,110 32,130 48,130" fill="#15803d" />
          <polygon points="40,118 30,138 50,138" fill="#166534" />
          <polygon points="60,105 52,125 68,125" fill="#15803d" />
          <polygon points="280,95 272,118 288,118" fill="#15803d" />
          <polygon points="300,102 292,122 308,122" fill="#166534" />

          {/* Curving Road */}
          <path
            d="M340 150 C260 145 220 180 150 180 C80 180 0 170 0 170 L0 180 L340 180 Z"
            fill="#334155"
          />
          {/* Road White Dashes */}
          <path
            d="M320 162 C260 158 230 175 160 176"
            stroke="#ffffff"
            strokeWidth="3"
            strokeDasharray="8 8"
          />
          <path
            d="M130 176 C80 176 30 173 0 173"
            stroke="#ffffff"
            strokeWidth="3"
            strokeDasharray="8 8"
          />

          {/* Road edge barrier */}
          <path
            d="M340 148 C260 143 220 178 150 178"
            stroke="#94a3b8"
            strokeWidth="2"
          />
        </svg>
      </div>
    </section>
  );
};
