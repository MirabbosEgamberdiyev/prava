import React from "react";
import { useTranslation } from "react-i18next";
import GoogleLoginButton from "./GoogleLoginButton";
import TelegramLoginButton from "./TelegramLoginButton";
import classes from "./SocialAuthGroup.module.css";
import { rememberPendingReturnTo, useReturnTo } from "../../auth/useReturnTo";

interface SocialAuthGroupProps {
  mode: "login" | "register";
}

export const SocialAuthGroup: React.FC<SocialAuthGroupProps> = ({ mode }) => {
  const { t } = useTranslation();
  const { returnTo } = useReturnTo();

  const botHintText =
    mode === "register"
      ? t("authV2.register.botHint")
      : t("authV2.login.botHint");

  const botStartParam = mode === "register" ? "register" : "login";

  return (
    <div className={classes.socialGroupWrapper}>
      {/* Divider */}
      <div className={classes.dividerRow} aria-hidden="true">
        <div className={classes.dividerLine} />
        <span className={classes.dividerText}>
          {t("authV2.login.or")}
        </span>
        <div className={classes.dividerLine} />
      </div>

      {/* Social Buttons */}
      <div className={classes.buttonsGrid}>
        <GoogleLoginButton mode={mode} compact />
        <TelegramLoginButton mode={mode} compact />
      </div>

      {/* Telegram bot direct link */}
      <div className={classes.botHintText}>
        <span>{botHintText} </span>
        <a
          href={`https://t.me/pravaonlineuzbot?start=${botStartParam}`}
          target="_blank"
          rel="noopener noreferrer"
          className={classes.botLink}
          // W-06: bot orqali qaytishda (telegram-callback) returnTo tiklanadi
          onClick={() => rememberPendingReturnTo(returnTo)}
        >
          @pravaonlineuzbot
        </a>
      </div>
    </div>
  );
};

export default SocialAuthGroup;
