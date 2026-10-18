import React, { useEffect } from "react";
import { Text, Stack, Group, Badge, Avatar, Button } from "@mantine/core";
import { IconTrophy, IconFlame, IconRefresh, IconArrowLeft, IconSwords } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { fireConfetti } from "../confetti";
import type { MatchResultData, MatchOpponent } from "../types";

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
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 max-w-xl mx-auto text-center select-none">
      {/* Result Status Banner */}
      <div className="mb-6 flex flex-col items-center">
        {isWin ? (
          <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-4 border-emerald-500 flex items-center justify-center mb-4 shadow-xl shadow-emerald-500/30">
            <IconTrophy size={48} className="text-emerald-400" />
          </div>
        ) : isDraw ? (
          <div className="w-24 h-24 rounded-full bg-amber-500/20 border-4 border-amber-500 flex items-center justify-center mb-4 shadow-xl shadow-amber-500/30">
            <IconSwords size={48} className="text-amber-400" />
          </div>
        ) : (
          <div className="w-24 h-24 rounded-full bg-red-500/20 border-4 border-red-500 flex items-center justify-center mb-4 shadow-xl shadow-red-500/30">
            <IconFlame size={48} className="text-red-400" />
          </div>
        )}

        <Text size="3xl" fw={900} className={`tracking-wider ${isWin ? "text-emerald-400" : isDraw ? "text-amber-400" : "text-red-400"}`}>
          {isWin
            ? t("octagon.result.victory", "G'ALABA!")
            : isDraw
            ? t("octagon.result.draw", "DURANG!")
            : t("octagon.result.defeat", "MAG'LUBIYAT")}
        </Text>

        <Text size="sm" c="dimmed" className="mt-1">
          {isWin
            ? t("octagon.result.winDesc", "Ajoyib g'alaba! Bilimlaringiz yuksak darajada.")
            : isDraw
            ? t("octagon.result.drawDesc", "Teng kurash! Ikkala tomon ham mahorat ko'rsatdi.")
            : t("octagon.result.loseDesc", "Tushkunlikka tushmang! Xatolarni o'rganing va qasos oling.")}
        </Text>
      </div>

      {/* Match Score HUD */}
      <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl mb-6">
        <div className="flex items-center justify-around">
          {/* My Stats */}
          <div className="flex flex-col items-center">
            <Avatar size="lg" radius="xl" color="blue" className="border-2 border-blue-400">
              {myName ? myName.charAt(0).toUpperCase() : "U"}
            </Avatar>
            <Text fw={800} size="sm" className="mt-2 text-white">
              {myName}
            </Text>
            <span className="text-3xl font-black text-blue-400 mt-1">
              {result?.finalScores?.me ?? 0}
            </span>
          </div>

          <div className="text-2xl font-black text-slate-500">:</div>

          {/* Opponent Stats */}
          <div className="flex flex-col items-center">
            <Avatar size="lg" radius="xl" color="red" className="border-2 border-red-400">
              {opponent?.avatar ? (
                <img src={opponent.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                opponent?.name?.charAt(0).toUpperCase() || "R"
              )}
            </Avatar>
            <Text fw={800} size="sm" className="mt-2 text-white">
              {opponent?.name || t("octagon.arena.opponent", "Raqib")}
            </Text>
            <span className="text-3xl font-black text-red-400 mt-1">
              {result?.finalScores?.opponent ?? 0}
            </span>
          </div>
        </div>

        {/* ELO Delta Badge */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-center gap-2">
          <Text size="sm" c="dimmed">
            {t("octagon.result.eloChange", "Reyting o'zgarishi:")}
          </Text>
          <Badge
            size="lg"
            radius="md"
            variant="filled"
            color={isPositive ? "teal" : deltaElo < 0 ? "red" : "gray"}
            className="font-black text-sm"
          >
            {isPositive ? `+${deltaElo}` : deltaElo} {t("octagon.arena.points", "ball")}
          </Badge>
        </div>
      </div>

      {/* Action Buttons */}
      <Stack gap="sm" className="w-full">
        <button
          type="button"
          disabled={revengeRequested}
          onClick={onRequestRevenge}
          className={`octagon-btn-duo-green w-full py-4 rounded-2xl text-white font-black text-base cursor-pointer transition-all ${
            revengeRequested ? "opacity-60 cursor-not-allowed" : ""
          }`}
          style={{
            background: revengeRequested ? "#4b5563" : "#22c55e",
            boxShadow: revengeRequested ? "none" : "0 4px 0 #15803d",
            border: "none",
          }}
        >
          <Group justify="center" gap="xs">
            <IconRefresh size={20} className={revengeRequested ? "animate-spin" : ""} />
            <span>
              {revengeRequested
                ? t("octagon.result.waitingRevenge", "Raqib javobi kutilmoqda...")
                : t("octagon.result.requestRevenge", "Qasos (Rematch) talab qilish")}
            </span>
          </Group>
        </button>

        <Button
          variant="subtle"
          color="gray"
          radius="xl"
          size="md"
          leftSection={<IconArrowLeft size={18} />}
          onClick={onReturnToLobby}
        >
          {t("octagon.result.backToLobby", "Lobbiyga qaytish")}
        </Button>
      </Stack>
    </div>
  );
};
