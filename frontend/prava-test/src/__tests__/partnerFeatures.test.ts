import { describe, expect, it, vi } from "vitest";

vi.mock("../config/env", () => ({ ENV: { API_BASE_URL: "https://api.example.uz" } }));

import { pinAfterBackspace, pinAfterInput, sanitizePin } from "../features/Octagon/pin";
import { getAvatarUrl, getImageUrl } from "../utils/imageUtils";
import uzl from "../locales/uzl.json";
import uzc from "../locales/uzc.json";
import ru from "../locales/ru.json";

describe("4-digit invite PIN input", () => {
  it("keeps only digits and at most 4 of them", () => {
    expect(sanitizePin(" 48-2a1 9", 4)).toBe("4821");
    expect(sanitizePin("abc", 4)).toBe("");
  });

  it("typing moves focus forward and fills the code", () => {
    let s = { value: "", focus: 0 };
    for (const [i, d] of ["4", "8", "2", "1"].entries()) s = pinAfterInput(s.value, i, d, 4);
    expect(s.value).toBe("4821");
    expect(s.focus).toBe(3);
  });

  it("typing into an empty later cell does not leave gaps", () => {
    expect(pinAfterInput("4", 3, "7", 4)).toEqual({ value: "47", focus: 2 });
  });

  it("overwrites a filled cell", () => {
    expect(pinAfterInput("4821", 1, "5", 4)).toEqual({ value: "4521", focus: 2 });
  });

  it("paste / SMS autofill fills from the current cell", () => {
    expect(pinAfterInput("", 0, "4821", 4)).toEqual({ value: "4821", focus: 3 });
    expect(pinAfterInput("4", 1, "8219", 4)).toEqual({ value: "4821", focus: 3 });
  });

  it("backspace clears the cell, or the previous one when empty", () => {
    expect(pinAfterBackspace("4821", 3)).toEqual({ value: "482", focus: 3 });
    expect(pinAfterBackspace("482", 3)).toEqual({ value: "48", focus: 2 });
    expect(pinAfterBackspace("", 0)).toEqual({ value: "", focus: 0 });
  });
});

describe("Avatar URLs", () => {
  it("preset avatars keep their /api/v1/public path (getImageUrl would rewrite it under /files)", () => {
    expect(getAvatarUrl("/api/v1/public/avatars/driver.svg")).toBe("https://api.example.uz/api/v1/public/avatars/driver.svg");
    expect(getImageUrl("/api/v1/public/avatars/driver.svg")).not.toBe("https://api.example.uz/api/v1/public/avatars/driver.svg");
  });

  it("uploaded avatars, Google photos and empty values", () => {
    expect(getAvatarUrl("/api/v1/files/profiles/a.jpg")).toBe("https://api.example.uz/api/v1/files/profiles/a.jpg");
    expect(getAvatarUrl("https://lh3.googleusercontent.com/a/x")).toBe("https://lh3.googleusercontent.com/a/x");
    expect(getAvatarUrl("")).toBeUndefined();
    expect(getAvatarUrl(null)).toBeUndefined();
  });
});

describe("Share message and new strings in all 3 languages", () => {
  const all = { uzl, uzc, ru } as Record<string, any>;

  it("duel share text has the code and the direct link placeholders", () => {
    for (const [lang, dict] of Object.entries(all)) {
      const text: string = dict.octagon.duel.shareText;
      expect(text, lang).toContain("{{code}}");
      expect(text, lang).toContain("{{url}}");
    }
    expect(uzl.octagon.duel.shareText).toContain("Men bilan PRAVA ONLINE Oktagonida kuch sinash!");
  });

  it("opponent-finished banner and avatar strings exist everywhere", () => {
    for (const [lang, dict] of Object.entries(all)) {
      expect(dict.octagon.arena.oppFinishedTitle, lang).toBeTruthy();
      expect(dict.octagon.arena.oppOnQuestion, lang).toContain("{{n}}");
      expect(Object.keys(dict.profile.avatar).sort(), lang).toEqual(Object.keys(uzl.profile.avatar).sort());
    }
  });
});
