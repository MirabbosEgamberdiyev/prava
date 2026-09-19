import React from "react";
import { getImageUrl } from "../../utils/imageUtils";

interface Props {
  path: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  onOpen?: (src: string) => void;
}

export default function SecureImage({ path, alt = "", className, style, onOpen }: Props) {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [path]);

  if (!path || hasError) {
    return (
      <img
        src="/images/default-vehicle-placeholder.svg"
        alt={alt || "Prava Online Vehicle"}
        className={className}
        loading="lazy"
        draggable={false}
        style={{
          ...style,
          objectFit: "contain",
          maxHeight: style?.maxHeight || "280px",
          width: style?.width || "100%",
        }}
      />
    );
  }

  const src = getImageUrl(path) || path;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      draggable={false}
      onContextMenu={(e) => e.preventDefault()}
      onClick={onOpen ? () => onOpen(src) : undefined}
      onError={() => setHasError(true)}
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
