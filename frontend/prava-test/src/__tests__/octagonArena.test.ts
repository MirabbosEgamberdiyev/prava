import { describe, expect, it } from "vitest";
import {
  accuracyPercent,
  buildMyTrack,
  buildOppTrack,
  createFloodGate,
  formatClock,
  formatMatchDate,
  nextOppResults,
  podiumOrder,
} from "../features/Octagon/arena";
import { OCTAGON_CONFIG } from "../features/Octagon/types";

describe("Arena HUD", () => {
  it("formats the match clock as mm:ss", () => {
    expect(formatClock(300)).toBe("05:00");
    expect(formatClock(284)).toBe("04:44");
    expect(formatClock(5)).toBe("00:05");
    expect(formatClock(-3)).toBe("00:00");
    expect(formatClock(Number.NaN)).toBe("00:00");
  });

  it("result accuracy: 8/10 → 80%", () => {
    expect(accuracyPercent(8, 10)).toBe(80);
    expect(accuracyPercent(0, 10)).toBe(0);
    expect(accuracyPercent(3, 0)).toBe(0);
    expect(accuracyPercent(12, 10)).toBe(100);
  });
});

describe("10-segment tracks", () => {
  it("my track: server answer_result colours each answered question", () => {
    const track = buildMyTrack([11, 12, 13, 14], { 11: 0, 12: 2, 13: 1 }, { 11: true, 12: false });
    expect(track).toEqual(["correct", "wrong", "answered", null]);
  });

  it("opponent track: correctness derived from consecutive opponent_progress events", () => {
    let results: Array<boolean | null> = [];
    let prev = { questionIndex: 0, answeredCount: 0, correctCount: 0 };
    const steps = [
      { questionIndex: 0, answeredCount: 1, correctCount: 1 },
      { questionIndex: 1, answeredCount: 2, correctCount: 1 },
      { questionIndex: 2, answeredCount: 3, correctCount: 2 },
    ];
    for (const next of steps) {
      results = nextOppResults(results, prev, next);
      prev = next;
    }
    expect(buildOppTrack(5, prev.answeredCount, results)).toEqual(["correct", "wrong", "correct", null, null]);
  });

  it("a jump after reconnect stays neutral (order of correct answers is unknown)", () => {
    const results = nextOppResults([true], { questionIndex: 0, answeredCount: 1, correctCount: 1 }, {
      questionIndex: 3,
      answeredCount: 4,
      correctCount: 3,
    });
    expect(buildOppTrack(5, 4, results)).toEqual(["correct", "answered", "answered", "answered", null]);
  });

  it("duplicate progress events do not change the track", () => {
    const p = { questionIndex: 0, answeredCount: 1, correctCount: 1 };
    expect(nextOppResults([true], p, p)).toEqual([true]);
  });
});

describe("Reaction anti-flood (more than 3 in 1.5 s → 8 s mute)", () => {
  const gate = () =>
    createFloodGate(OCTAGON_CONFIG.REACTION_FLOOD_LIMIT, OCTAGON_CONFIG.REACTION_COOLDOWN_MS, OCTAGON_CONFIG.REACTION_MUTE_MS);

  it("allows 3 quick reactions and mutes the 4th for 8 seconds", () => {
    const g = gate();
    expect(g.hit(0)).toBe(true);
    expect(g.hit(300)).toBe(true);
    expect(g.hit(600)).toBe(true);
    expect(g.hit(900)).toBe(false);
    expect(g.mutedUntil()).toBe(8900);
    expect(g.hit(5000)).toBe(false);
    expect(g.hit(8900)).toBe(true);
  });

  it("slow reactions are never muted", () => {
    const g = gate();
    for (let t = 0; t < 20000; t += 600) expect(g.hit(t)).toBe(true);
  });

  it("reset clears the mute for a new match", () => {
    const g = gate();
    [0, 1, 2, 3].forEach((t) => g.hit(t));
    g.reset();
    expect(g.hit(10)).toBe(true);
  });
});

describe("History date in the user's language", () => {
  const d = new Date(2026, 9, 21, 18, 45);
  it("uzl / uzc / ru", () => {
    expect(formatMatchDate(d, "uzl")).toBe("21-okt, 18:45");
    expect(formatMatchDate(d, "uzc")).toBe("21-окт, 18:45");
    expect(formatMatchDate(d, "ru")).toBe("21 окт, 18:45");
    expect(formatMatchDate("2026-01-05T09:07:00", "uzl")).toBe("5-yan, 09:07");
  });
  it("bad or missing dates render nothing", () => {
    expect(formatMatchDate(null, "uzl")).toBe("");
    expect(formatMatchDate("not-a-date", "uzl")).toBe("");
  });
});

describe("Leaderboard podium", () => {
  it("orders the top three as 2nd, 1st, 3rd", () => {
    const e = [1, 2, 3, 4].map((position) => ({ position }));
    expect(podiumOrder(e).map((x) => x.position)).toEqual([2, 1, 3]);
    expect(podiumOrder(e.slice(0, 2)).map((x) => x.position)).toEqual([2, 1]);
    expect(podiumOrder(e.slice(0, 1)).map((x) => x.position)).toEqual([1]);
  });
});

describe("Config mirrors the server", () => {
  it("350 ms answer guard, 45 s grace, radar widening before the 7 s bot", () => {
    expect(OCTAGON_CONFIG.ANSWER_INPUT_GUARD_MS).toBe(350);
    expect(OCTAGON_CONFIG.RECONNECT_GRACE_PERIOD_SEC).toBe(45);
    expect(OCTAGON_CONFIG.RADAR_WIDEN_AFTER_SEC).toBeLessThan(7);
  });
});
