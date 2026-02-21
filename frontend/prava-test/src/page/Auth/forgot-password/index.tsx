import {
  Anchor,
  Box,
  Button,
  Center,
  Container,
  Flex,
  Paper,
  PasswordInput,
  PinInput,
  SegmentedControl,
  Stack,
  Stepper,
  Text,
  TextInput,
  Title,
  ActionIcon,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../../api/api";
import { notifications } from "@mantine/notifications";
import {
  IconArrowLeft,
  IconAt,
  IconDeviceMobile,
  IconLock,
  IconMailShare,
  IconMessageShare,
  IconUser,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

const ForgotPassword_Page = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [verificationType, setVerificationType] = useState<"EMAIL" | "SMS">(
    "EMAIL"
  );
  const navigate = useNavigate();
  const { t } = useTranslation();

  const form = useForm({
    initialValues: {
      identifier: "",
      newPassword: "",
      confirmPassword: "",
    },
    validate: {
      identifier: (value) =>
        value.trim().length < 5
          ? t("validation.minChars", { count: 5 })
          : null,
      newPassword: (value) => {
        if (step !== 3) return null;
        return value.length < 8
          ? t("validation.minChars", { count: 8 })
          : null;
      },
      confirmPassword: (value, values) => {
        if (step !== 3) return null;
        return value !== values.newPassword
          ? t("forgotPassword.passwordMismatch")
          : null;
      },
    },
  });

  // Step 1: Send verification code
  const handleSendCode = async () => {
    const validation = form.validateField("identifier");
    if (validation.hasError) return;

    setLoading(true);
    try {
      await api.post("/api/v1/auth/forgot-password", {
        identifier: form.values.identifier.trim(),
        verificationType,
      });
      setStep(2);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      notifications.show({
        title: t("forgotPassword.errorTitle"),
        message:
          err?.response?.data?.message || t("forgotPassword.errorMessage"),
        color: "red",
        withBorder: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Code entered -> go to step 3
  const handleCodeEntered = () => {
    if (code.length < 6) return;
    setStep(3);
  };

  // Step 3: Reset password
  const handleResetPassword = async () => {
    const validation = form.validate();
    if (validation.hasErrors) return;

    setLoading(true);
    try {
      await api.post("/api/v1/auth/reset-password", {
        recipient: form.values.identifier.trim(),
        code,
        newPassword: form.values.newPassword,
        verificationType,
      });

      notifications.show({
        title: t("forgotPassword.successTitle"),
        message: t("forgotPassword.successMessage"),
        color: "green",
        withBorder: true,
      });
      navigate("/auth/login");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      notifications.show({
        title: t("forgotPassword.errorTitle"),
        message:
          err?.response?.data?.message || t("forgotPassword.resetError"),
        color: "red",
        withBorder: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Stepper active index (0-based)
  const stepperActive = step - 1;

  return (
    <Container size={480} my={{ base: 30, sm: 60 }}>
      <Flex gap="sm" justify="space-between" align="center" mb="lg">
        <Title order={3}>{t("forgotPassword.title")}</Title>
        <Anchor component={Link} to="/auth/login">
          <Button
            leftSection={<IconArrowLeft size={16} />}
            variant="subtle"
            size="sm"
          >
            {t("forgotPassword.backToLogin")}
          </Button>
        </Anchor>
      </Flex>

      <Stepper
        active={stepperActive}
        size="sm"
        mb="lg"
      >
        <Stepper.Step icon={<IconUser size={18} />} />
        <Stepper.Step icon={<IconMailShare size={18} />} />
        <Stepper.Step icon={<IconLock size={18} />} />
      </Stepper>

      <Paper withBorder shadow="md" p={{ base: "lg", sm: "xl" }} radius="md">
        {step === 1 && (
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              {t("forgotPassword.description")}
            </Text>
            <TextInput
              label={t("forgotPassword.identifier")}
              placeholder="email@example.com"
              required
              size="md"
              radius="md"
              leftSection={<IconUser size={18} />}
              {...form.getInputProps("identifier")}
            />
            <SegmentedControl
              value={verificationType}
              onChange={(v) => setVerificationType(v as "EMAIL" | "SMS")}
              fullWidth
              radius="md"
              data={[
                {
                  label: (
                    <Flex align="center" gap={6} justify="center">
                      <IconAt size={16} />
                      <span>{t("forgotPassword.verifyByEmail")}</span>
                    </Flex>
                  ),
                  value: "EMAIL",
                },
                {
                  label: (
                    <Flex align="center" gap={6} justify="center">
                      <IconDeviceMobile size={16} />
                      <span>{t("forgotPassword.verifyBySms")}</span>
                    </Flex>
                  ),
                  value: "SMS",
                },
              ]}
            />
            <Button
              fullWidth
              mt="xs"
              loading={loading}
              radius="md"
              size="md"
              onClick={handleSendCode}
            >
              {t("forgotPassword.sendCode")}
            </Button>
          </Stack>
        )}

        {step === 2 && (
          <Box>
            <Center>
              <ActionIcon
                size={70}
                variant="light"
                radius="xl"
                color={verificationType === "EMAIL" ? "blue" : "green"}
              >
                {verificationType === "SMS" ? (
                  <IconMessageShare size={30} />
                ) : (
                  <IconMailShare size={30} />
                )}
              </ActionIcon>
            </Center>
            <Text ta="center" fw={500} mt="sm">
              {verificationType === "SMS"
                ? t("forgotPassword.codeSentToPhone")
                : t("forgotPassword.codeSent")}
            </Text>
            <Center>
              <Text ta="center" fw={500} c="blue">
                {form.values.identifier}
              </Text>
            </Center>
            <Center mt="lg">
              <PinInput
                length={6}
                size="md"
                value={code}
                onChange={setCode}
                type="number"
                autoFocus
              />
            </Center>
            <Button
              fullWidth
              loading={loading}
              disabled={code.length < 6}
              onClick={handleCodeEntered}
              radius="md"
              mt="xl"
              size="md"
            >
              {t("forgotPassword.enterCode")}
            </Button>
          </Box>
        )}

        {step === 3 && (
          <Stack gap="md">
            <PasswordInput
              label={t("forgotPassword.newPassword")}
              required
              size="md"
              radius="md"
              leftSection={<IconLock size={18} />}
              {...form.getInputProps("newPassword")}
            />
            <PasswordInput
              label={t("forgotPassword.confirmPassword")}
              required
              size="md"
              radius="md"
              leftSection={<IconLock size={18} />}
              {...form.getInputProps("confirmPassword")}
            />
            <Button
              fullWidth
              mt="xs"
              loading={loading}
              radius="md"
              size="md"
              onClick={handleResetPassword}
            >
              {t("forgotPassword.resetPassword")}
            </Button>
          </Stack>
        )}
      </Paper>
    </Container>
  );
};

export default ForgotPassword_Page;
