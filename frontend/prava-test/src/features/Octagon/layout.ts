/** Oktagon UI'ning sof (testlanadigan) yordamchilari. */

/** Radarda ko'rsatiladigan eng ko'p profil (qolganlari pastdagi ro'yxatda). */
export const RADAR_MAX = 8;

/** i-chi nuqtaning radar aylanasidagi joyi (foizlarda, markaz 50/50, birinchisi tepada). */
export function radarPosition(index: number, count: number): { left: number; top: number } {
  const n = Math.max(1, count);
  const angle = (-90 + (360 / n) * index) * (Math.PI / 180);
  const radius = n === 1 ? 0 : 38;
  return { left: 50 + radius * Math.cos(angle), top: 50 + radius * Math.sin(angle) };
}

/** "Ali Valiyev" → "AV", "+998 90 *** ** 12" → "12", "Ali" → "A". */
export function initialsOf(name: string): string {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, " ").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (/^\d/.test(words[0])) return words[words.length - 1].slice(-2);
  const first = words[0].charAt(0);
  const second = words.length > 1 ? words[1].charAt(0) : "";
  return (first + second).toUpperCase();
}
