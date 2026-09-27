import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/api", () => ({ default: { get: vi.fn() } }));

import api from "../api/api";
import { curriculumApi } from "../services/curriculumApi";
import { pickLocalized, formatLocalizedNumber } from "../data/curriculumLocale";

const get = api.get as unknown as ReturnType<typeof vi.fn>;

function networkError() {
  return Object.assign(new Error("Network Error"), { code: "ERR_NETWORK", isAxiosError: true });
}

function serverError() {
  return Object.assign(new Error("Request failed with status code 500"), {
    isAxiosError: true,
    response: { status: 500 },
  });
}

describe("curriculumApi getters propagate errors (no silent empty data)", () => {
  beforeEach(() => {
    get.mockReset();
  });

  const calls: Array<[string, () => Promise<unknown>]> = [
    ["getSigns", () => curriculumApi.getSigns()],
    ["getMarkings", () => curriculumApi.getMarkings()],
    ["getExamCenters", () => curriculumApi.getExamCenters()],
    ["getPracticalExam", () => curriculumApi.getPracticalExam()],
    ["getPenalties", () => curriculumApi.getPenalties()],
    ["getRules", () => curriculumApi.getRules()],
    ["getStats", () => curriculumApi.getStats()],
  ];

  it.each(calls)("%s rejects on network error", async (_name, call) => {
    const err = networkError();
    get.mockRejectedValueOnce(err);
    await expect(call()).rejects.toBe(err);
  });

  it.each(calls)("%s rejects on 5xx", async (_name, call) => {
    const err = serverError();
    get.mockRejectedValueOnce(err);
    await expect(call()).rejects.toBe(err);
  });

  it("getStats rejects on an invalid payload instead of inventing numbers", async () => {
    get.mockResolvedValueOnce({ data: null });
    await expect(curriculumApi.getStats()).rejects.toThrow();
  });

  it("unwraps { data: [...] } and plain array payloads", async () => {
    get.mockResolvedValueOnce({ data: { data: [{ id: 1 }] } });
    await expect(curriculumApi.getPenalties()).resolves.toEqual([{ id: 1 }]);
    get.mockResolvedValueOnce({ data: [{ id: 2 }] });
    await expect(curriculumApi.getRules()).resolves.toEqual([{ id: 2 }]);
  });

  it("returns an empty list (not an error) for a successful empty response", async () => {
    get.mockResolvedValueOnce({ data: { data: [] } });
    await expect(curriculumApi.getSigns()).resolves.toEqual([]);
    get.mockResolvedValueOnce({ data: { data: {} } });
    await expect(curriculumApi.getPracticalExam()).resolves.toEqual({ exercises: [], penalties: [] });
  });
});

describe("curriculum localization helpers", () => {
  it("picks the field for the current language with fallbacks", () => {
    expect(pickLocalized("ru", "Salom", "Салом", "Привет")).toBe("Привет");
    expect(pickLocalized("ru", "Salom", "Салом", undefined)).toBe("Salom");
    expect(pickLocalized("uzc", "Salom", "Салом", "Привет")).toBe("Салом");
    expect(pickLocalized("uzc", "Salom", undefined, "Привет")).toBe("Салом");
    expect(pickLocalized("uzl", "Salom", "Салом", "Привет")).toBe("Salom");
    expect(pickLocalized("uzl", undefined, undefined, undefined)).toBe("");
  });

  it("formats numbers with digit grouping for every app language", () => {
    for (const lang of ["uzl", "uzc", "ru"]) {
      const out = formatLocalizedNumber(150000, lang).replace(/\s/g, " ");
      expect(out).toMatch(/^150[ .,]000$/);
    }
  });
});
