import React from "react";
import { IconArrowRight } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { prefetchRoute } from "@/utils/routePrefetch";
import classes from "./Home.module.css";
import { DomainLink } from "@/components/common/DomainLink";
import { getWebAppUrl, getLandingUrl } from "@/utils/domain";
import { useAuth } from "@/auth/AuthContext";

export const CTA_Section = React.memo(() => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  return (
    <section className={classes.finalCtaSectionMinimal} aria-label="Final CTA">
      <div className={classes.finalCtaBox}>
        <h2 className={classes.sectionHeaderTitle} style={{ marginBottom: 12 }}>
          {t("home.cta.title", "Haydovchilik imtihoniga tayyorgarlikni hoziroq boshlang!")}
        </h2>

        <p className={classes.heroCenteredSubtitle} style={{ marginBottom: 28, maxWidth: 640 }}>
          {t(
            "home.cta.description",
            "Ro'yxatdan o'ting va to'liq imkoniyatlardan foydalaning yoki bepul sinov imtihoni orqali bilimlaringizni sinab ko'ring."
          )}
        </p>

        <div className={classes.heroActionsGroup}>
          <DomainLink
            href={getWebAppUrl(isAuthenticated ? "/me" : "/auth/login")}
            onMouseEnter={() => prefetchRoute(isAuthenticated ? "/me" : "/auth/login")}
            onTouchStart={() => prefetchRoute(isAuthenticated ? "/me" : "/auth/login")}
            style={{ textDecoration: "none" }}
          >
            <button
              type="button"
              className={classes.heroPrimaryBtn}
              style={{ height: 48, padding: "0 32px", fontSize: "0.95rem" }}
            >
              <span>
                {isAuthenticated
                  ? t("nav.dashboard", "Boshqaruv paneliga o'tish")
                  : t("home.hero.openWebApp", "Web ilovani ochish")}
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
              style={{ height: 48, padding: "0 26px", fontSize: "0.95rem" }}
            >
              <span>{t("guestExam.tryFree", "Bepul sinov imtihoni")}</span>
            </button>
          </DomainLink>
        </div>
      </div>
    </section>
  );
});

CTA_Section.displayName = "CTA_Section";

