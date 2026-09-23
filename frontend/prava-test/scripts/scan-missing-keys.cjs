const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const uzl = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/locales/uzl/translation.json'), 'utf8'));

function flattenKeys(obj, prefix = '') {
  const map = {};
  for (const k in obj) {
    const full = prefix ? prefix + '.' + k : k;
    if (obj[k] && typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
      Object.assign(map, flattenKeys(obj[k], full));
    } else {
      map[full] = String(obj[k] ?? '');
    }
  }
  return map;
}

const dict = flattenKeys(uzl);

function walk(dir) {
  let results = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== 'dist' && f !== '.git') {
        results = results.concat(walk(full));
      }
    } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      results.push(full);
    }
  }
  return results;
}

const files = walk(path.join(ROOT, 'src'));
const missingMap = new Map();

// Regex matching t("key", "default value"...) or t('key', 'default value'...)
const tRegex = /\bt\(\s*["']([a-zA-Z0-9_.\-]+)["'](?:\s*,\s*(?:["']([^"'\\]*(?:\\.[^"'\\]*)*)["']|(\{[\s\S]*?\})))?/g;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = tRegex.exec(content)) !== null) {
    const key = m[1];
    if (!dict[key]) {
      const defaultVal = m[2] || '';
      if (!missingMap.has(key)) {
        missingMap.set(key, { files: new Set(), defaultVal });
      }
      missingMap.get(key).files.add(path.relative(ROOT, file));
      if (!missingMap.get(key).defaultVal && defaultVal) {
        missingMap.get(key).defaultVal = defaultVal;
      }
    }
  }
}

console.log('TOTAL MISSING KEYS:', missingMap.size);
const output = [];
for (const [k, v] of missingMap.entries()) {
  output.push({
    key: k,
    defaultVal: v.defaultVal,
    files: Array.from(v.files)
  });
}

fs.writeFileSync(path.join(ROOT, 'scripts/missing-keys.json'), JSON.stringify(output, null, 2), 'utf8');
console.log('Saved to scripts/missing-keys.json');
