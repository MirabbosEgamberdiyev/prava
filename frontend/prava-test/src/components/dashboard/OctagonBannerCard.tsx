import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconSwords, IconArrowRight, IconFlame } from "@tabler/icons-react";
import { useAuth } from "../../auth/AuthContext";
import { OctagonApi } from "../../features/Octagon/OctagonApi";
import type { UserStats } from "../../features/Octagon/types";
import "../../features/Octagon/octagon.css";

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

  const elo = stats?.eloRating ?? 0;
  const rawRank = stats?.rank ?? "bronze";

  const getRankInfo = (r: string) => {
    const lower = r.toLowerCase();
    if (lower === "brilliant") return { name: t("octagon.rank.brilliant"), emoji: "💎" };
    if (lower === "gold") return { name: t("octagon.rank.gold"), emoji: "🥇" };
    if (lower === "silver") return { name: t("octagon.rank.silver"), emoji: "🥈" };
    return { name: t("octagon.rank.bronze"), emoji: "🥉" };
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
      className="oct-banner-card"
    >
      {/* Top Badge Row */}
      <div className="oct-banner-top">
        <div className="oct-banner-badge">
          <div className="oct-banner-dot" />
          <span>{t("octagon.banner.badge")}</span>
        </div>
      </div>

      {/* Title */}
      <div className="oct-banner-title">
        <span>{t("octagon.banner.title")}</span>
        <IconSwords size={22} color="#fbbf24" />
      </div>

      {/* Description */}
      <div className="oct-banner-desc">
        {t("octagon.banner.desc")}
      </div>

      {/* Footer: Rank & 3D CTA Button */}
      <div className="oct-banner-footer">
        <div className="oct-banner-rank">
          <span>{t("octagon.banner.myRank", { emoji: rankInfo.emoji, rank: rankInfo.name, elo })}</span>
          {stats && stats.winStreak > 0 && (
            <span style={{ color: "#ef4444", display: "inline-flex", alignItems: "center", gap: 3, marginLeft: 6 }}>
              <IconFlame size={15} />
              <span>{stats.winStreak}</span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate("/octagon");
          }}
          className="oct-banner-btn"
        >
          <span>{t("octagon.banner.cta")}</span>
          <IconArrowRight size={17} stroke={2.6} />
        </button>
      </div>
    </div>
  );
};
