import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/api", () => ({ default: { get: vi.fn(), post: vi.fn() } }));

import { pollTelegramSession, type TelegramSessionStatusResponse } from "../auth/telegramSession";

describe("pollTelegramSession", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("keeps polling while PENDING and fires onFinal exactly once on APPROVED", async () => {
    const replies: TelegramSessionStatusResponse[] = [
      { status: "PENDING" },
      { status: "PENDING" },
      { status: "APPROVED", accessToken: "a", refreshToken: "r" },
      { status: "CONSUMED" },
    ];
    const check = vi.fn(async () => replies.shift() as TelegramSessionStatusResponse);
    const onFinal = vi.fn();
    pollTelegramSession({ token: "auth_x", pollSecret: "s", intervalMs: 100, onFinal, check });
    await vi.advanceTimersByTimeAsync(1000);
    expect(onFinal).toHaveBeenCalledTimes(1);
    expect(onFinal.mock.calls[0][0].status).toBe("APPROVED");
    expect(check).toHaveBeenCalledTimes(3);
  });

  it("survives transient errors and stops after a terminal REJECTED", async () => {
    let n = 0;
    const check = vi.fn(async () => {
      n++;
      if (n === 1) throw new Error("network");
      return { status: "REJECTED" } as TelegramSessionStatusResponse;
    });
    const onFinal = vi.fn();
    pollTelegramSession({ token: "t", pollSecret: "s", intervalMs: 100, onFinal, check });
    await vi.advanceTimersByTimeAsync(1000);
    expect(onFinal).toHaveBeenCalledWith({ status: "REJECTED" });
    expect(check).toHaveBeenCalledTimes(2);
  });

  it("never calls back after stop()", async () => {
    const onFinal = vi.fn();
    const stop = pollTelegramSession({
      token: "t",
      pollSecret: "s",
      intervalMs: 100,
      onFinal,
      check: async () => ({ status: "APPROVED", accessToken: "a" }),
    });
    stop();
    await vi.advanceTimersByTimeAsync(500);
    expect(onFinal).not.toHaveBeenCalled();
  });
});
