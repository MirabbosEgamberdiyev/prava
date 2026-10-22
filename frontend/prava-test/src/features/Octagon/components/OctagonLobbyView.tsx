import React, { useState } from "react";
import {
  IconSwords,
  IconTrophy,
  IconFlame,
  IconInfoCircle,
  IconPercentage,
  IconVolume,
  IconVolumeOff,
  IconUsers,
  IconHistory,
  IconUserPlus,
  IconLock,
  IconLogin2,
  IconX,
  IconBolt,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { OctagonAudio } from "../OctagonAudio";
import type { UserStats } from "../types";
import { OctagonAvatar } from "./OctagonAvatar";
import { OctagonRankBadge } from "./OctagonRankBadge";
import { OctagonLeagueLadder } from "./OctagonLeagueLadder";
import "../octagon.css";

interface Props {
  /** null — mehmon: jang tugmalari kirish oynasini ochadi. */
  user: { id?: number | string; firstName?: string; lastName?: string } | null;
  displayName: string;
  stats: UserStats | null;
  /** Statistika hali yuklanmoqda — skeleton ko'rsatiladi. */
  loading?: boolean;
  onStartSearch: () => void;
  onOpenDuel: () => void;
  onOpenGroup: () => void;
  onOpenLeaderboard: () => void;
  onOpenHistory: () => void;
  onOpenRules: () => void;
  onLogin: () => void;
}

export const OctagonLobbyView: React.FC<Props> = ({
  user,
  displayName,
  stats,
  loading = false,
  onStartSearch,
  onOpenDuel,
  onOpenGroup,
  onOpenLeaderboard,
  onOpenHistory,
  onOpenRules,
  onLogin,
}) => {
  const { t } = useTranslation();
  const [isMuted, setIsMuted] = useState(() => OctagonAudio.getMuted());

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    OctagonAudio.setMuted(next);
  };

  const elo = stats?.eloRating ?? 0;
  const wins = stats?.wins ?? 0;
  const losses = stats?.losses ?? 0;
  const total = stats?.totalMatches ?? 0;
  const streak = stats?.winStreak ?? 0;
  // G'alaba foizi — serverdagi bilan bir xil (wins / totalMatches), jadval va profil bilan mos
  const winRate = Math.round(typeof stats?.winRate === "number" ? stats.winRate : total > 0 ? (wins / total) * 100 : 0);
  const isGuest = !user;
  const lock = isGuest ? <IconLock size={18} className="oct-mode-lock" aria-hidden="true" /> : null;

  return (
    <div className="oct-page-wrapper">
      <div className="oct-ambient-glow" />

      <div className="oct-console">
        {/* Header */}
        <div className="oct-header">
          <button
            type="button"
            onClick={toggleSound}
            className="oct-icon-btn"
            title={isMuted ? t("octagon.lobby.soundOff") : t("octagon.lobby.soundOn")}
            aria-label={isMuted ? t("octagon.lobby.soundOff") : t("octagon.lobby.soundOn")}
          >
            {isMuted ? <IconVolumeOff size={20} /> : <IconVolume size={20} />}
          </button>

          <div className="oct-header-center">
            <div className="oct-header-logo">
              <span>OKTAGON</span>
              <span className="oct-header-pvp-tag">1v1 PvP</span>
            </div>
            <div className="oct-header-tagline">{t("octagon.lobby.tagline")}</div>
          </div>

          <button
            type="button"
            onClick={onOpenRules}
            className="oct-icon-btn"
            title={t("octagon.lobby.rulesBtn")}
            aria-label={t("octagon.lobby.rulesBtn")}
          >
            <IconInfoCircle size={20} />
          </button>
        </div>

        {/* Profil va statistika */}
        {isGuest ? (
          <div className="oct-stats-card oct-guest-card">
            <div className="oct-guest-lock">
              <IconLock size={26} stroke={2.4} />
            </div>
            <div className="oct-guest-text">
              <div className="oct-guest-title">{t("octagon.authGate.title")}</div>
              <div className="oct-guest-desc">{t("octagon.authGate.message")}</div>
            </div>
            <button type="button" className="oct-3d-btn blue oct-guest-login" onClick={onLogin}>
              <IconLogin2 size={18} stroke={2.6} />
              <span>{t("octagon.authGate.loginButton")}</span>
            </button>
          </div>
        ) : loading && !stats ? (
          <div className="oct-stats-card oct-skeleton-card" aria-busy="true" aria-label={t("octagon.lobby.loading")}>
            <div className="oct-user-row">
              <div className="oct-user-left">
                <div className="oct-skel oct-skel-avatar" />
                <div className="oct-user-info">
                  <div className="oct-skel oct-skel-line" style={{ width: 140 }} />
                  <div className="oct-skel oct-skel-line" style={{ width: 90, marginTop: 8 }} />
                </div>
              </div>
              <div className="oct-skel oct-skel-elo" />
            </div>
            <div className="oct-stats-grid">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="oct-stat-cell">
                  <div className="oct-skel oct-skel-cell" />
                </div>
              ))}
            </div>
            <div className="oct-skel oct-skel-row" style={{ marginTop: 14, height: 64 }} />
          </div>
        ) : (
          <div className="oct-stats-card">
            <div className="oct-user-row">
              <div className="oct-user-left">
                <OctagonAvatar name={displayName} src={stats?.avatarUrl} size={56} ring="var(--oct-blue)" />
                <div className="oct-user-info">
                  <div className="oct-user-name">
                    <span>{displayName}</span>
                  </div>
                  <div className="oct-user-badges">
                    <OctagonRankBadge elo={elo} rank={stats?.rank} size="sm" />
                    {streak > 0 && (
                      <span className="oct-streak-chip" title={t("octagon.lobby.streak")}>
                        <IconFlame size={14} stroke={2.6} />
                        {t("octagon.lobby.streakChip", { count: streak })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="oct-elo-big" aria-label={`${elo} ELO`}>
                <span className="oct-elo-big-num">{elo}</span>
                <span className="oct-elo-big-unit">ELO</span>
              </div>
            </div>

            <div className="oct-stats-grid">
              <div className="oct-stat-cell">
                <div className="oct-stat-icon-wrap chart">
                  <IconSwords size={17} stroke={2.6} />
                </div>
                <div className="oct-stat-val blue">{total}</div>
                <div className="oct-stat-lbl">{t("octagon.lobby.matches")}</div>
              </div>
              <div className="oct-stat-cell">
                <div className="oct-stat-icon-wrap trophy">
                  <IconTrophy size={17} stroke={2.6} />
                </div>
                <div className="oct-stat-val emerald">{wins}</div>
                <div className="oct-stat-lbl">{t("octagon.lobby.wins")}</div>
              </div>
              <div className="oct-stat-cell">
                <div className="oct-stat-icon-wrap flame">
                  <IconX size={17} stroke={2.6} />
                </div>
                <div className="oct-stat-val red">{losses}</div>
                <div className="oct-stat-lbl">{t("octagon.lobby.losses")}</div>
              </div>
              <div className="oct-stat-cell">
                <div className="oct-stat-icon-wrap star">
                  <IconPercentage size={17} stroke={2.6} />
                </div>
                <div className="oct-stat-val gold">{winRate}%</div>
                <div className="oct-stat-lbl">{t("octagon.lobby.winRate")}</div>
              </div>
            </div>

            <OctagonLeagueLadder elo={elo} />
          </div>
        )}

        {/* Asosiy CTA — tezkor jang; guruh va duel ikkilamchi, yonma-yon */}
        <div className="oct-modes">
          <button type="button" className="oct-3d-btn green oct-mode-btn oct-mode-primary" onClick={onStartSearch}>
            <span className="oct-mode-icon">
              <IconBolt size={30} stroke={2.5} />
            </span>
            <span className="oct-mode-text">
              <span className="oct-mode-title">{t("octagon.modes.random")}</span>
              <span className="oct-mode-desc">{t("octagon.modes.randomDesc")}</span>
            </span>
            {lock}
          </button>

          <div className="oct-modes-pair">
            <button type="button" className="oct-3d-btn blue oct-mode-tile" onClick={onOpenGroup}>
              <span className="oct-mode-icon">
                <IconUsers size={26} stroke={2.5} />
              </span>
              <span className="oct-mode-title">{t("octagon.modes.group")}</span>
              <span className="oct-mode-desc">{t("octagon.modes.groupDesc")}</span>
              {lock}
            </button>

            <button type="button" className="oct-3d-btn purple oct-mode-tile" onClick={onOpenDuel}>
              <span className="oct-mode-icon">
                <IconUserPlus size={26} stroke={2.5} />
              </span>
              <span className="oct-mode-title">{t("octagon.modes.friend")}</span>
              <span className="oct-mode-desc">{t("octagon.modes.friendDesc")}</span>
              {lock}
            </button>
          </div>
        </div>

        {/* Ikkilamchi amallar */}
        <div className="oct-secondary-row">
          <button type="button" className="oct-secondary-btn" onClick={onOpenLeaderboard}>
            <IconTrophy size={18} color="var(--oct-gold)" />
            <span>{t("octagon.lobby.leaderboard")}</span>
          </button>
          <button type="button" className="oct-secondary-btn" onClick={onOpenHistory}>
            <IconHistory size={18} color="var(--oct-green)" />
            <span>{t("octagon.lobby.history")}</span>
          </button>
          <button type="button" className="oct-secondary-btn" onClick={onOpenRules}>
            <IconInfoCircle size={18} color="var(--oct-blue)" />
            <span>{t("octagon.lobby.rulesBtn")}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
