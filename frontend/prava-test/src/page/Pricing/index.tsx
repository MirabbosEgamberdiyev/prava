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
import { getCachedTotalTickets, getCachedTotalQuestions } from "../../services/desktopAdapter";
import SEO from "../../components/common/SEO";
import { getWebAppUrl } from "../../utils/domain";

export default function Pricing_Page() {
  const { t } = useTranslation();
  const [billingCycle, setBillingCycle] = useState<string>("monthly");

  const isQuarterly = billingCycle === "quarterly";

  const comparisonFeatures = [
    {
      name: t("pricing.feat1", "Rasmiy IIV YHXX savollari"),
      free: t("pricing.feat1Free", "20 ta savol (1 bilet)"),
      standard: t("pricing.feat1Full", "Barcha {{count}}+ savol", { count: getCachedTotalQuestions() }),
      premium: t("pricing.feat1Full", "Barcha {{count}}+ savol", { count: getCachedTotalQuestions() }),
    },
    {
      name: t("pricing.feat2", "Rasmiy biletlar soni"),
      free: t("pricing.feat2Free", "1 ta sinov bileti"),
      standard: t("pricing.feat2Full", "Barcha {{count}} ta bilet", { count: getCachedTotalTickets() }),
      premium: t("pricing.feat2Full", "Barcha {{count}} ta bilet", { count: getCachedTotalTickets() }),
    },
    {
      name: t("pricing.feat3", "Davlat imtihoni simulyatori (25 daqiqa)"),
      free: t("pricing.feat3Free", "1 marta bepul"),
      standard: t("pricing.featUnlimited", "Cheksiz"),
      premium: t("pricing.featUnlimited", "Cheksiz"),
    },
    {
      name: t("pricing.feat4", "F1–F5 klaviatura boshqaruvi"),
      free: true,
      standard: true,
      premium: true,
    },
    {
      name: t("pricing.feat5", "Xatolar ustida ishlash bo'limi"),
      free: false,
      standard: true,
      premium: true,
    },
    {
      name: t("pricing.feat6", "Mavzulashtirilgan testlar"),
      free: false,
      standard: true,
      premium: true,
    },
    {
      name: t("pricing.feat7", "To'xtovsiz Marafon rejimi (1000+ savol)"),
      free: false,
      standard: false,
      premium: true,
    },
    {
      name: t("pricing.feat8", "Windows Desktop (.exe) 100% Offline litsenziya"),
      free: false,
      standard: false,
      premium: true,
    },
    {
      name: t("pricing.feat9", "AI intellektual xatolar tahlili va tavsiyalar"),
      free: false,
      standard: false,
      premium: true,
    },
    {
      name: t("pricing.feat10", "Ustuvor 24/7 texnik yordam"),
      free: false,
      standard: t("pricing.standardSupport", "Standart"),
      premium: t("pricing.vipSupport", "VIP Ustuvor"),
    },
  ];

  const pricingFaqs = [
    {
      id: "pr-1",
      question: t("pricing.faq1Q", "To'lov amalga oshirilgach, tarif qachon faollashadi?"),
      answer: t(
        "pricing.faq1A",
        "To'lov tasdiqlanishi bilan profilingizda barcha imkoniyatlar avtomatik tarzda, soniyalar ichida faollashadi. Qo'shimcha kutish yoki operator tasdig'i talab etilmaydi."
      ),
    },
    {
      id: "pr-2",
      question: t("pricing.faq2Q", "Qanday to'lov usullari mavjud?"),
      answer: t(
        "pricing.faq2A",
        "O'zbekistonning barcha asosiy to'lov tizimlari: Payme, Click, Uzum Bank orqali Uzcard va Humo kartalari, shuningdek Visa va Mastercard xalqaro kartalari qo'llab-quvvatlanadi."
      ),
    },
    {
      id: "pr-3",
      question: t("pricing.faq3Q", "Bitta tarif orqali telefon va kompyuterda foydalanish mumkinmi?"),
      answer: t(
        "pricing.faq3A",
        "Ha! Siz o'z profilingizga istalgan qurilmadan (kompyuter brauzeri, mobil telefon, planshet) kirishingiz mumkin. Barcha statistikangiz va natijalaringiz real vaqtda sinxronlashadi."
      ),
    },
    {
      id: "pr-4",
      question: t("pricing.faq4Q", "Avtomaktablar uchun alohida shartlar bormi?"),
      answer: t(
        "pricing.faq4A",
        "Ha, avtomaktablar va o'quv markazlari uchun kompyuter sinflariga moslashtirilgan offline tizim, o'qituvchi nazorat paneli va maxsus ommaviy litsenziya tariflari taqdim etiladi. Batafsil ma'lumotni 'Avtomaktablar va hamkorlik' bo'limida ko'rishingiz mumkin."
      ),
    },
  ];

  return (
    <>
      <SEO
        title={t("seo.pricing.title", "Tariflar va Narxlar — Prava Online")}
        description={t(
          "seo.pricing.desc",
          "Haydovchilik imtihoniga tayyorlanish uchun qulay va shaffof tariflar. Barcha 70 ta bilet, haqiqiy imtihon simulyatori va xatolar ustida ishlash."
        )}
        keywords="prava online narxlar, prava test tariflar, haydovchilik imtihoni obuna, avtomaktab test narxi, prava desktop litsenziya"
        canonical="/pricing"
      />

      <div className="saas-page-container">
        {/* Header Block */}
        <div className="saas-header-block">
          <div className="saas-badge-pill">
            <IconSparkles size={13} />
            <span>{t("pricing.badge", "Shaffof va Qulay Tariflar")}</span>
          </div>

          <Title order={1} className="saas-page-title">
            {t("pricing.title", "Imtihonga tayyorgarlik uchun o'zingizga mos tarifni tanlang")}
          </Title>

          <Text size="md" c="var(--text-muted)" className="saas-page-subtitle">
            {t(
              "pricing.subtitle",
              "Yashirin to'lovlar yo'q. Barcha 70 ta bilet, xatolar ustida ishlash va rasmiy davlat imtihoni simulyatori."
            )}
          </Text>

          {/* Billing Cycle Switcher */}
          <Box mt="lg">
            <SegmentedControl
              value={billingCycle}
              onChange={setBillingCycle}
              radius="xl"
              size="md"
              data={[
                { label: t("pricing.monthly", "Oylik to'lov"), value: "monthly" },
                {
                  label: (
                    <Center style={{ gap: 8 }}>
                      <span>{t("pricing.quarterly", "3 Oylik to'liq kurs")}</span>
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
                {t("pricing.freeBadge", "Sinov")}
              </Badge>
              <Text fw={800} size="xl">
                {t("pricing.freePlanName", "Bepul Sinov")}
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                {t("pricing.freePlanDesc", "Platforma bilan yaqindan tanishish")}
              </Text>
            </Box>

            <Box my="sm">
              <Text fw={900} size="2rem" style={{ lineHeight: 1 }}>
                0 <span style={{ fontSize: "1rem", fontWeight: 600 }}>UZS</span>
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                {t("pricing.foreverFree", "Doimiy bepul")}
              </Text>
            </Box>

            <Divider my="sm" />

            <Stack gap={10} mb="xl" style={{ flexGrow: 1 }}>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="teal" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4}>
                  {t("pricing.freeF1", "1 ta to'liq sinov imtihoni")}
                </Text>
              </Group>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="teal" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4}>
                  {t("pricing.freeF2", "20 ta savol / 25 daqiqa reglamenti")}
                </Text>
              </Group>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="teal" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4}>
                  {t("pricing.freeF3", "F1–F5 klaviatura boshqaruvi")}
                </Text>
              </Group>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="gray" variant="light">
                  <IconX size={12} />
                </ThemeIcon>
                <Text size="xs" c="dimmed" lh={1.4}>
                  {t("pricing.freeF4Locked", "{{count}} ta bilet (yopiq)", { count: getCachedTotalTickets() })}
                </Text>
              </Group>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="gray" variant="light">
                  <IconX size={12} />
                </ThemeIcon>
                <Text size="xs" c="dimmed" lh={1.4}>
                  {t("pricing.freeF5Locked", "Xatolar ustida ishlash (yopiq)")}
                </Text>
              </Group>
            </Stack>

            <Button
              component={Link}
              to="/try-exam"
              variant="default"
              radius="md"
              fullWidth
              size="sm"
            >
              {t("pricing.tryFreeBtn", "Sinab ko'rish")}
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
              background: "var(--card-highlight-bg, rgba(37, 99, 235, 0.03))",
            }}
          >
            <Box mb="md">
              <Group justify="space-between" align="center">
                <Badge color="blue" variant="filled" size="sm" leftSection={<IconFlame size={12} />}>
                  {t("pricing.popularBadge", "Ommabop")}
                </Badge>
              </Group>
              <Text fw={800} size="xl" mt="xs">
                {t("pricing.stdPlanName", "Standart")}
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                {t("pricing.stdPlanDesc", "1 oylik to'liq mustaqil tayyorgarlik")}
              </Text>
            </Box>

            <Box my="sm">
              <Text fw={900} size="2rem" c="var(--primary)" style={{ lineHeight: 1 }}>
                {isQuarterly ? "39 000" : "49 000"}{" "}
                <span style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text)" }}>UZS</span>
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                {isQuarterly ? t("pricing.perMonthQuarterly", "oyiga (jami 117 000)") : t("pricing.perMonth", "oyiga")}
              </Text>
            </Box>

            <Divider my="sm" />

            <Stack gap={10} mb="xl" style={{ flexGrow: 1 }}>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="blue" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4} fw={600}>
                  {t("pricing.stdF1", "Barcha {{ticketsCount}} ta rasmiy bilet ({{questionsCount}}+ savol)", {
                    ticketsCount: getCachedTotalTickets(),
                    questionsCount: getCachedTotalQuestions(),
                  })}
                </Text>
              </Group>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="blue" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4}>
                  {t("pricing.stdF2", "Cheksiz davlat imtihoni simulyatsiyasi")}
                </Text>
              </Group>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="blue" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4}>
                  {t("pricing.stdF3", "Xatolar ustida ishlash bo'limi")}
                </Text>
              </Group>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="blue" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4}>
                  {t("pricing.stdF4", "Mavzulashtirilgan batafsil testlar")}
                </Text>
              </Group>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="blue" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4}>
                  {t("pricing.stdF5", "Web va Mobil ilovada to'liq kirish")}
                </Text>
              </Group>
            </Stack>

            <Button
              component="a"
              href={getWebAppUrl("/packages")}
              className="saas-btn-primary"
              radius="md"
              fullWidth
              size="sm"
            >
              {t("pricing.stdChooseBtn", "Standartni tanlash")}
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
                {t("pricing.bestValueBadge", "Maksimal foyda")}
              </Badge>
              <Text fw={800} size="xl">
                {t("pricing.vipPlanName", "Premium VIP")}
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                {t("pricing.vipPlanDesc", "100% o'tish kafolati va to'liq to'plam")}
              </Text>
            </Box>

            <Box my="sm">
              <Text fw={900} size="2rem" style={{ lineHeight: 1 }}>
                {isQuarterly ? "99 000" : "129 000"}{" "}
                <span style={{ fontSize: "1rem", fontWeight: 600 }}>UZS</span>
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                {isQuarterly ? t("pricing.per3Months", "3 oylik to'liq kirish") : t("pricing.perMonth", "oyiga")}
              </Text>
            </Box>

            <Divider my="sm" />

            <Stack gap={10} mb="xl" style={{ flexGrow: 1 }}>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="teal" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4} fw={600}>
                  {t("pricing.vipF1", "Standart tarifning barcha imkoniyatlari")}
                </Text>
              </Group>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="teal" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4}>
                  {t("pricing.vipF2", "1000+ savolli to'xtovsiz Marafon rejimi")}
                </Text>
              </Group>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="teal" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4}>
                  {t("pricing.vipF3", "Windows Desktop (.exe) 100% offline litsenziya")}
                </Text>
              </Group>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="teal" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4}>
                  {t("pricing.vipF4", "AI intellektual xatolar tahlili")}
                </Text>
              </Group>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="teal" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4}>
                  {t("pricing.vipF5", "VIP ustuvor 24/7 texnik qo'llab-quvvatlash")}
                </Text>
              </Group>
            </Stack>

            <Button
              component="a"
              href={getWebAppUrl("/packages")}
              variant="light"
              color="violet"
              radius="md"
              fullWidth
              size="sm"
            >
              {t("pricing.vipChooseBtn", "Premiumga ulanish")}
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
                {t("pricing.corpBadge", "Avtomaktablar")}
              </Badge>
              <Text fw={800} size="xl">
                {t("pricing.corpPlanName", "Korporativ")}
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                {t("pricing.corpPlanDesc", "Kompyuter sinflari va guruhlar uchun")}
              </Text>
            </Box>

            <Box my="sm">
              <Text fw={900} size="1.6rem" style={{ lineHeight: 1.2 }}>
                {t("pricing.corpPrice", "Shartnoma asosida")}
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                {t("pricing.corpSub", "Kompyuterlar soniga qarab")}
              </Text>
            </Box>

            <Divider my="sm" />

            <Stack gap={10} mb="xl" style={{ flexGrow: 1 }}>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="orange" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4}>
                  {t("pricing.corpF1", "10–100 kompyuter uchun offline litsenziyalar")}
                </Text>
              </Group>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="orange" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4}>
                  {t("pricing.corpF2", "O'qituvchi va nazoratchi boshqaruv paneli")}
                </Text>
              </Group>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="orange" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4}>
                  {t("pricing.corpF3", "Guruhlar statistikasi va monitoring")}
                </Text>
              </Group>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="orange" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4}>
                  {t("pricing.corpF4", "Lokal LAN tarmoqda internetsiz ishlash")}
                </Text>
              </Group>
              <Group gap={8} align="flex-start" wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="orange" variant="light">
                  <IconCheck size={12} />
                </ThemeIcon>
                <Text size="xs" lh={1.4}>
                  {t("pricing.corpF5", "Rasmiy shartnoma va hisob-faktura")}
                </Text>
              </Group>
            </Stack>

            <Button
              component={Link}
              to="/partners"
              variant="outline"
              color="orange"
              radius="md"
              fullWidth
              size="sm"
            >
              {t("pricing.corpConsultBtn", "Hamkorlik so'rovi")}
            </Button>
          </div>
        </SimpleGrid>

        {/* Feature Comparison Matrix Table */}
        <div className="saas-card" style={{ padding: "32px 24px", marginBottom: 64, borderRadius: 20 }}>
          <Title order={2} size="h3" mb="xs" ta="center">
            {t("pricing.matrixTitle", "Barcha imkoniyatlarni taqqoslash")}
          </Title>
          <Text size="sm" c="dimmed" ta="center" mb="xl">
            {t("pricing.matrixSub", "Tariflar bo'yicha batafsil funksional imkoniyatlar ro'yxati")}
          </Text>

          <Box style={{ overflowX: "auto" }}>
            <Table striped highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: "40%" }}>{t("pricing.tableColFeat", "Xususiyatlar")}</Table.Th>
                  <Table.Th style={{ textAlign: "center", width: "20%" }}>{t("pricing.freePlanName", "Bepul Sinov")}</Table.Th>
                  <Table.Th style={{ textAlign: "center", width: "20%" }}>{t("pricing.stdPlanName", "Standart")}</Table.Th>
                  <Table.Th style={{ textAlign: "center", width: "20%" }}>{t("pricing.vipPlanName", "Premium VIP")}</Table.Th>
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
                  {t("pricing.secTitle", "100% Xavfsiz to'lov va kafolatlangan kirish")}
                </Text>
                <Text size="xs" c="dimmed">
                  {t(
                    "pricing.secDesc",
                    "To'lovlar Markaziy Bank tomonidan sertifikatlangan shlyuzlar (PCI-DSS) orqali amalga oshiriladi."
                  )}
                </Text>
              </Box>
            </Group>

            <Group gap="sm" wrap="wrap" justify="center">
              <Badge variant="outline" color="blue" size="lg" radius="md">
                Payme
              </Badge>
              <Badge variant="outline" color="cyan" size="lg" radius="md">
                Click
              </Badge>
              <Badge variant="outline" color="grape" size="lg" radius="md">
                Uzum Bank
              </Badge>
              <Badge variant="outline" color="gray" size="lg" radius="md">
                Uzcard / Humo
              </Badge>
              <Badge variant="outline" color="indigo" size="lg" radius="md">
                Visa / MC
              </Badge>
            </Group>
          </Flex>
        </div>

        {/* Pricing FAQs */}
        <div className="saas-card" style={{ padding: "36px 28px", borderRadius: 20 }}>
          <Title order={3} size="h4" mb="md">
            {t("pricing.faqHeading", "Tariflar bo'yicha ko'p beriladigan savollar")}
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
