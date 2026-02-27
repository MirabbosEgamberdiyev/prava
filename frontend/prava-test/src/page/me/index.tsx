import { useState } from "react";
import { Text, Alert, Button, Group } from "@mantine/core";
import { IconAlertCircle, IconChartBar } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { Exam_Card_List } from "../../features/me";
import useSWR from "swr";
import SEO from "../../components/common/SEO";

const User_Page = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dismissedSessionId, setDismissedSessionId] = useState<number | null>(null);

  const { data: activeExamResponse } = useSWR<{
    data: { sessionId: number; packageId?: number; ticketId?: number } | null;
  }>("/api/v2/exams/active", {
    refreshInterval: 10_000,
    shouldRetryOnError: false,
    onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
      // Don't retry on 4xx or 5xx errors
      if (error?.response?.status >= 400) return;
      if (retryCount >= 3) return;
      setTimeout(() => revalidate({ retryCount }), 5000);
    },
  });

  const activeExam = activeExamResponse?.data ?? null;
  const showBanner = activeExam?.sessionId && activeExam.sessionId !== dismissedSessionId;

  return (
    <>
      <SEO
        title="Shaxsiy kabinet"
        description="Prava Online shaxsiy kabinetingiz. Imtihonlarni boshlang, natijalarni kuzating."
        canonical="/me"
        noIndex={true}
      />
      {showBanner && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title={t("me.stats.resumeExam")}
          color="blue"
          mb="md"
          withCloseButton
          onClose={() => setDismissedSessionId(activeExam!.sessionId)}
        >
          <Group justify="space-between" align="center">
            <Text size="sm">{t("me.stats.resumeExamDesc")}</Text>
            <Button
              size="xs"
              onClick={() => {
                if (activeExam.ticketId) {
                  navigate(`/tickets/${activeExam.ticketId}`);
                } else if (activeExam.packageId) {
                  navigate(`/packages/${activeExam.packageId}`);
                } else {
                  navigate("/exam");
                }
              }}
            >
              {t("me.stats.continue")}
            </Button>
          </Group>
        </Alert>
      )}

      <Group justify="space-between" align="center" mt="lg" mb="sm">
        <Text size="xl">
          {t("me.welcome")} <strong>{user?.fullName || user?.phoneNumber || t("me.user")}</strong>
        </Text>
        <Button
          variant="light"
          size="sm"
          leftSection={<IconChartBar size={16} />}
          onClick={() => navigate("/statistics")}
        >
          {t("me.viewStats")}
        </Button>
      </Group>

      <Exam_Card_List />
    </>
  );
};

export default User_Page;
