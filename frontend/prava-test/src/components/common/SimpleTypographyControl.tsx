import { Paper, Stack, Text, Group, SegmentedControl, Switch, Box } from "@mantine/core";
import { IconTypography, IconBold } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useTypography, type TextSize } from "../../context/TypographyContext";

export function SimpleTypographyControl() {
  const { t } = useTranslation();
  const { textSize, setTextSize, boldText, setBoldText } = useTypography();

  return (
    <Paper p="lg" radius="md" withBorder shadow="sm">
      <Stack gap="md">
        <Group gap="xs">
          <IconTypography size={20} style={{ color: "var(--primary)" }} />
          <Text fw={600} size="md">
            {t("settings.typographyTitle")}
          </Text>
        </Group>

        {/* 1. Matn o'lchami (Kichik, Standart, Katta) */}
        <div>
          <Text size="sm" fw={500} mb="xs">
            {t("settings.textSize")}
          </Text>
          <SegmentedControl
            fullWidth
            value={textSize}
            onChange={(val) => setTextSize(val as TextSize)}
            data={[
              { label: t("settings.textSmall"), value: "small" },
              { label: t("settings.textStandard"), value: "standard" },
              { label: t("settings.textLarge"), value: "large" },
            ]}
          />
        </div>

        {/* 2. Qalin matn (OFF / ON) */}
        <Group justify="space-between" align="center" pt="xs">
          <div>
            <Group gap="xs">
              <IconBold size={16} style={{ color: "var(--primary)" }} />
              <Text size="sm" fw={500}>
                {t("settings.boldText")}
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              {t("settings.boldTextDesc")}
            </Text>
          </div>
          <Switch
            size="md"
            checked={boldText}
            onChange={(e) => setBoldText(e.currentTarget.checked)}
            aria-label={t("settings.boldText")}
          />
        </Group>

        {/* Jonli namuna / Live Preview */}
        <Box
          p="sm"
          style={{
            background: "var(--surface-muted, rgba(0,0,0,0.03))",
            borderRadius: 8,
            border: "1px dashed var(--border)",
          }}
        >
          <Text size="xs" c="dimmed" mb={4}>
            {t("settings.previewLabel")}
          </Text>
          <Text size="sm">
            {t("settings.previewText")}
          </Text>
        </Box>
      </Stack>
    </Paper>
  );
}

export default SimpleTypographyControl;
