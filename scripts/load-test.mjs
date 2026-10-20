#!/usr/bin/env node
/**
 * HTTP load test for the main read paths of a RUNNING local backend: latency p50/p95/p99, RPS, error rate.
 * Never point this at production. Run the backend with --app.security.rate-limit.enabled=false for
 * capacity numbers (otherwise you measure the per-IP limiter, which is also reported).
 *
 * Env: LT_BASE (default http://127.0.0.1:18080), LT_ENV (file with APP_INIT_USER_PASSWORD), LT_OUT (JSON file)
 *      LT_DURATION_S (per scenario, default 15), LT_CONCURRENCY (comma list, default "10,50")
 */
import fs from "node:fs";

const BASE = process.env.LT_BASE || "http://127.0.0.1:18080";
if (/pravaonline\.uz/.test(BASE)) throw new Error("Refusing to run against production");
const ENV = process.env.LT_ENV
  ? Object.fromEntries(fs.readFileSync(process.env.LT_ENV, "utf8").split(/\r?\n/).filter((l) => l.includes("="))
      .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]))
  : {};
const DURATION = Number(process.env.LT_DURATION_S || 15) * 1000;
const LEVELS = (process.env.LT_CONCURRENCY || "10,50").split(",").map(Number);

function pct(sorted, p) {
  if (!sorted.length) return null;
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

async function scenario(name, makeRequest, concurrency) {
  const lat = [];
  const codes = {};
  let bytes = 0;
  const end = Date.now() + DURATION;
  async function worker() {
    while (Date.now() < end) {
      const t0 = performance.now();
      try {
        const res = await makeRequest();
        const buf = await res.arrayBuffer();
        bytes += buf.byteLength;
        codes[res.status] = (codes[res.status] || 0) + 1;
      } catch {
        codes.ERR = (codes.ERR || 0) + 1;
      }
      lat.push(performance.now() - t0);
    }
  }
  const started = Date.now();
  await Promise.all(Array.from({ length: concurrency }, worker));
  const secs = (Date.now() - started) / 1000;
  lat.sort((a, b) => a - b);
  const total = lat.length;
  const ok = Object.entries(codes).filter(([c]) => c.startsWith("2") || c === "304").reduce((s, [, n]) => s + n, 0);
  const r = {
    scenario: name, concurrency, requests: total, rps: +(total / secs).toFixed(1),
    p50: +pct(lat, 50).toFixed(1), p95: +pct(lat, 95).toFixed(1), p99: +pct(lat, 99).toFixed(1), max: +lat[total - 1].toFixed(1),
    okRate: +(ok / total * 100).toFixed(2), codes, mbPerSec: +(bytes / secs / 1048576).toFixed(2),
  };
  console.log(`${name.padEnd(28)} c=${String(concurrency).padStart(3)}  rps=${String(r.rps).padStart(7)}  p50=${r.p50}ms p95=${r.p95}ms p99=${r.p99}ms max=${r.max}ms  ok=${r.okRate}%  ${JSON.stringify(codes)}`);
  return r;
}

async function main() {
  let token = null;
  if (ENV.APP_INIT_USER_PASSWORD) {
    const r = await fetch(`${BASE}/api/v1/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "user@pravaonline.uz", password: ENV.APP_INIT_USER_PASSWORD }),
    });
    token = (await r.json()).data?.accessToken ?? null;
  }
  const auth = token ? { Authorization: `Bearer ${token}` } : {};
  const scenarios = [
    ["GET public/exam-rules", () => fetch(`${BASE}/api/v1/public/exam-rules`)],
    ["GET public/tickets", () => fetch(`${BASE}/api/v1/public/tickets`)],
    ["GET curriculum/stats", () => fetch(`${BASE}/api/v1/curriculum/stats`)],
    ["GET content/manifest", () => fetch(`${BASE}/api/v2/content/manifest`)],
    ["GET public/desktop-bundle", () => fetch(`${BASE}/api/v1/public/desktop-bundle`)],
  ];
  if (token) {
    scenarios.push(
      ["GET auth/me", () => fetch(`${BASE}/api/v1/auth/me`, { headers: auth })],
      ["GET v2/tickets/1/questions", () => fetch(`${BASE}/api/v2/tickets/1/questions?visibleMode=true`, { headers: auth })],
      ["GET v2/my-statistics", () => fetch(`${BASE}/api/v2/my-statistics`, { headers: auth })],
      ["GET octagon/leaderboard", () => fetch(`${BASE}/api/v1/octagon/leaderboard`, { headers: auth })],
    );
  }
  const results = [];
  for (const c of LEVELS) for (const [name, fn] of scenarios) results.push(await scenario(name, fn, c));
  if (process.env.LT_OUT) fs.writeFileSync(process.env.LT_OUT, JSON.stringify({ base: BASE, durationS: DURATION / 1000, results }, null, 2));
}
main().catch((e) => { console.error("FATAL", e); process.exitCode = 2; });
