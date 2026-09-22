import { useState, useEffect } from "react";
import { Paper, Group, Stack, Text, Badge, Box, Progress } from "@mantine/core";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconArrowRight,
  IconBulb,
} from "@tabler/icons-react";
import type { VehicleTelemetry, GearMode } from "../types";
import { useLanguage } from "../../../context/LanguageContext";

interface Props {
  telemetry: VehicleTelemetry;
  onGearSelect?: (gear: GearMode) => void;
  onHandbrakeToggle?: () => void;
  onSeatbeltToggle?: () => void;
  onLightsToggle?: () => void;
  onTurnSignalToggle?: (sig: "left" | "right" | "hazard") => void;
}

export default function InstrumentCluster({
  telemetry,
  onGearSelect,
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

  const throttlePercent = Math.round(telemetry.throttle * 100);
  const brakePercent = Math.round(telemetry.brake * 100);

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
        padding: "10px 18px",
        userSelect: "none",
        maxWidth: "860px",
        margin: "0 auto",
      }}
    >
      <Group justify="space-between" align="center" wrap="nowrap" gap="md">
        {/* ========================================================= */}
        {/* 1. LEFT DIAL: TACHOMETER (RPM x 1000)                     */}
        {/* ========================================================= */}
        <Box
          style={{
            position: "relative",
            width: "115px",
            height: "115px",
            flexShrink: 0,
          }}
        >
          <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%" }}>
            {/* Outer metallic bezel */}
            <circle
              cx="60"
              cy="60"
              r="56"
              fill="#0f172a"
              stroke="#334155"
              strokeWidth="2.5"
            />
            {/* Inner background dial */}
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

            {/* Dial Labels */}
            <text
              x="60"
              y="48"
              fontSize="6"
              fill="#64748b"
              textAnchor="middle"
              fontWeight="600"
            >
              RPM x1000
            </text>

            {/* Center Digital RPM Value */}
            <text
              x="60"
              y="74"
              fontSize="9"
              fontWeight="bold"
              fill="#38bdf8"
              textAnchor="middle"
              style={{ fontFamily: "monospace" }}
            >
              {Math.round(rpmClamped)}
            </text>

            {/* Needle Pivot Center Pin */}
            <circle cx="60" cy="60" r="5" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.5" />

            {/* Tachometer Needle */}
            <g
              transform={`rotate(${tachometerAngle}, 60, 60)`}
              style={{ transition: "transform 0.08s linear" }}
            >
              {/* Needle shaft */}
              <line
                x1="60"
                y1="60"
                x2="60"
                y2="18"
                stroke="#ef4444"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <circle cx="60" cy="18" r="1.2" fill="#ffffff" />
            </g>
          </svg>
        </Box>

        {/* ========================================================= */}
        {/* 2. CENTER CLUSTER: SPEEDOMETER, PRND, PEDALS & WARNINGS    */}
        {/* ========================================================= */}
        <Stack gap={6} align="center" style={{ flex: 1 }}>
          {/* Top Row: Turn Signals and Tell-Tale Warning Icons */}
          <Group gap="sm" align="center">
            {/* Left Turn Indicator */}
            <Box
              style={{
                cursor: "pointer",
                transform: "scale(1.1)",
                transition: "all 0.15s ease",
              }}
              onClick={() => onTurnSignalToggle?.("left")}
            >
              <IconArrowLeft
                size={22}
                color={isLeftTurnBlinking ? "#22c55e" : "#1e293b"}
                style={{
                  filter: isLeftTurnBlinking ? "drop-shadow(0 0 6px #22c55e)" : "none",
                }}
              />
            </Box>

            {/* Seatbelt Warning Tell-Tale Icon */}
            <Box
              style={{
                cursor: "pointer",
                padding: "2px 6px",
                borderRadius: "6px",
                backgroundColor: !telemetry.seatbeltFastened
                  ? "rgba(239, 68, 68, 0.2)"
                  : "transparent",
              }}
              onClick={onSeatbeltToggle}
              title={
                telemetry.seatbeltFastened
                  ? "Xavfsizlik kamari taqilgan"
                  : "Xavfsizlik kamarini taqing (B)"
              }
            >
              <Text
                size="xs"
                fw={800}
                c={!telemetry.seatbeltFastened ? "#ef4444" : "#334155"}
                style={{
                  fontFamily: "monospace",
                  letterSpacing: "0.5px",
                  filter: !telemetry.seatbeltFastened
                    ? "drop-shadow(0 0 6px #ef4444)"
                    : "none",
                }}
              >
                BELT
              </Text>
            </Box>

            {/* Low-Beams Headlight Tell-Tale Icon */}
            <Box
              style={{
                cursor: "pointer",
                padding: "2px 6px",
                borderRadius: "6px",
                backgroundColor: telemetry.lowBeamsOn
                  ? "rgba(34, 197, 94, 0.2)"
                  : "transparent",
              }}
              onClick={onLightsToggle}
              title={
                telemetry.lowBeamsOn
                  ? "Yaqin chiroqlar yoqilgan (L)"
                  : "Chiroqlarni yoqing (L)"
              }
            >
              <IconBulb
                size={18}
                color={telemetry.lowBeamsOn ? "#22c55e" : "#334155"}
                style={{
                  filter: telemetry.lowBeamsOn ? "drop-shadow(0 0 6px #22c55e)" : "none",
                }}
              />
            </Box>

            {/* Handbrake (P) Tell-Tale Icon */}
            <Box
              style={{
                cursor: "pointer",
                padding: "2px 6px",
                borderRadius: "6px",
                backgroundColor: telemetry.handbrake
                  ? "rgba(239, 68, 68, 0.25)"
                  : "transparent",
              }}
              onClick={onHandbrakeToggle}
              title={
                telemetry.handbrake
                  ? "Qo'l tormozi tortilgan (Space)"
                  : "Qo'l tormozini tortish (Space)"
              }
            >
              <Text
                size="xs"
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

            {/* Hazard Warning Icon */}
            <Box
              style={{ cursor: "pointer" }}
              onClick={() => onTurnSignalToggle?.("hazard")}
              title="Avariya chiroqlari (H)"
            >
              <IconAlertTriangle
                size={18}
                color={
                  telemetry.turnSignal === "hazard" && blinkState ? "#f59e0b" : "#334155"
                }
              />
            </Box>

            {/* Right Turn Indicator */}
            <Box
              style={{
                cursor: "pointer",
                transform: "scale(1.1)",
                transition: "all 0.15s ease",
              }}
              onClick={() => onTurnSignalToggle?.("right")}
            >
              <IconArrowRight
                size={22}
                color={isRightTurnBlinking ? "#22c55e" : "#1e293b"}
                style={{
                  filter: isRightTurnBlinking ? "drop-shadow(0 0 6px #22c55e)" : "none",
                }}
              />
            </Box>
          </Group>

          {/* Large Digital Speedometer Display */}
          <Group gap={6} align="baseline">
            <Text
              fw={900}
              c="white"
              style={{
                fontSize: "42px",
                lineHeight: 1,
                fontFamily: "'Segoe UI', Roboto, monospace",
                letterSpacing: "-1px",
                textShadow: "0 0 16px rgba(56, 189, 248, 0.6)",
              }}
            >
              {Math.round(telemetry.speed)}
            </Text>
            <Text size="xs" fw={700} c="#94a3b8" style={{ textTransform: "uppercase" }}>
              {lang === "ru" ? "км/ч" : "km/soat"}
            </Text>
          </Group>

          {/* Automatic Gear Selector Strip (P - R - N - D) */}
          <Group
            gap={4}
            p={3}
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.85)",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            {(["P", "R", "N", "D"] as const).map((g) => {
              const isActive = telemetry.gear === g;
              return (
                <Box
                  key={g}
                  onClick={() => onGearSelect?.(g)}
                  style={{
                    cursor: "pointer",
                    padding: "3px 12px",
                    borderRadius: "6px",
                    backgroundColor: isActive ? "#0284c7" : "transparent",
                    color: isActive ? "#ffffff" : "#64748b",
                    fontWeight: 800,
                    fontSize: "13px",
                    fontFamily: "monospace",
                    boxShadow: isActive ? "0 0 12px rgba(2, 132, 199, 0.8)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {g}
                </Box>
              );
            })}
          </Group>

          {/* Dual Pedals Pressure Meters (Brake & Throttle) */}
          <Group gap="xs" style={{ width: "100%", maxWidth: "320px" }}>
            {/* Brake Pedal Bar */}
            <Box style={{ flex: 1 }}>
              <Group justify="space-between" mb={2}>
                <Text size="9px" c="#f87171" fw={700}>
                  {lang === "ru" ? "ТОРМОЗ (S)" : "TORMOZ (S)"}
                </Text>
                <Text size="9px" c="#f87171" fw={700} style={{ fontFamily: "monospace" }}>
                  {brakePercent}%
                </Text>
              </Group>
              <Progress
                value={brakePercent}
                color="red"
                size="sm"
                radius="xl"
                styles={{ root: { backgroundColor: "#1e293b" } }}
              />
            </Box>

            {/* Accelerator/Gas Pedal Bar */}
            <Box style={{ flex: 1 }}>
              <Group justify="space-between" mb={2}>
                <Text size="9px" c="#38bdf8" fw={700}>
                  {lang === "ru" ? "ГАЗ (W)" : "GAZ (W)"}
                </Text>
                <Text size="9px" c="#38bdf8" fw={700} style={{ fontFamily: "monospace" }}>
                  {throttlePercent}%
                </Text>
              </Group>
              <Progress
                value={throttlePercent}
                color="blue"
                size="sm"
                radius="xl"
                styles={{ root: { backgroundColor: "#1e293b" } }}
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
            width: "115px",
            height: "115px",
            flexShrink: 0,
          }}
        >
          <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%" }}>
            {/* Outer bezel */}
            <circle
              cx="60"
              cy="60"
              r="56"
              fill="#0f172a"
              stroke="#334155"
              strokeWidth="2.5"
            />
            <circle cx="60" cy="60" r="50" fill="#090d16" />

            {/* Top Half: Fuel Gauge (E to F) */}
            <path
              d="M 26 50 A 42 42 0 0 1 94 50"
              fill="none"
              stroke="#1e293b"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Fuel Active Arc */}
            <path
              d="M 26 50 A 42 42 0 0 1 80 25"
              fill="none"
              stroke="#0284c7"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <text x="22" y="58" fontSize="7" fontWeight="bold" fill="#ef4444">
              E
            </text>
            <text x="96" y="58" fontSize="7" fontWeight="bold" fill="#38bdf8">
              F
            </text>
            {/* Fuel Icon representation */}
            <text x="60" y="38" fontSize="7" fill="#94a3b8" textAnchor="middle">
              FUEL
            </text>

            {/* Bottom Half: Coolant Temperature (C to H) */}
            <path
              d="M 26 70 A 42 42 0 0 0 94 70"
              fill="none"
              stroke="#1e293b"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Temp Active Arc */}
            <path
              d="M 26 70 A 42 42 0 0 0 64 102"
              fill="none"
              stroke="#22c55e"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <text x="22" y="70" fontSize="7" fontWeight="bold" fill="#38bdf8">
              C
            </text>
            <text x="96" y="70" fontSize="7" fontWeight="bold" fill="#ef4444">
              H
            </text>
            <text x="60" y="88" fontSize="7" fill="#94a3b8" textAnchor="middle">
              TEMP
            </text>
          </svg>
        </Box>
      </Group>

      {/* Bottom Row: Controls Legend */}
      <Box
        mt={6}
        pt={4}
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          textAlign: "center",
        }}
      >
        <Group justify="center" gap={8} wrap="wrap">
          <Badge size="xs" variant="outline" color="gray">
            <Text span fw={700} c="blue">
              W/S
            </Text>{" "}
            {lang === "ru" ? "Газ / Тормоз" : "Gaz / Tormoz"}
          </Badge>
          <Badge size="xs" variant="outline" color="gray">
            <Text span fw={700} c="blue">
              A/D
            </Text>{" "}
            {lang === "ru" ? "Руль" : "Rul"}
          </Badge>
          <Badge size="xs" variant="outline" color="gray">
            <Text span fw={700} c="blue">
              Space
            </Text>{" "}
            {lang === "ru" ? "Ручник" : "Qo'l tormozi"}
          </Badge>
          <Badge size="xs" variant="outline" color="gray">
            <Text span fw={700} c="blue">
              B
            </Text>{" "}
            {lang === "ru" ? "Ремень" : "Kamar"}
          </Badge>
          <Badge size="xs" variant="outline" color="gray">
            <Text span fw={700} c="blue">
              L
            </Text>{" "}
            {lang === "ru" ? "Фары" : "Chiroq"}
          </Badge>
          <Badge size="xs" variant="outline" color="gray">
            <Text span fw={700} c="blue">
              Q/E
            </Text>{" "}
            {lang === "ru" ? "Поворотники" : "Burilish"}
          </Badge>
          <Badge size="xs" variant="outline" color="gray">
            <Text span fw={700} c="blue">
              C
            </Text>{" "}
            {lang === "ru" ? "Камера" : "Kamera"}
          </Badge>
        </Group>
      </Box>
    </Paper>
  );
}
