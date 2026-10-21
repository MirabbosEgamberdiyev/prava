import { OCTAGON_CONFIG, type OctagonRankId } from "./types";

export interface RankMeta {
  id: OctagonRankId;
  emoji: string;
  /** i18n kaliti: octagon.rank.<id> */
  labelKey: string;
  /** Mantine rangi (Badge) */
  color: string;
  minScore: number;
}

const META: Record<OctagonRankId, Omit<RankMeta, "id" | "labelKey" | "minScore">> = {
  bronze: { emoji: "🥉", color: "orange" },
  silver: { emoji: "🥈", color: "gray" },
  gold: { emoji: "🥇", color: "yellow" },
  platinum: { emoji: "💠", color: "cyan" },
  brilliant: { emoji: "💎", color: "violet" },
  master: { emoji: "👑", color: "red" },
};

export const RANK_ORDER: OctagonRankId[] = ["bronze", "silver", "gold", "platinum", "brilliant", "master"];

/** Serverdagi OctagonRank.fromElo bilan bir xil. */
export function rankFromElo(elo: number | null | undefined): OctagonRankId {
  const value = Number.isFinite(elo) ? Number(elo) : 0;
  for (const t of OCTAGON_CONFIG.RANK_THRESHOLDS) {
    if (value >= t.minScore) return t.rank as OctagonRankId;
  }
  return "bronze";
}

/** Server "BRONZE"/"bronze"/noma'lum qiymat yuborsa ham to'g'ri liga. ELO berilsa — undan hisoblanadi. */
export function normalizeRank(rank: unknown, elo?: number | null): OctagonRankId {
  if (typeof elo === "number" && Number.isFinite(elo)) return rankFromElo(elo);
  const r = String(rank ?? "").toLowerCase() as OctagonRankId;
  return RANK_ORDER.includes(r) ? r : "bronze";
}

export function getRankMeta(rank: unknown, elo?: number | null): RankMeta {
  const id = normalizeRank(rank, elo);
  const threshold = OCTAGON_CONFIG.RANK_THRESHOLDS.find((t) => t.rank === id);
  return { id, labelKey: `octagon.rank.${id}`, minScore: threshold?.minScore ?? 0, ...META[id] };
}

const BAD_NAMES = new Set(["", "null", "undefined", "nan"]);

/** Ekranga chiqadigan ism: hech qachon "null"/"undefined"/bo'sh emas. */
export function safeName(name: unknown, fallback: string): string {
  if (typeof name !== "string") return fallback;
  const trimmed = name.trim();
  return BAD_NAMES.has(trimmed.toLowerCase()) ? fallback : trimmed;
}
