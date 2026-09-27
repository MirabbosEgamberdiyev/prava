import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Badge, Button, Card, Container, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import {
  IconBook2,
  IconBuildingBank,
  IconCar,
  IconClipboardCheck,
  IconFlame,
  IconGavel,
  IconLock,
  IconRoad,
  IconRun,
  IconSignRight,
  IconTicket,
  IconTrafficLights,
  IconScale,
  IconAlertTriangle,
} from "@tabler/icons-react";
import SEO from "../../components/common/SEO";
import { loginPath, registerPath } from "../../utils/returnTo";
import { useCurriculumCounts } from "../../hooks/useCurriculumCounts";
import { useExamRules } from "../../services/examRules";

interface ModeCard {
  to: string;
  icon: ReactNode;
  title: string;
  desc: string;
  /** Boshlash login talab qiladi — karta login sahifasiga returnTo bilan olib boradi. */
  locked?: boolean;
}

/**
 * W-06: web ilovaning bosh sahifasi (mehmon uchun). Avval `/` mehmonni darhol
 * `/auth/login` ga haydardi. Endi mehmon bilet/mavzu ro'yxatlari, qoidalar,
 * belgilar va boshqa ochiq bo'limlarni ko'radi; shaxsiy ish jarayonini
 * boshlaganda (imtihon, marafon, bilet) login so'raladi va login'dan keyin
 * aynan o'sha joyga qaytariladi (`?returnTo=`).
 */
export default function GuestHome_Page() {
  const { t } = useTranslation();
  const counts = useCurriculumCounts();
  const rules = useExamRules();

  const practice: ModeCard[] = [
    {
      to: "/tickets",
      icon: <IconTicket size={22} />,
      title: t("nav.tickets"),
      desc:
        counts.tickets > 0
          ? t("guestHome.ticketsDesc", { count: counts.tickets, questions: rules.real.questionCount })
          : t("guestHome.ticketsDescGeneric", { questions: rules.real.questionCount }),
    },
    { to: "/topics", icon: <IconBook2 size={22} />, title: t("nav.topics"), desc: t("guestHome.topicsDesc") },
    {
      to: "/try-exam",
      icon: <IconClipboardCheck size={22} />,
      title: t("guestExam.tryFree"),
      desc: t("guestHome.tryExamDesc", {
        count: rules.real.questionCount,
        minutes: Math.round((rules.real.questionCount * rules.real.secondsPerQuestion) / 60),
      }),
    },
    {
      to: loginPath("/exam"),
      icon: <IconCar size={22} />,
      title: t("nav.realExam"),
      desc: t("guestHome.realExamDesc", { max: rules.real.maxWrong }),
      locked: true,
    },
    { to: loginPath("/marafon"), icon: <IconRun size={22} />, title: t("nav.marathon"), desc: t("guestHome.marathonDesc"), locked: true },
    { to: loginPath("/survival"), icon: <IconFlame size={22} />, title: t("nav.survival"), desc: t("guestHome.survivalDesc"), locked: true },
    {
      to: loginPath("/wrong-answers"),
      icon: <IconAlertTriangle size={22} />,
      title: t("nav.wrongAnswers"),
      desc: t("guestHome.wrongAnswersDesc"),
      locked: true,
    },
  ];

  const reference: ModeCard[] = [
    { to: "/rules", icon: <IconGavel size={22} />, title: t("nav.rules"), desc: t("guestHome.rulesDesc") },
    { to: "/signs", icon: <IconSignRight size={22} />, title: t("nav.signs"), desc: t("guestHome.signsDesc") },
    { to: "/markings", icon: <IconRoad size={22} />, title: t("nav.markings"), desc: t("guestHome.markingsDesc") },
    { to: "/penalties", icon: <IconTrafficLights size={22} />, title: t("nav.penalties"), desc: t("guestHome.penaltiesDesc") },
    { to: "/fines", icon: <IconScale size={22} />, title: t("nav.trafficFines"), desc: t("guestHome.trafficFinesDesc") },
    { to: "/exam-centers", icon: <IconBuildingBank size={22} />, title: t("nav.examCenters"), desc: t("guestHome.examCentersDesc") },
  ];

  const renderCard = (c: ModeCard) => (
    <Card
      key={c.to}
      component={Link}
      to={c.to}
      withBorder
      radius="md"
      padding="lg"
      style={{ textDecoration: "none", height: "100%" }}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
          <span aria-hidden style={{ color: "var(--mantine-color-blue-5)", display: "inline-flex" }}>
            {c.icon}
          </span>
          <Text fw={700} style={{ minWidth: 0, overflowWrap: "anywhere" }}>
            {c.title}
          </Text>
        </Group>
        {c.locked && (
          <Badge variant="light" color="gray" leftSection={<IconLock size={12} />} style={{ flexShrink: 0 }}>
            {t("guestHome.loginRequired")}
          </Badge>
        )}
      </Group>
      <Text size="sm" c="dimmed" mt="xs">
        {c.desc}
      </Text>
    </Card>
  );

  return (
    <>
      <SEO title={t("guestHome.seoTitle")} description={t("guestHome.seoDesc")} canonical="/" />
      <Container size="lg" py={{ base: "lg", sm: "xl" }} px="md" mih="calc(100dvh - 200px)">
        <Stack gap="xl">
          <Card withBorder radius="lg" padding="xl">
            <Stack gap="sm">
              <Title order={1} fz={{ base: 24, sm: 32 }}>
                {t("guestHome.title")}
              </Title>
              <Text c="dimmed" maw={640}>
                {t("guestHome.subtitle")}
              </Text>
              <Group gap="sm" mt="sm">
                <Button component={Link} to={loginPath("/me")} radius="md">
                  {t("guestHome.login")}
                </Button>
                <Button component={Link} to={registerPath("/me")} radius="md" variant="light">
                  {t("guestHome.register")}
                </Button>
                <Button component={Link} to="/try-exam" radius="md" variant="subtle">
                  {t("guestExam.tryFree")}
                </Button>
              </Group>
            </Stack>
          </Card>

          <section aria-labelledby="guest-practice">
            <Title order={2} fz={20} mb="md" id="guest-practice">
              {t("guestHome.practiceTitle")}
            </Title>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              {practice.map(renderCard)}
            </SimpleGrid>
          </section>

          <section aria-labelledby="guest-reference">
            <Title order={2} fz={20} mb="md" id="guest-reference">
              {t("guestHome.referenceTitle")}
            </Title>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              {reference.map(renderCard)}
            </SimpleGrid>
          </section>
        </Stack>
      </Container>
    </>
  );
}
