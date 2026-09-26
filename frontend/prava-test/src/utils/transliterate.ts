/**
 * Uzbek Latin <-> Cyrillic Bidirectional Transliteration Engine
 * Follows the official orthography of the Republic of Uzbekistan.
 */

// Apostrophe variants used for o' / g' / tutuq belgisi
const APOS = "['‘’`ʼʻ]";

// Mapping of digraphs and special cases (Latin -> Cyrillic). ORDER MATTERS:
// "yo'" must be handled before "yo" (yo'l -> йўл, not ёл).
const LATIN_TO_CYRILLIC_COMPOUNDS: [RegExp, string][] = [
  [new RegExp(`YO${APOS}`, "g"), "ЙЎ"],
  [new RegExp(`Yo${APOS}`, "g"), "Йў"],
  [new RegExp(`yo${APOS}`, "g"), "йў"],
  [new RegExp(`O${APOS}`, "g"), "Ў"],
  [new RegExp(`o${APOS}`, "g"), "ў"],
  [new RegExp(`G${APOS}`, "g"), "Ғ"],
  [new RegExp(`g${APOS}`, "g"), "ғ"],
  [/SH/g, "Ш"],
  [/Sh/g, "Ш"],
  [/sh/g, "ш"],
  [/CH/g, "Ч"],
  [/Ch/g, "Ч"],
  [/ch/g, "ч"],
  [/YO/g, "Ё"],
  [/Yo/g, "Ё"],
  [/yo/g, "ё"],
  [/YU/g, "Ю"],
  [/Yu/g, "Ю"],
  [/yu/g, "ю"],
  [/YA/g, "Я"],
  [/Ya/g, "Я"],
  [/ya/g, "я"],
  [/YE/g, "Е"],
  [/Ye/g, "Е"],
  [/ye/g, "е"],
];

// Single letter mapping (Latin -> Cyrillic). "e"/"E" are handled separately
// (э at word start, е elsewhere).
const LATIN_TO_CYRILLIC_SINGLES: Record<string, string> = {
  a: "а", A: "А",
  b: "б", B: "Б",
  d: "д", D: "Д",
  f: "ф", F: "Ф",
  g: "г", G: "Г",
  h: "ҳ", H: "Ҳ",
  i: "и", I: "И",
  j: "ж", J: "Ж",
  k: "к", K: "К",
  l: "л", L: "Л",
  m: "м", M: "М",
  n: "н", N: "Н",
  o: "о", O: "О",
  p: "п", P: "П",
  q: "қ", Q: "Қ",
  r: "р", R: "Р",
  s: "с", S: "С",
  t: "т", T: "Т",
  u: "у", U: "У",
  v: "в", V: "В",
  x: "х", X: "Х",
  y: "й", Y: "Й",
  z: "з", Z: "З",
};

const LETTER_RE = /[A-Za-zА-Яа-яЁёЎўҚқҒғҲҳ]/;
const APOS_RE = new RegExp(`^${APOS}$`);

/**
 * Segments that must never be transliterated:
 *  - i18next interpolation placeholders: {{count}}
 *  - HTML tags: <b>, </strong>, <br/>
 *  - URLs: https://pravaonline.uz/...
 */
const PROTECTED_RE = /(\{\{[\s\S]*?\}\}|<\/?[A-Za-z][^<>]*>|https?:\/\/[^\s<>"']+)/g;

function transliterateChunk(text: string): string {
  let result = text;

  // 1. Digraphs and apostrophe letters
  for (const [regex, replacement] of LATIN_TO_CYRILLIC_COMPOUNDS) {
    result = result.replace(regex, replacement);
  }

  // 2. Single letters, "e" (word-start э / otherwise е) and tutuq belgisi (ъ)
  let out = "";
  for (let i = 0; i < result.length; i++) {
    const char = result[i];
    const prev = i > 0 ? result[i - 1] : "";
    if (char === "e" || char === "E") {
      const wordStart = !prev || !LETTER_RE.test(prev);
      if (char === "e") out += wordStart ? "э" : "е";
      else out += wordStart ? "Э" : "Е";
      continue;
    }
    if (APOS_RE.test(char)) {
      // Apostrophe between letters is the tutuq belgisi (ma'no -> маъно);
      // otherwise it is a quotation mark and stays as-is.
      const next = i + 1 < result.length ? result[i + 1] : "";
      out += prev && LETTER_RE.test(prev) && next && LETTER_RE.test(next) ? "ъ" : char;
      continue;
    }
    out += LATIN_TO_CYRILLIC_SINGLES[char] ?? char;
  }
  return out;
}

/**
 * Transliterates an Uzbek Latin text into Uzbek Cyrillic.
 * Interpolation placeholders, HTML tags and URLs are left untouched.
 */
export function latinToCyrillic(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .split(PROTECTED_RE)
    .map((part, idx) => (idx % 2 === 1 ? part : transliterateChunk(part)))
    .join("");
}

// Cyrillic -> Latin mapping
const CYRILLIC_TO_LATIN_MAP: Record<string, string> = {
  а: "a", А: "A",
  б: "b", Б: "B",
  в: "v", В: "V",
  г: "g", Г: "G",
  д: "d", Д: "D",
  е: "e", Е: "E",
  ё: "yo", Ё: "Yo",
  ж: "j", Ж: "J",
  з: "z", З: "Z",
  и: "i", И: "I",
  й: "y", Й: "Y",
  к: "k", К: "K",
  л: "l", Л: "L",
  м: "m", М: "M",
  н: "n", Н: "N",
  о: "o", О: "O",
  п: "p", П: "P",
  р: "r", Р: "R",
  с: "s", С: "S",
  т: "t", Т: "T",
  у: "u", У: "U",
  ф: "f", Ф: "F",
  х: "x", Х: "X",
  ц: "ts", Ц: "Ts",
  ч: "ch", Ч: "Ch",
  ш: "sh", Ш: "Sh",
  щ: "sh", Щ: "Sh",
  ъ: "'", Ъ: "'",
  ы: "i", Ы: "I",
  ь: "", Ь: "",
  э: "e", Э: "E",
  ю: "yu", Ю: "Yu",
  я: "ya", Я: "Ya",
  ў: "o'", Ў: "O'",
  қ: "q", Қ: "Q",
  ғ: "g'", Ғ: "G'",
  ҳ: "h", Ҳ: "H",
};

/**
 * Transliterates an Uzbek Cyrillic text into Uzbek Latin.
 */
export function cyrillicToLatin(text: string | null | undefined): string {
  if (!text) return "";
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    out += CYRILLIC_TO_LATIN_MAP[char] !== undefined ? CYRILLIC_TO_LATIN_MAP[char] : char;
  }
  return out;
}
