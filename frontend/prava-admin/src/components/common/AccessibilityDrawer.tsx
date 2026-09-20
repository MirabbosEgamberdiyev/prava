import React from "react";
import { Drawer, ScrollArea } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useAccessibility } from "../../context/AccessibilityContext";
import { AccessibilityPanelContent } from "./AccessibilityPanelContent";

export const AccessibilityDrawer: React.FC = () => {
  const { t } = useTranslation();
  const { isDrawerOpen, closeDrawer } = useAccessibility();

  return (
    <Drawer
      opened={isDrawerOpen}
      onClose={closeDrawer}
      title={t("accessibility.title", "Matn va Qulaylik")}
      position="right"
      size="md"
      padding="lg"
      scrollAreaComponent={ScrollArea.Autosize}
      zIndex={1000}
      styles={{
        header: {
          borderBottom: "1px solid var(--mantine-color-default-border)",
          paddingBottom: "12px",
          fontWeight: 700,
        },
        title: {
          fontWeight: 700,
          fontSize: "16px",
        },
      }}
    >
      <AccessibilityPanelContent compact />
    </Drawer>
  );
};

export default AccessibilityDrawer;
