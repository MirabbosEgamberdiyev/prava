/**
 * Domain Management & Separation Utility
 *
 * Handles domain resolution and cross-domain navigation between:
 * - https://pravaonline.uz (Public Website & Landing)
 * - https://web.pravaonline.uz (Full Web Application)
 */

export type AppDomainMode = "landing" | "web";

/**
 * Returns current production or development base URLs.
 */
export const DOMAIN_URLS = {
  get LANDING(): string {
    if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
      return import.meta.env.VITE_LANDING_URL || window.location.origin;
    }
    return import.meta.env.VITE_LANDING_URL || "https://pravaonline.uz";
  },
  get WEB_APP(): string {
    if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
      return import.meta.env.VITE_WEB_URL || window.location.origin;
    }
    return import.meta.env.VITE_WEB_URL || "https://web.pravaonline.uz";
  },
};

/**
 * Determine if current runtime context is the Public Landing Domain.
 */
export function isLandingDomain(): boolean {
  if (typeof window === "undefined") return true;

  const hostname = window.location.hostname.toLowerCase();

  // Production landing hostnames
  if (hostname === "pravaonline.uz" || hostname === "www.pravaonline.uz") {
    return true;
  }

  // Production web application hostname
  if (hostname === "web.pravaonline.uz") {
    return false;
  }

  // Development / Staging mode detection
  // 1. Explicit query parameter override (e.g. ?mode=landing or ?mode=web)
  const params = new URLSearchParams(window.location.search);
  const modeParam = params.get("app_mode") || params.get("mode");
  if (modeParam === "landing") return true;
  if (modeParam === "web") return false;

  // 2. Explicit environment variable override
  const envMode = import.meta.env.VITE_APP_MODE;
  if (envMode === "landing") return true;
  if (envMode === "web") return false;

  // 3. Port convention: 5174 -> web, 5173 -> landing
  if (window.location.port === "5174") {
    return false;
  }
  if (window.location.port === "5173") {
    return true;
  }

  // Default in development: landing mode
  return true;
}

/**
 * Determine if current runtime context is the Web Application Domain.
 */
export function isWebAppDomain(): boolean {
  return !isLandingDomain();
}

/**
 * Get the current domain mode ('landing' or 'web').
 */
export function getDomainMode(): AppDomainMode {
  return isLandingDomain() ? "landing" : "web";
}

/**
 * Cookie domain for cross-subdomain authentication.
 * Under *.pravaonline.uz, cookies are shared across all subdomains.
 * In localhost or private IPs, domain is left undefined so cookies are host-only.
 */
export function getSharedCookieDomain(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const hostname = window.location.hostname.toLowerCase();
  if (hostname.endsWith("pravaonline.uz")) {
    return ".pravaonline.uz";
  }
  return undefined;
}

/**
 * Get absolute or relative URL for a landing page route.
 */
export function getLandingUrl(path: string = "/"): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (isLandingDomain()) {
    return cleanPath;
  }
  // If in web app, return full URL pointing to landing
  return `${DOMAIN_URLS.LANDING.replace(/\/+$/, "")}${cleanPath}`;
}

/**
 * Get absolute or relative URL for a web application route.
 */
export function getWebAppUrl(path: string = "/"): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (isWebAppDomain()) {
    return cleanPath;
  }
  // If in landing, return full URL pointing to web app
  return `${DOMAIN_URLS.WEB_APP.replace(/\/+$/, "")}${cleanPath}`;
}

/**
 * Safely redirects the user to the Web Application with preserved query parameters.
 */
export function redirectToWebApp(
  path: string = "/me",
  preserveQuery: boolean = true
): void {
  if (typeof window === "undefined") return;

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const search = preserveQuery ? window.location.search : "";
  const targetUrl = `${DOMAIN_URLS.WEB_APP.replace(/\/+$/, "")}${cleanPath}${search}`;

  window.location.replace(targetUrl);
}

/**
 * Safely redirects the user to the Public Landing with preserved query parameters.
 */
export function redirectToLanding(
  path: string = "/",
  preserveQuery: boolean = false
): void {
  if (typeof window === "undefined") return;

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const search = preserveQuery ? window.location.search : "";
  const targetUrl = `${DOMAIN_URLS.LANDING.replace(/\/+$/, "")}${cleanPath}${search}`;

  window.location.replace(targetUrl);
}

/**
 * Determines whether Google One Tap should be active.
 * STRICTLY disabled on the public landing domain (https://pravaonline.uz)
 * to prevent auto-login, popups, or intrusive prompts while browsing the public website.
 * Enabled on the web application domain (https://web.pravaonline.uz) where user authentication takes place.
 */
export function isGoogleOneTapAllowed(pathname: string = typeof window !== "undefined" ? window.location.pathname : ""): boolean {
  if (typeof window === "undefined") return false;

  const hostname = window.location.hostname.toLowerCase();

  // Production landing domain: NEVER enable Google One Tap
  if (hostname === "pravaonline.uz" || hostname === "www.pravaonline.uz") {
    return false;
  }

  // Production web application domain: enable
  if (hostname === "web.pravaonline.uz") {
    return true;
  }

  // Local development / staging mode detection
  const params = new URLSearchParams(window.location.search);
  const modeParam = params.get("app_mode") || params.get("mode");
  if (modeParam === "landing") return false;
  if (modeParam === "web") return true;

  if (window.location.port === "5174") return true;

  // Localhost unified: disable on public landing pages, enable on web app/auth routes
  const landingPaths = [
    "/",
    "/partners",
    "/pricing",
    "/downloads",
    "/about",
    "/contact",
    "/faq",
    "/terms",
    "/privacy",
    "/try-exam",
  ];
  if (landingPaths.includes(pathname)) {
    return false;
  }

  return true;
}

