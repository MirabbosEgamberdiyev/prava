import React, { useState } from "react";
import {
  Alert,
  Anchor,
  Box,
  Button,
  Group,
  PasswordInput,
  Stack,
  TextInput,
} from "@mantine/core";
import { Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";
import {
  IconAlertCircle,
  IconArrowRight,
  IconDeviceMobile,
  IconLock,
  IconMail,
  IconUser,
} from "@tabler/icons-react";
import { useAuth } from "@/auth/AuthContext";
import api from "@/api/api";
import { notifications } from "@mantine/notifications";
import { getErrorMessage } from "@/types/errors";
import { useCapsLock } from "@/hooks/useCapsLock";
import CapsLockWarning from "@/components/auth/CapsLockWarning";
import { normalizeUzPhone } from "@/utils/phoneUtils";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthCard from "@/components/auth/AuthCard";
import SocialAuthGroup from "@/components/auth/SocialAuthGroup";
import AuthSecurityNotice from "@/components/auth/AuthSecurityNotice";

const Login_Page: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const isCapsLock = useCapsLock();

  const locationState = location.state as
    | { from?: string | { pathname: string; search?: string } }
    | undefined;
  let from = "/me";
  if (typeof locationState?.from === "string") {
    from = locationState.from;
  } else if (locationState?.from?.pathname) {
    from = locationState.from.pathname + (locationState.from.search || "");
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

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setErrorMessage(null);

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
          title: t("auth.not_title", "Xush kelibsiz!"),
          message: t("auth.not_massage", "Tizimga muvaffaqiyatli kirdingiz"),
          color: "teal",
          withBorder: true,
        });
      }
    } catch (err: unknown) {
      const msg = getErrorMessage(err, t("auth.loginError", "Login yoki parol noto'g'ri"));
      setErrorMessage(msg);
      notifications.show({
        color: "red",
        title: t("auth.errorTitle", "Xatolik"),
        message: msg,
        withBorder: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const getIdentifierIcon = () => {
    const val = form.values.identifier.trim();
    if (val.includes("@")) return <IconMail size={18} />;
    if (/^\+?\d+$/.test(val)) return <IconDeviceMobile size={18} />;
    return <IconUser size={18} />;
  };

  return (
    <AuthLayout
      seoTitle={t("seo.login.title", "Tizimga kirish")}
      seoDescription={t("seo.login.desc", "Shaxsiy kabinetingizga kiring.")}
      canonicalUrl="/auth/login"
    >
      <AuthCard
        icon={<img src="/logo.svg" alt="Prava Online" width={32} height={32} style={{ objectFit: "contain" }} />}
        title={t("authV2.login.title", "Xush kelibsiz!")}
        subtitle={t(
          "authV2.login.subtitle",
          "Platformaga kirish uchun profilingiz ma'lumotlarini kiriting."
        )}
        switchPrompt={t("authV2.login.noAccount", "Akkaunt mavjud emasmi?")}
        switchLinkText={t("authV2.login.registerLink", "Ro'yxatdan o'tish")}
        switchLinkHref="/auth/register"
      >
        {errorMessage && (
          <Alert
            icon={<IconAlertCircle size={18} />}
            color="red"
            variant="light"
            radius="md"
            mb="xs"
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
          <Stack gap={8}>
            <TextInput
              id="login-identifier"
              label={t("authV2.login.identifierLabel", "Email yoki telefon raqami")}
              placeholder={t(
                "authV2.login.identifierPlaceholder",
                "Email yoki +998 90 123 45 67"
              )}
              required
              size="sm"
              radius="md"
              autoComplete="username"
              leftSection={getIdentifierIcon()}
              styles={{
                input: {
                  height: 38,
                  fontSize: "13.5px",
                  borderRadius: "10px",
                  color: "var(--text, #0f172a)",
                  backgroundColor: "var(--bg-input, #f8fafc)",
                  borderColor: "var(--border, #e2e8f0)",
                },
                label: {
                  fontSize: "12px",
                  fontWeight: 600,
                  marginBottom: 2,
                  color: "var(--text, #0f172a)",
                },
              }}
              aria-required="true"
              aria-invalid={!!form.errors.identifier}
              {...form.getInputProps("identifier")}
            />

            <Box>
              <PasswordInput
                id="login-password"
                label={t("authV2.login.passwordLabel", "Parol")}
                placeholder={t(
                  "authV2.login.passwordPlaceholder",
                  "Parolingizni kiriting"
                )}
                required
                size="sm"
                radius="md"
                autoComplete="current-password"
                leftSection={<IconLock size={15} />}
                styles={{
                  input: {
                    height: 38,
                    fontSize: "13.5px",
                    borderRadius: "10px",
                    color: "var(--text, #0f172a)",
                    backgroundColor: "var(--bg-input, #f8fafc)",
                    borderColor: "var(--border, #e2e8f0)",
                  },
                  label: {
                    fontSize: "12px",
                    fontWeight: 600,
                    marginBottom: 2,
                    color: "var(--text, #0f172a)",
                  },
                }}
                aria-required="true"
                aria-invalid={!!form.errors.password}
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
                fw={600}
                style={{ transition: "color 0.2s ease" }}
              >
                {t("authV2.login.forgotPassword", "Parolni unutdingizmi?")}
              </Anchor>
            </Group>

            <Button
              size="sm"
              fullWidth
              radius="md"
              type="submit"
              loading={loading}
              disabled={loading}
              h={40}
              rightSection={<IconArrowRight size={16} />}
              style={{
                fontSize: "13.5px",
                fontWeight: 700,
                backgroundColor: "var(--primary)",
                boxShadow: "0 4px 12px rgba(var(--primary-rgb), 0.25)",
              }}
            >
              {loading
                ? t("authV2.login.submitting", "Kirish...")
                : t("authV2.login.submit", "Tizimga kirish")}
            </Button>

            <SocialAuthGroup mode="login" />

            <AuthSecurityNotice />
          </Stack>
        </form>
      </AuthCard>
    </AuthLayout>
  );
};

export default Login_Page;
