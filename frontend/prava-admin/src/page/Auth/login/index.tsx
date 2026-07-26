/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Button,
  Flex,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
  Box,
  Stack,
  rem,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useForm } from "@mantine/form";
import { useState } from "react";
import { useAuth } from "../../../hooks/auth/AuthContext";
import api from "../../../services/api";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import LanguagePicker from "../../../components/language/LanguagePicker";

const Login_Page = () => {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      identifier: "",
      password: "",
    },
    validate: {
      identifier: (value) =>
        value.length < 5
          ? t("validation.minChars", { count: 5 })
          : null,
      password: (value) =>
        value.length < 6
          ? t("validation.minChars", { count: 6 })
          : null,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    if (loading) return; // tez-tez bosishdan himoya
    setLoading(true);
    try {
      const response = await api.post("/api/v1/auth/login", {
        identifier: values.identifier,
        password: values.password,
      });

      // Ilgari `success === false` bo'lganda hech narsa qilinmasdi —
      // tugma to'xtardi-yu, foydalanuvchi sababini bilmasdi (jim xatolik).
      if (!response.data?.success || !response.data?.data?.accessToken) {
        notifications.show({
          color: "red",
          title: t("auth.errorTitle"),
          message: response.data?.message || t("auth.loginError"),
        });
        return;
      }

      const userLang = response.data.data.user?.preferredLanguage;
      if (userLang) {
        i18n.changeLanguage(String(userLang).toLowerCase());
      }

      login(response.data.data);
      navigate("/", { replace: true });

      notifications.show({
        title: t("auth.not_title"),
        message: t("auth.not_massage"),
        color: "green",
        withBorder: true,
      });
    } catch (err: any) {
      notifications.show({
        color: "red",
        title: t("auth.errorTitle"),
        message:
          err.response?.data?.message || t("auth.loginError"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex mih="100vh">
      {/* Left panel — branding */}
      <Box
        visibleFrom="md"
        w="45%"
        style={{
          background: "linear-gradient(135deg, var(--mantine-color-blue-6) 0%, var(--mantine-color-blue-9) 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: rem(48),
        }}
      >
        <img src="/logo.svg" height={80} alt="PravaOnline" style={{ filter: "brightness(0) invert(1)" }} />
        <Title order={2} c="white" ta="center" mt="xl">
          PravaOnline
        </Title>
        <Text c="blue.1" ta="center" mt="sm" maw={360} size="lg">
          Admin Panel
        </Text>
        <Text c="blue.2" ta="center" mt="xl" maw={320} size="sm">
          pravaonline.uz
        </Text>
      </Box>

      {/* Right panel — login form */}
      <Flex
        flex={1}
        direction="column"
        justify="center"
        align="center"
        p="xl"
        style={{ minHeight: "100vh" }}
      >
        {/* Language picker top right */}
        <Box pos="absolute" top={16} right={16}>
          <LanguagePicker />
        </Box>

        <Box w="100%" maw={420}>
          <Title order={2} ta="center">
            {t("auth.welcome")}
          </Title>
          <Text c="dimmed" size="sm" ta="center" mt={4}>
            {t("auth.subtitle")}
          </Text>

          <Paper withBorder shadow="md" p="xl" mt="xl" radius="md">
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                <TextInput
                  label={t("auth.identifier")}
                  placeholder="admin@pravaonline.uz"
                  required
                  radius="md"
                  size="md"
                  {...form.getInputProps("identifier")}
                />

                <PasswordInput
                  label={t("auth.password")}
                  placeholder="********"
                  required
                  radius="md"
                  size="md"
                  {...form.getInputProps("password")}
                />

                {/*
                  "Meni eslab qol" checkbox va "Parolni unutdingizmi?" havolasi
                  olib tashlandi: ikkalasi ham hech qanday amal bajarmasdi
                  (rememberMe qiymati hech qayerda ishlatilmasdi, Anchor'da
                  href/onClick yo'q edi). Ishlaydigan UI bo'lmagunicha
                  ko'rsatmaslik to'g'riroq.
                */}

                <Button
                  fullWidth
                  size="md"
                  radius="md"
                  type="submit"
                  loading={loading}
                >
                  {t("auth.login")}
                </Button>
              </Stack>
            </form>
          </Paper>
        </Box>
      </Flex>
    </Flex>
  );
};

export default Login_Page;
