import React from "react";
import { SimpleGrid } from "@mantine/core";
import {
  IconTicket,
  IconDeviceDesktopAnalytics,
  IconBrain,
  IconDevices,
  IconSparkles,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import classes from "./Home.module.css";

export const Key_Benefits = React.memo(() => {
  const { t } = useTranslation();

  const benefits = [
    {
      icon: IconTicket,
      title: t("home.benefits.card1Title", "70 ta rasmiy bilet"),
      desc: t(
        "home.benefits.card1Desc",
        "IIV YHXBB bazasidagi barcha 70 ta rasmiy bilet va 1,190+ savollar to'liq jamlangan."
      ),
      badge: t("home.benefits.card1Badge", "Rasmiy baza"),
      color: "#0b84f3",
      bg: "rgba(11, 132, 243, 0.1)",
    },
    {
      icon: IconDeviceDesktopAnalytics,
      title: t("home.benefits.card2Title", "Davlat imtihoni simulyatori"),
      desc: t(
        "home.benefits.card2Desc",
        "20 ta savol, 25 daqiqa vaqt va YHXK kompyuter markazidagi kabi haqiqiy imtihon muhiti."
      ),
      badge: t("home.benefits.card2Badge", "20 savol / 25 daqiqa"),
      color: "#6366f1",
      bg: "rgba(99, 102, 241, 0.1)",
    },
    {
      icon: IconBrain,
      title: t("home.benefits.card3Title", "Xatolar ustida ishlash"),
      desc: t(
        "home.benefits.card3Desc",
        "Siz adashgan savollar avtomatik saqlanadi va to'g'ri o'zlashtirilguncha qayta mashq qilinadi."
      ),
      badge: t("home.benefits.card3Badge", "Aqlli tahlil"),
      color: "#10b981",
      bg: "rgba(16, 185, 129, 0.1)",
    },
    {
      icon: IconDevices,
      title: t("home.benefits.card4Title", "Offline va barcha qurilmalar"),
      desc: t(
        "home.benefits.card4Desc",
        "Windows kompyuter uchun ilova internetsiz to'liq ishlaydi, shuningdek mobil telefon va vebda mavjud."
      ),
      badge: t("home.benefits.card4Badge", "Internetsiz (.exe)"),
      color: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.1)",
    },
  ];

  return (
    <section className={classes.benefitsSectionModern} id="benefits" aria-label={t("home.benefits.ariaLabel", "Asosiy afzalliklar")}>
      <div className={classes.sectionHeaderCentered}>
        <div className={classes.sectionCategoryBadge}>
          <IconSparkles size={14} />
          <span>{t("home.benefits.badge", "Asosiy afzalliklar")}</span>
        </div>
        <h2 className={classes.sectionHeaderTitle}>
          {t("home.benefits.heading", "Nima uchun Prava Online?")}
        </h2>
        <p className={classes.sectionHeaderSubtitle}>
          {t(
            "home.benefits.subheading",
            "Imtihonga tayyorlanishning eng samarali va zamonaviy yo'li"
          )}
        </p>
      </div>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={{ base: "md", md: "xl" }}>
        {benefits.map((benefit, idx) => {
          const IconComp = benefit.icon;
          return (
            <div key={idx} className={classes.benefitCardModern}>
              <div className={classes.benefitTopRow}>
                <div
                  className={classes.benefitIconSquare}
                  style={{ backgroundColor: benefit.bg, color: benefit.color }}
                >
                  <IconComp size={26} stroke={1.9} />
                </div>
                <span
                  className={classes.benefitPillBadge}
                  style={{
                    backgroundColor: benefit.bg,
                    color: benefit.color,
                    borderColor: benefit.color + "33",
                  }}
                >
                  {benefit.badge}
                </span>
              </div>
              <h3 className={classes.benefitTitleModern}>{benefit.title}</h3>
              <p className={classes.benefitDescModern}>{benefit.desc}</p>
            </div>
          );
        })}
      </SimpleGrid>
    </section>
  );
});

Key_Benefits.displayName = "Key_Benefits";
