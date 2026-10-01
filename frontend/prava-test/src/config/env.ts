/**
 * Dynamically resolves the API base URL based on runtime environment:
 * 1. Tauri desktop app -> connects to production cloud API "https://pravaonline.uz"
 * 2. Local browser development (localhost / 127.0.0.1) -> "http://localhost:8081"
 * 3. Web production (web.pravaonline.uz, pravaonline.uz, etc.) -> relative root ""
 *    All /api/... requests are seamlessly handled by Nginx reverse proxy on the same origin,
 *    eliminating CORS preflight errors, port mismatches, and mixed content issues.
 */
function resolveApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const isTauri = Boolean(
      (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ ||
      (window as unknown as { __TAURI__?: unknown }).__TAURI__
    );
    if (isTauri) {
      return "https://pravaonline.uz";
    }

    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return import.meta.env.VITE_DEV_API_BASE_URL || "http://localhost:8081";
    }

    // Production web deployment: use same-origin relative URLs
    return "";
  }

  return "https://pravaonline.uz";
}

// Environment configuration
export const ENV = {
  GOOGLE_CLIENT_ID:
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    "237372892439-4bju17u6k3cjoil26p148m21ilmecd9s.apps.googleusercontent.com",
  API_BASE_URL: resolveApiBaseUrl(),
  TELEGRAM_BOT_ID: Number(import.meta.env.VITE_TELEGRAM_BOT_ID) || 8485868847,
  TELEGRAM_BOT_USERNAME:
    import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "pravaonlineuzbot",
};
