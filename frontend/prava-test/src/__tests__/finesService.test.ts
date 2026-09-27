import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/api", () => ({ default: { get: vi.fn() } }));

import api from "../api/api";
import {
  FINES_CACHE_KEY,
  FINES_ENDPOINT,
  FINES_FRESH_MS,
  clearFinesCache,
  computeBhmAmount,
  fetchFines,
  formatAmountRange,
  formatMoney,
  getFineAmountRange,
  parseFinesPayload,
  pickFineText,
  type TrafficFine,
} from "../services/finesService";

const get = api.get as unknown as ReturnType<typeof vi.fn>;

// Node test muhitida localStorage yo'q — oddiy xotira implementatsiyasi.
function installLocalStorage() {
  const store = new Map<string, string>();
  const ls = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
  vi.stubGlobal("localStorage", ls);
  return store;
}

const BHM = { amount: 375000, effectiveFrom: "2024-08-01" };

function fine(overrides: Partial<TrafficFine> = {}): TrafficFine {
  return {
    id: 1,
    articleCode: "128",
    title: { uzl: "Tezlikni oshirish", uzc: "", en: "Speeding", ru: "Превышение скорости" },
    bhmMin: 1,
    sortOrder: 1,
    ...overrides,
  };
}

function envelope(fines: TrafficFine[], version = "abc123") {
  return { success: true, message: "OK", data: { bhm: BHM, version, fines } };
}

function ok(body: unknown, etag: string | null = '"v1"') {
  return { status: 200, data: body, headers: etag ? { etag } : {} };
}

function networkError() {
  return Object.assign(new Error("Network Error"), { code: "ERR_NETWORK", isAxiosError: true });
}

// Intl bo'shliqlari (NBSP / NNBSP) muhitga qarab farq qiladi — oddiy bo'shliqqa keltiramiz.
const norm = (s: string) => s.replace(/\s/g, " ");

describe("fine amount computation", () => {
  it("multiplies BHM count by the BHM amount", () => {
    expect(computeBhmAmount(1, 375000)).toBe(375000);
    expect(computeBhmAmount(5, 375000)).toBe(1875000);
    expect(computeBhmAmount(0.5, 375000)).toBe(187500);
    expect(computeBhmAmount(0.3, 375000.0)).toBe(112500);
  });

  it("computes a range from bhmMin/bhmMax when the server gives no amounts", () => {
    expect(getFineAmountRange(fine({ bhmMin: 5, bhmMax: 10 }), BHM)).toEqual({ min: 1875000, max: 3750000 });
    expect(getFineAmountRange(fine({ bhmMin: 2 }), BHM)).toEqual({ min: 750000, max: null });
  });

  it("prefers server amountMin/amountMax over the computed values", () => {
    const f = fine({ bhmMin: 5, bhmMax: 10, amountMin: 1800000, amountMax: 3600000 });
    expect(getFineAmountRange(f, BHM)).toEqual({ min: 1800000, max: 3600000 });
    // faqat amountMin — max bhmMax'dan hisoblanadi
    expect(getFineAmountRange(fine({ bhmMin: 5, bhmMax: 10, amountMin: 1 }), BHM)).toEqual({ min: 1, max: 3750000 });
  });

  it("collapses a degenerate range (max <= min) to a single amount", () => {
    expect(getFineAmountRange(fine({ bhmMin: 3, bhmMax: 3 }), BHM)).toEqual({ min: 1125000, max: null });
  });
});

describe("money formatting per locale", () => {
  it("uses the locale currency word", () => {
    expect(norm(formatMoney(375000, "uzl"))).toMatch(/^375[ ,.]?000 so'm$/);
    expect(norm(formatMoney(375000, "uzc"))).toMatch(/^375[ ,.]?000 сўм$/);
    expect(norm(formatMoney(375000, "ru"))).toBe("375 000 сум");
  });

  it("formats a range with the currency once", () => {
    expect(norm(formatAmountRange({ min: 1875000, max: 3750000 }, "ru"))).toBe("1 875 000 – 3 750 000 сум");
    expect(norm(formatAmountRange({ min: 375000, max: null }, "ru"))).toBe("375 000 сум");
  });

  it("falls back to uzl for unknown languages", () => {
    expect(formatMoney(1000, "en")).toMatch(/so'm$/);
  });
});

describe("localized text", () => {
  it("transliterates uzl when uzc is empty", () => {
    expect(pickFineText({ uzl: "Tezlik", uzc: "" }, "uzc")).toBe("Тезлик");
    expect(pickFineText({ uzl: "Tezlik", uzc: "Тезлик!" }, "uzc")).toBe("Тезлик!");
  });

  it("falls back to uzl for ru and handles missing text", () => {
    expect(pickFineText({ uzl: "Tezlik" }, "ru")).toBe("Tezlik");
    expect(pickFineText(null, "uzl")).toBe("");
  });
});

describe("payload parsing", () => {
  it("returns an empty list as-is (no invented data)", () => {
    const p = parseFinesPayload(envelope([]));
    expect(p).toEqual({ bhm: BHM, version: "abc123", fines: [] });
  });

  it("sorts by sortOrder and drops malformed rows", () => {
    const p = parseFinesPayload(
      envelope([fine({ id: 2, sortOrder: 5 }), fine({ id: 1, sortOrder: 1 }), { id: 3 } as unknown as TrafficFine]),
    );
    expect(p?.fines.map((f) => f.id)).toEqual([1, 2]);
  });

  it("rejects payloads without a numeric BHM", () => {
    expect(parseFinesPayload({ data: { bhm: {}, fines: [] } })).toBeNull();
    expect(parseFinesPayload(null)).toBeNull();
  });
});

describe("fetchFines cache / ETag behaviour", () => {
  let store: Map<string, string>;

  beforeEach(() => {
    get.mockReset();
    store = installLocalStorage();
    clearFinesCache();
    vi.useRealTimers();
  });

  it("requests silently (no global toast) and without If-None-Match on first load", async () => {
    get.mockResolvedValueOnce(ok(envelope([fine()])));
    const res = await fetchFines();
    expect(res.source).toBe("network");
    expect(res.data.fines).toHaveLength(1);
    const [url, config] = get.mock.calls[0];
    expect(url).toBe(FINES_ENDPOINT);
    expect(config.silent).toBe(true);
    expect(config.headers["If-None-Match"]).toBeUndefined();
    expect(config.validateStatus(304)).toBe(true);
    expect(config.validateStatus(500)).toBe(false);
    const saved = JSON.parse(store.get(FINES_CACHE_KEY)!);
    expect(saved.etag).toBe('"v1"');
    expect(saved.version).toBe("abc123");
  });

  it("serves fresh memory cache without a network call", async () => {
    get.mockResolvedValueOnce(ok(envelope([fine()])));
    await fetchFines();
    const res = await fetchFines();
    expect(res.source).toBe("memory");
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("sends If-None-Match when stale and reuses the cached copy on 304", async () => {
    vi.useFakeTimers();
    get.mockResolvedValueOnce(ok(envelope([fine()])));
    await fetchFines();
    vi.advanceTimersByTime(FINES_FRESH_MS + 1);

    get.mockResolvedValueOnce({ status: 304, data: "", headers: {} });
    const res = await fetchFines();
    expect(get).toHaveBeenCalledTimes(2);
    expect(get.mock.calls[1][1].headers["If-None-Match"]).toBe('"v1"');
    expect(res.source).toBe("not-modified");
    expect(res.stale).toBe(false);
    expect(res.data.fines).toHaveLength(1);
    vi.useRealTimers();
  });

  it("force=true revalidates even when the cache is fresh and replaces data on a new version", async () => {
    get.mockResolvedValueOnce(ok(envelope([fine()], "v-old"), '"old"'));
    await fetchFines();
    get.mockResolvedValueOnce(ok(envelope([fine(), fine({ id: 2, sortOrder: 2 })], "v-new"), '"new"'));
    const res = await fetchFines({ force: true });
    expect(get.mock.calls[1][1].headers["If-None-Match"]).toBe('"old"');
    expect(res.data.version).toBe("v-new");
    expect(res.data.fines).toHaveLength(2);
    expect(JSON.parse(store.get(FINES_CACHE_KEY)!).etag).toBe('"new"');
  });

  it("restores from localStorage after a reload (memory cleared)", async () => {
    get.mockResolvedValueOnce(ok(envelope([fine()])));
    await fetchFines();
    const persisted = store.get(FINES_CACHE_KEY)!;
    clearFinesCache();
    store.set(FINES_CACHE_KEY, persisted);

    const res = await fetchFines();
    expect(res.source).toBe("memory");
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("returns the cached copy marked stale when offline", async () => {
    get.mockResolvedValueOnce(ok(envelope([fine()])));
    await fetchFines();
    get.mockRejectedValueOnce(networkError());
    const res = await fetchFines({ force: true });
    expect(res.stale).toBe(true);
    expect(res.source).toBe("storage");
    expect(res.data.fines).toHaveLength(1);
  });

  it("propagates the error when offline without any cache", async () => {
    const err = networkError();
    get.mockRejectedValueOnce(err);
    await expect(fetchFines()).rejects.toBe(err);
  });

  it("refetches unconditionally when the server answers 304 without a cache", async () => {
    get.mockResolvedValueOnce({ status: 304, data: "", headers: {} });
    get.mockResolvedValueOnce(ok(envelope([])));
    const res = await fetchFines();
    expect(get).toHaveBeenCalledTimes(2);
    expect(res.data.fines).toEqual([]);
  });

  it("dedupes concurrent requests", async () => {
    get.mockResolvedValueOnce(ok(envelope([fine()])));
    const [a, b] = await Promise.all([fetchFines(), fetchFines()]);
    expect(get).toHaveBeenCalledTimes(1);
    expect(a.data).toBe(b.data);
  });
});
