/**
 * Tauri window-close interception while an exam is active.
 *
 * The custom titlebar close button (shell/windowControls.closeWindow → window.close()) and the
 * OS close (Alt+F4, taskbar) both emit `closeRequested`. While a guard is registered the close is
 * prevented and `onRequest` is called so the exam can show its confirmation dialog; after the user
 * confirms, the exam flushes its progress and calls `destroyCurrentWindow()`.
 * Outside Tauri (vite dev / browser) everything is a no-op — `beforeunload` covers that case.
 */
import { isTauri } from "../../shell/windowControls";

/** Register the guard. Returns an unregister function (safe to call more than once / before ready). */
export function registerExamCloseGuard(onRequest: () => void): () => void {
  if (!isTauri()) return () => {};
  let disposed = false;
  let unlisten: (() => void) | null = null;
  void (async () => {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const un = await getCurrentWindow().onCloseRequested((event) => {
        event.preventDefault();
        onRequest();
      });
      if (disposed) un();
      else unlisten = un;
    } catch {
      // window API unavailable — nothing to intercept
    }
  })();
  return () => {
    disposed = true;
    if (unlisten) {
      const un = unlisten;
      unlisten = null;
      try {
        un();
      } catch {
        // ignore
      }
    }
  };
}

/** Close the main window without emitting another closeRequested. Falls back to close(). */
export async function destroyCurrentWindow(): Promise<void> {
  if (!isTauri()) return;
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  const w = getCurrentWindow();
  try {
    await w.destroy();
  } catch {
    // Missing core:window:allow-destroy → a plain close (the guard is already unregistered).
    await w.close().catch(() => {});
  }
}
