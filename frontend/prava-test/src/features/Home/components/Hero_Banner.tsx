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
import { getWebAppUrl, getLandingUrl } from "@/utils/domain";
import { useAuth } from "@/auth/AuthContext";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=uz.prava.online";
const APP_STORE_URL = "https://apps.apple.com/app/prava-online/id0000000000";
const WINDOWS_DIRECT_URL = "/api/v1/files/installers/prava-online-setup.exe";
const TELEGRAM_BOT_URL = "https://t.me/pravaonlineuzbot";

export function Hero_Banner() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  return (
    <section className={classes.heroCenteredSection} aria-label="Hero">
      <div className={classes.heroCenteredContent}>
        {/* 1. Top Pill Badge */}
        <div className={classes.heroPillBadge}>
          <span>⭐ {t("home.hero.verifiedBadge", "IIV YHXBB 2026-yilgi amaldagi reglamenti asosida")}</span>
        </div>

        {/* 2. Main Centered Headline */}
        <h1 className={classes.heroCenteredTitle}>
          {t("home.hero.titleStart", "Haydovchilik imtihoniga")}{" "}
          <span className={classes.heroHighlightWord}>{t("home.hero.highlightWord", "oson")}</span>{" "}
          {t("home.hero.titleEnd", "tayyorlaning!")}
        </h1>

        {/* 3. Centered Subtitle */}
        <p className={classes.heroCenteredSubtitle}>
          {t(
            "home.hero.description",
            "1200+ rasmiy savollar, 70 ta bilet va IIV YHXBB davlat imtihoni simulyatori. Kompyuter yoki telefon orqali bilimlaringizni sinovdan o'tkazing va imtihondan birinchi urinishda o'ting."
          )}
        </p>

        {/* 4. Action Buttons */}
        <div className={classes.heroActionsGroup}>
          {isAuthenticated ? (
            <DomainLink
              href={getWebAppUrl("/me")}
              style={{ textDecoration: "none" }}
            >
              <button type="button" className={classes.heroPrimaryBtn}>
                <span>{t("nav.dashboard", "Boshqaruv paneliga o'tish")}</span>
                <IconArrowRight size={18} />
              </button>
            </DomainLink>
          ) : (
            <DomainLink
              href={getWebAppUrl("/auth/login")}
              onMouseEnter={() => prefetchRoute("/auth/login")}
              onTouchStart={() => prefetchRoute("/auth/login")}
              style={{ textDecoration: "none" }}
            >
              <button type="button" className={classes.heroPrimaryBtn}>
                <span>{t("home.hero.openWebApp", "Web ilovani ochish")}</span>
                <IconArrowRight size={18} />
              </button>
            </DomainLink>
          )}

          <DomainLink
            href={getLandingUrl("/try-exam")}
            onMouseEnter={() => prefetchRoute("/try-exam")}
            onTouchStart={() => prefetchRoute("/try-exam")}
            style={{ textDecoration: "none" }}
          >
            <button type="button" className={classes.heroSecondaryBtn}>
              <span>{t("guestExam.tryFree", "Bepul sinov imtihoni")}</span>
            </button>
          </DomainLink>
        </div>

        {/* 5. Platform Store Badges Row */}
        <div className={classes.storeBadgesWrapper}>
          <span className={classes.storeBadgesLabel}>
            {t("home.hero.availableOn", "Barcha qurilmalarda mavjud:")}
          </span>
          <div className={classes.storeBadgesRow}>
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
      </div>
    </section>
  );
}

