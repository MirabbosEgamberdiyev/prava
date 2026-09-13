import { Menu, Text, UnstyledButton } from "@mantine/core";
import { useTranslation } from "react-i18next";
import Cookies from "js-cookie";
import { IconCheck, IconChevronDown, IconWorld } from "@tabler/icons-react";

export const languages = [
  { value: "uzl", label: "O‘zbekcha (Lotin)", short: "O‘zbek", code: "UZ" },
  { value: "uzc", label: "Ўзбекча (Кирилл)", short: "Ўзбек", code: "ЎЗ" },
  { value: "ru", label: "Русский", short: "Русский", code: "RU" },
] as const;

export default function LanguagePicker() {
  const { i18n } = useTranslation();
  const currentLang = i18n.resolvedLanguage || i18n.language || "uzl";
  const current = languages.find((l) => l.value === currentLang) ?? languages[0];

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
    Cookies.set("i18next", value, { expires: 365, path: "/" });
    try {
      localStorage.setItem("prava_lang", value);
      localStorage.setItem("i18nextLng", value);
    } catch {
      // localStorage may be unavailable
    }
  };

  return (
    <Menu shadow="md" width={190} position="bottom-end" radius="md" withinPortal>
      <Menu.Target>
        <UnstyledButton
          className="header-control-btn"
          aria-label={`Til: ${current.label}`}
          title={current.label}
        >
          <IconWorld
            size={16}
            stroke={1.6}
            style={{ color: "var(--primary)", flexShrink: 0 }}
            aria-hidden="true"
          />
          <span className="lang-label-full" style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.2px" }}>
            {current.short}
          </span>
          <span className="lang-label-short" style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.2px" }}>
            {current.code}
          </span>
          <IconChevronDown
            size={13}
            style={{ opacity: 0.5, flexShrink: 0, color: "var(--text-muted)" }}
            aria-hidden="true"
          />
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown style={{ padding: 6 }}>
        {languages.map((lang) => {
          const isActive = currentLang === lang.value;
          return (
            <Menu.Item
              key={lang.value}
              onClick={() => handleLanguageChange(lang.value)}
              rightSection={
                isActive ? (
                  <IconCheck
                    size={14}
                    stroke={2.2}
                    style={{ color: "var(--primary)" }}
                  />
                ) : null
              }
              style={{
                fontWeight: isActive ? 600 : 500,
                backgroundColor: isActive ? "var(--primary-light)" : undefined,
                color: isActive ? "var(--primary)" : "var(--text)",
                borderRadius: 6,
                padding: "8px 12px",
                fontSize: "13px",
              }}
            >
              <Text size="sm" fw={isActive ? 600 : 500}>
                {lang.label}
              </Text>
            </Menu.Item>
          );
        })}
      </Menu.Dropdown>
    </Menu>
  );
}
