import { Paper, Group, Box, Text, ActionIcon, Badge } from "@mantine/core";
import { IconX, IconCar } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useMediaQuery } from "@mantine/hooks";
import type { VehicleTelemetry } from "../types";

interface Props {
  telemetry: VehicleTelemetry;
  onClose?: () => void;
}

export default function MirrorsHUD({ telemetry, onClose }: Props) {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width: 600px)");

  const isReverse = telemetry.gear === "R" || telemetry.manualGear === "R";
  const steerRatio = (telemetry.steeringAngle / 35); // -1 (left) to +1 (right)

  return (
    <Box
      style={{
        position: "absolute",
        top: 56,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 32,
        pointerEvents: "auto",
        maxWidth: isMobile ? "96%" : "680px",
        width: "100%",
      }}
    >
      <Paper
        p={6}
        radius="md"
        style={{
          backgroundColor: "rgba(15, 23, 42, 0.88)",
          backdropFilter: "blur(12px)",
          border: isReverse ? "1.5px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
        }}
      >
        <Group justify="space-between" align="center" mb={4} px={4}>
          <Group gap={6}>
            <IconCar size={16} color="#38bdf8" />
            <Text size="11px" fw={700} c="white" tt="uppercase" style={{ letterSpacing: "0.5px" }}>
              {t("simulator.mirrorsTitle", "Orqani ko'rish ko'zgulari")}
            </Text>
            {isReverse && (
              <Badge size="xs" variant="filled" color="orange">
                {t("simulator.reverseActive", "ORQAGA YURISH")}
              </Badge>
            )}
          </Group>
          {onClose && (
            <ActionIcon size="xs" variant="subtle" color="gray" onClick={onClose} aria-label={t("common.close", "Yopish")}>
              <IconX size={14} />
            </ActionIcon>
          )}
        </Group>

        <Group justify="space-between" align="center" gap={6} wrap="nowrap">
          {/* 1. LEFT WING MIRROR */}
          <Box
            style={{
              flex: 1,
              height: isMobile ? 64 : 76,
              backgroundColor: "#090d16",
              borderRadius: "6px 2px 2px 8px",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              overflow: "hidden",
              position: "relative",
              boxShadow: "inset 0 0 12px rgba(0,0,0,0.8)",
            }}
          >
            {/* Convex Horizon Line */}
            <Box
              style={{
                position: "absolute",
                top: "42%",
                left: 0,
                right: 0,
                height: 1,
                backgroundColor: "rgba(148, 163, 184, 0.3)",
              }}
            />
            {/* Ground asphalt perspective */}
            <Box
              style={{
                position: "absolute",
                top: "43%",
                bottom: 0,
                left: 0,
                right: 0,
                background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
              }}
            />
            {/* Left Vehicle Body Edge in mirror */}
            <Box
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                right: 0,
                width: "28%",
                backgroundColor: "#334155",
                borderLeft: "2px solid #64748b",
                opacity: 0.85,
              }}
            />
            {/* Rear Left Wheel dynamic guide line */}
            <Box
              style={{
                position: "absolute",
                bottom: 6,
                left: `${35 - steerRatio * 15}%`,
                width: 2,
                height: 32,
                backgroundColor: "#22c55e",
                transform: `rotate(${-steerRatio * 18}deg)`,
                boxShadow: "0 0 4px #22c55e",
              }}
            />
            <Text
              size="9px"
              fw={700}
              c="#94a3b8"
              style={{ position: "absolute", bottom: 2, left: 4 }}
            >
              L
            </Text>
          </Box>

          {/* 2. CENTER REAR-VIEW CABIN MIRROR */}
          <Box
            style={{
              flex: 1.4,
              height: isMobile ? 64 : 76,
              backgroundColor: "#090d16",
              borderRadius: "4px",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              overflow: "hidden",
              position: "relative",
              boxShadow: "inset 0 0 12px rgba(0,0,0,0.8)",
            }}
          >
            {/* Horizon */}
            <Box
              style={{
                position: "absolute",
                top: "45%",
                left: 0,
                right: 0,
                height: 1,
                backgroundColor: "rgba(148, 163, 184, 0.4)",
              }}
            />
            {/* Road */}
            <Box
              style={{
                position: "absolute",
                top: "46%",
                bottom: 0,
                left: 0,
                right: 0,
                background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
              }}
            />
            {/* Dynamic Parking Distance Trajectory Lines */}
            <Box
              style={{
                position: "absolute",
                bottom: 4,
                left: `${42 - steerRatio * 20}%`,
                width: 16,
                height: 3,
                backgroundColor: "#ef4444",
                borderRadius: 1,
              }}
            />
            <Box
              style={{
                position: "absolute",
                bottom: 14,
                left: `${40 - steerRatio * 15}%`,
                width: 20,
                height: 2,
                backgroundColor: "#f59e0b",
                borderRadius: 1,
              }}
            />
            <Box
              style={{
                position: "absolute",
                bottom: 24,
                left: `${38 - steerRatio * 10}%`,
                width: 24,
                height: 2,
                backgroundColor: "#22c55e",
                borderRadius: 1,
              }}
            />
            <Text
              size="9px"
              fw={700}
              c="#94a3b8"
              style={{ position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)" }}
            >
              REAR
            </Text>
          </Box>

          {/* 3. RIGHT WING MIRROR */}
          <Box
            style={{
              flex: 1,
              height: isMobile ? 64 : 76,
              backgroundColor: "#090d16",
              borderRadius: "2px 6px 8px 2px",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              overflow: "hidden",
              position: "relative",
              boxShadow: "inset 0 0 12px rgba(0,0,0,0.8)",
            }}
          >
            {/* Horizon */}
            <Box
              style={{
                position: "absolute",
                top: "42%",
                left: 0,
                right: 0,
                height: 1,
                backgroundColor: "rgba(148, 163, 184, 0.3)",
              }}
            />
            {/* Ground */}
            <Box
              style={{
                position: "absolute",
                top: "43%",
                bottom: 0,
                left: 0,
                right: 0,
                background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
              }}
            />
            {/* Right Vehicle Body Edge */}
            <Box
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                width: "28%",
                backgroundColor: "#334155",
                borderRight: "2px solid #64748b",
                opacity: 0.85,
              }}
            />
            {/* Rear Right Wheel dynamic guide */}
            <Box
              style={{
                position: "absolute",
                bottom: 6,
                right: `${35 + steerRatio * 15}%`,
                width: 2,
                height: 32,
                backgroundColor: "#22c55e",
                transform: `rotate(${-steerRatio * 18}deg)`,
                boxShadow: "0 0 4px #22c55e",
              }}
            />
            <Text
              size="9px"
              fw={700}
              c="#94a3b8"
              style={{ position: "absolute", bottom: 2, right: 4 }}
            >
              R
            </Text>
          </Box>
        </Group>
      </Paper>
    </Box>
  );
}
