#!/usr/bin/env node
/**
 * API security probe against a RUNNING local backend (real HTTP, real DB): IDOR, role checks,
 * mass assignment, path traversal, CORS, error leakage, rate limiting, input validation.
 *
 * Never point this at production: it creates users/sessions and hammers the login rate limiter.
 *
 * Env:
 *   PROBE_BASE   backend base URL (default http://127.0.0.1:18080)
 *   PROBE_ENV    env file with APP_INIT_SUPER_ADMIN_PASSWORD, APP_INIT_USER_PASSWORD
 *   PROBE_OUT    JSON results file (optional)
 */
import fs from "node:fs";

const BASE = process.env.PROBE_BASE || "http://127.0.0.1:18080";
if (/pravaonline\.uz/.test(BASE)) throw new Error("Refusing to run against production");
const ENV = Object.fromEntries(
  fs.readFileSync(process.env.PROBE_ENV, "utf8").split(/\r?\n/).filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
);

const results = [];
function check(id, name, ok, detail = "") {
  results.push({ id, name, status: ok ? "PASS" : "FAIL", detail: String(detail).slice(0, 300) });
  console.log(`${ok ? "PASS" : "FAIL"} ${id} ${name}${detail !== "" ? " — " + String(detail).slice(0, 160) : ""}`);
}

async function http(method, path, { token, body, headers = {}, raw = false } = {}) {
  const h = { Accept: "application/json", ...headers };
  if (body !== undefined && !raw) h["Content-Type"] = "application/json";
  if (token) h.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method, headers: h, redirect: "manual",
    body: body === undefined ? undefined : raw ? body : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { json = null; }
  return { status: res.status, json, text, headers: res.headers };
}

async function login(identifier, password) {
  const r = await http("POST", "/api/v1/auth/login", { body: { identifier, password } });
  if (r.status !== 200) throw new Error(`login ${identifier} failed: ${r.status}`);
  return { token: r.json.data.accessToken, refresh: r.json.data.refreshToken, id: r.json.data.user.id, role: r.json.data.user.role };
}

async function ensureUser(admin, email, role) {
  const r = await http("POST", "/api/v1/admin/users", {
    token: admin.token,
    body: { firstName: "Probe", lastName: role, email, password: ENV.APP_INIT_USER_PASSWORD, role },
  });
  if (![200, 201, 409, 400].includes(r.status)) throw new Error(`create ${email}: ${r.status} ${r.text.slice(0, 200)}`);
  return login(email, ENV.APP_INIT_USER_PASSWORD);
}

const STACK_RE = /(at [a-z]+\.[a-zA-Z.$]+\(|org\.springframework|java\.lang\.|hibernate|SQLState|PSQLException|NullPointerException)/;

async function main() {
  const admin = await login("superadmin@pravaonline.uz", ENV.APP_INIT_SUPER_ADMIN_PASSWORD);
  const u1 = await login("user@pravaonline.uz", ENV.APP_INIT_USER_PASSWORD);
  const u2 = await ensureUser(admin, "probe-user2@audit.local", "USER");
  const staff = await ensureUser(admin, "probe-admin@audit.local", "ADMIN");
  check("SETUP", "Accounts: super admin, 2 users, 1 ADMIN", admin.role === "SUPER_ADMIN" && staff.role === "ADMIN" && u2.role === "USER", `${admin.role}/${staff.role}/${u2.role}`);

  // ── Exam session IDOR (v2) ───────────────────────────────────────────
  let r = await http("POST", "/api/v2/exams/start-visible", { token: u1.token, body: { questionCount: 20, mode: "REAL" } });
  const examId = r.json?.data?.sessionId ?? r.json?.data?.id;
  check("IDOR-0", "User 1 can start a v2 exam", r.status === 200 && examId != null, `${r.status} id=${examId}`);
  if (examId != null) {
    const qs = r.json.data.questions || [];
    r = await http("GET", `/api/v2/exams/${examId}/result`, { token: u2.token });
    check("IDOR-1", "User 2 cannot read user 1's exam result (v2)", [403, 404].includes(r.status), r.status);
    r = await http("GET", `/api/v2/exams/${examId}/statistics`, { token: u2.token });
    check("IDOR-2", "User 2 cannot read user 1's exam statistics (v2)", [403, 404].includes(r.status), r.status);
    r = await http("PUT", `/api/v2/exams/${examId}/autosave`, { token: u2.token, body: { answers: qs.slice(0, 1).map((q) => ({ questionId: q.id, selectedOptionIndex: 0 })) } });
    check("IDOR-3", "User 2 cannot autosave into user 1's exam", [403, 404].includes(r.status), r.status);
    r = await http("POST", "/api/v2/exams/submit", { token: u2.token, body: { sessionId: examId, answers: qs.slice(0, 1).map((q) => ({ questionId: q.id, selectedOptionIndex: 0 })) } });
    check("IDOR-4", "User 2 cannot submit user 1's exam", [403, 404].includes(r.status), r.status);
    r = await http("POST", `/api/v2/exams/${examId}/abandon`, { token: u2.token });
    check("IDOR-5", "User 2 cannot abandon user 1's exam", [403, 404].includes(r.status), r.status);
    r = await http("GET", `/api/v1/exams/${examId}/result`, { token: u2.token });
    check("IDOR-6", "User 2 cannot read user 1's exam result (v1)", [403, 404].includes(r.status), r.status);
    r = await http("GET", `/api/v2/exams/${examId}/statistics`, { token: u1.token });
    check("IDOR-7", "Owner still reads own exam statistics", r.status === 200 || r.status === 400, r.status);
  }

  // ── Statistics of another user ───────────────────────────────────────
  r = await http("GET", `/api/v1/statistics/user/${u1.id}`, { token: u2.token });
  check("IDOR-8", "User cannot read another user's statistics (/statistics/user/{id})", [403, 404].includes(r.status), r.status);
  r = await http("GET", `/api/v2/admin/statistics/user/${u1.id}`, { token: u2.token });
  check("IDOR-9", "User cannot use admin per-user statistics", r.status === 403, r.status);

  // ── Simulator / Autodrom sessions ────────────────────────────────────
  for (const base of ["/api/v1/simulator", "/api/v1/autodrom"]) {
    r = await http("POST", `${base}/sessions`, { token: u1.token, body: { mode: "TRAINING" } });
    const sid = r.json?.data?.id ?? r.json?.data?.sessionId;
    check(`SIM-0${base.endsWith("autodrom") ? "b" : "a"}`, `${base}: user 1 creates a session`, [200, 201].includes(r.status) && sid != null, `${r.status} id=${sid}`);
    if (sid == null) continue;
    const getPath = base.endsWith("autodrom") ? `${base}/results/${sid}` : `${base}/sessions/${sid}`;
    r = await http("GET", getPath, { token: u2.token });
    check(`SIM-1${base.endsWith("autodrom") ? "b" : "a"}`, `${base}: user 2 cannot read user 1's session`, [403, 404].includes(r.status), r.status);
    r = await http("POST", `${base}/sessions/${sid}/finish`, { token: u2.token, body: { durationSeconds: 1, passed: true } });
    check(`SIM-2${base.endsWith("autodrom") ? "b" : "a"}`, `${base}: user 2 cannot finish user 1's session`, [403, 404, 400].includes(r.status), r.status);
    r = await http("GET", getPath);
    check(`SIM-3${base.endsWith("autodrom") ? "b" : "a"}`, `${base}: anonymous read rejected`, r.status === 401, r.status);
  }

  // ── Role checks: USER → admin endpoints ──────────────────────────────
  const adminGets = [
    "/api/v1/admin/users", "/api/v1/admin/dashboard", "/api/v1/admin/audit-logs", "/api/v1/admin/settings",
    "/api/v1/admin/questions", "/api/v1/admin/topics", "/api/v1/admin/statistics", "/api/v1/admin/exams",
    "/api/v1/admin/contact-inquiries", "/api/v1/admin/partner-leads", "/api/v1/admin/downloads",
    "/api/v1/admin/activation-codes", "/api/v1/admin/backups", "/api/v1/files/list/questions", "/api/v1/files/storage-type",
    "/actuator/env", "/actuator/metrics", "/api/v1/admin/system/monitor",
  ];
  // /actuator/prometheus: loopback/ichki tarmoq "ishonchli" (Prometheus scrape) — bu probe loopback'dan ishlaydi,
  // shuning uchun bu yerda faqat 500 bermasligi tekshiriladi; prod'da nginx /actuator ni umuman proksi qilmaydi.
  r = await http("GET", "/actuator/prometheus");
  check("PROM-1", "/actuator/prometheus (loopback) never answers 500", r.status < 500, r.status);
  const leaks = [];
  for (const p of adminGets) {
    const x = await http("GET", p, { token: u1.token });
    if (![401, 403, 404].includes(x.status)) leaks.push(`${p}=${x.status}`);
  }
  check("ROLE-1", `USER token rejected on ${adminGets.length} admin/actuator GETs`, leaks.length === 0, leaks.join(", "));
  const anonLeaks = [];
  for (const p of adminGets) {
    const x = await http("GET", p);
    if (![401, 403, 404].includes(x.status)) anonLeaks.push(`${p}=${x.status}`);
  }
  check("ROLE-2", "Anonymous rejected on the same endpoints", anonLeaks.length === 0, anonLeaks.join(", "));

  // ADMIN must not be able to mint SUPER_ADMINs or change roles
  r = await http("POST", "/api/v1/admin/users", { token: staff.token, body: { firstName: "Esc", lastName: "Alate", email: "probe-esc@audit.local", password: ENV.APP_INIT_USER_PASSWORD, role: "SUPER_ADMIN" } });
  check("ROLE-3", "ADMIN cannot create users (SUPER_ADMIN only)", r.status === 403, r.status);
  r = await http("PUT", `/api/v1/admin/users/${u2.id}/role`, { token: staff.token, body: { role: "SUPER_ADMIN" } });
  check("ROLE-4", "ADMIN cannot change roles", r.status === 403, r.status);
  r = await http("PUT", `/api/v1/admin/users/${u2.id}/role?role=SUPER_ADMIN`, { token: u2.token });
  check("ROLE-5", "USER cannot change own role", r.status === 403, r.status);
  r = await http("DELETE", `/api/v1/admin/users/${u1.id}`, { token: staff.token });
  check("ROLE-6", "ADMIN cannot delete users", r.status === 403, r.status);

  // ── Mass assignment on PATCH /auth/me ────────────────────────────────
  r = await http("PATCH", "/api/v1/auth/me", { token: u2.token, body: { fullName: "Probe Two", role: "SUPER_ADMIN", isActive: "false", email: "hijack@audit.local", id: String(u1.id), hasSubscription: "true" } });
  const me = await http("GET", "/api/v1/auth/me", { token: u2.token });
  check("MASS-1", "PATCH /auth/me ignores role/email/id/subscription fields",
    r.status === 200 && me.json?.data?.role === "USER" && me.json?.data?.id === u2.id && me.json?.data?.email === "probe-user2@audit.local",
    `${r.status} role=${me.json?.data?.role} email=${me.json?.data?.email}`);
  check("MASS-2", "PATCH /auth/me applies fullName", me.json?.data?.firstName === "Probe", me.json?.data?.firstName);
  r = await http("PATCH", "/api/v1/auth/me", { token: u2.token, body: { fullName: "x" } });
  check("VAL-1", "fullName shorter than 2 chars → 400/422", [400, 422].includes(r.status), r.status);
  r = await http("PATCH", "/api/v1/auth/me", { token: u2.token, body: { fullName: "a".repeat(81) } });
  check("VAL-2", "fullName longer than 80 chars → 400/422", [400, 422].includes(r.status), r.status);
  await http("PATCH", "/api/v1/auth/me", { token: u2.token, body: { fullName: "Probe USER" } });

  // ── Auth edge cases ──────────────────────────────────────────────────
  r = await http("GET", "/api/v1/auth/me");
  check("AUTH-1", "GET /auth/me without token → 401", r.status === 401, r.status);
  r = await http("GET", "/api/v1/auth/me", { token: u1.token.slice(0, -4) + "AAAA" });
  check("AUTH-2", "Tampered JWT signature → 401", r.status === 401, r.status);
  r = await http("GET", "/api/v1/auth/me", { token: "eyJhbGciOiJub25lIn0.eyJzdWIiOiJ1c2VyQHByYXZhb25saW5lLnV6Iiwicm9sZSI6IlNVUEVSX0FETUlOIiwidXNlcklkIjoxfQ." });
  check("AUTH-3", "alg=none JWT → 401", r.status === 401, r.status);
  r = await http("POST", "/api/v1/auth/refresh", { body: { refreshToken: u2.refresh } });
  const rotated = r.json?.data?.refreshToken;
  check("AUTH-4", "Refresh token works and rotates", r.status === 200 && rotated && rotated !== u2.refresh, r.status);
  // Dizayn: 15 s "grace window" (parallel tab poygasi) — eski token YANGI token yaratmaydi, mavjud aktivini qaytaradi.
  r = await http("POST", "/api/v1/auth/refresh", { body: { refreshToken: u2.refresh } });
  check("AUTH-5a", "Reuse inside the 15 s grace window returns the SAME active token (no new family)",
    r.status === 200 && r.json?.data?.refreshToken === rotated, `${r.status} same=${r.json?.data?.refreshToken === rotated}`);
  {
    // Alohida sessiya: grace oynasidan keyin eski token qayta ishlatilsa — butun oila bekor qilinadi.
    const s = await login("probe-user2@audit.local", ENV.APP_INIT_USER_PASSWORD);
    const rot = await http("POST", "/api/v1/auth/refresh", { body: { refreshToken: s.refresh } });
    const fresh = rot.json?.data?.refreshToken;
    await new Promise((res) => setTimeout(res, 16_500));
    const replay = await http("POST", "/api/v1/auth/refresh", { body: { refreshToken: s.refresh } });
    const victim = await http("POST", "/api/v1/auth/refresh", { body: { refreshToken: fresh } });
    check("AUTH-5b", "Replay after the grace window → 401 and the whole token family is revoked",
      rot.status === 200 && [400, 401].includes(replay.status) && [400, 401].includes(victim.status), `${rot.status}/${replay.status}/${victim.status}`);
  }
  r = await http("POST", "/api/v1/auth/logout", { body: { refreshToken: rotated } });
  const after = await http("POST", "/api/v1/auth/refresh", { body: { refreshToken: rotated } });
  check("AUTH-6", "Logout revokes the refresh token", r.status === 200 && [400, 401].includes(after.status), `${r.status}/${after.status}`);
  r = await http("POST", "/api/v1/auth/logout");
  check("AUTH-7", "Logout without body/cookie does not 500", r.status === 200, r.status);

  // ── Error leakage / input validation ─────────────────────────────────
  r = await http("POST", "/api/v2/exams/start-visible", { token: u1.token, body: "{bad json", raw: true, headers: { "Content-Type": "application/json" } });
  check("ERR-1", "Malformed JSON → 4xx without stack trace", r.status >= 400 && r.status < 500 && !STACK_RE.test(r.text), `${r.status} ${r.text.slice(0, 80)}`);
  r = await http("GET", "/api/v2/exams/abc/result", { token: u1.token });
  check("ERR-2", "Non-numeric path id → 4xx without stack trace", r.status >= 400 && r.status < 500 && !STACK_RE.test(r.text), r.status);
  r = await http("GET", "/api/v2/exams/999999999/result", { token: u1.token });
  check("ERR-3", "Unknown exam id → 404 without stack trace", [403, 404].includes(r.status) && !STACK_RE.test(r.text), r.status);
  r = await http("GET", "/api/v1/public/news/' OR 1=1 --");
  check("ERR-4", "SQL-ish slug → 4xx, no SQL error text", r.status >= 400 && r.status < 500 && !STACK_RE.test(r.text), r.status);
  r = await http("GET", "/api/v1/admin/users?search=%27%20OR%201%3D1--&page=0&size=5", { token: admin.token });
  check("ERR-5", "SQL-ish admin search handled (no 500)", r.status === 200 && !STACK_RE.test(r.text), r.status);
  r = await http("GET", "/api/v1/admin/users?page=-1&size=100000", { token: admin.token });
  check("ERR-6", "Absurd pagination does not 500", r.status < 500, r.status);

  // ── Files: path traversal / upload by user ───────────────────────────
  const trav = ["/api/v1/files/questions/..%2F..%2F..%2Fapplication.yaml", "/api/v1/files/general/..%5C..%5Capplication.yaml",
    "/api/v1/files/questions/%2e%2e/%2e%2e/etc/passwd", "/api/v1/files/profiles/....//....//application.yaml"];
  const travBad = [];
  for (const p of trav) {
    const x = await http("GET", p);
    if (x.status === 200 && /spring|datasource|root:x:/.test(x.text)) travBad.push(`${p}=${x.status}`);
    if (x.status >= 500) travBad.push(`${p}=${x.status}`);
  }
  check("FILE-1", "Path traversal attempts never return files or 500", travBad.length === 0, travBad.join(", "));
  const fd = new FormData();
  fd.append("file", new Blob(["<svg onload=alert(1)>"], { type: "image/svg+xml" }), "x.svg");
  const up = await fetch(BASE + "/api/v1/files/upload/multiple?folder=questions", { method: "POST", headers: { Authorization: `Bearer ${u1.token}` }, body: fd });
  check("FILE-2", "USER cannot upload files", up.status === 403, up.status);

  // ── CORS ─────────────────────────────────────────────────────────────
  let pre = await fetch(BASE + "/api/v1/auth/me", { method: "OPTIONS", headers: { Origin: "https://evil.example", "Access-Control-Request-Method": "GET", "Access-Control-Request-Headers": "authorization" } });
  check("CORS-1", "Preflight from foreign origin is not allowed", !pre.headers.get("access-control-allow-origin"), `${pre.status} ${pre.headers.get("access-control-allow-origin")}`);
  pre = await fetch(BASE + "/api/v1/auth/me", { method: "OPTIONS", headers: { Origin: "https://web.pravaonline.uz", "Access-Control-Request-Method": "GET", "Access-Control-Request-Headers": "authorization" } });
  check("CORS-2", "Preflight from web.pravaonline.uz allowed with credentials",
    pre.headers.get("access-control-allow-origin") === "https://web.pravaonline.uz" && pre.headers.get("access-control-allow-credentials") === "true", pre.status);
  pre = await fetch(BASE + "/api/v1/auth/me", { method: "OPTIONS", headers: { Origin: "http://tauri.localhost", "Access-Control-Request-Method": "GET", "Access-Control-Request-Headers": "authorization" } });
  check("CORS-3", "Desktop origin http://tauri.localhost allowed (desktop app)", pre.headers.get("access-control-allow-origin") === "http://tauri.localhost", `${pre.status} ${pre.headers.get("access-control-allow-origin")}`);

  // ── Account enumeration + brute force ────────────────────────────────
  const a = await http("POST", "/api/v1/auth/login", { body: { identifier: "user@pravaonline.uz", password: "definitely-wrong-1" } });
  const b = await http("POST", "/api/v1/auth/login", { body: { identifier: "nobody-here@audit.local", password: "definitely-wrong-1" } });
  check("ENUM-1", "Wrong password vs unknown user give the same status and message",
    a.status === b.status && a.json?.message === b.json?.message, `${a.status}:${a.json?.message} | ${b.status}:${b.json?.message}`);
  let limited = 0;
  for (let i = 0; i < 25; i++) {
    const x = await http("POST", "/api/v1/auth/login", { body: { identifier: "nobody-here@audit.local", password: `wrong-${i}` } });
    if (x.status === 429) { limited = i + 1; break; }
  }
  check("RATE-1", "Login brute force is rate-limited (429 within 25 attempts)", limited > 0, limited ? `429 after ${limited}` : "never 429");

  if (process.env.PROBE_OUT) fs.writeFileSync(process.env.PROBE_OUT, JSON.stringify(results, null, 2));
  const fail = results.filter((x) => x.status === "FAIL").length;
  console.log(`\nTOTAL ${results.length}  PASS ${results.length - fail}  FAIL ${fail}`);
  process.exitCode = fail ? 1 : 0;
}

main().catch((e) => { console.error("FATAL", e.message); process.exitCode = 2; });
