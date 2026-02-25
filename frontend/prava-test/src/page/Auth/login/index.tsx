import {
  Anchor,
  Button,
  Container,
  Divider,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { useForm } from "@mantine/form";
import { useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import api from "../../../api/api";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import { IconLock, IconUser } from "@tabler/icons-react";
import GoogleLoginButton from "../../../components/auth/GoogleLoginButton";
import TelegramLoginButton from "../../../components/auth/TelegramLoginButton";
import SEO from "../../../components/common/SEO";

const Login_Page = () => {
  const { t, i18n } = useTranslation();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  // Redirect destination after login (from ProtectedRoute state or default /me)
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/me";

  // Agar foydalanuvchi allaqachon tizimga kirgan bo'lsa — redirect
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const form = useForm({
    initialValues: {
      identifier: "",
      password: "",
    },
    validate: {
      identifier: (value) =>
        value.trim().length < 3
          ? t("validation.minChars", { count: 3 })
          : null,
      password: (value) =>
        value.length < 6 ? t("validation.minChars", { count: 6 }) : null,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const response = await api.post("/api/v1/auth/login", {
        identifier: values.identifier.trim(),
        password: values.password,
      });

      if (response.data.success) {
        const userLang = response.data.data.user?.preferredLanguage;
        if (userLang) {
          i18n.changeLanguage(userLang);
        }

        login(response.data.data);
        navigate(from, { replace: true });

        notifications.show({
          title: t("auth.not_title"),
          message: t("auth.not_massage"),
          color: "green",
          withBorder: true,
        });
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      notifications.show({
        color: "red",
        title: t("auth.errorTitle"),
        message:
          error?.response?.data?.message || t("auth.loginError"),
        withBorder: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={480} my={{ base: 30, sm: 60 }}>
      <SEO
        title="Kirish"
        description="Prava Online platformasiga kiring va haydovchilik guvohnomasi imtihoniga tayyorlanishni davom eting."
        canonical="/auth/login"
      />
      <Stack gap={4} align="center" mb="lg">
        <Title order={2} ta="center">
          {t("auth.welcome")}
        </Title>
        <Group gap={6}>
          <Text size="sm" c="dimmed">
            {t("auth.noAccount")}
          </Text>
          <Anchor component={Link} to="/auth/register" size="sm" fw={600}>
            {t("auth.register")}
          </Anchor>
        </Group>
      </Stack>

      <Paper withBorder shadow="md" p={{ base: "lg", sm: "xl" }} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label={t("auth.identifier")}
              placeholder="email@example.com"
              required
              size="md"
              radius="md"
              leftSection={<IconUser size={18} />}
              {...form.getInputProps("identifier")}
            />

            <PasswordInput
              label={t("auth.password")}
              required
              size="md"
              radius="md"
              leftSection={<IconLock size={18} />}
              {...form.getInputProps("password")}
            />

            <Group justify="flex-end">
              <Anchor
                component={Link}
                to="/auth/forgot-password"
                size="sm"
                c="dimmed"
              >
                {t("auth.forgotPassword")}
              </Anchor>
            </Group>

            <Button
              size="md"
              fullWidth
              radius="md"
              type="submit"
              loading={loading}
            >
              {t("auth.login")}
            </Button>

            <Divider
              label={t("auth.orContinueWith")}
              labelPosition="center"
            />

            <GoogleLoginButton mode="login" />
            <TelegramLoginButton mode="login" />
          </Stack>
        </form>
      </Paper>
    </Container>
  );
};

export default Login_Page;
