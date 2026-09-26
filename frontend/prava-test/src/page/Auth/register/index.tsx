import React, { useState, useEffect, useRef } from "react";
import {
  Alert,
  Anchor,
  Box,
  Button,
  Center,
  Flex,
  Group,
  PasswordInput,
  PinInput,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useNavigate, useLocation, useSearchParams, Navigate } from "react-router-dom";
import { useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";
import {
  IconAlertCircle,
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconExternalLink,
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
import AuthLayout from "@/components/auth/AuthLayout";
import AuthCard from "@/components/auth/AuthCard";
import SocialAuthGroup from "@/components/auth/SocialAuthGroup";
import AuthSecurityNotice from "@/components/auth/AuthSecurityNotice";

// Real-time password validation helper
export const isPasswordSecure = (val: string): boolean => {
  if (!val || val.length < 8) return false;
  const hasUpper = /[A-Z]/.test(val);
  const hasLower = /[a-z]/.test(val);
  const hasNumber = /\d/.test(val);
  const hasSpecial = /[@$!%*?&]/.test(val);
  return hasUpper && hasLower && hasNumber && hasSpecial;
};

const Register_Page: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { register: authRegister, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const isCapsLock = useCapsLock();
  const navigate = useNavigate();
  const location = useLocation();

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
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
    validate: {
      firstName: (value) =>
        value.trim().length < 2
          ? t("validation.nameTooShort", "Ism kamida 2 ta belgidan iborat bo'lishi kerak")
          : null,
      lastName: (value) =>
        value.trim().length < 2
          ? t("validation.nameTooShort", "Familiya kamida 2 ta belgidan iborat bo'lishi kerak")
          : null,
      email: (value) => {
        if (!value || value.trim().length === 0)
          return t("validation.invalidEmail", "Email manzilini kiriting");
        return /^\S+@\S+\.\S+$/.test(value.trim())
          ? null
          : t("validation.invalidEmail", "Email manzili noto'g'ri formatda");
      },
      password: (value) => {
        if (!isPasswordSecure(value)) {
          return t(
            "authV2.register.passwordComplexity",
            "Parol kamida 8 ta belgi, katta-kichik harf, raqam va maxsus belgidan (@$!%*?&) iborat bo'lishi kerak"
          );
        }
        return null;
      },
    },
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const codeParam = searchParams.get("code") || searchParams.get("token");
    const emailParam = searchParams.get("email");
    if (emailParam) form.setFieldValue("email", emailParam);
    if (codeParam) {
      setCode(codeParam);
      setStep(2);
    }
  }, [searchParams]);

  useEffect(() => {
    if (step === 2 && countdown > 0) {
      timerRef.current = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [step, countdown]);

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  // Step 1: Send registration data & initiate Email OTP
  const handleInit = async (values: typeof form.values) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const payload = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        phoneNumber: null,
        password: values.password,
        verificationType: "EMAIL",
        preferredLanguage: i18n.language || "uzl",
      };

      await api.post("/api/v1/auth/register/init", payload);
      setStep(2);
      setCountdown(60);
      setCode("");
    } catch (error: unknown) {
      const msg = getErrorMessage(
        error,
        t("register.errorMessage", "Ro'yxatdan o'tishda xatolik yuz berdi")
      );
      setErrorMessage(msg);
      notifications.show({
        title: t("register.errorTitle", "Xatolik"),
        message: msg,
        color: "red",
        withBorder: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Resend Email OTP code
  const handleResendCode = async () => {
    if (countdown > 0) return;
    setResending(true);
    setErrorMessage(null);
    try {
      const payload = {
        firstName: form.values.firstName.trim(),
        lastName: form.values.lastName.trim(),
        email: form.values.email.trim(),
        phoneNumber: null,
        password: form.values.password,
        verificationType: "EMAIL",
        preferredLanguage: i18n.language || "uzl",
      };

      await api.post("/api/v1/auth/register/init", payload);
      setCountdown(60);
      notifications.show({
        title: t("common.success", "Muvaffaqiyatli"),
        message: t("register.otpSentTo", "Tasdiqlash kodi qayta yuborildi"),
        color: "teal",
        withBorder: true,
      });
    } catch (error: unknown) {
      const msg = getErrorMessage(
        error,
        t("register.errorMessage", "Kodni qayta yuborishda xatolik yuz berdi")
      );
      setErrorMessage(msg);
    } finally {
      setResending(false);
    }
  };

  // Step 2: Verify OTP and complete registration
  const handleComplete = async () => {
    if (code.length < 6) return;

    setLoading(true);
    setErrorMessage(null);
    try {
      const payload = {
        firstName: form.values.firstName.trim(),
        lastName: form.values.lastName.trim(),
        email: form.values.email.trim(),
        phoneNumber: null,
        password: form.values.password,
        verificationType: "EMAIL",
        preferredLanguage: i18n.language || "uzl",
      };

      const res = await api.post(
        `/api/v1/auth/register/complete?code=${code.trim()}`,
        payload
      );

      if (res.data) {
        authRegister(res.data.data);
        notifications.show({
          title: t("register.successTitle", "Tabriklaymiz!"),
          message: t("register.successMessage", "Hisobingiz muvaffaqiyatli yaratildi"),
          color: "teal",
          withBorder: true,
        });
        navigate(from, { replace: true });
      }
    } catch (error: unknown) {
      const msg = getErrorMessage(
        error,
        t("register.codeError", "Tasdiqlash kodi noto'g'ri yoki muddati o'tgan")
      );
      setErrorMessage(msg);
      notifications.show({
        title: t("register.errorTitle", "Xatolik"),
        message: msg,
        color: "red",
        withBorder: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const getInboxLink = (email: string) => {
    if (!email || !email.includes("@")) return "#";
    const domain = email.split("@")[1].toLowerCase();
    if (domain === "gmail.com") return "https://mail.google.com";
    if (domain === "yandex.ru" || domain === "ya.ru") return "https://mail.yandex.ru";
    if (domain === "mail.ru") return "https://e.mail.ru";
    if (domain === "outlook.com" || domain === "hotmail.com") return "https://outlook.live.com";
    return `https://${domain}`;
  };

  const passwordValid = isPasswordSecure(form.values.password);

  return (
    <AuthLayout
      seoTitle={t("seo.register.title", "Ro'yxatdan o'tish")}
      seoDescription={t("seo.register.desc", "Bepul ro'yxatdan o'ting va testlarni boshlang.")}
      canonicalUrl="/auth/register"
      breadcrumbs={[
        { label: t("nav.home", "Bosh sahifa"), href: "/" },
        { label: t("authV2.register.title", "Ro'yxatdan o'tish") },
      ]}
      stepIndicator={step === 2 ? t("authV2.register.step2Badge", "2-bosqich: Tasdiqlash") : undefined}
    >
      <AuthCard
        icon={<img src="/logo.svg" alt="Prava Online" width={32} height={32} style={{ objectFit: "contain" }} />}
        title={t("authV2.register.title", "Ro'yxatdan o'tish")}
        subtitle={t(
          "authV2.register.subtitle",
          "Bepul hisob yarating va imtihonga tayyorlanishni boshlang."
        )}
        switchPrompt={t("authV2.register.hasAccount", "Allaqachon akkauntingiz bormi?")}
        switchLinkText={t("authV2.register.loginLink", "Tizimga kirish")}
        switchLinkHref="/auth/login"
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

        {step === 1 ? (
          <form
            onSubmit={form.onSubmit(handleInit)}
            onChange={() => errorMessage && setErrorMessage(null)}
            noValidate
          >
            <Stack gap={8}>
              {/* First Name & Last Name 2-column grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", width: "100%" }}>
                <TextInput
                  id="register-firstName"
                  label={t("authV2.register.firstName", "Ism")}
                  placeholder={t(
                    "authV2.register.firstNamePlaceholder",
                    "Masalan: Ali"
                  )}
                  required
                  size="sm"
                  radius="md"
                  autoComplete="given-name"
                  leftSection={<IconUser size={15} />}
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
                  aria-invalid={!!form.errors.firstName}
                  {...form.getInputProps("firstName")}
                />

                <TextInput
                  id="register-lastName"
                  label={t("authV2.register.lastName", "Familiya")}
                  placeholder={t(
                    "authV2.register.lastNamePlaceholder",
                    "Masalan: Valiyev"
                  )}
                  required
                  size="sm"
                  radius="md"
                  autoComplete="family-name"
                  leftSection={<IconUser size={15} />}
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
                  aria-invalid={!!form.errors.lastName}
                  {...form.getInputProps("lastName")}
                />
              </div>

              {/* Email Address Input */}
              <TextInput
                id="register-email"
                type="email"
                label={t("authV2.register.emailLabel", "Email manzil")}
                placeholder={t(
                  "authV2.register.emailPlaceholder",
                  "example@mail.com"
                )}
                required
                size="sm"
                radius="md"
                autoComplete="email"
                leftSection={<IconMail size={15} />}
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
                aria-invalid={!!form.errors.email}
                {...form.getInputProps("email")}
              />

              {/* Password Input with Real-time Indicator in Label */}
              <Box>
                <Box mb={2}>
                  <Group justify="space-between" align="center" wrap="nowrap">
                    <Text
                      component="label"
                      htmlFor="register-password"
                      size="xs"
                      fw={600}
                      style={{ color: "var(--text, #0f172a)", display: "inline-flex", gap: 2 }}
                    >
                      <span>{t("authV2.register.passwordLabel", "Parol")}</span>
                      <span style={{ color: "#ef4444" }}>*</span>
                    </Text>
                    {form.values.password.length > 0 && (
                      <Text
                        size="xs"
                        fw={600}
                        style={{
                          color: passwordValid ? "#10b981" : "var(--text-muted, #94a3b8)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: "11px",
                          transition: "color 0.2s ease",
                        }}
                      >
                        {passwordValid ? (
                          <>
                            <IconCheck size={14} stroke={2.5} />
                            <span>{t("authV2.register.passwordValid", "Parol talablarga mos")}</span>
                          </>
                        ) : (
                          <span>{t("authV2.register.passwordHint", "8+ belgi, A-Z, 0-9, @$!")}</span>
                        )}
                      </Text>
                    )}
                  </Group>
                </Box>

                <PasswordInput
                  id="register-password"
                  placeholder={t(
                    "authV2.register.passwordPlaceholder",
                    "Kamida 8 ta belgi"
                  )}
                  required
                  size="sm"
                  radius="md"
                  autoComplete="new-password"
                  leftSection={<IconLock size={15} />}
                  styles={{
                    input: {
                      height: 38,
                      fontSize: "13.5px",
                      borderRadius: "10px",
                      color: "var(--text, #0f172a)",
                      backgroundColor: "var(--bg-input, #f8fafc)",
                      borderColor: passwordValid
                        ? "#10b981"
                        : "var(--border, #e2e8f0)",
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

              {/* Submit Button */}
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
                  ? t("authV2.register.submitting", "Ro'yxatdan o'tilmoqda...")
                  : t("authV2.register.submit", "Ro'yxatdan o'tish")}
              </Button>

              <SocialAuthGroup mode="register" />

              <AuthSecurityNotice />
            </Stack>
          </form>
        ) : (
          /* Step 2: Email OTP Verification */
          <Stack gap={12}>
            <Alert
              icon={<IconMail size={16} />}
              color="blue"
              variant="light"
              radius="md"
              p="xs"
            >
              <Text size="xs">
                {t(
                  "authV2.forgot.otpPrompt",
                  "Biz {{recipient}} manziliga 6 xonali tasdiqlash kodini yubordik."
                ).replace("{{recipient}}", form.values.email)}
              </Text>
            </Alert>

            <Center>
              <Button
                component="a"
                href={getInboxLink(form.values.email)}
                target="_blank"
                rel="noopener noreferrer"
                variant="light"
                size="xs"
                color="blue"
                radius="md"
                rightSection={<IconExternalLink size={14} />}
              >
                {t("register.openMailApp", "Pochtani ochish")}
              </Button>
            </Center>

            <Box>
              <Text size="xs" fw={600} mb={4} ta="center">
                {t("authV2.forgot.otpLabel", "Tasdiqlash kodini kiriting")}
              </Text>
              <Center>
                <PinInput
                  length={6}
                  size="md"
                  type="number"
                  placeholder="○"
                  value={code}
                  onChange={setCode}
                  autoFocus
                  radius="md"
                  aria-label={t("authV2.forgot.otpLabel", "Tasdiqlash kodi")}
                />
              </Center>
            </Box>

            <Group justify="center" gap={6}>
              <Text size="xs" c="dimmed">
                {t("register.didntReceive", "Kod kelmadimi?")}
              </Text>
              <Button
                variant="subtle"
                size="compact-xs"
                onClick={handleResendCode}
                disabled={countdown > 0 || resending}
                loading={resending}
              >
                {countdown > 0
                  ? t("authV2.forgot.resendIn", { seconds: countdown })
                  : t("authV2.forgot.resendPrompt", "Kodni qayta yuborish")}
              </Button>
            </Group>

            <Button
              size="sm"
              fullWidth
              radius="md"
              onClick={handleComplete}
              loading={loading}
              disabled={code.length < 6}
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
                ? t("authV2.forgot.verifying", "Tasdiqlanmoqda...")
                : t("authV2.forgot.verifyBtn", "Kodni tasdiqlash")}
            </Button>

            <Flex justify="center" mt={2}>
              <Anchor
                component="button"
                type="button"
                size="xs"
                c="dimmed"
                onClick={() => setStep(1)}
                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                <IconArrowLeft size={14} />
                <span>{t("common.back", "Orqaga")}</span>
              </Anchor>
            </Flex>
          </Stack>
        )}
      </AuthCard>
    </AuthLayout>
  );
};

export default Register_Page;
