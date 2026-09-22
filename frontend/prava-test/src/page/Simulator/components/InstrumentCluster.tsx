import { useState, useEffect } from "react";
import { Paper, Group, Stack, Text, Box } from "@mantine/core";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBulb,
  IconBatteryCharging,
} from "@tabler/icons-react";
import type { VehicleTelemetry } from "../types";
import { useLanguage } from "../../../context/LanguageContext";

interface Props {
  telemetry: VehicleTelemetry;
  onHandbrakeToggle?: () => void;
  onSeatbeltToggle?: () => void;
  onLightsToggle?: () => void;
  onTurnSignalToggle?: (sig: "left" | "right" | "hazard") => void;
}

export default function InstrumentCluster({
  telemetry,
  onHandbrakeToggle,
  onSeatbeltToggle,
  onLightsToggle,
  onTurnSignalToggle,
}: Props) {
  const { lang } = useLanguage();

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
            {lang === "ru" ? "км/ч" : "km/soat"}
          </Text>

          {/* Active Gear Highlight */}
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
            {telemetry.gear}
          </Text>

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
            <IconBatteryCharging size={15} color="#22c55e" />

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
