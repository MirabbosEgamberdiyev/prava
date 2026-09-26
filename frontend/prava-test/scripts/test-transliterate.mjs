#!/usr/bin/env node
/**
 * Transliteration regression test (UZL -> UZC).
 * Run: npx tsx scripts/test-transliterate.mjs   (or: npm run test:translit)
 */
import { latinToCyrillic } from "../src/utils/transliterate.ts";

const cases = [
  ["yo'l", "йўл"],
  ["yo'q", "йўқ"],
  ["Yo‘l", "Йўл"],
  ["yoʻl", "йўл"],
  ["yoz", "ёз"],
  ["O'zbekiston", "Ўзбекистон"],
  ["O‘zbekiston", "Ўзбекистон"],
  ["g'isht", "ғишт"],
  ["shahar", "шаҳар"],
  ["choy", "чой"],
  ["ming", "минг"],
  ["ekin", "экин"],
  ["Yevropa", "Европа"],
  ["telefon", "телефон"],
  ["ma'lumot", "маълумот"],
  ["{{count}} ta savol", "{{count}} та савол"],
  ["<b>tag</b>", "<b>таг</b>"],
  ["Sayt: https://pravaonline.uz ga o'ting", "Сайт: https://pravaonline.uz га ўтинг"],
  ["{{name}}, <strong>yo'l</strong> belgisi", "{{name}}, <strong>йўл</strong> белгиси"],
];

let failed = 0;
for (const [input, expected] of cases) {
  const actual = latinToCyrillic(input);
  if (actual === expected) {
    console.log(`PASS  ${JSON.stringify(input)} -> ${JSON.stringify(actual)}`);
  } else {
    failed++;
    console.error(
      `FAIL  ${JSON.stringify(input)} -> ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`
    );
  }
}

console.log(`\n${cases.length - failed}/${cases.length} passed`);
process.exit(failed ? 1 : 0);
