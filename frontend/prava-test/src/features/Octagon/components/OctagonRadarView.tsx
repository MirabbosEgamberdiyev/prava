import React from "react";
import { Stack, Text, Group, Button } from "@mantine/core";
import { IconX, IconRadar, IconRobot } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

interface Props {
  searchSeconds: number;
  onCancel: () => void;
}

export const OctagonRadarView: React.FC<Props> = ({ searchSeconds, onCancel }) => {
  const { t } = useTranslation();

  const minutes = Math.floor(searchSeconds / 60);
  const seconds = searchSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const isBotThreshold = searchSeconds >= 20;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      {/* Radar Animation Area */}
      <div className="relative w-64 h-64 flex items-center justify-center mb-8">
        <div className="octagon-radar-pulse" style={{ animationDelay: "0s" }} />
        <div className="octagon-radar-pulse" style={{ animationDelay: "0.8s" }} />
        <div className="octagon-radar-pulse" style={{ animationDelay: "1.6s" }} />

        {/* Center glowing badge */}
        <div className="relative z-10 w-24 h-24 rounded-full bg-slate-900 border-2 border-emerald-500/50 flex flex-col items-center justify-center shadow-lg shadow-emerald-500/20">
          {isBotThreshold ? (
            <IconRobot size={36} className="text-emerald-400 animate-bounce" />
          ) : (
            <IconRadar size={36} className="text-emerald-400 animate-spin" style={{ animationDuration: "3s" }} />
          )}
          <span className="text-xs font-mono font-bold text-emerald-300 mt-1">{timeFormatted}</span>
        </div>
      </div>

      <Stack gap="xs" align="center" className="max-w-md">
        <Text size="xl" fw={900} className="text-white tracking-wide">
          {isBotThreshold
            ? t("octagon.radar.connectingBot", "Zaxira botga ulanmoqda...")
            : t("octagon.radar.searchingOpponent", "Teng kuchli raqib qidirilmoqda...")}
        </Text>
        <Text size="sm" c="dimmed">
          {isBotThreshold
            ? t("octagon.radar.botDesc", "Kutib qolmasligingiz uchun insondek o'ylanuvchi bot ulanmoqda")
            : t("octagon.radar.eloMatchDesc", "Sizning ELO reytingingizga mos raqib saralanmoqda")}
        </Text>

        <Group mt="lg">
          <Button
            variant="subtle"
            color="red"
            radius="xl"
            size="md"
            leftSection={<IconX size={18} />}
            onClick={onCancel}
          >
            {t("octagon.radar.cancel", "Qidiruvni bekor qilish")}
          </Button>
        </Group>
      </Stack>
    </div>
  );
};
