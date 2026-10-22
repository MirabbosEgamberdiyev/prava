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

// Chunk'lar orasida statik aylanma import (masalan vendor ↔ i18n) bo'lsa, yuklanishda import hali undefined
// bo'ladi va sayt oq ekran (2026-10-22 prod). Dinamik import("./x.js") hisobga olinmaydi.
const assetsDir = path.join(dist, "assets");
const chunkFiles = fs.readdirSync(assetsDir).filter((f) => f.endsWith(".js"));
const edges = new Map(
  chunkFiles.map((f) => {
    const src = fs.readFileSync(path.join(assetsDir, f), "utf8");
    const deps = [...src.matchAll(/\bfrom\s*["']\.\/([\w.-]+\.js)["']|\bimport\s*["']\.\/([\w.-]+\.js)["']/g)].map((m) => m[1] || m[2]);
    return [f, new Set(deps)];
  })
);
const cycles = [];
const visit = new Map();
const trail = [];
const dfs = (node) => {
  visit.set(node, 1);
  trail.push(node);
  for (const dep of edges.get(node) || []) {
    if (!edges.has(dep)) continue;
    if (visit.get(dep) === 1) cycles.push([...trail.slice(trail.indexOf(dep)), dep].join(" -> "));
    else if (!visit.get(dep)) dfs(dep);
  }
  trail.pop();
  visit.set(node, 2);
};
for (const f of edges.keys()) if (!visit.get(f)) dfs(f);
if (cycles.length) {
  console.error(`Chunk import cycle(s):\n  ${cycles.join("\n  ")}`);
  process.exit(1);
}
console.log(`chunks    ${chunkFiles.length} JS, no static import cycles`);
