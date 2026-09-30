/**
 * Pass/fail for STORED exam records (history, statistics, result pages).
 *
 * New records persist `mode`, `passed`, `wrong`, `unanswered` (plus total / correct) at the time
 * the exam finished, so later rule changes never re-grade old attempts. Older records only have
 * score / total / correct / exam_type: for those the outcome is derived with the unified
 * `isExamPassed` rule; when the mode cannot be recognised we fall back to
 * `percent >= ticket passPercent`.
 */
import { getExamRules, isExamPassed, type ExamMode, type ExamRules } from "./examRules";

export interface StoredExamRecordLike {
  /** Persisted verdict (new records). */
  passed?: boolean | null;
  mode?: ExamMode | string | null;
  /** Legacy/raw exam type: "exam", "EXAM", "ticket_12", "MARATHON", "wrong_exam"… */
  examType?: string | null;
  total?: number | null;
  correct?: number | null;
  wrong?: number | null;
  unanswered?: number | null;
  /** Percent 0..100 (used when total/correct are missing). */
  score?: number | null;
}

export interface ResolvedExamOutcome {
  mode: ExamMode | null;
  total: number;
  correct: number;
  wrong: number;
  unanswered: number;
  percent: number;
  passed: boolean;
}

const MODES: readonly ExamMode[] = ["real", "ticket", "marathon", "wrong", "package"];

/** Map every exam-type spelling used by the app / server to the unified mode. */
export function examModeFromType(examType: string | null | undefined): ExamMode | null {
  if (!examType) return null;
  const s = String(examType).trim().toLowerCase();
  if ((MODES as readonly string[]).includes(s)) return s as ExamMode;
  if (s === "exam" || s === "real_exam" || s === "official") return "real";
  if (s === "ticket" || /^ticket_\d+$/.test(s)) return "ticket";
  if (s === "marathon" || s === "marafon" || s === "topic" || /^topic_\d+$/.test(s)) return "marathon";
  if (s === "wrong_exam" || s === "wrong_answers" || s === "wrong_practice") return "wrong";
  if (s === "package" || /^package_\d+$/.test(s)) return "package";
  return null;
}

function nonNeg(v: unknown): number | null {
  const n = typeof v === "number" ? v : v == null ? NaN : Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function resolveExamOutcome(
  rec: StoredExamRecordLike,
  rules: ExamRules = getExamRules()
): ResolvedExamOutcome {
  const mode =
    (typeof rec.mode === "string" && (MODES as readonly string[]).includes(rec.mode)
      ? (rec.mode as ExamMode)
      : null) ?? examModeFromType(rec.examType);
  const score = nonNeg(rec.score);
  const total = Math.round(nonNeg(rec.total) ?? 0);
  const correct = Math.min(total || Infinity, Math.round(nonNeg(rec.correct) ?? (total > 0 && score != null ? (score * total) / 100 : 0)));
  const unanswered = Math.round(nonNeg(rec.unanswered) ?? 0);
  const wrong = Math.round(nonNeg(rec.wrong) ?? Math.max(0, total - correct - unanswered));
  const percent = total > 0 ? Math.round((correct / total) * 100) : Math.round(score ?? 0);

  let passed: boolean;
  if (typeof rec.passed === "boolean") passed = rec.passed;
  else if (mode && total > 0) passed = isExamPassed({ mode, total, correct, wrong, unanswered }, rules);
  else passed = percent >= rules.ticket.passPercent;

  return { mode, total, correct, wrong, unanswered, percent, passed };
}

/** Shorthand for the `ExamResult` rows returned by desktopAdapter.getExamHistory(). */
export function isExamResultPassed(
  r: {
    passed?: boolean | null;
    mode?: string | null;
    exam_type?: string | null;
    total_questions?: number | null;
    correct_answers?: number | null;
    wrong_answers?: number | null;
    unanswered?: number | null;
    score?: number | null;
  },
  rules: ExamRules = getExamRules()
): boolean {
  return resolveExamOutcome(
    {
      passed: r.passed,
      mode: r.mode,
      examType: r.exam_type,
      total: r.total_questions,
      correct: r.correct_answers,
      wrong: r.wrong_answers,
      unanswered: r.unanswered,
      score: r.score,
    },
    rules
  ).passed;
}

/** Pass threshold (percent) to display for a mode; the real exam is judged by mistakes instead. */
export function passPercentForMode(mode: ExamMode | null, rules: ExamRules = getExamRules()): number {
  return mode === "marathon" ? rules.marathon.passPercent : rules.ticket.passPercent;
}
