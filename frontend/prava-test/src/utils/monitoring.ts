/**
 * Xatolar monitoringi (Sentry) — faqat VITE_SENTRY_DSN berilganda yoqiladi.
 *
 * SDK lazy import orqali alohida chunk'da yuklanadi: DSN bo'lmasa (dev, preview yoki
 * Sentry hali sozlanmagan prod) asosiy bundle hajmiga hech qanday ta'sir yo'q.
 * Shaxsiy ma'lumotlar yuborilmaydi (sendDefaultPii: false, cookie/auth header'lar olib tashlanadi).
 */
export function initMonitoring(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;

  import("@sentry/react")
    .then((Sentry) => {
      Sentry.init({
        dsn,
        environment: (import.meta.env.VITE_SENTRY_ENVIRONMENT as string | undefined) ?? import.meta.env.MODE,
        release: import.meta.env.VITE_APP_VERSION as string | undefined,
        sendDefaultPii: false,
        tracesSampleRate: 0,
        beforeSend(event) {
          if (event.request?.headers) {
            delete event.request.headers.Authorization;
            delete event.request.headers.Cookie;
          }
          delete event.request?.cookies;
          return event;
        },
      });
    })
    .catch(() => {
      // Monitoring ixtiyoriy — yuklanmasa ilova ishlashda davom etadi.
    });
}
