import { Paper, Group, Text, Badge, ActionIcon, Tooltip, Box } from "@mantine/core";
import { IconCamera, IconVolume, IconVolumeOff, IconFocusCentered } from "@tabler/icons-react";
import type { VehicleTelemetry, ExerciseDefinition, CameraView } from "../types";
import { EXERCISE_REGISTRY } from "../registry/exerciseRegistry";
import { useLanguage } from "../../../context/LanguageContext";

interface Props {
  telemetry: VehicleTelemetry;
  currentExercise: ExerciseDefinition;
  cameraView: CameraView;
  soundEnabled: boolean;
  onCameraToggle: () => void;
  onSoundToggle: () => void;
}

export default function AutodromeMiniMap({
  telemetry,
  currentExercise,
  cameraView,
  soundEnabled,
  onCameraToggle,
  onSoundToggle,
}: Props) {
  const { lang } = useLanguage();

  // Heading angle in degrees for the player beacon
  const headingDeg = (telemetry.rotation * 180) / Math.PI;

  return (
    <Paper
      radius="md"
      withBorder
      style={{
        pointerEvents: "auto",
        backgroundColor: "rgba(15, 23, 42, 0.88)",
        backdropFilter: "blur(10px)",
        borderColor: "rgba(255, 255, 255, 0.18)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.45)",
        width: "240px",
        overflow: "hidden",
      }}
    >
      {/* Top Header Bar */}
      <Box
        px="xs"
        py={6}
        style={{
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          backgroundColor: "rgba(30, 41, 59, 0.6)",
        }}
      >
        <Group justify="space-between" align="center" wrap="nowrap">
          <Group gap={6} align="center">
            <IconFocusCentered size={14} color="#38bdf8" />
            <Text size="xs" fw={700} c="white" style={{ letterSpacing: "0.5px" }}>
              {lang === "ru" ? "АВТОДРОМ КАРТА" : "AVTODROM XARITASI"}
            </Text>
          </Group>

          <Group gap={4}>
            {/* Camera View Switcher */}
            <Tooltip
              label={
                cameraView === "chase"
                  ? lang === "ru"
                    ? "Вид сзади (3-е лицо)"
                    : "Orqa ko'rinish (3-shaxs)"
                  : cameraView === "first_person"
                  ? lang === "ru"
                    ? "Вид из кабины (1-е лицо)"
                    : "Kabina ko'rinishi (1-shaxs)"
                  : lang === "ru"
                  ? "Вид сверху"
                  : "Yuqoridan ko'rinish"
              }
            >
              <ActionIcon
                size="xs"
                variant="subtle"
                color="blue"
                onClick={onCameraToggle}
                aria-label="Camera view toggle"
              >
                <IconCamera size={13} />
              </ActionIcon>
            </Tooltip>

            {/* Sound Switcher */}
            <Tooltip label={soundEnabled ? (lang === "ru" ? "Без звука" : "Ovozsiz") : (lang === "ru" ? "Включить звук" : "Ovozni yoqish")}>
              <ActionIcon
                size="xs"
                variant="subtle"
                color={soundEnabled ? "blue" : "gray"}
                onClick={onSoundToggle}
                aria-label="Sound toggle"
              >
                {soundEnabled ? <IconVolume size={13} /> : <IconVolumeOff size={13} />}
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Box>

      {/* SVG Circuit Radar */}
      <Box style={{ position: "relative", width: "100%", height: "160px", padding: "4px" }}>
        <svg
          viewBox="0 0 600 500"
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            borderRadius: "4px",
            backgroundColor: "#0b1329",
          }}
        >
          {/* Grid lines background */}
          <defs>
            <pattern id="miniGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            </pattern>
            <filter id="beaconGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="trackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>

          <rect width="600" height="500" fill="url(#miniGrid)" />

          {/* Autodrome Outer Boundary Walls */}
          <rect
            x="20"
            y="20"
            width="560"
            height="460"
            rx="16"
            fill="none"
            stroke="#334155"
            strokeWidth="3"
            strokeDasharray="6 4"
          />

          {/* Autodrome Road Track Ribbon */}
          {/* Main Loop: START -> PEDESTRIAN -> ESTAKADA -> CORRIDOR -> SLALOM -> INTERSECTION -> GARAGE -> RAILWAY -> ACCEL -> EMERGENCY -> PARALLEL -> FINISH */}
          <path
            d="M 50,440 L 360,440 L 370,440 L 370,380 L 430,380 L 430,340 L 520,210 L 520,85 L 180,85 L 180,120 L 120,200 L 110,210 L 110,280 L 70,340 L 70,440 Z"
            fill="none"
            stroke="#1e293b"
            strokeWidth="34"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Asphalt Surface */}
          <path
            d="M 50,440 L 360,440 L 370,440 L 370,380 L 430,380 L 430,340 L 520,210 L 520,85 L 180,85 L 180,120 L 120,200 L 110,210 L 110,280 L 70,340 L 70,440 Z"
            fill="none"
            stroke="#334155"
            strokeWidth="28"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Track Centerline (Dashed Yellow) */}
          <path
            d="M 50,440 L 360,440 L 370,440 L 370,380 L 430,380 L 430,340 L 520,210 L 520,85 L 180,85 L 180,120 L 120,200 L 110,210 L 110,280 L 70,340 L 70,440 Z"
            fill="none"
            stroke="#eab308"
            strokeWidth="2"
            strokeDasharray="8 6"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Exercise Specific Zones */}
          {/* #3 Estakada Ramp Highlight */}
          <rect x="250" y="426" width="100" height="28" rx="3" fill="rgba(245, 158, 11, 0.3)" stroke="#f59e0b" strokeWidth="1.5" />
          <text x="300" y="444" fill="#fbbf24" fontSize="10" fontWeight="bold" textAnchor="middle">16%</text>

          {/* #6 Intersection Highlight */}
          <circle cx="520" cy="150" r="16" fill="rgba(34, 197, 94, 0.2)" stroke="#22c55e" strokeWidth="1.5" />

          {/* #8 Railway Crossing Tracks */}
          <line x1="345" y1="70" x2="375" y2="100" stroke="#ef4444" strokeWidth="3" />
          <line x1="375" y1="70" x2="345" y2="100" stroke="#ef4444" strokeWidth="3" />

          {/* All 12 Exercise Station Badges */}
          {EXERCISE_REGISTRY.map((ex) => {
            const isActive = ex.number === currentExercise.number;
            return (
              <g key={ex.number} transform={`translate(${ex.startX}, ${ex.startY})`}>
                {isActive && (
                  <circle
                    cx="0"
                    cy="0"
                    r="15"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    opacity="0.8"
                  >
                    <animate
                      attributeName="r"
                      values="10;18;10"
                      dur="1.8s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.9;0.2;0.9"
                      dur="1.8s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
                <circle
                  cx="0"
                  cy="0"
                  r="9"
                  fill={isActive ? "#0284c7" : "#1e293b"}
                  stroke={isActive ? "#38bdf8" : "#64748b"}
                  strokeWidth="1.5"
                />
                <text
                  x="0"
                  y="3.5"
                  fill="#ffffff"
                  fontSize="8.5"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {ex.number}
                </text>
              </g>
            );
          })}

          {/* Player Vehicle Beacon */}
          <g
            transform={`translate(${telemetry.posX}, ${telemetry.posY}) rotate(${headingDeg})`}
            filter="url(#beaconGlow)"
          >
            {/* Direction Beam */}
            <polygon points="0,-16 -7,8 7,8" fill="#38bdf8" opacity="0.9" />
            {/* Vehicle Dot */}
            <circle cx="0" cy="0" r="4.5" fill="#ffffff" stroke="#0284c7" strokeWidth="2" />
          </g>
        </svg>
      </Box>

      {/* Footer Info: Exercise Name and Coordinates */}
      <Box
        px="xs"
        py={4}
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          backgroundColor: "rgba(15, 23, 42, 0.9)",
        }}
      >
        <Group justify="space-between" align="center" wrap="nowrap">
          <Badge size="xs" color="blue" variant="filled">
            #{currentExercise.number} {currentExercise.code}
          </Badge>
          <Text size="9px" c="dimmed" style={{ fontFamily: "monospace" }}>
            X:{Math.round(telemetry.posX)} Y:{Math.round(telemetry.posY)}
          </Text>
        </Group>
      </Box>
    </Paper>
  );
}
