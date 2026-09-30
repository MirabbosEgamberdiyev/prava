import { useEffect, useMemo, useRef } from "react";

export interface Debouncer<T> {
  schedule(payload: T): void;
  /** Run the pending save now (if any). Resolves when that save has settled. */
  flush(): Promise<void>;
  /** schedule(payload) + flush(): persist immediately (e.g. right after an answer). */
  saveNow(payload: T): Promise<void>;
  cancel(): void;
}

/** Trailing debounce that keeps only the latest payload. `run` may return a promise. */
export function createDebouncer<T>(run: (payload: T) => unknown, ms: number): Debouncer<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: { payload: T } | null = null;
  let lastRun: Promise<void> = Promise.resolve();
  const fire = (): Promise<void> => {
    timer = null;
    const p = pending;
    pending = null;
    if (p) {
      try {
        lastRun = Promise.resolve(run(p.payload)).then(
          () => undefined,
          () => undefined
        );
      } catch {
        lastRun = Promise.resolve();
      }
    }
    return lastRun;
  };
  const api: Debouncer<T> = {
    schedule(payload: T) {
      pending = { payload };
      if (timer) clearTimeout(timer);
      timer = setTimeout(fire, ms);
    },
    flush() {
      if (timer) clearTimeout(timer);
      return fire();
    },
    saveNow(payload: T) {
      api.schedule(payload);
      return api.flush();
    },
    cancel() {
      if (timer) clearTimeout(timer);
      timer = null;
      pending = null;
    },
  };
  return api;
}

/**
 * Debounced crash-recovery progress save (~500 ms): rapid navigation produces one IndexedDB
 * write instead of one per keypress. Pending saves are flushed when the window is hidden
 * (visibilitychange), on pagehide / beforeunload and on unmount.
 */
export function useDebouncedSave<T>(save: (payload: T) => unknown, ms = 500): Debouncer<T> {
  const saveRef = useRef(save);
  saveRef.current = save;
  const debouncer = useMemo(() => createDebouncer<T>((p) => saveRef.current(p), ms), [ms]);

  useEffect(() => {
    const onHide = () => void debouncer.flush();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") void debouncer.flush();
    };
    window.addEventListener("pagehide", onHide);
    window.addEventListener("beforeunload", onHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("beforeunload", onHide);
      document.removeEventListener("visibilitychange", onVisibility);
      void debouncer.flush();
    };
  }, [debouncer]);

  return debouncer;
}
