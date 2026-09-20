import React from "react";
import { Tooltip, ActionIcon } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useAccessibility } from "../../context/AccessibilityContext";

interface AccessibilityButtonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const AccessibilityButton: React.FC<AccessibilityButtonProps> = ({
  className,
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
      <ActionIcon
        onClick={openDrawer}
        variant="light"
        size="lg"
        radius="md"
        className={className}
        aria-label={t("accessibility.openDrawer", "Matn va qulaylik sozlamalari")}
        style={{
          fontWeight: 800,
          fontSize: "15px",
          letterSpacing: "-0.5px",
          ...style,
        }}
      >
        <span aria-hidden="true" style={{ lineHeight: 1 }}>
          Aa
        </span>
      </ActionIcon>
    </Tooltip>
  );
};

export default AccessibilityButton;
