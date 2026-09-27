/**
 * Imtihon runner'lari uchun umumiy, sof (React'siz) yordamchilar.
 *
 * 1) W-01 — `buildExamLoaderKey`: savollarni (qayta) yuklash qarorini belgilovchi
 *    kalit. U FAQAT imtihonni aniqlaydigan qiymatlardan (rejim, foydalanuvchi,
 *    savollar soni, bilet ID) tuziladi — til, `t` funksiyasi va boshqa UI
 *    qiymatlari unga kirmaydi. Shu tufayli til almashtirilganda imtihon qayta
 *    boshlanmaydi: savol matni render paytida `localizeQ/localizeOpt` orqali
 *    yangi tilda ko'rsatiladi.
 *
 * 2) W-07 — `sessionStorage` snapshot: sahifa yangilansa (F5) imtihon joriy
 *    holatidan davom etadi. Deadline ABSOLYUT (epoch ms) saqlanadi, shuning
 *    uchun taymer to'g'ri davom etadi. Muddati o'tgan snapshot davom
 *    ettirilmaydi — sahifa uni darhol yakunlaydi (natija + submit); juda eski
 *    snapshot esa tashlab yuboriladi.
 */

/* ───────────────────────────── W-01: loader key ───────────────────────────── */

export interface ExamLoaderKeyParts {
  mode: "exam" | "ticket" | "wrong";
  userId: number;
  questionCount?: number | null;
  ticketId?: number | null;
}

/**
 * Savollarni qayta yuklash kerakligini aniqlovchi kalit. Faqat quyidagi
 * maydonlar ishlatiladi — obyektga boshqa (masalan, `lang`) maydon qo'shilsa
 * ham kalit o'zgarmaydi.
 */
export function buildExamLoaderKey(parts: ExamLoaderKeyParts): string {
  const count = parts.questionCount ?? "";
  const ticket = parts.ticketId ?? "";
  return `${parts.mode}|u${parts.userId}|n${count}|t${ticket}`;
}

/** Oldingi va yangi kalit bo'yicha: savollarni qayta yuklash kerakmi. */
export function shouldReloadExam(prevKey: string | null, nextKey: string): boolean {
  return prevKey !== nextKey;
}

/* ───────────────────────────── W-07: snapshot ───────────────────────────── */

export type SnapshotKind = ExamLoaderKeyParts["mode"];

export interface ExamSnapshot<Q = unknown, A = unknown> {
  v: 1;
  kind: SnapshotKind;
  /** Snapshot qaysi imtihonga tegishli (`buildExamLoaderKey` natijasi). */
  scope: string;
  sessionId: number | null;
  questions: Q[];
  answers: Record<number, A>;
  current: number;
  /** Imtihon tugaydigan absolyut vaqt (epoch ms). */
  deadline: number;
  /** Imtihon boshlangan vaqt (epoch ms) — davomiylikni hisoblash uchun. */
  startedAt: number;
  /** Sahifaga xos qo'shimcha maydonlar (masalan, `fixedCount`). */
  extra?: Record<string, unknown>;
}

export type SnapshotEvaluation<Q = unknown, A = unknown> =
  | { status: "none" }
  | { status: "active"; snapshot: ExamSnapshot<Q, A>; remainingSeconds: number }
  | { status: "expired"; snapshot: ExamSnapshot<Q, A> };

export const SNAPSHOT_KEY_PREFIX = "prava_exam_snapshot_";

/**
 * Deadline'dan keyin shu vaqt ichida qaytilsa — imtihon yakunlanadi va natija
 * yuboriladi; undan eski snapshot tashlab yuboriladi (server sessiyasi allaqachon
 * yopilgan bo'ladi).
 */
export const EXPIRED_GRACE_MS = 30 * 60 * 1000;

/** Juda katta snapshot (masalan, yuzlab xato savollar) saqlanmaydi. */
export const MAX_SNAPSHOT_CHARS = 2_000_000;

export function snapshotStorageKey(kind: SnapshotKind): string {
  return `${SNAPSHOT_KEY_PREFIX}${kind}`;
}

export function remainingSecondsUntil(deadline: number, now: number): number {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

const isFiniteNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Xom JSON qiymatini tekshiradi va holatini qaytaradi (sof funksiya). */
export function evaluateSnapshot<Q = unknown, A = unknown>(
  raw: string | null | undefined,
  expected: { kind: SnapshotKind; scope: string },
  now: number,
): SnapshotEvaluation<Q, A> {
  if (!raw) return { status: "none" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: "none" };
  }
  const s = parsed as Partial<ExamSnapshot<Q, A>> | null;
  if (
    !s ||
    typeof s !== "object" ||
    s.v !== 1 ||
    s.kind !== expected.kind ||
    s.scope !== expected.scope ||
    !Array.isArray(s.questions) ||
    s.questions.length === 0 ||
    !s.answers ||
    typeof s.answers !== "object" ||
    !isFiniteNum(s.deadline) ||
    !isFiniteNum(s.startedAt)
  ) {
    return { status: "none" };
  }
  const snapshot: ExamSnapshot<Q, A> = {
    v: 1,
    kind: s.kind,
    scope: s.scope,
    sessionId: isFiniteNum(s.sessionId) ? s.sessionId : null,
    questions: s.questions,
    answers: s.answers,
    current: isFiniteNum(s.current)
      ? Math.min(Math.max(0, Math.floor(s.current)), s.questions.length - 1)
      : 0,
    deadline: s.deadline,
    startedAt: s.startedAt,
    extra: s.extra && typeof s.extra === "object" ? s.extra : undefined,
  };
  const remaining = remainingSecondsUntil(snapshot.deadline, now);
  if (remaining > 0) return { status: "active", snapshot, remainingSeconds: remaining };
  if (now - snapshot.deadline <= EXPIRED_GRACE_MS) return { status: "expired", snapshot };
  return { status: "none" };
}

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function defaultStorage(): StorageLike | null {
  try {
    return typeof sessionStorage !== "undefined" ? sessionStorage : null;
  } catch {
    return null;
  }
}

/** Snapshot'ni o'qiydi; yaroqsiz yoki juda eski bo'lsa o'chirib, `none` qaytaradi. */
export function readExamSnapshot<Q = unknown, A = unknown>(
  kind: SnapshotKind,
  scope: string,
  now: number = Date.now(),
  storage: StorageLike | null = defaultStorage(),
): SnapshotEvaluation<Q, A> {
  if (!storage) return { status: "none" };
  let raw: string | null = null;
  try {
    raw = storage.getItem(snapshotStorageKey(kind));
  } catch {
    return { status: "none" };
  }
  const result = evaluateSnapshot<Q, A>(raw, { kind, scope }, now);
  if (result.status === "none" && raw) {
    // Buzilgan, juda eski yoki boshqa imtihonga tegishli snapshot — o'chiriladi
    // (bir tabda bir turdagi faqat bitta imtihon faol bo'lishi mumkin).
    try {
      storage.removeItem(snapshotStorageKey(kind));
    } catch {
      // ignore
    }
  }
  return result;
}

/** Snapshot'ni yozadi. Muvaffaqiyatli bo'lsa `true`. */
export function writeExamSnapshot<Q, A>(
  snapshot: Omit<ExamSnapshot<Q, A>, "v">,
  storage: StorageLike | null = defaultStorage(),
): boolean {
  if (!storage) return false;
  try {
    const json = JSON.stringify({ v: 1, ...snapshot });
    if (json.length > MAX_SNAPSHOT_CHARS) return false;
    storage.setItem(snapshotStorageKey(snapshot.kind), json);
    return true;
  } catch {
    // Kvota to'lgan / private rejim — snapshot ixtiyoriy.
    return false;
  }
}

export function clearExamSnapshot(
  kind: SnapshotKind,
  storage: StorageLike | null = defaultStorage(),
): void {
  if (!storage) return;
  try {
    storage.removeItem(snapshotStorageKey(kind));
  } catch {
    // ignore
  }
}
