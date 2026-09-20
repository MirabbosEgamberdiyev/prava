import React from "react";
import { getImageUrl } from "../../utils/imageUtils";
import { AppImage } from "./AppImage";

interface Props {
  path: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  onOpen?: (src: string) => void;
}

export default function SecureImage({ path, alt = "", className, style, onOpen }: Props) {
  const src = path ? getImageUrl(path) || path : null;

  return (
    <AppImage
      src={src}
      alt={alt}
      className={className}
      style={style}
      fit="contain"
      onClick={onOpen && src ? () => onOpen(src) : undefined}
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
