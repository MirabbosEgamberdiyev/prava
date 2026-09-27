import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Center,
  Loader,
  Text,
  Title,
  Button,
  Group,
  Paper,
  Stack,
  Container,
  ThemeIcon,
} from "@mantine/core";
import { IconAlertCircle, IconPlayerPlay } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { mutate } from "swr";
import api from "../../../api/api";
import { QuizNav, type QuizNavHandle } from "../../../components/quiz/QuizNav";
import { QuizContent } from "../../../components/quiz/QuizContent";
import SEO from "../../../components/common/SEO";
import { useAutoSave, restoreAnswers } from "../../../hooks/useAutoSave";
import { OfflineBanner } from "../../../components/common/OfflineBanner";
import ConfirmFinishModal from "../../../components/quiz/ConfirmFinishModal";
import { useExamLeaveGuard } from "../../../hooks/useExamLeaveGuard";
import { errorKeyFor, getErrorMessage } from "../../../types/errors";
import { reportError } from "../../../utils/monitoring";
import type { PackageExamData, AnswersMap } from "../../../types";

interface ActiveExamInfo {
  sessionId: number;
  ticketId?: number;
  packageId?: number;
}

const PackageExamPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const examMode = location.state?.examMode || "visible";
  const isSecureMode = examMode === "secure";

  const [examData, setExamData] = useState<PackageExamData | null>(
    location.state?.examData || null,
  );
  const [loading, setLoading] = useState(!examData);
  /** Start xatosi (obyekt) — matn render paytida joriy tilda tarjima qilinadi (W-05). */
  const [error, setError] = useState<{ error: unknown } | null>(null);
  const [activeConflict, setActiveConflict] = useState<ActiveExamInfo | null>(null);
  const [answers, setAnswers] = useState<AnswersMap>({});

  const submittedRef = useRef(false);
  const [submitted, setSubmitted] = useState(false);
  const sessionIdRef = useRef<number | null>(null);
  const quizNavRef = useRef<QuizNavHandle>(null);

  const startExam = useCallback(async () => {
    setLoading(true);
    setError(null);
    setActiveConflict(null);

    const endpoint = isSecureMode
      ? "/api/v2/exams/start-secure"
      : "/api/v2/exams/start-visible";

    try {
      const response = await api.post<PackageExamData>(endpoint, {
        packageId: Number(id),
      });

      if (response.data) {
        setExamData(response.data);
        sessionIdRef.current = response.data.data.sessionId;
        // Uzilib qolgan sessiya javoblarini tiklash
        const restored = restoreAnswers(response.data.data.sessionId);
        if (restored) setAnswers(restored);
        // Active exam cache ni yangilaymiz
        mutate("/api/v2/exams/active", null, false);
      }
    } catch (err: unknown) {
      // Active session bor-yo'qligini tekshirish
      try {
        const activeRes = await api.get<{ data: ActiveExamInfo | null }>("/api/v2/exams/active");
        if (activeRes.data?.data?.sessionId) {
          setActiveConflict(activeRes.data.data);
          return;
        }
      } catch (checkErr) {
        // Active tekshiruv ham xato — asl start xatosi ko'rsatiladi
        reportError("packageExam.checkActive", checkErr);
      }

      setError({ error: err });
    } finally {
      setLoading(false);
    }
  }, [id, isSecureMode]);

  useEffect(() => {
    if (!examData && id) {
      startExam();
    }
  }, [id, examData, startExam]);

  /*
   * OLIB TASHLANDI — unmount'dagi `navigator.sendBeacon(.../abandon)`.
   * sendBeacon doim POST yuboradi (endpoint DELETE) va Authorization header
   * qo'sha olmaydi — ya'ni hech qachon ishlamagan. Ishlaganda ham tasodifiy
   * "orqaga" bosish imtihonni bekor qilardi. Sessiyani bekor qilish endi
   * faqat foydalanuvchi aniq tanlaganda (conflict UI / "Chiqish") bajariladi.
   */

  // Javoblarni avtomatik saqlash (localStorage + server).
  useAutoSave({
    sessionId: examData?.data.sessionId ?? null,
    answers,
    questions: examData?.data.questions ?? [],
    enabled: !!examData && !submittedRef.current,
  });

  // W-07: imtihon davomida ilova ichidagi navigatsiyani va sahifani yopishni to'sish.
  // QuizNav submit/"Chiqish" dan keyin o'zi navigatsiya qiladi — undan oldin `release()`.
  const guard = useExamLeaveGuard(!!examData && !submitted);

  const handleAbandonAndRestart = async () => {
    if (!activeConflict) return;
    setLoading(true);
    try {
      await api.delete(`/api/v2/exams/${activeConflict.sessionId}/abandon`);
      mutate("/api/v2/exams/active", { data: null }, false);
    } catch (abandonErr) {
      // Abandon xatosi — baribir qayta urinib ko'ramiz
      reportError("packageExam.abandon", abandonErr);
    }
    setActiveConflict(null);
    await startExam();
  };

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

  const handleFinish = () => {
    // Avval `document.querySelector("[data-finish-button]").click()` edi —
    // DOM'ga bog'liq mo'rt hack. QuizNav imperativ API'si ishlatiladi.
    quizNavRef.current?.openFinishModal();
  };

  const handleSubmitSuccess = () => {
    submittedRef.current = true;
    guard.release();
    setSubmitted(true);
  };

  // Yuklash
  if (loading) {
    return (
      <Center h="100dvh">
        <Box ta="center">
          <Loader size="lg" mb="md" />
          <Text c="dimmed">{t("exam.loading")}</Text>
        </Box>
      </Center>
    );
  }

  // Tugallanmagan imtihon bor — conflict UI
  if (activeConflict) {
    return (
      <Center h="100dvh">
        <Container size="xs">
          <Paper p="xl" radius="md" withBorder shadow="md" ta="center">
            <ThemeIcon size={64} radius="xl" color="orange" variant="light" mb="md" mx="auto">
              <IconAlertCircle size={32} />
            </ThemeIcon>
            <Title order={3} mb="sm">
              {t("me.stats.resumeExam")}
            </Title>
            <Text c="dimmed" mb="xl" size="sm">
              {t("exam.activeSessionDesc")}
            </Text>
            <Stack gap="sm">
              <Button
                loading={loading}
                leftSection={<IconPlayerPlay size={18} />}
                onClick={handleAbandonAndRestart}
              >
                {t("exam.abandonAndRestart")}
              </Button>
              {activeConflict.packageId && (
                <Button
                  variant="light"
                  onClick={() => navigate(`/packages/${activeConflict.packageId}`)}
                >
                  {t("me.stats.continue")}
                </Button>
              )}
              {activeConflict.ticketId && (
                <Button
                  variant="light"
                  onClick={() => navigate(`/tickets/${activeConflict.ticketId}`)}
                >
                  {t("me.stats.continue")}
                </Button>
              )}
              <Button
                variant="subtle"
                color="gray"
                onClick={() => navigate("/packages")}
              >
                {t("common.back")}
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Center>
    );
  }

  // Xato
  if (error) {
    return (
      <Center h="100dvh">
        <Box ta="center">
          <Title order={3} c="red" mb="md">
            {t("common.errorOccurred")}
          </Title>
          <Text c="dimmed" mb="lg">
            {getErrorMessage(error.error, t(errorKeyFor(error.error, "notification.startError")))}
          </Text>
          <Group justify="center">
            <Button variant="outline" onClick={() => navigate("/packages")}>
              {t("common.back")}
            </Button>
            <Button onClick={startExam}>{t("common.retry")}</Button>
          </Group>
        </Box>
      </Center>
    );
  }

  if (!examData) {
    return (
      <Center h="100dvh">
        <Box ta="center">
          <Title order={3} mb="md">
            {t("exam.notFound")}
          </Title>
          <Text c="dimmed" mb="lg">
            {t("exam.notFoundDesc")}
          </Text>
          <Button onClick={() => navigate("/packages")}>
            {t("common.back")}
          </Button>
        </Box>
      </Center>
    );
  }

  return (
    <>
      <SEO
        title={`${t("seo.packageExam.title")} — ${examData.data.totalQuestions} ${t("dashboard.questionsUnit")}`}
        description={`${t("seo.packageExam.desc")} — ${examData.data.totalQuestions} ${t("dashboard.questionsUnit")}, ${examData.data.durationMinutes} ${t("dashboard.minutesUnit")}.`}
        canonical={`/packages/${id}`}
        noIndex
      />
      <QuizNav
        ref={quizNavRef}
        sessionId={examData.data.sessionId}
        questions={examData.data.questions}
        totalQuestions={examData.data.totalQuestions}
        durationMinutes={examData.data.durationMinutes}
        answers={answers}
        onReset={handleReset}
        backUrl="/packages"
        isSecureMode={isSecureMode}
        onSubmitSuccess={handleSubmitSuccess}
        onBeforeExit={guard.release}
      />
      <OfflineBanner />
      <QuizContent
        questions={examData.data.questions}
        onAnswerSelect={handleAnswerSelect}
        onFinish={handleFinish}
        selectedAnswers={answers}
        isSecureMode={isSecureMode}
      />

      {/* W-07: faol imtihondan chiqishni tasdiqlash */}
      <ConfirmFinishModal
        variant="leave"
        opened={guard.blocked}
        onCancel={guard.stay}
        onConfirm={guard.leave}
      />
    </>
  );
};

export default PackageExamPage;
