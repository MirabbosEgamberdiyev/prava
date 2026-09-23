import { useState, useRef, useEffect, useCallback } from "react";
import { Group, Button, Box, Paper, Stack, Text, ActionIcon } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconArrowLeft, IconArrowRight, IconCamera, IconVolume } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../../context/LanguageContext";
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
  onSteerAnalog?: (value: number) => void;
  onGearSelect: (gear: GearMode) => void;
  onHandbrakeToggle: () => void;
  onHornTrigger?: () => void;
  onCameraToggle?: () => void;
  onClutchStart?: () => void;
  onClutchEnd?: () => void;
  showClutch?: boolean;
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
  onSteerAnalog,
  onGearSelect,
  onHandbrakeToggle,
  onHornTrigger,
  onCameraToggle,
  onClutchStart,
  onClutchEnd,
  showClutch,
  activeGear,
  handbrakeActive,
}: Props) {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const isCompactMobile = useMediaQuery("(max-width: 420px)");
  const isLandscape = useMediaQuery("(orientation: landscape) and (max-height: 520px)");

  const wheelRef = useRef<HTMLDivElement | null>(null);
  const [wheelAngle, setWheelAngle] = useState(0);
  const isDraggingWheel = useRef(false);
  const startTouchAngle = useRef(0);
  const currentWheelAngle = useRef(0);

  // Re-center wheel when touch ends
  const handleTouchEndWheel = useCallback(() => {
    isDraggingWheel.current = false;
    currentWheelAngle.current = 0;
    setWheelAngle(0);
    if (onSteerAnalog) onSteerAnalog(0);
  }, [onSteerAnalog]);

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingWheel.current || !wheelRef.current) return;
      const touch = e.touches[0];
      const rect = wheelRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const rad = Math.atan2(touch.clientY - centerY, touch.clientX - centerX);
      let deg = (rad * 180) / Math.PI;

      let deltaDeg = deg - startTouchAngle.current;
      if (deltaDeg > 180) deltaDeg -= 360;
      if (deltaDeg < -180) deltaDeg += 360;

      const clampedDeg = Math.max(-120, Math.min(120, deltaDeg));
      currentWheelAngle.current = clampedDeg;
      setWheelAngle(clampedDeg);

      if (onSteerAnalog) {
        onSteerAnalog(clampedDeg / 120);
      }
    };

    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEndWheel);
    window.addEventListener("touchcancel", handleTouchEndWheel);

    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEndWheel);
      window.removeEventListener("touchcancel", handleTouchEndWheel);
    };
  }, [onSteerAnalog, handleTouchEndWheel]);

  const handleTouchStartWheel = (e: React.TouchEvent) => {
    if (!wheelRef.current) return;
    const touch = e.touches[0];
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rad = Math.atan2(touch.clientY - centerY, touch.clientX - centerX);
    startTouchAngle.current = (rad * 180) / Math.PI;
    isDraggingWheel.current = true;
  };

  const wheelSize = isCompactMobile ? 74 : isLandscape ? 80 : 96;

  return (
    <Box
      style={{
        position: "absolute",
        bottom: 8,
        left: 8,
        right: 8,
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        pointerEvents: "none",
        zIndex: 30,
      }}
    >
      {/* Left side: Interactive Steering Wheel & Arrow Buttons */}
      <Stack gap={6} style={{ pointerEvents: "auto" }}>
        {/* Virtual Steering Wheel Disk (Hidden on ultra-narrow portrait to save space) */}
        {!isCompactMobile && (
          <div
            ref={wheelRef}
            onTouchStart={handleTouchStartWheel}
            style={{
              width: wheelSize,
              height: wheelSize,
              borderRadius: "50%",
              background: "radial-gradient(circle, #334155 30%, #0f172a 80%)",
              border: "4px solid #38bdf8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `rotate(${wheelAngle}deg)`,
              transition: isDraggingWheel.current ? "none" : "transform 0.2s ease-out",
              boxShadow: "0 6px 18px rgba(0,0,0,0.5)",
              touchAction: "none",
              cursor: "grab",
            }}
          >
            {/* Wheel Spokes */}
            <div style={{ width: wheelSize - 16, height: 6, backgroundColor: "#64748b", position: "absolute", borderRadius: 4 }} />
            <div style={{ width: 6, height: wheelSize * 0.44, backgroundColor: "#64748b", position: "absolute", bottom: 8, borderRadius: 4 }} />
            {/* Center Hub */}
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                backgroundColor: "#1e293b",
                border: "2px solid #94a3b8",
                zIndex: 2,
              }}
            />
          </div>
        )}

        {/* Quick Steer & Horn Buttons */}
        <Paper
          p={4}
          radius="lg"
          withBorder
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(8px)",
            borderColor: "rgba(255, 255, 255, 0.15)",
          }}
        >
          <Group gap={4}>
            <Button
              size="sm"
              variant="filled"
              color="gray"
              onMouseDown={onSteerLeftStart}
              onMouseUp={onSteerLeftEnd}
              onTouchStart={onSteerLeftStart}
              onTouchEnd={onSteerLeftEnd}
              aria-label={t("common.back")}
              style={{ width: 44, height: 44, minWidth: 44, minHeight: 44, borderRadius: "50%", padding: 0 }}
            >
              <IconArrowLeft size={20} />
            </Button>
            {onHornTrigger && (
              <ActionIcon
                size="lg"
                color="yellow"
                variant="light"
                onClick={onHornTrigger}
                aria-label={lang === "ru" ? "Звуковой сигнал" : lang === "uzc" ? "Овозли сигнал" : "Ovozli signal"}
                style={{ width: 44, height: 44, minWidth: 44, minHeight: 44, borderRadius: "50%" }}
              >
                <IconVolume size={20} />
              </ActionIcon>
            )}
            <Button
              size="sm"
              variant="filled"
              color="gray"
              onMouseDown={onSteerRightStart}
              onMouseUp={onSteerRightEnd}
              onTouchStart={onSteerRightStart}
              onTouchEnd={onSteerRightEnd}
              aria-label={t("common.next")}
              style={{ width: 44, height: 44, minWidth: 44, minHeight: 44, borderRadius: "50%", padding: 0 }}
            >
              <IconArrowRight size={20} />
            </Button>
          </Group>
        </Paper>
      </Stack>

      {/* Right side: Pedals (Brake, Throttle) & Gear selector */}
      <Stack gap="xs" align="flex-end" style={{ pointerEvents: "auto" }}>
        {/* Quick Utilities: Camera & Gears */}
        <Paper
          p={4}
          radius="md"
          withBorder
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(8px)",
            borderColor: "rgba(255, 255, 255, 0.15)",
          }}
        >
          <Group gap={4}>
            {onCameraToggle && (
              <ActionIcon
                size="sm"
                color="blue"
                variant="subtle"
                onClick={onCameraToggle}
                aria-label={lang === "ru" ? "Камера" : "Kamera"}
              >
                <IconCamera size={16} />
              </ActionIcon>
            )}
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

        {/* Vertical Pedals */}
        <Group gap={isCompactMobile ? 4 : "xs"}>
          {/* Optional Clutch Pedal */}
          {showClutch && onClutchStart && onClutchEnd && (
            <Button
              size="lg"
              color="cyan"
              variant="filled"
              onMouseDown={onClutchStart}
              onMouseUp={onClutchEnd}
              onTouchStart={onClutchStart}
              onTouchEnd={onClutchEnd}
              style={{
                width: isCompactMobile ? 44 : 58,
                height: isCompactMobile ? 64 : 74,
                borderRadius: "12px",
                padding: 0,
                boxShadow: "0 4px 14px rgba(6, 182, 212, 0.4)",
              }}
            >
              <Stack gap={1} align="center">
                <Text fw={700} size={isCompactMobile ? "9px" : "xs"}>
                  {lang === "ru" ? "СЦЕП." : "MUF"}
                </Text>
              </Stack>
            </Button>
          )}

          {/* Brake Pedal */}
          <Button
            size="lg"
            color="red"
            variant="filled"
            onMouseDown={onBrakeStart}
            onMouseUp={onBrakeEnd}
            onTouchStart={onBrakeStart}
            onTouchEnd={onBrakeEnd}
            style={{
              width: isCompactMobile ? 48 : 64,
              height: isCompactMobile ? 64 : 74,
              borderRadius: "12px",
              padding: 0,
              boxShadow: "0 4px 14px rgba(239, 68, 68, 0.4)",
            }}
          >
            <Stack gap={1} align="center">
              <Text fw={700} size={isCompactMobile ? "10px" : "sm"}>
                {lang === "ru" ? "ТОРМ" : "TOR"}
              </Text>
            </Stack>
          </Button>

          {/* Throttle (Gaz) Pedal */}
          <Button
            size="lg"
            color="teal"
            variant="filled"
            onMouseDown={onThrottleStart}
            onMouseUp={onThrottleEnd}
            onTouchStart={onThrottleStart}
            onTouchEnd={onThrottleEnd}
            style={{
              width: isCompactMobile ? 52 : 68,
              height: isCompactMobile ? 74 : 88,
              borderRadius: "12px",
              padding: 0,
              boxShadow: "0 4px 14px rgba(20, 184, 166, 0.4)",
            }}
          >
            <Stack gap={1} align="center">
              <Text fw={700} size={isCompactMobile ? "12px" : "md"}>
                {lang === "ru" ? "ГАЗ" : "GAZ"}
              </Text>
            </Stack>
          </Button>
        </Group>
      </Stack>
    </Box>
  );
}
