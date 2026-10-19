import React from "react";
import { Avatar } from "@mantine/core";
import {
  IconSwords,
  IconTrophy,
  IconFlame,
  IconInfoCircle,
  IconAward,
  IconStar,
  IconPercentage,
  IconChevronRight,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { UserStats } from "../types";

interface Props {
  user: { id?: number | string; firstName?: string; lastName?: string } | null;
  guestNickname?: string;
  stats: UserStats | null;
  onStartSearch: () => void;
  onOpenDuel: () => void;
  onOpenLeaderboard: () => void;
  onOpenRules: () => void;
}

export const OctagonLobbyView: React.FC<Props> = ({
  user,
  guestNickname,
  stats,
  onStartSearch,
  onOpenDuel,
  onOpenLeaderboard,
  onOpenRules,
}) => {
  const { t } = useTranslation();

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || "Haydovchi"
    : guestNickname || t("octagon.lobby.guest");

  const elo = stats?.eloRating ?? 1000;
  const rank = stats?.rank ?? "bronze";
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
        border: "border-purple-500/50",
        badgeBg: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      };
    }
    if (lower === "gold") {
      return {
        name: t("octagon.rank.gold"),
        emoji: "🥇",
        border: "border-amber-500/50",
        badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      };
    }
    if (lower === "silver") {
      return {
        name: t("octagon.rank.silver"),
        emoji: "🥈",
        border: "border-slate-400/50",
        badgeBg: "bg-slate-400/20 text-slate-200 border-slate-400/40",
      };
    }
    return {
      name: t("octagon.rank.bronze"),
      emoji: "🥉",
      border: "border-amber-700/50",
      badgeBg: "bg-amber-700/20 text-amber-400 border-amber-700/40",
    };
  };

  const rankInfo = getRankData(rank);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full select-none">
      {/* 1. Hero Header & Live Online Pulse */}
      <div className="text-center mb-8 relative">
        <div className="inline-flex items-center justify-center p-3.5 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3 shadow-lg shadow-emerald-500/20">
          <IconSwords size={40} className="animate-pulse" />
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-white tracking-wider flex items-center justify-center gap-3">
          <span>OKTAGON</span>
          <span className="text-xs uppercase px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black tracking-wider shadow-sm">
            1v1 PvP
          </span>
        </h1>

        <p className="text-sm md:text-base text-slate-400 mt-2 max-w-lg mx-auto">
          {t("octagon.lobby.tagline")}
        </p>

        {/* Live Online Badge */}
        <div className="mt-3.5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-md shadow-emerald-500/10">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span>{t("octagon.lobby.onlineCounter")}</span>
        </div>
      </div>

      {/* 2. Glassmorphism Profile & 4-Stat Widgets Card */}
      <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-4">
            <div className={`p-1 rounded-full border-2 ${rankInfo.border} shadow-lg shadow-purple-950/40`}>
              <Avatar size="xl" radius="xl" color="blue" className="bg-slate-800 text-xl font-black text-white">
                {displayName.charAt(0).toUpperCase()}
              </Avatar>
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                {displayName}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${rankInfo.badgeBg}`}>
                  <span>{rankInfo.emoji}</span>
                  <span>{rankInfo.name}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col sm:items-end justify-between items-center bg-slate-800/40 sm:bg-transparent p-3 sm:p-0 rounded-2xl border border-slate-800 sm:border-0">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">
              {t("octagon.lobby.rating")}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight flex items-baseline gap-1">
              <span>{elo}</span>
              <span className="text-xs text-slate-400 font-normal">ELO</span>
            </div>
          </div>
        </div>

        {/* 4-Column Stat Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mt-6 text-center">
          {/* Stat 1: ELO Rating */}
          <div className="bg-slate-800/50 hover:bg-slate-800/80 transition-colors p-4 rounded-2xl border border-slate-800 flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
              <IconStar size={18} stroke={2.5} />
            </div>
            <div className="text-xs text-slate-400 font-semibold">{t("octagon.lobby.rating")}</div>
            <div className="text-xl font-extrabold text-amber-400 font-mono mt-0.5">{elo}</div>
          </div>

          {/* Stat 2: Wins */}
          <div className="bg-slate-800/50 hover:bg-slate-800/80 transition-colors p-4 rounded-2xl border border-slate-800 flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
              <IconTrophy size={18} stroke={2.5} />
            </div>
            <div className="text-xs text-slate-400 font-semibold">{t("octagon.lobby.wins")}</div>
            <div className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5">{wins}</div>
          </div>

          {/* Stat 3: Win Rate */}
          <div className="bg-slate-800/50 hover:bg-slate-800/80 transition-colors p-4 rounded-2xl border border-slate-800 flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-2">
              <IconPercentage size={18} stroke={2.5} />
            </div>
            <div className="text-xs text-slate-400 font-semibold">{t("octagon.lobby.winRate")}</div>
            <div className="text-xl font-extrabold text-blue-400 font-mono mt-0.5">{winRate}%</div>
          </div>

          {/* Stat 4: Streak */}
          <div className="bg-slate-800/50 hover:bg-slate-800/80 transition-colors p-4 rounded-2xl border border-slate-800 flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 mb-2">
              <IconFlame size={18} stroke={2.5} />
            </div>
            <div className="text-xs text-slate-400 font-semibold">{t("octagon.lobby.streak")}</div>
            <div className="text-xl font-extrabold text-orange-400 font-mono mt-0.5">{streak}</div>
          </div>
        </div>
      </div>

      {/* 3. Matchmaking Hub: Big 3D Tactile Green Button */}
      <div className="mb-8">
        <button
          type="button"
          onClick={onStartSearch}
          className="w-full py-5 rounded-2xl text-white font-black text-xl tracking-wider shadow-2xl cursor-pointer transition-all active:translate-y-1 hover:brightness-110 flex items-center justify-center gap-3"
          style={{
            background: "linear-gradient(180deg, #22c55e 0%, #16a34a 100%)",
            boxShadow: "0 6px 0 #15803d, 0 12px 25px rgba(34, 197, 94, 0.4)",
            border: "none",
          }}
        >
          <IconSwords size={28} />
          <span>{t("octagon.lobby.startSearch")}</span>
        </button>
      </div>

      {/* 4. Action Hub (3 Columns): Duel, Leaderboard, Rules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Card 1: Duel */}
        <div
          onClick={onOpenDuel}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onOpenDuel();
          }}
          className="bg-slate-900/70 hover:bg-slate-900/95 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-5 transition-all duration-300 cursor-pointer shadow-lg group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <IconAward size={22} stroke={2.2} />
            </div>
            <IconChevronRight size={18} className="text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white group-hover:text-purple-300 transition-colors">
              {t("octagon.lobby.duelFriend")}
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {t("octagon.lobby.duelFriendDesc")}
            </p>
          </div>
        </div>

        {/* Card 2: Leaderboard */}
        <div
          onClick={onOpenLeaderboard}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onOpenLeaderboard();
          }}
          className="bg-slate-900/70 hover:bg-slate-900/95 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 transition-all duration-300 cursor-pointer shadow-lg group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <IconTrophy size={22} stroke={2.2} />
            </div>
            <IconChevronRight size={18} className="text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white group-hover:text-amber-300 transition-colors">
              {t("octagon.lobby.leaderboard")}
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {t("octagon.lobby.leaderboardDesc")}
            </p>
          </div>
        </div>

        {/* Card 3: Rules & Regulations */}
        <div
          onClick={onOpenRules}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onOpenRules();
          }}
          className="bg-slate-900/70 hover:bg-slate-900/95 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 transition-all duration-300 cursor-pointer shadow-lg group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <IconInfoCircle size={22} stroke={2.2} />
            </div>
            <IconChevronRight size={18} className="text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white group-hover:text-cyan-300 transition-colors">
              {t("octagon.lobby.rulesAndLicense")}
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {t("octagon.lobby.rulesDesc")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
