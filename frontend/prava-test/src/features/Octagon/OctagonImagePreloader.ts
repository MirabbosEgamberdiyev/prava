import { OCTAGON_CONFIG } from "./types";

/**
 * Concurrency-limited image preloader for Octagon match start.
 * Preloads all 10 question images within the 8000ms MATCH_START_PRELOAD_MS window.
 */
class OctagonImagePreloader {
  private cache = new Map<string, HTMLImageElement>();

  public async preloadImages(urls: string[]): Promise<void> {
    if (typeof window === "undefined" || !urls || urls.length === 0) return;

    const validUrls = urls.filter((u) => u && !this.cache.has(u));
    const poolLimit = OCTAGON_CONFIG.PRELOAD_WORKER_CONCURRENCY;

    const executing: Promise<void>[] = [];
    for (const url of validUrls) {
      const p = this.loadImage(url).then(() => {
        const idx = executing.indexOf(p);
        if (idx !== -1) executing.splice(idx, 1);
      });
      executing.push(p);

      if (executing.length >= poolLimit) {
        await Promise.race(executing);
      }
    }

    await Promise.all(executing);
  }

  private loadImage(url: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.cache.set(url, img);
        resolve();
      };
      img.onerror = () => {
        // Resolve anyway to avoid blocking other preloads
        resolve();
      };
      img.src = url;
    });
  }

  public isCached(url: string): boolean {
    return this.cache.has(url);
  }
}

export const imagePreloader = new OctagonImagePreloader();
