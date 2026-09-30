import {
  Box,
  Card,
  Container,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { APP_LANGUAGES, useLanguage, type AppLanguage } from "../../../context/LanguageContext";

// Prava Steering Wheel Vector Logo
function SteeringWheelLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="20" stroke="#ffffff" strokeWidth="3" />
      <circle cx="24" cy="24" r="7" stroke="#ffffff" strokeWidth="3" />
      <path d="M24 4V17M24 31V44M4 24H17M31 24H44" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function LanguageSelectionPage() {
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Native language names (never translated) come from the shared APP_LANGUAGES map.
  const FLAGS: Record<AppLanguage, string> = { uzl: "🇺🇿", uzc: "🇺🇿", ru: "🇷🇺" };
  const languages = APP_LANGUAGES.map((l) => ({ code: l.code, flag: FLAGS[l.code], label: l.label }));

  // Guest-first (D-01): after picking a language the user lands on the guest home, not on login.
  const handleSelectLanguage = async (code: AppLanguage) => {
    await setLanguage(code);
    try {
      localStorage.setItem("prava_lang_selected", "true");
    } catch {
      // storage unavailable — the picker will simply show again next launch
    }
    navigate("/me", { replace: true });
  };

  return (
    <Container size={440} py={40}>
      <Card
        withBorder
        shadow="md"
        radius={24}
        p={32}
        style={{
          backgroundColor: "var(--card-bg, #ffffff)",
          borderColor: "var(--border, #e2e8f0)",
          boxShadow: "0 12px 36px rgba(10, 37, 64, 0.08)",
          textAlign: "center",
        }}
      >
        <Stack align="center" gap={16}>
          {/* Brand Squircle Logo */}
          <Box
            style={{
              width: 68,
              height: 68,
              borderRadius: 20,
              backgroundColor: "#0284c7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(2, 132, 199, 0.35)",
            }}
          >
            <SteeringWheelLogo size={36} />
          </Box>

          <Box>
            <Title order={2} fw={800} fz={24} style={{ letterSpacing: "-0.02em" }}>
              {t("auth.welcome")}
            </Title>
            <Text c="dimmed" fz={13.5} mt={4}>
              {t("auth.languagePage.subtitle")}
            </Text>
          </Box>

          {/* Language Options List */}
          <Stack gap={12} style={{ width: "100%" }} mt={8}>
            {languages.map((item) => {
              const isSelected = language === item.code;
              return (
                <Card
                  key={item.code}
                  withBorder
                  p={16}
                  radius={16}
                  component="button"
                  type="button"
                  lang={item.code === "ru" ? "ru" : "uz"}
                  aria-pressed={isSelected}
                  onClick={() => handleSelectLanguage(item.code)}
                  style={{
                    cursor: "pointer",
                    width: "100%",
                    textAlign: "left",
                    transition: "all 0.18s ease",
                    backgroundColor: isSelected
                      ? "rgba(2, 132, 199, 0.06)"
                      : "var(--surface, #f8fafc)",
                    borderColor: isSelected ? "#0284c7" : "var(--border, #e2e8f0)",
                    borderWidth: isSelected ? 2 : 1,
                  }}
                >
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap={14}>
                      <Text fz={24} aria-hidden="true">{item.flag}</Text>
                      <Text fw={700} fz={15}>
                        {item.label}
                      </Text>
                    </Group>
                    <Text c={isSelected ? "#0284c7" : "dimmed"} fz={18} fw={700} aria-hidden="true">
                      ›
                    </Text>
                  </Group>
                </Card>
              );
            })}
          </Stack>

          {/* Terms text */}
          <Text c="dimmed" fz={12} mt={10}>
            {t("auth.languagePage.terms")}
          </Text>
        </Stack>
      </Card>
    </Container>
  );
}
