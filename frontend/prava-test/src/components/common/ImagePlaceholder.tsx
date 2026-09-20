import React from "react";
import { AppImage } from "./AppImage";

interface ImagePlaceholderProps {
  src?: string | null;
  onClick?: () => void;
  radius?: string;
  style?: React.CSSProperties;
  alt?: string;
}

/**
 * Question Image Container for PravaOnline.
 * Uses universal AppImage with 16:9 aspect ratio and neutral fallback.
 * Strictly free from decorative vehicle imagery.
 */
export function ImagePlaceholder({
  src,
  onClick,
  radius = "md",
  style,
  alt = "Savol tasviri",
}: ImagePlaceholderProps) {
  if (!src) return null;

  return (
    <AppImage
      src={src}
      alt={alt}
      aspectRatio="16 / 9"
      fit="contain"
      radius={radius}
      onClick={onClick}
      style={style}
    />
  );
}

export default ImagePlaceholder;
