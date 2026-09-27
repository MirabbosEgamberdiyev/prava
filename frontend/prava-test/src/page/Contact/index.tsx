import { useState } from "react";
import {
  Anchor,
  Button,
  Grid,
  Group,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
  ThemeIcon,
  Title,
  Accordion,
  Badge,
  Box,
  SegmentedControl,
  Alert,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconPhone,
  IconBrandTelegram,
  IconClock,
  IconMapPin,
  IconSend,
  IconMail,
  IconUser,
  IconCircleCheck,
  IconShieldCheck,
  IconSchool,
  IconDeviceDesktop,
  IconHeadset,
  IconTruck,
  IconUsers,
  IconBuildingCommunity,
  IconAt,
  IconAlertCircle,
  IconCheck,
  IconRefresh,
  IconSparkles,
  IconPhoneCall,
  IconArrowRight,
} from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SEO from "../../components/common/SEO";
import api from "../../api/api";
import EnterpriseContactCard from "../../components/common/EnterpriseContactCard";

export default function Contact_Page() {
  const { t } = useTranslation();

  // Form State
  const [organization, setOrganization] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+998 ");
  const [telegram, setTelegram] = useState("");
  const [region, setRegion] = useState<string | null>("tashkent_city");
  const [organizationType, setOrganizationType] = useState<string | null>("school");
  const [computerCount, setComputerCount] = useState("10");
  const [comment, setComment] = useState("");

  // UX & Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Phone input helper: auto-formats into +998 XX XXX XX XX
  const formatUzPhone = (val: string) => {
    const digits = val.replace(/\D/g, "");
    let rest = digits.startsWith("998") ? digits.slice(3) : digits;
    rest = rest.slice(0, 9);

    let formatted = "+998";
    if (rest.length > 0) {
      formatted += " " + rest.slice(0, 2);
    }
    if (rest.length > 2) {
      formatted += " " + rest.slice(2, 5);
    }
    if (rest.length > 5) {
      formatted += " " + rest.slice(5, 7);
    }
    if (rest.length > 7) {
      formatted += " " + rest.slice(7, 9);
    }
    return formatted;
  };

  const handlePhoneChange = (val: string) => {
    if (
      !val ||
      val.trim() === "+" ||
      val.trim() === "+9" ||
      val.trim() === "+99" ||
      val.trim() === "+998"
    ) {
      setPhone("+998 ");
      return;
    }
    setPhone(formatUzPhone(val));
  };

  // Telegram username helper: strips leading spaces, ensures @ if text present
  const handleTelegramChange = (val: string) => {
    const clean = val.trim();
    if (!clean) {
      setTelegram("");
    } else if (clean.startsWith("@")) {
      setTelegram(clean);
    } else {
      setTelegram("@" + clean);
    }
  };

  const validateForm = (): boolean => {
    setValidationError(null);

    if (!organization.trim() || organization.trim().length < 2) {
      setValidationError(
        t("contact.errOrganization")
      );
      return false;
    }

    if (!fullName.trim() || fullName.trim().length < 2) {
      setValidationError(
        t("contact.errFullName")
      );
      return false;
    }

    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length < 12) {
      setValidationError(
        t("contact.errPhone")
      );
      return false;
    }

    if (!organizationType) {
      setValidationError(t("contact.errOrgType"));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const generatedFallbackTicket = "CORP-" + Math.floor(10000 + Math.random() * 90000);

    const normalizedTelegram = telegram.trim()
      ? telegram.startsWith("@")
        ? telegram.trim()
        : "@" + telegram.trim()
      : "";

    const payload = {
      organization: organization.trim(),
      fullName: fullName.trim(),
      phone: phone.trim(),
      telegram: normalizedTelegram || null,
      region: region || "tashkent_city",
      organizationType,
      computerCount,
      comment: comment.trim(),
    };

    let finalTicket = generatedFallbackTicket;
    let isDelivered = false;
    try {
      const res = await api.post("/api/v1/public/contact/inquiry", payload);
      if (res.data?.data) {
        finalTicket = res.data.data.ticketId || generatedFallbackTicket;
        isDelivered = Boolean(res.data.data.delivered);
      }
    } catch (err) {
      console.warn("Contact inquiry API call failed, falling back to local ticket:", err);
    } finally {
      setTicketId(finalTicket);
      setIsSubmitting(false);
      setFormSubmitted(true);

      notifications.show({
        title: isDelivered
          ? t("contact.sentTitle")
          : t("contact.ticketLabel") + ": #" + finalTicket,
        message: t(
          "contact.successDesc"
        ),
        color: "green",
        withBorder: true,
      });
    }
  };

  const handleResetForm = () => {
    setOrganization("");
    setFullName("");
    setPhone("+998 ");
    setTelegram("");
    setRegion("tashkent_city");
    setOrganizationType("school");
    setComputerCount("10");
    setComment("");
    setFormSubmitted(false);
    setValidationError(null);
  };

  // Direct Contact Channels
  const directChannels = [
    {
      icon: IconPhoneCall,
      title: t("contact.phoneTitle"),
      value: "+998 99 391 25 05",
      desc: t("contact.phoneDesc"),
      link: "tel:+998993912505",
      badge: t("contact.badgeDirectCall"),
      actionLabel: t("contact.callNow"),
    },
    {
      icon: IconBrandTelegram,
      title: t("contact.telegramTitle"),
      value: "@pravaonlineuz",
      desc: t("contact.telegramDesc"),
      link: "https://t.me/pravaonlineuz",
      badge: t("contact.badgeFastReply"),
      actionLabel: t("contact.openTelegram"),
    },
    {
      icon: IconMail,
      title: t("contact.emailTitle"),
      value: "info@pravaonline.uz",
      desc: t("contact.emailDesc"),
      link: "mailto:info@pravaonline.uz",
      badge: t("contact.badgeEmail"),
      actionLabel: t("contact.sendEmail"),
    },
    {
      icon: IconClock,
      title: t("contact.hoursTitle"),
      value: "24/7",
      desc: t("contact.hoursDesc"),
      link: undefined,
      badge: t("contact.badgeSchedule"),
      actionLabel: null,
    },
    {
      icon: IconMapPin,
      title: t("contact.locationTitle"),
      value: t("contact.cityTashkent"),
      desc: t("contact.locationDesc"),
      link: undefined,
      badge: t("contact.badgeHeadOffice"),
      actionLabel: null,
    },
  ];

  // Trust Section: "Nima uchun biz bilan bog'lanishadi?"
  const trustPillars = [
    {
      icon: IconSchool,
      title: t("contact.trust1Title"),
      desc: t(
        "contact.trust1Desc"
      ),
      color: "blue",
    },
    {
      icon: IconDeviceDesktop,
      title: t("contact.trust2Title"),
      desc: t(
        "contact.trust2Desc"
      ),
      color: "teal",
    },
    {
      icon: IconHeadset,
      title: t("contact.trust3Title"),
      desc: t(
        "contact.trust3Desc"
      ),
      color: "grape",
    },
    {
      icon: IconTruck,
      title: t("contact.trust4Title"),
      desc: t(
        "contact.trust4Desc"
      ),
      color: "orange",
    },
    {
      icon: IconUsers,
      title: t("contact.trust5Title"),
      desc: t(
        "contact.trust5Desc"
      ),
      color: "indigo",
    },
    {
      icon: IconShieldCheck,
      title: t("contact.trust6Title"),
      desc: t(
        "contact.trust6Desc"
      ),
      color: "cyan",
    },
  ];

  // Uzbekistan 14 regions
  const regionOptions = [
    { value: "tashkent_city", label: t("contact.regTashkentCity") },
    { value: "tashkent_reg", label: t("contact.regTashkentReg") },
    { value: "samarkand", label: t("contact.regSamarkand") },
    { value: "fergana", label: t("contact.regFergana") },
    { value: "andijan", label: t("contact.regAndijan") },
    { value: "namangan", label: t("contact.regNamangan") },
    { value: "bukhara", label: t("contact.regBukhara") },
    { value: "khorezm", label: t("contact.regKhorezm") },
    { value: "kashkadarya", label: t("contact.regKashkadarya") },
    { value: "surkhandarya", label: t("contact.regSurkhandarya") },
    { value: "navoi", label: t("contact.regNavoi") },
    { value: "jizzakh", label: t("contact.regJizzakh") },
    { value: "sirdarya", label: t("contact.regSirdarya") },
    {
      value: "karakalpakstan",
      label: t("contact.regKarakalpakstan"),
    },
  ];

  // Organization Types
  const orgTypeOptions = [
    { value: "school", label: t("contact.orgSchool") },
    { value: "center", label: t("contact.orgCenter") },
    { value: "corporate", label: t("contact.orgCorporate") },
    { value: "state", label: t("contact.orgState") },
    { value: "other", label: t("contact.orgOther") },
  ];

  const getOrgTypeName = (type: string | null) => {
    const found = orgTypeOptions.find((o) => o.value === type);
    return found ? found.label : type || t("contact.notSpecified");
  };

  const getRegionName = (val: string | null) => {
    const found = regionOptions.find((r) => r.value === val);
    return found ? found.label : val || t("contact.notSpecified");
  };

  // Quick FAQ
  const quickResolutions = [
    {
      id: "quick-1",
      question: t("contact.quick1Q"),
      answer: t(
        "contact.quick1A"
      ),
    },
    {
      id: "quick-2",
      question: t("contact.quick2Q"),
      answer: t(
        "contact.quick2A"
      ),
    },
    {
      id: "quick-3",
      question: t("contact.quick3Q"),
      answer: t(
        "contact.quick3A"
      ),
    },
  ];

  return (
    <>
      <SEO
        title={t("seo.contact.title")}
        description={t("seo.contact.desc")}
        keywords="prava online aloqa, avtomaktab hamkorlik, prava desktop o'rnatish, prava online qo'llab-quvvatlash, prava enterprise aloqa, prava online telegram"
        canonical="/contact"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "Aloqa va Qo'llab-quvvatlash — Prava Online",
          description: "Prava Online platformasi bilan bog'lanish va texnik qo'llab-quvvatlash",
          url: "https://pravaonline.uz/contact",
          mainEntity: {
            "@type": "Organization",
            name: "Prava Online",
            url: "https://pravaonline.uz",
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer support",
              url: "https://t.me/pravaonlineuzbot",
              availableLanguage: ["Uzbek", "Russian"],
            },
          },
        }}
      />

      <div className="saas-page-container">
        {/* Header Block */}
        <div className="saas-header-block">
          <div className="saas-badge-pill">
            <IconBuildingCommunity size={13} />
            <span>{t("contact.badge")}</span>
          </div>
          <h1 className="saas-page-title">
            {t("contact.title")}
          </h1>
          <p className="saas-page-subtitle">
            {t(
              "contact.subtitle"
            )}
          </p>
        </div>

        {/* Priority Direct Contact Channels (Forma to'ldirmasdan ham bog'lanish) */}
        <div style={{ marginBottom: 48 }}>
          <Text
            size="xs"
            fw={700}
            tt="uppercase"
            c="var(--primary)"
            ta="center"
            mb={6}
            style={{ letterSpacing: "1px" }}
          >
            {t("contact.directChannelsBadge")}
          </Text>
          <Title order={2} ta="center" size="h4" mb="lg">
            {t("contact.directChannelsTitle")}
          </Title>

          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {directChannels.map((c, idx) => (
              <EnterpriseContactCard
                key={idx}
                icon={c.icon}
                color="blue"
                label={c.title}
                value={c.value}
                sub={c.desc}
                badge={c.badge}
                href={c.link}
                external={c.link?.startsWith("http")}
                ariaLabel={c.title}
              />
            ))}

            {/* Tech Support Routing */}
            <EnterpriseContactCard
              icon={IconSparkles}
              color="blue"
              label={t("contact.routingTitle")}
              value={t("contact.talkToDirector")}
              sub={t("contact.techSupportDesc")}
              href="https://t.me/pravaonlineuz"
              external
              badge="Direct"
              ariaLabel={t("contact.routingTitle")}
            />
          </SimpleGrid>
        </div>

        {/* Trust Section: "Nima uchun biz bilan bog'lanishadi?" */}
        <div style={{ marginBottom: 56 }}>
          <Text
            size="xs"
            fw={700}
            tt="uppercase"
            c="var(--primary)"
            ta="center"
            mb={6}
            style={{ letterSpacing: "1px" }}
          >
            {t("contact.trustBadge")}
          </Text>
          <Title order={2} ta="center" size="h3" mb="xl">
            {t("contact.trustTitle")}
          </Title>

          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {trustPillars.map((p, idx) => {
              const IconComp = p.icon;
              return (
                <div
                  key={idx}
                  className="saas-card"
                  style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    padding: "24px 20px",
                  }}
                >
                  <ThemeIcon size={40} radius="md" color={p.color} variant="light" mb="sm">
                    <IconComp size={20} />
                  </ThemeIcon>
                  <Text fw={700} size="sm" mb="xs">
                    {p.title}
                  </Text>
                  <Text size="xs" c="dimmed" lh={1.6} style={{ flex: 1 }}>
                    {p.desc}
                  </Text>
                </div>
              );
            })}
          </SimpleGrid>
        </div>

        {/* Partnership Form & Enterprise Contact Hub */}
        <div id="inquiry-form" style={{ marginBottom: 48 }}>
          <Grid gutter="xl" align="stretch">
            {/* Left: Form or Corporate Success Card */}
            <Grid.Col span={{ base: 12, lg: 7 }}>
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
                      {t("contact.successTitle")}
                    </Title>
                    <Badge
                      size="xl"
                      variant="filled"
                      color="blue"
                      radius="md"
                      style={{ fontFamily: "monospace", letterSpacing: 1 }}
                    >
                      {t("contact.ticketLabel")}: #{ticketId}
                    </Badge>
                    <Text size="sm" c="dimmed" ta="center" maw={480} lh={1.6}>
                      {t(
                        "contact.successDesc"
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
                      <Text
                        size="xs"
                        fw={700}
                        c="dimmed"
                        tt="uppercase"
                        mb="xs"
                        style={{ letterSpacing: "0.5px" }}
                      >
                        {t("contact.summaryTitle")}
                      </Text>
                      <Stack gap={6}>
                        <Group justify="space-between">
                          <Text size="xs" c="dimmed">{t("contact.orgName")}:</Text>
                          <Text size="xs" fw={600}>{organization}</Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="xs" c="dimmed">{t("contact.contactPerson")}:</Text>
                          <Text size="xs" fw={600}>{fullName}</Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="xs" c="dimmed">{t("contact.phone")}:</Text>
                          <Text size="xs" fw={600}>{phone}</Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="xs" c="dimmed">{t("contact.orgType")}:</Text>
                          <Text size="xs" fw={600}>{getOrgTypeName(organizationType)}</Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="xs" c="dimmed">{t("contact.region")}:</Text>
                          <Text size="xs" fw={600}>{getRegionName(region)}</Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="xs" c="dimmed">{t("contact.telegramLabel")}</Text>
                          <Text size="xs" fw={600}>{telegram.trim() || t("contact.notSpecified")}</Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="xs" c="dimmed">{t("contact.computerCount")}:</Text>
                          <Text size="xs" fw={600}>{computerCount ? (computerCount + " ta") : t("contact.notSpecified")}</Text>
                        </Group>
                      </Stack>
                    </Box>

                    {/* Corporate Action Buttons */}
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
                      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
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
                          {t("contact.btnTelegram")}
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
                          {t("contact.btnEmail")}
                        </Button>
                      </SimpleGrid>
                      <Button
                        variant="subtle"
                        color="gray"
                        size="xs"
                        onClick={handleResetForm}
                        leftSection={<IconRefresh size={14} />}
                        mt={4}
                      >
                        {t("contact.sendAnother")}
                      </Button>
                    </Stack>
                  </Stack>
                ) : (
                  <div>
                    <Box mb="lg">
                      <div className="saas-badge-pill" style={{ marginBottom: 8 }}>
                        <IconShieldCheck size={13} />
                        <span>{t("contact.crmBadge")}</span>
                      </div>
                      <Title order={2} style={{ fontSize: "1.35rem", marginBottom: 6 }}>
                        {t("contact.formMainTitle")}
                      </Title>
                      <Text size="xs" c="dimmed" lh={1.6}>
                        {t(
                          "contact.formMainSubtitle"
                        )}
                      </Text>
                    </Box>

                    <form onSubmit={handleSubmit}>
                      <Stack gap="md">
                        {validationError && (
                          <Alert
                            icon={<IconAlertCircle size={16} />}
                            color="red"
                            radius="md"
                            title={t("common.error")}
                            py="xs"
                          >
                            {validationError}
                          </Alert>
                        )}

                        {/* Organization & Contact Person */}
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                          <TextInput
                            label={t("contact.orgName")}
                            placeholder={t("contact.orgNamePlaceholder")}
                            required
                            value={organization}
                            onChange={(e) => setOrganization(e.currentTarget.value)}
                            leftSection={<IconBuildingCommunity size={16} />}
                          />
                          <TextInput
                            label={t("contact.contactPerson")}
                            placeholder={t("contact.contactPersonPlaceholder")}
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.currentTarget.value)}
                            leftSection={<IconUser size={16} />}
                          />
                        </SimpleGrid>

                        {/* Phone & Organization Type */}
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                          <TextInput
                            label={t("contact.phone")}
                            placeholder="+998 90 123 45 67"
                            required
                            value={phone}
                            onChange={(e) => handlePhoneChange(e.currentTarget.value)}
                            leftSection={<IconPhone size={16} />}
                          />
                          <Select
                            label={t("contact.orgType")}
                            value={organizationType}
                            onChange={setOrganizationType}
                            data={orgTypeOptions}
                            required
                          />
                        </SimpleGrid>

                        {/* Region & Telegram (Optional) */}
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                          <Select
                            label={
                              <Group gap={4}>
                                <span>{t("contact.region")}</span>
                                <Text size="xs" c="dimmed" inherit>
                                  {t("contact.optionalNotice")}
                                </Text>
                              </Group>
                            }
                            value={region}
                            onChange={setRegion}
                            data={regionOptions}
                            searchable
                            clearable
                          />
                          <TextInput
                            label={
                              <Group gap={4}>
                                <span>{t("contact.telegram")}</span>
                                <Text size="xs" c="dimmed" inherit>
                                  {t("contact.optionalNotice")}
                                </Text>
                              </Group>
                            }
                            placeholder="@username"
                            value={telegram}
                            onChange={(e) => handleTelegramChange(e.currentTarget.value)}
                            leftSection={<IconAt size={16} />}
                          />
                        </SimpleGrid>

                        {/* Computer Workstations Count */}
                        <div>
                          <Text size="sm" fw={500} mb={6}>
                            {t("contact.computerCount")}
                          </Text>
                          <SegmentedControl
                            fullWidth
                            value={computerCount}
                            onChange={setComputerCount}
                            data={[
                              { label: t("contact.compOpt1"), value: "10" },
                              { label: t("contact.compOpt2"), value: "30" },
                              { label: t("contact.compOpt3"), value: "50" },
                            ]}
                          />
                        </div>

                        {/* Comment */}
                        <Textarea
                          label={
                            <Group gap={4}>
                              <span>{t("contact.comment")}</span>
                              <Text size="xs" c="dimmed" inherit>
                                {t("contact.optionalNotice")}
                              </Text>
                            </Group>
                          }
                          placeholder={t(
                            "contact.commentPlaceholder"
                          )}
                          minRows={3}
                          value={comment}
                          onChange={(e) => setComment(e.currentTarget.value)}
                        />

                        {/* Submit Button with UX feedback */}
                        <Button
                          type="submit"
                          size="md"
                          radius="md"
                          h={44}
                          loading={isSubmitting}
                          disabled={isSubmitting}
                          className="saas-btn-primary"
                          rightSection={<IconSend size={16} />}
                          mt="xs"
                        >
                          {isSubmitting
                            ? t("contact.sending")
                            : t("contact.submitBtn")}
                        </Button>
                      </Stack>
                    </form>
                  </div>
                )}
              </div>
            </Grid.Col>

            {/* Right: Contact Hub (Identical to Partners) */}
            <Grid.Col span={{ base: 12, lg: 5 }}>
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
                    <Text
                      size="xs"
                      fw={700}
                      tt="uppercase"
                      c="var(--primary)"
                      style={{ letterSpacing: "1px" }}
                    >
                      {t("contact.contactHubBadge")}
                    </Text>
                  </Group>
                  <Title order={3} size="h3" mb="xs">
                    {t("contact.contactHubTitle")}
                  </Title>
                  <Text size="xs" c="dimmed" lh={1.6} mb="lg">
                    {t(
                      "contact.contactHubDesc"
                    )}
                  </Text>

                  <Stack gap="sm">
                    {/* Phone */}
                    <EnterpriseContactCard
                      icon={IconPhone}
                      color="blue"
                      label={t("contact.contactPhoneLabel")}
                      value="+998 99 391 25 05"
                      sub={t("contact.contactPhoneSub")}
                      href="tel:+998993912505"
                      ariaLabel="Telefon orqali bog'lanish"
                    />

                    {/* Telegram */}
                    <EnterpriseContactCard
                      icon={IconBrandTelegram}
                      color="blue"
                      label={t("contact.contactTgLabel")}
                      value="@pravaonlineuz"
                      sub={t("contact.contactTgSub")}
                      href="https://t.me/pravaonlineuz"
                      external
                      ariaLabel="Telegram orqali bog'lanish"
                    />

                    {/* Email */}
                    <EnterpriseContactCard
                      icon={IconMail}
                      color="blue"
                      label={t("contact.contactEmailLabel")}
                      value="info@pravaonline.uz"
                      sub={t("contact.contactEmailSub")}
                      href="mailto:info@pravaonline.uz"
                      ariaLabel="Email orqali bog'lanish"
                    />

                    {/* Working Hours */}
                    <EnterpriseContactCard
                      icon={IconClock}
                      color="blue"
                      label={t("contact.contactHoursLabel")}
                      value="24/7"
                      badge={t("contact.activeBadge")}
                      sub={t("contact.contactHoursSub")}
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
                      <Text size="xs" c="dimmed">
                        {t("contact.guarantee1")}
                      </Text>
                    </Group>
                    <Group gap="xs">
                      <IconCheck size={14} color="var(--primary)" />
                      <Text size="xs" c="dimmed">
                        {t("contact.guarantee2")}
                      </Text>
                    </Group>
                    <Group gap="xs">
                      <IconCheck size={14} color="var(--primary)" />
                      <Text size="xs" c="dimmed">
                        {t("contact.guarantee3")}
                      </Text>
                    </Group>
                  </Stack>
                </Box>
              </div>
            </Grid.Col>
          </Grid>
        </div>

        {/* Quick FAQ - Full Width Section below the Grid */}
        <div style={{ marginTop: 64, marginBottom: 64 }}>
          <Box ta="center" mb="lg">
            <Text
              size="xs"
              fw={700}
              tt="uppercase"
              c="var(--primary)"
              mb={6}
              style={{ letterSpacing: "1px" }}
            >
              {t("contact.faqSectionBadge")}
            </Text>
            <Title order={2} size="h3" mb="xs">
              {t("contact.faqSectionTitle")}
            </Title>
            <Text size="sm" c="dimmed" maw={600} mx="auto" lh={1.6}>
              {t(
                "contact.faqSectionSubtitle"
              )}
            </Text>
          </Box>

          <div
            className="saas-card"
            style={{
              maxWidth: 820,
              margin: "0 auto",
              padding: "24px 28px",
            }}
          >
            <Accordion variant="separated" radius="md">
              {quickResolutions.map((item) => (
                <Accordion.Item key={item.id} value={item.id}>
                  <Accordion.Control style={{ fontSize: 13, fontWeight: 600 }}>
                    {item.question}
                  </Accordion.Control>
                  <Accordion.Panel
                    style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}
                  >
                    {item.answer}
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>

            <Group justify="center" mt="xl">
              <Anchor
                component={Link}
                to="/faq"
                size="sm"
                fw={600}
                c="var(--primary)"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <span>{t("contact.viewAllFaq")}</span>
                <IconArrowRight size={14} />
              </Anchor>
            </Group>
          </div>
        </div>
      </div>
    </>
  );
}
