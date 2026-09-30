import { useEffect, useState } from "react";
import api from "../api/api";

/**
 * Imtihon qoidalari — yagona manba: `GET /api/v1/public/exam-rules`.
 *
 * Bir marta yuklanadi (modul darajasidagi promise kesh). Tarmoq bo'lmasa yoki
 * endpoint hali mavjud bo'lmasa, quyidagi DEFAULT qiymatlar ishlatiladi —
 * ular backend bilan kelishilgan biznes qoidasining aynan nusxasi.
 */
export interface ExamRules {
  version: number | string;
  real: {
    questionCount: number;
    secondsPerQuestion: number;
    maxWrong: number;
    unansweredCountsAsWrong: boolean;
  };
  ticket: { secondsPerQuestion: number; passPercent: number };
  marathon: { secondsPerQuestion: number; passPercent: number };
}

export const DEFAULT_EXAM_RULES: ExamRules = {
  version: 0,
  real: {
    questionCount: 20,
    secondsPerQuestion: 60,
    maxWrong: 3,
    unansweredCountsAsWrong: true,
  },
  ticket: { secondsPerQuestion: 60, passPercent: 90 },
  marathon: { secondsPerQuestion: 60, passPercent: 90 },
};

const posNum = (v: unknown, fallback: number): number =>
  typeof v === "number" && Number.isFinite(v) && v > 0 ? v : fallback;
const nonNegNum = (v: unknown, fallback: number): number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : fallback;

type Partialish = {
  version?: unknown;
  real?: Record<string, unknown>;
  ticket?: Record<string, unknown>;
  marathon?: Record<string, unknown>;
};

/** Server javobini tekshirib, yetishmayotgan maydonlarni default bilan to'ldiradi. */
export function normalizeExamRules(raw: unknown): ExamRules {
  const d = DEFAULT_EXAM_RULES;
  const r = (raw && typeof raw === "object" ? raw : {}) as Partialish;
  const real = r.real ?? {};
  const ticket = r.ticket ?? {};
  const marathon = r.marathon ?? {};
  return {
    version:
      typeof r.version === "number" || typeof r.version === "string" ? r.version : d.version,
    real: {
      questionCount: posNum(real.questionCount, d.real.questionCount),
      secondsPerQuestion: posNum(real.secondsPerQuestion, d.real.secondsPerQuestion),
      maxWrong: nonNegNum(real.maxWrong, d.real.maxWrong),
      unansweredCountsAsWrong:
        typeof real.unansweredCountsAsWrong === "boolean"
          ? real.unansweredCountsAsWrong
          : d.real.unansweredCountsAsWrong,
    },
    ticket: {
      secondsPerQuestion: posNum(ticket.secondsPerQuestion, d.ticket.secondsPerQuestion),
      passPercent: posNum(ticket.passPercent, d.ticket.passPercent),
    },
    marathon: {
      secondsPerQuestion: posNum(marathon.secondsPerQuestion, d.marathon.secondsPerQuestion),
      passPercent: posNum(marathon.passPercent, d.marathon.passPercent),
    },
  };
}

let cachedRules: ExamRules | null = null;
let rulesPromise: Promise<ExamRules> | null = null;

/** Qoidalarni bir marta yuklaydi; xatoda default qaytaradi (hech qachon reject qilmaydi). */
export function fetchExamRules(): Promise<ExamRules> {
  if (cachedRules) return Promise.resolve(cachedRules);
  if (!rulesPromise) {
    rulesPromise = api
      .get("/api/v1/public/exam-rules", { timeout: 5000 })
      .then((res) => {
        const body = res.data as { data?: unknown } | undefined;
        // ApiResponse envelope ({ success, data }) yoki to'g'ridan-to'g'ri obyekt
        const payload =
          body && typeof body === "object" && "data" in body && body.data && typeof body.data === "object"
            ? body.data
            : body;
        cachedRules = normalizeExamRules(payload);
        return cachedRules;
      })
      .catch(() => {
        // Offline / endpoint yo'q — keyingi chaqiruvda qayta urinib ko'rish uchun
        // promise keshini tozalaymiz, hozircha default qaytaramiz.
        rulesPromise = null;
        return DEFAULT_EXAM_RULES;
      });
  }
  return rulesPromise;
}

export type ExamRulesMode = "real" | "ticket" | "marathon";
export const MAX_EXAM_QUESTION_COUNT = 100;

/** Sinxron o'qish: yuklangan bo'lsa server qoidalari, aks holda default. */
export function getExamRulesSync(): ExamRules {
  return cachedRules ?? DEFAULT_EXAM_RULES;
}
export const getExamRules = getExamRulesSync;
export const loadExamRules = fetchExamRules;

export function secondsPerQuestion(mode: ExamRulesMode, rules: ExamRules = getExamRulesSync()): number {
  return (rules[mode] as any)?.secondsPerQuestion ?? 60;
}

/** Savollar soni × savolga ajratilgan soniya → umumiy soniya. */
export function durationSecondsFor(
  arg1: ExamRulesMode | number,
  arg2: number,
  rules: ExamRules = getExamRulesSync()
): number {
  if (typeof arg1 === "string") {
    const sec = (rules[arg1] as any)?.secondsPerQuestion ?? 60;
    return Math.max(1, Math.round(arg2 * sec));
  }
  return Math.max(0, Math.round(arg1 * arg2));
}

/** Backend `durationMinutes` maydoni uchun (butun daqiqa, kamida 1). */
export function durationMinutesFor(
  arg1: ExamRulesMode | number,
  arg2: number,
  rules: ExamRules = getExamRulesSync()
): number {
  return Math.max(1, Math.ceil(durationSecondsFor(arg1 as any, arg2, rules) / 60));
}

export function clampExamQuestionCount(raw: unknown, rules: ExamRules = getExamRulesSync()): number {
  const n = typeof raw === "number" ? raw : raw == null || raw === "" ? NaN : Number(raw);
  if (!Number.isFinite(n) || n < 1) return rules.real.questionCount;
  return Math.min(MAX_EXAM_QUESTION_COUNT, Math.floor(n));
}

/** React hook: darhol default/kesh qiymatini beradi, server javobi kelganda yangilanadi. */
export function useExamRules(): ExamRules {
  const [rules, setRules] = useState<ExamRules>(getExamRulesSync);
  useEffect(() => {
    let alive = true;
    void fetchExamRules().then((r) => {
      if (alive) setRules(r);
    });
    return () => {
      alive = false;
    };
  }, []);
  return rules;
}

/* ─────────────────────── O'tdi / o'tmadi (yagona qoida) ─────────────────────── */

/** Natija qaysi rejimga tegishli. */
export type ExamMode = "real" | "ticket" | "marathon" | "wrong" | "package";

export interface ExamOutcome {
  mode: ExamMode;
  /** Jami savollar soni. */
  total: number;
  correct: number;
  wrong: number;
  unanswered: number;
}

/**
 * Real imtihonda ruxsat etilgan maksimal xato soni:
 * `floor(real.maxWrong × count / real.questionCount)`.
 */
export function maxAllowedWrong(count: number, rules: ExamRules = getExamRulesSync()): number {
  const base = Math.max(1, rules.real.questionCount);
  return Math.floor((rules.real.maxWrong * Math.max(0, count)) / base);
}
export const maxWrongFor = maxAllowedWrong;

/** Foizli rejimlar uchun o'tish chegarasi (%). */
export function passPercentFor(mode: ExamMode, rules: ExamRules = getExamRulesSync()): number {
  return mode === "marathon" ? rules.marathon.passPercent : rules.ticket.passPercent;
}

/**
 * Barcha platformalar uchun yagona o'tdi/o'tmadi qoidasi.
 *  - real: (xato + javobsiz) ≤ floor(real.maxWrong × count / real.questionCount)
 *    (`unansweredCountsAsWrong=false` bo'lsa faqat xatolar sanaladi);
 *  - ticket / marathon / wrong / package: foiz ≥ passPercent.
 * Savol bo'lmasa — o'tmagan.
 */
export function isExamPassed(outcome: ExamOutcome, rules: ExamRules = getExamRulesSync()): boolean {
  const total = Math.max(0, Math.round(outcome.total));
  if (total <= 0) return false;
  const correct = Math.max(0, outcome.correct);
  const wrong = Math.max(0, outcome.wrong);
  const unanswered = Math.max(0, outcome.unanswered);

  if (outcome.mode === "real") {
    const mistakes = wrong + (rules.real.unansweredCountsAsWrong ? unanswered : 0);
    return mistakes <= maxAllowedWrong(total, rules);
  }
  const percent = (correct / total) * 100;
  return percent >= passPercentFor(outcome.mode, rules);
}

/* ─────────────── Saqlangan natijalar (tarix/statistika) uchun ─────────────── */

/** Tarixdagi `exam_type` qiymatini (server: "EXAM"/"TICKET"/…, lokal: "exam"/"ticket_5"/…) rejimga o'giradi. */
export function modeFromExamType(examType: string | null | undefined): ExamMode {
  const tp = String(examType ?? "").trim().toLowerCase();
  if (tp === "exam" || tp === "real" || tp === "secure" || tp.startsWith("exam_") || tp === "official") return "real";
  if (tp.startsWith("marathon") || tp === "marafon") return "marathon";
  if (tp.startsWith("wrong")) return "wrong";
  if (tp.startsWith("package")) return "package";
  return "ticket";
}

export interface StoredResultLike {
  exam_type?: string | null;
  total_questions?: number | null;
  correct_answers?: number | null;
  score?: number | null;
  /** Saqlangan paytdagi aniq natija (yangi yozuvlarda bor). */
  passed?: boolean | null;
}

/**
 * W-04: tarixdagi natija o'tganmi. Yangi yozuvlarda saqlangan `passed` ishlatiladi;
 * eski yozuvlar uchun — rejimga mos yagona qoida (isExamPassed). Savollar soni
 * noma'lum bo'lsa, foiz (`score`) bo'yicha bilet/marafon chegarasi.
 */
export function isStoredResultPassed(r: StoredResultLike, rules: ExamRules = getExamRulesSync()): boolean {
  if (typeof r.passed === "boolean") return r.passed;
  const mode = modeFromExamType(r.exam_type);
  const total = Math.max(0, Math.round(Number(r.total_questions) || 0));
  const correct = Math.max(0, Math.round(Number(r.correct_answers) || 0));
  if (total > 0) {
    return isExamPassed({ mode, total, correct, wrong: Math.max(0, total - correct), unanswered: 0 }, rules);
  }
  const score = Number(r.score);
  return Number.isFinite(score) && score >= passPercentFor(mode === "real" ? "ticket" : mode, rules);
}
