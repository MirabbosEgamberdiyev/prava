import React, { useState, useEffect } from "react";
import { getImageUrl } from "../../utils/imageUtils";
import { offlineMediaManager } from "../../services/offlineMediaManager";
import { networkModeManager } from "../../sync/networkModeManager";

interface Props {
  path: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  onOpen?: (src: string) => void;
  /** Native lazy loading (long lists / grids). */
  lazy?: boolean;
}

const DEFAULT_IMAGE = "/question-default.svg";

export default function SecureImage({ path, alt = "", className, style, onOpen, lazy }: Props) {
  const [hasError, setHasError] = useState(false);
  const [localSrc, setLocalSrc] = useState<string | null>(null);

  const effectivePath = path || DEFAULT_IMAGE;
  const isDirect = effectivePath.startsWith("/") || effectivePath.startsWith("http://") || effectivePath.startsWith("https://") || effectivePath.startsWith("data:");

  useEffect(() => {
    let active = true;
    setHasError(false);

    if (isDirect) {
      setLocalSrc(effectivePath);
      return;
    }

    offlineMediaManager.getLocalImageUrl(effectivePath).then((cached) => {
      if (!active) return;
      if (cached) {
        setLocalSrc(cached);
      } else {
        setLocalSrc(null);
        // If online, background-cache it for future offline sessions
        if (networkModeManager.isOnlineAllowed()) {
          offlineMediaManager.cacheImage(effectivePath).catch(() => {});
        }
      }
    });

    return () => {
      active = false;
    };
  }, [effectivePath, isDirect]);

  const rawSrc = localSrc || getImageUrl(effectivePath) || effectivePath;
  const src = (!rawSrc || hasError) ? DEFAULT_IMAGE : rawSrc;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      draggable={false}
      loading={lazy ? "lazy" : undefined}
      decoding={lazy ? "async" : undefined}
      onContextMenu={(e) => e.preventDefault()}
      onError={() => {
        if (src !== DEFAULT_IMAGE) {
          setHasError(true);
        }
      }}
      onClick={onOpen ? () => onOpen(src) : undefined}
      style={{ ...style, ...(onOpen ? { cursor: "zoom-in" } : {}) }}
    />
  );
}

interface ZoomableProps {
  path: string;
  className?: string;
  onOpen: (src: string) => void;
}

export function ZoomableImage({ path, className, onOpen }: ZoomableProps) {
  return (
    <SecureImage
      path={path}
      className={className}
      onOpen={onOpen}
    />
  );
}
