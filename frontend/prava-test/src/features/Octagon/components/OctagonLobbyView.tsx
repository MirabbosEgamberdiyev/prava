import React, { useState } from "react";
import {
  IconSwords,
  IconTrophy,
  IconFlame,
  IconInfoCircle,
  IconStar,
  IconPercentage,
  IconVolume,
  IconVolumeOff,
  IconUsers,
  IconHistory,
  IconUserPlus,
  IconLock,
  IconLogin2,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { OctagonAudio } from "../OctagonAudio";
import type { UserStats } from "../types";
import { OctagonAvatar } from "./OctagonAvatar";
import { OctagonRankBadge } from "./OctagonRankBadge";
import "../octagon.css";

interface Props {
  /** null — mehmon: jang tugmalari kirish oynasini ochadi. */
  user: { id?: number | string; firstName?: string; lastName?: string } | null;
  displayName: string;
  stats: UserStats | null;
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
  const streak = stats?.winStreak ?? 0;
  const total = stats?.totalMatches ?? 0;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const isGuest = !user;

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

        {/* Profile & stats */}
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
        ) : (
          <div className="oct-stats-card">
            <div className="oct-user-row">
              <div className="oct-user-left">
                <OctagonAvatar name={displayName} src={stats?.avatarUrl} size={56} ring="#38bdf8" />
                <div className="oct-user-info">
                  <div className="oct-user-name">
                    <span>{displayName}</span>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <OctagonRankBadge elo={elo} rank={stats?.rank} size="sm" />
                  </div>
                </div>
              </div>
            </div>

            <div className="oct-stats-grid">
              <div className="oct-stat-cell">
                <div className="oct-stat-icon-wrap star">
                  <IconStar size={17} stroke={2.6} />
                </div>
                <div className="oct-stat-val gold">{elo}</div>
                <div className="oct-stat-lbl">{t("octagon.lobby.rating")}</div>
              </div>
              <div className="oct-stat-cell">
                <div className="oct-stat-icon-wrap trophy">
                  <IconTrophy size={17} stroke={2.6} />
                </div>
                <div className="oct-stat-val emerald">{wins}</div>
                <div className="oct-stat-lbl">{t("octagon.lobby.wins")}</div>
              </div>
              <div className="oct-stat-cell">
                <div className="oct-stat-icon-wrap chart">
                  <IconPercentage size={17} stroke={2.6} />
                </div>
                <div className="oct-stat-val blue">{winRate}%</div>
                <div className="oct-stat-lbl">{t("octagon.lobby.winRate")}</div>
              </div>
              <div className="oct-stat-cell">
                <div className="oct-stat-icon-wrap flame">
                  <IconFlame size={17} stroke={2.6} />
                </div>
                <div className="oct-stat-val red">{streak}</div>
                <div className="oct-stat-lbl">{t("octagon.lobby.streak")}</div>
              </div>
            </div>
          </div>
        )}

        {/* Three big modes */}
        <div className="oct-modes">
          <button type="button" className="oct-3d-btn green oct-mode-btn" onClick={onStartSearch}>
            <span className="oct-mode-icon"><IconSwords size={28} stroke={2.5} /></span>
            <span className="oct-mode-text">
              <span className="oct-mode-title">{t("octagon.modes.random")}</span>
              <span className="oct-mode-desc">{t("octagon.modes.randomDesc")}</span>
            </span>
            {isGuest && <IconLock size={18} className="oct-mode-lock" />}
          </button>

          <button type="button" className="oct-3d-btn blue oct-mode-btn" onClick={onOpenGroup}>
            <span className="oct-mode-icon"><IconUsers size={28} stroke={2.5} /></span>
            <span className="oct-mode-text">
              <span className="oct-mode-title">{t("octagon.modes.group")}</span>
              <span className="oct-mode-desc">{t("octagon.modes.groupDesc")}</span>
            </span>
            {isGuest && <IconLock size={18} className="oct-mode-lock" />}
          </button>

          <button type="button" className="oct-3d-btn purple oct-mode-btn" onClick={onOpenDuel}>
            <span className="oct-mode-icon"><IconUserPlus size={28} stroke={2.5} /></span>
            <span className="oct-mode-text">
              <span className="oct-mode-title">{t("octagon.modes.friend")}</span>
              <span className="oct-mode-desc">{t("octagon.modes.friendDesc")}</span>
            </span>
            {isGuest && <IconLock size={18} className="oct-mode-lock" />}
          </button>
        </div>

        {/* Secondary links */}
        <div className="oct-secondary-row">
          <button type="button" className="oct-secondary-btn" onClick={onOpenLeaderboard}>
            <IconTrophy size={18} color="#fbbf24" />
            <span>{t("octagon.lobby.leaderboard")}</span>
          </button>
          <button type="button" className="oct-secondary-btn" onClick={onOpenHistory}>
            <IconHistory size={18} color="#10b981" />
            <span>{t("octagon.lobby.history")}</span>
          </button>
          <button type="button" className="oct-secondary-btn" onClick={onOpenRules}>
            <IconInfoCircle size={18} color="#38bdf8" />
            <span>{t("octagon.lobby.rulesBtn")}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
