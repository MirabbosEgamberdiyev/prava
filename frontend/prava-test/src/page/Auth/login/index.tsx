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
      <Container size={410} p={0} className="auth-page-inner">
        <SEO
          title="Kirish - Prava Online platformasiga kirish"
          description="Prava Online platformasiga kiring va haydovchilik guvohnomasi imtihoniga tayyorlanishni davom eting. Google yoki Telegram orqali tez kirish."
          keywords="prava online kirish, login, haydovchilik guvohnomasi, вход prava online"
          canonical="/auth/login"
        />

        {/* Header section with brand mark */}
        <Stack gap={4} align="center" mb={{ base: 12, sm: 16 }}>
          <Center
            style={{
              width: 40,
              height: 40,
              borderRadius: "var(--mantine-radius-md)",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <Image
              src="/favicon.svg"
              fallbackSrc="/logo.svg"
              alt="Prava Online Logo"
              w={24}
              h={24}
              fit="contain"
            />
          </Center>

          <Title order={2} ta="center" size="1.25rem" fw={700} style={{ letterSpacing: "-0.02em", lineHeight: 1.25 }}>
            {t("auth.welcome")}
          </Title>

          <Text size="xs" c="dimmed" ta="center" maw={320} style={{ lineHeight: 1.35 }}>
            {t("auth.loginSubtitle")}
          </Text>

          <Group gap={4} justify="center">
            <Text size="xs" c="dimmed">
              {t("auth.noAccount")}
            </Text>
            <Anchor component={Link} to="/auth/register" size="xs" fw={600} c="brand">
              {t("auth.register")}
            </Anchor>
          </Group>
        </Stack>

        <Paper
          withBorder
          shadow="sm"
          p={{ base: 14, sm: 22 }}
          radius="lg"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          {errorMessage && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="red"
              variant="light"
              radius="md"
              mb="sm"
              withCloseButton
              onClose={() => setErrorMessage(null)}
            >
              {errorMessage}
            </Alert>
          )}

          <form
            onSubmit={form.onSubmit(handleSubmit)}
            onChange={() => errorMessage && setErrorMessage(null)}
          >
            <Stack gap="xs">
              <TextInput
                label={t("auth.identifier")}
                placeholder={t("auth.identifierPlaceholder")}
                required
                size="sm"
                radius="md"
                autoComplete="username"
                leftSection={getIdentifierIcon()}
                {...form.getInputProps("identifier")}
              />

              <Box>
                <PasswordInput
                  label={t("auth.password")}
                  placeholder={t("auth.passwordPlaceholder")}
                  required
                  size="sm"
                  radius="md"
                  autoComplete="current-password"
                  leftSection={<IconLock size={16} />}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  {...form.getInputProps("password")}
                />
                <CapsLockWarning active={isCapsLock && passwordFocused} />
              </Box>

              <Group justify="flex-end" mt={-4}>
                <Anchor
                  component={Link}
                  to="/auth/forgot-password"
                  size="xs"
                  c="dimmed"
                  fw={500}
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
                h={42}
                fw={600}
              >
                {t("auth.login")}
              </Button>

              <Divider
                label={t("auth.orContinueWith")}
                labelPosition="center"
                my={2}
              />

              <SimpleGrid cols={{ base: 2, 320: 2 }} spacing="xs">
                <GoogleLoginButton mode="login" compact />
                <TelegramLoginButton mode="login" compact />
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
