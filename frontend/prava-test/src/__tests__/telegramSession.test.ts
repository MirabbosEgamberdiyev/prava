import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/api", () => ({ default: { get: vi.fn(), post: vi.fn() } }));

import { pollTelegramSession, type TelegramSessionStatusResponse } from "../auth/telegramSession";
import { OctagonGuest } from "../features/Octagon/guestIdentity";

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

describe("OctagonGuest identity", () => {
  const store = new Map<string, string>();
  beforeEach(() => {
    store.clear();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("ignores legacy client-generated guest ids (they are not credentials any more)", () => {
    store.set("octagon_guest_id", "guest_ab12cd34");
    expect(OctagonGuest.getToken()).toBeUndefined();
  });

  it("stores and returns the server-signed token and the public id", () => {
    OctagonGuest.save("g1.0123456789abcdef.SIG", "guest_0123456789abcdef");
    expect(OctagonGuest.getToken()).toBe("g1.0123456789abcdef.SIG");
    expect(OctagonGuest.getPublicId()).toBe("guest_0123456789abcdef");
  });

  it("guest pass = chosen nickname", () => {
    expect(OctagonGuest.hasPass()).toBe(false);
    store.set("octagon_guest_nickname", "Tezkor_Pilot_123");
    expect(OctagonGuest.hasPass()).toBe(true);
  });

  it("does not throw when storage is blocked", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });
    expect(OctagonGuest.getToken()).toBeUndefined();
    expect(() => OctagonGuest.save("g1.x.y", "guest_x")).not.toThrow();
  });
});
