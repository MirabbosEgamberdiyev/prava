import React, { useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  TextInput,
  Select,
  Textarea,
  SegmentedControl,
  Accordion,
  Alert,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconBuildingCommunity,
  IconSchool,
  IconDeviceDesktop,
  IconWifiOff,
  IconDatabase,
  IconUsers,
  IconChartBar,
  IconNetwork,
  IconKeyboard,
  IconRefresh,
  IconHeadset,
  IconCheck,
  IconSend,
  IconShieldCheck,
  IconSparkles,
  IconTruck,
  IconCircleCheck,
  IconFileCertificate,
  IconDownload,
  IconBrandTelegram,
  IconPhone,
  IconUser,
  IconAt,
  IconMail,
  IconClock,
  IconMapPin,
} from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SEO from "../../components/common/SEO";
import { useCurriculumCountParams } from "../../hooks/useCurriculumCounts";
import api from "../../api/api";
import EnterpriseContactCard from "../../components/common/EnterpriseContactCard";

export default function Partners_Page() {
  const { t } = useTranslation();
  const countParams = useCurriculumCountParams();

  // Form State
  const [orgName, setOrgName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("+998 ");
  const [telegram, setTelegram] = useState("");
  const [orgType, setOrgType] = useState<string | null>("school");
  const [workstations, setWorkstations] = useState("10");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const [ticketId, setTicketId] = useState("");

  // Phone input formatting (+998 XX XXX XX XX)
  const handlePhoneChange = (val: string) => {
    let digits = val.replace(/\D/g, "");
    if (!digits.startsWith("998")) {
      digits = "998" + digits;
    }
    digits = digits.slice(0, 12);

    let formatted = "+998";
    if (digits.length > 3) formatted += " " + digits.slice(3, 5);
    if (digits.length > 5) formatted += " " + digits.slice(5, 8);
    if (digits.length > 8) formatted += " " + digits.slice(8, 10);
    if (digits.length > 10) formatted += " " + digits.slice(10, 12);

    setPhone(formatted);
  };

  // Telegram username formatting
  const handleTelegramChange = (val: string) => {
    const clean = val.replace(/^@+/, "").trim();
    if (clean.length > 0) {
      setTelegram("@" + clean);
    } else {
      setTelegram("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!orgName.trim() || orgName.trim().length < 2) {
      setFormError(t("partners.errOrganization"));
      return;
    }
    if (!contactPerson.trim() || contactPerson.trim().length < 2) {
      setFormError(t("partners.errFullName"));
      return;
    }
    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length < 12) {
      setFormError(t("partners.errPhone"));
      return;
    }
    if (!orgType) {
      setFormError(t("partners.errOrgType"));
      return;
    }

    setIsSubmitting(true);
    const generatedId = `CORP-${Math.floor(10000 + Math.random() * 90000)}`;
    let finalTicket = generatedId;

    const normalizedTelegram = telegram.trim()
      ? (telegram.trim().startsWith("@") ? telegram.trim() : `@${telegram.trim()}`)
      : "";

    const payload = {
      organization: orgName.trim(),
      fullName: contactPerson.trim(),
      phone: phone.trim(),
      telegram: normalizedTelegram,
      region: city.trim(),
      organizationType: orgType,
      computerCount: workstations || "",
      comment: notes.trim(),
    };

    try {
      const res = await api.post("/api/v1/public/contact/inquiry", payload);
      if (res.data?.data) {
        finalTicket = res.data.data.ticketId || generatedId;
      }
    } catch (err) {
      console.warn("Partners inquiry backend notification fallback:", err);
    } finally {
      setTicketId(finalTicket);
      setIsSubmitting(false);
      setFormSubmitted(true);

      notifications.show({
        title: t("partners.successTitle"),
        message: t("partners.successDesc"),
        color: "green",
      });
    }
  };

  const handleReset = () => {
    setOrgName("");
    setContactPerson("");
    setPhone("+998 ");
    setTelegram("");
    setOrgType("school");
    setWorkstations("10");
    setCity("");
    setNotes("");
    setFormSubmitted(false);
    setFormError("");
  };

  const scrollToForm = () => {
    document.getElementById("partner-inquiry-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const audienceSegments = [
    {
      icon: IconSchool,
      title: t("partners.seg1Title"),
      desc: t(
        "partners.seg1Desc"
      ),
      color: "blue",
    },
    {
      icon: IconBuildingCommunity,
      title: t("partners.seg2Title"),
      desc: t(
        "partners.seg2Desc"
      ),
      color: "blue",
    },
    {
      icon: IconTruck,
      title: t("partners.seg3Title"),
      desc: t(
        "partners.seg3Desc"
      ),
      color: "blue",
    },
    {
      icon: IconShieldCheck,
      title: t("partners.seg4Title"),
      desc: t(
        "partners.seg4Desc"
      ),
      color: "blue",
    },
  ];

  const capabilities = [
    {
      icon: IconWifiOff,
      title: t("partners.f1Title"),
      desc: t(
        "partners.f1Desc"
      ),
      color: "blue",
    },
    {
      icon: IconDatabase,
      title: t("partners.f2Title"),
      desc: t(
        "partners.f2Desc",
        countParams
      ),
      color: "blue",
    },
    {
      icon: IconDeviceDesktop,
      title: t("partners.f3Title"),
      desc: t(
        "partners.f3Desc"
      ),
      color: "blue",
    },
    {
      icon: IconUsers,
      title: t("partners.f4Title"),
      desc: t(
        "partners.f4Desc"
      ),
      color: "blue",
    },
    {
      icon: IconChartBar,
      title: t("partners.f5Title"),
      desc: t(
        "partners.f5Desc"
      ),
      color: "blue",
    },
    {
      icon: IconNetwork,
      title: t("partners.f6Title"),
      desc: t(
        "partners.f6Desc"
      ),
      color: "blue",
    },
    {
      icon: IconKeyboard,
      title: t("partners.f7Title"),
      desc: t(
        "partners.f7Desc"
      ),
      color: "blue",
    },
    {
      icon: IconRefresh,
      title: t("partners.f8Title"),
      desc: t(
        "partners.f8Desc"
      ),
      color: "blue",
    },
    {
      icon: IconHeadset,
      title: t("partners.f9Title"),
      desc: t(
        "partners.f9Desc"
      ),
      color: "blue",
    },
  ];

  const steps = [
    {
      num: t("partners.step1Num"),
      title: t("partners.step1Title"),
      desc: t(
        "partners.step1Desc"
      ),
    },
    {
      num: t("partners.step2Num"),
      title: t("partners.step2Title"),
      desc: t(
        "partners.step2Desc"
      ),
    },
    {
      num: t("partners.step3Num"),
      title: t("partners.step3Title"),
      desc: t(
        "partners.step3Desc"
      ),
    },
    {
      num: t("partners.step4Num"),
      title: t("partners.step4Title"),
      desc: t(
        "partners.step4Desc"
      ),
    },
  ];

  const partnerFaq = [
    {
      id: "pfaq-1",
      question: t("partners.q1"),
      answer: t(
        "partners.a1"
      ),
    },
    {
      id: "pfaq-2",
      question: t("partners.q2"),
      answer: t(
        "partners.a2"
      ),
    },
    {
      id: "pfaq-3",
      question: t("partners.q3"),
      answer: t(
        "partners.a3"
      ),
    },
    {
      id: "pfaq-4",
      question: t("partners.q4"),
      answer: t(
        "partners.a4"
      ),
    },
  ];

  const getOrgTypeName = (type: string | null) => {
    switch (type) {
      case "school":
        return t("partners.orgTypeSchool");
      case "center":
        return t("partners.orgTypeCenter");
      case "corporate":
        return t("partners.orgTypeCorporate");
      case "state":
        return t("partners.orgTypeState");
      case "other":
        return t("partners.orgTypeOther");
      default:
        return type || t("partners.notSpecified");
    }
  };

  return (
    <>
      <SEO
        title={t("seo.partners.title")}
        description={t("seo.partners.desc")}
        keywords="avtomaktablar uchun dastur, avtomaktab test dasturi, haydovchilik o'quv markazi dasturi, offline prava test, prava desktop enterprise, prava avtomaktab hamkorlik"
        canonical="/partners"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Avtomaktablar va Korporativ Hamkorlik — Prava Online",
          description: "Avtomaktablar va ta'lim muassasalari uchun kompyuter sinflari, offline imtihon tizimi va o'quvchilar monitoringi",
          provider: {
            "@type": "Organization",
            name: "Prava Online",
            url: "https://pravaonline.uz",
          },
          areaServed: {
            "@type": "Country",
            name: "Uzbekistan",
          },
        }}
      />

      <div className="saas-page-container">
        {/* Header Block */}
        <div className="saas-header-block">
          <div className="saas-badge-pill">
            <IconSparkles size={13} />
            <span>{t("partners.badge")}</span>
          </div>

          <Title order={1} className="saas-page-title">
            {t(
              "partners.title"
            )}
          </Title>

          <Text size="md" c="var(--text-muted)" className="saas-page-subtitle">
            {t(
              "partners.subtitle"
            )}
          </Text>

          <Flex
            direction={{ base: "column", sm: "row" }}
            justify="center"
            align="center"
            gap="sm"
            mt="lg"
            w={{ base: "100%", sm: "auto" }}
          >
            <Button
              size="md"
              radius="md"
              className="saas-btn-primary"
              onClick={scrollToForm}
              leftSection={<IconSend size={16} />}
            >
              {t("partners.ctaConsult")}
            </Button>
            <Link to="/downloads" style={{ textDecoration: "none" }}>
              <Button
                size="md"
                radius="md"
                className="saas-btn-secondary"
                leftSection={<IconDownload size={16} />}
              >
                {t("partners.ctaDownload")}
              </Button>
            </Link>
          </Flex>
        </div>

        {/* Audience Segments */}
        <div style={{ marginBottom: 64 }}>
          <Text
            size="xs"
            fw={700}
            tt="uppercase"
            c="var(--primary)"
            ta="center"
            mb={6}
            style={{ letterSpacing: "1px" }}
          >
            {t("partners.segBadge")}
          </Text>
          <Title order={2} ta="center" size="h3" mb="xl">
            {t("partners.segTitle")}
          </Title>

          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
            {audienceSegments.map((seg, idx) => {
              const IconComp = seg.icon;
              return (
                <div key={idx} className="saas-card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                  <ThemeIcon size={42} radius="md" color={seg.color} variant="light" mb="md">
                    <IconComp size={22} />
                  </ThemeIcon>
                  <Text fw={700} size="md" mb="xs">
                    {seg.title}
                  </Text>
                  <Text size="xs" c="dimmed" lh={1.6} style={{ flex: 1 }}>
                    {seg.desc}
                  </Text>
                </div>
              );
            })}
          </SimpleGrid>
        </div>

        {/* 9 Core Capabilities Matrix */}
        <div style={{ marginBottom: 72 }}>
          <div className="saas-card" style={{ padding: "36px 30px" }}>
            <Box ta="center" mb={36}>
              <Text
                size="xs"
                fw={700}
                tt="uppercase"
                c="var(--primary)"
                mb={6}
                style={{ letterSpacing: "1px" }}
              >
                {t("partners.featBadge")}
              </Text>
              <Title order={2} size="h3" mb="xs">
                {t("partners.featTitle")}
              </Title>
              <Text size="xs" c="dimmed" maw={640} mx="auto">
                {t(
                  "partners.featSubtitle"
                )}
              </Text>
            </Box>

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl">
              {capabilities.map((cap, idx) => {
                const IconComp = cap.icon;
                return (
                  <Group key={idx} align="flex-start" gap="md" wrap="nowrap">
                    <ThemeIcon size={40} radius="md" color={cap.color} variant="light" style={{ flexShrink: 0, marginTop: 2 }}>
                      <IconComp size={20} />
                    </ThemeIcon>
                    <Stack gap={4}>
                      <Text fw={700} size="sm">
                        {cap.title}
                      </Text>
                      <Text size="xs" c="dimmed" lh={1.5}>
                        {cap.desc}
                      </Text>
                    </Stack>
                  </Group>
                );
              })}
            </SimpleGrid>
          </div>
        </div>

        {/* Implementation Steps */}
        <div style={{ marginBottom: 64 }}>
          <Text
            size="xs"
            fw={700}
            tt="uppercase"
            c="var(--primary)"
            ta="center"
            mb={6}
            style={{ letterSpacing: "1px" }}
          >
            {t("partners.stepsBadge")}
          </Text>
          <Title order={2} ta="center" size="h3" mb="xl">
            {t("partners.stepsTitle")}
          </Title>

          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
            {steps.map((st, idx) => (
              <div
                key={idx}
                className="saas-card"
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  padding: "24px 20px",
                }}
              >
                <Text
                  size="28px"
                  fw={900}
                  c="var(--primary)"
                  style={{ opacity: 0.25, lineHeight: 1, marginBottom: 12 }}
                >
                  {st.num}
                </Text>
                <Text fw={700} size="sm" mb="xs">
                  {st.title}
                </Text>
                <Text size="xs" c="dimmed" lh={1.5}>
                  {st.desc}
                </Text>
              </div>
            ))}
          </SimpleGrid>
        </div>

        {/* B2B Partnership & Direct Contact Section */}
        <div id="partner-inquiry-form" style={{ marginBottom: 64, scrollMarginTop: 32 }}>
          <Box ta="center" mb="xl">
            <div className="saas-badge-pill" style={{ marginBottom: 12 }}>
              <IconFileCertificate size={13} />
              <span>{t("partners.formBadge")}</span>
            </div>
            <Title order={2} size="h2" mb="xs">
              {t("partners.formTitle")}
            </Title>
            <Text size="sm" c="dimmed" maw={640} mx="auto" lh={1.6}>
              {t(
                "partners.formSubtitle"
              )}
            </Text>
          </Box>

          <Grid gutter="xl" align="stretch">
            {/* Left: Lead Inquiry Form / Enterprise Success */}
            <Grid.Col span={{ base: 12, lg: 7 }} order={{ base: 1, lg: 1 }}>
              <div
                className="saas-card"
                style={{
                  height: "100%",
                  padding: "32px 24px",
                  boxShadow: "var(--shadow-sm)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                {formSubmitted ? (
                  <Stack align="center" gap="md" py="xl">
                    <ThemeIcon size={72} radius="xl" color="green" variant="light">
                      <IconCircleCheck size={44} />
                    </ThemeIcon>
                    <Title order={3} size="h3" ta="center">
                      {t("partners.successTitle")}
                    </Title>
                    <Badge size="xl" variant="filled" color="blue" radius="md" style={{ fontFamily: "monospace", letterSpacing: 1 }}>
                      {t("partners.ticketLabel")}: #{ticketId}
                    </Badge>
                    <Text size="sm" c="dimmed" ta="center" maw={480} lh={1.6}>
                      {t(
                        "partners.successDescNew"
                      )}
                    </Text>

                    {/* Summary of submitted data */}
                    <Box
                      w="100%"
                      maw={460}
                      p="md"
                      mt="sm"
                      style={{
                        backgroundColor: "var(--mantine-color-default-hover)",
                        borderRadius: 12,
                        border: "1px solid var(--border)",
                      }}
                    >
                      <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs" style={{ letterSpacing: "0.5px" }}>
                        {t("partners.summaryTitle")}
                      </Text>
                      <Stack gap={6}>
                        <Group justify="space-between">
                          <Text size="xs" c="dimmed">{t("partners.orgName")}:</Text>
                          <Text size="xs" fw={600}>{orgName}</Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="xs" c="dimmed">{t("partners.contactPerson")}:</Text>
                          <Text size="xs" fw={600}>{contactPerson}</Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="xs" c="dimmed">{t("partners.phone")}:</Text>
                          <Text size="xs" fw={600}>{phone}</Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="xs" c="dimmed">{t("partners.orgType")}:</Text>
                          <Text size="xs" fw={600}>{getOrgTypeName(orgType)}</Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="xs" c="dimmed">{t("partners.city")}:</Text>
                          <Text size="xs" fw={600}>{city.trim() || t("partners.notSpecified")}</Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="xs" c="dimmed">{t("contact.telegramLabel")}</Text>
                          <Text size="xs" fw={600}>{telegram.trim() || t("partners.notSpecified")}</Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="xs" c="dimmed">{t("partners.workstations")}:</Text>
                          <Text size="xs" fw={600}>{workstations ? `${workstations} ta` : t("partners.notSpecified")}</Text>
                        </Group>
                      </Stack>
                    </Box>

                    {/* 3 Action Buttons */}
                    <Stack w="100%" maw={460} gap="xs" mt="md">
                      <Button
                        variant="filled"
                        color="blue"
                        size="md"
                        radius="md"
                        leftSection={<IconPhone size={18} />}
                        component="a"
                        href="tel:+998993912505"
                      >
                        +998 99 391 25 05
                      </Button>
                      <Group grow gap="xs">
                        <Button
                          component="a"
                          href="https://t.me/pravaonlineuz"
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="light"
                          color="blue"
                          size="sm"
                          radius="md"
                          leftSection={<IconBrandTelegram size={16} />}
                        >
                          {t("partners.btnTelegram")}
                        </Button>
                        <Button
                          component="a"
                          href="mailto:info@pravaonline.uz"
                          variant="light"
                          color="blue"
                          size="sm"
                          radius="md"
                          leftSection={<IconMail size={16} />}
                        >
                          {t("partners.btnEmail")}
                        </Button>
                      </Group>
                      <Button
                        variant="subtle"
                        color="gray"
                        size="xs"
                        onClick={handleReset}
                        leftSection={<IconRefresh size={14} />}
                        mt={4}
                      >
                        {t("partners.sendAnother")}
                      </Button>
                    </Stack>
                  </Stack>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <Stack gap="md">
                      {formError && (
                        <Alert color="red" radius="md" py="xs">
                          {formError}
                        </Alert>
                      )}

                      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                        <TextInput
                          label={t("partners.orgName")}
                          placeholder={t("partners.orgNamePlaceholder")}
                          required
                          value={orgName}
                          onChange={(e) => setOrgName(e.currentTarget.value)}
                          leftSection={<IconBuildingCommunity size={16} />}
                        />
                        <TextInput
                          label={t("partners.contactPerson")}
                          placeholder={t("partners.contactPersonPlaceholder")}
                          required
                          value={contactPerson}
                          onChange={(e) => setContactPerson(e.currentTarget.value)}
                          leftSection={<IconUser size={16} />}
                        />
                      </SimpleGrid>

                      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                        <TextInput
                          label={t("partners.phone")}
                          placeholder="+998 90 123 45 67"
                          required
                          value={phone}
                          onChange={(e) => handlePhoneChange(e.currentTarget.value)}
                          leftSection={<IconPhone size={16} />}
                        />
                        <Select
                          label={t("partners.orgType")}
                          required
                          value={orgType}
                          onChange={setOrgType}
                          data={[
                            { value: "school", label: t("partners.orgTypeSchool") },
                            { value: "center", label: t("partners.orgTypeCenter") },
                            { value: "corporate", label: t("partners.orgTypeCorporate") },
                            { value: "state", label: t("partners.orgTypeState") },
                            { value: "other", label: t("partners.orgTypeOther") },
                          ]}
                        />
                      </SimpleGrid>

                      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                        <TextInput
                          label={t("partners.city")}
                          placeholder={t("partners.cityPlaceholder")}
                          value={city}
                          onChange={(e) => setCity(e.currentTarget.value)}
                          leftSection={<IconMapPin size={16} />}
                        />
                        <TextInput
                          label={t("contact.telegram")}
                          placeholder="@username"
                          value={telegram}
                          onChange={(e) => handleTelegramChange(e.currentTarget.value)}
                          leftSection={<IconAt size={16} />}
                        />
                      </SimpleGrid>

                      <div>
                        <Text size="sm" fw={500} mb={6}>
                          {t("partners.workstations")}
                        </Text>
                        <SegmentedControl
                          fullWidth
                          value={workstations}
                          onChange={setWorkstations}
                          data={[
                            { label: t("partners.workstationsOption1"), value: "10" },
                            { label: t("partners.workstationsOption2"), value: "30" },
                            { label: t("partners.workstationsOption3"), value: "50" },
                          ]}
                        />
                      </div>

                      <Textarea
                        label={t("partners.notes")}
                        placeholder={t(
                          "partners.notesPlaceholder"
                        )}
                        minRows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.currentTarget.value)}
                      />

                      <Button
                        type="submit"
                        size="md"
                        radius="md"
                        loading={isSubmitting}
                        className="saas-btn-primary saas-interactive-btn"
                        rightSection={<IconSend size={16} />}
                        mt="sm"
                        h={48}
                        fw={700}
                      >
                        {isSubmitting
                          ? t("partners.sending")
                          : t("partners.submitBtn")}
                      </Button>
                    </Stack>
                  </form>
                )}
              </div>
            </Grid.Col>

            {/* Right: Contact Hub */}
            <Grid.Col span={{ base: 12, lg: 5 }} order={{ base: 2, lg: 2 }}>
              <div
                className="saas-card"
                style={{
                  height: "100%",
                  padding: "32px 24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <Group gap="xs" mb="xs">
                    <ThemeIcon size={32} radius="md" color="blue" variant="light">
                      <IconHeadset size={18} />
                    </ThemeIcon>
                    <Text size="xs" fw={700} tt="uppercase" c="var(--primary)" style={{ letterSpacing: "1px" }}>
                      {t("partners.directContactBadge")}
                    </Text>
                  </Group>
                  <Title order={3} size="h3" mb="xs">
                    {t("partners.directContactTitle")}
                  </Title>
                  <Text size="xs" c="dimmed" lh={1.6} mb="lg">
                    {t(
                      "partners.directContactDesc"
                    )}
                  </Text>

                  <Stack gap="sm">
                    {/* Phone */}
                    <EnterpriseContactCard
                      icon={IconPhone}
                      color="blue"
                      label={t("partners.contactPhoneLabel")}
                      value="+998 99 391 25 05"
                      sub={t("partners.contactPhoneSub")}
                      href="tel:+998993912505"
                      ariaLabel="Telefon orqali bog'lanish"
                    />

                    {/* Telegram */}
                    <EnterpriseContactCard
                      icon={IconBrandTelegram}
                      color="blue"
                      label={t("partners.contactTgLabel")}
                      value="@pravaonlineuz"
                      sub={t("partners.contactTgSub")}
                      href="https://t.me/pravaonlineuz"
                      external
                      ariaLabel="Telegram orqali bog'lanish"
                    />

                    {/* Email */}
                    <EnterpriseContactCard
                      icon={IconMail}
                      color="blue"
                      label={t("partners.contactEmailLabel")}
                      value="info@pravaonline.uz"
                      sub={t("partners.contactEmailSub")}
                      href="mailto:info@pravaonline.uz"
                      ariaLabel="Email orqali bog'lanish"
                    />

                    {/* Working Hours */}
                    <EnterpriseContactCard
                      icon={IconClock}
                      color="blue"
                      label={t("partners.contactHoursLabel")}
                      value="24/7"
                      badge="Faol"
                      sub={t("partners.contactHoursSub")}
                      ariaLabel="Ish vaqti"
                    />
                  </Stack>
                </div>

                {/* Guarantees Box */}
                <Box
                  mt="xl"
                  pt="md"
                  style={{
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <Stack gap={8}>
                    <Group gap="xs">
                      <IconCheck size={14} color="var(--primary)" />
                      <Text size="xs" c="dimmed">{t("partners.guarantee1")}</Text>
                    </Group>
                    <Group gap="xs">
                      <IconCheck size={14} color="var(--primary)" />
                      <Text size="xs" c="dimmed">{t("partners.guarantee2")}</Text>
                    </Group>
                    <Group gap="xs">
                      <IconCheck size={14} color="var(--primary)" />
                      <Text size="xs" c="dimmed">{t("partners.guarantee3")}</Text>
                    </Group>
                  </Stack>
                </Box>
              </div>
            </Grid.Col>
          </Grid>
        </div>

        {/* Partner FAQ - Full Width Section */}
        <div style={{ marginBottom: 64 }}>
          <Box ta="center" mb="lg">
            <Text
              size="xs"
              fw={700}
              tt="uppercase"
              c="var(--primary)"
              mb={8}
              style={{ letterSpacing: "1px" }}
            >
              {t("partners.faqBadge")}
            </Text>
            <Title order={2} size="h3">
              {t("partners.faqTitle")}
            </Title>
          </Box>

          <Accordion variant="separated" radius="md" style={{ width: "100%", margin: "0 auto" }}>
            {partnerFaq.map((faq) => (
              <Accordion.Item key={faq.id} value={faq.id} className="saas-card" style={{ marginBottom: 12 }}>
                <Accordion.Control>
                  <Text fw={600} size="sm">
                    {faq.question}
                  </Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Text size="xs" c="dimmed" lh={1.7}>
                    {faq.answer}
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
