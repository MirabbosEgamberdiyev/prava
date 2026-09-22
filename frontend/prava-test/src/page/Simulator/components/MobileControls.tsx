import { Group, Button, Box, Paper, Stack, Text } from "@mantine/core";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import type { GearMode } from "../types";

interface Props {
  onThrottleStart: () => void;
  onThrottleEnd: () => void;
  onBrakeStart: () => void;
  onBrakeEnd: () => void;
  onSteerLeftStart: () => void;
  onSteerLeftEnd: () => void;
  onSteerRightStart: () => void;
  onSteerRightEnd: () => void;
  onGearSelect: (gear: GearMode) => void;
  onHandbrakeToggle: () => void;
  activeGear: GearMode;
  handbrakeActive: boolean;
}

export default function MobileControls({
  onThrottleStart,
  onThrottleEnd,
  onBrakeStart,
  onBrakeEnd,
  onSteerLeftStart,
  onSteerLeftEnd,
  onSteerRightStart,
  onSteerRightEnd,
  onGearSelect,
  onHandbrakeToggle,
  activeGear,
  handbrakeActive,
}: Props) {
  return (
    <Box
      style={{
        position: "absolute",
        bottom: 12,
        left: 12,
        right: 12,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        pointerEvents: "none",
        zIndex: 30,
      }}
    >
      {/* Left side: Steering Buttons */}
      <Paper
        p="xs"
        radius="lg"
        withBorder
        style={{
          pointerEvents: "auto",
          backgroundColor: "rgba(26, 37, 47, 0.8)",
          backdropFilter: "blur(6px)",
          borderColor: "rgba(255, 255, 255, 0.15)",
        }}
      >
        <Group gap="xs">
          <Button
            size="md"
            variant="filled"
            color="gray"
            onMouseDown={onSteerLeftStart}
            onMouseUp={onSteerLeftEnd}
            onTouchStart={onSteerLeftStart}
            onTouchEnd={onSteerLeftEnd}
            style={{ width: 56, height: 56, borderRadius: "50%" }}
          >
            <IconArrowLeft size={24} />
          </Button>
          <Button
            size="md"
            variant="filled"
            color="gray"
            onMouseDown={onSteerRightStart}
            onMouseUp={onSteerRightEnd}
            onTouchStart={onSteerRightStart}
            onTouchEnd={onSteerRightEnd}
            style={{ width: 56, height: 56, borderRadius: "50%" }}
          >
            <IconArrowRight size={24} />
          </Button>
        </Group>
      </Paper>

      {/* Right side: Pedals (Brake, Throttle) & Gear selector */}
      <Stack gap="xs" align="flex-end" style={{ pointerEvents: "auto" }}>
        {/* Gear Box */}
        <Paper
          p={4}
          radius="md"
          withBorder
          style={{
            backgroundColor: "rgba(26, 37, 47, 0.8)",
            backdropFilter: "blur(6px)",
          }}
        >
          <Group gap={4}>
            {(["P", "R", "N", "D"] as const).map((g) => (
              <Button
                key={g}
                size="compact-xs"
                variant={activeGear === g ? "filled" : "subtle"}
                color={activeGear === g ? "blue" : "gray"}
                onClick={() => onGearSelect(g)}
              >
                {g}
              </Button>
            ))}
            <Button
              size="compact-xs"
              variant={handbrakeActive ? "filled" : "outline"}
              color={handbrakeActive ? "red" : "gray"}
              onClick={onHandbrakeToggle}
            >
              (P)
            </Button>
          </Group>
        </Paper>

        {/* Pedals */}
        <Group gap="sm">
          {/* Brake Pedal */}
          <Button
            size="lg"
            color="red"
            variant="filled"
            onMouseDown={onBrakeStart}
            onMouseUp={onBrakeEnd}
            onTouchStart={onBrakeStart}
            onTouchEnd={onBrakeEnd}
            style={{ width: 64, height: 72, borderRadius: "12px" }}
          >
            <Stack gap={2} align="center">
              <Text fw={700} size="sm">
                TORMOZ
              </Text>
            </Stack>
          </Button>

          {/* Throttle (Gaz) Pedal */}
          <Button
            size="lg"
            color="green"
            variant="filled"
            onMouseDown={onThrottleStart}
            onMouseUp={onThrottleEnd}
            onTouchStart={onThrottleStart}
            onTouchEnd={onThrottleEnd}
            style={{ width: 64, height: 86, borderRadius: "12px" }}
          >
            <Stack gap={2} align="center">
              <Text fw={700} size="md">
                GAZ
              </Text>
            </Stack>
          </Button>
        </Group>
      </Stack>
    </Box>
  );
}
