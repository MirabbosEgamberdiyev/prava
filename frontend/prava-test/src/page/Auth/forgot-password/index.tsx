import React from "react";
import {
  Box,
  Button,
  Group,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  IconArrowLeft,
  IconShieldCheck,
} from "@tabler/icons-react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthCard from "@/components/auth/AuthCard";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import TelegramLoginButton from "@/components/auth/TelegramLoginButton";
import AuthSecurityNotice from "@/components/auth/AuthSecurityNotice";

const ForgotPassword_Page: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <AuthLayout
      seoTitle={t("seo.forgotPassword.title", "Parolni tiklash - Prava Online")}
      seoDescription={t("seo.forgotPassword.desc", "Prava Online tizimiga Google va Telegram orqali parolsiz kiring.")}
      canonicalUrl="/auth/forgot-password"
    >
      <AuthCard
        icon={<img src="/logo.svg" alt="Prava Online" width={34} height={34} style={{ objectFit: "contain" }} />}
        title={t("auth.passwordlessNoticeTitle", "Parol kerak emas")}
        subtitle={t(
          "auth.passwordlessNoticeDesc",
          "Tizimimizda parollar butunlay bekor qilingan. Profilingizga Google yoki Telegram orqali to'g'ridan-to'g'ri kiring"
        )}
        switchPrompt={t("auth.needHelp", "Yordam kerakmi?")}
        switchLinkText={t("auth.backToLogin", "Kirishga qaytish")}
        switchLinkHref="/auth/login"
      >
        <Stack gap={14}>
          <Box
            p="md"
            style={{
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              borderRadius: "12px",
            }}
          >
            <Group gap={10} mb={6}>
              <ThemeIcon size={24} radius="xl" color="teal" variant="light">
                <IconShieldCheck size={16} stroke={2.5} />
              </ThemeIcon>
              <Text fw={700} size="sm" c="teal.8">
                {t("auth.passwordlessSecure", "100% xavfsiz va parolsiz kirish")}
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              {t(
                "auth.passwordlessExplanation",
                "Eski telefon yoki parollarni eslab qolish shart emas. Shunchaki o'zingizning Google yoki Telegram hisobingiz orqali bir bosishda profilingizga kiring."
              )}
            </Text>
          </Box>

          <Stack gap={10}>
            <GoogleLoginButton mode="login" />
            <TelegramLoginButton mode="login" />
          </Stack>

          <Button
            variant="subtle"
            color="gray"
            size="sm"
            h={38}
            radius="md"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate("/auth/login")}
          >
            {t("auth.backToLogin", "Kirish sahifasiga qaytish")}
          </Button>

          <AuthSecurityNotice />
        </Stack>
      </AuthCard>
    </AuthLayout>
  );
};

export default ForgotPassword_Page;
