#!/usr/bin/env node
/**
 * OKTAGON + Telegram-session end-to-end test against a RUNNING backend (real HTTP, real WebSocket, real DB).
 *
 * Never point this at production: it creates a test user, plays matches and changes ELO.
 *
 * Env:
 *   OCT_BASE      backend base URL            (default http://127.0.0.1:18080)
 *   OCT_ENV       env file with APP_INIT_SUPER_ADMIN_PASSWORD, APP_INIT_USER_PASSWORD, TELEGRAM_WEBHOOK_SECRET
 *   OCT_ANSWERS   JSON {questionId: correctIndex} exported from the same database (to verify server scoring)
 *   OCT_OUT       where to write the JSON results (optional)
 *   WS_MODULE     path to the `ws` package (default: prava-mobile/node_modules/ws)
 */
import { createRequire } from "node:module";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const WebSocket = require(process.env.WS_MODULE || "D:/My-project/PRAVA-ONLINE/prava-mobile/node_modules/ws");

const BASE = process.env.OCT_BASE || "http://127.0.0.1:18080";
const WS_BASE = BASE.replace(/^http/, "ws");
if (/pravaonline\.uz/.test(BASE)) throw new Error("Refusing to run against production");
const ENV = Object.fromEntries(
  fs.readFileSync(process.env.OCT_ENV, "utf8").split(/\r?\n/).filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
);
const ANSWERS = JSON.parse(fs.readFileSync(process.env.OCT_ANSWERS, "utf8"));
const ORIGIN = "http://localhost:5173";

const results = [];
function check(id, name, ok, detail = "") {
  results.push({ id, name, status: ok ? "PASS" : "FAIL", detail: String(detail).slice(0, 300) });
  console.log(`${ok ? "PASS" : "FAIL"} ${id} ${name}${detail ? " — " + String(detail).slice(0, 200) : ""}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function http(method, path, { token, body, headers = {} } = {}) {
  const h = { Accept: "application/json", ...headers };
  if (body !== undefined) h["Content-Type"] = "application/json";
  if (token) h.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
  let json = null;
  const text = await res.text();
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, json };
}

async function login(identifier, password) {
  const r = await http("POST", "/api/v1/auth/login", { body: { identifier, password } });
  if (r.status !== 200) throw new Error(`login ${identifier} failed: ${r.status} ${JSON.stringify(r.json).slice(0, 200)}`);
  return { token: r.json.data.accessToken, id: String(r.json.data.user.id), name: r.json.data.user.firstName };
}

async function ticketFor(token) {
  const r = await http("POST", "/api/v1/octagon/ticket", { token });
  return r.json.data.ticket;
}

/** WebSocket client with an event queue. */
function connect(ticket, name, origin = ORIGIN) {
  return new Promise((resolve, reject) => {
    const url = `${WS_BASE}/ws/octagon${ticket ? `?ticket=${encodeURIComponent(ticket)}` : ""}`;
    const ws = new WebSocket(url, { headers: { Origin: origin } });
    const queues = new Map();
    const waiters = [];
    const client = {
      name, ws, closeCode: null, opened: false,
      send(event, data = {}) { ws.send(JSON.stringify({ event, data })); },
      next(event, timeout = 15000, pred = () => true) {
        const q = queues.get(event) || [];
        const idx = q.findIndex(pred);
        if (idx >= 0) return Promise.resolve(q.splice(idx, 1)[0]);
        return new Promise((res, rej) => {
          const w = { event, pred, res, timer: setTimeout(() => { waiters.splice(waiters.indexOf(w), 1); rej(new Error(`${name}: timeout waiting ${event}`)); }, timeout) };
          waiters.push(w);
        });
      },
      drain(event) { const q = queues.get(event) || []; queues.set(event, []); return q; },
      close() { try { ws.close(); } catch {} },
    };
    ws.on("message", (raw) => {
      const msg = JSON.parse(raw.toString());
      const w = waiters.find((x) => x.event === msg.event && x.pred(msg.data));
      if (w) { clearTimeout(w.timer); waiters.splice(waiters.indexOf(w), 1); w.res(msg.data); return; }
      if (!queues.has(msg.event)) queues.set(msg.event, []);
      queues.get(msg.event).push(msg.data);
    });
    ws.on("open", () => { client.opened = true; resolve(client); });
    ws.on("unexpected-response", (_req, res) => reject(Object.assign(new Error(`handshake ${res.statusCode}`), { statusCode: res.statusCode })));
    ws.on("close", (code) => { client.closeCode = code; if (!client.opened) reject(Object.assign(new Error(`closed ${code}`), { code })); });
    ws.on("error", () => {});
  });
}

/** Opens and waits for a close code (for rejected tickets the server accepts the upgrade, then closes 4001). */
async function closeCodeOf(ticket) {
  const c = await connect(ticket, "probe").catch((e) => e);
  if (c instanceof Error) return c.code ?? c.statusCode ?? -1;
  for (let i = 0; i < 40 && c.closeCode === null; i++) await sleep(100);
  return c.closeCode;
}

function rightIndex(q) { return ANSWERS[String(q.id)]; }
function wrongIndex(q) { const n = (q.options || []).length || 4; return (rightIndex(q) + 1) % n; }

async function playBoth(a, b, matchId, questions, { aCorrect = 10, bCorrect = 0, skipB = false } = {}) {
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    a.send("submit_answer", { matchId, questionId: q.id, selectedIndex: i < aCorrect ? rightIndex(q) : wrongIndex(q) });
    if (!skipB && b) b.send("submit_answer", { matchId, questionId: q.id, selectedIndex: i < bCorrect ? rightIndex(q) : wrongIndex(q) });
    await sleep(60);
  }
}

async function main() {
  // ── Accounts ─────────────────────────────────────────────────────────
  const admin = await login("superadmin@pravaonline.uz", ENV.APP_INIT_SUPER_ADMIN_PASSWORD);
  const u1 = await login("user@pravaonline.uz", ENV.APP_INIT_USER_PASSWORD);
  const create = await http("POST", "/api/v1/admin/users", {
    token: admin.token,
    body: { firstName: "Ikkinchi", lastName: "Oyinchi", email: "player2@audit.local", password: ENV.APP_INIT_USER_PASSWORD, role: "USER" },
  });
  check("SETUP-1", "Second test player created via admin API (or already exists)", [200, 201, 409].includes(create.status), create.status);
  const u2 = await login("player2@audit.local", ENV.APP_INIT_USER_PASSWORD);

  // ── REST security probes ─────────────────────────────────────────────
  let r = await http("GET", "/api/v1/octagon/users/search?q=998");
  check("SEC-1", "Anonymous user search rejected (no PII enumeration)", r.status === 401, r.status);
  r = await http("POST", "/api/v1/octagon/questions", { body: [1, 2, 3] });
  check("SEC-2", "Questions REST refuses ids outside a live game", r.status === 403, r.status);
  r = await http("POST", `/api/v1/octagon/ticket?guestId=${u1.id}&displayName=Hacker`);
  check("SEC-3", "Mandatory login: anonymous ticket refused (no guest mode, guestId ignored)", r.status === 401, `${r.status} ${JSON.stringify(r.json).slice(0, 80)}`);
  r = await http("POST", "/api/v1/octagon/challenge/create");
  check("SEC-3b", "Anonymous duel invite refused", r.status === 401, r.status);
  r = await http("GET", `/api/v1/octagon/history?userId=${u1.id}`);
  check("SEC-4", "Anonymous ?userId= history IDOR closed", r.status === 200 && (r.json.data.content || []).length === 0, JSON.stringify(r.json.data).slice(0, 80));
  r = await http("POST", "/api/v1/octagon/report", { body: { reportedUserId: u2.id, reason: "AFK" } });
  check("SEC-5", "Anonymous report rejected", r.status === 401, r.status);
  r = await http("GET", "/api/v1/octagon/users/search?q=user@pravaonline", { token: u2.token });
  check("SEC-6", "Search does not match by e-mail", r.status === 200 && r.json.data.length === 0, JSON.stringify(r.json.data).slice(0, 80));

  // ── WebSocket handshake security ─────────────────────────────────────
  check("WS-1", "WS without ticket closed with 4001", (await closeCodeOf(null)) === 4001);
  const once = await ticketFor(u1.token);
  const firstUse = await connect(once, "once");
  firstUse.close();
  check("WS-2", "Ticket replay closed with 4001", (await closeCodeOf(once)) === 4001);
  const evil = await connect(await ticketFor(u1.token), "evil", "https://evil.example").catch((e) => e);
  check("WS-3", "Foreign Origin rejected at handshake", evil instanceof Error && evil.statusCode === 403, evil.message);

  // ── 1v1 ranked match ─────────────────────────────────────────────────
  let p1 = await connect(await ticketFor(u1.token), "P1");
  let p2 = await connect(await ticketFor(u2.token), "P2");
  p1.send("join_queue", { userProgress: 0, currentElo: 9999 });
  p2.send("join_queue", { userProgress: 0, currentElo: 9999 });
  // ELO farqi katta bo'lsa matchmaker 15 s dan keyin har qanday raqib bilan juftlaydi
  const f1 = await p1.next("match_found", 20000);
  const f2 = await p2.next("match_found", 20000);
  check("M-1", "Both players got the same matchId", f1.matchId === f2.matchId, f1.matchId);
  check("M-2", "Opponents cross-identified", f1.opponent.id === u2.id && f2.opponent.id === u1.id, `${f1.opponent.id}/${f2.opponent.id}`);
  const LEAGUES = ["bronze", "silver", "gold", "platinum", "brilliant", "master"];
  const cardOk = (o) =>
    typeof o.name === "string" && o.name.trim() !== "" && !/^(null|undefined)$/i.test(o.name.trim()) &&
    LEAGUES.includes(o.rank) && typeof o.elo === "number" && o.elo === o.score && "avatar" in o &&
    (o.avatar === null || /^(https:\/\/|\/api\/v1\/files\/)/.test(o.avatar));
  check("M-2b", "Opponent card: real name (never null/undefined), ELO, 6-league rank, avatar or null", cardOk(f1.opponent) && cardOk(f2.opponent), JSON.stringify(f1.opponent));
  check("M-3", "Client-sent ELO 9999 ignored (opponent card shows server ELO)", f1.opponent.score !== 9999 && f2.opponent.score !== 9999, f1.opponent.score);
  const qs = f1.questions || [];
  const leaks = qs.filter((q) => "correctAnswerIndex" in q || "correctOption" in q || (q.explanationUzl ?? null) !== null);
  check("M-4", "10 questions delivered in match_found without answers/explanations", qs.length === 10 && leaks.length === 0, `n=${qs.length} leaks=${leaks.length}`);
  check("M-5", "Same question set on both sides", JSON.stringify(f1.questionIds) === JSON.stringify(f2.questionIds));
  r = await http("POST", "/api/v1/octagon/questions", { token: u1.token, body: f1.questionIds });
  check("M-6", "Questions REST allowed for the live match set", r.status === 200 && r.json.data.length === 10, r.status);
  const countdown = await p1.next("countdown_tick", 12000);
  check("M-7", "Countdown received", countdown.count === 3, JSON.stringify(countdown));
  await p1.next("match_started", 8000);
  await p2.next("match_started", 2000);
  check("M-8", "match_started on both clients", true);

  p1.send("submit_answer", { matchId: f1.matchId, questionId: 99999999, selectedIndex: 0 });
  const foreign = await p1.next("answer_result", 800).catch(() => null);
  check("M-9", "Answer for a foreign question rejected", foreign === null, JSON.stringify(foreign));

  p1.send("submit_answer", { matchId: f1.matchId, questionId: qs[0].id, selectedIndex: rightIndex(qs[0]) });
  const ar = await p1.next("answer_result", 3000);
  check("M-10", "answer_result: correct, score 1, no correct index leaked", ar.isCorrect === true && ar.myScore === 1 && !("correctIndex" in ar), JSON.stringify(ar));
  const prog = await p2.next("opponent_progress", 3000);
  check("M-11", "Opponent progress pushed to the other player", prog.answeredCount === 1 && prog.correctCount === 1, JSON.stringify(prog));
  p1.send("submit_answer", { matchId: f1.matchId, questionId: qs[0].id, selectedIndex: rightIndex(qs[0]) });
  const dup = await p1.next("answer_result", 800).catch(() => null);
  check("M-12", "Duplicate answer ignored", dup === null);
  p1.send("send_reaction", { matchId: f1.matchId, emojiId: "fire" });
  const rx = await p2.next("opponent_reaction", 3000).catch(() => null);
  check("M-13", "Reaction relayed to opponent", rx?.emojiId === "fire");

  for (let i = 1; i < 10; i++) p1.send("submit_answer", { matchId: f1.matchId, questionId: qs[i].id, selectedIndex: rightIndex(qs[i]) });
  for (let i = 0; i < 10; i++) p2.send("submit_answer", { matchId: f1.matchId, questionId: qs[i].id, selectedIndex: i < 3 ? rightIndex(qs[i]) : wrongIndex(qs[i]) });
  const e1 = await p1.next("match_ended", 8000);
  const e2 = await p2.next("match_ended", 3000);
  check("M-14", "Server scoring matches the DB answer key (10:3)", e1.finalScores.me === 10 && e1.finalScores.opponent === 3 && e2.finalScores.me === 3, JSON.stringify(e1.finalScores));
  check("M-15", "Winner = P1, ELO deltas from server", e1.winnerId === u1.id && e1.myDeltaElo > 0 && e2.myDeltaElo <= 0, `w=${e1.winnerId} d1=${e1.myDeltaElo} d2=${e2.myDeltaElo}`);
  const s1 = (await http("GET", "/api/v1/octagon/stats", { token: u1.token })).json.data;
  const s2 = (await http("GET", "/api/v1/octagon/stats", { token: u2.token })).json.data;
  check("M-16", "Stats persisted (P1 win, P2 loss)", s1.wins >= 1 && s2.losses >= 1 && s1.eloRating >= e1.myDeltaElo, `p1 elo=${s1.eloRating} w=${s1.wins}; p2 l=${s2.losses}`);
  const h1 = (await http("GET", "/api/v1/octagon/history", { token: u1.token })).json.data.content;
  check("M-17", "History lists the match as WIN", h1[0]?.matchId === f1.matchId && h1[0]?.result === "WIN", JSON.stringify(h1[0]).slice(0, 120));

  // ── Rematch (exactly once) + reconnect + forfeit ─────────────────────
  p1.send("request_revenge", { matchId: f1.matchId });
  p1.send("request_revenge", { matchId: f1.matchId });
  p2.send("request_revenge", { matchId: f1.matchId });
  p2.send("request_revenge", { matchId: f1.matchId });
  const rm1 = await p1.next("match_found", 5000);
  await p2.next("match_found", 3000);
  await sleep(1500);
  check("R-1", "Exactly one rematch created", p1.drain("match_found").length === 0 && rm1.matchId !== f1.matchId, rm1.matchId);
  await p1.next("match_started", 13000);
  p1.close();
  await sleep(500);
  p1 = await connect(await ticketFor(u1.token), "P1b");
  const rc = await p1.next("game_reconnect", 5000);
  check("R-2", "Reconnect with a fresh ticket restores the match (questions included)", rc.matchId === rm1.matchId && rc.started === true && (rc.questionIds || []).length === 10, JSON.stringify({ m: rc.matchId, s: rc.started, n: (rc.questionIds || []).length }));
  p2.close();
  const forfeit = await p1.next("match_ended", 62000);
  check("R-3", "Abandoning player loses by forfeit after the 45 s grace period", forfeit.forfeit === true && forfeit.winnerId === u1.id, JSON.stringify(forfeit).slice(0, 160));

  // ── Friend challenge ────────────────────────────────────────────────
  p2 = await connect(await ticketFor(u2.token), "P2b");
  const search = (await http("GET", "/api/v1/octagon/users/search?q=Ikkinchi", { token: u1.token })).json.data;
  check("C-1", "Search shows the online friend with isOnline=true", search.some((u) => u.userId === u2.id && u.isOnline === true && u.status === "AVAILABLE"), JSON.stringify(search).slice(0, 160));
  // Cancel: the challenger withdraws during the 30 s window — the target's prompt closes
  p1.send("send_challenge", { targetUserId: u2.id });
  const sent0 = await p1.next("challenge_sent", 4000);
  const inc0 = await p2.next("challenge_received", 4000);
  check("C-1b", "Challenge carries a 30 s window and the challenger card", sent0.expiresInSec === 30 && inc0.expiresInSec === 30 && inc0.challenger.displayName && "avatarUrl" in inc0.challenger, JSON.stringify(inc0.challenger).slice(0, 120));
  p1.send("cancel_challenge", { challengeId: sent0.challengeId });
  const cancelled = await p2.next("challenge_cancelled", 4000);
  check("C-1c", "Cancelled challenge closes the target's prompt", cancelled.challengeId === sent0.challengeId && cancelled.reason === "CANCELLED", JSON.stringify(cancelled));

  p1.send("send_challenge", { targetUserId: u2.id });
  const inc = await p2.next("challenge_received", 4000);
  check("C-2", "Challenge delivered to target", inc.challenger.userId === u1.id, JSON.stringify(inc.challenger).slice(0, 100));
  p2.send("accept_challenge", { challengeId: inc.challengeId });
  const d1 = await p1.next("match_found", 5000);
  const d2 = await p2.next("match_found", 3000);
  check("C-3", "Accepted challenge starts a duel for both", d1.matchId === d2.matchId);
  await p1.next("match_started", 13000);
  await playBoth(p1, p2, d1.matchId, d1.questions, { aCorrect: 4, bCorrect: 4 });
  const de = await p1.next("match_ended", 8000);
  check("C-4", "Equal score duel ends in a draw", de.isDraw === true && de.finalScores.me === de.finalScores.opponent, JSON.stringify(de.finalScores));

  // ── Invite link / QR / code (?duel=CODE) ────────────────────────────
  const inv = (await http("POST", "/api/v1/octagon/challenge/create", { token: u1.token })).json.data;
  check("I-1", "Invite code created for a logged-in user", /^[A-Z2-9]{10}$/.test(inv.inviteCode || ""), inv.inviteCode);
  p1.send("join_invite", { inviteCode: inv.inviteCode });
  const own = await p1.next("challenge_error", 3000);
  check("I-2", "Own invite cannot be joined", own.code === "OWN_INVITE", own.code);
  p2.send("join_invite", { inviteCode: "NOSUCHCODE" });
  const nf = await p2.next("challenge_error", 3000);
  check("I-3", "Unknown invite code → INVITE_NOT_FOUND", nf.code === "INVITE_NOT_FOUND", nf.code);
  p2.send("join_invite", { inviteCode: inv.inviteCode.toLowerCase() });
  const j1 = await p1.next("match_found", 5000);
  const j2 = await p2.next("match_found", 3000);
  check("I-4", "Invite code starts a friend duel with the inviter (not a random search)", j1.matchId === j2.matchId && j1.opponent.id === u2.id && j2.opponent.id === u1.id, `${j1.opponent.id}/${j2.opponent.id}`);
  await p1.next("match_started", 13000);
  await playBoth(p1, p2, j1.matchId, j1.questions, { aCorrect: 6, bCorrect: 2 });
  await p1.next("match_ended", 8000);
  await p2.next("match_ended", 8000);
  p2.send("join_invite", { inviteCode: inv.inviteCode });
  const used = await p2.next("challenge_error", 3000);
  check("I-5", "An invite is single-use", used.code === "INVITE_NOT_FOUND", used.code);

  // ── Group room ──────────────────────────────────────────────────────
  p1.send("create_room", { maxPlayers: 4, isPrivate: true });
  const created = (await p1.next("room_created", 4000)).room;
  check("G-1", "Room code is high-entropy OCT-XXXXXX", /^OCT-[A-Z2-9]{6}$/.test(created.roomCode), created.roomCode);
  check("G-2", "Host flag serialised as isHost", created.members[0]?.isHost === true, JSON.stringify(created.members[0]).slice(0, 120));
  p2.send("join_room", { roomCode: "OCT-AAAAAA" });
  const notFound = await p2.next("room_error", 3000);
  check("G-3", "Unknown room code → ROOM_NOT_FOUND", notFound.code === "ROOM_NOT_FOUND");
  p2.send("join_room", { roomCode: created.roomCode.toLowerCase() });
  await p2.next("room_joined", 3000);
  p2.send("toggle_ready", { isReady: true });
  const upd = await p1.next("room_updated", 3000, (d) => d.room.members.length === 2 && d.room.members.some((m) => m.userId === u2.id && m.isReady));
  check("G-4", "Ready state visible to host", Boolean(upd));
  p1.send("start_room_game", {});
  p1.send("start_room_game", {});
  const started = await p2.next("room_game_started", 6000);
  check("G-5", "Room game started with embedded questions", (started.questions || []).length === 10);
  for (const [c, n] of [[p1, 10], [p2, 2]]) {
    started.questions.forEach((q, i) => c.send("submit_room_answer", { questionId: q.id, selectedIndex: i < n ? rightIndex(q) : wrongIndex(q) }));
  }
  const ge = await p1.next("group_match_ended", 6000);
  check("G-6", "Group standings from server scoring", ge.standings[0].userId === u1.id && ge.standings[0].score === 10 && ge.standings[1].score === 2, JSON.stringify(ge.standings.map((s) => [s.userId, s.score])));
  p1.send("leave_room", {});
  p2.send("leave_room", {});

  // ── Bot fallback ────────────────────────────────────────────────────
  p2.close();
  await sleep(300);
  p1.send("join_queue", {});
  const bf = await p1.next("match_found", 26000);
  check("B-1", "Bot opponent after ~20 s without humans", String(bf.opponent.id).startsWith("bot_"), bf.opponent.id);
  check("B-1b", "Bot looks like a real player (human name, nearby ELO, league)", /^\S+ \S\.$/.test(bf.opponent.name) && !/bot|_/i.test(bf.opponent.name) && LEAGUES.includes(bf.opponent.rank), `${bf.opponent.name} ${bf.opponent.elo} ${bf.opponent.rank}`);
  await p1.next("match_started", 13000);
  bf.questions.forEach((q) => p1.send("submit_answer", { matchId: bf.matchId, questionId: q.id, selectedIndex: rightIndex(q) }));
  const be = await p1.next("match_ended", 60000);
  check("B-2", "Bot match finished and scored", be.finalScores.me === 10, JSON.stringify(be.finalScores));
  const lb = (await http("GET", "/api/v1/octagon/leaderboard")).json.data;
  check("B-3", "Leaderboard has no bot/guest rows", lb.every((e) => !/^(bot|guest_)/.test(e.userId)) && lb.some((e) => e.userId === u1.id), `n=${lb.length}`);
  p1.close();

  // ── Telegram session login (bot simulated through the real webhook) ─
  const tgHeaders = { "X-Telegram-Bot-Api-Secret-Token": ENV.TELEGRAM_WEBHOOK_SECRET };
  let upd2 = Date.now();
  const sess = (await http("POST", "/api/v1/auth/telegram/session/init", { body: { platform: "desktop", deviceName: "Audit <b>PC</b>" } })).json.data;
  check("T-1", "Session init returns token, poll secret, tg:// and https links", /^auth_[0-9a-f]{48}$/.test(sess.token) && sess.directAppUrl.startsWith("tg://resolve") && sess.botUrl.startsWith("https://t.me/"));
  r = await http("GET", `/api/v1/auth/telegram/session/status?token=${sess.token}`, { headers: { "X-QR-Poll-Secret": "wrong" } });
  check("T-2", "Wrong poll secret → 403", r.status === 403, r.status);
  r = await http("POST", "/api/v1/telegram/webhook", { body: { update_id: upd2++ }, headers: { "X-Telegram-Bot-Api-Secret-Token": "forged" } });
  check("T-3", "Forged webhook (wrong secret) → 403", r.status === 403, r.status);
  const tgFrom = { id: 990001, first_name: "Audit", last_name: "Telegram", username: "audit_tg", language_code: "uz" };
  r = await http("POST", "/api/v1/telegram/webhook", { headers: tgHeaders, body: { update_id: upd2++, message: { chat: { id: 990001 }, from: tgFrom, text: `/start ${sess.token}` } } });
  const afterStart = (await http("GET", `/api/v1/auth/telegram/session/status?token=${sess.token}`, { headers: { "X-QR-Poll-Secret": sess.pollSecret } })).json.data;
  check("T-4", "/start alone does NOT approve (explicit confirmation required)", r.status === 200 && afterStart.status === "PENDING", afterStart.status);
  r = await http("POST", "/api/v1/telegram/webhook", { headers: tgHeaders, body: { update_id: upd2++, callback_query: { id: "cb1", from: tgFrom, data: `tga:${sess.token}`, message: { chat: { id: 990001 } } } } });
  const approved = (await http("GET", `/api/v1/auth/telegram/session/status?token=${sess.token}`, { headers: { "X-QR-Poll-Secret": sess.pollSecret } })).json.data;
  check("T-5", "Confirm button → APPROVED with tokens", approved.status === "APPROVED" && Boolean(approved.accessToken), approved.status);
  const me = await http("GET", "/api/v1/auth/me", { token: approved.accessToken });
  // UserResponse telegramId'ni qaytarmaydi — bot yaratgan akkaunt Telegram ismidan tanib olinadi
  check("T-6", "Issued access token works on /auth/me (Telegram user auto-created)", me.status === 200 && me.json.data.firstName === "Audit", `${me.status} ${me.json?.data?.firstName}`);
  const again = (await http("GET", `/api/v1/auth/telegram/session/status?token=${sess.token}`, { headers: { "X-QR-Poll-Secret": sess.pollSecret } })).json.data;
  check("T-7", "Tokens are issued only once (CONSUMED)", again.status === "CONSUMED" && !again.accessToken, again.status);
  const sess2 = (await http("POST", "/api/v1/auth/telegram/session/init", { body: { platform: "android" } })).json.data;
  await http("POST", "/api/v1/telegram/webhook", { headers: tgHeaders, body: { update_id: upd2++, callback_query: { id: "cb2", from: tgFrom, data: `tgr:${sess2.token}`, message: { chat: { id: 990001 } } } } });
  const rej = (await http("GET", `/api/v1/auth/telegram/session/status?token=${sess2.token}`, { headers: { "X-QR-Poll-Secret": sess2.pollSecret } })).json.data;
  check("T-8", "Reject button → REJECTED, no tokens", rej.status === "REJECTED" && !rej.accessToken, rej.status);
  const tl = await http("POST", "/api/v1/auth/telegram/token-login", { body: { token: "00000" } });
  check("T-9", "Legacy 5-digit token-login still answers (invalid code → 401)", tl.status === 401, tl.status);

  return { u1: u1.id, u2: u2.id, rankedMatch: f1.matchId, botMatch: bf.matchId };
}

main()
  .then((ids) => {
    const pass = results.filter((x) => x.status === "PASS").length;
    console.log(`\nTOTAL ${results.length}  PASS ${pass}  FAIL ${results.length - pass}`);
    if (process.env.OCT_OUT) fs.writeFileSync(process.env.OCT_OUT, JSON.stringify({ ids, results }, null, 2));
    process.exit(pass === results.length ? 0 : 1);
  })
  .catch((e) => {
    console.error("ABORTED:", e.message);
    if (process.env.OCT_OUT) fs.writeFileSync(process.env.OCT_OUT, JSON.stringify({ aborted: e.message, results }, null, 2));
    process.exit(2);
  });
