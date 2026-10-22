/**
 * 4 katakli PIN kiritish mantig'i (komponentdan ajratilgan — testlanadi).
 * Qiymat har doim bo'shliqsiz raqamlar ketma-ketligi: "", "4", "48", … "4821".
 */

export function sanitizePin(raw: string, length: number): string {
  return raw.replace(/\D/g, "").slice(0, length);
}

/** Katakka raqam(lar) yozildi: bitta raqam — shu katak, bir nechta (paste/avto-to'ldirish) — shu katakdan boshlab. */
export function pinAfterInput(value: string, index: number, typed: string, length: number): { value: string; focus: number } {
  const digits = typed.replace(/\D/g, "");
  if (!digits) return { value, focus: index };
  const at = Math.min(index, value.length);
  if (digits.length > 1) {
    const next = sanitizePin(value.slice(0, at) + digits, length);
    return { value: next, focus: Math.min(next.length, length - 1) };
  }
  const next = sanitizePin(value.slice(0, at) + digits + value.slice(at + 1), length);
  return { value: next, focus: Math.min(at + 1, length - 1) };
}

/** Backspace: to'la katakni tozalaydi, bo'sh katakda — oldingisini o'chirib, unga o'tadi. */
export function pinAfterBackspace(value: string, index: number): { value: string; focus: number } {
  if (index < value.length) return { value: value.slice(0, index) + value.slice(index + 1), focus: index };
  if (index > 0) return { value: value.slice(0, index - 1) + value.slice(index), focus: index - 1 };
  return { value, focus: 0 };
}
