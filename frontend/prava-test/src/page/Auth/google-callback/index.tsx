import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Center, Container, Loader, Paper, Stack, Text, Title, Button } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { IconBrandGoogle } from "@tabler/icons-react";
import { useAuth } from "../../../auth/AuthContext";
import { useAuthModal } from "../../../auth/AuthModalContext";
import api from "../../../api/api";
import SEO from "../../../components/common/SEO";
import { showToast } from "../../../utils/notificationUtils";
import { getErrorMessage } from "../../../types/errors";

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { executePending } = useAuthModal();
  const { t, i18n } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError(errorParam);
      return;
    }

    if (!code) {
      setError("missing_code");
      return;
    }

    const savedState = localStorage.getItem("google_oauth_state");
    if (savedState && savedState !== state) {
      setError("invalid_state");
      return;
    }

    const verifyCode = async () => {
      try {
        const response = await api.post("/api/v1/auth/google/callback", { code, state });

        if (response.data.success) {
          const userLang = response.data.data.user?.preferredLanguage;
          if (userLang) {
            i18n.changeLanguage(userLang);
          }

          login(response.data.data);

          showToast({
            id: "auth-google-success",
            title: t("auth.google.successTitle"),
            message: t("auth.google.successMessage"),
            color: "green",
            withBorder: true,
          });

          executePending();
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err, t("auth.google.errorMessage")));
      }
    };

    verifyCode();
  }, [searchParams, login, executePending, t, i18n]);

  return (
    <>
      <SEO
        title={t("auth.google.loginTitle", "Google orqali kirish")}
        description={t("auth.google.loginDescription", "Google hisobi orqali tizimga kirish")}
        noIndex
      />
      <Container size={440} my={{ base: 40, sm: 80 }}>
        <Center>
          <Paper withBorder shadow="md" p="xl" radius="md" w="100%" ta="center">
            <Stack align="center" gap="md">
              {error ? (
                <>
                  <Title order={3} c="red">{t("common.error")}</Title>
                  <Text c="dimmed" maw={350}>{error}</Text>
                  <Button onClick={() => navigate("/")} mt="md">
                    {t("common.backToHome")}
                  </Button>
                </>
              ) : (
                <>
                  <IconBrandGoogle size={48} color="#EA4335" />
                  <Loader size="md" color="#EA4335" />
                  <Text c="dimmed">{t("auth.google.authenticating", "Google orqali kirilmoqda...")}</Text>
                </>
              )}
            </Stack>
          </Paper>
        </Center>
      </Container>
    </>
  );
};

export default GoogleCallback;
