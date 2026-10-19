import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconSwords, IconArrowRight, IconFlame } from "@tabler/icons-react";
import { useAuth } from "../../auth/AuthContext";
import { OctagonApi } from "../../features/Octagon/OctagonApi";
import type { UserStats } from "../../features/Octagon/types";

export const OctagonBannerCard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    let isMounted = true;
    OctagonApi.getStats()
      .then((data) => {
        if (isMounted && data) {
          setStats(data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [user]);

  const elo = stats?.eloRating ?? 1000;
  const rawRank = stats?.rank ?? "bronze";

  const getRankInfo = (r: string) => {
    const lower = r.toLowerCase();
    if (lower === "brilliant") return { name: t("octagon.rank.brilliant"), emoji: "💎", color: "text-purple-400" };
    if (lower === "gold") return { name: t("octagon.rank.gold"), emoji: "🥇", color: "text-amber-400" };
    if (lower === "silver") return { name: t("octagon.rank.silver"), emoji: "🥈", color: "text-slate-300" };
    return { name: t("octagon.rank.bronze"), emoji: "🥉", color: "text-amber-600" };
  };

  const rankInfo = getRankInfo(rawRank);

  return (
    <div
      onClick={() => navigate("/octagon")}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          navigate("/octagon");
        }
      }}
      className="relative overflow-hidden rounded-3xl p-6 md:p-8 cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:shadow-purple-950/60 active:scale-[0.99] border border-purple-500/30 group my-6 select-none"
      style={{
        background: "linear-gradient(135deg, rgba(30, 27, 75, 0.95) 0%, rgba(59, 7, 100, 0.85) 50%, rgba(15, 23, 42, 0.98) 100%)",
        boxShadow: "0 10px 30px -5px rgba(88, 28, 135, 0.25)",
      }}
    >
      {/* Background Decorative Arena Glow & SVG */}
      <div className="absolute -right-8 -top-8 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-12 top-1/2 -translate-y-1/2 opacity-10 group-hover:opacity-20 group-hover:scale-105 transition-all duration-500 pointer-events-none hidden md:block">
        <svg width="220" height="220" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.2">
          <path d="M21 3l-6 6M3 21l6-6M3 3l6 6M21 21l-6-6" strokeLinecap="round" />
          <circle cx="12" cy="12" r="7" strokeDasharray="3 3" />
          <path d="M14.5 9.5L9.5 14.5M9.5 9.5l5 5" strokeLinecap="round" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Left Content */}
        <div className="flex-1">
          {/* Pulsing Green/Neon Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black tracking-wider uppercase mb-3 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>{t("octagon.banner.badge")}</span>
          </div>

          {/* Title */}
          <h3 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>{t("octagon.banner.title")}</span>
            <IconSwords size={22} className="text-amber-400 hidden sm:inline-block" />
          </h3>

          {/* Description */}
          <p className="text-slate-300 text-sm md:text-base font-normal mt-1.5 max-w-xl leading-relaxed">
            {t("octagon.banner.desc")}
          </p>

          {/* Stats & Rank Preview Widget */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs font-semibold text-slate-200 backdrop-blur-md shadow-inner">
              <span className="text-sm">{rankInfo.emoji}</span>
              <span>{t("octagon.banner.myRank", { rank: rankInfo.name, elo })}</span>
            </div>

            {stats && stats.winStreak > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-bold text-amber-400">
                <IconFlame size={14} />
                <span>{stats.winStreak}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right CTA Button */}
        <div className="flex items-center justify-start md:justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate("/octagon");
            }}
            className="w-full md:w-auto px-7 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:translate-y-0.5 text-white font-extrabold text-base tracking-wide flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/30 transition-all cursor-pointer whitespace-nowrap group-hover:bg-emerald-400"
            style={{
              boxShadow: "0 4px 14px 0 rgba(16, 185, 129, 0.39)",
            }}
          >
            <span>{t("octagon.banner.cta")}</span>
            <IconArrowRight size={18} stroke={2.5} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
