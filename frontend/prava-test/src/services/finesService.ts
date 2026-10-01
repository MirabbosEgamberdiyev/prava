import api from "../api/api";
import { latinToCyrillic, cyrillicToLatin, normalizeSearchText } from "../utils/transliterate";
import { getAppDateLocale } from "../utils/date";
import { calculateFineAmount, DEFAULT_BHM, setBhmValue } from "../config/bhm";

export const FINES_ENDPOINT = "/api/v1/public/fines";
export const FINES_URL = FINES_ENDPOINT;
export const FINES_CACHE_KEY = "prava_fines_cache_v1";
export const FINES_STORAGE_KEY = FINES_CACHE_KEY;
export const FINES_FRESH_MS = 5 * 60 * 1000;

export type FineLang = "uzl" | "uzc" | "en" | "ru";
export type FinesLang = FineLang;

export interface LocalizedText {
  uzl?: string | null;
  uzc?: string | null;
  en?: string | null;
  ru?: string | null;
}

export interface TrafficFine {
  id: number;
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
  effectiveFrom: string | null;
}

export interface FinesData {
  bhm: BhmInfo;
  version: string;
  fines: TrafficFine[];
}

export type FinesPayload = FinesData;

export interface FinesResult {
  data: FinesData;
  stale: boolean;
  fromCache: boolean;
  savedAt: number | null;
  source: "network" | "not-modified" | "memory" | "storage";
}

interface CacheEntry {
  etag: string | null;
  version: string;
  data: FinesData;
  savedAt: number;
}

const LANGS: FineLang[] = ["uzl", "uzc", "en", "ru"];

function toFiniteNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export function computeBhmAmount(multiplier: number, bhmAmount: number): number {
  return Math.round(multiplier * bhmAmount);
}

export interface AmountRange {
  min: number;
  max: number | null;
}

export function getFineAmountRange(fine: TrafficFine, bhm: { amount: number }): AmountRange {
  const bhmAmount = toFiniteNumber(bhm?.amount) ?? 0;
  const serverMin = toFiniteNumber(fine.amountMin);
  const serverMax = toFiniteNumber(fine.amountMax);
  const bhmMin = toFiniteNumber(fine.bhmMin) ?? 0;
  const bhmMax = toFiniteNumber(fine.bhmMax);

  const min = serverMin ?? computeBhmAmount(bhmMin, bhmAmount);
  const max = serverMax ?? (bhmMax !== null ? computeBhmAmount(bhmMax, bhmAmount) : null);
  return { min, max: max !== null && max > min ? max : null };
}

export function resolveAmount(serverAmount: unknown, multiplier: number | null, bhm: number): number | null {
  const server = toFiniteNumber(serverAmount);
  if (server !== null && server > 0) return Math.round(server);
  if (multiplier === null || multiplier <= 0) return null;
  return calculateFineAmount(multiplier, bhm);
}

const CURRENCY: Record<string, string> = {
  uzl: "so'm",
  uzc: "сўм",
  ru: "сум",
  en: "so'm",
};

function normLang(lang: string | undefined): FineLang {
  if (lang === "ru" || lang === "uzc" || lang === "en") return lang;
  return "uzl";
}

export function formatNumber(value: number, lang?: string): string {
  try {
    return new Intl.NumberFormat(getAppDateLocale(normLang(lang)), { maximumFractionDigits: 0 }).format(value);
  } catch {
    return String(Math.round(value));
  }
}

export function formatMoney(value: number, lang?: string): string {
  return `${formatNumber(value, lang)} ${CURRENCY[normLang(lang)] || "so'm"}`;
}

export function formatAmountRange(range: AmountRange, lang?: string): string {
  if (range.max === null) return formatMoney(range.min, lang);
  return `${formatNumber(range.min, lang)} – ${formatMoney(range.max, lang)}`;
}

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

export function pickFineText(text: LocalizedText | null | undefined, lang?: string): string {
  if (!text) return "";
  const uzl = (text.uzl || "").trim();
  const uzc = (text.uzc || "").trim();
  const ru = (text.ru || "").trim();
  const en = (text.en || "").trim();
  switch (normLang(lang)) {
    case "ru":
      return ru || uzl || cyrillicToLatin(uzc);
    case "uzc":
      return uzc || latinToCyrillic(uzl) || ru;
    case "en":
      return en || uzl || cyrillicToLatin(uzc);
    default:
      return uzl || cyrillicToLatin(uzc) || ru;
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function unwrapEnvelope(body: unknown): unknown {
  return isRecord(body) && "data" in body ? body.data : body;
}

export function parseFinesPayload(body: unknown): FinesData | null {
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
    bhm: { amount, effectiveFrom: typeof data.bhm.effectiveFrom === "string" ? data.bhm.effectiveFrom : null },
    version: typeof data.version === "string" ? data.version : "",
    fines: valid.map((f) => {
      const bhmMin = toFiniteNumber(f.bhmMin) ?? 0;
      const bhmMax = toFiniteNumber(f.bhmMax);
      return {
        ...f,
        id: Number(f.id),
        articleCode: typeof f.articleCode === "string" ? f.articleCode : "",
        bhmMin,
        bhmMax: bhmMax !== null && bhmMax > bhmMin ? bhmMax : null,
        amountMin: resolveAmount(f.amountMin, bhmMin, amount) ?? 0,
        amountMax: bhmMax !== null ? resolveAmount(f.amountMax, bhmMax, amount) : null,
        sortOrder: toFiniteNumber(f.sortOrder) ?? 0,
      };
    }),
  };
}

export const normalizeFines = (raw: unknown): FinesData => {
  return parseFinesPayload(raw) ?? {
    bhm: { amount: DEFAULT_BHM, effectiveFrom: null },
    version: "",
    fines: [],
  };
};

let memoryCache: CacheEntry | null = null;
let inflight: Promise<FinesResult> | null = null;

export function __resetFinesMemoryForTests(): void {
  memoryCache = null;
  inflight = null;
}

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
  } catch {}
}

function currentCache(): CacheEntry | null {
  if (!memoryCache) memoryCache = readStorage();
  return memoryCache;
}

export function clearFinesCache(): void {
  memoryCache = null;
  inflight = null;
  try {
    localStorage.removeItem(FINES_CACHE_KEY);
    localStorage.removeItem("prava_traffic_fines_v1");
  } catch {}
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
      validateStatus: (s: number) => (s >= 200 && s < 300) || s === 304,
    } as any);
  } catch (err) {
    if (cached) {
      setBhmValue(cached.data.bhm.amount);
      return { data: cached.data, stale: true, fromCache: true, savedAt: cached.savedAt, source: "storage" };
    }
    throw err;
  }

  if (res.status === 304) {
    if (cached) {
      writeCache({ ...cached, savedAt: Date.now() });
      setBhmValue(cached.data.bhm.amount);
      return { data: cached.data, stale: false, fromCache: false, savedAt: cached.savedAt, source: "not-modified" };
    }
    if (retried) throw new Error("Unexpected 304 without cached fines");
    return fetchFromNetwork(null, true);
  }

  const data = parseFinesPayload(res.data);
  if (!data) {
    if (cached) {
      setBhmValue(cached.data.bhm.amount);
      return { data: cached.data, stale: true, fromCache: true, savedAt: cached.savedAt, source: "storage" };
    }
    throw new Error("Invalid fines payload");
  }
  const etag = headerValue(res.headers, "etag");
  writeCache({ etag, version: data.version, data, savedAt: Date.now() });
  setBhmValue(data.bhm.amount);
  return { data, stale: false, fromCache: false, savedAt: Date.now(), source: "network" };
}

export function fetchFines(options: { force?: boolean } = {}): Promise<FinesResult> {
  const cached = currentCache();
  if (!options.force && cached && Date.now() - cached.savedAt < FINES_FRESH_MS) {
    setBhmValue(cached.data.bhm.amount);
    return Promise.resolve({ data: cached.data, stale: false, fromCache: false, savedAt: cached.savedAt, source: "memory" });
  }
  if (inflight) return inflight;
  inflight = fetchFromNetwork(cached).finally(() => {
    inflight = null;
  });
  return inflight;
}

export const loadFines = fetchFines;

export function getCachedFines(): FinesResult | null {
  const s = currentCache();
  return s ? { data: s.data, stale: false, fromCache: true, savedAt: s.savedAt || null, source: "storage" } : null;
}

export function filterFines(fines: TrafficFine[], query: string, _lang?: string): TrafficFine[] {
  const q = normalizeSearchText(query);
  if (!q) return fines;
  return fines.filter((f) => {
    if (normalizeSearchText(f.articleCode).includes(q)) return true;
    for (const l of LANGS) {
      const text = f.title[l];
      if (text && normalizeSearchText(text).includes(q)) return true;
    }
    return false;
  });
}
