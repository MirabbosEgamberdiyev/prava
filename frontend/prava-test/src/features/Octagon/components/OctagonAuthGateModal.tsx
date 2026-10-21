import React from "react";
import { Modal } from "@mantine/core";
import { IconBrandTelegram, IconBrandGoogle, IconDeviceMobile, IconLogin2, IconSwords } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import "../octagon.css";

interface Props {
  opened: boolean;
  onLogin: () => void;
  onClose: () => void;
}

/**
 * Majburiy avtorizatsiya oynasi: Oktagon janglari, ELO va ligalar faqat ro'yxatdan o'tganlar uchun.
 * "Kirish" bosilganda umumiy kirish oynasi (telefon / Telegram / Google) ochiladi va kirishdan keyin
 * foydalanuvchi shu sahifaga — o'z ELO profiliga qaytadi.
 */
export const OctagonAuthGateModal: React.FC<Props> = ({ opened, onLogin, onClose }) => {
  const { t } = useTranslation();

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      radius="lg"
      padding="xl"
      size="md"
      withCloseButton
      overlayProps={{ backgroundOpacity: 0.7, blur: 5 }}
      styles={{
        content: {
          backgroundColor: "#0f172a",
          border: "1px solid rgba(56, 189, 248, 0.35)",
          color: "#f8fafc",
          boxShadow: "0 0 40px rgba(16, 185, 129, 0.18)",
        },
        header: { backgroundColor: "#0f172a", color: "#f8fafc" },
        close: { color: "#94a3b8" },
      }}
      title={null}
    >
      <div className="oct-auth-gate">
        <div className="oct-auth-gate-icon">
          <IconSwords size={34} stroke={2.4} />
        </div>
        <h2 className="oct-auth-gate-title">{t("octagon.authGate.title")}</h2>
        <p className="oct-auth-gate-text">{t("octagon.authGate.message")}</p>

        <div className="oct-auth-gate-methods" aria-hidden="true">
          <span><IconDeviceMobile size={16} /> {t("octagon.authGate.phone")}</span>
          <span><IconBrandTelegram size={16} /> Telegram</span>
          <span><IconBrandGoogle size={16} /> Google</span>
        </div>

        <button type="button" className="oct-3d-btn green oct-auth-gate-btn" onClick={onLogin}>
          <IconLogin2 size={22} stroke={2.5} />
          <span>{t("octagon.authGate.loginButton")}</span>
        </button>
        <button type="button" className="oct-auth-gate-later" onClick={onClose}>
          {t("octagon.authGate.later")}
        </button>
      </div>
    </Modal>
  );
};
