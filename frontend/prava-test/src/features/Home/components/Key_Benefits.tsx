import React from "react";
import { SimpleGrid } from "@mantine/core";
import {
  IconTicket,
  IconDeviceDesktopAnalytics,
  IconBrain,
  IconDevices,
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
        "IIV YHXBB bazasidagi barcha 70 ta rasmiy bilet va 1200+ savollar to'liq jamlangan."
      ),
      color: "#0284c7",
      bg: "rgba(2, 132, 199, 0.1)",
    },
    {
      icon: IconDeviceDesktopAnalytics,
      title: t("home.benefits.card2Title", "Davlat imtihoni simulyatori"),
      desc: t(
        "home.benefits.card2Desc",
        "20 ta savol, 25 daqiqa vaqt va YHXX kompyuter markazidagi kabi haqiqiy imtihon muhiti."
      ),
      color: "#4f46e5",
      bg: "rgba(79, 70, 229, 0.1)",
    },
    {
      icon: IconBrain,
      title: t("home.benefits.card3Title", "Xatolar ustida ishlash"),
      desc: t(
        "home.benefits.card3Desc",
        "Siz adashgan savollar avtomatik saqlanadi va to'liq o'zlashtirilgunga qadar qayta mashq qildiriladi."
      ),
      color: "#059669",
      bg: "rgba(5, 150, 105, 0.1)",
    },
    {
      icon: IconDevices,
      title: t("home.benefits.card4Title", "Offline va barcha qurilmalar"),
      desc: t(
        "home.benefits.card4Desc",
        "Windows kompyuter uchun ilova internetsiz to'liq ishlaydi, shuningdek mobil telefon va vebda mavjud."
      ),
      color: "#d97706",
      bg: "rgba(217, 119, 6, 0.1)",
    },
  ];

  return (
    <section className={classes.benefitsSectionMinimal} aria-label="Key Benefits">
      <div className={classes.sectionHeaderCentered}>
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

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
        {benefits.map((benefit, idx) => (
          <div key={idx} className={classes.benefitCardClean}>
            <div
              className={classes.benefitIconSquare}
              style={{ backgroundColor: benefit.bg, color: benefit.color }}
            >
              <benefit.icon size={24} stroke={1.8} />
            </div>
            <h3 className={classes.benefitTitleClean}>{benefit.title}</h3>
            <p className={classes.benefitDescClean}>{benefit.desc}</p>
          </div>
        ))}
      </SimpleGrid>
    </section>
  );
});

Key_Benefits.displayName = "Key_Benefits";

