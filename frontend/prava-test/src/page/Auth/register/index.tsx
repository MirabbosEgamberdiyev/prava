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
import { loginPath } from "../../../utils/returnTo";
import { useTranslation } from "react-i18next";
import {
  IconCheck,
  IconQrcode,
  IconSparkles,
} from "@tabler/icons-react";
import { useAuth } from "@/auth/AuthContext";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthCard from "@/components/auth/AuthCard";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import TelegramLoginButton from "@/components/auth/TelegramLoginButton";
import AuthSecurityNotice from "@/components/auth/AuthSecurityNotice";
import WebQrLoginModal from "@/components/auth/WebQrLoginModal";

// Backward compatibility helper
export const isPasswordSecure = (_val: string): boolean => true;

const Register_Page: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { returnTo, destination: from } = useReturnTo();
  const [qrModalOpen, setQrModalOpen] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  return (
    <AuthLayout
      seoTitle={t("seo.register.title", "Ro'yxatdan o'tish - Prava Online")}
      seoDescription={t("seo.register.desc", "Google yoki Telegram orqali 1 bosqichda hisob oching va imtihonga tayyorlaning.")}
      canonicalUrl="/auth/register"
    >
      <AuthCard
        icon={<img src="/logo.svg" alt="Prava Online" width={34} height={34} style={{ objectFit: "contain" }} />}
        title={t("authV2.register.title", "Ro'yxatdan o'tish")}
        subtitle={t(
          "authV2.register.subtitle",
          "Google yoki Telegram orqali 1 bosqichda parolsiz va SMS-kodsiz hisob oching"
        )}
        switchPrompt={t("authV2.register.hasAccount", "Profilingiz bormi?")}
        switchLinkText={t("authV2.register.loginLink", "Kirish")}
        switchLinkHref={loginPath(returnTo)}
      >
        <Stack gap={14}>
          {/* Social Logins - Primary Method */}
          <Stack gap={10}>
            <GoogleLoginButton mode="register" />
            <TelegramLoginButton mode="register" />
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
              {t("authV2.register.botHint", "Telegram bot orqali ro'yxatdan o'tish:")}{" "}
              <Anchor
                href="https://t.me/pravaonlineuzbot?start=register"
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

          {/* Instant Account Notice */}
          <Box
            mt={4}
            p="xs"
            style={{
              background: "rgba(37, 99, 235, 0.05)",
              border: "1px solid rgba(37, 99, 235, 0.2)",
              borderRadius: "10px",
            }}
          >
            <Stack gap={6}>
              <Group gap={8} wrap="nowrap">
                <ThemeIcon size={18} radius="xl" color="blue" variant="light">
                  <IconSparkles size={12} stroke={2.5} />
                </ThemeIcon>
                <Text size="xs" c="dimmed">
                  {t("auth.registerInstant", "Hisob bir zumda yaratiladi, forma to'ldirish shart emas")}
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

export default Register_Page;
