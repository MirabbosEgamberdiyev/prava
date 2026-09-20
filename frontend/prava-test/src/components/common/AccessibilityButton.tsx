import React from "react";
import { Tooltip, UnstyledButton } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useAccessibility } from "../../context/AccessibilityContext";

interface AccessibilityButtonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const AccessibilityButton: React.FC<AccessibilityButtonProps> = ({
  className = "header-control-icon-btn",
  style,
}) => {
  const { t } = useTranslation();
  const { openDrawer } = useAccessibility();

  return (
    <Tooltip
      label={t("accessibility.title", "Matn va Qulaylik")}
      position="bottom"
      withArrow
    >
      <UnstyledButton
        onClick={openDrawer}
        className={className}
        aria-label={t("accessibility.openDrawer", "Matn va qulaylik sozlamalari")}
        type="button"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: "14px",
          letterSpacing: "-0.5px",
          color: "var(--text)",
          ...style,
        }}
      >
        <span aria-hidden="true" style={{ lineHeight: 1 }}>
          Aa
        </span>
      </UnstyledButton>
    </Tooltip>
  );
};

export default AccessibilityButton;
