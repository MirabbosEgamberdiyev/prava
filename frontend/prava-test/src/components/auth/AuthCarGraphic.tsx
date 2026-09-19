import React from "react";
import { useTranslation } from "react-i18next";
import classes from "./AuthCarGraphic.module.css";

interface AuthCarGraphicProps {
  badgeText: string;
  alignment?: "left" | "right";
}

export const AuthCarGraphic: React.FC<AuthCarGraphicProps> = ({
  badgeText,
  alignment = "left",
}) => {
  const { t } = useTranslation();
  const imageSrc =
    alignment === "right"
      ? "/images/auth-car-right.png"
      : "/images/auth-car-skyline.png";

  return (
    <div className={classes.graphicWrapper}>
      {badgeText && (
        <div className={classes.floatingCallout} aria-label={badgeText}>
          <span>{badgeText}</span>
          <span aria-hidden="true">⤴</span>
        </div>
      )}
      <div className={classes.carImageContainer}>
        <img
          src={imageSrc}
          alt={t("authV2.carGraphicAlt", "Prava Online")}
          className={classes.carImage}
          loading="lazy"
          onError={(e) => {
            // Fallback if image path differs
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
          }}
        />
      </div>
    </div>
  );
};

export default AuthCarGraphic;
