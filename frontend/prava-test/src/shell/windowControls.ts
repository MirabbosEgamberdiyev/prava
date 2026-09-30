import { useSyncExternalStore } from "react";

/**
 * Main-window state + commands for the frameless titlebar.
 * In a web browser (Vite / PWA), these gracefully fall back to web standards.
 */
export const isTauri = (): boolean => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export interface WindowState {
  maximized: boolean;
  fullscreen: boolean;
}

let state: WindowState = { maximized: false, fullscreen: false };
const listeners = new Set<() => void>();

export function useWindowState(): WindowState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state
  );
}

export async function minimizeWindow(): Promise<void> {}
export async function toggleMaximizeWindow(): Promise<void> {}
export async function closeWindow(): Promise<void> {
  if (typeof window !== "undefined") window.close();
}
export async function toggleFullscreen(): Promise<void> {
  if (typeof document === "undefined") return;
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen().catch(() => {});
  } else {
    await document.exitFullscreen().catch(() => {});
  }
}
