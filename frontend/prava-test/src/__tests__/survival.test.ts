import { describe, expect, it } from "vitest";
import {
  applySurvivalAnswer,
  createSurvivalState,
  freshFromBatch,
  parseBest,
  readSurvivalBest,
  shouldPrefetch,
  shuffle,
  survivalBestKey,
  writeSurvivalBest,
  type BestStorage,
} from "../page/Survival/logic";

function memoryStorage(initial: Record<string, string> = {}): BestStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v;
    },
  };
}

describe("survival state", () => {
  it("starts with zero streak and the stored best", () => {
    expect(createSurvivalState(7)).toEqual({ streak: 0, best: 7, startBest: 7, ended: false, newRecord: false });
    expect(createSurvivalState(-3).best).toBe(0);
  });

  it("increments streak on correct answers and ends on the first mistake", () => {
    let s = createSurvivalState(0);
    s = applySurvivalAnswer(s, true);
    s = applySurvivalAnswer(s, true);
    expect(s.streak).toBe(2);
    expect(s.ended).toBe(false);
    s = applySurvivalAnswer(s, false);
    expect(s.ended).toBe(true);
    expect(s.streak).toBe(2);
  });

  it("ignores answers after the run ended", () => {
    const ended = applySurvivalAnswer(createSurvivalState(0), false);
    expect(applySurvivalAnswer(ended, true)).toBe(ended);
  });

  it("raises best and flags a new record only when the previous best is beaten", () => {
    let s = createSurvivalState(2);
    s = applySurvivalAnswer(s, true);
    s = applySurvivalAnswer(s, true);
    expect(s.best).toBe(2);
    expect(s.newRecord).toBe(false); // equal is not a record
    s = applySurvivalAnswer(s, true);
    expect(s.best).toBe(3);
    expect(s.newRecord).toBe(true);
    s = applySurvivalAnswer(s, false);
    expect(s.newRecord).toBe(true);
    expect(s.best).toBe(3);
  });
});

describe("survival best storage", () => {
  it("uses a per-user key", () => {
    expect(survivalBestKey(42)).toBe("prava_survival_best_42");
  });

  it("parses stored values defensively", () => {
    expect(parseBest(null)).toBe(0);
    expect(parseBest("")).toBe(0);
    expect(parseBest("abc")).toBe(0);
    expect(parseBest("-5")).toBe(0);
    expect(parseBest("12.9")).toBe(12);
    expect(parseBest("15")).toBe(15);
  });

  it("reads and writes only higher values", () => {
    const st = memoryStorage({ prava_survival_best_1: "10" });
    expect(readSurvivalBest(st, 1)).toBe(10);
    expect(readSurvivalBest(st, 2)).toBe(0);
    expect(writeSurvivalBest(st, 1, 5)).toBe(10);
    expect(st.data.prava_survival_best_1).toBe("10");
    expect(writeSurvivalBest(st, 1, 11)).toBe(11);
    expect(st.data.prava_survival_best_1).toBe("11");
  });

  it("survives missing or throwing storage", () => {
    const broken: BestStorage = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("quota");
      },
    };
    expect(readSurvivalBest(broken, 1)).toBe(0);
    expect(readSurvivalBest(null, 1)).toBe(0);
    expect(() => writeSurvivalBest(broken, 1, 3)).not.toThrow();
    expect(writeSurvivalBest(undefined, 1, 3)).toBe(3);
  });
});

describe("survival batches", () => {
  it("shuffle keeps all items and does not mutate the input", () => {
    const src = [1, 2, 3, 4, 5];
    const out = shuffle(src, () => 0);
    expect(src).toEqual([1, 2, 3, 4, 5]);
    expect([...out].sort()).toEqual(src);
  });

  it("drops already-seen and duplicate questions", () => {
    const batch = [{ id: 1 }, { id: 2 }, { id: 2 }, { id: 3 }, { id: 4 }];
    const fresh = freshFromBatch(batch, new Set([1, 3]));
    expect(fresh.map((q) => q.id).sort()).toEqual([2, 4]);
  });

  it("returns an empty list when everything was seen (pool exhausted)", () => {
    expect(freshFromBatch([{ id: 1 }, { id: 2 }], new Set([1, 2]))).toEqual([]);
  });

  it("prefetches when the queue is running low", () => {
    expect(shouldPrefetch(0, 100, false)).toBe(false);
    expect(shouldPrefetch(95, 100, false)).toBe(true);
    expect(shouldPrefetch(95, 100, true)).toBe(false);
  });
});
