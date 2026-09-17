import { useState } from "react";
import {
  Box,
  Text,
  Title,
  Group,
  Badge,
  Button,
  SimpleGrid,
  ThemeIcon,
  Progress,
} from "@mantine/core";
import {
  IconDeviceDesktopAnalytics,
  IconAlertCircle,
  IconChartBar,
  IconSignLeft,
  IconCheck,
  IconClock,
  IconArrowRight,
  IconSparkles,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { DomainLink } from "@/components/common/DomainLink";
import { getLandingUrl } from "@/utils/domain";
import classes from "./Home.module.css";

type TabKey = "exam" | "errors" | "stats" | "signs";

export function Product_Preview() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>("exam");
  const [selectedOption, setSelectedOption] = useState<number | null>(2);

  const tabs: { key: TabKey; label: string; icon: typeof IconDeviceDesktopAnalytics }[] = [
    { key: "exam", label: t("home.preview.tabExam", "Imtihon Simulyatori"), icon: IconDeviceDesktopAnalytics },
    { key: "errors", label: t("home.preview.tabErrors", "Xatolar Tahlili"), icon: IconAlertCircle },
    { key: "stats", label: t("home.preview.tabStats", "Shaxsiy Statistika"), icon: IconChartBar },
    { key: "signs", label: t("home.preview.tabSigns", "Yo'l Belgilari"), icon: IconSignLeft },
  ];

  return (
    <section className={classes.previewSection} aria-label={t("home.preview.title", "Imtihon jarayoni va platforma imkoniyatlari")}>
      <Box className={classes.sectionTitle}>
        <div className={classes.sectionBadge}>
          <IconSparkles size={14} />
          {t("home.preview.badge", "Imtihon jarayoni")}
        </div>
        <Title order={2}>
          {t("home.preview.title", "Imtihon jarayoni va platforma imkoniyatlari")}
        </Title>
        <Text size="md" c="var(--text-muted)" mt="sm" maw={720} mx="auto" lh={1.6}>
          {t(
            "home.preview.subtitle",
            "Haqiqiy YHXBB imtihon muhiti, xatolar tahlili va shaxsiy statistika — barchasi bir joyda."
          )}
        </Text>
      </Box>

      <div className={classes.previewWindow} style={{ marginTop: 36 }}>
        {/* Showcase Topbar */}
        <div className={classes.previewHeader}>
          <Text size="xs" fw={700} c="var(--text-muted)" style={{ letterSpacing: "0.5px" }}>
            {t("home.preview.previewWindowLabel", "Rasmiy YHXBB imtihon formati")}
          </Text>
          <Badge size="xs" variant="outline" color="blue">
            2026
          </Badge>
        </div>

        {/* Tab switcher */}
        <div className={classes.previewNavTabs} role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`${classes.previewTabBtn} ${
                activeTab === tab.key ? classes.previewTabBtnActive : ""
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              <tab.icon size={17} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Dynamic Interactive Body */}
        <div className={classes.previewBody}>
          {/* TAB 1: Real Exam Question Demo */}
          {activeTab === "exam" && (
            <div className={classes.mockExamContainer}>
              <Group justify="space-between" align="center" mb="md" wrap="wrap">
                <Group gap="xs">
                  <Badge color="blue" size="sm" variant="filled">
                    {t("home.preview.ticketHeader", "Bilet #14 · Savol 8/20")}
                  </Badge>
                  <Badge color="gray" size="sm" variant="light">
                    {t("home.preview.categoryB", "Kategoriya B")}
                  </Badge>
                </Group>
                <Group gap={6} c="var(--primary)">
                  <IconClock size={16} />
                  <Text size="sm" fw={700}>
                    {t("home.preview.timeLeft", "18:42 qoldi")}
                  </Text>
                </Group>
              </Group>

              <Text fw={700} size="md" c="var(--text)" mb="lg" lh={1.5}>
                {t(
                  "home.preview.examQuestionDemo",
                  "Chorrahada qaysi transport vositasi birinchi bo'lib o'tadi?"
                )}
              </Text>

              <Box>
                {[
                  { id: 1, text: t("home.preview.examOption1", "Ko'k avtomobil (o'ng qo'l qoidasi)"), correct: false },
                  { id: 2, text: t("home.preview.examOption2", "Qizil avtomobil (asosiy yo'lda)"), correct: true },
                  { id: 3, text: t("home.preview.examOption3", "Bir vaqtda harakatlanadi"), correct: false },
                ].map((opt) => {
                  const isSelected = selectedOption === opt.id;
                  const isCorrect = opt.correct;
                  let optStyle = classes.mockExamOption;
                  if (isSelected && isCorrect) optStyle += ` ${classes.mockExamOptionCorrect}`;

                  return (
                    <div
                      key={opt.id}
                      className={optStyle}
                      onClick={() => setSelectedOption(opt.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setSelectedOption(opt.id);
                        }
                      }}
                    >
                      <ThemeIcon
                        size={26}
                        radius="xl"
                        variant={isSelected ? "filled" : "outline"}
                        color={isCorrect && isSelected ? "green" : isSelected ? "blue" : "gray"}
                      >
                        {isCorrect && isSelected ? (
                          <IconCheck size={14} stroke={3} />
                        ) : (
                          opt.id
                        )}
                      </ThemeIcon>
                      <Text size="sm" style={{ flex: 1, minWidth: 0, wordBreak: "break-word" }}>
                        {opt.text}
                      </Text>
                      {isSelected && isCorrect && (
                        <Badge
                          size="xs"
                          color="green"
                          variant="light"
                          style={{
                            flexShrink: 0,
                            whiteSpace: "nowrap",
                            minWidth: "max-content",
                            padding: "0 8px",
                            fontWeight: 700,
                          }}
                        >
                          {t("home.preview.correctBadge", "TO'G'RI ✓")}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </Box>

              {selectedOption === 2 && (
                <Box
                  mt="lg"
                  p="md"
                  style={{
                    borderRadius: 10,
                    background: "rgba(47, 158, 68, 0.08)",
                    border: "1px solid rgba(47, 158, 68, 0.25)",
                  }}
                >
                  <Group gap="xs" mb={4}>
                    <IconCheck size={16} color="var(--success)" />
                    <Text size="xs" fw={700} c="var(--success)">
                      {t("home.preview.officialRuleTitle", "Rasmiy Qoida Izohi:")}
                    </Text>
                  </Group>
                  <Text size="xs" c="var(--text)" lh={1.5}>
                    {t(
                      "home.preview.examExplanation",
                      "YHQ 13.9-band: Asosiy yo'l belgisi (2.1) bor bo'lgan yo'nalishdagi haydovchi ikkinchi darajali yo'ldan kelayotganlarga nisbatan ustunlikka ega."
                    )}
                  </Text>
                </Box>
              )}
            </div>
          )}

          {/* TAB 2: Error Review Demo */}
          {activeTab === "errors" && (
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
              <Box className={classes.mockExamContainer}>
                <Badge color="red" size="sm" variant="light" mb="xs">
                  {t("home.preview.weakPointDetected", "Zaif nuqta aniqlandi")}
                </Badge>
                <Text fw={700} size="sm" mb="sm">
                  {t("home.preview.weakTopicTitle", "Mavzu: Chorrahalarda harakatlanish ustuvorligi")}
                </Text>
                <Text size="xs" c="var(--text-muted)" mb="md" lh={1.6}>
                  {t(
                    "home.preview.weakTopicDesc",
                    "Ushbu mavzuda noaniq javoblar qayd etildi. Tizim avtomatik tarzda shaxsiy takrorlash rejasini tuzadi."
                  )}
                </Text>
                <Progress value={33} color="red" size="sm" radius="xl" mb="xs" />
                <Text size="xs" c="dimmed">
                  {t("home.preview.weakTopicProgress", "Mavzuni o'zlashtirish: 33%")}
                </Text>
              </Box>

              <Box className={classes.mockExamContainer}>
                <Badge color="teal" size="sm" variant="light" mb="xs">
                  {t("home.preview.smartAdviceTitle", "Intellektual maslahat")}
                </Badge>
                <Text fw={700} size="sm" mb="sm">
                  {t("home.preview.smartAdviceTopic", "Regulyator ishoralari va svetofor")}
                </Text>
                <Text size="xs" c="var(--text-muted)" mb="md" lh={1.6}>
                  {t(
                    "home.preview.smartAdviceDesc",
                    "Regulyatorning qo'l ishoralari har doim svetofor va yo'l belgilaridan ustun turishini esda saqlang!"
                  )}
                </Text>
                <DomainLink href={getLandingUrl("/try-exam")} style={{ textDecoration: "none" }}>
                  <Button size="xs" variant="light" color="blue" rightSection={<IconArrowRight size={14} />}>
                    {t("home.preview.solveMistakes", "Xatolarni yechish")}
                  </Button>
                </DomainLink>
              </Box>
            </SimpleGrid>
          )}

          {/* TAB 3: Personal Statistics Demo */}
          {activeTab === "stats" && (
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
              <Box className={classes.mockExamContainer} style={{ textAlign: "center" }}>
                <Text size="xs" c="var(--text-muted)" fw={700} tt="uppercase">
                  {t("home.preview.readinessTitle", "Umumiy Tayyorlik")}
                </Text>
                <Text size="2.5rem" fw={900} c="var(--primary)" my="xs">
                  94%
                </Text>
                <Badge color="green" variant="light">
                  {t("home.preview.readinessReady", "Imtihonga tayyor")}
                </Badge>
              </Box>

              <Box className={classes.mockExamContainer} style={{ textAlign: "center" }}>
                <Text size="xs" c="var(--text-muted)" fw={700} tt="uppercase">
                  {t("home.preview.masteredTicketsTitle", "O'zlashtirilgan Biletlar")}
                </Text>
                <Text size="2.5rem" fw={900} c="var(--text)" my="xs">
                  {t("home.preview.masteredTicketsCount", "68 / 70")}
                </Text>
                <Badge color="blue" variant="light">
                  {t("home.preview.masteredTicketsPct", "97% yakunlandi")}
                </Badge>
              </Box>

              <Box className={classes.mockExamContainer} style={{ textAlign: "center" }}>
                <Text size="xs" c="var(--text-muted)" fw={700} tt="uppercase">
                  {t("home.preview.avgTimeTitle", "O'rtacha Vaqt")}
                </Text>
                <Text size="2.5rem" fw={900} c="var(--text)" my="xs">
                  {t("home.preview.avgTimeValue", "11:20")}
                </Text>
                <Badge color="teal" variant="light">
                  {t("home.preview.avgTimeBadge", "Tezkor (20 daqiqadan)")}
                </Badge>
              </Box>
            </SimpleGrid>
          )}

          {/* TAB 4: Traffic Signs Demo */}
          {activeTab === "signs" && (
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
              {[
                {
                  title: t("home.preview.sign1Title", "2.1 Asosiy yo'l"),
                  cat: t("home.preview.sign1Cat", "Imtiyoz belgilari"),
                  color: "orange",
                },
                {
                  title: t("home.preview.sign2Title", "3.1 Kirish taqiqlangan"),
                  cat: t("home.preview.sign2Cat", "Taqiqlovchi"),
                  color: "red",
                },
                {
                  title: t("home.preview.sign3Title", "4.1.1 Harakat to'g'riga"),
                  cat: t("home.preview.sign3Cat", "Buyuruvchi"),
                  color: "blue",
                },
                {
                  title: t("home.preview.sign4Title", "5.1 Avtomagistral"),
                  cat: t("home.preview.sign4Cat", "Axborot-ishora"),
                  color: "green",
                },
              ].map((sign, idx) => (
                <Box
                  key={idx}
                  p="md"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    textAlign: "center",
                  }}
                >
                  <Badge color={sign.color} size="xs" variant="light" mb="xs">
                    {sign.cat}
                  </Badge>
                  <Text fw={700} size="sm" c="var(--text)">
                    {sign.title}
                  </Text>
                  <Text size="xs" c="dimmed" mt={4}>
                    {t("home.preview.signDesc", "Imtihon savollarida eng ko'p uchraydigan belgilar")}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          )}

          {/* Action button beneath window preview */}
          <Group justify="center" mt="xl">
            <DomainLink href={getLandingUrl("/try-exam")} style={{ textDecoration: "none" }}>
              <Button
                radius="xl"
                size="md"
                className="saas-btn-primary"
                rightSection={<IconArrowRight size={18} />}
              >
                {t("home.preview.tryFreeExam", "Imtihonni Bepul Sinab Ko'rish")}
              </Button>
            </DomainLink>
          </Group>
        </div>
      </div>
    </section>
  );
}
