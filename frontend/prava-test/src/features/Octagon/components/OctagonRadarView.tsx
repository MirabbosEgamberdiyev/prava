import React from "react";
import { IconX, IconRadar, IconWifiOff } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { OCTAGON_CONFIG, type QueueStatus } from "../types";
import { formatClock } from "../arena";
import "../octagon.css";

interface Props {
  searchSeconds: number;
  /** Server har 2 s da yuboradigan real holat; null — hali kelmadi. */
  queueStatus?: QueueStatus | null;
  /** Qidiruv paytida aloqa uzildi — avtomatik qayta ulanib navbatga qaytamiz. */
  reconnecting?: boolean;
  onCancel: () => void;
}

/** Radar nuqtalari faqat haqiqatda qidirayotgan boshqa o'yinchilar soniga teng (ko'pi bilan 6 ta). */
const BLIP_SLOTS = [
  { top: "30%", left: "66%" },
  { top: "64%", left: "28%" },
  { top: "24%", left: "34%" },
  { top: "70%", left: "64%" },
  { top: "46%", left: "80%" },
  { top: "48%", left: "16%" },
];

export const OctagonRadarView: React.FC<Props> = ({ searchSeconds, queueStatus, reconnecting, onCancel }) => {
  const { t } = useTranslation();

  // Server 3 s dan keyin ELO oralig'ini kengaytiradi, 7 s da mos odam bo'lmasa bot ulanadi
  const isWideSearch = searchSeconds >= OCTAGON_CONFIG.RADAR_WIDEN_AFTER_SEC;
  const blips = Math.min(queueStatus?.searching ?? 0, BLIP_SLOTS.length);

  return (
    <div className="oct-page-wrapper" style={{ justifyContent: "center", alignItems: "center" }}>
      <div className="oct-ambient-glow" />
      <div className="oct-radar-ambient-left" />
      <div className="oct-radar-ambient-right" />

      {reconnecting && (
        <div className="oct-reconnect-banner" role="status">
          <IconWifiOff size={16} />
          <span>{t("octagon.arena.reconnecting")}</span>
        </div>
      )}

      <div className="oct-console" style={{ alignItems: "center", textAlign: "center" }}>
        <div className="oct-sonar-container">
          <div className="oct-sonar-ring oct-ring-1" />
          <div className="oct-sonar-ring oct-ring-2" />
          <div className="oct-sonar-ring oct-ring-3" />

          <div className="oct-sonar-cross-h" />
          <div className="oct-sonar-cross-v" />

          <div className="oct-sonar-wave wave-1" />
          <div className="oct-sonar-wave wave-2" />
          <div className="oct-sonar-wave wave-3" />

          <div className="oct-sonar-sweep" />

          {/* Haqiqatda navbatda turgan boshqa o'yinchilar */}
          {BLIP_SLOTS.slice(0, blips).map((pos, i) => (
            <div
              key={i}
              className="oct-sonar-blip live"
              style={{ top: pos.top, left: pos.left, animationDelay: `${(i * 0.45).toFixed(2)}s` }}
            />
          ))}

          <div className="oct-sonar-center">
            <IconRadar size={36} className="oct-radar-icon-pulse" />
          </div>
        </div>

        <div className="oct-radar-status-card">
          <div className="oct-radar-timer-pill">
            <span className="oct-banner-dot" />
            <span className="oct-radar-time-text">{formatClock(searchSeconds)}</span>
          </div>

          <div className="oct-radar-title">
            {isWideSearch ? t("octagon.radar.widening") : t("octagon.radar.searchingOpponent")}
          </div>

          <div className="oct-radar-desc">
            {isWideSearch ? t("octagon.radar.wideningDesc") : t("octagon.radar.eloMatchDesc")}
          </div>

          {queueStatus && (
            <div className="oct-radar-live" aria-live="polite">
              <span className="oct-radar-live-dot" />
              <span>{t("octagon.radar.onlineNow", { count: queueStatus.online })}</span>
              <span className="oct-radar-live-sep">•</span>
              <span>{t("octagon.radar.searchingNow", { count: queueStatus.searching })}</span>
            </div>
          )}

          <button type="button" onClick={onCancel} className="oct-radar-cancel-btn">
            <IconX size={18} stroke={2.5} />
            <span>{t("octagon.radar.cancel")}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
