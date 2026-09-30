/**
 * Open an http(s) link in a new tab / window.
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

export function openInNewWindow(url: string): boolean {
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
  return openInNewWindow(url);
}

export default openExternal;
