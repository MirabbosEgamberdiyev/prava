import { useState, useEffect } from "react";
import { Paper, Group, Stack, Text, Box, Badge, ActionIcon } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBulb,
  IconBatteryCharging,
} from "@tabler/icons-react";
import type { VehicleTelemetry } from "../types";
import { useLanguage } from "../../../context/LanguageContext";
import { useTranslation } from "react-i18next";

interface Props {
  telemetry: VehicleTelemetry;
  compact?: boolean;
  onHandbrakeToggle?: () => void;
  onSeatbeltToggle?: () => void;
  onLightsToggle?: () => void;
  onTurnSignalToggle?: (sig: "left" | "right" | "hazard") => void;
}

export default function InstrumentCluster({
  telemetry,
  compact,
  onHandbrakeToggle,
  onSeatbeltToggle,
  onLightsToggle,
  onTurnSignalToggle,
}: Props) {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const isSmallScreen = useMediaQuery("(max-width: 560px)");

  // Blinker timer for turn signals and hazards
  const [blinkState, setBlinkState] = useState<boolean>(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setBlinkState((prev) => !prev);
    }, 450);
    return () => clearInterval(interval);
  }, []);

  const isLeftTurnBlinking =
    (telemetry.turnSignal === "left" || telemetry.turnSignal === "hazard") && blinkState;
  const isRightTurnBlinking =
    (telemetry.turnSignal === "right" || telemetry.turnSignal === "hazard") && blinkState;

  // Tachometer needle angle calculation: 0 RPM = -120deg, 8000 RPM = +120deg (240 deg sweep)
  const rpmClamped = Math.min(8000, Math.max(0, telemetry.rpm));
  const tachometerAngle = -120 + (rpmClamped / 8000) * 240;

  // Responsive Compact HUD for small mobile screens (<= 560px)
  if (compact || isSmallScreen) {
    return (
      <Paper
        radius="lg"
        withBorder
        style={{
          pointerEvents: "auto",
          backgroundColor: "rgba(11, 19, 43, 0.94)",
          backdropFilter: "blur(12px)",
          borderColor: "rgba(255, 255, 255, 0.16)",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
          padding: "4px 8px",
          userSelect: "none",
          maxWidth: "260px",
          width: "100%",
          margin: "0 auto",
        }}
      >
        <Group justify="space-between" align="center" gap={4} wrap="nowrap">
          {/* Left Blinker */}
          <ActionIcon
            size="xs"
            variant="transparent"
            color={isLeftTurnBlinking ? "green" : "gray"}
            onClick={() => onTurnSignalToggle?.("left")}
            aria-label={t("simulator.turnLeft", "Chap burilish")}
          >
            <IconArrowLeft size={13} />
          </ActionIcon>

          {/* Speed & Gear Badge */}
          <Group gap={4} align="baseline" wrap="nowrap">
            <Text fw={900} size="sm" c="white" style={{ fontFamily: "monospace", letterSpacing: "-0.5px" }}>
              {Math.round(telemetry.speed)}
            </Text>
            <Text size="8px" fw={700} c="#94a3b8">
              KM/H
            </Text>
            <Badge size="xs" variant="filled" color={telemetry.gear === "R" ? "orange" : telemetry.gear === "P" ? "red" : "blue"}>
              {telemetry.gear}
            </Badge>
          </Group>

          {/* Warnings Mini Icons */}
          <Group gap={3} wrap="nowrap">
            <ActionIcon
              size="xs"
              variant="transparent"
              color={telemetry.seatbeltFastened ? "gray" : "red"}
              onClick={onSeatbeltToggle}
              title={t("simulator.seatbelt", "Xavfsizlik kamari")}
              aria-label={t("simulator.seatbelt", "Xavfsizlik kamari")}
            >
              <Text size="9px" fw={800} c={telemetry.seatbeltFastened ? "#64748b" : "#ef4444"}>
                B
              </Text>
            </ActionIcon>
            <ActionIcon
              size="xs"
              variant="transparent"
              color={telemetry.lowBeamsOn ? "green" : "gray"}
              onClick={onLightsToggle}
              title={t("simulator.headlights", "Chiroqlar")}
              aria-label={t("simulator.headlights", "Chiroqlar")}
            >
              <IconBulb size={12} />
            </ActionIcon>
            <ActionIcon
              size="xs"
              variant="transparent"
              color={telemetry.handbrake ? "red" : "gray"}
              onClick={onHandbrakeToggle}
              title={t("simulator.handbrake", "Qo'l tormozi")}
              aria-label={t("simulator.handbrake", "Qo'l tormozi")}
            >
              <Text size="8px" fw={800} c={telemetry.handbrake ? "#ef4444" : "#64748b"}>
                (P)
              </Text>
            </ActionIcon>
          </Group>

          {/* Right Blinker */}
          <ActionIcon
            size="xs"
            variant="transparent"
            color={isRightTurnBlinking ? "green" : "gray"}
            onClick={() => onTurnSignalToggle?.("right")}
            aria-label={t("simulator.turnRight", "O'ng burilish")}
          >
            <IconArrowRight size={13} />
          </ActionIcon>
        </Group>

        {/* Mini RPM bar */}
        <Box mt={2} style={{ height: "3px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
          <Box
            style={{
              width: `${Math.min(100, (telemetry.rpm / 7000) * 100)}%`,
              height: "100%",
              background: telemetry.rpm > 5500 ? "#ef4444" : telemetry.rpm > 3500 ? "#eab308" : "#38bdf8",
              transition: "width 0.1s ease",
            }}
          />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      radius="xl"
      withBorder
      style={{
        pointerEvents: "auto",
        backgroundColor: "rgba(11, 19, 43, 0.92)",
        backdropFilter: "blur(14px)",
        borderColor: "rgba(255, 255, 255, 0.16)",
        boxShadow: "0 12px 40px rgba(0, 0, 0, 0.65), 0 0 20px rgba(56, 189, 248, 0.1)",
        padding: "8px 18px",
        userSelect: "none",
        maxWidth: "480px",
        margin: "0 auto",
      }}
    >
      <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
        {/* ========================================================= */}
        {/* 1. LEFT DIAL: TACHOMETER (RPM x 1000)                     */}
        {/* ========================================================= */}
        <Box
          style={{
            position: "relative",
            width: "95px",
            height: "95px",
            flexShrink: 0,
          }}
        >
          <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%" }}>
            {/* Outer bezel */}
            <circle cx="60" cy="60" r="56" fill="#0f172a" stroke="#334155" strokeWidth="2.5" />
            <circle cx="60" cy="60" r="50" fill="#090d16" />

            {/* Tachometer background arc (0 to 6000 RPM) */}
            <path
              d="M 22 88 A 46 46 0 1 1 98 88"
              fill="none"
              stroke="#1e293b"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Redline arc (6000 to 8000 RPM) */}
            <path
              d="M 86 36 A 46 46 0 0 1 98 88"
              fill="none"
              stroke="#ef4444"
              strokeWidth="5"
              strokeLinecap="round"
            />

            {/* Scale numbers: 0, 1, 2, 3, 4, 5, 6, 7, 8 */}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((val) => {
              const ang = -120 + (val / 8) * 240;
              const rad = ((ang - 90) * Math.PI) / 180;
              const x = 60 + 38 * Math.cos(rad);
              const y = 60 + 38 * Math.sin(rad);
              const isRed = val >= 6;
              return (
                <text
                  key={val}
                  x={x}
                  y={y + 3}
                  fontSize="7.5"
                  fontWeight="bold"
                  fill={isRed ? "#ef4444" : "#94a3b8"}
                  textAnchor="middle"
                >
                  {val}
                </text>
              );
            })}

            <text x="60" y="48" fontSize="6" fill="#64748b" textAnchor="middle" fontWeight="600">
              x1000 rpm
            </text>

            {/* Center Digital RPM Value */}
            <text
              x="60"
              y="74"
              fontSize="8.5"
              fontWeight="bold"
              fill="#38bdf8"
              textAnchor="middle"
              style={{ fontFamily: "monospace" }}
            >
              {Math.round(rpmClamped)}
            </text>

            <circle cx="60" cy="60" r="4.5" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.5" />

            {/* Tachometer Needle */}
            <g
              transform={`rotate(${tachometerAngle}, 60, 60)`}
              style={{ transition: "transform 0.08s linear" }}
            >
              <line x1="60" y1="60" x2="60" y2="18" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" />
              <circle cx="60" cy="18" r="1.2" fill="#ffffff" />
            </g>
          </svg>
        </Box>

        {/* ========================================================= */}
        {/* 2. CENTER CLUSTER: SPEEDOMETER, GEAR & STATUS INDICATORS  */}
        {/* ========================================================= */}
        <Stack gap={2} align="center" style={{ flex: 1 }}>
          {/* Big Digital Speedometer */}
          <Text
            fw={900}
            c="white"
            style={{
              fontSize: "36px",
              lineHeight: 1,
              fontFamily: "'Segoe UI', Roboto, monospace",
              letterSpacing: "-1px",
              textShadow: "0 0 16px rgba(56, 189, 248, 0.6)",
            }}
          >
            {Math.round(telemetry.speed)}
          </Text>
          <Text size="9px" fw={700} c="#94a3b8" style={{ textTransform: "uppercase" }}>
            {lang === "ru" ? "км/ч" : lang === "uzc" ? "км/соат" : "km/soat"}
          </Text>

          {/* Active Gear Highlight & Manual Clutch Bar */}
          <Group gap={4} align="center">
            <Text
              size="lg"
              fw={900}
              c="#38bdf8"
              style={{
                fontFamily: "monospace",
                textShadow: "0 0 12px #38bdf8",
                lineHeight: 1.1,
              }}
            >
              {telemetry.transmissionMode === "manual" ? (telemetry.manualGear || "N") : telemetry.gear}
            </Text>
            {telemetry.transmissionMode === "manual" && (
              <Badge size="xs" color="cyan" variant="outline" p={2} style={{ fontSize: 8 }}>
                MANUAL
              </Badge>
            )}
          </Group>

          {/* Clutch Engagement Bar (if manual) */}
          {telemetry.transmissionMode === "manual" && telemetry.clutch !== undefined && (
            <Box style={{ width: 48, height: 3, backgroundColor: "#1e293b", borderRadius: 2, overflow: "hidden" }}>
              <Box
                style={{
                  width: `${Math.round(telemetry.clutch * 100)}%`,
                  height: "100%",
                  backgroundColor: "#38bdf8",
                }}
              />
            </Box>
          )}

          {/* Engine Stalled Warning Banner */}
          {telemetry.isStalled && (
            <Badge color="red" variant="filled" size="xs">
              {lang === "ru" ? "ЗАГЛОХ!" : lang === "uzc" ? "ЎЧДИ!" : "O'CHDI!"}
            </Badge>
          )}

          {/* Tell-Tale Warning & Signal Icons Strip matching screenshot */}
          <Group gap={8} align="center" mt={2}>
            {/* Left Turn Indicator */}
            <Box style={{ cursor: "pointer" }} onClick={() => onTurnSignalToggle?.("left")}>
              <IconArrowLeft
                size={16}
                color={isLeftTurnBlinking ? "#22c55e" : "#334155"}
                style={{ filter: isLeftTurnBlinking ? "drop-shadow(0 0 6px #22c55e)" : "none" }}
              />
            </Box>

            {/* Headlights */}
            <Box style={{ cursor: "pointer" }} onClick={onLightsToggle}>
              <IconBulb
                size={15}
                color={telemetry.lowBeamsOn ? "#22c55e" : "#334155"}
                style={{ filter: telemetry.lowBeamsOn ? "drop-shadow(0 0 6px #22c55e)" : "none" }}
              />
            </Box>

            {/* Battery / Engine Icon */}
            <IconBatteryCharging size={15} color={telemetry.isStalled ? "#ef4444" : "#22c55e"} />

            {/* Seatbelt Icon */}
            <Box style={{ cursor: "pointer" }} onClick={onSeatbeltToggle}>
              <Text
                size="10px"
                fw={800}
                c={!telemetry.seatbeltFastened ? "#ef4444" : "#22c55e"}
                style={{
                  fontFamily: "monospace",
                  filter: !telemetry.seatbeltFastened ? "drop-shadow(0 0 6px #ef4444)" : "none",
                }}
              >
                BELT
              </Text>
            </Box>

            {/* Handbrake Icon */}
            <Box style={{ cursor: "pointer" }} onClick={onHandbrakeToggle}>
              <Text
                size="10px"
                fw={800}
                c={telemetry.handbrake ? "#ef4444" : "#334155"}
                style={{
                  fontFamily: "monospace",
                  filter: telemetry.handbrake ? "drop-shadow(0 0 6px #ef4444)" : "none",
                }}
              >
                (P)
              </Text>
            </Box>

            {/* Right Turn Indicator */}
            <Box style={{ cursor: "pointer" }} onClick={() => onTurnSignalToggle?.("right")}>
              <IconArrowRight
                size={16}
                color={isRightTurnBlinking ? "#22c55e" : "#334155"}
                style={{ filter: isRightTurnBlinking ? "drop-shadow(0 0 6px #22c55e)" : "none" }}
              />
            </Box>
          </Group>
        </Stack>

        {/* ========================================================= */}
        {/* 3. RIGHT DIAL: FUEL & ENGINE TEMPERATURE                   */}
        {/* ========================================================= */}
        <Box
          style={{
            position: "relative",
            width: "95px",
            height: "95px",
            flexShrink: 0,
          }}
        >
          <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%" }}>
            <circle cx="60" cy="60" r="56" fill="#0f172a" stroke="#334155" strokeWidth="2.5" />
            <circle cx="60" cy="60" r="50" fill="#090d16" />

            {/* Top Half: Fuel Gauge (E to F) */}
            <path d="M 26 50 A 42 42 0 0 1 94 50" fill="none" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
            <path d="M 26 50 A 42 42 0 0 1 80 25" fill="none" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" />
            <text x="22" y="58" fontSize="7" fontWeight="bold" fill="#ef4444">E</text>
            <text x="96" y="58" fontSize="7" fontWeight="bold" fill="#38bdf8">F</text>
            <text x="60" y="38" fontSize="6.5" fill="#94a3b8" textAnchor="middle">FUEL</text>

            {/* Bottom Half: Coolant Temperature (C to H) */}
            <path d="M 26 70 A 42 42 0 0 0 94 70" fill="none" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
            <path d="M 26 70 A 42 42 0 0 0 64 102" fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" />
            <text x="22" y="70" fontSize="7" fontWeight="bold" fill="#38bdf8">C</text>
            <text x="96" y="70" fontSize="7" fontWeight="bold" fill="#ef4444">H</text>
            <text x="60" y="88" fontSize="6.5" fill="#94a3b8" textAnchor="middle">TEMP</text>
          </svg>
        </Box>
      </Group>
    </Paper>
  );
}
