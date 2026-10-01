import React, { useState } from "react";
import { Box } from "@mantine/core";
import { Navigate } from "react-router-dom";
import { useAuthReturnUrl } from "../../../auth/useAuthReturnUrl";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../auth/AuthContext";
import SEO from "../../../components/common/SEO";
import UnifiedAuthCard from "../../../components/auth/UnifiedAuthCard";
import TermsModal from "../../../components/auth/TermsModal";

const Register_Page: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { returnUrl: from } = useAuthReturnUrl();
  const [termsModal, setTermsModal] = useState<"terms" | "privacy" | null>(null);

  if (isAuthenticated) {
    return <Navigate to={from || "/me"} replace />;
  }

  return (
    <Box style={{ width: "100%", maxWidth: 440, margin: "0 auto" }}>
      <SEO
        title={t("auth.seo.registerTitle", { defaultValue: "Ro'yxatdan o'tish - Prava Online" })}
        description={t("auth.seo.registerDescription", {
          defaultValue: "Google yoki Telegram orqali 1 bosqichda hisob oching va imtihonga tayyorlaning.",
        })}
        keywords="prava online royxatdan otish, google login, telegram login"
        canonical="/auth/register"
      />

      <UnifiedAuthCard mode="page" />

      {/* Internal Terms & Privacy Modals */}
      {termsModal && (
        <TermsModal
          opened={!!termsModal}
          type={termsModal}
          onClose={() => setTermsModal(null)}
        />
      )}

      <div style={{ display: "none" }}>
        <button onClick={() => setTermsModal("terms")}>Terms</button>
        <button onClick={() => setTermsModal("privacy")}>Privacy</button>
      </div>
    </Box>
  );
};

export default Register_Page;
