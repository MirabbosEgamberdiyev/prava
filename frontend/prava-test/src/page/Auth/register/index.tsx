import React from "react";
import { Box } from "@mantine/core";
import { Navigate } from "react-router-dom";
import { useReturnTo } from "../../../auth/useReturnTo";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/auth/AuthContext";
import SEO from "@/components/common/SEO";
import UnifiedAuthCard from "@/components/auth/UnifiedAuthCard";

const Register_Page: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { destination: from } = useReturnTo();

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  return (
    <Box style={{ width: "100%", maxWidth: 440, margin: "0 auto" }}>
      <SEO
        title={t("auth.seo.registerTitle", { defaultValue: "Ro'yxatdan o'tish - Prava Online" })}
        description={t("auth.seo.registerDescription", {
          defaultValue: "Google, Telegram yoki QR-kod orqali 1 bosqichda parolsiz kiring.",
        })}
        keywords="prava online royxatdan otish, google login, telegram login, qr login"
        canonical="/auth/register"
      />

      <UnifiedAuthCard mode="page" />
    </Box>
  );
};

export default Register_Page;
