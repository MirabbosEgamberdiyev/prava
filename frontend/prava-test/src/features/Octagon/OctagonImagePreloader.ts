import { OCTAGON_CONFIG } from "./types";
import { getImageUrl } from "../../utils/imageUtils";
import { offlineMediaManager } from "../../services/offlineMediaManager";

export type PreloadStatus = "idle" | "loading" | "ready" | "error";

interface Entry {
  status: PreloadStatus;
  /** Ko'rsatiladigan manba: xotiradagi blob: URL (0 ms) yoki to'liq tarmoq URL'i. */
  src?: string;
  /** Biz yaratgan blob: URL — jang tugagach bo'shatiladi (offline kesh URL'lari emas). */
  ownedObjectUrl?: string;
  promise?: Promise<void>;
}

/**
 * Oktagon savol rasmlarini oldindan yuklovchi (parallel worker pool).
 *
 * Raqib topilgan zahoti (8 soniyalik preload oynasida) 10 ta rasm fonda yuklanadi: avval offline
 * kesh, keyin tarmoqdan blob sifatida olinib xotirada saqlanadi va `decode()` qilinadi — savol
 * almashganda rasm tarmoqqa murojaatsiz, darhol chiziladi. Avval xom `imageUrl` ("questions/x.webp")
 * to'g'ridan-to'g'ri `<img src>` ga berilardi — nisbiy yo'l bo'lgani uchun rasm umuman ochilmasdi.
 */
class OctagonImagePreloader {
  private entries = new Map<string, Entry>();
  private listeners = new Set<() => void>();

  /** Xom yo'l → to'liq URL (API bazasi bilan). */
  public resolve(raw: string | null | undefined): string | undefined {
    if (!raw) return undefined;
    return getImageUrl(raw);
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  public getStatus(raw: string | null | undefined): PreloadStatus {
    if (!raw) return "idle";
    return this.entries.get(raw)?.status ?? "idle";
  }

  /** Tayyor bo'lsa xotiradagi manba, aks holda to'liq URL. */
  public getSrc(raw: string | null | undefined): string | undefined {
    if (!raw) return undefined;
    const e = this.entries.get(raw);
    return e?.src ?? this.resolve(raw);
  }

  public isCached(raw: string): boolean {
    return this.entries.get(raw)?.status === "ready";
  }

  public async preloadImages(raws: Array<string | null | undefined>): Promise<void> {
    if (typeof window === "undefined" || !raws || raws.length === 0) return;
    const unique = Array.from(new Set(raws.filter((u): u is string => Boolean(u))));
    const queue = unique.filter((u) => {
      const s = this.getStatus(u);
      return s === "idle" || s === "error";
    });
    const poolLimit = Math.max(1, OCTAGON_CONFIG.PRELOAD_WORKER_CONCURRENCY);

    let next = 0;
    const worker = async () => {
      while (next < queue.length) {
        const raw = queue[next++];
        await this.load(raw);
      }
    };
    await Promise.all(Array.from({ length: Math.min(poolLimit, queue.length) }, worker));
  }

  /** Bitta rasmni qayta yuklash ("Qayta yuklash" tugmasi). */
  public retry(raw: string): Promise<void> {
    const e = this.entries.get(raw);
    if (e?.ownedObjectUrl) URL.revokeObjectURL(e.ownedObjectUrl);
    this.entries.delete(raw);
    return this.load(raw, true);
  }

  private load(raw: string, bypassCache = false): Promise<void> {
    const existing = this.entries.get(raw);
    if (existing?.promise && existing.status === "loading") return existing.promise;

    const entry: Entry = { status: "loading" };
    entry.promise = this.fetchInto(raw, entry, bypassCache).finally(() => {
      entry.promise = undefined;
      this.emit();
    });
    this.entries.set(raw, entry);
    this.emit();
    return entry.promise;
  }

  private async fetchInto(raw: string, entry: Entry, bypassCache: boolean): Promise<void> {
    // 1. Offline to'plamdagi rasm (tarmoqsiz ham ishlaydi)
    try {
      const local = await offlineMediaManager.getLocalImageUrl(raw);
      if (local) {
        entry.src = local;
        await decodeImage(local);
        entry.status = "ready";
        return;
      }
    } catch {
      // kesh mavjud emas — tarmoqqa o'tamiz
    }

    const url = this.resolve(raw);
    if (!url) {
      entry.status = "error";
      return;
    }

    // 2. Tarmoqdan blob sifatida — keyingi chizish tarmoqsiz va bir zumda
    try {
      const res = await fetch(url, { mode: "cors", credentials: "omit", cache: bypassCache ? "reload" : "default" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      if (blob.size === 0) throw new Error("empty");
      const objectUrl = URL.createObjectURL(blob);
      entry.ownedObjectUrl = objectUrl;
      entry.src = objectUrl;
      await decodeImage(objectUrl);
      entry.status = "ready";
      return;
    } catch {
      // CORS/tarmoq — oddiy <img> orqali brauzer keshiga olish
    }

    try {
      await decodeImage(bypassCache ? withCacheBust(url) : url);
      entry.src = bypassCache ? withCacheBust(url) : url;
      entry.status = "ready";
    } catch {
      entry.status = "error";
    }
  }

  /** Jang tugagach xotirani bo'shatish. */
  public clear() {
    this.entries.forEach((e) => {
      if (e.ownedObjectUrl) URL.revokeObjectURL(e.ownedObjectUrl);
    });
    this.entries.clear();
    this.emit();
  }
}

function withCacheBust(url: string): string {
  return `${url}${url.includes("?") ? "&" : "?"}r=${Date.now()}`;
}

function decodeImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (typeof img.decode === "function") {
        img.decode().then(() => resolve(), () => resolve());
      } else {
        resolve();
      }
    };
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

export const imagePreloader = new OctagonImagePreloader();
