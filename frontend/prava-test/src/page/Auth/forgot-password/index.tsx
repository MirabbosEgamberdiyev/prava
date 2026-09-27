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
  SegmentedControl,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";
import {
  IconAlertCircle,
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconDeviceMobile,
  IconInfoCircle,
  IconLock,
  IconMail,
  IconMessageDots,
} from "@tabler/icons-react";
import api from "@/api/api";
import { notifications } from "@mantine/notifications";
import { getErrorMessage } from "@/types/errors";
import { useCapsLock } from "@/hooks/useCapsLock";
import CapsLockWarning from "@/components/auth/CapsLockWarning";
import { formatUzPhone, isValidUzPhone, normalizeUzPhone } from "@/utils/phoneUtils";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthCard from "@/components/auth/AuthCard";
import AuthStepper from "@/components/auth/AuthStepper";
import { isPasswordSecure } from "@/page/Auth/register";

const ForgotPassword_Page: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const isCapsLock = useCapsLock();

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const codeParam = searchParams.get("code") || searchParams.get("token");
    const recipientParam =
      searchParams.get("recipient") ||
      searchParams.get("identifier") ||
      searchParams.get("email");
    if (codeParam) {
      setCode(codeParam);
      if (recipientParam) {
        form.setFieldValue("identifier", recipientParam);
      }
      setStep(3);
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

  const form = useForm({
    initialValues: {
      identifier: "",
      verificationType: "EMAIL" as "EMAIL" | "SMS",
      newPassword: "",
      confirmPassword: "",
    },
    validate: {
      identifier: (value, values) => {
        if (!value || value.trim().length === 0) {
          return t("validation.required");
        }
        if (values.verificationType === "EMAIL") {
          return /^\S+@\S+\.\S+$/.test(value.trim())
            ? null
            : t("validation.invalidEmail");
        }
        return isValidUzPhone(value)
          ? null
          : t("validation.phoneLength");
      },
      newPassword: (value) => {
        if (step !== 3) return null;
        if (!isPasswordSecure(value)) {
          return t(
            "validation.passwordComplexity"
          );
        }
        return null;
      },
      confirmPassword: (value, values) => {
        if (step !== 3) return null;
        if (value !== values.newPassword) {
          return t("forgotPassword.passwordMismatch");
        }
        return null;
      },
    },
  });

  // Step 1: Send verification code
  const handleSendCode = async () => {
    const validation = form.validateField("identifier");
    if (validation.hasError) return;

    setLoading(true);
    setErrorMessage(null);

    let cleanRecipient = form.values.identifier.trim();
    if (form.values.verificationType === "SMS") {
      cleanRecipient = normalizeUzPhone(cleanRecipient);
    }

    try {
      await api.post("/api/v1/auth/forgot-password", {
        identifier: cleanRecipient,
        verificationType: form.values.verificationType,
      });

      setStep(2);
      setCountdown(60);
      setCode("");
      notifications.show({
        title: t("common.success"),
        message: t("authV2.forgot.codeSent"),
        color: "teal",
        withBorder: true,
      });
    } catch (error: unknown) {
      const msg = getErrorMessage(
        error,
        t("forgotPassword.errorMessage")
      );
      setErrorMessage(msg);
      notifications.show({
        title: t("forgotPassword.errorTitle"),
        message: msg,
        color: "red",
        withBorder: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Resend verification code
  const handleResendCode = async () => {
    if (countdown > 0) return;
    setResending(true);
    setErrorMessage(null);

    let cleanRecipient = form.values.identifier.trim();
    if (form.values.verificationType === "SMS") {
      cleanRecipient = normalizeUzPhone(cleanRecipient);
    }

    try {
      await api.post("/api/v1/auth/forgot-password", {
        identifier: cleanRecipient,
        verificationType: form.values.verificationType,
      });

      setCountdown(60);
      notifications.show({
        title: t("common.success"),
        message: t("authV2.forgot.codeResent"),
        color: "teal",
        withBorder: true,
      });
    } catch (error: unknown) {
      const msg = getErrorMessage(
        error,
        t("forgotPassword.errorMessage")
      );
      setErrorMessage(msg);
    } finally {
      setResending(false);
    }
  };

  // Step 2: Verify code and proceed to step 3
  const handleVerifyCode = () => {
    if (code.length < 6) return;
    setStep(3);
  };

  // Step 3: Reset password
  const handleResetPassword = async () => {
    const validation = form.validate();
    if (validation.hasErrors) return;

    setLoading(true);
    setErrorMessage(null);

    let cleanRecipient = form.values.identifier.trim();
    if (form.values.verificationType === "SMS") {
      cleanRecipient = normalizeUzPhone(cleanRecipient);
    }

    try {
      await api.post("/api/v1/auth/reset-password", {
        recipient: cleanRecipient,
        code: code.trim(),
        newPassword: form.values.newPassword,
        verificationType: form.values.verificationType,
      });

      notifications.show({
        title: t("forgotPassword.successTitle"),
        message: t(
          "forgotPassword.successMessage"
        ),
        color: "teal",
        withBorder: true,
      });
      navigate("/auth/login");
    } catch (error: unknown) {
      const msg = getErrorMessage(
        error,
        t("forgotPassword.resetError")
      );
      setErrorMessage(msg);
      notifications.show({
        title: t("forgotPassword.errorTitle"),
        message: msg,
        color: "red",
        withBorder: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const stepLabels: [string, string, string] = [
    t("authV2.forgot.step1Title"),
    t("authV2.forgot.step2Title"),
    t("authV2.forgot.step3Title"),
  ];

  return (
    <AuthLayout
      seoTitle={t("forgotPassword.title")}
      seoDescription={t("seo.login.desc")}
      canonicalUrl="/auth/forgot-password"
      backLink={{
        href: "/auth/login",
        label: t("authV2.forgot.backToLogin"),
      }}
      stepIndicator={t("authV2.forgot.stepIndicator", { current: step, total: 3 })}
    >
      <AuthCard
        icon={<img src="/logo.svg" alt="Prava Online" width={32} height={32} style={{ objectFit: "contain" }} />}
        title={t("authV2.forgot.title")}
        subtitle={t(
          "authV2.forgot.subtitle"
        )}
      >
        {/* 3-Step Interactive Stepper */}
        <AuthStepper currentStep={step} steps={stepLabels} />

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

        {/* STEP 1: Account Identifier */}
        {step === 1 && (
          <Stack gap={10}>
            <TextInput
              label={t("authV2.login.identifierLabel")}
              placeholder={
                form.values.verificationType === "EMAIL"
                  ? "example@mail.com"
                  : "+998 90 123 45 67"
              }
              required
              size="sm"
              radius="md"
              leftSection={
                form.values.verificationType === "EMAIL" ? (
                  <IconMail size={16} />
                ) : (
                  <IconDeviceMobile size={16} />
                )
              }
              styles={{
                input: {
                  height: 38,
                  fontSize: "13.5px",
                  borderRadius: "10px",
                  backgroundColor: "var(--bg-input, #f8fafc)",
                  borderColor: "var(--border, #e2e8f0)",
                },
                label: { fontSize: "12px", fontWeight: 600, marginBottom: 2 },
              }}
              aria-required="true"
              aria-invalid={!!form.errors.identifier}
              value={form.values.identifier}
              onChange={(e) => {
                let val = e.target.value;
                if (form.values.verificationType === "SMS") {
                  val = formatUzPhone(val);
                }
                form.setFieldValue("identifier", val);
                if (errorMessage) setErrorMessage(null);
              }}
            />

            <div>
              <SegmentedControl
                fullWidth
                size="xs"
                radius="md"
                color="blue"
                data={[
                  {
                    label: (
                      <Center style={{ gap: 6 }}>
                        <IconMail size={14} />
                        <span>{t("authV2.register.methodEmail")}</span>
                      </Center>
                    ),
                    value: "EMAIL",
                  },
                  {
                    label: (
                      <Center style={{ gap: 6 }}>
                        <IconMessageDots size={14} />
                        <span>{t("authV2.register.methodSms")}</span>
                      </Center>
                    ),
                    value: "SMS",
                  },
                ]}
                value={form.values.verificationType}
                onChange={(val) => {
                  form.setFieldValue("verificationType", val as "EMAIL" | "SMS");
                  form.setFieldValue("identifier", "");
                  setErrorMessage(null);
                }}
              />
            </div>

            <Button
              size="sm"
              fullWidth
              radius="md"
              onClick={handleSendCode}
              loading={loading}
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
                ? t("authV2.forgot.sendingCode")
                : t("authV2.forgot.sendCodeBtn")}
            </Button>

            <Alert
              icon={<IconInfoCircle size={16} />}
              color="blue"
              variant="light"
              radius="md"
              p="xs"
              mt={2}
            >
              <Text size="xs" lh={1.4}>
                {t(
                  "authV2.forgot.infoAlert"
                )}
              </Text>
            </Alert>
          </Stack>
        )}

        {/* STEP 2: Code Verification (OTP) */}
        {step === 2 && (
          <Stack gap={12}>
            <Alert
              icon={<IconMail size={16} />}
              color="blue"
              variant="light"
              radius="md"
              p="xs"
            >
              <Text size="xs">
                {t("authV2.forgot.otpPrompt", { recipient: form.values.identifier })}
              </Text>
            </Alert>

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
                  onChange={(val) => {
                    setCode(val);
                    if (val.length === 6) setErrorMessage(null);
                  }}
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
              onClick={handleVerifyCode}
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
              {t("authV2.forgot.verifyBtn")}
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

        {/* STEP 3: Create New Password */}
        {step === 3 && (
          <form
            onSubmit={form.onSubmit(handleResetPassword)}
            onChange={() => errorMessage && setErrorMessage(null)}
            noValidate
          >
            <Stack gap={8}>
              <Box>
                <Box mb={2}>
                  <Group justify="space-between" align="center" wrap="nowrap">
                    <Text
                      component="label"
                      htmlFor="forgot-newPassword"
                      size="xs"
                      fw={600}
                      style={{ color: "var(--text, #0f172a)", display: "inline-flex", gap: 2 }}
                    >
                      <span>{t("authV2.forgot.newPassLabel")}</span>
                      <span style={{ color: "#ef4444" }}>*</span>
                    </Text>
                    {form.values.newPassword.length > 0 && (
                      <Text
                        size="xs"
                        fw={600}
                        style={{
                          color: isPasswordSecure(form.values.newPassword)
                            ? "#10b981"
                            : "var(--text-muted, #94a3b8)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: "11px",
                          transition: "color 0.2s ease",
                        }}
                      >
                        {isPasswordSecure(form.values.newPassword) ? (
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
                  id="forgot-newPassword"
                  placeholder={t(
                    "authV2.forgot.newPassPlaceholder"
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
                      borderColor: isPasswordSecure(form.values.newPassword)
                        ? "#10b981"
                        : "var(--border, #e2e8f0)",
                    },
                  }}
                  aria-required="true"
                  aria-invalid={!!form.errors.newPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  {...form.getInputProps("newPassword")}
                />
                <CapsLockWarning active={isCapsLock && passwordFocused} />
              </Box>

              <PasswordInput
                id="forgot-confirmPassword"
                label={t("authV2.forgot.confirmPassLabel")}
                placeholder={t(
                  "authV2.forgot.confirmPassPlaceholder"
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
                aria-invalid={!!form.errors.confirmPassword}
                {...form.getInputProps("confirmPassword")}
              />

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
                  ? t("authV2.forgot.resetting")
                  : t("authV2.forgot.resetBtn")}
              </Button>
            </Stack>
          </form>
        )}
      </AuthCard>
    </AuthLayout>
  );
};

export default ForgotPassword_Page;
