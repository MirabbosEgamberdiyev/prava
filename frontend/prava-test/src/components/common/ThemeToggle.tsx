import { useDesktopTheme } from "../../context/DesktopThemeContext";
import { useTranslation } from "react-i18next";
import { IconMoon, IconSun } from "@tabler/icons-react";
import "./ThemeToggle.css";

export default function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useDesktopTheme();
  const isDark = theme === "dark";

  return (
    <button
      className={`pro-theme-btn ${isDark ? "is-dark" : "is-light"}`}
      onClick={toggleTheme}
      title={isDark ? t("settings.themeLight", "Yorug' rejim") : t("settings.themeDark", "Qorong'i rejim")}
      type="button"
      aria-label={t("settings.themeToggleAria", "Mavzuni almashtirish")}
    >
      <span className="pro-theme-icon-wrap" aria-hidden="true">
        {isDark ? (
          <IconSun size={17} stroke={2} className="pro-sun-icon" />
        ) : (
          <IconMoon size={17} stroke={2} className="pro-moon-icon" />
        )}
      </span>
    </button>
  );
}
