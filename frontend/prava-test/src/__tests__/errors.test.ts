import { describe, expect, it } from "vitest";
import { classifyError, errorKeyFor, getErrorMessage, isDisplayableServerMessage } from "../types/errors";

const axiosErr = (status?: number, message?: unknown, code?: string) => ({
  isAxiosError: true,
  code,
  response: status === undefined ? undefined : { status, data: { message } },
});

describe("error helpers", () => {
  it("classifies network / server / client / unknown", () => {
    expect(classifyError(axiosErr(undefined, undefined, "ERR_NETWORK"))).toBe("network");
    expect(classifyError(axiosErr(502))).toBe("server");
    expect(classifyError(axiosErr(404))).toBe("client");
    expect(classifyError(new Error("boom"))).toBe("unknown");
    expect(classifyError("x")).toBe("unknown");
  });

  it("shows localized 4xx business messages only", () => {
    expect(getErrorMessage(axiosErr(400, "Bilet topilmadi"), "fallback")).toBe("Bilet topilmadi");
    expect(getErrorMessage(axiosErr(409, "Билет не найден"), "fallback")).toBe("Билет не найден");
  });

  it("never leaks technical or server/network errors", () => {
    expect(getErrorMessage(axiosErr(500, "Bilet topilmadi"), "fb")).toBe("fb");
    expect(getErrorMessage(axiosErr(undefined, undefined, "ERR_NETWORK"), "fb")).toBe("fb");
    expect(getErrorMessage(axiosErr(400, "java.lang.NullPointerException"), "fb")).toBe("fb");
    expect(getErrorMessage(axiosErr(400, "Request failed with status code 400"), "fb")).toBe("fb");
    expect(getErrorMessage(axiosErr(400, "{\"a\":1}"), "fb")).toBe("fb");
    expect(getErrorMessage(new Error("TypeError: x is undefined"), "fb")).toBe("fb");
    expect(isDisplayableServerMessage("")).toBe(false);
  });

  it("maps errors to i18n keys", () => {
    expect(errorKeyFor(axiosErr(undefined, undefined, "ERR_NETWORK"))).toBe("errors.networkError");
    expect(errorKeyFor(axiosErr(503))).toBe("errors.serverError");
    expect(errorKeyFor(axiosErr(404), "notification.startError")).toBe("notification.startError");
  });
});
