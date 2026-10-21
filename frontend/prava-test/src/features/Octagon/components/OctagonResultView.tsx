import React, { useEffect, useState } from "react";
import { Text, Badge, Button, Modal, Radio, Textarea, Stack, Group } from "@mantine/core";
import { IconTrophy, IconFlame, IconRefresh, IconArrowLeft, IconSwords, IconFlag, IconCheck } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { fireConfetti } from "../confetti";
import { OctagonApi } from "../OctagonApi";
import type { MatchResultData, MatchOpponent, GroupStanding } from "../types";
import { OctagonAvatar } from "./OctagonAvatar";
import { OctagonRankBadge } from "./OctagonRankBadge";
import { safeName } from "../rank";
import { showToast } from "../../../utils/notificationUtils";
import "../octagon.css";

interface Props {
  matchId?: string | null;
  result: MatchResultData | null;
  myName: string;
  myAvatar?: string | null;
  myUserId?: string;
  opponent: MatchOpponent | null;
  /** Guruhli jang natijalari (bo'lsa — 1v1 kartasi o'rniga reyting jadvali). */
  standings?: GroupStanding[] | null;
  revengeRequested: boolean;
  onRequestRevenge: () => void;
  onReturnToLobby: () => void;
}

export const OctagonResultView: React.FC<Props> = ({
  matchId,
  result,
  myName,
  myAvatar,
  myUserId,
  opponent,
  standings,
  revengeRequested,
  onRequestRevenge,
  onReturnToLobby,
}) => {
  const { t } = useTranslation();
  const oppName = safeName(opponent?.name, t("octagon.arena.opponent"));
  const oppElo = opponent?.elo ?? opponent?.score ?? 0;
  const meName = safeName(myName, t("octagon.lobby.defaultUser"));
  const isGroup = Boolean(standings && standings.length > 0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<string>("CHEATING");
  const [reportComment, setReportComment] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  const handleSubmitReport = async () => {
    if (!opponent?.id) return;
    setIsSubmittingReport(true);
    try {
      await OctagonApi.reportMatch({
        matchId: matchId || undefined,
        reportedUserId: opponent.id,
        reason: reportReason,
        comment: reportComment,
      });
      setReportSent(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSent(false);
        setReportComment("");
      }, 1600);
    } catch {
      showToast({ color: "red", message: t("octagon.common.error") });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const sortedStandings = isGroup ? [...(standings as GroupStanding[])].sort((a, b) => b.score - a.score) : [];
  const groupTop = sortedStandings[0]?.score ?? 0;
  const myGroupScore = sortedStandings.find((s) => s.userId === myUserId)?.score ?? 0;
  const groupLeaders = sortedStandings.filter((s) => s.score === groupTop).length;

  const isDraw = isGroup ? groupLeaders > 1 && myGroupScore === groupTop : result?.isDraw ?? false;
  const isWin = isGroup
    ? myGroupScore === groupTop && groupLeaders === 1
    : result?.isWin ??
      (!isDraw &&
        Boolean(
          (result?.finalScores && result.finalScores.me > result.finalScores.opponent) ||
            (result?.myDeltaElo && result.myDeltaElo > 0)
        ));


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

        {isGroup ? (
          <div className="oct-result-card">
            <div className="oct-group-standings">
              {sortedStandings.map((s, idx) => {
                const name = safeName(s.displayName, t("octagon.lobby.defaultUser"));
                const mine = s.userId === myUserId;
                return (
                  <div key={s.userId} className={`oct-standing-row ${mine ? "mine" : ""}`}>
                    <span className="oct-standing-pos">{idx + 1}</span>
                    <OctagonAvatar name={name} src={s.avatarUrl} size={36} />
                    <span className="oct-standing-name">
                      {name}
                      {mine && <span className="oct-hud-badge-you">{t("octagon.arena.you")}</span>}
                    </span>
                    <span className="oct-standing-score">
                      {s.score} {t("octagon.arena.points")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="oct-result-card">
            <div className="oct-result-matchup">
              {/* Me */}
              <div className="oct-result-col">
                <OctagonAvatar name={meName} src={myAvatar} size={56} ring="#3b82f6" />
                <Text fw={800} size="sm" style={{ color: "#ffffff", marginTop: 8 }}>
                  {meName}
                </Text>
                <div className="oct-result-score me">{result?.finalScores?.me ?? 0}</div>
              </div>

              <div style={{ fontSize: 28, fontWeight: 900, color: "#64748b" }}>:</div>

              {/* Opponent: ism, rasm, ELO va liga */}
              <div className="oct-result-col">
                <OctagonAvatar name={oppName} src={opponent?.avatar} size={56} ring="#ef4444" />
                <Text fw={800} size="sm" style={{ color: "#ffffff", marginTop: 8 }}>
                  {oppName}
                </Text>
                <Text size="xs" fw={700} style={{ color: "#94a3b8" }}>
                  {oppElo} ELO
                </Text>
                <OctagonRankBadge rank={opponent?.rank} elo={oppElo} size="xs" />
                <div className="oct-result-score opp">{result?.finalScores?.opponent ?? 0}</div>
              </div>
            </div>

            {/* ELO Delta Badge */}
            <div className="oct-elo-delta-box">
              <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 700 }}>
                {t("octagon.result.eloChange")}
              </span>
              <Badge
                size="lg"
                radius="md"
                variant="filled"
                color={isPositive ? "teal" : deltaElo < 0 ? "red" : "gray"}
                style={{ fontWeight: 900, fontFamily: "monospace" }}
              >
                {isPositive ? `+${deltaElo}` : deltaElo} ELO
              </Badge>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
          {!isGroup && (
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
          )}

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

          {opponent && !isGroup && (
            <Button
              variant="subtle"
              color="red"
              size="xs"
              radius="xl"
              leftSection={<IconFlag size={14} />}
              onClick={() => setShowReportModal(true)}
              style={{ alignSelf: "center", marginTop: 4, opacity: 0.7 }}
            >
              {t("octagon.report.button", "Raqib ustidan shikoyat qilish")}
            </Button>
          )}
        </div>
      </div>

      {/* Report Modal */}
      <Modal
        opened={showReportModal}
        onClose={() => setShowReportModal(false)}
        title={t("octagon.report.title", "Raqib ustidan shikoyat qilish")}
        centered
        styles={{
          content: { background: "#111827", border: "1px solid #1f2937", borderRadius: 16, color: "#f8fafc" },
          header: { background: "#111827", color: "#f8fafc" },
        }}
      >
        {reportSent ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <IconCheck size={48} color="#10b981" style={{ margin: "0 auto 12px" }} />
            <Text fw={700} size="md" style={{ color: "#f8fafc" }}>
              {t("octagon.report.sentSuccess", "Shikoyatingiz qabul qilindi!")}
            </Text>
            <Text size="xs" style={{ color: "#94a3b8", marginTop: 4 }}>
              {t("octagon.report.sentDesc", "Moderatsiya xizmati o'yin yozuvini tekshirib chiqadi.")}
            </Text>
          </div>
        ) : (
          <Stack gap="md">
            <Text size="xs" style={{ color: "#94a3b8" }}>
              {t("octagon.report.desc", "Agar raqib qoidabuzarlik qilgan bo'lsa yoki shubhali harakat sezgan bo'lsangiz, sababini tanlang:")}
            </Text>

            <Radio.Group value={reportReason} onChange={setReportReason}>
              <Stack gap="xs">
                <Radio value="CHEATING" label={t("octagon.report.reasonCheating", "Shubhali harakat / Aldash / Bot")} />
                <Radio value="AFK" label={t("octagon.report.reasonAfk", "O'yin davomida harakatsiz qoldi / AFK")} />
                <Radio value="INAPPROPRIATE_BEHAVIOR" label={t("octagon.report.reasonBehavior", "Nomaqbul harakat yoki spam")} />
                <Radio value="OTHER" label={t("octagon.report.reasonOther", "Boshqa sabab")} />
              </Stack>
            </Radio.Group>

            <Textarea
              placeholder={t("octagon.report.commentPlaceholder", "Qo'shimcha izoh (ixtiyoriy)...")}
              value={reportComment}
              onChange={(e) => setReportComment(e.currentTarget.value)}
              minRows={2}
              maxRows={4}
              styles={{
                input: { background: "#0b0f19", borderColor: "#1f2937", color: "#f8fafc" },
              }}
            />

            <Group justify="flex-end" mt="sm">
              <Button variant="default" onClick={() => setShowReportModal(false)} size="sm">
                {t("octagon.common.cancel", "Bekor qilish")}
              </Button>
              <Button
                color="red"
                onClick={handleSubmitReport}
                loading={isSubmittingReport}
                size="sm"
              >
                {t("octagon.report.submit", "Yuborish")}
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </div>
  );
};
