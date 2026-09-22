// scripts/audit-i18n.cjs
// Automated i18n audit gate for PravaOnline
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LOCALES_DIR = path.join(ROOT, 'public', 'locales');
const SRC_DIR = path.join(ROOT, 'src');

console.log('\n======================================================');
console.log('  PRAVAONLINE AUTOMATED I18N AUDIT GATE');
console.log('======================================================\n');

// 1. Load locale files
const locales = ['uzl', 'uzc', 'ru'];
const dictionaries = {};

for (const loc of locales) {
  const filePath = path.join(LOCALES_DIR, loc, 'translation.json');
  if (!fs.existsSync(filePath)) {
    console.error(`[CRITICAL] Missing locale file: ${filePath}`);
    process.exit(1);
  }
  try {
    dictionaries[loc] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error(`[CRITICAL] Malformed JSON in ${filePath}: ${err.message}`);
    process.exit(1);
  }
}

// Flatten nested objects into dot-notation keys
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

const flatUzl = flattenKeys(dictionaries['uzl']);
const flatUzc = flattenKeys(dictionaries['uzc']);
const flatRu  = flattenKeys(dictionaries['ru']);

const uzlKeys = Object.keys(flatUzl).sort();
const uzcKeys = new Set(Object.keys(flatUzc));
const ruKeys  = new Set(Object.keys(flatRu));

console.log(`[PARITY] Total keys registered in UZL: ${uzlKeys.length}`);
console.log(`[PARITY] Total keys registered in UZC: ${uzcKeys.size}`);
console.log(`[PARITY] Total keys registered in RU:  ${ruKeys.size}`);

let totalErrors = 0;

// 2. Check Key Parity (UZC and RU against UZL)
const missingInUzc = uzlKeys.filter(k => !uzcKeys.has(k));
const missingInRu  = uzlKeys.filter(k => !ruKeys.has(k));
const extraInUzc   = [...uzcKeys].filter(k => !(k in flatUzl));
const extraInRu    = [...ruKeys].filter(k => !(k in flatUzl));

if (missingInUzc.length > 0) {
  console.error(`\n[ERROR] ${missingInUzc.length} keys missing in UZC:`);
  missingInUzc.slice(0, 10).forEach(k => console.error(`  - ${k}`));
  totalErrors += missingInUzc.length;
}

if (missingInRu.length > 0) {
  console.error(`\n[ERROR] ${missingInRu.length} keys missing in RU:`);
  missingInRu.slice(0, 10).forEach(k => console.error(`  - ${k}`));
  totalErrors += missingInRu.length;
}

if (extraInUzc.length > 0) {
  console.error(`\n[ERROR] ${extraInUzc.length} extra keys in UZC not in UZL:`);
  extraInUzc.slice(0, 10).forEach(k => console.error(`  - ${k}`));
  totalErrors += extraInUzc.length;
}

if (extraInRu.length > 0) {
  console.error(`\n[ERROR] ${extraInRu.length} extra keys in RU not in UZL:`);
  extraInRu.slice(0, 10).forEach(k => console.error(`  - ${k}`));
  totalErrors += extraInRu.length;
}

if (missingInUzc.length === 0 && missingInRu.length === 0 && extraInUzc.length === 0 && extraInRu.length === 0) {
  console.log('[PASS] 100% key parity across UZL, UZC, and RU dictionaries.');
}

// 3. Check for Empty or Whitespace-only Values
for (const loc of locales) {
  const current = loc === 'uzl' ? flatUzl : loc === 'uzc' ? flatUzc : flatRu;
  const emptyKeys = Object.entries(current).filter(([_, v]) => !v || v.trim() === '');
  if (emptyKeys.length > 0) {
    console.error(`\n[ERROR] ${emptyKeys.length} empty values found in ${loc}:`);
    emptyKeys.slice(0, 5).forEach(([k]) => console.error(`  - ${k}`));
    totalErrors += emptyKeys.length;
  }
}

// 4. Check Variable / Placeholder Parity
function extractPlaceholders(text) {
  const matches = text.match(/\{\{?[^\{\}\s]+\}\}?/g) || [];
  return matches.sort().join('|');
}

let placeholderMismatches = 0;
for (const key of uzlKeys) {
  const pUzl = extractPlaceholders(flatUzl[key]);
  const pUzc = extractPlaceholders(flatUzc[key] || '');
  const pRu  = extractPlaceholders(flatRu[key] || '');

  if (pUzl !== pUzc || pUzl !== pRu) {
    console.error(`\n[ERROR] Placeholder mismatch in key "${key}":`);
    console.error(`  UZL: "${flatUzl[key]}" (vars: ${pUzl})`);
    console.error(`  UZC: "${flatUzc[key]}" (vars: ${pUzc})`);
    console.error(`  RU:  "${flatRu[key]}" (vars: ${pRu})`);
    placeholderMismatches++;
    totalErrors++;
  }
}
if (placeholderMismatches === 0) {
  console.log('[PASS] 100% placeholder and interpolation consistency.');
}

// 5. Hardcoded String Scanning in TSX / JSX files
function walkDir(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        walkDir(full, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
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
  'FUEL', 'TEMP', 'RPM', 'SPEED', 'P', 'R', 'N', 'D', 'M', '1', '2', '3', '4', '5'
]);

function isAllowedLiteral(val) {
  const trimmed = val.trim();
  if (trimmed.length <= 1) return true;
  if (/^[\d\s.,:;+\-_*\/\\|!?%#@&()\[\]{}<>=~^$]+$/.test(trimmed)) return true;
  if (trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) return true;
  if (ALLOWED_BRAND_WORDS.has(trimmed)) return true;
  if (trimmed.startsWith('@')) return true;
  if (trimmed.includes('@') && trimmed.includes('.')) return true;
  return false;
}

let hardcodedIssues = 0;
const tsxFiles = walkDir(SRC_DIR);

tsxFiles.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Check attributes: placeholder="...", aria-label="..."
    const attrRegex = /\b(placeholder|aria-label)\s*=\s*["']([^"'{}\n]+)["']/g;
    let m;
    while ((m = attrRegex.exec(line)) !== null) {
      const prop = m[1];
      const val = m[2].trim();
      if (!isAllowedLiteral(val) && /[a-zA-Z\u0400-\u04FF]{3,}/.test(val)) {
        console.error(`[HARDCODED ATTRIBUTE] ${path.relative(ROOT, filePath)}:${idx + 1} -> ${prop}="${val}"`);
        hardcodedIssues++;
        totalErrors++;
      }
    }

    // Check toast.xxx("...")
    const toastRegex = /\btoast\.(success|error|info|warning)\s*\(\s*["']([^"'\n]+)["']/g;
    let tm;
    while ((tm = toastRegex.exec(line)) !== null) {
      const val = tm[2].trim();
      if (!isAllowedLiteral(val) && /[a-zA-Z\u0400-\u04FF]{3,}/.test(val)) {
        console.error(`[HARDCODED TOAST] ${path.relative(ROOT, filePath)}:${idx + 1} -> toast.${tm[1]}("${val}")`);
        hardcodedIssues++;
        totalErrors++;
      }
    }
  });
});

if (hardcodedIssues === 0) {
  console.log('[PASS] 0 hardcoded attributes/toasts found in source components.');
}

// 6. Summary and Exit Code
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
