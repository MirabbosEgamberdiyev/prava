import { Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

/**
 * Klaviatura boshqaruvi haqida qisqa eslatma (W-16): 1–5 / A–D — variant,
 * ← / → — savollar, Enter — keyingi. Faqat katta ekranlarda (klaviatura
 * bo'lishi ehtimoli yuqori) ko'rsatiladi.
 */
export default function KeyboardHint() {
  const { t } = useTranslation();
  return (
    <Text size="xs" c="dimmed" ta="center" visibleFrom="md" mt={8} mb={4} aria-hidden="true">
      {t("exam.keyboardHint")}
    </Text>
  );
}
