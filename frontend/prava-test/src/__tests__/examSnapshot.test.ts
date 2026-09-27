import { describe, expect, it } from "vitest";
import {
  EXPIRED_GRACE_MS,
  buildExamLoaderKey,
  clearExamSnapshot,
  evaluateSnapshot,
  readExamSnapshot,
  remainingSecondsUntil,
  shouldReloadExam,
  snapshotStorageKey,
  writeExamSnapshot,
  type ExamLoaderKeyParts,
} from "../services/examSnapshot";

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

describe("W-01: exam loader key (language switch must not reload the exam)", () => {
  const base: ExamLoaderKeyParts = { mode: "exam", userId: 5, questionCount: 20 };

  it("is identical before and after a language change", () => {
    // Sahifa kalitni har renderda qayta quradi; til o'zgarganda qo'shimcha
    // (UI) maydonlar o'zgaradi — kalit esa o'zgarmasligi kerak.
    const beforeSwitch = buildExamLoaderKey({ ...base, lang: "uzl" } as ExamLoaderKeyParts);
    const afterSwitch = buildExamLoaderKey({ ...base, lang: "ru" } as ExamLoaderKeyParts);
    expect(afterSwitch).toBe(beforeSwitch);
    expect(shouldReloadExam(beforeSwitch, afterSwitch)).toBe(false);
  });

  it("changes when the exam itself changes", () => {
    const k20 = buildExamLoaderKey(base);
    expect(shouldReloadExam(k20, buildExamLoaderKey({ ...base, questionCount: 40 }))).toBe(true);
    expect(shouldReloadExam(k20, buildExamLoaderKey({ ...base, userId: 6 }))).toBe(true);
    expect(
      shouldReloadExam(
        buildExamLoaderKey({ mode: "ticket", userId: 5, ticketId: 3 }),
        buildExamLoaderKey({ mode: "ticket", userId: 5, ticketId: 4 }),
      ),
    ).toBe(true);
    expect(shouldReloadExam(null, k20)).toBe(true);
  });
});

describe("W-07: exam snapshot", () => {
  const now = 1_700_000_000_000;
  const scope = buildExamLoaderKey({ mode: "ticket", userId: 1, ticketId: 7 });
  const snap = {
    kind: "ticket" as const,
    scope,
    sessionId: 42,
    questions: [{ id: 1 }, { id: 2 }, { id: 3 }],
    answers: { 0: { selected: 1, correct: 1 } },
    current: 1,
    deadline: now + 90_000,
    startedAt: now - 60_000,
  };

  it("round-trips an active snapshot with the remaining time from the absolute deadline", () => {
    const storage = memoryStorage();
    expect(writeExamSnapshot(snap, storage)).toBe(true);
    const res = readExamSnapshot("ticket", scope, now + 30_000, storage);
    expect(res.status).toBe("active");
    if (res.status !== "active") return;
    expect(res.remainingSeconds).toBe(60);
    expect(res.snapshot.sessionId).toBe(42);
    expect(res.snapshot.current).toBe(1);
    expect(res.snapshot.answers).toEqual(snap.answers);
  });

  it("reports an expired snapshot (to be finished, not resumed) within the grace period", () => {
    const res = evaluateSnapshot(JSON.stringify({ v: 1, ...snap }), { kind: "ticket", scope }, snap.deadline + 5_000);
    expect(res.status).toBe("expired");
  });

  it("discards snapshots that are too old, corrupt or belong to another exam", () => {
    const storage = memoryStorage();
    writeExamSnapshot(snap, storage);
    expect(readExamSnapshot("ticket", scope, snap.deadline + EXPIRED_GRACE_MS + 1, storage).status).toBe("none");
    expect(storage.map.has(snapshotStorageKey("ticket"))).toBe(false);

    writeExamSnapshot(snap, storage);
    const otherScope = buildExamLoaderKey({ mode: "ticket", userId: 1, ticketId: 8 });
    expect(readExamSnapshot("ticket", otherScope, now, storage).status).toBe("none");

    storage.setItem(snapshotStorageKey("exam"), "{not json");
    expect(readExamSnapshot("exam", "x", now, storage).status).toBe("none");
    expect(storage.map.has(snapshotStorageKey("exam"))).toBe(false);
  });

  it("clamps an out-of-range current index", () => {
    const res = evaluateSnapshot(
      JSON.stringify({ v: 1, ...snap, current: 99 }),
      { kind: "ticket", scope },
      now,
    );
    expect(res.status === "active" && res.snapshot.current).toBe(2);
  });

  it("clear removes the snapshot and missing storage is tolerated", () => {
    const storage = memoryStorage();
    writeExamSnapshot(snap, storage);
    clearExamSnapshot("ticket", storage);
    expect(storage.map.size).toBe(0);
    expect(readExamSnapshot("ticket", scope, now, null).status).toBe("none");
    expect(writeExamSnapshot(snap, null)).toBe(false);
  });

  it("remainingSecondsUntil never goes negative", () => {
    expect(remainingSecondsUntil(now - 1, now)).toBe(0);
    expect(remainingSecondsUntil(now + 1_001, now)).toBe(2);
  });
});
