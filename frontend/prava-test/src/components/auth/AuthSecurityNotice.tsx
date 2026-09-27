import React from "react";
import { Link } from "react-router-dom";
import { IconShieldCheck } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import classes from "./AuthSecurityNotice.module.css";

export const AuthSecurityNotice: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className={classes.securityNoticeRoot}>
      <div className={classes.securityBadge}>
        <IconShieldCheck size={16} stroke={2} />
        <span>{t("authV2.login.securityNote")}</span>
      </div>

      <p className={classes.termsText}>
        <span>{t("authV2.login.termsPrefix")}</span>
        <Link to="/terms" className={classes.termsLink}>
          {t("authV2.login.termsLink")}
        </Link>
        <span>{t("authV2.login.termsAnd")}</span>
        <Link to="/privacy" className={classes.termsLink}>
          {t("authV2.login.privacyLink")}
        </Link>
        <span>{t("authV2.login.termsSuffix")}</span>
      </p>
    </div>
  );
};

export default AuthSecurityNotice;
