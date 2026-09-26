import { describe, expect, it, vi } from "vitest";

vi.mock("../api/api", () => ({ default: { get: vi.fn() } }));

import {
  DEFAULT_EXAM_RULES,
  durationMinutesFor,
  durationSecondsFor,
  isExamPassed,
  maxAllowedWrong,
  normalizeExamRules,
} from "../services/examRules";

describe("examRules", () => {
  it("defaults match the agreed business rules (marathon = 1 min/question)", () => {
    expect(DEFAULT_EXAM_RULES.marathon.secondsPerQuestion).toBe(60);
    expect(DEFAULT_EXAM_RULES.real).toMatchObject({ questionCount: 20, maxWrong: 2 });
  });

  it("falls back per field on invalid server data", () => {
    const r = normalizeExamRules({ real: { questionCount: -5, maxWrong: "x" }, marathon: { secondsPerQuestion: 90 } });
    expect(r.real.questionCount).toBe(20);
    expect(r.real.maxWrong).toBe(2);
    expect(r.marathon.secondsPerQuestion).toBe(90);
    expect(normalizeExamRules(null)).toEqual({ ...DEFAULT_EXAM_RULES });
  });

  it("computes durations from question count", () => {
    expect(durationSecondsFor(20, 60)).toBe(1200);
    expect(durationMinutesFor(20, 60)).toBe(20);
  });
});

describe("maxAllowedWrong", () => {
  it("scales real.maxWrong by question count (floored)", () => {
    expect(maxAllowedWrong(20, DEFAULT_EXAM_RULES)).toBe(2);
    expect(maxAllowedWrong(10, DEFAULT_EXAM_RULES)).toBe(1);
    expect(maxAllowedWrong(50, DEFAULT_EXAM_RULES)).toBe(5);
    expect(maxAllowedWrong(15, DEFAULT_EXAM_RULES)).toBe(1);
    expect(maxAllowedWrong(5, DEFAULT_EXAM_RULES)).toBe(0);
  });
});

describe("isExamPassed", () => {
  const R = DEFAULT_EXAM_RULES;

  it("real: passes when wrong + unanswered <= allowed", () => {
    expect(isExamPassed({ mode: "real", total: 20, correct: 18, wrong: 2, unanswered: 0 }, R)).toBe(true);
    expect(isExamPassed({ mode: "real", total: 20, correct: 18, wrong: 1, unanswered: 1 }, R)).toBe(true);
    expect(isExamPassed({ mode: "real", total: 20, correct: 17, wrong: 3, unanswered: 0 }, R)).toBe(false);
    expect(isExamPassed({ mode: "real", total: 20, correct: 17, wrong: 1, unanswered: 2 }, R)).toBe(false);
    expect(isExamPassed({ mode: "real", total: 10, correct: 9, wrong: 1, unanswered: 0 }, R)).toBe(true);
    expect(isExamPassed({ mode: "real", total: 10, correct: 8, wrong: 2, unanswered: 0 }, R)).toBe(false);
  });

  it("real: unanswered ignored when unansweredCountsAsWrong=false", () => {
    const rules = normalizeExamRules({ real: { unansweredCountsAsWrong: false } });
    expect(isExamPassed({ mode: "real", total: 20, correct: 15, wrong: 2, unanswered: 3 }, rules)).toBe(true);
  });

  it("percent modes: passes at >= 90%", () => {
    for (const mode of ["ticket", "marathon", "wrong", "package"] as const) {
      expect(isExamPassed({ mode, total: 10, correct: 9, wrong: 1, unanswered: 0 }, R)).toBe(true);
      expect(isExamPassed({ mode, total: 10, correct: 8, wrong: 1, unanswered: 1 }, R)).toBe(false);
      expect(isExamPassed({ mode, total: 20, correct: 18, wrong: 0, unanswered: 2 }, R)).toBe(true);
    }
  });

  it("uses server-provided pass percent per mode", () => {
    const rules = normalizeExamRules({ marathon: { passPercent: 80 } });
    expect(isExamPassed({ mode: "marathon", total: 10, correct: 8, wrong: 2, unanswered: 0 }, rules)).toBe(true);
    expect(isExamPassed({ mode: "ticket", total: 10, correct: 8, wrong: 2, unanswered: 0 }, rules)).toBe(false);
  });

  it("empty exam never passes", () => {
    expect(isExamPassed({ mode: "ticket", total: 0, correct: 0, wrong: 0, unanswered: 0 }, R)).toBe(false);
    expect(isExamPassed({ mode: "real", total: 0, correct: 0, wrong: 0, unanswered: 0 }, R)).toBe(false);
  });
});
