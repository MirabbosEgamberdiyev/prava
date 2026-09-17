// Environment configuration
const getApiBaseUrl = (): string => {
  // If running in browser on production domain, ALWAYS use relative path (proxied by Nginx)
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.includes("pravaonline.uz")) {
      return "";
    }
  }
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (raw && !raw.includes("localhost:8081")) {
    return raw;
  }
  return "";
};

export const ENV = {
  GOOGLE_CLIENT_ID:
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    "237372892439-4bju17u6k3cjoil26p148m21ilmecd9s.apps.googleusercontent.com",
  API_BASE_URL: getApiBaseUrl(),
  TELEGRAM_BOT_ID: Number(import.meta.env.VITE_TELEGRAM_BOT_ID) || 8485868847,
  TELEGRAM_BOT_USERNAME:
    import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "pravaonlineuzbot",
};
