import {
  Alert,
  Anchor,
  Box,
  Button,
  Center,
  Container,
  Divider,
  Group,
  Image,
  Paper,
  PasswordInput,
  SimpleGrid,
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
import {
  IconAlertCircle,
  IconDeviceMobile,
  IconLock,
  IconMail,
  IconUser,
} from "@tabler/icons-react";
import GoogleLoginButton from "../../../components/auth/GoogleLoginButton";
import TelegramLoginButton from "../../../components/auth/TelegramLoginButton";
import SEO from "../../../components/common/SEO";
import { getErrorMessage } from "../../../types/errors";
import { useCapsLock } from "../../../hooks/useCapsLock";
import CapsLockWarning from "../../../components/auth/CapsLockWarning";
import AuthSecurityBadge from "../../../components/auth/AuthSecurityBadge";
import { normalizeUzPhone } from "../../../utils/phoneUtils";

const Login_Page = () => {
  const { t, i18n } = useTranslation();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const isCapsLock = useCapsLock();

  // Redirect destination after login (from ProtectedRoute state or default /me)
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname || "/me";

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

  // Agar foydalanuvchi allaqachon tizimga kirgan bo'lsa — redirect
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setErrorMessage(null);

    // Normalize identifier: if it's phone-like (digits, +), clean to backend format, else trimmed email
    let cleanIdentifier = values.identifier.trim();
    const digitsOnly = cleanIdentifier.replace(/\D/g, "");
    if (digitsOnly.length >= 9 && !cleanIdentifier.includes("@")) {
      cleanIdentifier = normalizeUzPhone(cleanIdentifier);
    }

    try {
      const response = await api.post("/api/v1/auth/login", {
        identifier: cleanIdentifier,
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
          color: "teal",
          withBorder: true,
        });
      }
    } catch (err: unknown) {
      const msg = getErrorMessage(err, t("auth.loginError"));
      setErrorMessage(msg);
      notifications.show({
        color: "red",
        title: t("auth.errorTitle"),
        message: msg,
        withBorder: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Determine dynamic icon for identifier
  const getIdentifierIcon = () => {
    const val = form.values.identifier.trim();
    if (val.includes("@")) return <IconMail size={18} />;
    if (/^\+?\d+$/.test(val)) return <IconDeviceMobile size={18} />;
    return <IconUser size={18} />;
  };

  return (
    <Box className="auth-page-container">
      <Container size={480} maw={480} p={{ base: "xs", sm: 0 }} className="auth-page-inner">
        <SEO
          title="Kirish - Prava Online platformasiga kirish"
          description="Prava Online platformasiga kiring va haydovchilik guvohnomasi imtihoniga tayyorlanishni davom eting. Google yoki Telegram orqali tez kirish."
          keywords="prava online kirish, login, haydovchilik guvohnomasi, вход prava online"
          canonical="/auth/login"
        />

        {/* Header section with brand mark */}
        <Stack gap={6} align="center" mb={{ base: 16, sm: 24 }}>
          <Center
            style={{
              width: 44,
              height: 44,
              borderRadius: "var(--radius-sm, 12px)",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              boxShadow: "var(--card-shadow-sm)",
            }}
          >
            <Image
              src="/favicon.svg"
              fallbackSrc="/logo.svg"
              alt="Prava Online Logo"
              w={26}
              h={26}
              fit="contain"
            />
          </Center>

          <Title order={2} ta="center" size="1.45rem" fw={800} style={{ letterSpacing: "-0.02em", lineHeight: 1.25 }}>
            {t("auth.welcome")}
          </Title>

          <Text size="sm" c="dimmed" ta="center" maw={360} style={{ lineHeight: 1.45 }}>
            {t("auth.loginSubtitle")}
          </Text>

          <Group gap={6} justify="center">
            <Text size="xs" c="dimmed">
              {t("auth.noAccount")}
            </Text>
            <Anchor component={Link} to="/auth/register" size="xs" fw={700} c="brand">
              {t("auth.register")}
            </Anchor>
          </Group>
        </Stack>

        <Paper
          withBorder
          shadow="sm"
          p={{ base: 20, sm: 32 }}
          radius="lg"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            boxShadow: "var(--card-shadow-md)",
          }}
        >
          {errorMessage && (
            <Alert
              icon={<IconAlertCircle size={18} />}
              color="red"
              variant="light"
              radius="md"
              mb="md"
              withCloseButton
              onClose={() => setErrorMessage(null)}
              role="alert"
            >
              {errorMessage}
            </Alert>
          )}

          <form
            onSubmit={form.onSubmit(handleSubmit)}
            onChange={() => errorMessage && setErrorMessage(null)}
            noValidate
          >
            <Stack gap={20}>
              <TextInput
                label={t("auth.identifier")}
                placeholder={t("auth.identifierPlaceholder")}
                required
                size="md"
                radius="md"
                autoComplete="username"
                leftSection={getIdentifierIcon()}
                styles={{ input: { height: 52, fontSize: "15px" } }}
                aria-required="true"
                aria-invalid={!!form.errors.identifier}
                {...form.getInputProps("identifier")}
              />

              <Box>
                <PasswordInput
                  label={t("auth.password")}
                  placeholder={t("auth.passwordPlaceholder")}
                  required
                  size="md"
                  radius="md"
                  autoComplete="current-password"
                  leftSection={<IconLock size={18} />}
                  styles={{ input: { height: 52, fontSize: "15px" } }}
                  aria-required="true"
                  aria-invalid={!!form.errors.password}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  {...form.getInputProps("password")}
                />
                <CapsLockWarning active={isCapsLock && passwordFocused} />
              </Box>

              <Group justify="flex-end" mt={-6}>
                <Anchor
                  component={Link}
                  to="/auth/forgot-password"
                  size="xs"
                  c="dimmed"
                  fw={600}
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
                h={56}
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  boxShadow: "0 4px 14px rgba(25, 113, 194, 0.25)",
                }}
              >
                {t("auth.login")}
              </Button>

              <Divider
                label={t("auth.orContinueWith")}
                labelPosition="center"
                my={4}
              />

              <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm">
                <GoogleLoginButton mode="login" />
                <TelegramLoginButton mode="login" />
              </SimpleGrid>
            </Stack>
          </form>

          <AuthSecurityBadge compact />
        </Paper>
      </Container>
    </Box>
  );
};

export default Login_Page;
