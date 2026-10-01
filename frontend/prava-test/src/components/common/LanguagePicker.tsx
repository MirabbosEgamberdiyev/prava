import { Menu, UnstyledButton, Text } from "@mantine/core";
import { IconCheck, IconChevronDown, IconWorld } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useLanguage, APP_LANGUAGES, type AppLanguage } from "../../context/LanguageContext";
import "./LanguagePicker.css";

const LANG_BADGES: Record<AppLanguage, { color: string; bg: string }> = {
  uzl: { color: "#0284c7", bg: "rgba(2, 132, 199, 0.12)" },
  uzc: { color: "#059669", bg: "rgba(5, 150, 105, 0.12)" },
  ru: { color: "#7c3aed", bg: "rgba(124, 58, 237, 0.12)" },
};

export default function LanguagePicker() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();

  const current =
    APP_LANGUAGES.find((l) => l.code === language) ?? APP_LANGUAGES[0];

  return (
    <Menu
      shadow="xl"
      width={230}
      position="bottom-end"
      radius="md"
      withinPortal
      transitionProps={{ transition: "pop-top-right", duration: 150 }}
    >
      <Menu.Target>
        <UnstyledButton
          className="pro-lang-btn"
          aria-label={`Til / Язык: ${current.label}`}
          title={`Tilni almashtirish (${current.label})`}
        >
          <div className="pro-lang-globe">
            <IconWorld size={15} stroke={1.8} />
          </div>
          <span className="pro-lang-text">{current.short}</span>
          <IconChevronDown size={11} stroke={2.2} className="pro-lang-chevron" />
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown className="pro-lang-dropdown">
        <Menu.Label className="pro-lang-heading">
          {t("settings.selectLanguage", "Tilni tanlang")}
        </Menu.Label>

        {APP_LANGUAGES.map((lang) => {
          const isActive = lang.code === language;
          const badge = LANG_BADGES[lang.code] || LANG_BADGES.uzl;

          return (
            <Menu.Item
              key={lang.code}
              className={`pro-lang-item${isActive ? " is-active" : ""}`}
              onClick={() => setLanguage(lang.code)}
              leftSection={
                <span
                  className="pro-lang-item-badge"
                  style={{ color: badge.color, backgroundColor: badge.bg }}
                >
                  {lang.flagCode}
                </span>
              }
              rightSection={
                isActive ? (
                  <IconCheck size={16} stroke={2.4} style={{ color: "var(--primary)" }} />
                ) : null
              }
            >
              <div className="pro-lang-item-content">
                <Text size="sm" fw={isActive ? 700 : 500} className="pro-lang-item-name">
                  {lang.label}
                </Text>
              </div>
            </Menu.Item>
          );
        })}
      </Menu.Dropdown>
    </Menu>
  );
}
