import { describe, it, expect } from "vitest";
import { getImageUrl } from "../utils/imageUtils";

describe("Unified Brand Question Image Placeholder System", () => {
  it("resolves null, empty, or whitespace to undefined so component falls back to brand placeholder", () => {
    expect(getImageUrl(null)).toBeUndefined();
    expect(getImageUrl(undefined)).toBeUndefined();
    expect(getImageUrl("")).toBeUndefined();
    expect(getImageUrl("   ")).toBeUndefined();
  });

  it("passes /question-default.svg and /logo.png directly as local assets", () => {
    expect(getImageUrl("/question-default.svg")).toBe("/question-default.svg");
    expect(getImageUrl("question-default.svg")).toBe("/question-default.svg");
    expect(getImageUrl("/logo.png")).toBe("/logo.png");
    expect(getImageUrl("logo.png")).toBe("/logo.png");
    expect(getImageUrl("/logo.svg")).toBe("/logo.svg");
    expect(getImageUrl("logo.svg")).toBe("/logo.svg");
  });

  it("preserves real external and API image paths without altering their destinations", () => {
    expect(getImageUrl("https://example.com/signs/warning.png")).toBe("https://example.com/signs/warning.png");
    expect(getImageUrl("http://cdn.prava.uz/q1.webp")).toBe("http://cdn.prava.uz/q1.webp");
    expect(getImageUrl("data:image/svg+xml;base64,AAA")).toBe("data:image/svg+xml;base64,AAA");
    expect(getImageUrl("blob:http://localhost:3000/xyz")).toBe("blob:http://localhost:3000/xyz");

    const relativeUrl = getImageUrl("questions/clean_t01_q01.webp");
    expect(relativeUrl).toBeDefined();
    expect(relativeUrl).toContain("/api/v1/files/questions/clean_t01_q01.webp");
  });
});
