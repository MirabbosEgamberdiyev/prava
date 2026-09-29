import React, { useState } from "react";
import {
  Anchor,
  Box,
  Button,
  Divider,
  Group,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { Navigate } from "react-router-dom";
import { useReturnTo } from "../../../auth/useReturnTo";
import { registerPath } from "../../../utils/returnTo";
import { useTranslation } from "react-i18next";
import {
  IconCheck,
  IconQrcode,
} from "@tabler/icons-react";
import { useAuth } from "@/auth/AuthContext";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthCard from "@/components/auth/AuthCard";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import TelegramLoginButton from "@/components/auth/TelegramLoginButton";
import AuthSecurityNotice from "@/components/auth/AuthSecurityNotice";
import WebQrLoginModal from "@/components/auth/WebQrLoginModal";

const Login_Page: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { returnTo, destination: from } = useReturnTo();
  const [qrModalOpen, setQrModalOpen] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  return (
    <AuthLayout
      seoTitle={t("seo.login.title", "Tizimga kirish - Prava Online")}
      seoDescription={t("seo.login.desc", "Google yoki Telegram orqali Prava Online platformasiga tezkor va xavfsiz kiring.")}
      canonicalUrl="/auth/login"
    >
      <AuthCard
        icon={<img src="/logo.svg" alt="Prava Online" width={34} height={34} style={{ objectFit: "contain" }} />}
        title={t("authV2.login.title", "Tizimga kirish")}
        subtitle={t(
          "authV2.login.subtitle",
          "Google yoki Telegram profilingiz orqali parolsiz, 1 bosqichda kiring"
        )}
        switchPrompt={t("authV2.login.noAccount", "Hisobingiz yo'qmi?")}
        switchLinkText={t("authV2.login.registerLink", "Ro'yxatdan o'tish")}
        switchLinkHref={registerPath(returnTo)}
      >
        <Stack gap={14}>
          {/* Social Logins - Primary Method */}
          <Stack gap={10}>
            <GoogleLoginButton mode="login" />
            <TelegramLoginButton mode="login" />
          </Stack>

          {/* Telegram bot helper hint */}
          <Box
            p="xs"
            style={{
              background: "var(--bg-input, #f8fafc)",
              borderRadius: "10px",
              border: "1px solid var(--border, #e2e8f0)",
              textAlign: "center",
              fontSize: "12.5px",
            }}
          >
            <Text size="xs" c="dimmed">
              {t("authV2.login.botHint", "Telegram bot orqali kirish:")}{" "}
              <Anchor
                href="https://t.me/pravaonlineuzbot?start=login"
                target="_blank"
                rel="noopener noreferrer"
                fw={600}
                c="#0088cc"
              >
                @pravaonlineuzbot
              </Anchor>
            </Text>
          </Box>

          {/* Divider with QR pairing option */}
          <Divider
            label={
              <Text size="xs" c="dimmed">
                {t("auth.orDeviceSync", "yoki mobil ilovadan")}
              </Text>
            }
            labelPosition="center"
            my={2}
          />

          <Button
            type="button"
            onClick={() => setQrModalOpen(true)}
            variant="light"
            color="gray"
            size="sm"
            h={40}
            radius="md"
            leftSection={<IconQrcode size={18} />}
            styles={{
              root: {
                border: "1px dashed var(--border, #cbd5e1)",
                fontWeight: 600,
                fontSize: "13px",
              },
            }}
          >
            {t("auth.loginWithQr", "Mobil ilova orqali QR bilan kirish")}
          </Button>

          {/* Security & Benefits list */}
          <Box
            mt={4}
            p="xs"
            style={{
              background: "rgba(16, 185, 129, 0.05)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              borderRadius: "10px",
            }}
          >
            <Stack gap={6}>
              <Group gap={8} wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="teal" variant="light">
                  <IconCheck size={12} stroke={3} />
                </ThemeIcon>
                <Text size="xs" c="dimmed">
                  {t("auth.benefitPasswordless", "Parol yoki SMS kutish shart emas")}
                </Text>
              </Group>
              <Group gap={8} wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="teal" variant="light">
                  <IconCheck size={12} stroke={3} />
                </ThemeIcon>
                <Text size="xs" c="dimmed">
                  {t("auth.benefitInstant", "Barcha qurilmalarda avtomatik sinxronlanadi")}
                </Text>
              </Group>
            </Stack>
          </Box>

          <AuthSecurityNotice />
        </Stack>
      </AuthCard>

      <WebQrLoginModal
        opened={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
      />
    </AuthLayout>
  );
};

export default Login_Page;
