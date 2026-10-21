import { memo, useEffect, useState, useCallback } from "react";
import { IconZoomIn } from "@tabler/icons-react";
import { offlineMediaManager } from "../../../services/offlineMediaManager";
import { networkModeManager } from "../../../sync/networkModeManager";
import { getImageUrl } from "../../../utils/imageUtils";

export const OFFICIAL_BRAND_LOGO = "/logo.png";
export const OFFICIAL_BRAND_LOGO_SVG = "/logo.svg";

export type MediaState =
  | "available"   // Real image path present and attempting to load / loaded
  | "missing"     // No image provided (null, undefined, "", or whitespace)
  | "loading"     // Currently loading/resolving
  | "failed"      // Image failed to load or network error
  | "fallback";   // Fallback logo actively displayed

export interface QuestionImageProps {
  path?: string | null;
  alt: string;
  onZoom?: (src: string) => void;
  zoomHint?: string;
  brokenLabel?: string;
  className?: string;
}

function isBlank(val: string | null | undefined): boolean {
  return !val || typeof val !== "string" || val.trim().length === 0;
}

function isBrandAsset(val: string | null | undefined): boolean {
  if (!val) return false;
  const clean = val.trim();
  return (
    clean === OFFICIAL_BRAND_LOGO ||
    clean === OFFICIAL_BRAND_LOGO_SVG ||
    clean === "/logo.png" ||
    clean === "logo.png" ||
    clean === "/logo.svg" ||
    clean === "logo.svg" ||
    clean === "/question-default.svg" ||
    clean === "question-default.svg" ||
    clean === "/question-default.png" ||
    clean === "question-default.png"
  );
}

function isDirectLocalAsset(url: string | null | undefined): boolean {
  if (!url) return false;
  if (isBrandAsset(url)) return true;
  if (
    url === "/images/malibu.webp" ||
    url === "/malibu.webp" ||
    url.startsWith("data:") ||
    url.startsWith("blob:") ||
    url.startsWith("/icons/") ||
    url.startsWith("/cars/") ||
    url.startsWith("/signs/")
  ) {
    return true;
  }
  return false;
}

/**
 * Universal Question Media Component
 *
 * Manages the 5 canonical image states:
 * - "available": Real diagram/image loaded, click to zoom with 'Z' key hint.
 * - "missing": No image provided (null, undefined, empty, or whitespace-only) -> official PRAVA-ONLINE logo fallback.
 * - "loading": Asynchronously resolving from local IndexedDB cache or network -> gentle loading skeleton.
 * - "failed": Network/404 error or decode failure -> seamlessly displays official logo fallback.
 * - "fallback": Fallback logo actively visible, centered with aspect ratio preserved, no zoom button/hints.
 */
export const QuestionImage = memo(function QuestionImage({
  path,
  alt,
  onZoom,
  zoomHint = "Kattalashtirish (Z)",
  brokenLabel = "Rasm mavjud emas",
  className,
}: QuestionImageProps) {
  const trimmed = typeof path === "string" ? path.trim() : "";
  const hasNoRealImage = isBlank(trimmed) || isBrandAsset(trimmed);

  const [resolved, setResolved] = useState<{
    src: string;
    state: MediaState;
    done: boolean;
  }>(() => {
    if (hasNoRealImage) {
      return { src: OFFICIAL_BRAND_LOGO, state: "missing", done: true };
    }
    if (isDirectLocalAsset(trimmed)) {
      return { src: trimmed, state: "available", done: true };
    }
    const warm = offlineMediaManager.peekLocalImageUrl(trimmed);
    if (warm) {
      return { src: warm, state: "available", done: true };
    }
    if (networkModeManager.isOnlineAllowed()) {
      const remote = getImageUrl(trimmed);
      if (remote) {
        return { src: remote, state: "available", done: true };
      }
    }
    return { src: OFFICIAL_BRAND_LOGO, state: "loading", done: false };
  });

  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (hasNoRealImage) {
      setResolved({ src: OFFICIAL_BRAND_LOGO, state: "missing", done: true });
      return;
    }
    if (isDirectLocalAsset(trimmed)) {
      setResolved({ src: trimmed, state: "available", done: true });
      return;
    }

    let active = true;
    offlineMediaManager
      .getLocalImageUrl(trimmed)
      .then((local) => {
        if (!active) return;
        if (local) {
          setResolved({ src: local, state: "available", done: true });
          return;
        }
        if (networkModeManager.isOnlineAllowed()) {
          const remote = getImageUrl(trimmed);
          if (remote) {
            setResolved({ src: remote, state: "available", done: true });
            offlineMediaManager.cacheImage(trimmed).catch(() => {});
            return;
          }
        }
        setResolved({ src: OFFICIAL_BRAND_LOGO, state: "fallback", done: true });
      })
      .catch(() => {
        if (!active) return;
        const remote = networkModeManager.isOnlineAllowed() ? getImageUrl(trimmed) : null;
        if (remote) {
          setResolved({ src: remote, state: "available", done: true });
        } else {
          setResolved({ src: OFFICIAL_BRAND_LOGO, state: "failed", done: true });
        }
      });

    return () => {
      active = false;
    };
  }, [trimmed, hasNoRealImage]);

  const handleError = useCallback(() => {
    setHasError(true);
    setResolved({ src: OFFICIAL_BRAND_LOGO, state: "failed", done: true });
  }, []);

  const isFallbackVisible =
    hasNoRealImage ||
    hasError ||
    resolved.state === "missing" ||
    resolved.state === "failed" ||
    resolved.state === "fallback" ||
    resolved.src === OFFICIAL_BRAND_LOGO ||
    resolved.src === OFFICIAL_BRAND_LOGO_SVG;

  const currentSrc = isFallbackVisible ? OFFICIAL_BRAND_LOGO : resolved.src;
  const currentState: MediaState = isFallbackVisible
    ? hasError
      ? "failed"
      : hasNoRealImage
      ? "missing"
      : "fallback"
    : resolved.state;

  if (!resolved.done && !isFallbackVisible) {
    return (
      <div
        className={`xd-media xd-media--loading ${className || ""}`}
        data-media-state="loading"
        aria-busy="true"
      >
        <div className="xd-media__spinner" />
      </div>
    );
  }

  if (isFallbackVisible) {
    return (
      <div
        className={`xd-media xd-media--fallback ${className || ""}`}
        data-media-state={currentState}
      >
        <div className="xd-media__fallback-wrap">
          <img
            src={OFFICIAL_BRAND_LOGO}
            alt="" aria-hidden="true"
            className="xd-media__fallback-logo"
            draggable={false}
            decoding="async"
            loading="eager"
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`xd-media xd-media--available ${className || ""}`}
      data-media-state="available"
    >
      <button
        type="button"
        className="xd-media__btn"
        onClick={() => onZoom?.(currentSrc)}
        onDoubleClick={() => onZoom?.(currentSrc)}
        onMouseDown={(e) => e.preventDefault()}
        title={zoomHint}
      >
        <img
          src={currentSrc}
          alt={alt || brokenLabel}
          className="xd-media__img"
          draggable={false}
          decoding="async"
          onError={handleError}
          onContextMenu={(e) => e.preventDefault()}
        />
        <span className="xd-media__hint" aria-hidden="true">
          <IconZoomIn size={14} /> <kbd className="xd-kbd">Z</kbd>
        </span>
      </button>
    </div>
  );
});

export default QuestionImage;
