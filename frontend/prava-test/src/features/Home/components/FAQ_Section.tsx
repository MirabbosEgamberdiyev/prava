import { Box, Text, Accordion, ThemeIcon } from "@mantine/core";
import { IconPlus, IconHelpCircle, IconArrowRight } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import classes from "./Home.module.css";

const faqKeys = [
  { questionKey: "home.faq.q1", answerKey: "home.faq.a1" },
  { questionKey: "home.faq.q2", answerKey: "home.faq.a2" },
  { questionKey: "home.faq.q3", answerKey: "home.faq.a3" },
  { questionKey: "home.faq.q4", answerKey: "home.faq.a4" },
  { questionKey: "home.faq.q5", answerKey: "home.faq.a5" },
  { questionKey: "home.faq.q6", answerKey: "home.faq.a6" },
];

function FAQStructuredData({ t }: { t: (key: string) => string }) {
  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqKeys.map((item) => ({
      "@type": "Question",
      name: t(item.questionKey),
      acceptedAnswer: {
        "@type": "Answer",
        text: t(item.answerKey),
      },
    })),
  };

  const json = JSON.stringify(faqData).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

export function FAQ_Section() {
  const { t } = useTranslation();

  return (
    <section className={classes.faqSectionModern} id="faq" aria-label={t("home.faq.ariaLabel", "Ko'p so'raladigan savollar")}>
      <FAQStructuredData t={t} />
      
      {/* Top Header Row with Title and Link */}
      <div className={classes.faqHeaderWrapper}>
        <div className={classes.faqHeaderLeft}>
          <div className={classes.sectionCategoryBadge}>
            <IconHelpCircle size={14} />
            <span>{t("home.faq.badge", "Savol-Javob")}</span>
          </div>
          <h2 className={classes.sectionHeaderTitle}>
            {t("home.faq.title", "Ko'p so'raladigan savollar")}
          </h2>
          <p className={classes.sectionHeaderSubtitle}>
            {t(
              "home.faq.subtitle",
              "Platformamiz haqida eng ko'p beriladigan savollarga javoblar."
            )}
          </p>
        </div>

        <div className={classes.faqHeaderRight}>
          <Link to="/faq" className={classes.faqViewAllLink}>
            <span>{t("home.faq.viewAll", "Barcha savollar")}</span>
            <IconArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Accordion Container */}
      <Box className={classes.faqContainerModern}>
        <Accordion
          variant="separated"
          radius="md"
          chevronPosition="right"
          defaultValue="item-0"
          chevron={
            <ThemeIcon variant="light" radius="xl" size="sm" color="blue" className={classes.faqChevronIcon}>
              <IconPlus size={14} />
            </ThemeIcon>
          }
          classNames={{
            item: classes.faqItemModern,
            control: classes.faqControlModern,
            panel: classes.faqPanelModern,
          }}
        >
          {faqKeys.map((item, index) => (
            <Accordion.Item
              key={index}
              value={`item-${index}`}
            >
              <Accordion.Control>
                <Text fw={600} size="md" c="var(--text)" className={classes.faqQuestionText}>
                  {t(item.questionKey)}
                </Text>
              </Accordion.Control>
              <Accordion.Panel>
                <Text size="sm" c="var(--text-muted)" lh={1.7} className={classes.faqAnswerText}>
                  {t(item.answerKey)}
                </Text>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </Box>
    </section>
  );
}
