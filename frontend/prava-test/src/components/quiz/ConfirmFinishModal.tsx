import { Modal } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { IconAlertTriangle } from "@tabler/icons-react";

interface ConfirmFinishModalProps {
  opened: boolean;
  /** "Davom etish" / Esc / overlay bosilganda. */
  onCancel: () => void;
  /** "Yakunlash" tugmasi. */
  onConfirm: () => void;
}

/**
 * Testni muddatidan oldin yakunlashni tasdiqlash oynasi (P2-W6).
 *
 * Avval Exam / WrongExam / Ticket / Marafon sahifalarida takrorlangan custom
 * `div.modal-overlay` edi (role, focus trap, fokusni qaytarish yo'q). Endi
 * Mantine `Modal`: `role="dialog"` + `aria-modal`, focus trap, Esc bilan yopish
 * va yopilgach fokus avvalgi elementga qaytadi. Ko'rinish avvalgisiga yaqin.
 *
 * "Yakunlash" tugmasi `data-autofocus` — avvalgi klaviatura xulqi (Enter =
 * yakunlash, Esc = davom etish) saqlanadi.
 */
export default function ConfirmFinishModal({ opened, onCancel, onConfirm }: ConfirmFinishModalProps) {
  const { t } = useTranslation();

  return (
    <Modal.Root opened={opened} onClose={onCancel} centered size={420} zIndex={10000}>
      <Modal.Overlay backgroundOpacity={0.65} blur={6} />
      <Modal.Content
        radius={18}
        styles={{
          content: {
            background: "var(--card-bg, #ffffff)",
            border: "1.5px solid var(--border)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
            textAlign: "center",
          },
        }}
      >
        <Modal.Body style={{ padding: "26px 24px" }}>
          <div
            aria-hidden="true"
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(224, 49, 49, 0.12)",
              color: "#e03131",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <IconAlertTriangle size={30} stroke={2} />
          </div>
          <Modal.Title
            style={{
              margin: "0 0 8px 0",
              fontSize: 18,
              fontWeight: 800,
              lineHeight: 1.3,
              color: "var(--text, #111827)",
            }}
          >
            {t("activeTest.confirmFinishTitle", "Testni yakunlaysizmi?")}
          </Modal.Title>
          <p
            style={{
              margin: "0 0 22px 0",
              fontSize: 13.5,
              color: "var(--text-muted, #64748b)",
              lineHeight: 1.5,
            }}
          >
            {t(
              "activeTest.confirmFinishDesc",
              "Belgilanmagan savollar xato deb hisoblanadi. Rostdan ham testni yakunlamoqchimisiz?",
            )}
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              className="confirm-finish-btn"
              onClick={onCancel}
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: 12,
                border: "1.5px solid var(--border)",
                background: "var(--surface, transparent)",
                color: "var(--text, #334155)",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {t("activeTest.cancel", "Davom etish")}
            </button>
            <button
              type="button"
              className="confirm-finish-btn"
              data-autofocus
              onClick={onConfirm}
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: 12,
                border: "none",
                background: "#e03131",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(224, 49, 49, 0.3)",
                transition: "all 0.15s ease",
              }}
            >
              {t("activeTest.confirm", "Yakunlash")}
            </button>
          </div>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}
