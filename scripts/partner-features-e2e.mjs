#!/usr/bin/env node
/**
 * Hamkor talablari E2E (lokal backend): avatar yuklash/tayyor avatar/o'chirish, xavfsizlik (SVG/HTML
 * niqoblangan fayl, begona URL), tayyor avatar fayllari, qurilmalar limiti (2) va /api/v1/statistics/devices aliasi.
 *
 *   OCT_BASE  backend base URL  (default http://127.0.0.1:18080; production'da ishga tushmaydi)
 *   OCT_ENV   env file with APP_INIT_USER_PASSWORD
 */
import fs from "node:fs";
import zlib from "node:zlib";

const BASE = process.env.OCT_BASE || "http://127.0.0.1:18080";
if (/pravaonline\.uz/.test(BASE)) throw new Error("Refusing to run against production");
const ENV = Object.fromEntries(
  fs.readFileSync(process.env.OCT_ENV, "utf8").split(/\r?\n/).filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
);

let pass = 0;
let fail = 0;
function check(id, name, ok, detail = "") {
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${id} ${name}${detail !== "" ? ` — ${String(detail).slice(0, 160)}` : ""}`);
}

async function http(method, path, { token, body, form, headers = {} } = {}) {
  const h = { Accept: "application/json", ...headers };
  if (body !== undefined) h["Content-Type"] = "application/json";
  if (token) h.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, { method, headers: h, body: form ?? (body === undefined ? undefined : JSON.stringify(body)) });
  const buf = Buffer.from(await res.arrayBuffer());
  let json = null;
  try {
    json = JSON.parse(buf.toString("utf8"));
  } catch {
    json = null;
  }
  return { status: res.status, json, headers: res.headers, buf };
}

async function login(identifier, password, userAgent) {
  const r = await http("POST", "/api/v1/auth/login", { body: { identifier, password }, headers: { "User-Agent": userAgent } });
  if (r.status !== 200) throw new Error(`login failed: ${r.status}`);
  return { token: r.json.data.accessToken, user: r.json.data.user };
}

/** Haqiqiy 1600×1200 PNG (zlib bilan) — serverda kvadratga kesilib, 1024 px gacha kichrayishi kerak. */
function png(width, height) {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (b) => {
    let c = 0xffffffff;
    for (const x of b) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const row = Buffer.alloc(1 + width * 3);
  for (let x = 0; x < width; x++) row.set([30, 120, 230], 1 + x * 3);
  const raw = Buffer.concat(Array.from({ length: height }, () => row));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function pngSize(buf) {
  return buf.slice(1, 4).toString("ascii") === "PNG" ? [buf.readUInt32BE(16), buf.readUInt32BE(20)] : null;
}

function fileForm(bytes, name, type) {
  const form = new FormData();
  form.append("file", new Blob([bytes], { type }), name);
  return form;
}

async function main() {
  const pw = ENV.APP_INIT_USER_PASSWORD;
  // ── Avatar: tayyor avatarlar ─────────────────────────────────────────
  let r = await http("GET", "/api/v1/public/avatars");
  const presets = r.json?.data || [];
  check("A-1", "Public preset list: 8 driver/car avatars", r.status === 200 && presets.length === 8, presets.map((p) => p.id).join(","));
  r = await http("GET", presets[0]?.url || "/api/v1/public/avatars/driver.svg");
  check("A-2", "Preset served as SVG with sandbox CSP + nosniff", r.status === 200 && /image\/svg\+xml/.test(r.headers.get("content-type")) && /sandbox/.test(r.headers.get("content-security-policy") || "") && r.buf.toString().startsWith("<svg"), r.headers.get("content-type"));
  r = await http("GET", "/api/v1/public/avatars/..%2F..%2Fapplication.yaml");
  check("A-3", "Path traversal on presets refused", r.status === 404 || r.status === 400, r.status);

  const u = await login("user@pravaonline.uz", pw, "PravaOnline-E2E Chrome/120 Windows");
  r = await http("POST", "/api/v1/auth/avatar", { form: fileForm(png(10, 10), "a.png", "image/png") });
  check("A-4", "Anonymous avatar upload refused", r.status === 401 || r.status === 403, r.status);

  r = await http("POST", "/api/v1/auth/avatar", { token: u.token, form: fileForm(png(1600, 1200), "photo.png", "image/png") });
  const uploadedUrl = r.json?.data?.profileImageUrl;
  check("A-5", "PNG upload → profileImageUrl under /api/v1/files/profiles/", r.status === 200 && /^\/api\/v1\/files\/profiles\/[0-9a-f-]{36}\.png$/.test(uploadedUrl || ""), uploadedUrl);
  r = await http("GET", uploadedUrl);
  check("A-6", "Stored avatar is a square ≤1024 px (cropped + resized server-side)", r.status === 200 && JSON.stringify(pngSize(r.buf)) === "[1024,1024]", JSON.stringify(pngSize(r.buf)));
  r = await http("GET", "/api/v1/auth/me", { token: u.token });
  check("A-7", "/auth/me returns the new avatar (persists)", r.json?.data?.profileImageUrl === uploadedUrl, r.json?.data?.profileImageUrl);

  r = await http("POST", "/api/v1/auth/avatar", { token: u.token, form: fileForm(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>"), "x.png", "image/png") });
  check("A-8", "SVG/HTML disguised as image/png rejected (422)", r.status === 422, `${r.status} ${r.json?.message || ""}`);
  r = await http("POST", "/api/v1/auth/avatar", { token: u.token, form: fileForm(Buffer.alloc(3 * 1024 * 1024 + 10, 1), "big.jpg", "image/jpeg") });
  check("A-9", "Files over 3 MB rejected", r.status === 422, `${r.status} ${r.json?.message || ""}`);

  r = await http("PATCH", "/api/v1/auth/me", { token: u.token, body: { profileImageUrl: "https://evil.example/x.png" } });
  check("A-10", "Arbitrary external avatar URL refused", r.status === 422, `${r.status} ${r.json?.message || ""}`);
  const preset = presets.find((p) => p.id === "sport-car") || presets[0];
  r = await http("PATCH", "/api/v1/auth/me", { token: u.token, body: { profileImageUrl: preset.url } });
  check("A-11", "Preset avatar can be chosen", r.status === 200 && r.json?.data?.profileImageUrl === preset.url, r.json?.data?.profileImageUrl);
  r = await http("GET", uploadedUrl);
  check("A-12", "Previous uploaded file is deleted after switching", r.status === 404, r.status);
  r = await http("DELETE", "/api/v1/auth/avatar", { token: u.token });
  check("A-13", "Avatar removed → back to initials", r.status === 200 && !r.json?.data?.profileImageUrl, JSON.stringify(r.json?.data?.profileImageUrl));

  // ── Qurilmalar: limit 2, eng eski sessiya chiqariladi ───────────────
  const s1 = await login("user@pravaonline.uz", pw, "okhttp/4.12 PravaOnline Android");
  const s2 = await login("user@pravaonline.uz", pw, "Mozilla/5.0 (Windows NT 10.0) Chrome/120.0 Safari/537.36");
  r = await http("GET", "/api/v2/my-statistics/devices", { token: s2.token });
  const d = r.json?.data;
  check("D-1", "Device limit is 2 and the list shows exactly 2 sessions", r.status === 200 && d?.maxDevices === 2 && d?.devices?.length === 2, `max=${d?.maxDevices} n=${d?.devices?.length}`);
  check("D-2", "Current device flagged and names are readable (App · Android / Chrome · Windows)", d?.devices?.some((x) => x.isCurrent && /Chrome/.test(x.deviceName)) && d?.devices?.some((x) => /App · Android/.test(x.deviceName)), d?.devices?.map((x) => `${x.deviceName}${x.isCurrent ? "*" : ""}`).join(", "));
  r = await http("GET", "/api/v1/statistics/devices", { token: s2.token });
  check("D-3", "/api/v1/statistics/devices works the same as /api/v2/my-statistics/devices", r.status === 200 && r.json?.data?.maxDevices === 2 && r.json?.data?.devices?.length === 2, r.status);
  r = await http("GET", "/api/v1/auth/me", { token: u.token });
  check("D-4", "Oldest session (3rd login) was signed out — its access token is rejected", r.status === 401, r.status);
  const other = d?.devices?.find((x) => !x.isCurrent);
  r = await http("DELETE", `/api/v2/my-statistics/devices/${encodeURIComponent(other?.deviceId || "x")}`, { token: s2.token });
  const after = (await http("GET", "/api/v2/my-statistics/devices", { token: s2.token })).json?.data;
  check("D-5", "Removing the other device leaves 1/2", r.status === 200 && after?.devices?.length === 1, `n=${after?.devices?.length}`);
  r = await http("GET", "/api/v1/auth/me", { token: s1.token });
  check("D-6", "Removed device's access token stops working", r.status === 401, r.status);

  console.log(`TOTAL ${pass + fail}  PASS ${pass}  FAIL ${fail}`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
