import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useSWR from "swr";
import SEO from "../../components/common/SEO";
import { useAuth } from "../../auth/AuthContext";
import { GuestGate } from "../../components/common/GuestEmptyState";
import { EmptyState } from "../../components/common/EmptyState";
import { IconArrowLeft, IconCrown, IconTrophy } from "@tabler/icons-react";
import type { LeaderboardResponse } from "../../features/Leaderboard/types";
import { Skeleton, Stack } from "@mantine/core";

type PeriodTab = "weekly" | "monthly" | "all";

interface LeaderEntry {
  rank: number;
  name: string;
  score: number;
  avatar?: string;
  isCurrentUser?: boolean;
}

function LeaderboardContent() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [period, setPeriod] = useState<PeriodTab>("weekly");

  const leaderboardUrl = `/api/v1/statistics/leaderboard/global?period=${period}&size=20`;
  const { data: response, isLoading } = useSWR<LeaderboardResponse>(leaderboardUrl);

  const leaders = useMemo<LeaderEntry[]>(() => {
    if (response?.data?.content && Array.isArray(response.data.content) && response.data.content.length > 0) {
      return response.data.content.map((item: any, idx: number) => ({
        rank: item.rank ?? idx + 1,
        name: item.userName || item.user_name || item.fullName || item.name || t("leaderboard.userNum", { count: idx + 1 }),
        score: item.score ?? item.bestScore ?? item.points ?? 0,
        isCurrentUser: Boolean(user?.id && (item.userId === user.id || item.user_id === user.id)),
      }));
    }
    return [];
  }, [response, user, t]);

  const top1 = leaders.find((l) => l.rank === 1);
  const top2 = leaders.find((l) => l.rank === 2);
  const top3 = leaders.find((l) => l.rank === 3);
  const hasPodium = Boolean(top1 && top2 && top3);
  const rest = hasPodium ? leaders.filter((l) => l.rank > 3) : leaders;

  return (
    <>
      <SEO
        title={`${t("leaderboard.title", "Reyting")} - Prava Online`}
        description={t("seo.leaderboardDesc", "Eng yuqori natija ko'rsatgan o'quvchilar reytingi")}
        canonical="/leaderboard"
      />

      <div className="ds-page-wrapper">
        <div className="ds-page-container" style={{ maxWidth: 680 }}>
          {/* Header */}
          <div className="ds-page-header">
            <div className="ds-header-left">
              <button
                type="button"
                className="ds-back-btn"
                onClick={() => navigate("/me")}
                aria-label={t("common.back", "Orqaga")}
              >
                <IconArrowLeft size={18} />
              </button>
              <div>
                <h1 className="ds-page-title">{t("leaderboard.title", "Reyting")}</h1>
                <div className="ds-page-desc">
                  {t("leaderboard.subtitle", "Eng faol va yuqori natija ko'rsatgan o'quvchilar")}
                </div>
              </div>
            </div>
          </div>

          {/* Period Filter Pills */}
          <div className="ds-tabs-row" role="tablist" style={{ marginBottom: 28 }}>
            <button
              type="button"
              className={`ds-tab-pill ${period === "weekly" ? "is-active" : ""}`}
              onClick={() => setPeriod("weekly")}
            >
              {t("leaderboard.weekly", "Haftalik")}
            </button>
            <button
              type="button"
              className={`ds-tab-pill ${period === "monthly" ? "is-active" : ""}`}
              onClick={() => setPeriod("monthly")}
            >
              {t("leaderboard.monthly", "Oylik")}
            </button>
            <button
              type="button"
              className={`ds-tab-pill ${period === "all" ? "is-active" : ""}`}
              onClick={() => setPeriod("all")}
            >
              {t("leaderboard.allTime", "Barchasi")}
            </button>
          </div>

          {isLoading && (
            <Stack gap="md" py="xl">
              <Skeleton height={180} radius="lg" />
              <Skeleton height={56} radius="md" />
              <Skeleton height={56} radius="md" />
              <Skeleton height={56} radius="md" />
            </Stack>
          )}

          {!isLoading && leaders.length === 0 && (
            <EmptyState
              icon={<IconTrophy size={48} color="var(--mantine-color-yellow-6)" />}
              title={t("leaderboard.emptyTitle", "Reyting hali mavjud emas")}
              description={t(
                "leaderboard.emptyDesc",
                "Ushbu davr bo'yicha imtihon natijalari mavjud emas. Imtihon topshirib birinchi o'rinni egallang!"
              )}
              action={
                <button
                  type="button"
                  className="ds-btn ds-btn-primary"
                  onClick={() => navigate("/exam")}
                  style={{ marginTop: 12, padding: "8px 20px" }}
                >
                  {t("examDesktop.startExam", "Imtihon topshirish")}
                </button>
              }
            />
          )}

          {/* Podium Component (Top 3) */}
          {!isLoading && hasPodium && top1 && top2 && top3 && (
            <div className="ref-podium">
              {/* ── 2nd Place (Silver - Left) ── */}
              <div className="ref-podium-col">
                <div
                  className="ref-podium-avatar"
                  style={{
                    borderColor: "#94a3b8",
                    background: "linear-gradient(135deg, #334155, #1e293b)",
                  }}
                >
                  {top2.name.charAt(0).toUpperCase()}
                  <span
                    style={{
                      position: "absolute",
                      bottom: -4,
                      right: -4,
                      background: "#94a3b8",
                      color: "#0f172a",
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      fontSize: 11,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid #0f172a",
                    }}
                  >
                    2
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--g-text)", marginBottom: 2, textAlign: "center" }}>
                  {top2.name}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--g-text-muted)", marginBottom: 8 }}>
                  {top2.score} {t("leaderboard.points", "ball")}
                </div>
                <div className="ref-podium-step ref-podium-pedestal-2">
                  <span style={{ fontSize: 24, fontWeight: 900, color: "#94a3b8" }}>2</span>
                </div>
              </div>

              {/* ── 1st Place (Gold - Center - Elevated) ── */}
              <div className="ref-podium-col">
                <div style={{ position: "relative" }}>
                  <IconCrown
                    size={28}
                    style={{
                      color: "#f59e0b",
                      position: "absolute",
                      top: -24,
                      left: "50%",
                      transform: "translateX(-50%)",
                      filter: "drop-shadow(0 2px 8px rgba(245, 158, 11, 0.6))",
                    }}
                  />
                  <div
                    className="ref-podium-avatar"
                    style={{
                      borderColor: "#f59e0b",
                      background: "linear-gradient(135deg, #78350f, #451a03)",
                      transform: "scale(1.1)",
                    }}
                  >
                    {top1.name.charAt(0).toUpperCase()}
                    <span
                      style={{
                        position: "absolute",
                        bottom: -4,
                        right: -4,
                        background: "#f59e0b",
                        color: "#0f172a",
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        fontSize: 12,
                        fontWeight: 900,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px solid #0f172a",
                      }}
                    >
                      1
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--g-text)", marginBottom: 2, textAlign: "center" }}>
                  {top1.name}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#fbbf24", marginBottom: 8 }}>
                  {top1.score} {t("leaderboard.points", "ball")}
                </div>
                <div className="ref-podium-step ref-podium-pedestal-1">
                  <span style={{ fontSize: 28, fontWeight: 900, color: "#f59e0b" }}>1</span>
                </div>
              </div>

              {/* ── 3rd Place (Bronze - Right) ── */}
              <div className="ref-podium-col">
                <div
                  className="ref-podium-avatar"
                  style={{
                    borderColor: "#d97706",
                    background: "linear-gradient(135deg, #451a03, #291203)",
                  }}
                >
                  {top3.name.charAt(0).toUpperCase()}
                  <span
                    style={{
                      position: "absolute",
                      bottom: -4,
                      right: -4,
                      background: "#d97706",
                      color: "#ffffff",
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      fontSize: 11,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid #0f172a",
                    }}
                  >
                    3
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--g-text)", marginBottom: 2, textAlign: "center" }}>
                  {top3.name}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--g-text-muted)", marginBottom: 8 }}>
                  {top3.score} {t("leaderboard.points", "ball")}
                </div>
                <div className="ref-podium-step ref-podium-pedestal-3">
                  <span style={{ fontSize: 22, fontWeight: 900, color: "#d97706" }}>3</span>
                </div>
              </div>
            </div>
          )}

          {/* Ranked List */}
          {!isLoading && rest.length > 0 && (
            <div className="ref-leaderboard-list">
              {rest.map((entry) => (
                <div
                  key={entry.rank}
                  className={`ref-leader-row ${entry.isCurrentUser ? "is-current-user" : ""}`}
                >
                  <div className="ref-leader-user">
                    <span className="ref-leader-rank">{entry.rank}</span>
                    <div className="ref-leader-avatar">
                      {entry.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ref-leader-name">
                      {entry.name} {entry.isCurrentUser && `(${t("leaderboard.you", "Siz")})`}
                    </div>
                  </div>
                  <div className="ref-leader-score">
                    {entry.score} {t("leaderboard.points", "ball")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function Leaderboard_Page() {
  const { t } = useTranslation();
  return (
    <GuestGate
      pageTitle={t("leaderboard.title", "Reyting")}
      icon={IconCrown}
      title={t("guest.leaderboardTitle", "Reytingni ko'rish")}
      description={t(
        "guest.leaderboardDesc",
        "Boshqa o'quvchilar bilan raqobatlashish va o'z o'rningizni bilish uchun tizimga kiring."
      )}
    >
      <LeaderboardContent />
    </GuestGate>
  );
}
