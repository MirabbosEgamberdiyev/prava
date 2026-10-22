import { describe, expect, it } from "vitest";
import { eloUnchangedReason, forfeitNote, formatDuration, leagueProgress, preloadProgress } from "../features/Octagon/arena";
import { OCTAGON_CONFIG } from "../features/Octagon/types";

describe("Lobby league ladder (same thresholds as the server)", () => {
  it("progress inside a league and ELO left to the next one", () => {
    expect(leagueProgress(0)).toEqual({ current: "bronze", next: "silver", pct: 0, toNext: 50 });
    expect(leagueProgress(25)).toEqual({ current: "bronze", next: "silver", pct: 50, toNext: 25 });
    expect(leagueProgress(150)).toEqual({ current: "gold", next: "platinum", pct: 0, toNext: 150 });
    expect(leagueProgress(346)).toMatchObject({ current: "platinum", next: "brilliant", toNext: 154 });
  });

  it("master is the top league; bad input falls back to bronze", () => {
    expect(leagueProgress(950)).toEqual({ current: "master", next: null, pct: 100, toNext: 0 });
    expect(leagueProgress(Number.NaN).current).toBe("bronze");
    expect(leagueProgress(-20).current).toBe("bronze");
  });
});

describe("Result screen", () => {
  it("time spent as m:ss", () => {
    expect(formatDuration(135)).toBe("2:15");
    expect(formatDuration(9)).toBe("0:09");
    expect(formatDuration(null)).toBe("0:00");
  });

  it("explains an unchanged ELO only when a loss hits the 0 floor", () => {
    expect(eloUnchangedReason(0, 0, false, false)).toBe("floor");
    expect(eloUnchangedReason(0, 40, false, false)).toBeNull();
    expect(eloUnchangedReason(-12, 0, false, false)).toBeNull();
    expect(eloUnchangedReason(0, 0, true, false)).toBeNull();
    expect(eloUnchangedReason(0, 0, false, true)).toBeNull();
  });
});

describe("VS preload bar", () => {
  it("counts ready/failed images; questions without images are ready", () => {
    expect(preloadProgress(["ready", "loading", null, "error"])).toEqual({ done: 3, total: 4, pct: 75 });
    expect(preloadProgress([])).toEqual({ done: 0, total: 0, pct: 0 });
  });
});

describe("Flow timings", () => {
  it("rematch wait and stale-match window are bounded", () => {
    expect(OCTAGON_CONFIG.REMATCH_WAIT_SEC).toBe(30);
    expect(OCTAGON_CONFIG.STALE_MATCH_IGNORE_MS).toBeGreaterThan(OCTAGON_CONFIG.MATCH_START_PRELOAD_MS);
  });
});

describe("Forfeit note (who left and why)", () => {
  it("self leave / self timeout / opponent leave / opponent timeout; old server = opponent timeout", () => {
    expect(forfeitNote({ forfeit: false })).toBeNull();
    expect(forfeitNote({ forfeit: true, forfeitByMe: true, forfeitReason: "LEFT" })).toBe("selfLeft");
    expect(forfeitNote({ forfeit: true, forfeitByMe: true, forfeitReason: "DISCONNECT" })).toBe("selfTimeout");
    expect(forfeitNote({ forfeit: true, forfeitByMe: false, forfeitReason: "LEFT" })).toBe("oppLeft");
    expect(forfeitNote({ forfeit: true })).toBe("oppTimeout");
  });
});
