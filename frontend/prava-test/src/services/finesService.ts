import api from "../api/api";
import { latinToCyrillic, cyrillicToLatin } from "../utils/transliterate";
import { getAppDateLocale } from "../utils/date";

/**
 * Yo'l harakati jarimalari (BHM asosida) — domen qoidalari va ma'lumot olish.
 *
 * Qoidalar UI komponentlaridan tashqarida:
 *  - summa = ko'paytiruvchi (BHM soni) * bhm.amount; server bergan amountMin/amountMax afzal.
 *  - GET /api/v1/public/fines (mehmonlar uchun ochiq), kuchli ETag + If-None-Match -> 304.
 *  - Xotira + localStorage keshi (version bilan). Tarmoq yo'q bo'lsa — keshdagi nusxa.
 *  - Global "api-error" toast chiqarilmaydi (config.silent) — sahifa xatoni inline ko'rsatadi.
 *  - Hech qachon ma'lumot o'ylab topilmaydi: ro'yxat bo'sh bo'lsa, bo'sh qaytadi.
 */

export const FINES_ENDPOINT = "/api/v1/public/fines";
export const FINES_CACHE_KEY = "prava_fines_cache_v1";
/** Server Cache-Control max-age=300 bilan mos: shu muddat ichida qayta so'rov yuborilmaydi. */
export const FINES_FRESH_MS = 5 * 60 * 1000;

export type FinesLang = "uzl" | "uzc" | "ru";

export interface LocalizedText {
  uzl?: string | null;
  uzc?: string | null;
  en?: string | null;
  ru?: string | null;
}

export interface TrafficFine {
  id: number | string;
  articleCode: string;
  title: LocalizedText;
  bhmMin: number;
  bhmMax?: number | null;
  amountMin?: number | null;
  amountMax?: number | null;
  extraSanction?: LocalizedText | null;
  sortOrder: number;
}

export interface BhmInfo {
  amount: number;
  effectiveFrom: string;
}

export interface FinesPayload {
  bhm: BhmInfo;
  version: string;
  fines: TrafficFine[];
}

export interface FinesResult {
  data: FinesPayload;
  /** true — tarmoq xatosi sababli keshdagi (eskirgan bo'lishi mumkin) nusxa qaytarildi. */
  stale: boolean;
  source: "network" | "not-modified" | "memory" | "storage";
  fromCache?: boolean;
  savedAt?: number | null;
}

export type FinesData = FinesPayload;

interface CacheEntry {
  etag: string | null;
  version: string;
  data: FinesPayload;
  savedAt: number;
}

// ─── Domen: summa hisoblash ────────────────────────────────────────────────

function toFiniteNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** multiplier * BHM (so'mda, butun songa yaxlitlanadi). */
export function computeBhmAmount(multiplier: number, bhmAmount: number): number {
  return Math.round(multiplier * bhmAmount);
}

export interface AmountRange {
  min: number;
  /** null — bitta qat'iy summa (oraliq emas). */
  max: number | null;
}

/**
 * Jarima summasi oralig'i. Server hisoblagan amountMin/amountMax afzal; yo'q bo'lsa
 * bhmMin/bhmMax * bhm.amount. max min'ga teng yoki kichik bo'lsa — bitta summa.
 */
export function getFineAmountRange(fine: TrafficFine, bhm: BhmInfo): AmountRange {
  const bhmAmount = toFiniteNumber(bhm?.amount) ?? 0;
  const serverMin = toFiniteNumber(fine.amountMin);
  const serverMax = toFiniteNumber(fine.amountMax);
  const bhmMin = toFiniteNumber(fine.bhmMin) ?? 0;
  const bhmMax = toFiniteNumber(fine.bhmMax);

  const min = serverMin ?? computeBhmAmount(bhmMin, bhmAmount);
  const max = serverMax ?? (bhmMax !== null ? computeBhmAmount(bhmMax, bhmAmount) : null);
  return { min, max: max !== null && max > min ? max : null };
}

// ─── Formatlash ─────────────────────────────────────────────────────────────

const CURRENCY: Record<FinesLang, string> = {
  uzl: "so'm",
  uzc: "сўм",
  ru: "сум",
};

function normLang(lang: string | undefined): FinesLang {
  return lang === "ru" || lang === "uzc" ? lang : "uzl";
}

export function formatNumber(value: number, lang?: string): string {
  try {
    return new Intl.NumberFormat(getAppDateLocale(normLang(lang)), { maximumFractionDigits: 0 }).format(value);
  } catch {
    return String(Math.round(value));
  }
}

/** "375 000 so'm" / "375 000 сўм" / "375 000 сум" (ajratgich — lokal bo'yicha). */
export function formatMoney(value: number, lang?: string): string {
  return `${formatNumber(value, lang)} ${CURRENCY[normLang(lang)]}`;
}

/** "375 000 – 750 000 so'm" yoki bitta summa. */
export function formatAmountRange(range: AmountRange, lang?: string): string {
  if (range.max === null) return formatMoney(range.min, lang);
  return `${formatNumber(range.min, lang)} – ${formatMoney(range.max, lang)}`;
}

/** BHM ko'paytiruvchisi: "5" yoki "5–10" (kasr bo'lsa lokal ajratgich bilan). */
export function formatBhmMultiplier(fine: TrafficFine, lang?: string): string {
  const fmt = (n: number) => {
    try {
      return new Intl.NumberFormat(getAppDateLocale(normLang(lang)), { maximumFractionDigits: 2 }).format(n);
    } catch {
      return String(n);
    }
  };
  const min = toFiniteNumber(fine.bhmMin) ?? 0;
  const max = toFiniteNumber(fine.bhmMax);
  return max !== null && max > min ? `${fmt(min)}–${fmt(max)}` : fmt(min);
}

/** ISO sana ("2024-08-01") -> lokal sana; noto'g'ri bo'lsa asl qiymat. */
export function formatEffectiveDate(iso: string, lang?: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  if (!m) return iso || "";
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  try {
    return new Intl.DateTimeFormat(getAppDateLocale(normLang(lang)), {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    }).format(d);
  } catch {
    return iso;
  }
}

/**
 * Lokallashtirilgan matn. uzc bo'sh bo'lsa — uzl kirillga transliteratsiya qilinadi;
 * ru bo'sh bo'lsa — uzl; uzl bo'sh bo'lsa — uzc lotinga.
 */
export function pickFineText(text: LocalizedText | null | undefined, lang?: string): string {
  if (!text) return "";
  const uzl = (text.uzl || "").trim();
  const uzc = (text.uzc || "").trim();
  const ru = (text.ru || "").trim();
  switch (normLang(lang)) {
    case "ru":
      return ru || uzl || cyrillicToLatin(uzc);
    case "uzc":
      return uzc || latinToCyrillic(uzl) || ru;
    default:
      return uzl || cyrillicToLatin(uzc) || ru;
  }
}

// ─── Payload tekshiruvi ───────────────────────────────────────────────────────

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function unwrapEnvelope(body: unknown): unknown {
  return isRecord(body) && "data" in body ? body.data : body;
}

/** Server javobini tekshiradi; yaroqsiz bo'lsa null (ma'lumot o'ylab topilmaydi). */
export function parseFinesPayload(body: unknown): FinesPayload | null {
  const data = unwrapEnvelope(body);
  if (!isRecord(data) || !isRecord(data.bhm)) return null;
  const amount = toFiniteNumber(data.bhm.amount);
  if (amount === null) return null;
  const fines = Array.isArray(data.fines) ? data.fines : [];
  const valid = fines.filter(
    (f): f is TrafficFine =>
      isRecord(f) && f.id !== undefined && f.id !== null && isRecord(f.title) && toFiniteNumber(f.bhmMin) !== null,
  );
  valid.sort((a, b) => (toFiniteNumber(a.sortOrder) ?? 0) - (toFiniteNumber(b.sortOrder) ?? 0));
  return {
    bhm: { amount, effectiveFrom: typeof data.bhm.effectiveFrom === "string" ? data.bhm.effectiveFrom : "" },
    version: typeof data.version === "string" ? data.version : "",
    fines: valid.map((f) => ({ ...f, articleCode: typeof f.articleCode === "string" ? f.articleCode : "" })),
  };
}

// ─── Kesh ────────────────────────────────────────────────────────────────────

let memoryCache: CacheEntry | null = null;
let inflight: Promise<FinesResult> | null = null;

function readStorage(): CacheEntry | null {
  try {
    const raw = localStorage.getItem(FINES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CacheEntry>;
    const data = parseFinesPayload(parsed?.data);
    if (!data) return null;
    return {
      etag: typeof parsed.etag === "string" ? parsed.etag : null,
      version: typeof parsed.version === "string" ? parsed.version : data.version,
      data,
      savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : 0,
    };
  } catch {
    return null;
  }
}

function writeCache(entry: CacheEntry): void {
  memoryCache = entry;
  try {
    localStorage.setItem(FINES_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // localStorage to'la / bloklangan — xotiradagi kesh yetarli.
  }
}

function currentCache(): CacheEntry | null {
  if (!memoryCache) memoryCache = readStorage();
  return memoryCache;
}

/** Test va "keshni tozalash" uchun. */
export function clearFinesCache(): void {
  memoryCache = null;
  inflight = null;
  try {
    localStorage.removeItem(FINES_CACHE_KEY);
  } catch {
    // e'tiborsiz
  }
}

function headerValue(headers: unknown, name: string): string | null {
  if (!headers) return null;
  const h = headers as { get?: (n: string) => unknown } & Record<string, unknown>;
  const v = typeof h.get === "function" ? h.get(name) : h[name] ?? h[name.toLowerCase()];
  return typeof v === "string" && v ? v : null;
}

async function fetchFromNetwork(cached: CacheEntry | null, retried = false): Promise<FinesResult> {
  const headers: Record<string, string> = {};
  if (cached?.etag) headers["If-None-Match"] = cached.etag;

  let res;
  try {
    res = await api.get(FINES_ENDPOINT, {
      headers,
      silent: true,
      validateStatus: (s) => (s >= 200 && s < 300) || s === 304,
    });
  } catch (err) {
    if (cached) return { data: cached.data, stale: true, source: "storage" };
    throw err;
  }

  if (res.status === 304) {
    if (cached) {
      writeCache({ ...cached, savedAt: Date.now() });
      return { data: cached.data, stale: false, source: "not-modified" };
    }
    // Keshsiz 304 bo'lmasligi kerak — bir marta shartsiz qayta so'raymiz.
    if (retried) throw new Error("Unexpected 304 without cached fines");
    return fetchFromNetwork(null, true);
  }

  const data = parseFinesPayload(res.data);
  if (!data) {
    if (cached) return { data: cached.data, stale: true, source: "storage" };
    throw new Error("Invalid fines payload");
  }
  const etag = headerValue(res.headers, "etag");
  writeCache({ etag, version: data.version, data, savedAt: Date.now() });
  return { data, stale: false, source: "network" };
}

/**
 * Jarimalar ro'yxati. Kesh yangi bo'lsa (FINES_FRESH_MS) — tarmoqsiz; aks holda shartli
 * so'rov (If-None-Match). `force` — keshni chetlab o'tib serverdan tekshirish (Qayta urinish).
 */
export function fetchFines(options: { force?: boolean } = {}): Promise<FinesResult> {
  const cached = currentCache();
  if (!options.force && cached && Date.now() - cached.savedAt < FINES_FRESH_MS) {
    return Promise.resolve({ data: cached.data, stale: false, source: "memory" });
  }
  if (inflight) return inflight;
  inflight = fetchFromNetwork(cached).finally(() => {
    inflight = null;
  });
  return inflight;
}

/** Tarmoqsiz, darhol ko'rsatish uchun keshdagi nusxa (bo'lsa). */
export function getCachedFines(): FinesPayload | null {
  return currentCache()?.data ?? null;
}

const LANGS: (keyof LocalizedText)[] = ["uzl", "uzc", "en", "ru"];

export function filterFines(
  fines: TrafficFine[],
  query: string,
  normalize: (s: string) => string = (s) => s.toLowerCase().trim()
): TrafficFine[] {
  const q = normalize(query);
  if (!q) return fines;
  return fines.filter((f) =>
    normalize(`${f.articleCode} ${LANGS.map((l) => f.title[l] ?? "").join(" ")}`).includes(q)
  );
}

export async function loadFines(opts: { force?: boolean } = {}): Promise<FinesResult> {
  const res = await fetchFines(opts);
  return {
    ...res,
    fromCache: res.source === "storage",
    savedAt: currentCache()?.savedAt ?? null,
  };
}
