import { Paper, Group, Text, ActionIcon, Tooltip, Box } from "@mantine/core";
import { IconCamera, IconVolume, IconVolumeOff } from "@tabler/icons-react";
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
        backdropFilter: "blur(12px)",
        borderColor: "rgba(255, 255, 255, 0.16)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.45)",
        width: "235px",
        overflow: "hidden",
      }}
    >
      {/* Top Header Bar matching screenshot */}
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
            <ActionIcon
              size="xs"
              variant="transparent"
              color={soundEnabled ? "blue" : "gray"}
              onClick={onSoundToggle}
              aria-label={lang === "ru" ? "Включить / выключить звук" : lang === "uzc" ? "Овозни ёқиш / ўчириш" : "Ovozni yoqish / o'chirish"}
            >
              {soundEnabled ? <IconVolume size={15} color="#38bdf8" /> : <IconVolumeOff size={15} />}
            </ActionIcon>
            <Text size="xs" fw={700} c="white" style={{ letterSpacing: "0.4px" }}>
              {lang === "ru" ? "Карта автодрома" : lang === "uzc" ? "Автодром харитаси" : "Avtodrom xaritasi"}
            </Text>
          </Group>

          <Group gap={2}>
            {/* Camera View Switcher */}
            <Tooltip
              label={
                cameraView === "chase"
                  ? lang === "ru"
                    ? "Вид сзади (3-е лицо)"
                    : lang === "uzc"
                    ? "Орқа кўриниш (3-шахс)"
                    : "Orqa ko'rinish (3-shaxs)"
                  : cameraView === "first_person"
                  ? lang === "ru"
                    ? "Вид из кабины (1-е лицо)"
                    : lang === "uzc"
                    ? "Кабина кўриниши (1-шахс)"
                    : "Kabina ko'rinishi (1-shaxs)"
                  : lang === "ru"
                  ? "Вид сверху"
                  : lang === "uzc"
                  ? "Юқоридан кўриниш"
                  : "Yuqoridan ko'rinish"
              }
            >
              <ActionIcon
                size="xs"
                variant="subtle"
                color="blue"
                onClick={onCameraToggle}
                aria-label={lang === "ru" ? "Переключить вид камеры" : lang === "uzc" ? "Камерани алмаштириш" : "Kamerani almashtirish"}
              >
                <IconCamera size={13} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Box>

      {/* SVG Circuit Radar matching screenshot layout */}
      <Box style={{ position: "relative", width: "100%", height: "165px", padding: "4px" }}>
        <svg
          viewBox="0 0 600 500"
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            borderRadius: "4px",
            backgroundColor: "#070e1e",
          }}
        >
          <defs>
            <pattern id="radarGrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            </pattern>
            <filter id="beaconGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <rect width="600" height="500" fill="url(#radarGrid)" />

          {/* Autodrome Outer Boundary Walls */}
          <rect
            x="25"
            y="25"
            width="550"
            height="450"
            rx="14"
            fill="none"
            stroke="#1e293b"
            strokeWidth="2.5"
          />

          {/* Green Grass Lawn Center Islands */}
          <rect x="130" y="115" width="220" height="240" rx="10" fill="#0f291e" stroke="#166534" strokeWidth="1" />
          <rect x="380" y="115" width="100" height="240" rx="10" fill="#0f291e" stroke="#166534" strokeWidth="1" />

          {/* Road Asphalt Ribbons */}
          <path
            d="M 60,440 L 360,440 L 370,440 L 370,380 L 430,380 L 430,340 L 520,210 L 520,75 L 80,75 L 80,440 Z"
            fill="none"
            stroke="#1e293b"
            strokeWidth="32"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d="M 60,440 L 360,440 L 370,440 L 370,380 L 430,380 L 430,340 L 520,210 L 520,75 L 80,75 L 80,440 Z"
            fill="none"
            stroke="#334155"
            strokeWidth="26"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Centerline Dashed Yellow */}
          <path
            d="M 60,440 L 360,440 L 370,440 L 370,380 L 430,380 L 430,340 L 520,210 L 520,75 L 80,75 L 80,440 Z"
            fill="none"
            stroke="#facc15"
            strokeWidth="2"
            strokeDasharray="6 4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Middle Connecting Road */}
          <line x1="240" y1="75" x2="240" y2="440" stroke="#334155" strokeWidth="22" />
          <line x1="240" y1="75" x2="240" y2="440" stroke="#facc15" strokeWidth="1.5" strokeDasharray="6 4" />

          {/* 12 Exercise Stations Badges with Blue Numbers */}
          {EXERCISE_REGISTRY.map((ex) => {
            const isActive = ex.number === currentExercise.number;
            return (
              <g key={ex.number} transform={`translate(${ex.startX}, ${ex.startY})`}>
                {isActive && (
                  <circle cx="0" cy="0" r="14" fill="none" stroke="#38bdf8" strokeWidth="2" opacity="0.8">
                    <animate attributeName="r" values="9;16;9" dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.9;0.2;0.9" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle
                  cx="0"
                  cy="0"
                  r="9"
                  fill={isActive ? "#0284c7" : "#0f172a"}
                  stroke={isActive ? "#38bdf8" : "#475569"}
                  strokeWidth="1.5"
                />
                <text
                  x="0"
                  y="3.5"
                  fill="#ffffff"
                  fontSize="8"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {ex.number}
                </text>
              </g>
            );
          })}

          {/* Player Vehicle Beacon matching screenshot */}
          <g
            transform={`translate(${telemetry.posX}, ${telemetry.posY}) rotate(${headingDeg})`}
            filter="url(#beaconGlow)"
          >
            {/* Direction triangle beam */}
            <polygon points="0,-16 -7,7 7,7" fill="#38bdf8" opacity="0.9" />
            {/* Car Center Dot */}
            <circle cx="0" cy="0" r="5" fill="#ffffff" stroke="#0284c7" strokeWidth="2" />
          </g>
        </svg>
      </Box>
    </Paper>
  );
}
