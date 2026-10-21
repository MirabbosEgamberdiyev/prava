import React, { useEffect, useCallback } from "react";
import { Badge, Text } from "@mantine/core";
import { IconFlame, IconClock, IconBolt, IconWifiOff } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { MatchOpponent, OctagonQuestion, OpponentProgress, FlyingEmoji, OctagonState, QuestionOptionItem } from "../types";
import { OctagonAvatar } from "./OctagonAvatar";
import { OctagonRankBadge } from "./OctagonRankBadge";
import { OctagonQuestionImage } from "./OctagonQuestionImage";
import { safeName } from "../rank";
import { formatClock, type TrackCell } from "../arena";
import "../octagon.css";

interface Props {
  state: OctagonState;
  countdown: number;
  remainingTimeSec: number;
  myScore: number;
  myName: string;
  myRank: string;
  myElo: number;
  myAvatar?: string | null;
  opponent: MatchOpponent | null;
  /** Tarmoq uzildi — 45 s ichida avtomatik qayta ulanish ketmoqda. */
  reconnecting?: boolean;
  /** 45 s grace'dan qolgan soniyalar (banner: "qolgan vaqt: 38s"). */
  reconnectLeftSec?: number | null;
  oppProgress: OpponentProgress;
  question: OctagonQuestion | null;
  currentIndex: number;
  totalQuestions: number;
  /** Men javob bergan savollar soni — hammasi tugasa "raqibni kutmoqdamiz" banneri. */
  myAnsweredCount?: number;
  myAnswerIndex?: number;
  /** Har bir savol bo'yicha mening natijam (yashil/qizil) va raqibniki. */
  myTrack?: TrackCell[];
  oppTrack?: TrackCell[];
  /** Spam filtri: reaksiyalar vaqtincha o'chiq. */
  reactionsMuted?: boolean;
  flyingEmojis: FlyingEmoji[];
  onSubmitAnswer: (questionId: number, optionIndex: number) => void;
  onSendReaction: (emojiId: string) => void;
}

const HOTKEY_LABELS = ["A", "B", "C", "D"];
// ID'lar serverdagi ruxsat etilgan ro'yxat bilan bir xil (avval "thumbs"/"shock" yuborilib, server ularni tashlab yuborardi)
const REACTION_EMOJIS = [
  { id: "fire", char: "🔥" },
  { id: "thumbs_up", char: "👍" },
  { id: "mindblown", char: "🤯" },
  { id: "laugh", char: "😂" },
];

export const OctagonArenaView: React.FC<Props> = ({
  state,
  countdown,
  remainingTimeSec,
  myScore,
  myName,
  myRank,
  myElo,
  myAvatar,
  opponent,
  reconnecting,
  reconnectLeftSec,
  oppProgress,
  question,
  currentIndex,
  totalQuestions,
  myAnsweredCount = 0,
  myAnswerIndex,
  myTrack = [],
  oppTrack = [],
  reactionsMuted = false,
  flyingEmojis,
  onSubmitAnswer,
  onSendReaction,
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "uzl";

  const getQuestionText = (q: OctagonQuestion) => {
    if (currentLang === "ru") return q.textRu || q.text || q.textUzl;
    if (currentLang === "uzc") return q.textUzc || q.text || q.textUzl;
    return q.textUzl || q.text || "";
  };

  const getOptionText = (opt: QuestionOptionItem) => {
    if (currentLang === "ru") return opt.textRu || opt.text || opt.textUzl;
    if (currentLang === "uzc") return opt.textUzc || opt.text || opt.textUzl;
    return opt.textUzl || opt.text || "";
  };

  // Keyboard hotkeys: 1-4 and A-D
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (state !== "PLAYING" || !question || myAnswerIndex !== undefined) return;

      const key = e.key.toUpperCase();
      let selectedOption: number | null = null;

      if (key === "1" || key === "A") selectedOption = 0;
      else if (key === "2" || key === "B") selectedOption = 1;
      else if (key === "3" || key === "C") selectedOption = 2;
      else if (key === "4" || key === "D") selectedOption = 3;

      if (selectedOption !== null && question.options[selectedOption]) {
        e.preventDefault();
        onSubmitAnswer(question.id, selectedOption);
      }
    },
    [state, question, myAnswerIndex, onSubmitAnswer]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const oppName = safeName(opponent?.name, t("octagon.arena.opponent"));
  const oppElo = opponent?.elo ?? opponent?.score ?? 0;
  const meName = safeName(myName, t("octagon.lobby.defaultUser"));

  const reconnectBanner = reconnecting ? (
    <div className="oct-reconnect-banner" role="status">
      <IconWifiOff size={16} />
      <span>
        {typeof reconnectLeftSec === "number"
          ? t("octagon.arena.reconnectingLeft", { sec: reconnectLeftSec })
          : t("octagon.arena.reconnecting")}
      </span>
    </div>
  ) : null;

  // Preloading or Countdown Overlay
  if (state === "MATCH_FOUND" || state === "COUNTDOWN") {
    return (
      <div className="oct-page-wrapper" style={{ justifyContent: "center", alignItems: "center" }}>
        <div className="oct-ambient-glow" />
        {reconnectBanner}
        <div className="oct-vs-screen">
          <div className="oct-vs-row">
            {/* Me */}
            <div className="oct-vs-user">
              <OctagonAvatar name={meName} src={myAvatar} size={84} ring="#3b82f6" />
              <div className="oct-vs-name">{meName}</div>
              <div className="oct-vs-elo">{myElo} ELO</div>
              <OctagonRankBadge rank={myRank} elo={myElo} />
            </div>

            <div className="oct-vs-badge">VS</div>

            {/* Opponent */}
            <div className="oct-vs-user">
              <OctagonAvatar name={oppName} src={opponent?.avatar} size={84} ring="#ef4444" />
              <div className="oct-vs-name">{oppName}</div>
              <div className="oct-vs-elo">{oppElo} ELO</div>
              <OctagonRankBadge rank={opponent?.rank} elo={oppElo} />
            </div>
          </div>

          {state === "MATCH_FOUND" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 24 }}>
              <div className="oct-spinner" />
              <Text size="lg" fw={800} style={{ color: "#34d399" }}>
                {t("octagon.arena.preloadingTitle", "Raqib topildi!")}
              </Text>
              <Text size="sm" style={{ color: "#94a3b8", marginTop: 4 }}>
                {t("octagon.arena.preloadingDesc", "Savollar va rasmlar oldindan yuklanmoqda (8 soniya)...")}
              </Text>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div className="oct-countdown-circle">
                <span className="oct-countdown-num">{countdown > 0 ? countdown : t("octagon.arena.fight")}</span>
              </div>
              <Text size="sm" fw={700} style={{ color: "#94a3b8", marginTop: 16 }}>
                {t("octagon.arena.countdownDesc", "Diqqat qiling, jang hoziroq boshlanadi!")}
              </Text>
            </div>
          )}
        </div>
      </div>
    );
  }

  const isLowTime = remainingTimeSec <= 5;

  // Raqib holati: nechanchi savolda, javob berdimi, hammasini tugatdimi (server "finished" yuboradi)
  const total = oppProgress.totalQuestions || totalQuestions;
  const oppFinished = oppProgress.finished ?? (total > 0 && oppProgress.answeredCount >= total);
  const iFinished = totalQuestions > 0 && myAnsweredCount >= totalQuestions;
  const oppStatusText = oppFinished
    ? t("octagon.arena.oppFinishedShort")
    : oppProgress.answeredCount === 0
    ? t("octagon.arena.oppThinking")
    : t("octagon.arena.oppOnQuestion", { n: Math.min(oppProgress.answeredCount + 1, total || 1) });

  return (
    <div className="oct-page-wrapper">
      <div className="oct-ambient-glow" />
      {reconnectBanner}

      {/* Flying Emojis */}
      {flyingEmojis.map((item) => (
        <div
          key={item.id}
          className="oct-flying-emoji"
          style={{
            left: item.isMine ? "35%" : "65%",
            bottom: "25%",
          }}
        >
          {item.emoji}
        </div>
      ))}

      {/* Top Match HUD Bar */}
      <div className="oct-arena-hud">
        <div className="oct-hud-main">
          {/* Me */}
          <div className="oct-hud-player">
            <OctagonAvatar name={meName} src={myAvatar} size={44} ring="#3b82f6" />
            <div className="oct-hud-info">
              <div className="oct-hud-name-row">
                <span className="oct-hud-name">{meName}</span>
                <span className="oct-hud-badge-you">{t("octagon.arena.you", "Siz")}</span>
              </div>
              <div className="oct-hud-score me">
                <IconFlame size={14} /> {myScore} {t("octagon.arena.points", "ball")}
              </div>
            </div>
          </div>

          {/* Center Timer & Score */}
          <div className="oct-hud-center">
            <div className={`oct-timer-pill ${isLowTime ? "urgent" : ""}`}>
              <IconClock size={16} />
              <span>{formatClock(remainingTimeSec)}</span>
            </div>
            <div className="oct-score-ratio">
              <span className="me">{myScore}</span> : <span className="opp">{oppProgress.correctCount}</span>
            </div>
          </div>

          {/* Opponent */}
          <div className="oct-hud-player opponent">
            <OctagonAvatar name={oppName} src={opponent?.avatar} size={44} ring="#ef4444" />
            <div className="oct-hud-info">
              <div className="oct-hud-name-row" style={{ justifyContent: "flex-end" }}>
                <span className="oct-hud-name">{oppName}</span>
                <OctagonRankBadge rank={opponent?.rank} elo={oppElo} size="xs" />
              </div>
              <div className="oct-hud-elo">{oppElo} ELO</div>
              <div className="oct-hud-score opp">
                {oppProgress.correctCount} {t("octagon.arena.points", "ball")} <IconFlame size={14} />
              </div>
              {/* key: har yangi javobda pulsatsiya qaytadan boshlanadi */}
              <div
                key={`opp-status-${oppProgress.answeredCount}-${oppFinished}`}
                className={`oct-opp-status ${oppFinished ? "finished" : oppProgress.answeredCount > 0 ? "pulse" : ""}`}
                role="status"
                aria-live="polite"
              >
                {!oppFinished && <span className="oct-opp-status-dot" />}
                {oppStatusText}
              </div>
            </div>
          </div>
        </div>

        {/* 10-Dot Progress Bars */}
        <div className="oct-hud-bars">
          <div className="oct-bars-group">
            <span className="oct-bars-label">{t("octagon.arena.you", "Siz")}:</span>
            {Array.from({ length: totalQuestions }).map((_, idx) => {
              // javob berilgan savol: yashil (to'g'ri) / qizil (xato); joriy savol oq nur bilan pulsatsiya qiladi
              const cell = myTrack[idx] ?? null;
              const segClass = cell ? `done ${cell}` : idx === currentIndex && !iFinished ? "active" : "";
              return <div key={`my-dot-${idx}`} className={`oct-bar-segment ${segClass}`} />;
            })}
          </div>

          <div className="oct-bars-group" style={{ justifyContent: "flex-end" }}>
            {oppFinished && (
              <span className="oct-opp-finish-flag" title={t("octagon.arena.oppFinishedShort")}>
                🏁
              </span>
            )}
            <span className="oct-bars-label">{t("octagon.arena.opponent", "Raqib")}:</span>
            {Array.from({ length: totalQuestions }).map((_, idx) => {
              const cell = oppTrack[idx] ?? (idx < oppProgress.answeredCount ? "answered" : null);
              const segClass = cell ? `done ${cell}` : idx === oppProgress.answeredCount && !oppFinished ? "active" : "";
              return <div key={`opp-dot-${idx}`} className={`oct-bar-segment ${segClass}`} />;
            })}
          </div>
        </div>
      </div>

      {oppFinished && !iFinished && (
        <div className="oct-finish-banner opp" role="status">
          <span className="oct-finish-banner-icon">🏁</span>
          <div>
            <div className="oct-finish-banner-title">{t("octagon.arena.oppFinishedTitle")}</div>
            <div className="oct-finish-banner-sub">{t("octagon.arena.oppFinishedSub")}</div>
          </div>
        </div>
      )}
      {iFinished && !oppFinished && (
        <div className="oct-finish-banner me" role="status">
          <span className="oct-finish-banner-icon">✅</span>
          <div>
            <div className="oct-finish-banner-title">{t("octagon.arena.meFinishedTitle")}</div>
            <div className="oct-finish-banner-sub">
              {t("octagon.arena.meFinishedSub", { done: oppProgress.answeredCount, total: total || totalQuestions })}
            </div>
          </div>
        </div>
      )}

      {/* Main Question Arena */}
      {question ? (
        <div className="oct-arena-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <Badge color="blue" variant="filled" size="lg" radius="md">
              {t("octagon.arena.questionNumber", "Savol {{curr}} / {{total}}", {
                curr: currentIndex + 1,
                total: totalQuestions,
              })}
            </Badge>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8" }}>
              <IconBolt size={14} style={{ color: "#fbbf24" }} />
              <span>{t("octagon.arena.hotkeyTip", "1-4 yoki A-D klavishlarini bosishingiz mumkin")}</span>
            </div>
          </div>

          {/* Question Text */}
          <Text size="lg" fw={700} style={{ color: "#ffffff", marginBottom: 16, lineHeight: 1.55 }}>
            {getQuestionText(question)}
          </Text>

          {/* Question Image — oldindan yuklangan; yuklanmasa placeholder + "Qayta yuklash" */}
          <OctagonQuestionImage path={question.imageUrl || question.image} questionId={question.id} />

          {/* 4 Options Grid */}
          <div className="oct-options-grid">
            {question.options.map((opt, optIdx) => {
              const isSelected = myAnswerIndex === optIdx;
              const isAnswered = myAnswerIndex !== undefined;

              return (
                <button
                  key={opt.id ?? opt.index ?? optIdx}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => onSubmitAnswer(question.id, optIdx)}
                  className={`oct-option-btn ${isSelected ? "selected" : ""}`}
                  style={{
                    opacity: isAnswered && !isSelected ? 0.45 : 1,
                    cursor: isAnswered ? "not-allowed" : "pointer",
                  }}
                >
                  <span className="oct-hotkey-badge">
                    {HOTKEY_LABELS[optIdx]}
                  </span>
                  <span style={{ fontSize: "14.5px", lineHeight: 1.4, flex: 1 }}>
                    {getOptionText(opt)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ padding: "60px 0", textAlign: "center" }}>
          <Text style={{ color: "#94a3b8" }}>{t("octagon.arena.loadingQuestion", "Savol yuklanmoqda...")}</Text>
        </div>
      )}

      {/* Floating Emojis Toolbar */}
      <div className={`oct-reactions-bar ${reactionsMuted ? "muted" : ""}`}>
        <span style={{ fontSize: "12px", fontWeight: 800, color: "#94a3b8", marginRight: 4 }}>
          {reactionsMuted ? t("octagon.arena.reactionsMuted") : t("octagon.arena.reactions", "Reaksiyalar:")}
        </span>
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji.id}
            type="button"
            disabled={reactionsMuted}
            onClick={() => onSendReaction(emoji.id)}
            className="oct-reaction-btn"
            aria-label={t(`octagon.arena.reaction_${emoji.id}`)}
            title={t(`octagon.arena.reaction_${emoji.id}`)}
          >
            {emoji.char}
          </button>
        ))}
      </div>
    </div>
  );
};
