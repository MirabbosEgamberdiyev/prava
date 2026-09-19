import React from "react";
import { SimpleGrid } from "@mantine/core";
import {
  IconUserPlus,
  IconBook2,
  IconDeviceDesktopAnalytics,
  IconCertificate,
  IconRoute,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import classes from "./Home.module.css";

export const Learning_Flow = React.memo(() => {
  const { t } = useTranslation();

  const steps = [
    {
      num: "01",
      icon: IconUserPlus,
      title: t("home.howItWorks.step1Title", "Ro'yxatdan o'ting"),
      desc: t(
        "home.howItWorks.step1Desc",
        "Bepul hisob yarating va tizimga kiring"
      ),
      color: "#0b84f3",
      bg: "rgba(11, 132, 243, 0.1)",
    },
    {
      num: "02",
      icon: IconBook2,
      title: t("home.howItWorks.step2Title", "Testlarni yeching"),
      desc: t(
        "home.howItWorks.step2Desc",
        "Biletlar, alohida mavzular yoki marafon rejimida o'rganing"
      ),
      color: "#10b981",
      bg: "rgba(16, 185, 129, 0.1)",
    },
    {
      num: "03",
      icon: IconDeviceDesktopAnalytics,
      title: t("home.howItWorks.step3Title", "Imtihon simulyatorini topshiring"),
      desc: t(
        "home.howItWorks.step3Desc",
        "Haqiqiy sharoitda o'zingizni sinab ko'ring"
      ),
      color: "#6366f1",
      bg: "rgba(99, 102, 241, 0.1)",
    },
    {
      num: "04",
      icon: IconCertificate,
      title: t("home.howItWorks.step4Title", "Natijaga erishing"),
      desc: t(
        "home.howItWorks.step4Desc",
        "Bilimlaringizni mustahkamlang va imtihondan o'ting"
      ),
      color: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.1)",
    },
  ];

  return (
    <section className={classes.howItWorksSectionModern} id="how-it-works" aria-label={t("home.howItWorks.ariaLabel", "Qanday ishlaydi")}>
      <div className={classes.sectionHeaderCentered}>
        <div className={classes.sectionCategoryBadge}>
          <IconRoute size={14} />
          <span>{t("home.howItWorks.badge", "Oddiy va samarali")}</span>
        </div>
        <h2 className={classes.sectionHeaderTitle}>
          {t("home.howItWorks.title", "Qanday ishlaydi?")}
        </h2>
        <p className={classes.sectionHeaderSubtitle}>
          {t(
            "home.howItWorks.subtitle",
            "4 oddiy qadamda imtihonga tayyorlaning"
          )}
        </p>
      </div>

      <div className={classes.timelineContainer}>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing={{ base: "md", md: "lg" }}>
          {steps.map((step, idx) => {
            const IconComp = step.icon;
            return (
              <div key={step.num} className={classes.stepCardModern}>
                <div className={classes.stepHeaderRow}>
                  <div
                    className={classes.stepIconBox}
                    style={{ backgroundColor: step.bg, color: step.color }}
                  >
                    <IconComp size={22} stroke={2} />
                  </div>
                  <span className={classes.stepNumberTag}>{step.num}</span>
                </div>
                <h3 className={classes.stepTitleModern}>{step.title}</h3>
                <p className={classes.stepDescModern}>{step.desc}</p>
                {idx < steps.length - 1 && (
                  <div className={classes.timelineConnector} aria-hidden="true" />
                )}
              </div>
            );
          })}
        </SimpleGrid>
      </div>
    </section>
  );
});

Learning_Flow.displayName = "Learning_Flow";
