import { describe, expect, it } from "vitest";
import { latinToCyrillic } from "../utils/transliterate";

describe("latinToCyrillic", () => {
  it.each([
    ["yo'l", "йўл"],
    ["yo'q", "йўқ"],
    ["O'zbekiston", "Ўзбекистон"],
    ["g'isht", "ғишт"],
    ["{{count}} ta savol", "{{count}} та савол"],
    ["Sayt: https://pravaonline.uz ga o'ting", "Сайт: https://pravaonline.uz га ўтинг"],
  ])("%s → %s", (input, expected) => {
    expect(latinToCyrillic(input)).toBe(expected);
  });
});
