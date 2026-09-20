import React, { useState, useEffect, useRef } from "react";
import { Box, Skeleton, useComputedColorScheme } from "@mantine/core";
import { IconPhotoOff } from "@tabler/icons-react";

export interface AppImageProps {
  src?: string | null;
  alt?: string;
  fallbackSrc?: string;
  aspectRatio?: string | number;
  fit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  radius?: string | number;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  className?: string;
  style?: React.CSSProperties;
  h?: string | number;
  w?: string | number;
  maxH?: string | number;
  loading?: "lazy" | "eager";
  draggable?: boolean;
}

/**
 * Enterprise universal image component for PravaOnline.
 * - Skeleton loading placeholder
 * - Safe error handling without infinite loops
 * - Clean neutral SVG fallback (NO decorative car images)
 * - Light and Dark theme support
 */
export const AppImage: React.FC<AppImageProps> = ({
  src,
  alt = "",
  aspectRatio,
  fit = "contain",
  radius = "md",
  onClick,
  className,
  style,
  h = "100%",
  w = "100%",
  maxH,
  loading = "lazy",
  draggable = false,
}) => {
  const colorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });
  const isDark = colorScheme === "dark";

  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const hasRetriedRef = useRef(false);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    hasRetriedRef.current = false;
  }, [src]);

  const hasValidSrc = Boolean(src && src.trim().length > 0 && !hasError);

  const radiusValue =
    typeof radius === "number"
      ? `${radius}px`
      : `var(--mantine-radius-${radius}, ${radius})`;

  const containerStyle: React.CSSProperties = {
    position: "relative",
    overflow: "hidden",
    borderRadius: radiusValue,
    width: w,
    height: h,
    maxHeight: maxH,
    ...(aspectRatio ? { aspectRatio: String(aspectRatio) } : {}),
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: isDark
      ? "var(--mantine-color-dark-6, #1a1b1e)"
      : "var(--mantine-color-gray-1, #f8f9fa)",
    border: `1px solid ${
      isDark ? "var(--mantine-color-dark-4, #2c2e33)" : "var(--mantine-color-gray-2, #e9ecef)"
    }`,
    cursor: hasValidSrc && onClick ? "pointer" : undefined,
    ...style,
  };

  return (
    <Box
      className={className}
      style={containerStyle}
      onClick={hasValidSrc && onClick ? onClick : undefined}
      role={hasValidSrc && onClick ? "button" : undefined}
      tabIndex={hasValidSrc && onClick ? 0 : undefined}
      onKeyDown={
        hasValidSrc && onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
              }
            }
          : undefined
      }
    >
      {hasValidSrc ? (
        <>
          {/* Loading Skeleton */}
          {!isLoaded && (
            <Skeleton
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                borderRadius: 0,
                zIndex: 1,
              }}
            />
          )}

          {/* Actual Image */}
          <img
            src={src!}
            alt={alt}
            loading={loading}
            draggable={draggable}
            onLoad={() => setIsLoaded(true)}
            onError={() => {
              if (!hasRetriedRef.current) {
                hasRetriedRef.current = true;
                setHasError(true);
              }
            }}
            style={{
              width: "100%",
              height: "100%",
              objectFit: fit,
              opacity: isLoaded ? 1 : 0,
              transition: "opacity 0.25s ease-in-out",
              display: "block",
            }}
          />
        </>
      ) : (
        /* Neutral Fallback State (Zero decorative car images) */
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "16px",
            color: isDark ? "var(--mantine-color-dark-2, #909296)" : "var(--mantine-color-gray-5, #adb5bd)",
            textAlign: "center",
          }}
        >
          <IconPhotoOff size={28} stroke={1.5} />
          <span style={{ fontSize: "11.5px", fontWeight: 600, letterSpacing: "0.2px" }}>
            {hasError ? "Rasm yuklanmadi" : "Rasm yo'q"}
          </span>
        </div>
      )}
    </Box>
  );
};

export default AppImage;
