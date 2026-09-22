import { Paper, Stack, Group, Text, Box } from "@mantine/core";
import type { GearMode } from "../types";

interface Props {
  gear: GearMode;
  throttle: number; // 0 to 1
  brake: number; // 0 to 1
  onGearSelect?: (g: GearMode) => void;
}

export default function GearStickWidget({
  gear,
  throttle,
  brake,
  onGearSelect,
}: Props) {
  const throttleHeight = Math.round(throttle * 60);
  const brakeHeight = Math.round(brake * 60);

  return (
    <Paper
      radius="md"
      withBorder
      p={8}
      style={{
        pointerEvents: "auto",
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        backdropFilter: "blur(12px)",
        borderColor: "rgba(255, 255, 255, 0.16)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.45)",
      }}
    >
      <Group gap="sm" align="center" wrap="nowrap">
        {/* Vertical PRND Selector */}
        <Stack gap={3} align="center">
          {(["P", "R", "N", "D"] as const).map((g) => {
            const isActive = gear === g;
            return (
              <Box
                key={g}
                onClick={() => onGearSelect?.(g)}
                style={{
                  cursor: "pointer",
                  width: "28px",
                  height: "26px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "5px",
                  backgroundColor: isActive ? "#0284c7" : "rgba(255, 255, 255, 0.05)",
                  color: isActive ? "#ffffff" : "#64748b",
                  fontWeight: 800,
                  fontSize: "13px",
                  fontFamily: "monospace",
                  boxShadow: isActive ? "0 0 10px rgba(2, 132, 199, 0.7)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                {g}
              </Box>
            );
          })}
        </Stack>

        {/* Vertical Dual Pedal Sliders (Brake & Gas) */}
        <Group gap={6} align="flex-end" style={{ height: "105px" }}>
          {/* Brake Pedal Vertical Meter */}
          <Box style={{ textAlign: "center" }}>
            <Box
              style={{
                width: "12px",
                height: "85px",
                backgroundColor: "#1e293b",
                borderRadius: "6px",
                position: "relative",
                overflow: "hidden",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <Box
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: `${brakeHeight}px`,
                  backgroundColor: "#ef4444",
                  boxShadow: "0 0 8px #ef4444",
                  transition: "height 0.08s ease",
                }}
              />
            </Box>
            <Text size="8px" fw={700} c="#f87171" mt={4}>
              BRK
            </Text>
          </Box>

          {/* Gas/Throttle Pedal Vertical Meter */}
          <Box style={{ textAlign: "center" }}>
            <Box
              style={{
                width: "12px",
                height: "85px",
                backgroundColor: "#1e293b",
                borderRadius: "6px",
                position: "relative",
                overflow: "hidden",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <Box
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: `${throttleHeight}px`,
                  backgroundColor: "#38bdf8",
                  boxShadow: "0 0 8px #38bdf8",
                  transition: "height 0.08s ease",
                }}
              />
            </Box>
            <Text size="8px" fw={700} c="#38bdf8" mt={4}>
              GAS
            </Text>
          </Box>
        </Group>
      </Group>
    </Paper>
  );
}
