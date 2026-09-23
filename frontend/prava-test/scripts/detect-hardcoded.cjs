const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

function walk(dir) {
  let results = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (!['node_modules', 'dist', '.git', '__tests__'].includes(f)) {
        results = results.concat(walk(full));
      }
    } else if (f.endsWith('.tsx') || f.endsWith('.jsx')) {
      results.push(full);
    }
  }
  return results;
}

const files = walk(SRC);

const ALLOWED_LITERALS = new Set([
  'PRAVA', 'ONLINE', 'PRAVAONLINE', 'PravaOnline', 'Chevrolet', 'Cobalt', 'Gentra', 'Malibu',
  'Telegram', 'Instagram', 'YouTube', 'Facebook', 'Google', 'Google Play', 'App Store', 'Windows',
  'JSON', 'SMS', 'OTP', 'ID', 'URL', 'API', 'UUID', 'VIP', 'PWA', 'IIV', 'YHXX', 'YHQ',
  'km/h', 'W', 'A', 'S', 'D', 'SPACE', 'ENTER', 'ESC', 'px', 'rem', 'auto', 'none', 'inherit',
  'FUEL', 'TEMP', 'RPM', 'SPEED', 'P', 'R', 'N', 'D', 'M', '1', '2', '3', '4', '5', 'UZ', 'RU'
]);

function isIgnored(val) {
  const trimmed = val.trim();
  if (trimmed.length <= 1) return true;
  if (/^[\d\s.,:;+\-_*\/\\|!?%#@&()\[\]{}<>=~^$°'"`]+$/.test(trimmed)) return true;
  if (trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) return true;
  if (ALLOWED_LITERALS.has(trimmed)) return true;
  if (trimmed.startsWith('var(--') || trimmed.startsWith('#') || trimmed.startsWith('rgb')) return true;
  if (trimmed.startsWith('@')) return true;
  if (trimmed.includes('@') && trimmed.includes('.')) return true;
  // CSS class names or styles
  if (trimmed.includes('calc(') || trimmed.endsWith('px') || trimmed.endsWith('%') || trimmed.endsWith('vh') || trimmed.endsWith('vw')) return true;
  // SVG paths
  if (trimmed.startsWith('M ') || trimmed.startsWith('M') && trimmed.includes('L')) return true;
  return false;
}

const findings = [];

// Patterns:
// 1. JSX text: >Text< where Text has letters
// 2. Attributes: title="...", placeholder="...", aria-label="..."
// 3. Buttons: <Button...>Text</Button> or <button...>Text</button>
// 4. Toast: toast.xxx("...")

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  const relPath = path.relative(ROOT, file);

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    // Skip comments
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine.startsWith('*')) return;

    // Check JSX text nodes: >\s*Text\s*<
    const jsxTextMatches = line.matchAll(/>([^<>{}\n]+)</g);
    for (const m of jsxTextMatches) {
      const val = m[1].trim();
      if (!isIgnored(val) && /[a-zA-Z\u0400-\u04FF]{3,}/.test(val)) {
        // Exclude lines with t(...) or already translated
        if (!line.includes(`t(`)) {
          findings.push({
            type: 'JSX_TEXT',
            file: relPath,
            line: lineNum,
            val,
            snippet: trimmedLine
          });
        }
      }
    }

    // Check placeholder, aria-label, title attrs with literal string
    const attrMatches = line.matchAll(/\b(placeholder|aria-label|title|alt)\s*=\s*["']([^"'{}\n]+)["']/g);
    for (const am of attrMatches) {
      const attr = am[1];
      const val = am[2].trim();
      if (!isIgnored(val) && /[a-zA-Z\u0400-\u04FF]{3,}/.test(val)) {
        findings.push({
          type: 'ATTRIBUTE',
          file: relPath,
          line: lineNum,
          val: `${attr}="${val}"`,
          snippet: trimmedLine
        });
      }
    }

    // Check toast
    const toastMatches = line.matchAll(/\btoast\.(success|error|warning|info)\s*\(\s*["']([^"'\n]+)["']/g);
    for (const tm of toastMatches) {
      const val = tm[2].trim();
      if (!isIgnored(val) && /[a-zA-Z\u0400-\u04FF]{3,}/.test(val)) {
        findings.push({
          type: 'TOAST',
          file: relPath,
          line: lineNum,
          val: `toast.${tm[1]}("${val}")`,
          snippet: trimmedLine
        });
      }
    }

    // Check ternary lang === "ru"
    if (line.includes('=== "ru"') && line.includes('?')) {
      findings.push({
        type: 'TERNARY_LANG',
        file: relPath,
        line: lineNum,
        val: 'Ternary language branch',
        snippet: trimmedLine
      });
    }
  });
}

console.log(`Scanned ${files.length} JSX/TSX files.`);
console.log(`Found ${findings.length} potential hardcoded / scattered language issues.`);

const byType = {};
findings.forEach(f => { byType[f.type] = (byType[f.type] || 0) + 1; });
console.log('Breakdown by type:', byType);

fs.writeFileSync(path.join(ROOT, 'scripts/hardcoded-report.json'), JSON.stringify(findings, null, 2), 'utf8');
console.log('Detailed report saved to scripts/hardcoded-report.json');
