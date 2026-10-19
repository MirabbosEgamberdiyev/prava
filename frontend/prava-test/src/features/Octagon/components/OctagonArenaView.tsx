import React, { useEffect, useCallback } from "react";
import { Badge, Text } from "@mantine/core";
import { IconFlame, IconClock, IconBolt } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { MatchOpponent, OctagonQuestion, OpponentProgress, FlyingEmoji, OctagonState, QuestionOptionItem } from "../types";
import "../octagon.css";

interface Props {
  state: OctagonState;
  countdown: number;
  remainingTimeSec: number;
  myScore: number;
  myName: string;
  myRank: string;
  opponent: MatchOpponent | null;
  oppProgress: OpponentProgress;
  question: OctagonQuestion | null;
  currentIndex: number;
  totalQuestions: number;
  myAnswerIndex?: number;
  flyingEmojis: FlyingEmoji[];
  onSubmitAnswer: (questionId: number, optionIndex: number) => void;
  onSendReaction: (emojiId: string) => void;
}

const HOTKEY_LABELS = ["A", "B", "C", "D"];
const REACTION_EMOJIS = [
  { id: "fire", char: "🔥" },
  { id: "thumbs", char: "👍" },
  { id: "shock", char: "😱" },
  { id: "laugh", char: "😂" },
];

export const OctagonArenaView: React.FC<Props> = ({
  state,
  countdown,
  remainingTimeSec,
  myScore,
  myName,
  myRank,
  opponent,
  oppProgress,
  question,
  currentIndex,
  totalQuestions,
  myAnswerIndex,
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

  const getRankBadge = (rank?: string) => {
    const r = rank?.toLowerCase();
    if (r === "brilliant") return <Badge color="violet" size="sm">{`💎 ${t("octagon.rank.brilliant", "Brilliant")}`}</Badge>;
    if (r === "gold") return <Badge color="yellow" size="sm">{`🥇 ${t("octagon.rank.gold", "Oltin")}`}</Badge>;
    if (r === "silver") return <Badge color="gray" size="sm">{`🥈 ${t("octagon.rank.silver", "Kumush")}`}</Badge>;
    return <Badge color="orange" size="sm">{`🥉 ${t("octagon.rank.bronze", "Bronza")}`}</Badge>;
  };

  // Preloading or Countdown Overlay
  if (state === "MATCH_FOUND" || state === "COUNTDOWN") {
    return (
      <div className="oct-page-wrapper" style={{ justifyContent: "center", alignItems: "center" }}>
        <div className="oct-ambient-glow" />
        <div className="oct-vs-screen">
          <div className="oct-vs-row">
            {/* Me */}
            <div className="oct-vs-user">
              <div className="oct-vs-avatar me">
                {myName ? myName.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="oct-vs-name">{myName}</div>
              {getRankBadge(myRank)}
            </div>

            <div className="oct-vs-badge">VS</div>

            {/* Opponent */}
            <div className="oct-vs-user">
              <div className="oct-vs-avatar opp">
                {opponent?.avatar ? (
                  <img src={opponent.avatar} alt="" />
                ) : (
                  opponent?.name?.charAt(0).toUpperCase() || "R"
                )}
              </div>
              <div className="oct-vs-name">{opponent?.name || t("octagon.arena.opponent", "Raqib")}</div>
              {getRankBadge(opponent?.rank)}
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
                <span className="oct-countdown-num">{countdown > 0 ? countdown : "JANG!"}</span>
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

  return (
    <div className="oct-page-wrapper">
      <div className="oct-ambient-glow" />

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
            <div className="oct-hud-avatar me">
              {myName ? myName.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="oct-hud-info">
              <div className="oct-hud-name-row">
                <span className="oct-hud-name">{myName}</span>
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
              <span>{remainingTimeSec}s</span>
            </div>
            <div className="oct-score-ratio">
              <span className="me">{myScore}</span> : <span className="opp">{oppProgress.correctCount}</span>
            </div>
          </div>

          {/* Opponent */}
          <div className="oct-hud-player opponent">
            <div className="oct-hud-avatar opp">
              {opponent?.avatar ? (
                <img src={opponent.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                opponent?.name?.charAt(0).toUpperCase() || "R"
              )}
            </div>
            <div className="oct-hud-info">
              <div className="oct-hud-name-row" style={{ justifyContent: "flex-end" }}>
                <span className="oct-hud-name">{opponent?.name || t("octagon.arena.opponent", "Raqib")}</span>
                {getRankBadge(opponent?.rank)}
              </div>
              <div className="oct-hud-score opp">
                {oppProgress.correctCount} {t("octagon.arena.points", "ball")} <IconFlame size={14} />
              </div>
            </div>
          </div>
        </div>

        {/* 10-Dot Progress Bars */}
        <div className="oct-hud-bars">
          <div className="oct-bars-group">
            <span className="oct-bars-label">{t("octagon.arena.you", "Siz")}:</span>
            {Array.from({ length: totalQuestions }).map((_, idx) => {
              const isCurrent = idx === currentIndex;
              let segClass = "";
              if (idx < currentIndex) segClass = "done-me";
              else if (isCurrent) segClass = "active";

              return <div key={`my-dot-${idx}`} className={`oct-bar-segment ${segClass}`} />;
            })}
          </div>

          <div className="oct-bars-group" style={{ justifyContent: "flex-end" }}>
            <span className="oct-bars-label">{t("octagon.arena.opponent", "Raqib")}:</span>
            {Array.from({ length: totalQuestions }).map((_, idx) => {
              const isOppAnswered = idx < oppProgress.answeredCount;
              const isOppCurrent = idx === oppProgress.questionIndex;
              let segClass = "";
              if (isOppAnswered) segClass = "done-opp";
              else if (isOppCurrent) segClass = "active";

              return <div key={`opp-dot-${idx}`} className={`oct-bar-segment ${segClass}`} />;
            })}
          </div>
        </div>
      </div>

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

          {/* Question Image */}
          <div className="oct-question-img-box">
            <img
              src={question.imageUrl || question.image || "/question-default.svg"}
              alt={t("octagon.arena.imageAlt", "Savol chizmasi")}
              className="oct-question-img"
              loading="eager"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes("question-default.svg")) {
                  target.src = "/question-default.svg";
                }
              }}
            />
          </div>

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
      <div className="oct-reactions-bar">
        <span style={{ fontSize: "12px", fontWeight: 800, color: "#94a3b8", marginRight: 4 }}>
          {t("octagon.arena.reactions", "Reaksiyalar:")}
        </span>
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji.id}
            type="button"
            onClick={() => onSendReaction(emoji.id)}
            className="oct-reaction-btn"
            title={emoji.id}
          >
            {emoji.char}
          </button>
        ))}
      </div>
    </div>
  );
};
