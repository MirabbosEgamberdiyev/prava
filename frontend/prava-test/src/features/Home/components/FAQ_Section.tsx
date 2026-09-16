import { Box, Text, Accordion, ThemeIcon } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
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

  // U2: "<" belgilari escape qilinadi — aks holda tarjima matnida "</script>"
  // ketma-ketligi bo'lib qolsa, brauzer HTML parseri script tegini muddatidan
  // oldin yopib, keyingi kontentni skript sifatida talqin qilishi mumkin edi.
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
    <section className={classes.faqSectionMinimal} aria-label="FAQ">
      <FAQStructuredData t={t} />
      <div className={classes.sectionHeaderCentered}>
        <h2 className={classes.sectionHeaderTitle}>
          {t("home.faq.title", "Ko'p so'raladigan savollar")}
        </h2>
        <p className={classes.sectionHeaderSubtitle}>
          {t(
            "home.faq.description",
            "Prava Online haqida bilishingiz kerak bo'lgan asosiy savollarga javoblar."
          )}
        </p>
      </div>

      <Box className={classes.faqContainerClean}>
        <Accordion
          variant="separated"
          radius="md"
          chevronPosition="right"
          defaultValue={null}
          chevron={
            <ThemeIcon variant="light" radius="xl" size="sm" color="gray">
              <IconPlus size={14} />
            </ThemeIcon>
          }
          classNames={{
            item: classes.faqItemClean,
          }}
        >
          {faqKeys.map((item, index) => (
            <Accordion.Item
              key={index}
              value={`item-${index}`}
            >
              <Accordion.Control>
                <Text fw={600} size="sm" c="var(--text)">
                  {t(item.questionKey)}
                </Text>
              </Accordion.Control>
              <Accordion.Panel>
                <Text size="sm" c="var(--text-muted)" lh={1.7}>
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
