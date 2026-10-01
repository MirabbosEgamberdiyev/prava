import React from "react";
import { Box } from "@mantine/core";
import { Navigate } from "react-router-dom";
import { useAuthReturnUrl } from "../../../auth/useAuthReturnUrl";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../auth/AuthContext";
import SEO from "../../../components/common/SEO";
import UnifiedAuthCard from "../../../components/auth/UnifiedAuthCard";

const Login_Page: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { returnUrl: from } = useAuthReturnUrl();

  if (isAuthenticated) {
    return <Navigate to={from || "/me"} replace />;
  }

  return (
    <Box style={{ width: "100%", maxWidth: 440, margin: "0 auto" }}>
      <SEO
        title={t("auth.seo.loginTitle", { defaultValue: "Kirish - Prava Online" })}
        description={t("auth.seo.loginDescription", {
          defaultValue: "Prava Online platformasiga kiring va imtihonga tayyorlanishni davom eting.",
        })}
        keywords="prava online kirish, qr login, google login, telegram login"
        canonical="/auth/login"
      />

      <UnifiedAuthCard mode="page" />
    </Box>
  );
};

export default Login_Page;
