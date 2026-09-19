import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  IconBrandTelegram,
  IconBrandInstagram,
  IconBrandYoutube,
  IconBrandFacebook,
} from "@tabler/icons-react";
import classes from "./AuthCompactFooter.module.css";

export const AuthCompactFooter: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className={classes.authFooterRoot} role="contentinfo">
      <div className={classes.footerContainer}>
        {/* Left: Brand logo & name & concise slogan */}
        <div className={classes.brandSection}>
          <img
            src="/logo.svg"
            alt="Prava Online"
            className={classes.brandLogo}
            width={24}
            height={24}
          />
          <span className={classes.brandName}>
            PRAVA<span className={classes.brandAccent}>ONLINE</span>
          </span>
          <span className={classes.brandDesc}>
            {t(
              "authV2.footer.slogan",
              "Haydovchilikka ishonchli tayyorgarlik platformasi."
            )}
          </span>
        </div>

        {/* Center: Legal & Help links */}
        <nav
          className={classes.navSection}
          aria-label={t("nav.footerNav", "Qo'shimcha sahifalar")}
        >
          <Link to="/terms" className={classes.footerLink}>
            {t("footer.terms", "Foydalanish shartlari")}
          </Link>
          <span className={classes.footerSeparator} aria-hidden="true">
            |
          </span>
          <Link to="/privacy" className={classes.footerLink}>
            {t("footer.privacy", "Maxfiylik siyosati")}
          </Link>
          <span className={classes.footerSeparator} aria-hidden="true">
            |
          </span>
          <Link to="/faq" className={classes.footerLink}>
            {t("nav.faq", "Yordam")}
          </Link>
          <span className={classes.footerSeparator} aria-hidden="true">
            |
          </span>
          <Link to="/contact" className={classes.footerLink}>
            {t("nav.contact", "Biz bilan bog'lanish")}
          </Link>
        </nav>

        {/* Right: Social Media buttons */}
        <div className={classes.socialSection}>
          <a
            href="https://t.me/pravaonlineuz"
            target="_blank"
            rel="noopener noreferrer"
            className={`${classes.socialIconBtn} ${classes.telegram}`}
            aria-label="Telegram"
          >
            <IconBrandTelegram size={16} />
          </a>
          <a
            href="https://instagram.com/pravaonlineuz"
            target="_blank"
            rel="noopener noreferrer"
            className={`${classes.socialIconBtn} ${classes.instagram}`}
            aria-label="Instagram"
          >
            <IconBrandInstagram size={16} />
          </a>
          <a
            href="https://youtube.com/@pravaonline"
            target="_blank"
            rel="noopener noreferrer"
            className={`${classes.socialIconBtn} ${classes.youtube}`}
            aria-label="YouTube"
          >
            <IconBrandYoutube size={16} />
          </a>
          <a
            href="https://facebook.com/pravaonline"
            target="_blank"
            rel="noopener noreferrer"
            className={`${classes.socialIconBtn} ${classes.facebook}`}
            aria-label="Facebook"
          >
            <IconBrandFacebook size={16} />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default AuthCompactFooter;
