import { Paper, Group, Text, ActionIcon, Tooltip, Box, Badge } from "@mantine/core";
import { IconCamera, IconVolume, IconVolumeOff } from "@tabler/icons-react";
import type { VehicleTelemetry, ExerciseDefinition, CameraView, ExerciseAttemptResult } from "../types";
import { AUTODROME_SPEC } from "../registry/autodromeModel";
import { useLanguage } from "../../../context/LanguageContext";

interface Props {
  telemetry: VehicleTelemetry;
  currentExercise: ExerciseDefinition;
  cameraView: CameraView;
  soundEnabled: boolean;
  onCameraToggle: () => void;
  onSoundToggle: () => void;
  exerciseResults?: Record<number, ExerciseAttemptResult>;
}

export default function AutodromeMiniMap({
  telemetry,
  currentExercise,
  cameraView,
  soundEnabled,
  onCameraToggle,
  onSoundToggle,
  exerciseResults,
}: Props) {
  const { lang } = useLanguage();

  // Heading angle in degrees for the player beacon
  const headingDeg = (telemetry.rotation * 180) / Math.PI;

  // Development mode 3D/Map desync validation (Requirement #10)
  const isDev = import.meta.env.DEV;
  const projected3D = AUTODROME_SPEC.to3D(telemetry.posX, telemetry.posY);
  const isDesynced =
    isNaN(projected3D.x) ||
    isNaN(projected3D.z) ||
    Math.abs(projected3D.x) > 200 ||
    Math.abs(projected3D.z) > 200;

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
        maxWidth: "235px",
        width: "min(235px, calc(100vw - 32px))",
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
            {/* Dev Mode Desync Badge */}
            {isDev && isDesynced && (
              <Badge size="xs" color="red" variant="filled">
                DESYNC
              </Badge>
            )}

            {/* Camera View Switcher (Chase -> Cockpit -> Rear -> Top-Down -> Free Orbit) */}
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
                  : cameraView === "rear"
                  ? lang === "ru"
                    ? "Камера заднего вида"
                    : lang === "uzc"
                    ? "Орқа камера (Парковка)"
                    : "Orqa kamera (Parkovka)"
                  : cameraView === "free"
                  ? lang === "ru"
                    ? "Свободная 3D камера"
                    : lang === "uzc"
                    ? "Эркин 3D камера"
                    : "Erkin 3D kamera"
                  : lang === "ru"
                  ? "Вид сверху (Орто)"
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

      {/* SVG Circuit Radar strictly consuming Single Source of Truth AUTODROME_SPEC */}
      <Box style={{ position: "relative", width: "100%", height: "165px", padding: "4px" }}>
        <svg
          viewBox={`0 0 ${AUTODROME_SPEC.dimensions.width2D} ${AUTODROME_SPEC.dimensions.height2D}`}
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
            <linearGradient id="estakadaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
          </defs>

          {/* Radar background grid */}
          <rect
            width={AUTODROME_SPEC.dimensions.width2D}
            height={AUTODROME_SPEC.dimensions.height2D}
            fill="url(#radarGrid)"
          />

          {/* 1. Boundaries from AUTODROME_SPEC */}
          {AUTODROME_SPEC.boundaries.map((b) => (
            <rect
              key={b.id}
              x={b.x}
              y={b.y}
              width={b.width}
              height={b.height}
              rx={b.borderRadius || 8}
              fill={b.fillColor || "none"}
              stroke={b.strokeColor || "#1e293b"}
              strokeWidth={b.type === "perimeter" ? 2.5 : 1}
            />
          ))}

          {/* 2. Special Zones (Zebra, Estakada, Railway, Parking, Garage) from AUTODROME_SPEC */}
          {AUTODROME_SPEC.zones.map((z) => {
            const w = z.bounds.maxX - z.bounds.minX;
            const h = z.bounds.maxY - z.bounds.minY;

            if (z.type === "pedestrian_crossing") {
              return (
                <g key={z.id}>
                  <rect x={z.bounds.minX} y={z.bounds.minY} width={w} height={h} fill="#1e293b" opacity={0.6} />
                  {[-12, -4, 4, 12].map((off) => (
                    <line
                      key={off}
                      x1={z.bounds.minX + w / 2 + off}
                      y1={z.bounds.minY + 4}
                      x2={z.bounds.minX + w / 2 + off}
                      y2={z.bounds.maxY - 4}
                      stroke="#ffffff"
                      strokeWidth={3}
                    />
                  ))}
                </g>
              );
            }

            if (z.type === "estakada_ramp") {
              return (
                <rect
                  key={z.id}
                  x={z.bounds.minX}
                  y={z.bounds.minY}
                  width={w}
                  height={h}
                  fill="url(#estakadaGradient)"
                  opacity={0.7}
                  stroke="#eab308"
                  strokeWidth={1}
                />
              );
            }

            if (z.type === "railway_crossing") {
              return (
                <g key={z.id}>
                  <rect x={z.bounds.minX} y={z.bounds.minY} width={w} height={h} fill="#1e293b" opacity={0.8} />
                  {[-15, 0, 15].map((off) => (
                    <line
                      key={off}
                      x1={z.bounds.minX + w / 2 + off}
                      y1={z.bounds.minY + 2}
                      x2={z.bounds.minX + w / 2 + off}
                      y2={z.bounds.maxY - 2}
                      stroke="#ef4444"
                      strokeWidth={2}
                    />
                  ))}
                </g>
              );
            }

            if (z.type === "parallel_parking" || z.type === "garage_box") {
              return (
                <rect
                  key={z.id}
                  x={z.bounds.minX}
                  y={z.bounds.minY}
                  width={w}
                  height={h}
                  fill="rgba(56, 189, 248, 0.12)"
                  stroke="#38bdf8"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                />
              );
            }

            return null;
          })}

          {/* 3. Roads from AUTODROME_SPEC: 1:1 Synchronous with 3D Circuit */}
          {/* Base Road Borders */}
          {AUTODROME_SPEC.roads.map((r) => (
            <line
              key={`border_${r.id}`}
              x1={r.start.x}
              y1={r.start.y}
              x2={r.end.x}
              y2={r.end.y}
              stroke="#1e293b"
              strokeWidth={r.width + 4}
              strokeLinecap="round"
            />
          ))}

          {/* Asphalt Core */}
          {AUTODROME_SPEC.roads.map((r) => (
            <line
              key={`asphalt_${r.id}`}
              x1={r.start.x}
              y1={r.start.y}
              x2={r.end.x}
              y2={r.end.y}
              stroke="#334155"
              strokeWidth={r.width}
              strokeLinecap="round"
            />
          ))}

          {/* Yellow Dashed Centerlines */}
          {AUTODROME_SPEC.roads
            .filter((r) => r.hasCenterline)
            .map((r) => (
              <line
                key={`center_${r.id}`}
                x1={r.start.x}
                y1={r.start.y}
                x2={r.end.x}
                y2={r.end.y}
                stroke="#facc15"
                strokeWidth={1.5}
                strokeDasharray="6 4"
                strokeLinecap="round"
              />
            ))}

          {/* 4. Cones & Stop Lines from EXERCISES */}
          {AUTODROME_SPEC.exercises.map((ex) => (
            <g key={`ex_props_${ex.number}`}>
              {/* Stop lines */}
              {ex.stopLines?.map((sl, idx) => (
                <line
                  key={`sl_${ex.number}_${idx}`}
                  x1={sl.x1}
                  y1={sl.y1}
                  x2={sl.x2}
                  y2={sl.y2}
                  stroke="#ffffff"
                  strokeWidth={2.5}
                />
              ))}
              {/* Cones */}
              {ex.cones?.map((c, idx) => (
                <circle
                  key={`cone_${ex.number}_${idx}`}
                  cx={c.x}
                  cy={c.y}
                  r={2.5}
                  fill="#f97316"
                  stroke="#ffffff"
                  strokeWidth={0.6}
                />
              ))}
            </g>
          ))}

          {/* 5. 12 Exercise Stations Badges with Dynamic Status Colors */}
          {AUTODROME_SPEC.exercises.map((ex) => {
            const isActive = ex.number === currentExercise.number;
            const res = exerciseResults ? exerciseResults[ex.number] : undefined;
            const isPassed = res?.isPassed;
            const isFailed = res && !res.isPassed;

            let strokeColor = "#475569";
            let fillColor = "#0f172a";

            if (isActive) {
              strokeColor = "#38bdf8";
              fillColor = "#0284c7";
            } else if (isPassed) {
              strokeColor = "#22c55e";
              fillColor = "#166534";
            } else if (isFailed) {
              strokeColor = "#ef4444";
              fillColor = "#991b1b";
            }

            return (
              <g key={ex.number} transform={`translate(${ex.startX}, ${ex.startY})`}>
                {isActive && (
                  <circle cx="0" cy="0" r="14" fill="none" stroke="#38bdf8" strokeWidth="2" opacity="0.8">
                    <animate attributeName="r" values="9;16;9" dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.9;0.2;0.9" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle cx="0" cy="0" r="9" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />
                <text x="0" y="3.5" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                  {ex.number}
                </text>
              </g>
            );
          })}

          {/* 6. Player Vehicle Beacon (1:1 Synchronized with 3D Position) */}
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
