import React, { useEffect, useState } from "react";
import { IconX, IconWifiOff, IconBulb } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { OCTAGON_CONFIG, type QueueStatus } from "../types";
import { formatClock } from "../arena";
import { OctagonAvatar } from "./OctagonAvatar";
import "../octagon.css";

interface Props {
  searchSeconds: number;
  /** Server har 2 s da yuboradigan real holat; null — hali kelmadi. */
  queueStatus?: QueueStatus | null;
  /** Qidiruv paytida aloqa uzildi — avtomatik qayta ulanib navbatga qaytamiz. */
  reconnecting?: boolean;
  myName: string;
  myAvatar?: string | null;
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

/** Qidiruv paytida aylanuvchi maslahatlar — hammasi haqiqiy qoidalar (qoidalar oynasi bilan bir xil). */
const TIP_KEYS = ["tipHotkeys", "tipAntiCheat", "tipReconnect", "tipDraw"] as const;
const TIP_INTERVAL_MS = 5000;

export const OctagonRadarView: React.FC<Props> = ({ searchSeconds, queueStatus, reconnecting, myName, myAvatar, onCancel }) => {
  const { t } = useTranslation();
  const [tipIdx, setTipIdx] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTipIdx((i) => (i + 1) % TIP_KEYS.length), TIP_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  // Server 3 s dan keyin ELO oralig'ini kengaytiradi, 7 s da mos odam bo'lmasa bot ulanadi
  const isWideSearch = searchSeconds >= OCTAGON_CONFIG.RADAR_WIDEN_AFTER_SEC;
  const blips = Math.min(queueStatus?.searching ?? 0, BLIP_SLOTS.length);

  // ELO oralig'i faqat server yuborgan bo'lsa (ishonchli ma'lumot); null — har qanday raqib
  let range: string = "—";
  if (queueStatus && typeof queueStatus.elo === "number" && queueStatus.eloRange !== undefined) {
    range =
      queueStatus.eloRange === null
        ? t("octagon.radar.anyElo")
        : `${Math.max(0, queueStatus.elo - queueStatus.eloRange)}–${queueStatus.elo + queueStatus.eloRange}`;
  }
  const botIn = queueStatus?.botInSec;

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
        <div className="oct-radar-head">
          <div className="oct-radar-title">
            {isWideSearch ? t("octagon.radar.widening") : t("octagon.radar.searchingOpponent")}
          </div>
          <div className="oct-radar-desc">
            {isWideSearch ? t("octagon.radar.wideningDesc") : t("octagon.radar.eloMatchDesc")}
          </div>
        </div>

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

          <div className="oct-sonar-center oct-sonar-me">
            <OctagonAvatar name={myName} src={myAvatar} size={64} />
          </div>
        </div>

        <div className="oct-radar-timer-pill" aria-live="off">
          <span className="oct-banner-dot" />
          <span className="oct-radar-time-text">{formatClock(searchSeconds)}</span>
        </div>

        <div className="oct-radar-stats" aria-live="polite">
          <div className="oct-radar-stat">
            <span className="oct-radar-stat-val gold">{range}</span>
            <span className="oct-radar-stat-lbl">{t("octagon.radar.eloRange")}</span>
          </div>
          <div className="oct-radar-stat">
            <span className="oct-radar-stat-val green">{queueStatus ? queueStatus.online : "—"}</span>
            <span className="oct-radar-stat-lbl">{t("octagon.radar.online")}</span>
          </div>
          <div className="oct-radar-stat">
            <span className="oct-radar-stat-val blue">{queueStatus ? queueStatus.searching : "—"}</span>
            <span className="oct-radar-stat-lbl">{t("octagon.radar.searching")}</span>
          </div>
        </div>

        {typeof botIn === "number" && (
          <div className="oct-radar-note">
            {botIn > 0 ? t("octagon.radar.botIn", { sec: botIn }) : t("octagon.radar.botNow")}
          </div>
        )}

        <div className="oct-radar-tip" aria-live="polite">
          <IconBulb size={20} className="oct-radar-tip-icon" aria-hidden="true" />
          <span key={tipIdx}>{t(`octagon.radar.${TIP_KEYS[tipIdx]}`)}</span>
        </div>

        <button type="button" onClick={onCancel} className="oct-3d-btn red oct-radar-cancel">
          <IconX size={20} stroke={2.6} />
          <span>{t("octagon.radar.cancel")}</span>
        </button>
      </div>
    </div>
  );
};
