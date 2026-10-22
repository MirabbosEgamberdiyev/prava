import type { LeaderboardEntry, OpponentProgress } from "./types";

/** Bitta trek katagi: javob to'g'ri, xato, javob berilgan (natija noma'lum — qayta ulanishdan keyin) yoki hali yo'q. */
export type TrackCell = "correct" | "wrong" | "answered" | null;

/** 284 → "04:44" (arena taymeri). */
export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(Number.isFinite(totalSec) ? totalSec : 0));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** 8 to'g'ri / 10 → 80 (natija ekranidagi aniqlik). */
export function accuracyPercent(correct: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.round((Math.max(0, Math.min(correct, total)) / total) * 100);
}

/** Mening trekim: savollar tartibida — javob bergan bo'lsam server natijasi (yashil/qizil). */
export function buildMyTrack(
  questionIds: number[],
  answers: Record<number, number>,
  results: Record<number, boolean>
): TrackCell[] {
  return questionIds.map((id) => {
    if (answers[id] === undefined) return null;
    if (results[id] === undefined) return "answered";
    return results[id] ? "correct" : "wrong";
  });
}

/**
 * Raqib har javob berganda server opponent_progress yuboradi (answeredCount, correctCount). Ketma-ket
 * ikki xabar farqidan shu javob to'g'ri yoki xato ekani aniqlanadi — raqib savollarni tartib bilan yechadi.
 * Bir nechta javob birdaniga kelsa (qayta ulanish) natijasi noma'lum qoladi ("answered").
 */
export function nextOppResults(
  results: Array<boolean | null>,
  prev: OpponentProgress,
  next: OpponentProgress
): Array<boolean | null> {
  const out = results.slice();
  const added = next.answeredCount - prev.answeredCount;
  if (added === 1) {
    out[next.answeredCount - 1] = next.correctCount > prev.correctCount;
  } else if (added > 1) {
    for (let i = prev.answeredCount; i < next.answeredCount; i++) if (out[i] === undefined) out[i] = null;
  }
  return out;
}

export function buildOppTrack(total: number, answeredCount: number, results: Array<boolean | null>): TrackCell[] {
  return Array.from({ length: total }, (_, i) => {
    if (i >= answeredCount) return null;
    const r = results[i];
    if (r === true) return "correct";
    if (r === false) return "wrong";
    return "answered";
  });
}

/**
 * Reaksiya spam filtri: windowMs ichida limit tadan ko'p bosilsa muteMs davomida jim (1.5 s / 3 ta / 8 s).
 * hit() — ruxsat bo'lsa true.
 */
export function createFloodGate(limit: number, windowMs: number, muteMs: number) {
  let hits: number[] = [];
  let mutedUntil = 0;
  return {
    hit(now: number): boolean {
      if (now < mutedUntil) return false;
      hits = hits.filter((t) => now - t < windowMs);
      hits.push(now);
      if (hits.length > limit) {
        mutedUntil = now + muteMs;
        hits = [];
        return false;
      }
      return true;
    },
    mutedUntil: () => mutedUntil,
    reset() {
      hits = [];
      mutedUntil = 0;
    },
  };
}

const MONTHS: Record<string, string[]> = {
  uzl: ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"],
  uzc: ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"],
  ru: ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"],
};

/** Jang sanasi foydalanuvchi tilida: "21-okt, 18:45" / "21-окт, 18:45" / "21 окт, 18:45". */
export function formatMatchDate(value: string | number | Date | null | undefined, lang: string): string {
  if (value === null || value === undefined || value === "") return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const key = lang === "ru" ? "ru" : lang === "uzc" ? "uzc" : "uzl";
  const month = MONTHS[key][d.getMonth()];
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return key === "ru" ? `${d.getDate()} ${month}, ${time}` : `${d.getDate()}-${month}, ${time}`;
}

/** Podium: [2-o'rin, 1-o'rin, 3-o'rin] — birinchi o'rin markazda va eng baland. */
export function podiumOrder<T extends Pick<LeaderboardEntry, "position">>(entries: T[]): T[] {
  const top = entries.slice(0, 3);
  if (top.length < 2) return top;
  return top.length === 2 ? [top[1], top[0]] : [top[1], top[0], top[2]];
}
