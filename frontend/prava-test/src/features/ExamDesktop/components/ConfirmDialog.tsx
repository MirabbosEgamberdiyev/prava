import { memo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { IconAlertTriangle } from "@tabler/icons-react";
import { resolveDialogKey } from "../logic";

export interface ConfirmDialogAction {
  id: string;
  label: string;
  variant?: "default" | "primary" | "danger";
  onClick: () => void;
}

interface ConfirmDialogProps {
  title: string;
  description: string;
  /** Buttons in visual order. */
  actions: ConfirmDialogAction[];
  /** Action focused when the dialog opens — must be the NON-destructive one (defaults to the first). */
  defaultFocusId?: string;
  /** Esc / click on the backdrop. */
  onCancel: () => void;
}

/**
 * Fluent-style confirmation dialog with its own keyboard handling (capture phase, so the exam
 * shortcuts never see these keys):
 *  - Esc cancels;
 *  - Enter / Space activate only the FOCUSED button (focus starts on the safe option);
 *  - auto-repeat and Enter within DIALOG_ENTER_GUARD_MS of opening are ignored (double-Enter guard);
 *  - Tab / arrows move focus between the buttons (focus is trapped inside the dialog).
 */
export const ConfirmDialog = memo(function ConfirmDialog({
  title,
  description,
  actions,
  defaultFocusId,
  onCancel,
}: ConfirmDialogProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;
  const defaultFocusRef = useRef(defaultFocusId);

  useEffect(() => {
    const openedAt = Date.now();
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const buttons = () =>
      Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>("button[data-dialog-action]") ?? []);
    const initial =
      buttons().find((b) => b.dataset.dialogAction === defaultFocusRef.current) ?? buttons()[0] ?? null;
    initial?.focus();

    const onKey = (e: KeyboardEvent) => {
      const intent = resolveDialogKey(e, Date.now() - openedAt);
      if (intent === "pass") return;
      e.preventDefault();
      e.stopPropagation();
      const list = buttons();
      const idx = list.indexOf(document.activeElement as HTMLButtonElement);
      switch (intent) {
        case "cancel":
          onCancelRef.current();
          break;
        case "activate":
          if (idx >= 0) list[idx].click();
          break;
        case "focus-next":
          if (list.length) list[(idx + 1 + list.length) % list.length].focus();
          break;
        case "focus-prev":
          if (list.length) list[(idx - 1 + list.length) % list.length].focus();
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      try {
        previouslyFocused?.focus?.();
      } catch {
        // ignore
      }
    };
  }, []);

  return createPortal(
    <div className="xd-dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div
        ref={rootRef}
        className="xd-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="xd-dialog-title"
        aria-describedby="xd-dialog-desc"
      >
        <div className="xd-dialog__icon" aria-hidden="true">
          <IconAlertTriangle size={24} />
        </div>
        <h2 id="xd-dialog-title" className="xd-dialog__title">
          {title}
        </h2>
        <p id="xd-dialog-desc" className="xd-dialog__desc">
          {description}
        </p>
        <div className="xd-dialog__actions">
          {actions.map((a) => (
            <button
              key={a.id}
              type="button"
              data-dialog-action={a.id}
              className={`xd-btn${a.variant === "danger" ? " xd-btn--danger" : a.variant === "primary" ? " xd-btn--primary" : ""}`}
              onClick={a.onClick}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
});

export default ConfirmDialog;
