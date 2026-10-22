import { ENV } from "../config/env";
import { normalizeMediaPath } from "../services/offlineMediaManager";

const API_BASE_URL = ENV.API_BASE_URL;

export const getImageUrl = (url: string | null | undefined): string | undefined => {
  if (!url || url.trim() === "") return undefined;

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }

  if (
    url === "/images/malibu.webp" ||
    url === "/malibu.webp" ||
    url === "/logo.png" ||
    url === "logo.png" ||
    url === "/logo.svg" ||
    url === "logo.svg" ||
    url === "/question-default.svg" ||
    url === "question-default.svg" ||
    url === "/question-default.png" ||
    url === "question-default.png"
  ) {
    return url.startsWith("/") ? url : `/${url}`;
  }

  const cleanPath = normalizeMediaPath(url) || (url.startsWith("/") ? url : `/${url}`);
  if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
    return cleanPath;
  }
  const base = API_BASE_URL.replace(/\/+$/, "");
  return `${base}${cleanPath}`;
};

/**
 * Profil rasmi manzili. getImageUrl har qanday nisbiy yo'lni /api/v1/files/ ostiga o'giradi — tayyor
 * avatarlar (/api/v1/public/avatars/…) buziladi, shuning uchun "/api/" bilan boshlanuvchi yo'l API manziliga
 * o'zgarishsiz qo'shiladi. Google/Telegram rasmlari (https) o'z holicha qoladi.
 */
export const getAvatarUrl = (url: string | null | undefined): string | undefined => {
  if (!url || url.trim() === "") return undefined;
  const trimmed = url.trim();
  if (/^(https:|http:|data:|blob:)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/api/")) return `${API_BASE_URL.replace(/\/+$/, "")}${trimmed}`;
  return getImageUrl(trimmed);
};

/** In-memory set of preloaded/cached image URLs for instant synchronous frame-0 rendering */
export const imageMemoryCache = new Set<string>();

/**
 * Intelligent prefetcher: decodes image in background so when question is rendered,
 * it displays instantly with zero flicker and zero layout shift.
 */
export function preloadQuestionImage(url: string | null | undefined): void {
  const fullUrl = getImageUrl(url);
  if (!fullUrl || typeof Image === "undefined" || imageMemoryCache.has(fullUrl)) return;

  const img = new Image();
  img.decoding = "async";
  img.onload = () => {
    imageMemoryCache.add(fullUrl);
  };
  img.src = fullUrl;
}

/** Preload an array of upcoming question images */
export function preloadUpcomingImages(urls: Array<string | null | undefined>): void {
  urls.forEach(preloadQuestionImage);
}

