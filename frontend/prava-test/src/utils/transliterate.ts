/**
 * Uzbek Latin <-> Cyrillic Bidirectional Transliteration Engine
 * Follows the official orthography of the Republic of Uzbekistan.
 */

// Mapping of digraphs and special cases (Latin -> Cyrillic)
const LATIN_TO_CYRILLIC_COMPOUNDS: [RegExp, string][] = [
  [/Sh/g, "Ш"],
  [/SH/g, "Ш"],
  [/sh/g, "ш"],
  [/Ch/g, "Ч"],
  [/CH/g, "Ч"],
  [/ch/g, "ч"],
  [/Yo['‘`ʼ]?/g, "Ё"],
  [/YO['‘`ʼ]?/g, "Ё"],
  [/yo['‘`ʼ]?/g, "ё"],
  [/Yu/g, "Ю"],
  [/YU/g, "Ю"],
  [/yu/g, "ю"],
  [/Ya/g, "Я"],
  [/YA/g, "Я"],
  [/ya/g, "я"],
  [/Ye/g, "Е"],
  [/YE/g, "Е"],
  [/ye/g, "е"],
  [/O['‘`ʼ]/g, "Ў"],
  [/o['‘`ʼ]/g, "ў"],
  [/G['‘`ʼ]/g, "Ғ"],
  [/g['‘`ʼ]/g, "ғ"],
];

// Single letter mapping (Latin -> Cyrillic)
const LATIN_TO_CYRILLIC_SINGLES: Record<string, string> = {
  a: "а", A: "А",
  b: "б", B: "Б",
  d: "д", D: "Д",
  e: "э", E: "Э",
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
  "'": "ъ", "‘": "ъ", "’": "ъ", "ʼ": "ъ", "`": "ъ"
};

/**
 * Transliterates an Uzbek Latin text into Uzbek Cyrillic.
 */
export function latinToCyrillic(text: string | null | undefined): string {
  if (!text) return "";
  let result = text;

  // 1. Process compounds/digraphs
  for (const [regex, replacement] of LATIN_TO_CYRILLIC_COMPOUNDS) {
    result = result.replace(regex, replacement);
  }

  // 2. Process 'E/e' inside words (e followed or preceded by letters becomes 'е')
  result = result.replace(/([a-zA-Zа-яА-ЯёЁ])e/g, "$1е");
  result = result.replace(/([a-zA-Zа-яА-ЯёЁ])E/g, "$1Е");

  // 3. Process remaining single letters
  let out = "";
  for (let i = 0; i < result.length; i++) {
    const char = result[i];
    out += LATIN_TO_CYRILLIC_SINGLES[char] !== undefined ? LATIN_TO_CYRILLIC_SINGLES[char] : char;
  }

  return out;
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
