import {
  Anchor,
  Box,
  Button,
  Center,
  Container,
  Divider,
  Flex,
  Grid,
  Image,
  ActionIcon,
  Paper,
  PasswordInput,
  PinInput,
  Progress,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import api from "../../../api/api";
import { useAuth } from "../../../auth/AuthContext";
import { notifications } from "@mantine/notifications";
import {
  IconAt,
  IconDeviceMobile,
  IconLock,
  IconMailShare,
  IconMessageShare,
  IconUser,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import GoogleLoginButton from "../../../components/auth/GoogleLoginButton";
import TelegramLoginButton from "../../../components/auth/TelegramLoginButton";
import SEO from "../../../components/common/SEO";

function getPasswordStrength(password: string): number {
  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
  if (/\d/.test(password)) strength += 25;
  if (/[@$!%*?&#]/.test(password)) strength += 25;
  return strength;
}

function getStrengthColor(strength: number): string {
  if (strength <= 25) return "red";
  if (strength <= 50) return "orange";
  if (strength <= 75) return "yellow";
  return "green";
}

const Register_Page = () => {
  const { register: authRegister, isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [verificationType, setVerificationType] = useState<"EMAIL" | "SMS">(
    "EMAIL"
  );
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Agar foydalanuvchi allaqachon tizimga kirgan bo'lsa — /me ga redirect
  if (isAuthenticated) {
    return <Navigate to="/me" replace />;
  }

  const form = useForm({
    initialValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      email: "",
      password: "",
      verificationType: "EMAIL",
      preferredLanguage: "uzl",
    },

    validate: {
      firstName: (value) =>
        value.trim().length < 2 ? t("validation.nameTooShort") : null,
      lastName: (value) =>
        value.trim().length < 2 ? t("validation.nameTooShort") : null,
      email: (value, values) => {
        if (values.verificationType === "SMS") {
          // SMS mode: email is optional — only validate format if user typed something
          if (!value || value.trim().length === 0) return null;
          return /^\S+@\S+\.\S+$/.test(value)
            ? null
            : t("validation.invalidEmail");
        }
        // EMAIL mode: email is required
        if (!value || value.trim().length === 0)
          return t("validation.invalidEmail");
        return /^\S+@\S+\.\S+$/.test(value)
          ? null
          : t("validation.invalidEmail");
      },
      phoneNumber: (value, values) => {
        if (values.verificationType === "EMAIL") {
          // EMAIL mode: phone is optional — only validate format if user typed something
          if (!value || value.trim().length === 0) return null;
          const digits = value.replace(/\D/g, "");
          if (digits.length > 0 && digits.length < 12)
            return t("validation.invalidPhone");
          return null;
        }
        // SMS mode: phone is required
        if (!value || value.trim().length === 0)
          return t("validation.invalidPhone");
        return value.replace(/\D/g, "").length < 12
          ? t("validation.invalidPhone")
          : null;
      },
      password: (value) =>
        value.length < 8 ? t("validation.minChars", { count: 8 }) : null,
    },
  });

  // Step 1: Init registration — send form data + get OTP
  const handleInit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const trimmedEmail = values.email.trim();
      const trimmedPhone = values.phoneNumber.trim();
      const payload = {
        ...values,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: trimmedEmail || null,
        phoneNumber: trimmedPhone || null,
      };
      await api.post("/api/v1/auth/register/init", payload);
      setStep(2);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      notifications.show({
        title: t("register.errorTitle"),
        message: err?.response?.data?.message || t("register.errorMessage"),
        color: "red",
        withBorder: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and complete registration
  const handleComplete = async () => {
    if (code.length < 6) return;

    setLoading(true);
    try {
      const trimmedEmail = form.values.email.trim();
      const trimmedPhone = form.values.phoneNumber.trim();
      const res = await api.post(
        `/api/v1/auth/register/complete?code=${code}`,
        {
          ...form.values,
          firstName: form.values.firstName.trim(),
          lastName: form.values.lastName.trim(),
          email: trimmedEmail || null,
          phoneNumber: trimmedPhone || null,
        }
      );

      if (res.data) {
        authRegister(res.data.data);
        notifications.show({
          title: t("register.successTitle"),
          message: t("register.successMessage"),
          color: "green",
          withBorder: true,
        });
        navigate("/me");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      notifications.show({
        title: t("register.errorTitle"),
        message: err?.response?.data?.message || t("register.codeError"),
        color: "red",
        withBorder: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const getInboxLink = (email: string) => {
    if (!email || !email.includes("@")) return "#";
    const domain = email.split("@")[1];

    if (domain === "gmail.com") return "https://mail.google.com";
    if (domain === "mail.ru") return "https://e.mail.ru/inbox";
    if (domain === "outlook.com" || domain === "hotmail.com")
      return "https://outlook.live.com/mail/0/inbox";
    if (domain === "yandex.ru" || domain === "yandex.com")
      return "https://mail.yandex.ru";

    return `https://${domain}`;
  };

  const handleVerificationTypeChange = (value: string) => {
    const type = value as "EMAIL" | "SMS";
    setVerificationType(type);
    form.setFieldValue("verificationType", type);

    // Smart field adjustment
    if (type === "SMS") {
      // Pre-fill phone with country code if empty
      if (!form.values.phoneNumber || form.values.phoneNumber.trim() === "") {
        form.setFieldValue("phoneNumber", "998");
      }
    } else {
      // Clear phone if it's just the country code
      if (form.values.phoneNumber === "998") {
        form.setFieldValue("phoneNumber", "");
      }
    }

    // Clear validation errors when switching type
    form.clearFieldError("email");
    form.clearFieldError("phoneNumber");
  };

  const isEmailMode = verificationType === "EMAIL";

  return (
    <Container size="lg" my={{ base: 30, sm: 50 }}>
      <SEO
        title="Ro'yxatdan o'tish"
        description="Prava Online platformasida ro'yxatdan o'ting va bepul haydovchilik guvohnomasi imtihoniga tayyorlanishni boshlang. 1200+ savol bazasiga kirish imkoniyati."
        keywords="prava online ro'yxat, haydovchilik imtihoni, bepul tayyorlanish"
        canonical="/auth/register"
      />
      <Grid>
        <Grid.Col span={{ base: 12 }}>
          <Flex
            gap="sm"
            justify="space-between"
            align="center"
            wrap="wrap"
          >
            <Title ta="left" order={3}>
              {t("register.title")}
            </Title>
            <Flex align="center" gap="xs">
              <Text size="sm" c="dimmed">
                {t("register.noAccount")}
              </Text>
              <Anchor component={Link} to="/auth/login" fw={600} size="sm">
                {t("register.login")}
              </Anchor>
            </Flex>
          </Flex>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, lg: 5 }}>
          <Paper withBorder shadow="md" p={{ base: "lg", sm: "xl" }} radius="md">
            {step === 1 ? (
              <form onSubmit={form.onSubmit(handleInit)}>
                <Stack gap="md">
                  <Flex gap="md">
                    <TextInput
                      label={t("register.firstName")}
                      required
                      size="md"
                      radius="md"
                      style={{ flex: 1 }}
                      leftSection={<IconUser size={18} />}
                      {...form.getInputProps("firstName")}
                    />
                    <TextInput
                      label={t("register.lastName")}
                      required
                      size="md"
                      radius="md"
                      style={{ flex: 1 }}
                      {...form.getInputProps("lastName")}
                    />
                  </Flex>

                  <SegmentedControl
                    value={verificationType}
                    onChange={handleVerificationTypeChange}
                    fullWidth
                    radius="md"
                    data={[
                      {
                        label: (
                          <Flex align="center" gap={6} justify="center">
                            <IconAt size={16} />
                            <span>{t("register.verifyByEmail")}</span>
                          </Flex>
                        ),
                        value: "EMAIL",
                      },
                      {
                        label: (
                          <Flex align="center" gap={6} justify="center">
                            <IconDeviceMobile size={16} />
                            <span>{t("register.verifyBySms")}</span>
                          </Flex>
                        ),
                        value: "SMS",
                      },
                    ]}
                  />

                  <TextInput
                    label={t("register.email")}
                    placeholder="example@mail.com"
                    required={isEmailMode}
                    size="md"
                    radius="md"
                    leftSection={<IconAt size={18} />}
                    {...form.getInputProps("email")}
                  />

                  <TextInput
                    label={t("register.phoneNumber")}
                    placeholder="998XXXXXXXXX"
                    required={!isEmailMode}
                    size="md"
                    radius="md"
                    maxLength={13}
                    leftSection={<IconDeviceMobile size={18} />}
                    {...form.getInputProps("phoneNumber")}
                  />

                  <Box>
                    <PasswordInput
                      label={t("register.password")}
                      required
                      size="md"
                      radius="md"
                      leftSection={<IconLock size={18} />}
                      {...form.getInputProps("password")}
                    />
                    {form.values.password.length > 0 && (
                      <Progress
                        value={getPasswordStrength(form.values.password)}
                        color={getStrengthColor(
                          getPasswordStrength(form.values.password)
                        )}
                        size="xs"
                        mt={6}
                        radius="xl"
                      />
                    )}
                  </Box>

                  <Button
                    type="submit"
                    fullWidth
                    radius="md"
                    size="md"
                    loading={loading}
                  >
                    {t("register.register")}
                  </Button>

                  <Divider
                    label={t("auth.orContinueWith")}
                    labelPosition="center"
                  />

                  <GoogleLoginButton mode="register" />
                  <TelegramLoginButton mode="register" />
                </Stack>
              </form>
            ) : (
              <Box>
                <Center>
                  <ActionIcon
                    size={70}
                    variant="light"
                    radius="xl"
                    color={isEmailMode ? "blue" : "green"}
                  >
                    {isEmailMode ? (
                      <IconMailShare size={30} />
                    ) : (
                      <IconMessageShare size={30} />
                    )}
                  </ActionIcon>
                </Center>
                <Text ta="center" fw={500} mt="sm">
                  {isEmailMode
                    ? t("register.otpSentTo")
                    : t("register.codeSentToPhone")}
                </Text>
                <Center>
                  {isEmailMode ? (
                    <Anchor
                      href={getInboxLink(form.values.email)}
                      target="_blank"
                      fw={500}
                    >
                      {form.values.email}
                    </Anchor>
                  ) : (
                    <Text ta="center" fw={500} c="blue">
                      {form.values.phoneNumber}
                    </Text>
                  )}
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
                  onClick={handleComplete}
                  radius="md"
                  mt="xl"
                  size="md"
                >
                  {t("register.confirm")}
                </Button>
              </Box>
            )}
          </Paper>
        </Grid.Col>
        <Grid.Col visibleFrom="sm" span={{ base: 12, sm: 6, lg: 7 }}>
          <Flex
            direction="column"
            justify="center"
            align="center"
            h="100%"
            style={{
              background: "linear-gradient(135deg, #228be6 0%, #1864ab 100%)",
              borderRadius: "var(--mantine-radius-md)",
              padding: "var(--mantine-spacing-xl)",
            }}
          >
            <Image
              radius="md"
              src="/logo.svg"
              w={120}
              h={120}
              fit="contain"
              fallbackSrc="https://placehold.co/120x120?text=PO"
            />
            <Text c="white" size="xl" fw={700} ta="center" mt="lg">
              PravaOnline
            </Text>
            <Text c="blue.1" size="sm" ta="center" mt="xs" maw={300}>
              {t("home.hero.description")}
            </Text>
          </Flex>
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default Register_Page;
