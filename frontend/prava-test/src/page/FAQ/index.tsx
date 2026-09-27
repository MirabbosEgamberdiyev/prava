import { useState, useMemo, useEffect } from "react";
import {
  Accordion,
  ActionIcon,
  Box,
  Center,
  Group,
  Stack,
  Tabs,
  Text,
  TextInput,
  ThemeIcon,
} from "@mantine/core";
import {
  IconSearch,
  IconPlus,
  IconHelpCircle,
  IconMessageCircleQuestion,
  IconArrowRight,
  IconBrandTelegram,
  IconSparkles,
  IconX,
} from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SEO from "../../components/common/SEO";
import { useCurriculumCountParams } from "../../hooks/useCurriculumCounts";
import { useExamRules } from "../../services/examRules";

interface FAQItem {
  id: string;
  category: "exam" | "payment" | "app" | "account";
  question: string;
  answer: string;
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  const cleanQuery = query.trim();
  if (!cleanQuery) return <>{text}</>;
  try {
    const escaped = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark
              key={i}
              style={{
                backgroundColor: "rgba(34, 139, 230, 0.25)",
                color: "inherit",
                borderRadius: "3px",
                padding: "1px 3px",
                fontWeight: 700,
              }}
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  } catch {
    return <>{text}</>;
  }
}

export default function FAQ_Page() {
  const { t } = useTranslation();
  const { tickets: ticketsCount, questions: questionsCount } = useCurriculumCountParams();
  const { questionCount, secondsPerQuestion, maxWrong } = useExamRules().real;
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 150);
    return () => clearTimeout(timer);
  }, [search]);

  const faqs: FAQItem[] = useMemo(
    () => [
      // Imtihon
      {
        id: "exam-1",
        category: "exam",
        question: t("faq.q1"),
        answer: t(
          "faq.a1",
          { tickets: ticketsCount, questions: questionsCount }
        ),
      },
      {
        id: "exam-2",
        category: "exam",
        question: t("faq.q2"),
        answer: t(
          "faq.a2",
          {
            count: questionCount,
            minutes: Math.round((questionCount * secondsPerQuestion) / 60),
            minCorrect: Math.max(0, questionCount - maxWrong),
            max: maxWrong,
          }
        ),
      },
      {
        id: "exam-3",
        category: "exam",
        question: t("faq.q3"),
        answer: t("faq.a3"),
      },
      {
        id: "exam-4",
        category: "exam",
        question: t("faq.q4"),
        answer: t(
          "faq.a4",
          { tickets: ticketsCount, questions: questionsCount }
        ),
      },
      {
        id: "exam-5",
        category: "exam",
        question: t("faq.q12"),
        answer: t(
          "faq.a12"
        ),
      },
      // To'lov
      {
        id: "pay-1",
        category: "payment",
        question: t("faq.q5"),
        answer: t(
          "faq.a5"
        ),
      },
      {
        id: "pay-2",
        category: "payment",
        question: t("faq.q6"),
        answer: t(
          "faq.a6"
        ),
      },
      {
        id: "pay-3",
        category: "payment",
        question: t("faq.q7"),
        answer: t(
          "faq.a7"
        ),
      },
      // Ilovalar & Offline
      {
        id: "app-1",
        category: "app",
        question: t("faq.q8"),
        answer: t(
          "faq.a8"
        ),
      },
      {
        id: "app-2",
        category: "app",
        question: t("faq.q9"),
        answer: t(
          "faq.a9"
        ),
      },
      // Akkaunt
      {
        id: "acc-1",
        category: "account",
        question: t("faq.q10"),
        answer: t(
          "faq.a10"
        ),
      },
      {
        id: "acc-2",
        category: "account",
        question: t("faq.q11"),
        answer: t(
          "faq.a11"
        ),
      },
    ],
    [t, ticketsCount, questionsCount, questionCount, secondsPerQuestion, maxWrong]
  );

  const filteredFaqs = useMemo(() => {
    return faqs.filter((item) => {
      const matchCategory = activeTab === "all" || item.category === activeTab;
      const query = debouncedSearch.toLowerCase().trim();
      const matchSearch =
        !query ||
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query);
      return matchCategory && matchSearch;
    });
  }, [faqs, activeTab, debouncedSearch]);

  const jsonLdData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };

  return (
    <>
      <SEO title={t("seo.faq.title")} description={t("seo.faq.desc")}
        keywords="prava online faq, haydovchilik imtihoni savollar javoblar, prava test qanday ishlaydi, YHXBB imtihon qoidalari"
        canonical="/faq"
        jsonLd={jsonLdData}
      />

      <div className="saas-page-container">
        {/* Header Block */}
        <div className="saas-header-block">
          <div className="saas-badge-pill">
            <IconSparkles size={13} />
            <span>{t("faq.badge")}</span>
          </div>
          <h1 className="saas-page-title">{t("faq.pageTitle")}</h1>
          <p className="saas-page-subtitle">
            {t(
              "faq.pageSub"
            )}
          </p>

          {/* Search Input */}
          <Box w="100%" maw={{ base: "100%", sm: 560, md: 680 }} mt="sm">
            <TextInput
              placeholder={t("faq.searchPlaceholder")}
              size="md"
              radius="xl"
              leftSection={<IconSearch size={18} />}
              rightSection={
                search ? (
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="gray"
                    onClick={() => setSearch("")}
                    aria-label={t("common.clear")}
                  >
                    <IconX size={14} />
                  </ActionIcon>
                ) : null
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={t("faq.searchPlaceholder")}
            />
          </Box>
        </div>

        {/* Categories Tabs */}
        <Tabs
          value={activeTab}
          onChange={(v) => setActiveTab(v || "all")}
          variant="pills"
          radius="xl"
          mb="xl"
        >
          <Tabs.List justify="center" style={{ flexWrap: "wrap", justifyContent: "center", gap: 6 }}>
            <Tabs.Tab value="all">{t("faq.tabAll")}</Tabs.Tab>
            <Tabs.Tab value="exam">{t("faq.tabExam")}</Tabs.Tab>
            <Tabs.Tab value="payment">{t("faq.tabPayment")}</Tabs.Tab>
            <Tabs.Tab value="app">{t("faq.tabApp")}</Tabs.Tab>
            <Tabs.Tab value="account">{t("faq.tabAccount")}</Tabs.Tab>
          </Tabs.List>
        </Tabs>

        {/* Questions Accordion */}
        <Box maw={{ base: "100%", md: 1080, xl: 1240 }} mx="auto" mb={64}>
          {filteredFaqs.length === 0 ? (
            <Center py={64}>
              <Stack align="center" gap="xs">
                <IconHelpCircle size={48} color="var(--text-muted)" style={{ opacity: 0.4 }} />
                <Text c="dimmed" size="md">
                  {t("faq.notFound")}
                </Text>
              </Stack>
            </Center>
          ) : (
            <Accordion
              variant="separated"
              radius="md"
              chevronPosition="right"
              defaultValue={filteredFaqs[0]?.id}
              chevron={
                <ThemeIcon variant="light" radius="xl" size="sm">
                  <IconPlus size={14} />
                </ThemeIcon>
              }
            >
              {filteredFaqs.map((faq) => (
                <Accordion.Item
                  key={faq.id}
                  value={faq.id}
                  style={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border)",
                    boxShadow: "var(--card-shadow-sm)",
                    borderRadius: "var(--radius-md, 16px)",
                    marginBottom: 12,
                    overflow: "hidden",
                  }}
                >
                  <Accordion.Control style={{ fontSize: 15, fontWeight: 600 }}>
                    <HighlightMatch text={faq.question} query={debouncedSearch} />
                  </Accordion.Control>
                  <Accordion.Panel style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7 }}>
                    <HighlightMatch text={faq.answer} query={debouncedSearch} />
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          )}
        </Box>

        {/* Still Have Questions Banner */}
        <div
          className="saas-card"
          style={{
            maxWidth: 1240,
            margin: "0 auto",
            textAlign: "center",
            padding: "40px 24px",
          }}
        >
          <Stack align="center" gap="xs">
            <ThemeIcon size={48} radius="xl" color="blue" variant="light">
              <IconMessageCircleQuestion size={26} />
            </ThemeIcon>
            <Text fw={700} size="lg">
              {t("faq.stillQuestions")}
            </Text>
            <Text size="sm" c="dimmed" maw={480} lh={1.5}>
              {t(
                "faq.stillQuestionsSub"
              )}
            </Text>
            <Group gap="sm" mt="xs">
              <Link to="/contact" className="saas-btn-primary">
                {t("contact.title")}
                <IconArrowRight size={15} />
              </Link>
              <a
                href="https://t.me/pravaonlineuz"
                target="_blank"
                rel="noopener noreferrer"
                className="saas-btn-secondary"
              >
                <IconBrandTelegram size={16} />
                Telegram
              </a>
            </Group>
          </Stack>
        </div>
      </div>
    </>
  );
}
