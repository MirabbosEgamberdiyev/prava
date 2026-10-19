import { useState, useEffect } from "react";
import { Box, Image, Skeleton, useComputedColorScheme } from "@mantine/core";
import { imageMemoryCache } from "../../utils/imageUtils";

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
  radius = "xs",
  style,
}: ImagePlaceholderProps) {
  const colorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });
  const isDark = colorScheme === "dark";

  const isPreloaded = Boolean(src && imageMemoryCache.has(src));
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(isPreloaded);

  // Savol o'zgarganda holatlarni tozalash (agar rasm allaqachon keshda bo'lsa, birinchi freymdayoq darhol ko'rsatadi)
  useEffect(() => {
    setImageError(false);
    if (src && imageMemoryCache.has(src)) {
      setImageLoaded(true);
    } else {
      setImageLoaded(false);
    }
  }, [src]);

  const hasImage = !!src && !imageError;

  const containerStyle: React.CSSProperties = {
    cursor: hasImage && onClick ? "pointer" : undefined,
    borderRadius: `var(--mantine-radius-${radius})`,
    overflow: "hidden",
    aspectRatio: "3 / 2",
    width: "100%",
    contain: "layout paint",
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
          {/* Skeleton — rasm yuklanguncha (layout o'lchami o'zgarmaydi) */}
          {!imageLoaded && (
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
          <Image
            key={src || "none"}
            src={src}
            alt=""
            fit="contain"
            h="100%"
            w="100%"
            loading="eager"
            decoding="async"
            onLoad={() => {
              if (src) imageMemoryCache.add(src);
              setImageLoaded(true);
            }}
            onError={() => setImageError(true)}
            style={{
              opacity: imageLoaded ? 1 : 0,
              transition: "opacity 0.15s ease",
            }}
          />
        </>
      ) : (
        <Box
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            padding: 16,
            gap: 10,
            userSelect: "none",
          }}
        >
          <Box
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              maxHeight: "65%",
              flex: 1,
            }}
          >
            <Image
              src="/logo.svg"
              fallbackSrc="/question-default.svg"
              alt="PRAVA-ONLINE"
              maw={150}
              mah={150}
              fit="contain"
              loading="eager"
              decoding="async"
              style={{
                filter: isDark
                  ? "drop-shadow(0 0 20px rgba(59, 130, 246, 0.25))"
                  : "drop-shadow(0 4px 12px rgba(37, 99, 235, 0.12))",
              }}
            />
          </Box>
          <Box style={{ textAlign: "center" }}>
            <Box
              component="span"
              style={{
                display: "block",
                fontFamily: "Montserrat, var(--mantine-font-family), sans-serif",
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: 2,
                color: isDark ? "#60a5fa" : "#1d4ed8",
                lineHeight: 1.2,
              }}
            >
              PRAVA-ONLINE
            </Box>
            <Box
              component="span"
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: isDark ? "var(--mantine-color-dark-2)" : "var(--mantine-color-gray-6)",
                marginTop: 3,
                letterSpacing: 0.5,
              }}
            >
              O'quv va Imtihon Tizimi
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
