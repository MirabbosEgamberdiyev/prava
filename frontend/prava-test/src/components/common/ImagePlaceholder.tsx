import { useState, useEffect } from "react";
import { Box, Image, Skeleton, useComputedColorScheme } from "@mantine/core";

interface ImagePlaceholderProps {
  src?: string | null;
  onClick?: () => void;
  radius?: string;
  style?: React.CSSProperties;
}

/**
 * Savol rasmi yoki placeholder ko'rsatadi.
 * Rasm yuklanayotganda — skeleton
 * Rasm mavjud bo'lsa — lazy loaded rasm (klik = zoom)
 * Rasm yo'q yoki yuklanmasa — logo + "pravaonline.uz"
 * Dark/Light mode ni qo'llab-quvvatlaydi
 */
export function ImagePlaceholder({
  src,
  onClick,
  radius = "md",
  style,
}: ImagePlaceholderProps) {
  const colorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });
  const isDark = colorScheme === "dark";

  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Savol o'zgarganda holatlarni tozalash
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [src]);

  const hasImage = !!src && !imageError;

  const containerStyle: React.CSSProperties = {
    cursor: hasImage && onClick ? "pointer" : undefined,
    borderRadius: `var(--mantine-radius-${radius})`,
    overflow: "hidden",
    aspectRatio: "3 / 2",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    background: isDark
      ? "linear-gradient(135deg, var(--mantine-color-dark-6) 0%, var(--mantine-color-dark-7) 100%)"
      : "linear-gradient(135deg, var(--mantine-color-gray-1) 0%, var(--mantine-color-gray-2) 100%)",
    border: `1px solid ${isDark ? "var(--mantine-color-dark-4)" : "var(--mantine-color-gray-3)"}`,
    position: "relative",
    ...style,
  };

  return (
    <Box onClick={hasImage ? onClick : undefined} style={containerStyle}>
      {hasImage ? (
        <>
          {/* Skeleton — rasm yuklanguncha */}
          {!imageLoaded && (
            <Skeleton
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                borderRadius: 0,
              }}
            />
          )}
          <Image
            src={src}
            alt=""
            fit="contain"
            h="100%"
            w="100%"
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            style={{
              opacity: imageLoaded ? 1 : 0,
              transition: "opacity 0.25s ease",
            }}
          />
        </>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            padding: "12px",
          }}
        >
          <img
            src="/images/default-vehicle-placeholder.svg"
            alt="Prava Online Vehicle"
            loading="lazy"
            style={{
              width: "86%",
              maxHeight: "88%",
              objectFit: "contain",
              filter: isDark
                ? "drop-shadow(0 4px 14px rgba(0, 0, 0, 0.6))"
                : "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.08))",
            }}
          />
        </div>
      )}
    </Box>
  );
}
