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
import { useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { useReturnTo } from "../../../auth/useReturnTo";
import { loginPath } from "../../../utils/returnTo";
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

  // W-06: maqsadli manzil — `?returnTo=` (yagona manba), xavfsiz tekshirilgan
  const { returnTo, destination: from } = useReturnTo();

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
          ? t("validation.nameTooShort")
          : null,
      lastName: (value) =>
        value.trim().length < 2
          ? t("validation.lastNameTooShort")
          : null,
      email: (value) => {
        if (!value || value.trim().length === 0)
          return t("validation.invalidEmail");
        return /^\S+@\S+\.\S+$/.test(value.trim())
          ? null
          : t("validation.invalidEmail");
      },
      password: (value) => {
        if (!isPasswordSecure(value)) {
          return t(
            "authV2.register.passwordComplexity"
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
        t("register.errorMessage")
      );
      setErrorMessage(msg);
      notifications.show({
        title: t("register.errorTitle"),
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
        title: t("common.success"),
        message: t("register.otpSentTo"),
        color: "teal",
        withBorder: true,
      });
    } catch (error: unknown) {
      const msg = getErrorMessage(
        error,
        t("register.errorMessage")
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
          title: t("register.successTitle"),
          message: t("register.successMessage"),
          color: "teal",
          withBorder: true,
        });
        navigate(from, { replace: true });
      }
    } catch (error: unknown) {
      const msg = getErrorMessage(
        error,
        t("register.codeError")
      );
      setErrorMessage(msg);
      notifications.show({
        title: t("register.errorTitle"),
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
      seoTitle={t("seo.register.title")}
      seoDescription={t("seo.register.desc")}
      canonicalUrl="/auth/register"
      breadcrumbs={[
        { label: t("nav.home"), href: "/" },
        { label: t("authV2.register.title") },
      ]}
      stepIndicator={step === 2 ? t("authV2.register.step2Badge") : undefined}
    >
      <AuthCard
        icon={<img src="/logo.svg" alt="Prava Online" width={32} height={32} style={{ objectFit: "contain" }} />}
        title={t("authV2.register.title")}
        subtitle={t(
          "authV2.register.subtitle"
        )}
        switchPrompt={t("authV2.register.hasAccount")}
        switchLinkText={t("authV2.register.loginLink")}
        switchLinkHref={loginPath(returnTo)}
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
                  label={t("authV2.register.firstName")}
                  placeholder={t(
                    "authV2.register.firstNamePlaceholder"
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
                  label={t("authV2.register.lastName")}
                  placeholder={t(
                    "authV2.register.lastNamePlaceholder"
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
                label={t("authV2.register.emailLabel")}
                placeholder={t(
                  "authV2.register.emailPlaceholder"
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
                      <span>{t("authV2.register.passwordLabel")}</span>
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
                            <span>{t("authV2.register.passwordValid")}</span>
                          </>
                        ) : (
                          <span>{t("authV2.register.passwordHint")}</span>
                        )}
                      </Text>
                    )}
                  </Group>
                </Box>

                <PasswordInput
                  id="register-password"
                  placeholder={t(
                    "authV2.register.passwordPlaceholder"
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
                  ? t("authV2.register.submitting")
                  : t("authV2.register.submit")}
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
                {t("authV2.forgot.otpPrompt", { recipient: form.values.email })}
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
                {t("register.openMailApp")}
              </Button>
            </Center>

            <Box>
              <Text size="xs" fw={600} mb={4} ta="center">
                {t("authV2.forgot.otpLabel")}
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
                  aria-label={t("authV2.forgot.otpLabel")}
                />
              </Center>
            </Box>

            <Group justify="center" gap={6}>
              <Text size="xs" c="dimmed">
                {t("register.didntReceive")}
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
                  : t("authV2.forgot.resendPrompt")}
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
                ? t("authV2.forgot.verifying")
                : t("authV2.forgot.verifyBtn")}
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
                <span>{t("common.back")}</span>
              </Anchor>
            </Flex>
          </Stack>
        )}
      </AuthCard>
    </AuthLayout>
  );
};

export default Register_Page;
