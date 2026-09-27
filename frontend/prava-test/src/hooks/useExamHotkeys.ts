import { useEffect, useRef } from "react";

/**
 * Barcha test runner'lar (Imtihon, Bilet, Marafon, Xatolar, Paket, Survival)
 * uchun yagona klaviatura boshqaruvi.
 *
 *  - 1–5            → variant tanlash (A–D harflari ham 1–4 ga mos, `e.code` orqali
 *                     — kirill klaviaturasida ham ishlaydi);
 *  - ← / →          → oldingi / keyingi savol;
 *  - Enter          → keyingi / tasdiqlash (`onEnter`);
 *  - Space          → `onSpace` (masalan, izohni ochish), faqat berilgan bo'lsa;
 *  - Ctrl/Meta/Alt, avtomatik takror (`e.repeat`), F1–F12 — e'tiborsiz qoldiriladi
 *    (brauzer yordam/yangilash tugmalari o'g'irlanmaydi);
 *  - fokus input/textarea/select/contenteditable da bo'lsa — hech narsa qilinmaydi;
 *    fokus tugmada bo'lsa Enter/Space tugmaning o'ziga qoldiriladi;
 *  - Mantine modal/menyu ochiq bo'lsa — hech narsa qilinmaydi.
 */
export type ExamHotkeyAction =
  | { type: "select"; index: number }
  | { type: "prev" }
  | { type: "next" }
  | { type: "enter" }
  | { type: "space" };

export interface HotkeyEventLike {
  key: string;
  code?: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  repeat?: boolean;
}

export interface HotkeyContext {
  /** Joriy savoldagi variantlar soni (bilinmasa 5). */
  optionCount?: number;
  /** Fokusdagi element turi. */
  focus?: "text" | "button" | "other";
  /** Modal / menyu / popup ochiq. */
  overlayOpen?: boolean;
}

const LETTER_CODES: Record<string, number> = { KeyA: 0, KeyB: 1, KeyC: 2, KeyD: 3 };
const DIGIT_CODES: Record<string, number> = {
  Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4,
  Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3, Numpad5: 4,
};

/** Sof funksiya: klaviatura hodisasini amalga aylantiradi (yoki `null`). */
export function resolveExamHotkey(e: HotkeyEventLike, ctx: HotkeyContext = {}): ExamHotkeyAction | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  if (e.repeat) return null;
  if (ctx.overlayOpen) return null;
  if (ctx.focus === "text") return null;
  if (/^F\d{1,2}$/.test(e.key)) return null;

  const optionCount = ctx.optionCount ?? 5;
  let index: number | undefined;
  if (/^[1-5]$/.test(e.key)) index = Number(e.key) - 1;
  else if (e.code && e.code in DIGIT_CODES) index = DIGIT_CODES[e.code];
  else if (e.code && e.code in LETTER_CODES) index = LETTER_CODES[e.code];
  if (index !== undefined) {
    return index < optionCount ? { type: "select", index } : null;
  }

  if (e.key === "ArrowLeft") return { type: "prev" };
  if (e.key === "ArrowRight") return { type: "next" };
  if (e.key === "Enter") return ctx.focus === "button" ? null : { type: "enter" };
  if (e.key === " " || e.code === "Space") return ctx.focus === "button" ? null : { type: "space" };
  return null;
}

function focusKind(target: EventTarget | null): HotkeyContext["focus"] {
  const el = target as HTMLElement | null;
  if (!el || typeof el.tagName !== "string") return "other";
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable) return "text";
  if (tag === "BUTTON" || tag === "A" || el.getAttribute?.("role") === "button") return "button";
  return "other";
}

/** Mantine Modal/Drawer/Menu/Popover ochiqligini DOM orqali aniqlaydi. */
export function isOverlayOpen(): boolean {
  if (typeof document === "undefined") return false;
  return Boolean(
    document.querySelector(
      '[role="dialog"][aria-modal="true"], .mantine-Modal-content, .mantine-Drawer-content, .mantine-Menu-dropdown, [role="menu"]',
    ),
  );
}

export interface ExamHotkeyHandlers {
  onSelect?: (index: number) => void;
  onPrev?: () => void;
  onNext?: () => void;
  onEnter?: () => void;
  onSpace?: () => void;
}

export interface UseExamHotkeysOptions extends ExamHotkeyHandlers {
  enabled: boolean;
  optionCount?: number;
  /** Qo'shimcha to'siq (masalan, o'z modal holatingiz). */
  blocked?: boolean;
}

export function useExamHotkeys(opts: UseExamHotkeysOptions): void {
  const ref = useRef(opts);
  useEffect(() => {
    ref.current = opts;
  });

  const { enabled } = opts;
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      const o = ref.current;
      if (o.blocked) return;
      const action = resolveExamHotkey(e, {
        optionCount: o.optionCount,
        focus: focusKind(e.target),
        overlayOpen: isOverlayOpen(),
      });
      if (!action) return;
      let fn: (() => void) | undefined;
      switch (action.type) {
        case "select":
          if (o.onSelect) fn = () => o.onSelect!(action.index);
          break;
        case "prev":
          fn = o.onPrev;
          break;
        case "next":
          fn = o.onNext;
          break;
        case "enter":
          fn = o.onEnter;
          break;
        case "space":
          fn = o.onSpace;
          break;
      }
      if (!fn) return;
      e.preventDefault();
      fn();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled]);
}
