import { useEffect, useRef } from "react";

/**
 * Unified desktop keyboard shortcuts for EVERY exam type (real, ticket, marathon, survival, wrong, topic):
 *   1–9, Numpad 1–9   → select option 1..9 (digits only — letters are reserved for commands).
 *                        Questions have at most 9 options; a 10th+ option is mouse-only.
 *   Space             → next question
 *   Enter             → confirm (pending selection / dialog), otherwise next
 *   ← / →  (PgUp/PgDn) → previous / next question
 *   Esc               → close zoom / dialog, otherwise open the exit/finish confirmation
 *                        (never exits or finishes the exam without a dialog)
 *   B or Ctrl+D       → bookmark (Shift+B / Ctrl+B also accepted)
 *   Z                 → zoom image
 * Letter keys use `event.code`, so they work on Latin AND Cyrillic keyboard layouts.
 */
export type ExamShortcutAction =
  | { type: "select"; index: number }
  | { type: "prev" }
  | { type: "next" }
  | { type: "space" }
  | { type: "confirm" }
  | { type: "escape" }
  | { type: "bookmark" }
  | { type: "zoom" };

export interface ShortcutKeyEvent {
  key: string;
  code?: string;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
}

/** Highest option number reachable from the keyboard (keys 1–9). */
export const MAX_KEYBOARD_OPTIONS = 9;
const DIGIT_CODES = Array.from({ length: MAX_KEYBOARD_OPTIONS }, (_, i) => `Digit${i + 1}`);
const NUMPAD_CODES = Array.from({ length: MAX_KEYBOARD_OPTIONS }, (_, i) => `Numpad${i + 1}`);

function isLetter(e: ShortcutKeyEvent, code: string, latin: string): boolean {
  if (e.code) return e.code === code;
  return e.key === latin || e.key === latin.toUpperCase();
}

/** Pure key → action mapping (unit-tested). */
export function resolveExamShortcut(e: ShortcutKeyEvent): ExamShortcutAction | null {
  const code = e.code ?? "";
  const mod = !!(e.ctrlKey || e.metaKey);

  if (e.altKey) return null;

  // Bookmark: B, Shift+B, Ctrl/Cmd+B, Ctrl/Cmd+D
  if (isLetter(e, "KeyB", "b")) return { type: "bookmark" };
  if (mod && isLetter(e, "KeyD", "d")) return { type: "bookmark" };
  if (mod) return null; // leave other Ctrl/Cmd combos (copy, reload…) to the webview

  if (e.key === "Escape") return { type: "escape" };
  if (e.key === "Enter" || code === "NumpadEnter") return { type: "confirm" };
  if (e.key === "ArrowLeft" || e.key === "PageUp") return { type: "prev" };
  if (e.key === "ArrowRight" || e.key === "PageDown") return { type: "next" };
  if (e.key === " " || code === "Space") return { type: "space" };
  if (e.shiftKey) return null;

  if (isLetter(e, "KeyZ", "z")) return { type: "zoom" };

  // F1–F9 support (DYHXX/avtomaktab exam center keyboard standard)
  const fMatch = /^F([1-9])$/i.exec(e.key);
  if (fMatch) {
    const fIdx = parseInt(fMatch[1], 10) - 1;
    if (fIdx < MAX_KEYBOARD_OPTIONS) {
      return { type: "select", index: fIdx };
    }
  }

  let idx = DIGIT_CODES.indexOf(code);
  if (idx < 0) idx = NUMPAD_CODES.indexOf(code);
  // Numpad with NumLock off reports navigation keys but keeps the Numpad code — handled above.
  if (idx < 0 && !code && /^[1-9]$/.test(e.key)) idx = Number(e.key) - 1;
  if (idx >= 0) return { type: "select", index: idx };
  return null;
}

export interface ExamShortcutHandlers {
  onSelect?: (index: number) => void;
  onPrev?: () => void;
  onNext?: () => void;
  onSpace?: () => void;
  onConfirm?: () => void;
  onEscape?: () => void;
  onBookmark?: () => void;
  onZoom?: () => void;
}

export function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || !el.tagName) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || !!el.isContentEditable;
}

function isKeyboardFocusedButton(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || el.tagName !== "BUTTON") return false;
  try {
    return el.matches(":focus-visible");
  } catch {
    return false;
  }
}

/** Attach the unified exam shortcuts while `enabled` is true. Handlers may change every render. */
export function useExamShortcuts(enabled: boolean, handlers: ExamShortcutHandlers): void {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || isEditableTarget(e.target)) return;
      const action = resolveExamShortcut(e);
      if (!action) return;
      // Keyboard-focused button (Tab navigation): let Enter/Space activate it natively.
      if ((action.type === "confirm" || action.type === "space") && isKeyboardFocusedButton(e.target)) return;
      const h = ref.current;
      const run = (fn?: () => void, allowRepeat = false) => {
        if (!fn) return;
        e.preventDefault();
        if (e.repeat && !allowRepeat) return;
        fn();
      };
      switch (action.type) {
        case "select":
          run(h.onSelect ? () => h.onSelect!(action.index) : undefined);
          break;
        case "prev":
          run(h.onPrev, true);
          break;
        case "next":
          run(h.onNext, true);
          break;
        case "space":
          run(h.onSpace ?? h.onNext);
          break;
        case "confirm":
          run(h.onConfirm);
          break;
        case "escape":
          run(h.onEscape);
          break;
        case "bookmark":
          run(h.onBookmark);
          break;
        case "zoom":
          run(h.onZoom);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}
