#!/usr/bin/env node
// Bundle hajmi byudjeti (CI): entry chunk va CSS gzip hajmi chegaradan oshsa — xato.
// Ishlatish: node scripts/check-bundle-size.mjs [distDir]
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const dist = process.argv[2] || "dist";
const BUDGET = { entryJsGzipKb: 250, entryCssGzipKb: 80 };

const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const pick = (re) => [...html.matchAll(re)].map((m) => m[1]).filter((p) => p.startsWith("/assets/"));
const entryJs = pick(/<script[^>]+src="([^"]+\.js)"/g);
const entryCss = pick(/<link[^>]+href="([^"]+\.css)"/g);

const gzKb = (files) =>
  files.reduce((sum, f) => sum + zlib.gzipSync(fs.readFileSync(path.join(dist, f))).length, 0) / 1024;

const js = gzKb(entryJs);
const css = gzKb(entryCss);
console.log(`entry JS  ${js.toFixed(1)} KB gz (budget ${BUDGET.entryJsGzipKb})  ${entryJs.join(", ")}`);
console.log(`entry CSS ${css.toFixed(1)} KB gz (budget ${BUDGET.entryCssGzipKb})`);
if (js > BUDGET.entryJsGzipKb || css > BUDGET.entryCssGzipKb) {
  console.error("Bundle budget exceeded");
  process.exit(1);
}
