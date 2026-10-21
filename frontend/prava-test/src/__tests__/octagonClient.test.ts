import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/api", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock("../services/offlineMediaManager", () => ({
  normalizeMediaPath: (p: string) => (p.startsWith("/") ? p : `/api/v1/files/${p}`),
  offlineMediaManager: { getLocalImageUrl: vi.fn(async () => null) },
}));

import { rankFromElo, normalizeRank, getRankMeta, safeName } from "../features/Octagon/rank";
import { initialsOf, radarPosition } from "../features/Octagon/layout";
import { imagePreloader } from "../features/Octagon/OctagonImagePreloader";
import { OctagonApi } from "../features/Octagon/OctagonApi";
import api from "../api/api";

describe("Octagon leagues (same scale as the server)", () => {
  it("maps ELO to the six leagues", () => {
    expect(rankFromElo(0)).toBe("bronze");
    expect(rankFromElo(49)).toBe("bronze");
    expect(rankFromElo(50)).toBe("silver");
    expect(rankFromElo(150)).toBe("gold");
    expect(rankFromElo(300)).toBe("platinum");
    expect(rankFromElo(500)).toBe("brilliant");
    expect(rankFromElo(800)).toBe("master");
    expect(rankFromElo(Number.NaN)).toBe("bronze");
  });

  it("normalises server enums and prefers ELO when given", () => {
    expect(normalizeRank("GOLD")).toBe("gold");
    expect(normalizeRank("weird")).toBe("bronze");
    expect(normalizeRank("BRILLIANT", 320)).toBe("platinum");
    expect(getRankMeta(undefined, 900).labelKey).toBe("octagon.rank.master");
  });
});

describe("Opponent identity never shows null/undefined", () => {
  it("safeName falls back for empty or literal null/undefined", () => {
    expect(safeName("Ali V.", "Raqib")).toBe("Ali V.");
    expect(safeName("  ", "Raqib")).toBe("Raqib");
    expect(safeName("null", "Raqib")).toBe("Raqib");
    expect(safeName("undefined", "Raqib")).toBe("Raqib");
    expect(safeName(undefined, "Raqib")).toBe("Raqib");
    expect(safeName(42, "Raqib")).toBe("Raqib");
  });

  it("initials: two letters for names, last digits for a masked phone", () => {
    expect(initialsOf("Ali Valiyev")).toBe("AV");
    expect(initialsOf("dilshod")).toBe("D");
    expect(initialsOf("+998 90 *** ** 12")).toBe("12");
    expect(initialsOf("")).toBe("?");
  });
});

describe("Friend radar layout", () => {
  it("puts a single result in the centre and spreads several on the ring", () => {
    expect(radarPosition(0, 1)).toEqual({ left: 50, top: 50 });
    const pts = Array.from({ length: 6 }, (_, i) => radarPosition(i, 6));
    const keys = new Set(pts.map((p) => `${p.left.toFixed(1)}:${p.top.toFixed(1)}`));
    expect(keys.size).toBe(6);
    pts.forEach((p) => {
      const r = Math.hypot(p.left - 50, p.top - 50);
      expect(r).toBeCloseTo(38, 5);
    });
    // first node at the top
    expect(pts[0].left).toBeCloseTo(50, 5);
    expect(pts[0].top).toBeCloseTo(12, 5);
  });
});

describe("Octagon image preloader", () => {
  class FakeImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    decoding = "";
    decode = () => Promise.resolve();
    set src(v: string) {
      setTimeout(() => (v.includes("broken") ? this.onerror?.() : this.onload?.()), 0);
    }
  }

  beforeEach(() => {
    vi.stubGlobal("window", globalThis);
    vi.stubGlobal("Image", FakeImage);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:octagon-1");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    imagePreloader.clear();
  });
  afterEach(() => {
    imagePreloader.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("resolves raw question paths against the API (no relative <img src>)", () => {
    const src = imagePreloader.getSrc("questions/q1.webp");
    expect(src).toMatch(/\/api\/v1\/files\/questions\/q1\.webp$/);
  });

  it("preloads every image into memory so questions render instantly", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, blob: async () => new Blob(["x"], { type: "image/webp" }) }));
    vi.stubGlobal("fetch", fetchMock);
    const paths = Array.from({ length: 10 }, (_, i) => `questions/q${i}.webp`);
    await imagePreloader.preloadImages([...paths, null, undefined, paths[0]]);
    expect(fetchMock).toHaveBeenCalledTimes(10);
    paths.forEach((p) => {
      expect(imagePreloader.getStatus(p)).toBe("ready");
      expect(imagePreloader.getSrc(p)).toBe("blob:octagon-1");
    });
  });

  it("marks failures as error and recovers with retry()", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 503 })));
    await imagePreloader.preloadImages(["questions/broken.webp"]);
    expect(imagePreloader.getStatus("questions/broken.webp")).toBe("error");

    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, blob: async () => new Blob(["x"]) })));
    await imagePreloader.retry("questions/broken.webp");
    expect(imagePreloader.getStatus("questions/broken.webp")).toBe("ready");
  });

  it("clear() releases the blob URLs it created", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, blob: async () => new Blob(["x"]) })));
    await imagePreloader.preloadImages(["questions/a.webp"]);
    imagePreloader.clear();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:octagon-1");
    expect(imagePreloader.getStatus("questions/a.webp")).toBe("idle");
  });
});

describe("Octagon API is login-only (no guest identity on the wire)", () => {
  it("requests a ticket without guestId/displayName", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { data: { ticket: "t1", expiresInSeconds: 30, userId: "7" } } });
    const res = await OctagonApi.getTicket();
    expect(api.post).toHaveBeenCalledWith("/api/v1/octagon/ticket");
    expect(res).toEqual({ ticket: "t1", expiresInSeconds: 30, userId: "7" });
  });
});
