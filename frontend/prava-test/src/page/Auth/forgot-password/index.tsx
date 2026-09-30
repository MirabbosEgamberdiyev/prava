import {
  Box,
  Divider,
  Stack,
  Text,
  Title,
  Button,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import GoogleLoginButton from "../../../components/auth/GoogleLoginButton";
import TelegramLoginButton from "../../../components/auth/TelegramLoginButton";
import SEO from "../../../components/common/SEO";
import AuthSecurityBadge from "../../../components/auth/AuthSecurityBadge";

const ForgotPassword_Page = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Box style={{ width: "100%", maxWidth: 460, margin: "0 auto" }}>
      <SEO
        title={t("auth.passwordlessNoticeTitle", { defaultValue: "Parol talab etilmaydi - Prava Online" })}
        description={t("auth.passwordlessNoticeDesc", {
          defaultValue: "Prava Online platformasida autentifikatsiya to'liq Google va Telegram orqali xavfsiz ishlaydi.",
        })}
        canonical="/auth/forgot-password"
      />

      {/* Header section */}
      <Stack gap={6} align="center" mb={18} ta="center">
        <Title
          order={2}
          size="1.45rem"
          fw={800}
          style={{ letterSpacing: "-0.02em", color: "var(--text)" }}
        >
          {t("auth.passwordlessNoticeTitle", { defaultValue: "Parol talab etilmaydi" })}
        </Title>

        <Text size="xs" c="dimmed" maw={380}>
          {t("auth.passwordlessNoticeDesc", {
            defaultValue: "Tizimimizda parollar butunlay bekor qilingan. Profilingizga Google yoki Telegram orqali to'g'ridan-to'g'ri kiring",
          })}
        </Text>
      </Stack>

      {/* Social Logins */}
      <Stack gap={10} mb={16}>
        <GoogleLoginButton mode="login" h={44} radius={10} />
        <TelegramLoginButton mode="login" h={44} radius={10} />
      </Stack>

      <Divider my={14} />

      {/* Back to login */}
      <Stack align="center" mt={12}>
        <Button
          variant="light"
          size="xs"
          onClick={() => navigate("/auth/login")}
        >
          {t("auth.backToLogin", { defaultValue: "Kirish sahifasiga o'tish" })}
        </Button>
      </Stack>

      <Box mt={16}>
        <AuthSecurityBadge compact />
      </Box>
    </Box>
  );
};

export default ForgotPassword_Page;
