import React, { useEffect } from "react";
import { Modal } from "@mantine/core";
import { IconShieldLock, IconLogin2 } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import TelegramLoginButton from "../../../components/auth/TelegramLoginButton";
import GoogleLoginButton from "../../../components/auth/GoogleLoginButton";
import { clearPendingAuthRedirect, setPendingReturnUrl } from "../../../auth/pendingAuthRedirect";
import "../octagon.css";

interface Props {
  opened: boolean;
  /** Kirgandan keyin qaytiladigan joy (masalan /octagon?code=4821 — ochmoqchi bo'lgan duel). */
  returnUrl: string;
  /** Boshqa usullar (telefon, parol, QR) — umumiy kirish oynasi. */
  onLogin: () => void;
  onClose: () => void;
}

/**
 * Majburiy avtorizatsiya oynasi: Oktagon janglari, ELO va ligalar faqat ro'yxatdan o'tganlar uchun.
 * Telegram va Google tugmalari shu yerning o'zida; kirish muvaffaqiyatli bo'lsa foydalanuvchi aynan
 * ochmoqchi bo'lgan duel/xonaga qaytadi (returnUrl).
 */
export const OctagonAuthGateModal: React.FC<Props> = ({ opened, returnUrl, onLogin, onClose }) => {
  const { t } = useTranslation();

  // Telegram/Google tugmalari kirgandan keyin shu manzilga qaytaradi (executePending)
  useEffect(() => {
    if (opened) setPendingReturnUrl(returnUrl);
  }, [opened, returnUrl]);

  const later = () => {
    clearPendingAuthRedirect();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={later}
      closeButtonProps={{ "aria-label": t("common.close") }}
      centered
      radius="lg"
      padding="xl"
      size="md"
      withCloseButton
      overlayProps={{ backgroundOpacity: 0.75, blur: 5 }}
      classNames={{ content: "oct-modal-dark oct-auth-gate-modal", header: "oct-modal-dark-header", close: "oct-modal-dark-close" }}
      title={null}
    >
      <div className="oct-auth-gate">
        <div className="oct-auth-gate-icon" aria-hidden="true">
          <IconShieldLock size={38} stroke={2.2} />
          <span className="oct-auth-gate-spark">⚔️</span>
        </div>
        <h2 className="oct-auth-gate-title">{t("octagon.authGate.welcomeTitle")}</h2>
        <p className="oct-auth-gate-text">{t("octagon.authGate.welcomeText")}</p>

        <div className="oct-auth-gate-social">
          <TelegramLoginButton mode="login" h={52} radius={14} className="oct-auth-gate-social-btn" />
          <GoogleLoginButton mode="login" h={52} radius={14} className="oct-auth-gate-social-btn" />
        </div>

        <button type="button" className="oct-auth-gate-other" onClick={onLogin}>
          <IconLogin2 size={18} stroke={2.4} />
          <span>{t("octagon.authGate.otherMethods")}</span>
        </button>
        <button type="button" className="oct-auth-gate-later" onClick={later}>
          {t("octagon.authGate.later")}
        </button>
      </div>
    </Modal>
  );
};
