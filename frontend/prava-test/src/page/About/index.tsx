import {
  Badge,
  Box,
  Divider,
  Flex,
  Grid,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconTarget,
  IconBrain,
  IconDeviceDesktop,
  IconShieldCheck,
  IconArrowRight,
  IconCircleCheck,
  IconSparkles,
} from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCurriculumCountParams } from "../../hooks/useCurriculumCounts";
import SEO from "../../components/common/SEO";

export default function About_Page() {
  const { t } = useTranslation();
  const countParams = useCurriculumCountParams();

  const values = [
    {
      icon: IconTarget,
      title: t("about.val1Title"),
      desc: t(
        "about.val1Desc",
        countParams
      ),
      color: "blue",
    },
    {
      icon: IconBrain,
      title: t("about.val2Title"),
      desc: t(
        "about.val2Desc"
      ),
      color: "blue",
    },
    {
      icon: IconDeviceDesktop,
      title: t("about.val3Title"),
      desc: t(
        "about.val3Desc"
      ),
      color: "blue",
    },
    {
      icon: IconShieldCheck,
      title: t("about.val4Title"),
      desc: t(
        "about.val4Desc",
        { tickets: countParams.tickets }
      ),
      color: "blue",
    },
  ];

  const milestones = [
    { number: countParams.questions, label: t("about.stat1") },
    { number: countParams.tickets, label: t("about.stat2") },
    { number: "24/7", label: t("about.stat3") },
    { number: "3", label: t("about.stat4") },
  ];

  const reasons = [
    {
      title: t("about.reason1Title"),
      desc: t(
        "about.reason1Desc"
      ),
    },
    {
      title: t("about.reason2Title"),
      desc: t(
        "about.reason2Desc"
      ),
    },
    {
      title: t("about.reason3Title"),
      desc: t(
        "about.reason3Desc"
      ),
    },
    {
      title: t("about.reason4Title"),
      desc: t(
        "about.reason4Desc"
      ),
    },
  ];

  return (
    <>
      <SEO
        title={t("seo.about.title")}
        description={t("seo.about.desc")}
        keywords="prava online biz haqimizda, haydovchilik imtihoniga tayyorlanish platformasi, avtomaktab online test, prava online missiyasi, haydovchilik guvohnomasi o'qitish tizimi"
        canonical="/about"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "Biz haqimizda — Prava Online",
          description: "O'zbekistonda haydovchilik guvohnomasi nazariy imtihoniga zamonaviy tayyorgarlik tizimi",
          url: "https://pravaonline.uz/about",
          mainEntity: {
            "@type": "Organization",
            name: "Prava Online",
            url: "https://pravaonline.uz",
            logo: "https://pravaonline.uz/logo.svg",
          },
        }}
      />

      <div className="saas-page-container">
        {/* Header Block */}
        <div className="saas-header-block">
          <div className="saas-badge-pill">
            <IconSparkles size={13} />
            <span>{t("about.badge")}</span>
          </div>
          <h1 className="saas-page-title">
            {t("about.title")}
          </h1>
          <p className="saas-page-subtitle">
            {t(
              "about.subtitle"
            )}
          </p>
        </div>

        {/* Mission & Overview Section */}
        <Grid gutter={{ base: "xl", md: 48 }} align="center" mb={64}>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="md">
              <Badge color="blue" variant="light" size="md" w="fit-content">
                {t("about.missionBadge")}
              </Badge>
              <Title order={2} style={{ fontSize: "clamp(1.5rem, 2.2vw, 2rem)", lineHeight: 1.25 }}>
                {t(
                  "about.missionTitle"
                )}
              </Title>
              <Text size="md" c="dimmed" lh={1.7}>
                {t(
                  "about.storyP1"
                )}
              </Text>
              <Text size="md" c="dimmed" lh={1.7}>
                {t(
                  "about.storyP2"
                )}
              </Text>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <div className="saas-card">
              <Group gap="md" mb="lg">
                <ThemeIcon size={48} radius="md" color="blue" variant="light">
                  <IconShieldCheck size={26} />
                </ThemeIcon>
                <div>
                  <Text fw={700} size="lg">
                    {t("about.cardTitle")}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {t("about.cardSub")}
                  </Text>
                </div>
              </Group>
              <Divider mb="lg" />
              <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="md">
                {milestones.map((m, idx) => (
                  <div key={idx} className="saas-card-flat" style={{ padding: "16px" }}>
                    <Text fw={800} size="1.6rem" c="blue.6" className="font-tabular" style={{ lineHeight: 1.2 }}>
                      {m.number}
                    </Text>
                    <Text size="xs" c="dimmed" mt={4} fw={500}>
                      {m.label}
                    </Text>
                  </div>
                ))}
              </SimpleGrid>
            </div>
          </Grid.Col>
        </Grid>

        {/* Why Prava Online - 4 Pillars */}
        <Box mb={64}>
          <div className="saas-header-block" style={{ marginBottom: 32 }}>
            <h2 className="saas-page-title" style={{ fontSize: "clamp(1.5rem, 2.2vw, 2rem)" }}>
              {t("about.valuesTitle")}
            </h2>
            <p className="saas-page-subtitle">
              {t(
                "about.valuesSub"
              )}
            </p>
          </div>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            {values.map((v, idx) => (
              <div key={idx} className="saas-card" style={{ height: "100%" }}>
                <Group wrap="nowrap" align="flex-start" gap="md">
                  <ThemeIcon size={44} radius="md" color={v.color} variant="light">
                    <v.icon size={24} />
                  </ThemeIcon>
                  <div>
                    <Text fw={700} size="md" mb={8}>
                      {v.title}
                    </Text>
                    <Text size="sm" c="dimmed" lh={1.6}>
                      {v.desc}
                    </Text>
                  </div>
                </Group>
              </div>
            ))}
          </SimpleGrid>
        </Box>

        {/* The Problem We Solve */}
        <div className="saas-card" style={{ marginBottom: 64, padding: "32px 24px" }}>
          <Stack gap="xl">
            <div>
              <Badge color="teal" variant="light" size="md" mb="xs">
                {t("about.problemBadge")}
              </Badge>
              <Title order={2} style={{ fontSize: "clamp(1.35rem, 2vw, 1.75rem)" }}>
                {t("about.problemTitle")}
              </Title>
            </div>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
              {reasons.map((r, idx) => (
                <Group key={idx} align="flex-start" wrap="nowrap" gap="sm">
                  <ThemeIcon size={28} radius="xl" color="teal" variant="light" mt={2}>
                    <IconCircleCheck size={16} />
                  </ThemeIcon>
                  <Stack gap={4}>
                    <Text fw={600} size="sm">
                      {r.title}
                    </Text>
                    <Text size="xs" c="dimmed" lh={1.6}>
                      {r.desc}
                    </Text>
                  </Stack>
                </Group>
              ))}
            </SimpleGrid>
          </Stack>
        </div>

        {/* Clean SaaS CTA Banner */}
        <div
          className="saas-card"
          style={{
            textAlign: "center",
            padding: "48px 24px",
            background: "var(--surface)",
            borderColor: "var(--primary)",
          }}
        >
          <Stack align="center" gap="md" maw={640} mx="auto">
            <h2 className="saas-page-title" style={{ fontSize: "clamp(1.5rem, 2.2vw, 2rem)" }}>
              {t("about.ctaTitle")}
            </h2>
            <p className="saas-page-subtitle">
              {t(
                "about.ctaDesc"
              )}
            </p>
            <Flex
              direction={{ base: "column", sm: "row" }}
              justify="center"
              align="center"
              gap="md"
              mt="sm"
              w={{ base: "100%", sm: "auto" }}
            >
              <Link to="/auth/register" className="saas-btn-primary">
                {t("home.hero.startFree")}
                <IconArrowRight size={16} />
              </Link>
              <Link to="/partners" className="saas-btn-secondary">
                {t("nav.corporate")}
              </Link>
            </Flex>
          </Stack>
        </div>
      </div>
    </>
  );
}
