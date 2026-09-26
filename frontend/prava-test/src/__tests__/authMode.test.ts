import { describe, expect, it } from "vitest";
import { AUTH_MODE_HEADERS, isCookieAuthMode } from "../api/authMode";

describe("authMode", () => {
  it("defaults to HttpOnly cookie mode outside the desktop OAuth window", () => {
    expect(isCookieAuthMode()).toBe(true);
    expect(AUTH_MODE_HEADERS).toEqual({ "X-Auth-Mode": "cookie" });
  });
});
