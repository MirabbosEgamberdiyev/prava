import React from "react";
import { IconX, IconRadar } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import "../octagon.css";

interface Props {
  searchSeconds: number;
  onCancel: () => void;
}

export const OctagonRadarView: React.FC<Props> = ({ searchSeconds, onCancel }) => {
  const { t } = useTranslation();

  const minutes = Math.floor(searchSeconds / 60);
  const seconds = searchSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // 20 s dan keyin qidiruv doirasi kengayadi (server mos raqibni ulaydi)
  const isWideSearch = searchSeconds >= 20;

  return (
    <div className="oct-page-wrapper" style={{ justifyContent: "center", alignItems: "center" }}>
      {/* Background Cosmic Ambient Glowing Orbs */}
      <div className="oct-ambient-glow" />
      <div className="oct-radar-ambient-left" />
      <div className="oct-radar-ambient-right" />

      <div className="oct-console" style={{ alignItems: "center", textAlign: "center" }}>
        {/* Esports Sonar Radar Dish */}
        <div className="oct-sonar-container">
          {/* Concentric rings */}
          <div className="oct-sonar-ring oct-ring-1" />
          <div className="oct-sonar-ring oct-ring-2" />
          <div className="oct-sonar-ring oct-ring-3" />

          {/* Crosshair grid lines */}
          <div className="oct-sonar-cross-h" />
          <div className="oct-sonar-cross-v" />

          {/* Expanding pulse waves */}
          <div className="oct-sonar-wave wave-1" />
          <div className="oct-sonar-wave wave-2" />
          <div className="oct-sonar-wave wave-3" />

          {/* 360° Conical Sweeping Beam */}
          <div className="oct-sonar-sweep" />

          {/* Simulated player blips */}
          <div className="oct-sonar-blip blip-1" />
          <div className="oct-sonar-blip blip-2" />

          {/* Center glowing focal point */}
          <div className="oct-sonar-center">
            <IconRadar size={36} className="oct-radar-icon-pulse" />
          </div>
        </div>

        {/* Live Matchmaking Status Card */}
        <div className="oct-radar-status-card">
          {/* High-contrast Timer Badge */}
          <div className="oct-radar-timer-pill">
            <span className="oct-banner-dot" />
            <span className="oct-radar-time-text">{timeFormatted}</span>
          </div>

          <div className="oct-radar-title">
            {isWideSearch
              ? t("octagon.radar.widening")
              : t("octagon.radar.searchingOpponent", "Teng kuchli raqib qidirilmoqda...")}
          </div>

          <div className="oct-radar-desc">
            {isWideSearch
              ? t("octagon.radar.wideningDesc")
              : t("octagon.radar.eloMatchDesc", "Sizning ELO reytingingizga mos raqib saralanmoqda")}
          </div>

          {/* Cancel Search Button */}
          <button
            type="button"
            onClick={onCancel}
            className="oct-radar-cancel-btn"
          >
            <IconX size={18} stroke={2.5} />
            <span>{t("octagon.radar.cancel", "Qidiruvni bekor qilish")}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
