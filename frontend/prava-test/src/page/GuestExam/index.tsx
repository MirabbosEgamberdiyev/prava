import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Center,
  Loader,
  Text,
  Title,
  Button,
  Group,
  Stack,
  ThemeIcon,
  Alert,
  Modal,
  SimpleGrid,
  RingProgress,
  Divider,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconSparkles,
  IconUserPlus,
  IconChartBar,
  IconHome,
  IconCheck,
  IconX,
  IconClock,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import SEO from "../../components/common/SEO";
import { useCurriculumCounts } from "../../hooks/useCurriculumCounts";
import {
  durationMinutesFor,
  getExamRulesSync,
  isExamPassed,
  maxAllowedWrong,
  useExamRules,
} from "../../services/examRules";
import { errorKeyFor } from "../../types/errors";
import { registerPath } from "../../utils/returnTo";
import { QuizContent } from "../../components/quiz/QuizContent";
import { QuizNav } from "../../components/quiz/QuizNav";
import api from "../../api/api";
import type { Question, AnswersMap } from "../../types";

const GUEST_EXAM_KEY = "guestExamCount";

/**
 * W-06: ro'yxatdan o'tgandan keyin qaytiladigan sahifa. Mehmon sinovi bir
 * martalik — "/try-exam" ga qaytish yana cheklov ekranini ko'rsatadi, shuning
 * uchun foydalanuvchi to'g'ridan-to'g'ri biletlar ro'yxatiga qaytariladi.
 */
const GUEST_RETURN_TO = "/tickets";

/** Rasmiy qoidalar bo'yicha standart davomiylik (daqiqa) — server qiymat bermasa. */
const defaultGuestDurationMinutes = () => {
  const r = getExamRulesSync().real;
  return durationMinutesFor(r.questionCount, r.secondsPerQuestion);
};

const GuestExamPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const rules = useExamRules();
  const { tickets: totalTickets } = useCurriculumCounts();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [durationMinutes, setDurationMinutes] = useState(defaultGuestDurationMinutes);
  const [loading, setLoading] = useState(true);
  /** Xato — i18n kaliti (render paytida joriy tilda tarjima qilinadi). */
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [guestResultOpened, setGuestResultOpened] = useState(false);

  const hasFetched = useRef(false);

  const loadGuestExam = () => {
    const count = parseInt(localStorage.getItem(GUEST_EXAM_KEY) || "0", 10);
    if (count >= 1) {
      setLimitReached(true);
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);

    /*
     * BUG FIX: avval xom `fetch("/api/v1/public/guest-exam")` ishlatilardi va
     * `ENV.API_BASE_URL` ni butunlay chetlab o'tardi. API boshqa originda
     * joylashtirilsa (masalan staging yoki alohida API domeni), bepul sinov
     * imtihoni — asosiy jalb qilish sahifasi — ishlamay qolardi.
     * Endi umumiy `api` instansi ishlatiladi (baseURL + Accept-Language +
     * yagona xato ishlov berish).
     */
    api
      .get("/api/v1/public/guest-exam")
      .then((res) => {
        const exam = res.data?.data;
        if (!exam?.questions?.length) throw new Error("No questions");
        setQuestions(exam.questions);
        setDurationMinutes(exam.durationMinutes ?? defaultGuestDurationMinutes());
        // Limit hisoblagichi FAQAT imtihon muvaffaqiyatli yuklangandan keyin
        // oshiriladi (avval ham shunday edi) — tarmoq xatosi foydalanuvchining
        // yagona bepul urinishini yeb qo'ymasin.
        localStorage.setItem(GUEST_EXAM_KEY, String(count + 1));
      })
      .catch((err: unknown) => {
        // Tarmoq/5xx — api.ts global toast chiqaradi; bu yerda inline xato + "Qayta urinish"
        setError(errorKeyFor(err, "exam.loadError"));
      })
      .finally(() => setLoading(false));
  };

  const loadRef = useRef(loadGuestExam);
  useEffect(() => {
    loadRef.current = loadGuestExam;
  });
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    loadRef.current();
  }, []);

  /*
   * W-20: "Sinovni qayta yechish" tugmasi olib tashlandi — u `guestExamCount` ni
   * o'chirib, bir martalik bepul sinovni cheksiz qayta boshlashga imkon berardi.
   */

  const handleAnswerSelect = (
    questionIndex: number,
    optionIndex: number,
    timeSpentSeconds: number,
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: { optionIndex, timeSpentSeconds },
    }));
  };

  const handleReset = () => setAnswers({});
  const handleFinish = () => setGuestResultOpened(true);

  const { correctCount, incorrectCount, unansweredCount } = useMemo(() => {
    const correct = questions.reduce((count, q, i) => {
      return count + (answers[i]?.optionIndex === q.correctOptionIndex ? 1 : 0);
    }, 0);
    const answered = Object.keys(answers).length;
    return {
      correctCount: correct,
      incorrectCount: answered - correct,
      unansweredCount: questions.length - answered,
    };
  }, [questions, answers]);

  const correctPercentage =
    questions.length > 0 ? (correctCount / questions.length) * 100 : 0;

  // W-03: mehmon imtihoni — rasmiy (real) qoida: xato + javobsiz ≤ ruxsat etilgan xatolar
  const passed = isExamPassed(
    {
      mode: "real",
      total: questions.length,
      correct: correctCount,
      wrong: incorrectCount,
      unanswered: unansweredCount,
    },
    rules,
  );
  // W-02: matnlar uchun — ruxsat etilgan xatolar va kamida kerakli to'g'ri javoblar
  const guestTotal = questions.length || rules.real.questionCount;
  const maxWrong = maxAllowedWrong(guestTotal, rules);
  const minCorrect = Math.max(0, guestTotal - maxWrong);

  const scoreColor = passed ? "green" : correctPercentage >= 60 ? "yellow" : "red";

  const seoElement = (
    <SEO
      title={t("seo.tryExam.title", t("guestExam.seoTitle"))}
      description={t("seo.tryExam.desc", t("guestExam.seoDescription"))}
      keywords="prava test, prava test bepul, prava sinov imtihoni, haydovchilik imtihoni sinov, YHXBB test online, online prava test, bepul prava test, 70 ta bilet, avtotest, тест ПДД онлайн, бесплатный экзамен ПДД"
      canonical="/try-exam"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "Quiz",
        name: "Haydovchilik guvohnomasi sinov imtihoni",
        description: "YHXBB imtihonini bepul sinab ko'ring - real imtihon formati",
        educationalLevel: "Beginner",
        inLanguage: ["uz", "uz-Cyrl", "ru"],
        isAccessibleForFree: true,
        provider: { "@type": "Organization", name: "Prava Online", url: "https://pravaonline.uz" },
      }}
    />
  );

  if (loading) {
    return (
      <>
        {seoElement}
        <Center h="100dvh" style={{ background: "var(--bg)" }}>
          <Box ta="center">
            <Loader size="lg" mb="md" />
            <Text c="dimmed">{t("common.loading")}</Text>
          </Box>
        </Center>
      </>
    );
  }

  if (limitReached) {
    return (
      <>
        {seoElement}
        <Center h="100dvh" style={{ background: "var(--bg)", padding: 16 }}>
          <div style={{ maxWidth: 460, width: "100%" }}>
            <div className="saas-card" style={{ padding: "36px 28px", textAlign: "center" }}>
              <ThemeIcon size={56} radius="xl" color="blue" variant="light" mb="md" mx="auto">
                <IconSparkles size={28} />
              </ThemeIcon>
              <Title order={1} size="h3" mb="xs">
                {t("guestExam.completedTitle")}
              </Title>
              <Text size="sm" c="dimmed" mb="lg" lh={1.6}>
                {totalTickets > 0
                  ? t("guestExam.registerPromptFull", { count: totalTickets })
                  : t("guestExam.registerPromptNoCount")}
              </Text>
              <Stack gap="sm">
                <Button
                  size="md"
                  radius="md"
                  h={46}
                  className="saas-interactive-btn"
                  leftSection={<IconUserPlus size={18} />}
                  onClick={() => navigate(registerPath(GUEST_RETURN_TO))}
                >
                  {t("register.register")}
                </Button>
                <Button
                  variant="light"
                  size="md"
                  radius="md"
                  h={44}
                  onClick={() => navigate("/partners")}
                >
                  {t("nav.corporate")}
                </Button>
                <Group justify="center" gap="md" mt="xs">
                  <Button
                    variant="subtle"
                    size="xs"
                    color="gray"
                    onClick={() => navigate("/")}
                  >
                    {t("notFound.backHome")}
                  </Button>
                </Group>
              </Stack>
            </div>
          </div>
        </Center>
      </>
    );
  }

  if (error) {
    return (
      <>
        {seoElement}
        <Center h="100dvh" style={{ background: "var(--bg)", padding: 16 }}>
          <Box ta="center" maw={440}>
            <ThemeIcon size={56} radius="xl" color="red" variant="light" mb="md" mx="auto">
              <IconAlertCircle size={28} />
            </ThemeIcon>
            <Title order={1} size="h3" mb="xs" c="red">
              {t("common.error")}
            </Title>
            <Text size="sm" c="dimmed" mb="lg" lh={1.6}>
              {t(error)}
            </Text>
            <Group justify="center" gap="sm">
              <Button onClick={loadGuestExam} variant="filled">
                {t("common.retry")}
              </Button>
              <Button onClick={() => navigate("/")} variant="light">
                {t("notFound.backHome")}
              </Button>
            </Group>
          </Box>
        </Center>
      </>
    );
  }

  if (questions.length === 0) {
    return (
      <>
        {seoElement}
        <Center h="100dvh" style={{ background: "var(--bg)", padding: 16 }}>
          <Box ta="center" maw={440}>
            <Title order={1} size="h3" mb="md">
              {t("exam.notFound")}
            </Title>
            <Button onClick={() => navigate("/")}>
              {t("notFound.backHome")}
            </Button>
          </Box>
        </Center>
      </>
    );
  }

  return (
    <>
      {seoElement}
      <QuizNav
        questions={questions}
        totalQuestions={questions.length}
        durationMinutes={durationMinutes}
        answers={answers}
        onReset={handleReset}
        backUrl="/"
        isSecureMode={false}
        onGuestFinish={() => setGuestResultOpened(true)}
        onGuestViewResults={() => setGuestResultOpened(true)}
      />
      <Alert
        icon={<IconAlertCircle size={16} />}
        color="yellow"
        mx="md"
        mt="xs"
        mb={0}
        radius="md"
      >
        {t("guestExam.resultNotSaved")}
      </Alert>
      <QuizContent
        questions={questions}
        onAnswerSelect={handleAnswerSelect}
        onFinish={handleFinish}
        selectedAnswers={answers}
        showExplanation={true}
        isSecureMode={false}
      />

      {/* Guest Result Modal */}
      <Modal
        opened={guestResultOpened}
        onClose={() => setGuestResultOpened(false)}
        centered
        size="420px"
        radius="lg"
        withCloseButton={true}
        padding="xl"
        title={
          <Text fw={700} size="lg">
            {t("exam.finishModal.title")}
          </Text>
        }
      >
        <Stack gap="lg">
          {/* Score ring */}
          <Stack align="center" gap="xs">
            <RingProgress
              size={120}
              thickness={10}
              roundCaps
              sections={[{ value: correctPercentage, color: scoreColor }]}
              label={
                <Box ta="center">
                  <Text size="xl" fw={900} lh={1} c={scoreColor}>
                    {correctCount}
                  </Text>
                  <Text size="xs" c="dimmed" mt={2}>
                    / {questions.length}
                  </Text>
                </Box>
              }
            />
            <Text fw={600} size="md" c={scoreColor} ta="center">
              {passed ? t("exam.result.passed") : t("exam.result.failed")}
            </Text>
            <Text size="xs" c="dimmed" ta="center" maw={320}>
              {passed
                ? t("guestExam.passedEncourage", { minCorrect })
                : t("guestExam.failedEncourage", { minCorrect, max: maxWrong })}
            </Text>
          </Stack>

          {/* Stats */}
          <SimpleGrid cols={3} spacing="sm">
            <Stack
              align="center"
              gap={6}
              p="sm"
              style={{ borderRadius: 12, border: "1px solid var(--mantine-color-green-5)", background: "var(--surface)" }}
            >
              <ThemeIcon size={40} radius="xl" color="green" variant="light">
                <IconCheck size={20} />
              </ThemeIcon>
              <Text size="lg" fw={800} c="green">
                {correctCount}
              </Text>
              <Text size="xs" c="dimmed" ta="center">
                {t("exam.correct")}
              </Text>
            </Stack>

            <Stack
              align="center"
              gap={6}
              p="sm"
              style={{ borderRadius: 12, border: "1px solid var(--mantine-color-red-5)", background: "var(--surface)" }}
            >
              <ThemeIcon size={40} radius="xl" color="red" variant="light">
                <IconX size={20} />
              </ThemeIcon>
              <Text size="lg" fw={800} c="red">
                {incorrectCount}
              </Text>
              <Text size="xs" c="dimmed" ta="center">
                {t("exam.incorrect")}
              </Text>
            </Stack>

            <Stack
              align="center"
              gap={6}
              p="sm"
              style={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)" }}
            >
              <ThemeIcon size={40} radius="xl" color="gray" variant="light">
                <IconClock size={20} />
              </ThemeIcon>
              <Text size="lg" fw={800} c="dimmed">
                {unansweredCount}
              </Text>
              <Text size="xs" c="dimmed" ta="center">
                {t("exam.unanswered")}
              </Text>
            </Stack>
          </SimpleGrid>

          <Divider />

          {/* Actions */}
          <Stack gap="xs">
            <Button
              fullWidth
              size="md"
              radius="md"
              h={44}
              color="blue"
              onClick={() => navigate(registerPath(GUEST_RETURN_TO))}
            >
              {totalTickets > 0
                ? t("guestExam.unlockAll", { count: totalTickets })
                : t("guestExam.unlockAllNoCount")}
            </Button>
            <Button
              fullWidth
              size="md"
              radius="md"
              h={44}
              variant="light"
              leftSection={<IconChartBar size={18} />}
              onClick={() => setGuestResultOpened(false)}
            >
              {t("exam.reviewAnswers")}
            </Button>
            <Button
              fullWidth
              size="sm"
              radius="md"
              h={36}
              variant="subtle"
              color="gray"
              leftSection={<IconHome size={16} />}
              onClick={() => navigate("/")}
            >
              {t("notFound.backHome")}
            </Button>
          </Stack>
        </Stack>
      </Modal>
    </>
  );
};

export default GuestExamPage;
