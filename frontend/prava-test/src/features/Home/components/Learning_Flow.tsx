import React from "react";
import { SimpleGrid } from "@mantine/core";
import {
  IconDeviceLaptop,
  IconCheckbox,
  IconTrophy,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import classes from "./Home.module.css";

export const Learning_Flow = React.memo(() => {
  const { t } = useTranslation();

  const steps = [
    {
      num: 1,
      icon: IconDeviceLaptop,
      title: t("home.howItWorks.step1Title", "Ilovani oching"),
      desc: t(
        "home.howItWorks.step1Desc",
        "Brauzer orqali darhol kiring yoki Windows ilovani kompyuteringizga yuklab oling."
      ),
    },
    {
      num: 2,
      icon: IconCheckbox,
      title: t("home.howItWorks.step2Title", "Testlarni yeching"),
      desc: t(
        "home.howItWorks.step2Desc",
        "Biletlar, alohida mavzular yoki marafon rejimida bilimlaringizni sinovdan o'tkazing."
      ),
    },
    {
      num: 3,
      icon: IconTrophy,
      title: t("home.howItWorks.step3Title", "Imtihonga tayyor bo'ling"),
      desc: t(
        "home.howItWorks.step3Desc",
        "Xatolaringizni tahlil qilib, davlat imtihonini 100% birinchi urinishdayoq topshiring."
      ),
    },
  ];

  return (
    <section className={classes.howItWorksSectionMinimal} aria-label="How it works">
      <div className={classes.sectionHeaderCentered}>
        <h2 className={classes.sectionHeaderTitle}>
          {t("home.howItWorks.title", "Qanday ishlaydi?")}
        </h2>
        <p className={classes.sectionHeaderSubtitle}>
          {t(
            "home.howItWorks.subtitle",
            "3 oddiy qadamda imtihonga tayyorlaning"
          )}
        </p>
      </div>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
        {steps.map((step) => (
          <div key={step.num} className={classes.stepCardClean}>
            <div className={classes.stepCircleBadge}>{step.num}</div>
            <h3 className={classes.stepTitleClean}>{step.title}</h3>
            <p className={classes.stepDescClean}>{step.desc}</p>
          </div>
        ))}
      </SimpleGrid>
    </section>
  );
});

Learning_Flow.displayName = "Learning_Flow";

