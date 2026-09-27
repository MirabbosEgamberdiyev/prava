import { useState } from "react";
import {
  Badge,
  Box,
  Button,
  Center,
  Divider,
  Flex,
  Group,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
  SegmentedControl,
  Accordion,
} from "@mantine/core";
import {
  IconCheck,
  IconX,
  IconSparkles,
  IconShieldCheck,
  IconHelpCircle,
  IconFlame,
  IconStar,
  IconSchool,
} from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCurriculumCountParams, useCurriculumCounts } from "../../hooks/useCurriculumCounts";
import SEO from "../../components/common/SEO";
import { getWebAppUrl } from "../../utils/domain";

/** To'lov tizimlari nomlari (brend nomlari — tarjima qilinmaydi). */
const PAYMENT_BRANDS = [
  { name: "Payme", color: "blue" },
  { name: "Click", color: "cyan" },
  { name: "Uzum Bank", color: "grape" },
  { name: "Uzcard / Humo", color: "gray" },
  { name: "Visa / Mastercard", color: "indigo" },
] as const;

const BUTTON_LABEL_STYLE = { overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 } as const;

export default function Pricing_Page() {
  const { t } = useTranslation();
  const countParams = useCurriculumCountParams();
  const counts = useCurriculumCounts();
  const [billingCycle, setBillingCycle] = useState<string>("monthly");

  const isQuarterly = billingCycle === "quarterly";

  const comparisonFeatures = [
    {
      name: t("pricing.feat1"),
      free: t("pricing.feat1Free"),
      standard: t("pricing.feat1Full", { count: counts.questions }),
      premium: t("pricing.feat1Full", { count: counts.questions }),
    },
    {
      name: t("pricing.feat2"),
      free: t("pricing.feat2Free"),
      standard: t("pricing.feat2Full", { count: counts.tickets }),
      premium: t("pricing.feat2Full", { count: counts.tickets }),
    },
    {
      name: t("pricing.feat3"),
      free: t("pricing.feat3Free"),
      standard: t("pricing.featUnlimited"),
      premium: t("pricing.featUnlimited"),
    },
    {
      name: t("pricing.feat4"),
      free: true,
      standard: true,
      premium: true,
    },
    {
      name: t("pricing.feat5"),
      free: false,
      standard: true,
      premium: true,
    },
    {
      name: t("pricing.feat6"),
      free: false,
      standard: true,
      premium: true,
    },
    {
      name: t("pricing.feat7"),
      free: false,
      standard: false,
      premium: true,
    },
    {
      name: t("pricing.feat8"),
      free: false,
      standard: false,
      premium: true,
    },
    {
      name: t("pricing.feat9"),
      free: false,
      standard: false,
      premium: true,
    },
    {
      name: t("pricing.feat10"),
      free: false,
      standard: t("pricing.standardSupport"),
      premium: t("pricing.vipSupport"),
    },
  ];

  const pricingFaqs = [
    {
      id: "pr-1",
      question: t("pricing.faq1Q"),
      answer: t(
        "pricing.faq1A"
      ),
    },
    {
      id: "pr-2",
      question: t("pricing.faq2Q"),
      answer: t(
        "pricing.faq2A"
      ),
    },
    {
      id: "pr-3",
      question: t("pricing.faq3Q"),
      answer: t(
        "pricing.faq3A"
      ),
    },
    {
      id: "pr-4",
      question: t("pricing.faq4Q"),
      answer: t(
        "pricing.faq4A"
      ),
    },
  ];

  return (
    <>
      <SEO
        title={t("seo.pricing.title")}
        description={t("seo.pricing.desc", countParams)}
        keywords="prava online narxlar, prava test tariflar, haydovchilik imtihoni obuna, avtomaktab test narxi, prava desktop litsenziya"
        canonical="/pricing"
      />

      <div className="saas-page-container">
        {/* Header Block */}
        <div className="saas-header-block">
          <div className="saas-badge-pill">
            <IconSparkles size={13} />
            <span>{t("pricing.badge")}</span>
          </div>

          <Title order={1} className="saas-page-title">
            {t("pricing.title")}
          </Title>

          <Text size="md" c="var(--text-muted)" className="saas-page-subtitle">
            {t("pricing.subtitle", countParams)}
          </Text>

          {/* Billing Cycle Switcher */}
          <Box mt="lg">
            <SegmentedControl
              value={billingCycle}
              onChange={setBillingCycle}
              radius="xl"
              size="md"
              data={[
                { label: t("pricing.monthly"), value: "monthly" },
                {
                  label: (
                    <Center style={{ gap: 8 }}>
                      <span>{t("pricing.quarterly")}</span>
                      <Badge size="xs" color="teal" variant="filled">
                        -25%
                      </Badge>
                    </Center>
                  ),
                  value: "quarterly",
                },
              ]}
            />
          </Box>
        </div>

        {/* 4 Cards Grid */}
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg" mb={64}>
          {/* Card 1: Free Trial */}
          <div
            className="saas-card"
            style={{
              display: "flex",
              flexDirection: "column",
              padding: 24,
              borderRadius: 20,
              height: "100%",
            }}
          >
            <Box mb="md">
              <Badge color="gray" variant="light" size="sm" mb="xs">
                {t("pricing.freeBadge")}
              </Badge>
              <Text fw={800} size="xl">
                {t("pricing.freePlanName")}
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                {t("pricing.freePlanDesc")}
              </Text>
            </Box>

            <Box my="sm">
              <Text fw={900} size="2rem" style={{ lineHeight: 1 }}>
                0 <span style={{ fontSize: "1rem", fontWeight: 600 }}>UZS</span>
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                {t("pricing.foreverFree")}
              </Text>
            </Box>

            <Divider my="sm" />

            <Stack gap={10} mb="xl" style={{ flexGrow: 1 }}>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="teal" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4}>
                  {t("pricing.freeF1")}
                </Text>
              </Group>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="teal" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4}>
                  {t("pricing.freeF2")}
                </Text>
              </Group>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="teal" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4}>
                  {t("pricing.freeF3")}
                </Text>
              </Group>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="gray" variant="light">
                  <IconX size={12} />
                </ThemeIcon>
                <Text size="xs" c="dimmed" lh={1.4}>
                  {t("pricing.freeF4Locked", { count: counts.tickets })}
                </Text>
              </Group>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="gray" variant="light">
                  <IconX size={12} />
                </ThemeIcon>
                <Text size="xs" c="dimmed" lh={1.4}>
                  {t("pricing.freeF5Locked")}
                </Text>
              </Group>
            </Stack>

            <Button
              title={t("pricing.tryFreeBtn")}
              component={Link}
              to="/try-exam"
              variant="default"
              radius="md"
              fullWidth
              size="sm"
            >
              <span style={BUTTON_LABEL_STYLE}>{t("pricing.tryFreeBtn")}</span>
            </Button>
          </div>

          {/* Card 2: Standart (1 Oylik) - Highlighted */}
          <div
            className="saas-card"
            style={{
              display: "flex",
              flexDirection: "column",
              padding: 24,
              borderRadius: 20,
              height: "100%",
              position: "relative",
              border: "2px solid var(--primary)",
              background: "var(--card-highlight-bg, rgba(var(--primary-rgb), 0.03))",
            }}
          >
            <Box mb="md">
              <Group justify="space-between" align="center">
                <Badge color="blue" variant="filled" size="sm" leftSection={<IconFlame size={12} />}>
                  {t("pricing.popularBadge")}
                </Badge>
              </Group>
              <Text fw={800} size="xl" mt="xs">
                {t("pricing.stdPlanName")}
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                {t("pricing.stdPlanDesc")}
              </Text>
            </Box>

            <Box my="sm">
              <Text fw={900} size="2rem" c="var(--primary)" style={{ lineHeight: 1 }}>
                {isQuarterly ? "39 000" : "49 000"}{" "}
                <span style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text)" }}>UZS</span>
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                {isQuarterly ? t("pricing.perMonthQuarterly") : t("pricing.perMonth")}
              </Text>
            </Box>

            <Divider my="sm" />

            <Stack gap={10} mb="xl" style={{ flexGrow: 1 }}>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="blue" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4} fw={600}>
                  {t("pricing.stdF1", {
                    ticketsCount: countParams.tickets,
                    questionsCount: countParams.questions,
                  })}
                </Text>
              </Group>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="blue" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4}>
                  {t("pricing.stdF2")}
                </Text>
              </Group>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="blue" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4}>
                  {t("pricing.stdF3")}
                </Text>
              </Group>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="blue" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4}>
                  {t("pricing.stdF4")}
                </Text>
              </Group>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="blue" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4}>
                  {t("pricing.stdF5")}
                </Text>
              </Group>
            </Stack>

            <Button
              title={t("pricing.stdChooseBtn")}
              component="a"
              href={getWebAppUrl("/packages")}
              className="saas-btn-primary"
              radius="md"
              fullWidth
              size="sm"
            >
              <span style={BUTTON_LABEL_STYLE}>{t("pricing.stdChooseBtn")}</span>
            </Button>
          </div>

          {/* Card 3: Premium VIP (3 Oylik Kafolat) */}
          <div
            className="saas-card"
            style={{
              display: "flex",
              flexDirection: "column",
              padding: 24,
              borderRadius: 20,
              height: "100%",
              position: "relative",
            }}
          >
            <Box mb="md">
              <Badge color="violet" variant="light" size="sm" mb="xs" leftSection={<IconStar size={12} />}>
                {t("pricing.bestValueBadge")}
              </Badge>
              <Text fw={800} size="xl">
                {t("pricing.vipPlanName")}
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                {t("pricing.vipPlanDesc")}
              </Text>
            </Box>

            <Box my="sm">
              <Text fw={900} size="2rem" style={{ lineHeight: 1 }}>
                {isQuarterly ? "99 000" : "129 000"}{" "}
                <span style={{ fontSize: "1rem", fontWeight: 600 }}>UZS</span>
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                {isQuarterly ? t("pricing.per3Months") : t("pricing.perMonth")}
              </Text>
            </Box>

            <Divider my="sm" />

            <Stack gap={10} mb="xl" style={{ flexGrow: 1 }}>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="teal" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4} fw={600}>
                  {t("pricing.vipF1")}
                </Text>
              </Group>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="teal" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4}>
                  {t("pricing.vipF2")}
                </Text>
              </Group>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="teal" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4}>
                  {t("pricing.vipF3")}
                </Text>
              </Group>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="teal" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4}>
                  {t("pricing.vipF4")}
                </Text>
              </Group>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="teal" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4}>
                  {t("pricing.vipF5")}
                </Text>
              </Group>
            </Stack>

            <Button
              title={t("pricing.vipChooseBtn")}
              component="a"
              href={getWebAppUrl("/packages")}
              variant="light"
              color="violet"
              radius="md"
              fullWidth
              size="sm"
            >
              <span style={BUTTON_LABEL_STYLE}>{t("pricing.vipChooseBtn")}</span>
            </Button>
          </div>

          {/* Card 4: Avtomaktablar va Hamkorlar (B2B) */}
          <div
            className="saas-card"
            style={{
              display: "flex",
              flexDirection: "column",
              padding: 24,
              borderRadius: 20,
              height: "100%",
            }}
          >
            <Box mb="md">
              <Badge color="orange" variant="light" size="sm" mb="xs" leftSection={<IconSchool size={12} />}>
                {t("pricing.corpBadge")}
              </Badge>
              <Text fw={800} size="xl">
                {t("pricing.corpPlanName")}
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                {t("pricing.corpPlanDesc")}
              </Text>
            </Box>

            <Box my="sm">
              <Text fw={900} size="1.6rem" style={{ lineHeight: 1.2 }}>
                {t("pricing.corpPrice")}
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                {t("pricing.corpSub")}
              </Text>
            </Box>

            <Divider my="sm" />

            <Stack gap={10} mb="xl" style={{ flexGrow: 1 }}>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="orange" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4}>
                  {t("pricing.corpF1")}
                </Text>
              </Group>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="orange" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4}>
                  {t("pricing.corpF2")}
                </Text>
              </Group>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="orange" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4}>
                  {t("pricing.corpF3")}
                </Text>
              </Group>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="orange" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4}>
                  {t("pricing.corpF4")}
                </Text>
              </Group>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="orange" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4}>
                  {t("pricing.corpF5")}
                </Text>
              </Group>
            </Stack>

            <Button
              title={t("pricing.corpConsultBtn")}
              component={Link}
              to="/partners"
              variant="outline"
              color="orange"
              radius="md"
              fullWidth
              size="sm"
            >
              <span style={BUTTON_LABEL_STYLE}>{t("pricing.corpConsultBtn")}</span>
            </Button>
          </div>
        </SimpleGrid>

        {/* Feature Comparison Matrix Table */}
        <div className="saas-card" style={{ padding: "32px 24px", marginBottom: 64, borderRadius: 20 }}>
          <Title order={2} size="h3" mb="xs" ta="center">
            {t("pricing.matrixTitle")}
          </Title>
          <Text size="sm" c="dimmed" ta="center" mb="xl">
            {t("pricing.matrixSub")}
          </Text>

          <Box style={{ overflowX: "auto" }}>
            <Table striped highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: "40%" }}>{t("pricing.tableColFeat")}</Table.Th>
                  <Table.Th style={{ textAlign: "center", width: "20%" }}>{t("pricing.freePlanName")}</Table.Th>
                  <Table.Th style={{ textAlign: "center", width: "20%" }}>{t("pricing.stdPlanName")}</Table.Th>
                  <Table.Th style={{ textAlign: "center", width: "20%" }}>{t("pricing.vipPlanName")}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {comparisonFeatures.map((feat, idx) => (
                  <Table.Tr key={idx}>
                    <Table.Td style={{ fontWeight: 500, fontSize: "0.875rem" }}>
                      {feat.name}
                    </Table.Td>
                    <Table.Td style={{ textAlign: "center" }}>
                      {typeof feat.free === "boolean" ? (
                        feat.free ? (
                          <ThemeIcon size={20} radius="xl" color="teal" variant="light">
                            <IconCheck size={14} />
                          </ThemeIcon>
                        ) : (
                          <ThemeIcon size={20} radius="xl" color="gray" variant="light">
                            <IconX size={14} />
                          </ThemeIcon>
                        )
                      ) : (
                        <Text size="xs" fw={600} c="dimmed">
                          {feat.free}
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td style={{ textAlign: "center" }}>
                      {typeof feat.standard === "boolean" ? (
                        feat.standard ? (
                          <ThemeIcon size={20} radius="xl" color="blue" variant="light">
                            <IconCheck size={14} />
                          </ThemeIcon>
                        ) : (
                          <ThemeIcon size={20} radius="xl" color="gray" variant="light">
                            <IconX size={14} />
                          </ThemeIcon>
                        )
                      ) : (
                        <Text size="xs" fw={700} c="var(--primary)">
                          {feat.standard}
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td style={{ textAlign: "center" }}>
                      {typeof feat.premium === "boolean" ? (
                        feat.premium ? (
                          <ThemeIcon size={20} radius="xl" color="violet" variant="light">
                            <IconCheck size={14} />
                          </ThemeIcon>
                        ) : (
                          <ThemeIcon size={20} radius="xl" color="gray" variant="light">
                            <IconX size={14} />
                          </ThemeIcon>
                        )
                      ) : (
                        <Text size="xs" fw={700} c="violet">
                          {feat.premium}
                        </Text>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>
        </div>

        {/* Payment Methods & Security Guarantee Banner */}
        <div
          className="saas-card"
          style={{
            padding: "28px 24px",
            marginBottom: 64,
            borderRadius: 20,
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <Flex
            direction={{ base: "column", md: "row" }}
            justify="space-between"
            align="center"
            gap="lg"
          >
            <Group gap="md">
              <ThemeIcon size={44} radius="md" color="teal" variant="light">
                <IconShieldCheck size={26} />
              </ThemeIcon>
              <Box>
                <Text fw={700} size="sm">
                  {t("pricing.secTitle")}
                </Text>
                <Text size="xs" c="dimmed">
                  {t(
                    "pricing.secDesc"
                  )}
                </Text>
              </Box>
            </Group>

            <Group gap="sm" wrap="wrap" justify="center">
              {PAYMENT_BRANDS.map((brand) => (
                <Badge key={brand.name} variant="outline" color={brand.color} size="lg" radius="md">
                  {brand.name}
                </Badge>
              ))}
            </Group>
          </Flex>
        </div>

        {/* Pricing FAQs */}
        <div className="saas-card" style={{ padding: "36px 28px", borderRadius: 20 }}>
          <Title order={3} size="h4" mb="md">
            {t("pricing.faqHeading")}
          </Title>
          <Accordion variant="separated" radius="md">
            {pricingFaqs.map((item) => (
              <Accordion.Item key={item.id} value={item.id}>
                <Accordion.Control icon={<IconHelpCircle size={18} color="var(--primary)" />}>
                  <Text fw={600} size="sm">
                    {item.question}
                  </Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Text size="sm" c="dimmed" lh={1.7}>
                    {item.answer}
                  </Text>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </div>
      </div>
    </>
  );
}
