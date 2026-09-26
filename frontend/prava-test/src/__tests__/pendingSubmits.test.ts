import { describe, expect, it, vi } from "vitest";

vi.mock("../api/api", () => ({ default: { post: vi.fn() } }));
vi.mock("@mantine/notifications", () => ({ notifications: { show: vi.fn() } }));
vi.mock("../utils/i18n", () => ({ default: { t: (k: string) => k } }));

import { isRetryableSubmitError } from "../services/pendingSubmits";

const httpError = (status: number) => ({ response: { status } });

describe("pendingSubmits.isRetryableSubmitError", () => {
  it("retries network errors, 401, 408, 429 and 5xx", () => {
    expect(isRetryableSubmitError(new Error("Network Error"))).toBe(true);
    for (const s of [401, 408, 429, 500, 503]) expect(isRetryableSubmitError(httpError(s))).toBe(true);
  });

  it("drops permanent client errors", () => {
    for (const s of [400, 403, 404, 422]) expect(isRetryableSubmitError(httpError(s))).toBe(false);
  });
});
