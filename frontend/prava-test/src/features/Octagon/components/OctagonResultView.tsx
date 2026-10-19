import React, { useEffect } from "react";
import { Text, Badge, Button } from "@mantine/core";
import { IconTrophy, IconFlame, IconRefresh, IconArrowLeft, IconSwords } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { fireConfetti } from "../confetti";
import type { MatchResultData, MatchOpponent } from "../types";
import "../octagon.css";

interface Props {
  result: MatchResultData | null;
  myName: string;
  opponent: MatchOpponent | null;
  revengeRequested: boolean;
  onRequestRevenge: () => void;
  onReturnToLobby: () => void;
}

export const OctagonResultView: React.FC<Props> = ({
  result,
  myName,
  opponent,
  revengeRequested,
  onRequestRevenge,
  onReturnToLobby,
}) => {
  const { t } = useTranslation();

  const isWin = result?.isWin ?? false;
  const isDraw = result?.isDraw ?? false;

  useEffect(() => {
    if (isWin) {
      fireConfetti();
    }
  }, [isWin]);

  const deltaElo = result?.myDeltaElo ?? 0;
  const isPositive = deltaElo > 0;

  return (
    <div className="oct-page-wrapper" style={{ justifyContent: "center", alignItems: "center" }}>
      <div className="oct-ambient-glow" />

      <div className="oct-result-container">
        {/* Result Status Banner */}
        <div className={`oct-result-badge-icon ${isWin ? "win" : isDraw ? "draw" : "lose"}`}>
          {isWin ? (
            <IconTrophy size={48} />
          ) : isDraw ? (
            <IconSwords size={48} />
          ) : (
            <IconFlame size={48} />
          )}
        </div>

        <div className={`oct-result-title ${isWin ? "win" : isDraw ? "draw" : "lose"}`}>
          {isWin
            ? t("octagon.result.victory", "G'ALABA!")
            : isDraw
            ? t("octagon.result.draw", "DURANG!")
            : t("octagon.result.defeat", "MAG'LUBIYAT")}
        </div>

        <Text size="sm" style={{ color: "#94a3b8", marginTop: 6, maxWidth: 440 }}>
          {isWin
            ? t("octagon.result.winDesc", "Ajoyib g'alaba! Bilimlaringiz yuksak darajada.")
            : isDraw
            ? t("octagon.result.drawDesc", "Teng kurash! Ikkala tomon ham mahorat ko'rsatdi.")
            : t("octagon.result.loseDesc", "Tushkunlikka tushmang! Xatolarni o'rganing va qasos oling.")}
        </Text>

        {/* Match Score Card */}
        <div className="oct-result-card">
          <div className="oct-result-matchup">
            {/* My Stats */}
            <div className="oct-result-col">
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "#1e3a8a",
                  border: "2.5px solid #3b82f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: 20,
                }}
              >
                {myName ? myName.charAt(0).toUpperCase() : "U"}
              </div>
              <Text fw={800} size="sm" style={{ color: "#ffffff", marginTop: 8 }}>
                {myName}
              </Text>
              <div className="oct-result-score me">{result?.finalScores?.me ?? 0}</div>
            </div>

            <div style={{ fontSize: 28, fontWeight: 900, color: "#64748b" }}>:</div>

            {/* Opponent Stats */}
            <div className="oct-result-col">
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "#881337",
                  border: "2.5px solid #ef4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: 20,
                  overflow: "hidden",
                }}
              >
                {opponent?.avatar ? (
                  <img src={opponent.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  opponent?.name?.charAt(0).toUpperCase() || "R"
                )}
              </div>
              <Text fw={800} size="sm" style={{ color: "#ffffff", marginTop: 8 }}>
                {opponent?.name || t("octagon.arena.opponent", "Raqib")}
              </Text>
              <div className="oct-result-score opp">{result?.finalScores?.opponent ?? 0}</div>
            </div>
          </div>

          {/* ELO Delta Badge */}
          <div className="oct-elo-delta-box">
            <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 700 }}>
              {t("octagon.result.eloChange", "Reyting o'zgarishi:")}
            </span>
            <Badge
              size="lg"
              radius="md"
              variant="filled"
              color={isPositive ? "teal" : deltaElo < 0 ? "red" : "gray"}
              style={{ fontWeight: 900, fontFamily: "monospace" }}
            >
              {isPositive ? `+${deltaElo}` : deltaElo} {t("octagon.arena.points", "ball")}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
          <button
            type="button"
            disabled={revengeRequested}
            onClick={onRequestRevenge}
            className="oct-search-btn-3d"
            style={{
              height: 56,
              fontSize: 16,
              background: revengeRequested ? "#475569" : "#10b981",
              borderBottomColor: revengeRequested ? "#334155" : "#047857",
              boxShadow: revengeRequested ? "none" : undefined,
              cursor: revengeRequested ? "not-allowed" : "pointer",
            }}
          >
            <IconRefresh size={20} style={{ animation: revengeRequested ? "oct-spin 1s linear infinite" : "none" }} />
            <span>
              {revengeRequested
                ? t("octagon.result.waitingRevenge", "Raqib javobi kutilmoqda...")
                : t("octagon.result.requestRevenge", "Qasos (Rematch) talab qilish")}
            </span>
          </button>

          <Button
            variant="subtle"
            color="gray"
            radius="xl"
            size="md"
            leftSection={<IconArrowLeft size={18} />}
            onClick={onReturnToLobby}
            style={{ color: "#94a3b8" }}
          >
            {t("octagon.result.backToLobby", "Lobbiyga qaytish")}
          </Button>
        </div>
      </div>
    </div>
  );
};
