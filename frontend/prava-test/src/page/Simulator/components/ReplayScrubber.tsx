import { useState, useEffect } from "react";
import {
  Paper,
  Group,
  Stack,
  ActionIcon,
  Slider,
  Text,
  Badge,
  Tooltip,
  Select,
  Box,
} from "@mantine/core";
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerTrackPrev,
  IconPlayerTrackNext,
  IconAlertTriangle,
  IconClock,
} from "@tabler/icons-react";
import type { ReplayPlayer } from "../engine/replayEngine";
import type { ReplayRecording, PenaltyEvent } from "../types";
import { useLanguage } from "../../../context/LanguageContext";

interface Props {
  player: ReplayPlayer;
  recording: ReplayRecording;
  currentTimeSeconds: number;
  onSeek: (seconds: number) => void;
  onPenaltyClick?: (penalty: PenaltyEvent) => void;
}

export default function ReplayScrubber({
  player,
  recording,
  currentTimeSeconds,
  onSeek,
  onPenaltyClick,
}: Props) {
  const { lang } = useLanguage();
  const [isPlaying, setIsPlaying] = useState<boolean>(player.getIsPlaying());
  const [speed, setSpeed] = useState<string>("1.0");

  const duration = recording.durationSeconds || Math.max(1, player.getDurationSeconds());

  useEffect(() => {
    setIsPlaying(player.getIsPlaying());
  }, [currentTimeSeconds, player]);

  const togglePlay = () => {
    const nextPlaying = player.togglePlay();
    setIsPlaying(nextPlaying);
  };

  const handleSpeedChange = (val: string | null) => {
    if (!val) return;
    setSpeed(val);
    player.setSpeed(parseFloat(val));
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getLoc = (obj: { uzl: string; uzc: string; ru: string }) => {
    if (lang === "ru") return obj.ru;
    if (lang === "uzc") return obj.uzc;
    return obj.uzl;
  };

  return (
    <Paper
      p="sm"
      radius="md"
      withBorder
      style={{
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        backdropFilter: "blur(12px)",
        borderColor: "rgba(255, 255, 255, 0.12)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
      }}
    >
      <Stack gap="xs">
        {/* Timeline Slider with Penalty Markers */}
        <Box style={{ position: "relative", width: "100%", paddingTop: "6px" }}>
          <Slider
            value={currentTimeSeconds}
            min={0}
            max={duration}
            step={0.05}
            label={formatTime}
            onChange={(val) => {
              player.pause();
              setIsPlaying(false);
              onSeek(val);
            }}
            styles={{
              track: { backgroundColor: "rgba(255, 255, 255, 0.15)", height: 6 },
              bar: { backgroundColor: "#38bdf8", height: 6 },
              thumb: { width: 14, height: 14, borderColor: "#38bdf8" },
            }}
          />

          {/* Render Penalty Markers along timeline */}
          {recording.penalties.map((p, idx) => {
            const pct = Math.min(100, Math.max(0, (p.occurredAtSeconds / duration) * 100));
            return (
              <Tooltip
                key={p.id || idx}
                label={`${p.exerciseNumber}-mashq: ${getLoc(p.title)} (+${p.points})`}
                withArrow
                position="top"
              >
                <Box
                  onClick={() => {
                    player.pause();
                    setIsPlaying(false);
                    onSeek(p.occurredAtSeconds);
                    if (onPenaltyClick) onPenaltyClick(p);
                  }}
                  style={{
                    position: "absolute",
                    left: `${pct}%`,
                    top: 1,
                    transform: "translateX(-50%)",
                    cursor: "pointer",
                    zIndex: 4,
                  }}
                >
                  <Badge
                    size="xs"
                    color="red"
                    variant="filled"
                    p={2}
                    style={{
                      height: 14,
                      minWidth: 14,
                      fontSize: 9,
                      padding: "0 3px",
                      cursor: "pointer",
                    }}
                  >
                    !
                  </Badge>
                </Box>
              </Tooltip>
            );
          })}
        </Box>

        {/* Media Controls Bar */}
        <Group justify="space-between" align="center" wrap="wrap" gap="xs">
          <Group gap={6} wrap="wrap">
            {/* Step Back 2 sec */}
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => onSeek(Math.max(0, currentTimeSeconds - 2))}
              title="-2s"
              aria-label="-2s"
            >
              <IconPlayerTrackPrev size={18} />
            </ActionIcon>

            {/* Play / Pause */}
            <ActionIcon
              variant="filled"
              color="blue"
              size="lg"
              radius="xl"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pauza" : "Ijro"}
            >
              {isPlaying ? <IconPlayerPause size={20} /> : <IconPlayerPlay size={20} />}
            </ActionIcon>

            {/* Step Forward 2 sec */}
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => onSeek(Math.min(duration, currentTimeSeconds + 2))}
              title="+2s"
              aria-label="+2s"
            >
              <IconPlayerTrackNext size={18} />
            </ActionIcon>

            {/* Timestamp Display */}
            <Group gap={4} wrap="nowrap" ml={4}>
              <IconClock size={14} color="#94a3b8" />
              <Text size="xs" fw={700} c="blue.3" style={{ fontVariantNumeric: "tabular-nums" }}>
                {formatTime(currentTimeSeconds)}
              </Text>
              <Text size="xs" c="dimmed">
                / {formatTime(duration)}
              </Text>
            </Group>
          </Group>

          {/* Right side: Speed and Penalties count */}
          <Group gap={6} wrap="wrap">
            {recording.penalties.length > 0 && (
              <Badge color="red" variant="light" size="sm" leftSection={<IconAlertTriangle size={12} />}>
                {recording.penalties.length}{" "}
                {lang === "ru" ? "наруш." : lang === "uzc" ? "жарима" : "jarima"}
              </Badge>
            )}

            <Select
              size="xs"
              value={speed}
              onChange={handleSpeedChange}
              data={[
                { value: "0.5", label: "0.5x" },
                { value: "1.0", label: "1.0x" },
                { value: "2.0", label: "2.0x" },
              ]}
              w={75}
              styles={{
                input: {
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  borderColor: "rgba(255, 255, 255, 0.15)",
                  color: "#ffffff",
                  fontSize: 12,
                  height: 28,
                  minHeight: 28,
                },
              }}
            />
          </Group>
        </Group>
      </Stack>
    </Paper>
  );
}
