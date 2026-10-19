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
  IconPencil,
  IconCheck,
  IconUsers,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { OctagonAudio } from "../OctagonAudio";
import type { UserStats } from "../types";
import "../octagon.css";

interface Props {
  user: { id?: number | string; firstName?: string; lastName?: string } | null;
  guestNickname?: string;
  stats: UserStats | null;
  onStartSearch: () => void;
  onOpenDuel: () => void;
  onOpenLeaderboard: () => void;
  onOpenRules: () => void;
  onUpdateNickname?: (name: string) => void;
}

export const OctagonLobbyView: React.FC<Props> = ({
  user,
  guestNickname,
  stats,
  onStartSearch,
  onOpenDuel,
  onOpenLeaderboard,
  onOpenRules,
  onUpdateNickname,
}) => {
  const { t } = useTranslation();
  const [isMuted, setIsMuted] = useState(false);
  const [isEditingNick, setIsEditingNick] = useState(false);
  const [nickInput, setNickInput] = useState(guestNickname || "");

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    OctagonAudio.setMuted(next);
  };

  const initialDisplayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || "Haydovchi"
    : guestNickname || t("octagon.lobby.guest", "Mehmon");

  const [customName, setCustomName] = useState<string | null>(null);
  const displayName = customName || initialDisplayName;

  const handleSaveNick = () => {
    if (nickInput.trim()) {
      localStorage.setItem("octagon_guest_nickname", nickInput.trim());
      setCustomName(nickInput.trim());
      if (onUpdateNickname) onUpdateNickname(nickInput.trim());
    }
    setIsEditingNick(false);
  };

  const elo = stats?.eloRating ?? 0;
  const rawRank = stats?.rank ?? "bronze";
  const wins = stats?.wins ?? 0;
  const streak = stats?.winStreak ?? 0;
  const total = stats?.totalMatches ?? 0;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  const getRankData = (r: string) => {
    const lower = r.toLowerCase();
    if (lower === "brilliant") {
      return {
        name: t("octagon.rank.brilliant"),
        emoji: "💎",
        className: "brilliant",
      };
    }
    if (lower === "gold") {
      return {
        name: t("octagon.rank.gold"),
        emoji: "🥇",
        className: "gold",
      };
    }
    if (lower === "silver") {
      return {
        name: t("octagon.rank.silver"),
        emoji: "🥈",
        className: "silver",
      };
    }
    return {
      name: t("octagon.rank.bronze"),
      emoji: "🥉",
      className: "bronze",
    };
  };

  const rankData = getRankData(rawRank);

  return (
    <div className="oct-page-wrapper">
      {/* Background Ambient Glow */}
      <div className="oct-ambient-glow" />

      {/* Central Game Console (Osonprava style: 580px max-width) */}
      <div className="oct-console">
        {/* 1. Header Row */}
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

        {/* 2. User Profile & Symmetrical Stats Card */}
        <div className="oct-stats-card">
          {/* User Row (Clean layout without duplicate rating box) */}
          <div className="oct-user-row">
            <div className="oct-user-left">
              <div className="oct-avatar-ring">
                {displayName.charAt(0).toUpperCase()}
              </div>

              <div className="oct-user-info">
                {isEditingNick ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="text"
                      value={nickInput}
                      onChange={(e) => setNickInput(e.target.value)}
                      placeholder={t("octagon.lobby.editNickname")}
                      maxLength={18}
                      style={{
                        background: "#1e293b",
                        border: "1px solid #38bdf8",
                        borderRadius: 8,
                        padding: "4px 8px",
                        color: "#ffffff",
                        fontSize: 14,
                        fontWeight: 700,
                        outline: "none",
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveNick();
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleSaveNick}
                      style={{
                        background: "#10b981",
                        border: "none",
                        borderRadius: 8,
                        padding: "5px 8px",
                        color: "#ffffff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <IconCheck size={16} stroke={2.8} />
                    </button>
                  </div>
                ) : (
                  <div className="oct-user-name">
                    <span>{displayName}</span>
                    {!user && (
                      <button
                        type="button"
                        onClick={() => setIsEditingNick(true)}
                        className="oct-user-edit-btn"
                        title={t("octagon.lobby.editNickname")}
                        aria-label={t("octagon.lobby.editNickname")}
                      >
                        <IconPencil size={15} />
                      </button>
                    )}
                  </div>
                )}

                {/* League Badge under player name */}
                <div style={{ marginTop: 4 }}>
                  <div className={`oct-league-badge ${rankData.className}`} style={{ marginTop: 0, padding: "3px 10px", fontSize: "11.5px" }}>
                    <span>{rankData.emoji}</span>
                    <span>{rankData.name}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Column High-Contrast Symmetrical Stats Grid */}
          <div className="oct-stats-grid">
            {/* 1. Reyting */}
            <div className="oct-stat-cell">
              <div className="oct-stat-icon-wrap star">
                <IconStar size={17} stroke={2.6} />
              </div>
              <div className="oct-stat-val gold">{elo}</div>
              <div className="oct-stat-lbl">{t("octagon.lobby.rating")}</div>
            </div>

            {/* 2. G'alabalar */}
            <div className="oct-stat-cell">
              <div className="oct-stat-icon-wrap trophy">
                <IconTrophy size={17} stroke={2.6} />
              </div>
              <div className="oct-stat-val emerald">{wins}</div>
              <div className="oct-stat-lbl">{t("octagon.lobby.wins")}</div>
            </div>

            {/* 3. G'alaba % */}
            <div className="oct-stat-cell">
              <div className="oct-stat-icon-wrap chart">
                <IconPercentage size={17} stroke={2.6} />
              </div>
              <div className="oct-stat-val blue">{winRate}%</div>
              <div className="oct-stat-lbl">{t("octagon.lobby.winRate")}</div>
            </div>

            {/* 4. Seriya */}
            <div className="oct-stat-cell">
              <div className="oct-stat-icon-wrap flame">
                <IconFlame size={17} stroke={2.6} />
              </div>
              <div className="oct-stat-val red">{streak}</div>
              <div className="oct-stat-lbl">{t("octagon.lobby.streak")}</div>
            </div>
          </div>
        </div>

        {/* 3. Primary 3D Search Button */}
        <button
          type="button"
          onClick={onStartSearch}
          className="oct-search-btn-3d"
        >
          <IconSwords size={26} stroke={2.5} />
          <span>{t("octagon.lobby.startSearch")}</span>
        </button>

        {/* 4. Quick Action Cards (3 columns) */}
        <div className="oct-actions-row">
          {/* Card 1: Do'st bilan duel */}
          <div
            onClick={onOpenDuel}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onOpenDuel();
            }}
            className="oct-action-card"
          >
            <div className="oct-action-icon purple">
              <IconUsers size={22} stroke={2.2} />
            </div>
            <div className="oct-action-title">{t("octagon.lobby.duelFriend")}</div>
            <div className="oct-action-desc">{t("octagon.lobby.dueFriendDesc")}</div>
          </div>

          {/* Card 2: Peshqadamlar */}
          <div
            onClick={onOpenLeaderboard}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onOpenLeaderboard();
            }}
            className="oct-action-card"
          >
            <div className="oct-action-icon yellow">
              <IconTrophy size={22} stroke={2.2} />
            </div>
            <div className="oct-action-title">{t("octagon.lobby.leaderboard")}</div>
            <div className="oct-action-desc">{t("octagon.lobby.leaderboardDesc")}</div>
          </div>

          {/* Card 3: Oktagon qoidalari */}
          <div
            onClick={onOpenRules}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onOpenRules();
            }}
            className="oct-action-card"
          >
            <div className="oct-action-icon blue">
              <IconInfoCircle size={22} stroke={2.2} />
            </div>
            <div className="oct-action-title">{t("octagon.lobby.rulesAndLicense")}</div>
            <div className="oct-action-desc">{t("octagon.lobby.rulesDesc")}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
