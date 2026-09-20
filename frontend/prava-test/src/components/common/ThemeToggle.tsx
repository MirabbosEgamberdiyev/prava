import { useTranslation } from "react-i18next";
import { useDesktopTheme } from "../../context/DesktopThemeContext";
import { IconMoon, IconSun } from "@tabler/icons-react";

export default function ThemeToggle() {
  const { t } = useTranslation();
  const { resolvedTheme, toggleTheme } = useDesktopTheme();
  const isLight = resolvedTheme === "light";

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      title={isLight ? t("common.darkMode", "Qorong'i rejim") : t("common.lightMode", "Yorug' rejim")}
      type="button"
      aria-label={t("theme.toggleTheme", "Mavzuni almashtirish")}
    >
      {isLight ? (
        <IconMoon size={18} stroke={2} />
      ) : (
        <IconSun size={18} stroke={2} />
      )}
    </button>
  );
}
