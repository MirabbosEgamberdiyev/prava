import { ActionIcon, Menu, Text, Group, Box } from "@mantine/core";
import { useTranslation } from "react-i18next";
import Cookies from "js-cookie";
import { IconCheck, IconLanguage } from "@tabler/icons-react";

const languages = [
  { value: "uzl", label: "O'zbekcha", short: "UZ" },
  { value: "uzc", label: "Ўзбекча", short: "ЎЗ" },
  { value: "ru", label: "Русский", short: "RU" },
  { value: "en", label: "English", short: "EN" },
] as const;

export default function LanguagePicker() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
    Cookies.set("i18next", value, { expires: 365 });
    try {
      localStorage.setItem("i18nextLng", value);
    } catch {
      // localStorage may be unavailable
    }
  };

  return (
    <Menu shadow="md" width={180} withArrow position="bottom-end">
      <Menu.Target>
        <ActionIcon
          variant="light"
          size="lg"
          radius="md"
          aria-label="Change language"
          style={{ minWidth: 40 }}
        >
          <IconLanguage size={18} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        {languages.map((lang) => {
          const isActive = i18n.resolvedLanguage === lang.value;
          return (
            <Menu.Item
              key={lang.value}
              onClick={() => handleLanguageChange(lang.value)}
              rightSection={isActive ? <IconCheck size={14} /> : null}
              style={isActive ? { fontWeight: 600 } : undefined}
            >
              <Group gap="xs" wrap="nowrap">
                <Box
                  w={28}
                  h={20}
                  style={{
                    borderRadius: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isActive
                      ? "var(--mantine-color-blue-light)"
                      : "var(--mantine-color-default-hover)",
                    flexShrink: 0,
                  }}
                >
                  <Text size="xs" fw={700} c={isActive ? "blue" : "dimmed"}>
                    {lang.short}
                  </Text>
                </Box>
                <Text size="sm">{lang.label}</Text>
              </Group>
            </Menu.Item>
          );
        })}
      </Menu.Dropdown>
    </Menu>
  );
}
