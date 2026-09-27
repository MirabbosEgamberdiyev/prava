import { describe, expect, it } from "vitest";
import { loginPath, readReturnTo, registerPath, sanitizeReturnTo, withReturnTo } from "../utils/returnTo";

describe("sanitizeReturnTo", () => {
  it("accepts same-origin absolute paths with query and hash", () => {
    expect(sanitizeReturnTo("/tickets/5")).toBe("/tickets/5");
    expect(sanitizeReturnTo("/topics/abc?x=1#q")).toBe("/topics/abc?x=1#q");
    expect(sanitizeReturnTo("/")).toBe("/");
  });

  it("rejects external, protocol-relative and scheme URLs", () => {
    for (const bad of [
      "https://evil.com",
      "//evil.com",
      "//evil.com/tickets",
      "/\\evil.com",
      "\\\\evil.com",
      "javascript:alert(1)",
      "tickets/5",
      "",
      "   ",
      "/\t/evil.com",
      "/\n/evil.com",
      "/foo bar",
    ]) {
      expect(sanitizeReturnTo(bad), bad).toBeNull();
    }
  });

  it("rejects non-strings and overly long values", () => {
    expect(sanitizeReturnTo(undefined)).toBeNull();
    expect(sanitizeReturnTo(null)).toBeNull();
    expect(sanitizeReturnTo(42)).toBeNull();
    expect(sanitizeReturnTo("/" + "a".repeat(600))).toBeNull();
  });

  it("rejects auth pages to avoid redirect loops", () => {
    expect(sanitizeReturnTo("/auth/login")).toBeNull();
    expect(sanitizeReturnTo("/auth/register?returnTo=/me")).toBeNull();
    expect(sanitizeReturnTo("/login")).toBeNull();
  });

  it("normalises dot segments without escaping the origin", () => {
    expect(sanitizeReturnTo("/a/../tickets")).toBe("/tickets");
    expect(sanitizeReturnTo("/..//evil.com")).toBeNull();
  });
});

describe("returnTo helpers", () => {
  it("reads and validates from a query string", () => {
    expect(readReturnTo("?returnTo=%2Ftickets%2F3")).toBe("/tickets/3");
    expect(readReturnTo("?returnTo=https%3A%2F%2Fevil.com")).toBeNull();
    expect(readReturnTo(new URLSearchParams())).toBeNull();
  });

  it("builds login/register links, dropping unsafe targets", () => {
    expect(loginPath("/tickets/3")).toBe("/auth/login?returnTo=%2Ftickets%2F3");
    expect(registerPath("//evil.com")).toBe("/auth/register");
    expect(withReturnTo("/auth/login?x=1", "/me")).toBe("/auth/login?x=1&returnTo=%2Fme");
    expect(loginPath()).toBe("/auth/login");
  });
});
