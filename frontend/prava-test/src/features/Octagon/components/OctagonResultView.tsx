import React, { useEffect, useState } from "react";
import { Text, Button, Modal, Radio, Textarea, Stack, Group, Loader } from "@mantine/core";
import {
  IconTrophy,
  IconHeartBroken,
  IconRefresh,
  IconArrowLeft,
  IconHeartHandshake,
  IconFlag,
  IconCheck,
  IconListCheck,
  IconSwords,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { fireConfetti } from "../confetti";
import { OctagonApi } from "../OctagonApi";
import type { MatchResultData, MatchOpponent, GroupStanding, OctagonQuestion, RematchState } from "../types";
import { OctagonAvatar } from "./OctagonAvatar";
import { OctagonRankBadge } from "./OctagonRankBadge";
import { OctagonReviewModal } from "./OctagonReviewModal";
import { safeName } from "../rank";
import { accuracyPercent, eloUnchangedReason, forfeitNote, formatDuration, type ForfeitNote } from "../arena";

const FORFEIT_KEYS: Record<ForfeitNote, string> = {
  selfLeft: "octagon.result.forfeitSelfLeft",
  selfTimeout: "octagon.result.forfeitSelfTimeout",
  oppLeft: "octagon.result.forfeitOppLeft",
  oppTimeout: "octagon.result.forfeitNote",
};
import { OCTAGON_CONFIG } from "../types";
import { showToast } from "../../../utils/notificationUtils";
import "../octagon.css";

interface Props {
  matchId?: string | null;
  result: MatchResultData | null;
  myName: string;
  myAvatar?: string | null;
  myUserId?: string;
  myElo?: number;
  opponent: MatchOpponent | null;
  /** Guruhli jang natijalari (bo'lsa — 1v1 kartasi o'rniga reyting jadvali). */
  standings?: GroupStanding[] | null;
  /** Jang savollari — "Jang tahlili" uchun matn va variantlar. */
  questions?: OctagonQuestion[];
  rematch: RematchState;
  onRequestRevenge: () => void;
  onReturnToLobby: () => void;
}

export const OctagonResultView: React.FC<Props> = ({
  matchId,
  result,
  myName,
  myAvatar,
  myUserId,
  myElo,
  opponent,
  standings,
  questions = [],
  rematch,
  onRequestRevenge,
  onReturnToLobby,
}) => {
  const { t } = useTranslation();
  const oppName = safeName(opponent?.name, t("octagon.arena.opponent"));
  const oppElo = opponent?.elo ?? opponent?.score ?? 0;
  const meName = safeName(myName, t("octagon.lobby.defaultUser"));
  const isGroup = Boolean(standings && standings.length > 0);
  const [showReview, setShowReview] = useState(false);
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
    if (isWin) fireConfetti();
  }, [isWin]);

  const tone = isWin ? "win" : isDraw ? "draw" : "lose";
  const deltaElo = result?.myDeltaElo ?? 0;
  const myCorrect = result?.finalScores?.me ?? 0;
  const totalQ = result?.totalQuestions || OCTAGON_CONFIG.QUESTIONS_PER_MATCH;
  const accuracy = accuracyPercent(myCorrect, totalQ);
  // Yangi ELO serverdan; eski = yangi − o'zgarish (server yubormasa — lobbidagi joriy qiymat)
  const newElo = typeof result?.myNewElo === "number" ? result.myNewElo : undefined;
  const oldElo = typeof newElo === "number" ? newElo - deltaElo : myElo;
  const unchanged = eloUnchangedReason(deltaElo, newElo, Boolean(isWin), Boolean(isDraw));
  const forfeitKind = result ? forfeitNote(result) : null;
  const review = result?.review ?? [];

  return (
    <div className="oct-page-wrapper" style={{ justifyContent: "center", alignItems: "center" }}>
      <div className="oct-ambient-glow" />

      <div className={`oct-result-container ${tone}`}>
        <div className={`oct-result-badge-icon ${tone}`}>
          {isWin ? <IconTrophy size={48} /> : isDraw ? <IconHeartHandshake size={48} /> : <IconHeartBroken size={48} />}
        </div>

        <div className={`oct-result-title ${tone}`}>
          {isWin ? t("octagon.result.victory") : isDraw ? t("octagon.result.draw") : t("octagon.result.defeat")}
        </div>
        <p className="oct-result-sub">
          {isWin ? t("octagon.result.winDesc") : isDraw ? t("octagon.result.drawDesc") : t("octagon.result.loseDesc")}
        </p>

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
          <>
            {/* Ikki o'yinchi: kartalar bir xil o'lcham va iyerarxiyada */}
            <div className="oct-result-players">
              <div className="oct-result-player me">
                <OctagonAvatar name={meName} src={myAvatar} size={60} ring="var(--oct-blue)" />
                <div className="oct-result-player-name">{meName}</div>
                <div className="oct-result-player-score">{result?.finalScores?.me ?? 0}</div>
              </div>
              <div className="oct-result-colon">:</div>
              <div className="oct-result-player opp">
                <OctagonAvatar name={oppName} src={opponent?.avatar} size={60} ring="var(--oct-red)" />
                <div className="oct-result-player-name">{oppName}</div>
                <div className="oct-result-player-meta">
                  <span>{oppElo} ELO</span>
                  <OctagonRankBadge rank={opponent?.rank} elo={oppElo} size="xs" />
                </div>
                <div className="oct-result-player-score">{result?.finalScores?.opponent ?? 0}</div>
              </div>
            </div>

            <div className="oct-result-stats">
              <div className="oct-result-stat">
                <span className="oct-result-stat-val">
                  {myCorrect}/{totalQ}
                </span>
                <span className="oct-result-stat-lbl">{t("octagon.result.correctLbl")}</span>
              </div>
              <div className="oct-result-stat">
                <span className={`oct-result-stat-val ${accuracy >= 70 ? "good" : accuracy >= 40 ? "mid" : "low"}`}>{accuracy}%</span>
                <span className="oct-result-stat-lbl">{t("octagon.result.accuracyLbl")}</span>
              </div>
              <div className="oct-result-stat">
                <span className="oct-result-stat-val">{typeof result?.myTimeSec === "number" ? formatDuration(result.myTimeSec) : "—"}</span>
                <span className="oct-result-stat-lbl">{t("octagon.result.timeLbl")}</span>
              </div>
            </div>

            <div className="oct-result-elo">
              <span className="oct-result-elo-lbl">ELO</span>
              <span className="oct-result-elo-flow">
                {typeof oldElo === "number" ? oldElo : "—"} <span aria-hidden="true">→</span>{" "}
                <strong>{typeof newElo === "number" ? newElo : "—"}</strong>
              </span>
              <span className={`oct-result-elo-delta ${deltaElo > 0 ? "up" : deltaElo < 0 ? "down" : "zero"}`}>
                {deltaElo > 0 ? `+${deltaElo}` : deltaElo}
              </span>
            </div>
            {unchanged === "floor" && <div className="oct-result-note">{t("octagon.result.eloFloor")}</div>}
            {forfeitKind && <div className="oct-forfeit-note">{t(FORFEIT_KEYS[forfeitKind])}</div>}
          </>
        )}

        {/* Amallar: revansh (raqib roziligi bilan), jang tahlili, lobbiga qaytish */}
        <div className="oct-result-actions">
          {!isGroup && rematch.status === "offered" && (
            <div className="oct-rematch-offer" role="alert">
              <IconSwords size={18} />
              <span>{t("octagon.result.rematchOffered", { name: oppName })}</span>
            </div>
          )}
          {!isGroup && (rematch.status === "unavailable" || rematch.status === "timeout") && (
            <div className="oct-rematch-info" role="status">
              {rematch.status === "timeout"
                ? t("octagon.result.rematchTimeout")
                : rematch.reason === "OPPONENT_BUSY"
                ? t("octagon.result.rematchBusy")
                : t("octagon.result.rematchOffline")}
            </div>
          )}
          {!isGroup && rematch.status !== "unavailable" && (
            <button
              type="button"
              disabled={rematch.status === "waiting"}
              onClick={onRequestRevenge}
              className={`oct-3d-btn green oct-result-cta ${rematch.status === "offered" ? "pulse" : ""}`}
            >
              {rematch.status === "waiting" ? <Loader size={18} color="white" /> : <IconRefresh size={20} />}
              <span>
                {rematch.status === "waiting"
                  ? t("octagon.result.waitingRevenge")
                  : rematch.status === "offered"
                  ? t("octagon.result.acceptRematch")
                  : rematch.status === "timeout"
                  ? t("octagon.result.askAgain")
                  : t("octagon.result.requestRevenge")}
              </span>
            </button>
          )}

          <div className="oct-result-secondary">
            {!isGroup && review.length > 0 && (
              <button type="button" className="oct-secondary-btn" onClick={() => setShowReview(true)}>
                <IconListCheck size={18} color="var(--oct-green)" />
                <span>{t("octagon.review.open")}</span>
              </button>
            )}
            <button type="button" className="oct-secondary-btn" onClick={onReturnToLobby}>
              <IconArrowLeft size={18} color="var(--oct-blue)" />
              <span>{t("octagon.result.backToLobby")}</span>
            </button>
          </div>

          {opponent && !isGroup && (
            <Button
              variant="subtle"
              color="red"
              size="xs"
              radius="xl"
              leftSection={<IconFlag size={14} />}
              onClick={() => setShowReportModal(true)}
              style={{ alignSelf: "center", marginTop: 4, minHeight: 44, opacity: 0.75 }}
            >
              {t("octagon.report.button", "Raqib ustidan shikoyat qilish")}
            </Button>
          )}
        </div>
      </div>

      <OctagonReviewModal opened={showReview} onClose={() => setShowReview(false)} review={review} questions={questions} />

      {/* Shikoyat */}
      <Modal
        opened={showReportModal}
        onClose={() => setShowReportModal(false)}
        closeButtonProps={{ "aria-label": t("common.close") }}
        title={t("octagon.report.title", "Raqib ustidan shikoyat qilish")}
        centered
        classNames={{ content: "oct-modal-dark", header: "oct-modal-dark-header", close: "oct-modal-dark-close" }}
      >
        {reportSent ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <IconCheck size={48} color="var(--oct-green)" style={{ margin: "0 auto 12px" }} />
            <Text fw={700} size="md" style={{ color: "var(--oct-text)" }}>
              {t("octagon.report.sentSuccess", "Shikoyatingiz qabul qilindi!")}
            </Text>
            <Text size="xs" style={{ color: "var(--oct-muted)", marginTop: 4 }}>
              {t("octagon.report.sentDesc", "Moderatsiya xizmati o'yin yozuvini tekshirib chiqadi.")}
            </Text>
          </div>
        ) : (
          <Stack gap="md">
            <Text size="xs" style={{ color: "var(--oct-muted)" }}>
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
              styles={{ input: { background: "#0b0f19", borderColor: "#1f2937", color: "var(--oct-text)" } }}
            />

            <Group justify="flex-end" mt="sm">
              <Button variant="default" onClick={() => setShowReportModal(false)} size="sm">
                {t("octagon.common.cancel", "Bekor qilish")}
              </Button>
              <Button color="red" onClick={handleSubmitReport} loading={isSubmittingReport} size="sm">
                {t("octagon.report.submit", "Yuborish")}
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </div>
  );
};
