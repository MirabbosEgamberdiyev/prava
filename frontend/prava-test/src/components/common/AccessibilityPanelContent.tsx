import React from "react";
import {
  Stack,
  Group,
  Text,
  SegmentedControl,
  Paper,
  Button,
  Divider,
  Box,
  Badge,
} from "@mantine/core";
import {
  IconTypography,
  IconLetterCase,
  IconRefresh,
  IconCheck,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  useAccessibility,
  type TextSize,
} from "../../context/AccessibilityContext";
import { notifications } from "@mantine/notifications";

interface AccessibilityPanelContentProps {
  compact?: boolean;
}

export const AccessibilityPanelContent: React.FC<AccessibilityPanelContentProps> = ({
  compact = false,
}) => {
  const { t } = useTranslation();
  const {
    textSize,
    boldText,
    setTextSize,
    setBoldText,
    resetPreferences,
  } = useAccessibility();

  const handleReset = () => {
    resetPreferences();
    notifications.show({
      title: t("common.success", "Muvaffaqiyat"),
      message: t("accessibility.resetSuccess", "Barcha qulaylik parametrlari dastlabki holatga qaytarildi"),
      color: "teal",
      icon: <IconCheck size={16} />,
      autoClose: 3000,
    });
  };

  return (
    <Stack gap={compact ? "md" : "lg"}>
      {/* 1. Matn o'lchami (3 xil: Kichik 90%, Standart 100%, Katta 115%) */}
      <Box>
        <Group justify="space-between" mb={6} wrap="wrap">
          <Group gap={6} align="center">
            <IconLetterCase size={18} stroke={1.8} style={{ color: "var(--primary)" }} />
            <Text fw={600} size="sm">
              {t("accessibility.textSize", "Matn o'lchami")}
            </Text>
          </Group>
          <Badge size="sm" variant="light" color="blue">
            {textSize === "small" && "90%"}
            {textSize === "normal" && "100%"}
            {textSize === "large" && "115%"}
          </Badge>
        </Group>
        <Text size="xs" c="dimmed" mb={8}>
          {t("accessibility.textSizeDesc", "Barcha sahifalar, testlar va savollar matn o'lchami")}
        </Text>
        <SegmentedControl
          fullWidth
          value={textSize}
          onChange={(val) => setTextSize(val as TextSize)}
          data={[
            { label: t("accessibility.sizeSmall", "Kichik (90%)"), value: "small" },
            { label: t("accessibility.sizeNormal", "Standart (100%)"), value: "normal" },
            { label: t("accessibility.sizeLarge", "Katta (115%)"), value: "large" },
          ]}
          radius="md"
          size={compact ? "xs" : "sm"}
        />
      </Box>

      <Divider />

      {/* 2. Qalin matn (OFF / ON) */}
      <Box>
        <Group justify="space-between" mb={6} wrap="wrap">
          <Group gap={6} align="center">
            <IconTypography size={18} stroke={1.8} style={{ color: "var(--primary)" }} />
            <Text fw={600} size="sm">
              {t("accessibility.boldText", "Qalin matn")}
            </Text>
          </Group>
          <Badge size="sm" variant="light" color={boldText ? "green" : "gray"}>
            {boldText ? t("accessibility.boldOn", "ON") : t("accessibility.boldOff", "OFF")}
          </Badge>
        </Group>
        <Text size="xs" c="dimmed" mb={8}>
          {t("accessibility.boldTextDesc", "O'qishni osonlashtirish uchun shrift qalinligini oshirish")}
        </Text>
        <SegmentedControl
          fullWidth
          value={boldText ? "true" : "false"}
          onChange={(val) => setBoldText(val === "true")}
          data={[
            { label: t("accessibility.boldOff", "O'chiq (OFF)"), value: "false" },
            { label: t("accessibility.boldOn", "Yoqiq (ON)"), value: "true" },
          ]}
          radius="md"
          size={compact ? "xs" : "sm"}
        />
      </Box>

      <Divider />

      {/* 3. Jonli ko'rinish namunasi (Live Test Preview) */}
      <Box>
        <Text fw={600} size="xs" c="dimmed" mb={8} tt="uppercase" style={{ letterSpacing: "0.5px" }}>
          {t("accessibility.livePreview", "Jonli ko'rinish namunasi")}
        </Text>
        <Paper
          p="md"
          radius="md"
          withBorder
          style={{
            background: "var(--surface-muted, rgba(0,0,0,0.03))",
            borderColor: "var(--border)",
            transition: "all 0.2s ease",
          }}
        >
          <Group justify="space-between" mb={6}>
            <Badge size="xs" variant="filled" color="blue">
              {t("accessibility.sampleBadge", "Test Savoli #15")}
            </Badge>
            <Text size="xs" c="dimmed" fw={600}>
              ⏱ 14:20
            </Text>
          </Group>
          <Text
            size="sm"
            mb="sm"
            style={{
              fontWeight: boldText ? 700 : 500,
              fontSize: textSize === "small" ? "13px" : textSize === "large" ? "16px" : "14px",
              lineHeight: 1.5,
              color: "var(--text)",
            }}
          >
            {t(
              "accessibility.previewSampleText",
              "Chorrahada burilayotgan transport vositasining haydovchisi u burilayotgan yo'ldan o'tayotgan piyodalar va velosipedchilarga yo'l berishi shartmi?"
            )}
          </Text>
          <Stack gap={6}>
            <Paper
              p="xs"
              radius="sm"
              withBorder
              style={{
                background: "var(--card-bg, #ffffff)",
                borderColor: "var(--border)",
              }}
            >
              <Text
                size="xs"
                style={{
                  fontWeight: boldText ? 700 : 500,
                  fontSize: textSize === "small" ? "12px" : textSize === "large" ? "14px" : "13px",
                }}
              >
                ○ {t("accessibility.sampleOptionA", "A) Ha, albatta yo'l berishi shart.")}
              </Text>
            </Paper>
            <Paper
              p="xs"
              radius="sm"
              withBorder
              style={{
                background: "var(--card-bg, #ffffff)",
                borderColor: "var(--border)",
              }}
            >
              <Text
                size="xs"
                style={{
                  fontWeight: boldText ? 700 : 500,
                  fontSize: textSize === "small" ? "12px" : textSize === "large" ? "14px" : "13px",
                }}
              >
                ○ {t("accessibility.sampleOptionB", "B) Faqat piyodalar o'tish joyi bo'lsa yo'l beradi.")}
              </Text>
            </Paper>
          </Stack>
        </Paper>
      </Box>

      {/* 4. Reset Button */}
      <Button
        variant="subtle"
        color="gray"
        leftSection={<IconRefresh size={16} />}
        onClick={handleReset}
        fullWidth
        size="sm"
      >
        {t("accessibility.reset", "Standart holatga qaytarish")}
      </Button>
    </Stack>
  );
};

export default AccessibilityPanelContent;
