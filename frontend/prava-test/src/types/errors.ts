export interface ApiError {
  code?: string;
  message?: string;
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}

/**
 * Xato turi — foydalanuvchiga qaysi lokalizatsiyalangan xabarni ko'rsatishni tanlash uchun.
 *  - network: javob kelmadi (offline, timeout, CORS);
 *  - server:  5xx;
 *  - client:  4xx (backend `Accept-Language` bo'yicha tarjima qilingan biznes xabari bo'lishi mumkin);
 *  - unknown: axios xatosi emas (JS istisno va h.k.).
 */
export type ErrorKind = "network" | "server" | "client" | "unknown";

export function classifyError(error: unknown): ErrorKind {
  const e = error as ApiError | null | undefined;
  if (!e || typeof e !== "object") return "unknown";
  const status = e.response?.status;
  if (typeof status === "number") {
    if (status >= 500) return "server";
    if (status >= 400) return "client";
  }
  if (e.code === "ERR_NETWORK" || e.code === "ECONNABORTED" || e.code === "ETIMEDOUT") return "network";
  if ("response" in e || "isAxiosError" in e) return "network";
  return "unknown";
}

/**
 * Backend xabari foydalanuvchiga ko'rsatishga yaroqlimi? Backend 4xx biznes xatolarini
 * `Accept-Language` bo'yicha tarjima qiladi; ammo texnik matnlar (istisno nomlari, SQL,
 * stack trace, URL, JSON) hech qachon ko'rsatilmaydi.
 */
const TECHNICAL_RE =
  /(exception|error:|java\.|org\.|sql|jdbc|hibernate|stack|trace|null ?pointer|undefined|nan\b|\bat\s+[\w.$]+\(|https?:\/\/|[{}<>[\]]|\b(get|post|put|delete)\s+\/|status code|request failed|axios|timeout of)/i;

export function isDisplayableServerMessage(msg: unknown): msg is string {
  if (typeof msg !== "string") return false;
  const m = msg.trim();
  if (m.length < 3 || m.length > 240) return false;
  if (TECHNICAL_RE.test(m)) return false;
  // Kamida bitta so'z (lotin yoki kirill harflari)
  return /[A-Za-zА-Яа-яЁёЎўҚқҒғҲҳ]{2,}/.test(m);
}

/**
 * Foydalanuvchiga ko'rsatiladigan xato matni.
 * Faqat 4xx javobidagi, texnik bo'lmagan (backend lokalizatsiya qilgan) xabar qaytariladi;
 * tarmoq/5xx/noma'lum xatolarda — chaqiruvchi bergan lokalizatsiyalangan `defaultMessage`.
 */
export function getErrorMessage(error: unknown, defaultMessage: string): string {
  if (classifyError(error) !== "client") return defaultMessage;
  const msg = (error as ApiError)?.response?.data?.message;
  return isDisplayableServerMessage(msg) ? msg.trim() : defaultMessage;
}

/** Xato turiga mos i18n kaliti (tarmoq / server / umumiy). */
export function errorKeyFor(error: unknown, generalKey = "common.loadError"): string {
  switch (classifyError(error)) {
    case "network":
      return "errors.networkError";
    case "server":
      return "errors.serverError";
    default:
      return generalKey;
  }
}

/** Global `api-error` toast chiqariladigan xatomi (5xx yoki tarmoq) — sahifa takroriy toast ko'rsatmasin. */
export function isGloballyReported(error: unknown): boolean {
  const kind = classifyError(error);
  return kind === "server" || kind === "network";
}
