import React from "react";
import { Stack, Text, Button } from "@mantine/core";
import { IconX, IconRadar, IconRobot } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import "../octagon.css";

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
    <div className="oct-page-wrapper" style={{ justifyContent: "center", alignItems: "center" }}>
      <div className="oct-ambient-glow" />
      <div className="oct-console" style={{ alignItems: "center", textAlign: "center" }}>
        {/* Radar Animation Area */}
        <div className="oct-radar-box">
          <div className="oct-radar-wave" />
          <div className="oct-radar-wave" />
          <div className="oct-radar-wave" />

          {/* Center glowing badge */}
          <div className="oct-radar-center">
            {isBotThreshold ? (
              <IconRobot size={32} style={{ animation: "oct-bounce 1s infinite" }} />
            ) : (
              <IconRadar size={32} style={{ animation: "oct-spin 3s linear infinite" }} />
            )}
            <span style={{ fontSize: "12px", fontFamily: "monospace", fontWeight: 800, marginTop: "4px" }}>
              {timeFormatted}
            </span>
          </div>
        </div>

        <Stack gap="xs" align="center" style={{ maxWidth: 420 }}>
          <Text size="xl" fw={900} style={{ color: "#ffffff", letterSpacing: "0.5px" }}>
            {isBotThreshold
              ? t("octagon.radar.connectingBot", "Zaxira botga ulanmoqda...")
              : t("octagon.radar.searchingOpponent", "Teng kuchli raqib qidirilmoqda...")}
          </Text>
          <Text size="sm" style={{ color: "#94a3b8" }}>
            {isBotThreshold
              ? t("octagon.radar.botDesc", "Kutib qolmasligingiz uchun insondek o'ylanuvchi bot ulanmoqda")
              : t("octagon.radar.eloMatchDesc", "Sizning ELO reytingingizga mos raqib saralanmoqda")}
          </Text>

          <div style={{ marginTop: "24px" }}>
            <Button
              variant="subtle"
              color="red"
              radius="xl"
              size="md"
              leftSection={<IconX size={18} />}
              onClick={onCancel}
              style={{
                background: "rgba(239, 68, 68, 0.15)",
                color: "#f87171",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                fontWeight: 700,
              }}
            >
              {t("octagon.radar.cancel", "Qidiruvni bekor qilish")}
            </Button>
          </div>
        </Stack>
      </div>
    </div>
  );
};
