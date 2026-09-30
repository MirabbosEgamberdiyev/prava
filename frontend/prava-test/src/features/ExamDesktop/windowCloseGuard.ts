/**
 * Window-close interception while an exam is active.
 * Outside Tauri (web browser), beforeunload and standard navigation guards handle this.
 */
import { isTauri } from "../../shell/windowControls";

/** Register the guard. Returns an unregister function (safe to call more than once / before ready). */
export function registerExamCloseGuard(_onRequest: () => void): () => void {
  if (!isTauri()) return () => {};
  return () => {};
}

/** Close the main window without emitting another closeRequested. Falls back to close(). */
export async function destroyCurrentWindow(): Promise<void> {
  if (typeof window !== "undefined") {
    window.close();
  }
}
