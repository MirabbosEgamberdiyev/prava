/**
 * "Xatogacha marafon" (Survival) — sof o'yin mantiqi (React/brauzerga bog'liq emas,
 * vitest bilan node muhitida tekshiriladi).
 *
 *  - seriya (streak) har to'g'ri javobda +1, birinchi xatoda o'yin tugaydi;
 *  - eng yaxshi natija (best) foydalanuvchi bo'yicha localStorage'da saqlanadi;
 *  - savollar partiyalab (batch) olinadi — oldin ko'rilgan savollar qayta chiqmaydi.
 */

export interface SurvivalState {
  /** Joriy seriya — ketma-ket to'g'ri javoblar soni. */
  streak: number;
  /** Eng yaxshi natija (joriy seriya bilan birga yangilanadi). */
  best: number;
  /** O'yin boshlanganidagi eng yaxshi natija — "yangi rekord" shu bilan solishtiriladi. */
  startBest: number;
  /** Xato qilindi — o'yin tugadi. */
  ended: boolean;
  /** Joriy seriya avvalgi rekorddan oshdi. */
  newRecord: boolean;
}

export function createSurvivalState(best: number): SurvivalState {
  const b = sanitizeBest(best);
  return { streak: 0, best: b, startBest: b, ended: false, newRecord: false };
}

/** Javobdan keyingi holat. Tugagan o'yinga javob qo'shilmaydi. */
export function applySurvivalAnswer(state: SurvivalState, correct: boolean): SurvivalState {
  if (state.ended) return state;
  if (!correct) return { ...state, ended: true };
  const streak = state.streak + 1;
  return {
    ...state,
    streak,
    best: Math.max(state.best, streak),
    newRecord: state.newRecord || streak > state.startBest,
  };
}

// ── Eng yaxshi natija (localStorage) ─────────────────────────────────────────

export function survivalBestKey(userId: number): string {
  return `prava_survival_best_${userId}`;
}

function sanitizeBest(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/** Saqlangan qiymatni o'qiydi: noto'g'ri / bo'sh / manfiy qiymat — 0. */
export function parseBest(raw: string | null | undefined): number {
  if (raw == null || raw.trim() === "") return 0;
  return sanitizeBest(raw);
}

export interface BestStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** Storage mavjud bo'lmasa yoki xato bersa (private rejim, kvota) — 0. */
export function readSurvivalBest(storage: BestStorage | null | undefined, userId: number): number {
  if (!storage) return 0;
  try {
    return parseBest(storage.getItem(survivalBestKey(userId)));
  } catch {
    return 0;
  }
}

/**
 * Faqat kattaroq qiymatni yozadi (boshqa tabda o'rnatilgan rekord ustidan
 * kichigi yozilmaydi). Yozilgan (yoki mavjud) eng yaxshi qiymatni qaytaradi.
 */
export function writeSurvivalBest(storage: BestStorage | null | undefined, userId: number, best: number): number {
  const value = sanitizeBest(best);
  if (!storage) return value;
  try {
    const current = parseBest(storage.getItem(survivalBestKey(userId)));
    if (value <= current) return current;
    storage.setItem(survivalBestKey(userId), String(value));
  } catch {
    // saqlab bo'lmadi — o'yin davom etadi
  }
  return value;
}

// ── Savollar partiyasi ───────────────────────────────────────────────────────

/** Fisher–Yates (yangi massiv qaytaradi). */
export function shuffle<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Yangi partiyadan faqat hali ko'rilmagan (va partiya ichida takrorlanmagan)
 * savollarni aralashtirib qaytaradi. `seen` o'zgartirilmaydi.
 */
export function freshFromBatch<T extends { id: number }>(
  batch: readonly T[],
  seen: ReadonlySet<number>,
  rng: () => number = Math.random,
): T[] {
  const taken = new Set<number>();
  const fresh: T[] = [];
  for (const q of batch) {
    if (!q || typeof q.id !== "number" || seen.has(q.id) || taken.has(q.id)) continue;
    taken.add(q.id);
    fresh.push(q);
  }
  return shuffle(fresh, rng);
}

/** Navbatda qolgan savollar shu sondan kam bo'lsa — keyingi partiya oldindan yuklanadi. */
export const PREFETCH_THRESHOLD = 5;

export function shouldPrefetch(current: number, queueLength: number, exhausted: boolean): boolean {
  return !exhausted && queueLength - (current + 1) < PREFETCH_THRESHOLD;
}
