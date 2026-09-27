import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  IconBrandTelegram,
  IconBrandInstagram,
  IconBrandYoutube,
  IconSteeringWheel,
} from "@tabler/icons-react";
import styles from "./Dashboard.module.css";

export const DashboardFooter: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.footerInner}>
        <div className={styles.footerColumns}>
          {/* Column 1: Brand & Social */}
          <div className={styles.footerBrandCol}>
            <div
              className={styles.brandLogo}
              onClick={() => navigate("/me")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate("/me")}
            >
              <img
                src="/logo.svg"
                alt="Prava Online"
                className={styles.brandLogoImg}
                width={32}
                height={32}
              />
              <span className={styles.brandText}>
                PRAVA<span className={styles.brandAccent}>ONLINE</span>
              </span>
            </div>
            <p className={styles.footerBrandDesc}>
              {t(
                "dashboard.footer.slogan"
              )}
            </p>
            <div className={styles.footerSocialIcons}>
              <a
                href="https://t.me/pravaonlineuz"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.footerSocialBtn}
                style={{ background: "#0088cc" }}
                aria-label="Telegram"
              >
                <IconBrandTelegram size={18} />
              </a>
              <a
                href="https://www.instagram.com/pravaonlineuz/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.footerSocialBtn}
                style={{
                  background:
                    "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
                }}
                aria-label="Instagram"
              >
                <IconBrandInstagram size={18} />
              </a>
              <a
                href="https://www.youtube.com/@pravaonlineuz"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.footerSocialBtn}
                style={{ background: "#ff0000" }}
                aria-label="YouTube"
              >
                <IconBrandYoutube size={18} />
              </a>
            </div>
          </div>

          {/* Column 2: Mahsulot */}
          <div>
            <h5 className={styles.footerColTitle}>
              {t("dashboard.footer.product")}
            </h5>
            <ul className={styles.footerLinksList}>
              <li>
                <button
                  type="button"
                  className={styles.footerLink}
                  onClick={() => navigate("/topics")}
                >
                  {t("dashboard.nav.topics")}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={styles.footerLink}
                  onClick={() => navigate("/tickets")}
                >
                  {t("dashboard.nav.tickets")}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={styles.footerLink}
                  onClick={() => navigate("/marafon")}
                >
                  {t("dashboard.nav.marathon")}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={styles.footerLink}
                  onClick={() => navigate("/survival")}
                >
                  {t("dashboard.nav.survival")}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={styles.footerLink}
                  onClick={() => navigate("/exam")}
                >
                  {t("dashboard.nav.exam")}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Yordam & Ma'lumot */}
          <div>
            <h5 className={styles.footerColTitle}>
              {t("dashboard.footer.help")}
            </h5>
            <ul className={styles.footerLinksList}>
              <li>
                <button
                  type="button"
                  className={styles.footerLink}
                  onClick={() => navigate("/faq")}
                >
                  {t("nav.faq")}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={styles.footerLink}
                  onClick={() => navigate("/about")}
                >
                  {t("nav.about")}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={styles.footerLink}
                  onClick={() => navigate("/contact")}
                >
                  {t("nav.contact")}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={styles.footerLink}
                  onClick={() => navigate("/terms")}
                >
                  {t("dashboard.footer.terms")}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Xavfsizlik & Rasmiy Standart */}
          <div>
            <h5 className={styles.footerColTitle}>
              {t("dashboard.footer.safetyTitle")}
            </h5>
            <div className={styles.footerSafetyCard}>
              <div className={styles.footerSafetyIconWrap}>
                <IconSteeringWheel size={22} stroke={2} />
              </div>
              <div className={styles.footerSafetyText}>
                {t("dashboard.footer.safety")}
              </div>
            </div>
            <p className={styles.footerTrustNote}>
              {t("dashboard.footer.trustNote")}
            </p>
          </div>
        </div>

        {/* Bottom Bar: Copyright */}
        <div className={styles.footerBottomBar}>
          <span>
            © {currentYear} PravaOnline.{" "}
            {t("dashboard.footer.rights")}
          </span>
          <span style={{ fontSize: "11px", opacity: 0.7 }}>
            v2.0 Enterprise EdTech
          </span>
        </div>
      </div>
    </footer>
  );
};
