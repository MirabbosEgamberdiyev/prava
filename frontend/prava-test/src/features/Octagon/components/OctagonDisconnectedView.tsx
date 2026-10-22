import React from "react";
import { IconWifiOff, IconArrowLeft } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import "../octagon.css";

interface Props {
  onReturnToLobby: () => void;
}

/**
 * 45 soniyalik grace ichida qayta ulanib bo'lmadi. Jang natijasi serverda hisoblanadi (raqib
 * qaytmasa — texnik natija); foydalanuvchi xavfsiz holda lobbiga qaytadi.
 */
export const OctagonDisconnectedView: React.FC<Props> = ({ onReturnToLobby }) => {
  const { t } = useTranslation();

  return (
    <div className="oct-page-wrapper" style={{ justifyContent: "center", alignItems: "center" }}>
      <div className="oct-ambient-glow" />
      <div className="oct-disconnected" role="alert">
        <div className="oct-disconnected-icon">
          <IconWifiOff size={44} stroke={2.2} />
        </div>
        <h2 className="oct-disconnected-title">{t("octagon.disconnected.title")}</h2>
        <p className="oct-disconnected-text">{t("octagon.disconnected.message")}</p>
        <button type="button" className="oct-3d-btn blue oct-disconnected-btn" onClick={onReturnToLobby}>
          <IconArrowLeft size={20} stroke={2.6} />
          <span>{t("octagon.result.backToLobby")}</span>
        </button>
      </div>
    </div>
  );
};
