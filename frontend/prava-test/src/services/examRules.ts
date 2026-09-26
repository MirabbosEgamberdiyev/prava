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
    maxWrong: 2,
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

/** Sinxron o'qish: yuklangan bo'lsa server qoidalari, aks holda default. */
export function getExamRulesSync(): ExamRules {
  return cachedRules ?? DEFAULT_EXAM_RULES;
}

/** Savollar soni × savolga ajratilgan soniya → umumiy soniya. */
export function durationSecondsFor(questionCount: number, secondsPerQuestion: number): number {
  return Math.max(0, Math.round(questionCount * secondsPerQuestion));
}

/** Backend `durationMinutes` maydoni uchun (butun daqiqa, kamida 1). */
export function durationMinutesFor(questionCount: number, secondsPerQuestion: number): number {
  return Math.max(1, Math.ceil((questionCount * secondsPerQuestion) / 60));
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
