import React from "react";
import { Text, Badge, Avatar, Group, SimpleGrid } from "@mantine/core";
import { IconSwords, IconTrophy, IconFlame, IconInfoCircle, IconAward } from "@tabler/icons-react";
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
    : guestNickname || t("octagon.lobby.guest", "Mehmon O'yinchi");

  const elo = stats?.eloRating ?? 0;
  const rank = stats?.rank ?? "bronze";
  const wins = stats?.wins ?? 0;
  const streak = stats?.winStreak ?? 0;
  const total = stats?.totalMatches ?? 0;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  const getRankData = (r: string) => {
    const lower = r.toLowerCase();
    if (lower === "brilliant") return { name: t("octagon.rank.brilliant", "Brilliant"), emoji: "💎", color: "violet" };
    if (lower === "gold") return { name: t("octagon.rank.gold", "Oltin"), emoji: "🥇", color: "yellow" };
    if (lower === "silver") return { name: t("octagon.rank.silver", "Kumush"), emoji: "🥈", color: "gray" };
    return { name: t("octagon.rank.bronze", "Bronza"), emoji: "🥉", color: "orange" };
  };

  const rankInfo = getRankData(rank);

  return (
    <div className="max-w-xl mx-auto px-4 py-8 select-none">
      {/* Hero Badge & Title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3 shadow-lg shadow-emerald-500/10">
          <IconSwords size={38} className="animate-pulse" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-wider flex items-center justify-center gap-2">
          <span>OKTAGON</span>
          <span className="text-xs uppercase px-2 py-1 rounded-md bg-amber-500 text-black font-extrabold tracking-normal">
            1v1 PvP
          </span>
        </h1>
        <Text size="sm" c="dimmed" className="mt-1 max-w-sm mx-auto">
          {t("octagon.lobby.tagline", "Haqiqiy raqiblar bilan real vaqt rejimida bilim sinovi!")}
        </Text>
      </div>

      {/* User Status Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl mb-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <Avatar size="lg" radius="xl" color="blue" className="border-2 border-emerald-500/50">
              {displayName.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <Text fw={800} size="md" className="text-white">
                {displayName}
              </Text>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge color={rankInfo.color} size="sm" variant="light" className="font-bold">
                  {rankInfo.emoji} {rankInfo.name}
                </Badge>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">
              {t("octagon.lobby.rating", "Reyting")}
            </span>
            <div className="text-2xl font-black text-amber-400 font-mono">
              {elo} <span className="text-xs text-slate-400 font-normal">ELO</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <SimpleGrid cols={3} spacing="xs" className="mt-4 text-center">
          <div className="bg-slate-800/60 p-2.5 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400">{t("octagon.lobby.wins", "G'alabalar")}</div>
            <div className="text-base font-extrabold text-emerald-400 mt-0.5">{wins}</div>
          </div>

          <div className="bg-slate-800/60 p-2.5 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400">{t("octagon.lobby.winRate", "G'alaba %")}</div>
            <div className="text-base font-extrabold text-blue-400 mt-0.5">{winRate}%</div>
          </div>

          <div className="bg-slate-800/60 p-2.5 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400 flex items-center justify-center gap-0.5">
              <IconFlame size={12} className="text-amber-500" />
              <span>{t("octagon.lobby.streak", "Seriya")}</span>
            </div>
            <div className="text-base font-extrabold text-amber-400 mt-0.5">{streak}</div>
          </div>
        </SimpleGrid>
      </div>

      {/* Main Action: Big Green 3D Button */}
      <div className="mb-6">
        <button
          type="button"
          onClick={onStartSearch}
          className="octagon-btn-duo-green w-full py-4 rounded-2xl text-white font-black text-lg tracking-wide shadow-xl cursor-pointer"
          style={{
            background: "#22c55e",
            boxShadow: "0 5px 0 #15803d",
            border: "none",
          }}
        >
          <Group justify="center" gap="xs">
            <IconSwords size={24} />
            <span>{t("octagon.lobby.startSearch", "QIDIRISHNI BOSHLASH")}</span>
          </Group>
        </button>
      </div>

      {/* Secondary Actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={onOpenDuel}
          className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          <IconAward size={20} className="text-purple-400" />
          <span className="text-sm font-bold text-white">
            {t("octagon.lobby.duelFriend", "Do'st bilan duel")}
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenLeaderboard}
          className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          <IconTrophy size={20} className="text-yellow-400" />
          <span className="text-sm font-bold text-white">
            {t("octagon.lobby.leaderboard", "Peshqadamlar")}
          </span>
        </button>
      </div>

      {/* Rules Footer Link */}
      <div className="text-center">
        <button
          type="button"
          onClick={onOpenRules}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <IconInfoCircle size={15} />
          <span>{t("octagon.lobby.viewRules", "Oktagon qoidalari bilan tanishish")}</span>
        </button>
      </div>
    </div>
  );
};
