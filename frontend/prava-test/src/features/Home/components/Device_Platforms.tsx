import React from "react";
import { SimpleGrid, Button } from "@mantine/core";
import {
  IconBrandWindows,
  IconDeviceMobile,
  IconBrowser,
  IconBrandTelegram,
  IconDownload,
  IconBrandGooglePlay,
  IconBrandApple,
  IconExternalLink,
  IconDevices,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { DomainLink } from "@/components/common/DomainLink";
import { getWebAppUrl } from "@/utils/domain";
import classes from "./Home.module.css";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=uz.prava.online";
const APP_STORE_URL = "https://apps.apple.com/app/prava-online/id0000000000";
const WINDOWS_DIRECT_URL = "/api/v1/files/installers/prava-online-setup.exe";
const TELEGRAM_BOT_URL = "https://t.me/pravaonlineuzbot";

export const Device_Platforms = React.memo(() => {
  const { t } = useTranslation();

  return (
    <section className={classes.devicePlatformsModernSection} id="devices" aria-label={t("home.devices.ariaLabel")}>
      <div className={classes.sectionHeaderCentered}>
        <div className={classes.sectionCategoryBadge}>
          <IconDevices size={14} />
          <span>{t("home.devices.badge")}</span>
        </div>
        <h2 className={classes.sectionHeaderTitle}>
          {t("home.devices.title")}
        </h2>
        <p className={classes.sectionHeaderSubtitle}>
          {t(
            "home.devices.subtitle"
          )}
        </p>
      </div>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing={{ base: "md", md: "lg" }} mt={32}>
        {/* 1. Web Application Card */}
        <div className={classes.platformCardModern}>
          <div className={classes.platformCardHeader}>
            <div
              className={classes.platformIconBox}
              style={{ backgroundColor: "rgba(11, 132, 243, 0.1)", color: "#0b84f3" }}
            >
              <IconBrowser size={26} stroke={1.9} />
            </div>
            <span className={`${classes.platformPillBadge} ${classes.pillWeb}`}>
              {t("home.devices.webBadge")}
            </span>
          </div>

          <h3 className={classes.platformTitleModern}>
            {t("home.devices.webTitle")}
          </h3>
          <p className={classes.platformDescModern}>
            {t(
              "home.devices.webDesc"
            )}
          </p>

          <div className={classes.platformActionRow}>
            <DomainLink href={getWebAppUrl("/auth/login")} style={{ textDecoration: "none", width: "100%" }}>
              <Button
                variant="light"
                color="blue"
                fullWidth
                radius="md"
                size="sm"
                rightSection={<IconExternalLink size={16} />}
                className={classes.platformActionBtn}
              >
                {t("home.devices.webAction")}
              </Button>
            </DomainLink>
          </div>
        </div>

        {/* 2. Windows Desktop Card */}
        <div className={classes.platformCardModern}>
          <div className={classes.platformCardHeader}>
            <div
              className={classes.platformIconBox}
              style={{ backgroundColor: "rgba(37, 99, 235, 0.1)", color: "#2563eb" }}
            >
              <IconBrandWindows size={26} stroke={1.9} />
            </div>
            <span className={`${classes.platformPillBadge} ${classes.pillWindows}`}>
              {t("home.devices.windowsBadge")}
            </span>
          </div>

          <h3 className={classes.platformTitleModern}>
            {t("home.devices.windowsTitle")}
          </h3>
          <p className={classes.platformDescModern}>
            {t(
              "home.devices.windowsDesc"
            )}
          </p>

          <div className={classes.platformActionRow}>
            <Button
              component="a"
              href={WINDOWS_DIRECT_URL}
              download
              variant="filled"
              color="blue"
              fullWidth
              radius="md"
              size="sm"
              leftSection={<IconDownload size={16} />}
              className={classes.platformActionBtn}
            >
              {t("home.devices.windowsAction")}
            </Button>
          </div>
        </div>

        {/* 3. Mobile Apps Card */}
        <div className={classes.platformCardModern}>
          <div className={classes.platformCardHeader}>
            <div
              className={classes.platformIconBox}
              style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}
            >
              <IconDeviceMobile size={26} stroke={1.9} />
            </div>
            <span className={`${classes.platformPillBadge} ${classes.pillMobile}`}>
              {t("home.devices.mobileBadge")}
            </span>
          </div>

          <h3 className={classes.platformTitleModern}>
            {t("home.devices.mobileTitle")}
          </h3>
          <p className={classes.platformDescModern}>
            {t(
              "home.devices.mobileDesc"
            )}
          </p>

          <div className={classes.platformActionRow}>
            <div className={classes.mobileStoreButtonsGrid}>
              <Button
                component="a"
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                variant="default"
                radius="md"
                size="xs"
                className={classes.storeSmallBtn}
                leftSection={<IconBrandGooglePlay size={15} color="#00e676" />}
              >
                Google Play
              </Button>
              <Button
                component="a"
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                variant="default"
                radius="md"
                size="xs"
                className={classes.storeSmallBtn}
                leftSection={<IconBrandApple size={15} />}
              >
                App Store
              </Button>
            </div>
          </div>
        </div>

        {/* 4. Telegram Bot Card */}
        <div className={classes.platformCardModern}>
          <div className={classes.platformCardHeader}>
            <div
              className={classes.platformIconBox}
              style={{ backgroundColor: "rgba(0, 136, 204, 0.1)", color: "#0088cc" }}
            >
              <IconBrandTelegram size={26} stroke={1.9} />
            </div>
            <span className={`${classes.platformPillBadge} ${classes.pillTelegram}`}>
              {t("home.devices.telegramBadge")}
            </span>
          </div>

          <h3 className={classes.platformTitleModern}>
            {t("home.devices.telegramTitle")}
          </h3>
          <p className={classes.platformDescModern}>
            {t(
              "home.devices.telegramDesc"
            )}
          </p>

          <div className={classes.platformActionRow}>
            <Button
              component="a"
              href={TELEGRAM_BOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              variant="light"
              color="cyan"
              fullWidth
              radius="md"
              size="sm"
              rightSection={<IconExternalLink size={16} />}
              className={classes.platformActionBtn}
            >
              {t("home.devices.telegramAction")}
            </Button>
          </div>
        </div>
      </SimpleGrid>
    </section>
  );
});

Device_Platforms.displayName = "Device_Platforms";
