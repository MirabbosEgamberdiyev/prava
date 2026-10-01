/**
 * PRAVA ONLINE — DYNAMIC BHM (Bazaviy hisoblash miqdori) UTILITY
 * Zero magic numbers: fine amounts, multipliers, and fees are calculated dynamically.
 */
import { formatAmount } from "../utils/formatMoney";

// O'zbekiston Respublikasida amaldagi bazaviy hisoblash miqdori (BHM)
export const DEFAULT_BHM = 375_000;
const BHM_STORAGE_KEY = "prava_current_bhm_v1";

let cachedBhm: number | null = null;

export function getBhmValue(): number {
  if (cachedBhm !== null) return cachedBhm;
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(BHM_STORAGE_KEY) : null;
    if (raw) {
      const parsed = Number(raw);
      if (Number.isFinite(parsed) && parsed > 0) {
        cachedBhm = parsed;
        return cachedBhm;
      }
    }
  } catch {
    // fallback to default
  }
  return DEFAULT_BHM;
}

export function setBhmValue(val: number): void {
  if (Number.isFinite(val) && val > 0) {
    cachedBhm = val;
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(BHM_STORAGE_KEY, String(val));
      }
    } catch {
      // ignore
    }
  }
}

/**
 * Jarima summasini hisoblash (so'mda)
 * formula: fine.bhm_multiplier * config.current_bhm
 */
export function calculateFineAmount(multiplier: number, bhm = getBhmValue()): number {
  return Math.round(multiplier * bhm);
}

/**
 * Formatlangan jarima summasi
 * Masalan: "1 875 000 so'm (5 BHM)"
 */
export function formatBhmFine(multiplier: number, bhm = getBhmValue(), lang = "uzl"): string {
  const sum = calculateFineAmount(multiplier, bhm);
  const formattedSum = formatAmount(sum, lang);
  if (lang === "ru") {
    return `${formattedSum} сум (${multiplier} БРВ)`;
  }
  if (lang === "uzc") {
    return `${formattedSum} сўм (${multiplier} БҲМ)`;
  }
  return `${formattedSum} so'm (${multiplier} BHM)`;
}
