import type { PenaltyEvent } from "../types";
import { PENALTY_RULES } from "../registry/penaltyRulesRegistry";

export function createPenaltyEvent(
  ruleCode: string,
  exerciseNumber: number,
  occurredAtSeconds: number,
  posX: number,
  posY: number
): PenaltyEvent {
  const rule = PENALTY_RULES[ruleCode] || {
    code: ruleCode,
    title: { uzl: "Qoidabuzarlik", uzc: "Қоидабузарлик", ru: "Нарушение" },
    points: 20,
    severity: "MEDIUM" as const,
    isInstantFail: false,
    explanation: { uzl: "Qoida buzildi", uzc: "Қоида бузилди", ru: "Нарушено правило" },
  };

  return {
    id: "pen_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now(),
    exerciseNumber,
    ruleCode,
    points: rule.points,
    title: rule.title,
    explanation: rule.explanation,
    occurredAtSeconds,
    posX,
    posY,
  };
}

export function calculateTotalScore(penalties: PenaltyEvent[]): {
  totalPoints: number;
  isPassed: boolean;
  hasInstantFail: boolean;
} {
  const totalPoints = penalties.reduce((sum, p) => sum + p.points, 0);
  const hasInstantFail = penalties.some((p) => {
    const rule = PENALTY_RULES[p.ruleCode];
    return rule ? rule.isInstantFail : p.points >= 100;
  });

  return {
    totalPoints,
    isPassed: totalPoints < 100 && !hasInstantFail,
    hasInstantFail,
  };
}
