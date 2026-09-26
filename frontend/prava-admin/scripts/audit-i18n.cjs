// scripts/audit-i18n.cjs  (run: npm run i18n:audit)
// Automated i18n audit gate for the PravaOnline admin panel.
// Admin loads translations at runtime from public/locales/<lng>/translation.json
// (i18next-http-backend, see src/utils/i18n.ts), so that is what we check.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LOCALES_DIR = path.join(ROOT, 'public', 'locales');
const SRC_DIR = path.join(ROOT, 'src');
const BASE = 'uzl';
const LOCALES = ['uzl', 'uzc', 'ru', 'en'];

console.log('\n======================================================');
console.log('  PRAVAONLINE ADMIN — AUTOMATED I18N AUDIT GATE');
console.log('======================================================\n');

// 1. Load locale files
function flattenKeys(obj, prefix = '') {
  const map = {};
  for (const key in obj) {
    const val = obj[key];
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(map, flattenKeys(val, fullKey));
    } else {
      map[fullKey] = String(val ?? '');
    }
  }
  return map;
}

const flat = {};
for (const loc of LOCALES) {
  const filePath = path.join(LOCALES_DIR, loc, 'translation.json');
  if (!fs.existsSync(filePath)) {
    console.error(`[CRITICAL] Missing locale file: ${filePath}`);
    process.exit(1);
  }
  try {
    flat[loc] = flattenKeys(JSON.parse(fs.readFileSync(filePath, 'utf8')));
  } catch (err) {
    console.error(`[CRITICAL] Malformed JSON in ${filePath}: ${err.message}`);
    process.exit(1);
  }
  console.log(`[PARITY] Total keys registered in ${loc.toUpperCase()}: ${Object.keys(flat[loc]).length}`);
}

let totalErrors = 0;
const baseKeys = Object.keys(flat[BASE]).sort();

// 2. Key parity against UZL
let parityErrors = 0;
for (const loc of LOCALES.filter((l) => l !== BASE)) {
  const missing = baseKeys.filter((k) => !(k in flat[loc]));
  const extra = Object.keys(flat[loc]).filter((k) => !(k in flat[BASE]));
  if (missing.length) {
    console.error(`\n[ERROR] ${missing.length} keys missing in ${loc.toUpperCase()}:`);
    missing.slice(0, 20).forEach((k) => console.error(`  - ${k}`));
    parityErrors += missing.length;
  }
  if (extra.length) {
    console.error(`\n[ERROR] ${extra.length} extra keys in ${loc.toUpperCase()} not in UZL:`);
    extra.slice(0, 20).forEach((k) => console.error(`  - ${k}`));
    parityErrors += extra.length;
  }
}
totalErrors += parityErrors;
if (parityErrors === 0) console.log(`[PASS] 100% key parity across ${LOCALES.join(', ').toUpperCase()}.`);

// 3. Empty values
for (const loc of LOCALES) {
  const empty = Object.entries(flat[loc]).filter(([, v]) => !v || v.trim() === '');
  if (empty.length) {
    console.error(`\n[ERROR] ${empty.length} empty values found in ${loc}:`);
    empty.slice(0, 5).forEach(([k]) => console.error(`  - ${k}`));
    totalErrors += empty.length;
  }
}

// 4. Placeholder parity
function extractPlaceholders(text) {
  return (text.match(/\{\{?[^{}\s]+\}\}?/g) || []).sort().join('|');
}
let placeholderMismatches = 0;
for (const key of baseKeys) {
  const ref = extractPlaceholders(flat[BASE][key]);
  const bad = LOCALES.filter((loc) => key in flat[loc] && extractPlaceholders(flat[loc][key]) !== ref);
  if (bad.length) {
    console.error(`\n[ERROR] Placeholder mismatch in key "${key}" (${bad.join(', ')}); UZL vars: ${ref}`);
    placeholderMismatches++;
    totalErrors++;
  }
}
if (placeholderMismatches === 0) console.log('[PASS] 100% placeholder and interpolation consistency.');

// 5. Hardcoded attribute / toast scanning in TSX / JSX files
function walkDir(dir, exts, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      if (!['node_modules', 'dist', '.git'].includes(file)) walkDir(full, exts, fileList);
    } else if (exts.some((e) => file.endsWith(e)) && !file.endsWith('.d.ts')) {
      fileList.push(full);
    }
  }
  return fileList;
}

const ALLOWED_BRAND_WORDS = new Set([
  'PRAVA', 'ONLINE', 'PRAVAONLINE', 'PravaOnline', 'Chevrolet', 'Cobalt', 'Gentra', 'Malibu',
  'Telegram', 'Instagram', 'YouTube', 'Facebook', 'Google', 'Google Play', 'App Store', 'Windows',
  'JSON', 'SMS', 'OTP', 'ID', 'URL', 'API', 'UUID', 'VIP', 'PWA', 'IIV', 'YHXX', 'YHQ',
  'km/h', 'W', 'A', 'S', 'D', 'SPACE', 'ENTER', 'ESC', 'px', 'rem', 'auto', 'none', 'inherit',
  'SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER', 'ANALYST', 'SUPPORT', 'USER', 'NEW', 'IN_PROGRESS', 'ANSWERED', 'CLOSED',
]);

function isAllowedLiteral(val) {
  const trimmed = val.trim();
  if (trimmed.length <= 1) return true;
  if (/^[\d\s.,:;+\-_*/\\|!?%#@&()[\]{}<>=~^$]+$/.test(trimmed)) return true;
  if (trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) return true;
  if (ALLOWED_BRAND_WORDS.has(trimmed)) return true;
  if (trimmed.startsWith('@')) return true;
  if (trimmed.includes('@') && trimmed.includes('.')) return true; // email
  return false;
}

let hardcodedIssues = 0;
for (const filePath of walkDir(SRC_DIR, ['.tsx', '.jsx'])) {
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  lines.forEach((line, idx) => {
    const attrRegex = /\b(placeholder|aria-label)\s*=\s*["']([^"'{}\n]+)["']/g;
    let m;
    while ((m = attrRegex.exec(line)) !== null) {
      const val = m[2].trim();
      if (!isAllowedLiteral(val) && /[a-zA-ZЀ-ӿ]{3,}/.test(val)) {
        console.error(`[HARDCODED ATTRIBUTE] ${path.relative(ROOT, filePath)}:${idx + 1} -> ${m[1]}="${val}"`);
        hardcodedIssues++;
      }
    }
    const toastRegex = /\btoast\.(success|error|info|warning)\s*\(\s*["']([^"'\n]+)["']/g;
    while ((m = toastRegex.exec(line)) !== null) {
      const val = m[2].trim();
      if (!isAllowedLiteral(val) && /[a-zA-ZЀ-ӿ]{3,}/.test(val)) {
        console.error(`[HARDCODED TOAST] ${path.relative(ROOT, filePath)}:${idx + 1} -> toast.${m[1]}("${val}")`);
        hardcodedIssues++;
      }
    }
  });
}
totalErrors += hardcodedIssues;
if (hardcodedIssues === 0) console.log('[PASS] 0 hardcoded attributes/toasts found in source components.');

// 6. Static t("key") / t('key') / i18n.t("key") usages must exist in every locale.
//    Dynamic keys (template literals, concatenation, variables) are ignored.
const KEY_CALL_RE = /(?<![\w$.])(?:i18n\.)?t\(\s*(["'])([A-Za-z0-9_][A-Za-z0-9_.-]*)\1\s*[,)]/g;
const PLURAL_SUFFIXES = ['_zero', '_one', '_two', '_few', '_many', '_other'];
function keyExists(map, key) {
  if (key in map) return true;
  if (PLURAL_SUFFIXES.some((s) => `${key}${s}` in map)) return true;
  const prefix = `${key}.`;
  return Object.keys(map).some((k) => k.startsWith(prefix));
}

const usedKeys = new Map();
for (const filePath of walkDir(SRC_DIR, ['.ts', '.tsx'])) {
  const content = fs.readFileSync(filePath, 'utf8');
  let m;
  while ((m = KEY_CALL_RE.exec(content)) !== null) {
    const key = m[2];
    if (!key.includes('.')) continue;
    if (!usedKeys.has(key)) {
      usedKeys.set(key, `${path.relative(ROOT, filePath)}:${content.slice(0, m.index).split('\n').length}`);
    }
  }
}
let missingUsed = 0;
for (const [key, where] of [...usedKeys.entries()].sort()) {
  const missingIn = LOCALES.filter((loc) => !keyExists(flat[loc], key));
  if (missingIn.length) {
    console.error(`[MISSING KEY] "${key}" (${where}) missing in: ${missingIn.join(', ')}`);
    missingUsed++;
  }
}
totalErrors += missingUsed;
console.log(`[USAGE] ${usedKeys.size} static t() keys found in src/**/*.ts(x)`);
if (missingUsed === 0) console.log(`[PASS] All static t() keys exist in ${LOCALES.join(', ').toUpperCase()}.`);

// 7. Summary and exit code
console.log('\n======================================================');
if (totalErrors === 0) {
  console.log('  AUDIT RESULT: 100% PASS (0 ERRORS)');
  console.log('======================================================\n');
  process.exit(0);
} else {
  console.error(`  AUDIT RESULT: FAIL (${totalErrors} TOTAL ISSUES FOUND)`);
  console.error('======================================================\n');
  process.exit(1);
}
