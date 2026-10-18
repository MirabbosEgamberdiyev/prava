import React, { useEffect, useCallback } from "react";
import { Avatar, Badge, Text } from "@mantine/core";
import { IconFlame, IconClock, IconBolt } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { MatchOpponent, OctagonQuestion, OpponentProgress, FlyingEmoji, OctagonState, QuestionOptionItem } from "../types";

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

  // Keyboard hotkeys: 1, 2, 3, 4 and A, B, C, D
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
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center select-none">
        <div className="mb-6 flex items-center justify-center gap-8">
          {/* Me */}
          <div className="flex flex-col items-center">
            <Avatar size="xl" radius="xl" color="blue" className="border-4 border-blue-500 shadow-xl">
              {myName ? myName.charAt(0).toUpperCase() : "U"}
            </Avatar>
            <Text fw={800} size="md" className="mt-2 text-white">
              {myName}
            </Text>
            {getRankBadge(myRank)}
          </div>

          <div className="text-3xl font-black text-amber-400 animate-pulse">VS</div>

          {/* Opponent */}
          <div className="flex flex-col items-center">
            <Avatar size="xl" radius="xl" color="red" className="border-4 border-red-500 shadow-xl">
              {opponent?.avatar ? (
                <img src={opponent.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                opponent?.name?.charAt(0).toUpperCase() || "R"
              )}
            </Avatar>
            <Text fw={800} size="md" className="mt-2 text-white">
              {opponent?.name || t("octagon.arena.opponent", "Raqib")}
            </Text>
            {getRankBadge(opponent?.rank)}
          </div>
        </div>

        {state === "MATCH_FOUND" ? (
          <div className="mt-8 flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
            <Text size="lg" fw={800} className="text-emerald-400">
              {t("octagon.arena.preloadingTitle", "Raqib topildi!")}
            </Text>
            <Text size="sm" c="dimmed" className="mt-1">
              {t("octagon.arena.preloadingDesc", "Savollar va rasmlar oldindan yuklanmoqda (8 soniya)...")}
            </Text>
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center">
            <div className="w-28 h-28 rounded-full bg-amber-500/20 border-4 border-amber-400 flex items-center justify-center shadow-2xl animate-ping">
              <span className="text-5xl font-black text-amber-300">{countdown > 0 ? countdown : "JANG!"}</span>
            </div>
            <Text size="sm" fw={700} c="dimmed" className="mt-4">
              {t("octagon.arena.countdownDesc", "Diqqat qiling, jang hoziroq boshlanadi!")}
            </Text>
          </div>
        )}
      </div>
    );
  }

  const isLowTime = remainingTimeSec <= 5;

  return (
    <div className="relative max-w-4xl mx-auto px-4 py-4 select-none">
      {/* Flying Emojis Layer */}
      {flyingEmojis.map((item) => (
        <div
          key={item.id}
          className={`octagon-flying-emoji ${item.isMine ? "animate-fly-left" : "animate-fly-right"}`}
          style={{
            position: "fixed",
            left: item.isMine ? "30%" : "70%",
            bottom: "20%",
            pointerEvents: "none",
            zIndex: 9999,
          }}
        >
          {item.emoji}
        </div>
      ))}

      {/* Top Match HUD Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md mb-4">
        <div className="flex items-center justify-between">
          {/* Me */}
          <div className="flex items-center gap-3">
            <Avatar size="md" radius="xl" color="blue" className="border-2 border-blue-400">
              {myName ? myName.charAt(0).toUpperCase() : "U"}
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <Text size="sm" fw={800} className="text-white">
                  {myName}
                </Text>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                  {t("octagon.arena.you", "Siz")}
                </span>
              </div>
              <div className="text-xs text-blue-400 font-extrabold flex items-center gap-1">
                <IconFlame size={14} /> {myScore} {t("octagon.arena.points", "ball")}
              </div>
            </div>
          </div>

          {/* Central Timer & Score */}
          <div className="flex flex-col items-center">
            <div
              className={`flex items-center gap-1 px-3 py-1 rounded-full font-mono font-black text-sm transition-colors ${
                isLowTime
                  ? "bg-red-500/30 text-red-400 border border-red-500 animate-pulse"
                  : "bg-slate-800 text-amber-300 border border-slate-700"
              }`}
            >
              <IconClock size={16} />
              <span>{remainingTimeSec}s</span>
            </div>
            <div className="text-lg font-black text-white mt-1">
              <span className="text-blue-400">{myScore}</span> : <span className="text-red-400">{oppProgress.correctCount}</span>
            </div>
          </div>

          {/* Opponent */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="flex items-center justify-end gap-2">
                <Text size="sm" fw={800} className="text-white">
                  {opponent?.name || t("octagon.arena.opponent", "Raqib")}
                </Text>
                {getRankBadge(opponent?.rank)}
              </div>
              <div className="text-xs text-red-400 font-extrabold flex items-center justify-end gap-1">
                {oppProgress.correctCount} {t("octagon.arena.points", "ball")} <IconFlame size={14} />
              </div>
            </div>
            <Avatar size="md" radius="xl" color="red" className="border-2 border-red-400">
              {opponent?.avatar ? (
                <img src={opponent.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                opponent?.name?.charAt(0).toUpperCase() || "R"
              )}
            </Avatar>
          </div>
        </div>

        {/* 10-Dot Progress Trackers */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 flex-1">
            <Text size="xs" c="dimmed" className="mr-1 font-bold">
              {t("octagon.arena.you", "Siz")}:
            </Text>
            {Array.from({ length: totalQuestions }).map((_, idx) => {
              const isCurrent = idx === currentIndex;
              let dotBg = "bg-slate-700";
              if (idx < currentIndex) dotBg = "bg-blue-500";
              else if (isCurrent) dotBg = "bg-amber-400 animate-pulse";

              return <div key={`my-dot-${idx}`} className={`h-2 flex-1 rounded-full ${dotBg} transition-all`} />;
            })}
          </div>

          <div className="flex items-center gap-1 flex-1 justify-end">
            <Text size="xs" c="dimmed" className="mr-1 font-bold">
              {t("octagon.arena.opponent", "Raqib")}:
            </Text>
            {Array.from({ length: totalQuestions }).map((_, idx) => {
              const isOppAnswered = idx < oppProgress.answeredCount;
              const isOppCurrent = idx === oppProgress.questionIndex;
              let dotBg = "bg-slate-700";
              if (isOppAnswered) dotBg = "bg-red-500";
              else if (isOppCurrent) dotBg = "bg-red-400/50 animate-pulse";

              return <div key={`opp-dot-${idx}`} className={`h-2 flex-1 rounded-full ${dotBg} transition-all`} />;
            })}
          </div>
        </div>
      </div>

      {/* Main Question Arena */}
      {question ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <Badge color="blue" variant="filled" size="lg" radius="md">
              {t("octagon.arena.questionNumber", "Savol {{curr}} / {{total}}", {
                curr: currentIndex + 1,
                total: totalQuestions,
              })}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <IconBolt size={14} className="text-amber-400" />
              <span>{t("octagon.arena.hotkeyTip", "1-4 yoki A-D klavishlarini bosishingiz mumkin")}</span>
            </div>
          </div>

          {/* Question Text */}
          <Text size="lg" fw={700} className="text-white mb-6 leading-relaxed">
            {getQuestionText(question)}
          </Text>

          {/* Question Image (If available) */}
          {(question.imageUrl || question.image) && (
            <div className="relative mb-6 rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-950 flex items-center justify-center max-h-72">
              <img
                src={question.imageUrl || question.image}
                alt={t("octagon.arena.imageAlt", "Savol chizmasi")}
                className="max-h-72 w-auto object-contain select-none"
                loading="eager"
              />
            </div>
          )}

          {/* 4 Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {question.options.map((opt, optIdx) => {
              const isSelected = myAnswerIndex === optIdx;
              const isAnswered = myAnswerIndex !== undefined;

              return (
                <button
                  key={opt.id ?? opt.index ?? optIdx}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => onSubmitAnswer(question.id, optIdx)}
                  className={`group relative text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? "bg-blue-600/30 border-blue-500 shadow-lg shadow-blue-500/20"
                      : isAnswered
                      ? "bg-slate-800/40 border-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-slate-800/80 border-slate-700 hover:border-blue-400 hover:bg-slate-800 active:scale-[0.99]"
                  }`}
                >
                  {/* Hotkey Tag */}
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black shrink-0 transition-colors ${
                      isSelected
                        ? "bg-blue-500 text-white"
                        : "bg-slate-700 text-slate-300 group-hover:bg-blue-500/20 group-hover:text-blue-300"
                    }`}
                  >
                    {HOTKEY_LABELS[optIdx]}
                  </span>

                  <span className={`text-sm font-medium leading-relaxed ${isSelected ? "text-white font-bold" : "text-slate-200"}`}>
                    {getOptionText(opt)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="py-20 text-center">
          <Text c="dimmed">{t("octagon.arena.loadingQuestion", "Savol yuklanmoqda...")}</Text>
        </div>
      )}

      {/* Floating Emojis Toolbar */}
      <div className="mt-4 flex items-center justify-center gap-4">
        <div className="bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-full shadow-lg flex items-center gap-3 backdrop-blur-md">
          <Text size="xs" c="dimmed" fw={700} className="mr-1">
            {t("octagon.arena.reactions", "Reaksiyalar:")}
          </Text>
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji.id}
              type="button"
              onClick={() => onSendReaction(emoji.id)}
              className="text-2xl p-1.5 rounded-full hover:bg-slate-800 active:scale-125 transition-transform cursor-pointer"
              title={emoji.id}
            >
              {emoji.char}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
