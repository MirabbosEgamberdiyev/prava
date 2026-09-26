/**
 * Pending submit queue (P1-W5).
 *
 * Imtihon/marafon/bilet natijasini serverga yuborish muvaffaqiyatsiz bo'lsa
 * (tarmoq uzilishi, timeout, 5xx), so'rov localStorage'dagi navbatga
 * yoziladi va `online` hodisasida hamda ilova ishga tushganda qayta
 * yuboriladi. `/api/v2/exams/submit` backendda idempotent (COMPLETED/EXPIRED
 * sessiya uchun mavjud natijani qaytaradi), shuning uchun takroriy yuborish
 * xavfsiz.
 */
import { notifications } from "@mantine/notifications";
import type { AxiosError } from "axios";
import api from "../api/api";
import i18n from "../utils/i18n";

const STORAGE_KEY = "prava_pending_submits_v1";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 kun
const MAX_ITEMS = 50;

export interface PendingSubmit {
  id: string;
  endpoint: string;
  body: unknown;
  createdAt: number;
  attempts: number;
}

function readQueue(): PendingSubmit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PendingSubmit[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: PendingSubmit[]): void {
  try {
    if (queue.length === 0) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(queue.slice(-MAX_ITEMS)));
  } catch {
    // storage to'la yoki bloklangan — navbatsiz davom etamiz
  }
}

export function getPendingSubmitCount(): number {
  return readQueue().length;
}

/**
 * Xato qayta urinishga arziydimi? Tarmoq xatosi, timeout, 401 (token
 * yangilanishi kerak), 408, 429 va 5xx — ha. Boshqa 4xx (400 sessiya
 * bekor qilingan, 404 topilmadi) — doimiy xato, qayta yuborilmaydi.
 */
export function isRetryableSubmitError(err: unknown): boolean {
  const status = (err as AxiosError)?.response?.status;
  if (status == null) return true;
  return status === 401 || status === 408 || status === 429 || status >= 500;
}

export function notifySubmitQueued(): void {
  notifications.show({
    id: "pending-submit-queued",
    color: "orange",
    title: i18n.t("notification.submitQueuedTitle", "Natija saqlanmadi"),
    message: i18n.t(
      "notification.submitQueued",
      "Natija saqlanmadi — internet qaytganda qayta yuboriladi",
    ),
    autoClose: 8000,
  });
}

export function enqueuePendingSubmit(endpoint: string, body: unknown): void {
  const queue = readQueue();
  queue.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    endpoint,
    body,
    createdAt: Date.now(),
    attempts: 0,
  });
  writeQueue(queue);
}

let flushing: Promise<number> | null = null;

/**
 * Navbatdagi barcha so'rovlarni yuborishga urinadi.
 * @returns muvaffaqiyatli yuborilganlar soni
 */
export function flushPendingSubmits(): Promise<number> {
  if (flushing) return flushing;
  flushing = (async () => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) return 0;
    const queue = readQueue();
    if (queue.length === 0) return 0;

    const now = Date.now();
    const remaining: PendingSubmit[] = [];
    let sent = 0;

    for (const item of queue) {
      if (now - item.createdAt > MAX_AGE_MS) continue; // juda eski — tashlab yuboramiz
      try {
        await api.post(item.endpoint, item.body);
        sent += 1;
      } catch (err) {
        if (isRetryableSubmitError(err)) {
          remaining.push({ ...item, attempts: item.attempts + 1 });
        }
        // doimiy xato (4xx) — navbatdan olib tashlanadi
      }
    }

    // Yuborish davomida yangi elementlar qo'shilgan bo'lishi mumkin
    const processedIds = new Set(queue.map((q) => q.id));
    const added = readQueue().filter((q) => !processedIds.has(q.id));
    writeQueue([...remaining, ...added]);

    if (sent > 0) {
      window.dispatchEvent(new Event("prava-storage-changed"));
      notifications.show({
        id: "pending-submit-flushed",
        color: "green",
        message: i18n.t("notification.submitFlushed", "Saqlanmagan natijalar serverga yuborildi"),
      });
    }
    return sent;
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}

let initialized = false;

/** Ilova ishga tushganda bir marta chaqiriladi. */
export function initPendingSubmits(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  window.addEventListener("online", () => {
    void flushPendingSubmits();
  });
  // Ilova yuklanishi (auth tiklanishi) tugashi uchun biroz kutamiz
  window.setTimeout(() => {
    void flushPendingSubmits();
  }, 3000);
}
