import React from "react";
import {
  IconArrowRight,
  IconBrandApple,
  IconBrandGooglePlay,
  IconBrandTelegram,
  IconBrandWindows,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { prefetchRoute } from "@/utils/routePrefetch";
import classes from "./Home.module.css";
import { DomainLink } from "@/components/common/DomainLink";
import { getWebAppUrl } from "@/utils/domain";
import { useAuth } from "@/auth/AuthContext";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=uz.prava.online";
const APP_STORE_URL = "https://apps.apple.com/app/prava-online/id0000000000";
const WINDOWS_DIRECT_URL = "/api/v1/files/installers/prava-online-setup.exe";
const TELEGRAM_BOT_URL = "https://t.me/pravaonlineuzbot";

export const CTA_Section = React.memo(() => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  return (
    <section className={classes.finalCtaSectionMinimal} aria-label="Final CTA">
      <div className={classes.finalCtaBox}>
        <h2 className={classes.sectionHeaderTitle} style={{ marginBottom: 12 }}>
          {t("home.cta.title", "Hoziroq boshlang!")}
        </h2>

        <p className={classes.heroCenteredSubtitle} style={{ marginBottom: 28 }}>
          {t(
            "home.cta.description",
            "Foydalanuvchi bo'lish shart emas — darhol test yechishni boshlang. Telegram yoki brauzer orqali ham kirishingiz mumkin."
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
              style={{ height: 50, padding: "0 36px", fontSize: "1rem" }}
            >
              <span>
                {isAuthenticated
                  ? t("nav.dashboard", "Boshqaruv paneliga o'tish")
                  : t("home.hero.openWebApp", "Ilovaga o'tish")}
              </span>
              <IconArrowRight size={18} />
            </button>
          </DomainLink>
        </div>

        {/* Store badges */}
        <div className={classes.storeBadgesRow} style={{ marginTop: 24 }}>
          <a
            href={WINDOWS_DIRECT_URL}
            download
            className={classes.storeBadgeLink}
            title="Windows ilovasi (.exe)"
          >
            <IconBrandWindows size={18} />
            <span>Windows (.exe)</span>
          </a>

          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={classes.storeBadgeLink}
            title="Google Play"
          >
            <IconBrandGooglePlay size={18} color="#00e676" />
            <span>Google Play</span>
          </a>

          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={classes.storeBadgeLink}
            title="App Store"
          >
            <IconBrandApple size={18} />
            <span>App Store</span>
          </a>

          <a
            href={TELEGRAM_BOT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={classes.storeBadgeLink}
            title="Telegram Bot"
          >
            <IconBrandTelegram size={18} color="#0088cc" />
            <span>Telegram</span>
          </a>
        </div>
      </div>
    </section>
  );
});

CTA_Section.displayName = "CTA_Section";

