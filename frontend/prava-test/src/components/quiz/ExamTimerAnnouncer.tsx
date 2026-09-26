import { VisuallyHidden } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { ExamTimerWarning } from "../../hooks/useExamTimer";

/**
 * WCAG 2.2.1 — imtihon vaqti tugashidan oldin ekran o'quvchiga ogohlantirish.
 * Ko'rinmas `aria-live="assertive"` hudud; matn faqat 5 va 1 daqiqa chegarasi
 * kesib o'tilganda o'zgaradi (useExamTimer.warning), shuning uchun har soniyada
 * e'lon qilinmaydi.
 */
export default function ExamTimerAnnouncer({ warning }: { warning: ExamTimerWarning }) {
  const { t } = useTranslation();
  const message =
    warning === "one"
      ? t("a11y.timerOneMinuteLeft", "Imtihon tugashiga 1 daqiqa qoldi")
      : warning === "five"
        ? t("a11y.timerFiveMinutesLeft", "Imtihon tugashiga 5 daqiqa qoldi")
        : "";

  return (
    <VisuallyHidden aria-live="assertive" aria-atomic="true">
      {message}
    </VisuallyHidden>
  );
}
