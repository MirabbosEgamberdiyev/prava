/**
 * Open an http(s) link in the user's default browser (never inside the app webview).
 * Other schemes (javascript:, file:, custom protocols) are refused.
 */
export function isSafeExternalUrl(raw: string | null | undefined): boolean {
  if (!raw) return false;
  try {
    const u = new URL(raw);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

function openInNewWindow(url: string): boolean {
  try {
    window.open(url, "_blank", "noopener,noreferrer");
    return true;
  } catch {
    return false;
  }
}

export async function openExternal(raw: string): Promise<boolean> {
  if (!isSafeExternalUrl(raw)) return false;
  const url = new URL(raw).toString();
  if (typeof window === "undefined") return false;

  if ("__TAURI_INTERNALS__" in window) {
    try {
      const { openUrl } = await import("@tauri-apps/plugin-opener");
      await openUrl(url);
      return true;
    } catch {
      // The opener capability only allows a fixed list of hosts. For any other http(s) link,
      // window.open is intercepted by the Rust new-window handler, which opens it in the
      // system browser (never inside the app webview).
      return openInNewWindow(url);
    }
  }

  return openInNewWindow(url);
}
