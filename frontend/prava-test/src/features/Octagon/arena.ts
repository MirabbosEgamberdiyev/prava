import { OCTAGON_CONFIG, type LeaderboardEntry, type OctagonRankId, type OpponentProgress } from "./types";

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

/** 135 → "2:15" (natija ekranidagi sarflangan vaqt). */
export function formatDuration(totalSec: number | null | undefined): string {
  const s = Math.max(0, Math.floor(Number.isFinite(totalSec) ? Number(totalSec) : 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export interface LeagueProgress {
  current: OctagonRankId;
  /** Keyingi liga (Master'da — null). */
  next: OctagonRankId | null;
  /** Joriy ligadagi yo'l, 0..100. */
  pct: number;
  /** Keyingi ligagacha qolgan ELO. */
  toNext: number;
}

/** Lobby liga zinapoyasi: server OctagonRank chegaralari bilan bir xil (0 / 50 / 150 / 300 / 500 / 800). */
export function leagueProgress(elo: number | null | undefined): LeagueProgress {
  const value = Math.max(0, Number.isFinite(elo) ? Number(elo) : 0);
  const asc = [...OCTAGON_CONFIG.RANK_THRESHOLDS].sort((a, b) => a.minScore - b.minScore);
  let idx = 0;
  for (let i = 0; i < asc.length; i++) if (value >= asc[i].minScore) idx = i;
  const cur = asc[idx];
  const nxt = asc[idx + 1];
  if (!nxt) return { current: cur.rank as OctagonRankId, next: null, pct: 100, toNext: 0 };
  const span = nxt.minScore - cur.minScore;
  return {
    current: cur.rank as OctagonRankId,
    next: nxt.rank as OctagonRankId,
    pct: Math.round(((value - cur.minScore) / span) * 100),
    toNext: nxt.minScore - value,
  };
}

/**
 * ELO o'zgarmaganining sababi (biznes qoidalari bo'yicha): mag'lubiyatda reyting 0 dan pastga tushmaydi.
 * Boshqa holatda null — o'zgarish bor yoki tushuntirish kerak emas.
 */
export function eloUnchangedReason(delta: number | null | undefined, newElo: number | null | undefined, isWin: boolean, isDraw: boolean): "floor" | null {
  if (delta !== 0 || isWin || isDraw) return null;
  return newElo === 0 ? "floor" : null;
}

/** VS ekrani: rasmlar oldindan yuklanishi (rasmsiz savollar tayyor hisoblanadi). */
export function preloadProgress(statuses: Array<"idle" | "loading" | "ready" | "error" | null>): { done: number; total: number; pct: number } {
  const total = statuses.length;
  if (total === 0) return { done: 0, total: 0, pct: 0 };
  const done = statuses.filter((st) => st === null || st === "ready" || st === "error").length;
  return { done, total, pct: Math.round((done / total) * 100) };
}

export type ForfeitNote = "selfLeft" | "selfTimeout" | "oppLeft" | "oppTimeout";

/** Texnik natija izohi: o'zim chiqdim / 45 s qaytmadim / raqib chiqdi / raqib qaytmadi (eski server — oppTimeout). */
export function forfeitNote(r: { forfeit?: boolean; forfeitByMe?: boolean; forfeitReason?: string | null }): ForfeitNote | null {
  if (!r.forfeit) return null;
  const left = r.forfeitReason === "LEFT";
  if (r.forfeitByMe) return left ? "selfLeft" : "selfTimeout";
  return left ? "oppLeft" : "oppTimeout";
}
