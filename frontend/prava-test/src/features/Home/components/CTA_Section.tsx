import React from "react";
import { IconArrowRight, IconCheck, IconRocket, IconPlayerPlay } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { prefetchRoute } from "@/utils/routePrefetch";
import classes from "./Home.module.css";
import { DomainLink } from "@/components/common/DomainLink";
import { getWebAppUrl, getLandingUrl } from "@/utils/domain";
import { useAuth } from "@/auth/AuthContext";

export const CTA_Section = React.memo(() => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  const ctaBadges = [
    { key: "home.cta.badge1", defaultText: "Tez va oson" },
    { key: "home.cta.badge2", defaultText: "Hech qanday majburiyat yo'q" },
    { key: "home.cta.badge3", defaultText: "Rasmiy savollar" },
  ];

  return (
    <section className={classes.finalCtaSectionModern} aria-label={t("home.cta.ariaLabel", "Harakatga chaqiruv")}>
      <div className={classes.finalCtaCard}>
        {/* Top Glow Icon */}
        <div className={classes.finalCtaIconRing}>
          <IconRocket size={32} color="#0b84f3" />
        </div>

        {/* Title & Description */}
        <h2 className={classes.finalCtaTitle}>
          {t("home.cta.title", "Haydovchilik imtihoniga tayyorgarlikni hoziroq boshlang!")}
        </h2>

        <p className={classes.finalCtaSubtitle}>
          {t(
            "home.cta.subtitle",
            "Ro'yxatdan o'ting va bepul sinov imtihoni orqali bilimlaringizni sinab ko'ring."
          )}
        </p>

        {/* Trust Badges */}
        <div className={classes.finalCtaBadgesRow}>
          {ctaBadges.map((badge, idx) => (
            <div key={idx} className={classes.finalCtaBadgeItem}>
              <IconCheck size={16} stroke={2.5} color="#10b981" />
              <span>{t(badge.key, badge.defaultText)}</span>
            </div>
          ))}
        </div>

        {/* Dual CTA Buttons */}
        <div className={classes.finalCtaActionsGroup}>
          <DomainLink
            href={getWebAppUrl(isAuthenticated ? "/me" : "/auth/login")}
            onMouseEnter={() => prefetchRoute(isAuthenticated ? "/me" : "/auth/login")}
            onTouchStart={() => prefetchRoute(isAuthenticated ? "/me" : "/auth/login")}
            style={{ textDecoration: "none" }}
          >
            <button
              type="button"
              className={classes.heroPrimaryBtn}
              style={{ height: 48, padding: "0 28px", fontSize: "0.95rem" }}
            >
              <span>
                {isAuthenticated
                  ? t("nav.dashboard", "Boshqaruv paneliga o'tish")
                  : t("home.cta.primaryBtn", "Web ilovani ochish")}
              </span>
              <IconArrowRight size={18} />
            </button>
          </DomainLink>

          <DomainLink
            href={getLandingUrl("/try-exam")}
            onMouseEnter={() => prefetchRoute("/try-exam")}
            onTouchStart={() => prefetchRoute("/try-exam")}
            style={{ textDecoration: "none" }}
          >
            <button
              type="button"
              className={classes.heroSecondaryBtn}
              style={{ height: 48, padding: "0 24px", fontSize: "0.95rem" }}
            >
              <IconPlayerPlay size={16} style={{ fill: "currentColor" }} />
              <span>{t("home.cta.secondaryBtn", "Bepul sinov imtihoni")}</span>
            </button>
          </DomainLink>
        </div>
      </div>
    </section>
  );
});

CTA_Section.displayName = "CTA_Section";
