import React, { useState } from "react";
import { getImageUrl } from "../../../utils/imageUtils";
import { initialsOf } from "../layout";

interface Props {
  name: string;
  src?: string | null;
  size?: number;
  /** Ramka rangi (o'zim — ko'k, raqib — qizil). */
  ring?: string;
  className?: string;
}

const GRADIENTS = [
  ["#6366f1", "#8b5cf6"],
  ["#0ea5e9", "#2563eb"],
  ["#10b981", "#059669"],
  ["#f59e0b", "#d97706"],
  ["#ef4444", "#be123c"],
  ["#ec4899", "#a21caf"],
  ["#14b8a6", "#0f766e"],
  ["#8b5cf6", "#4c1d95"],
];

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * O'yinchi avatari: profil rasmi bo'lsa — rasm (yuklanmasa avtomatik bosh harflarga o'tadi),
 * aks holda ismdan barqaror rangli bosh harflar. Bo'sh/buzilgan rasm hech qachon ko'rinmaydi.
 */
export const OctagonAvatar: React.FC<Props> = ({ name, src, size = 48, ring, className }) => {
  const resolved = src ? getImageUrl(src) : undefined;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(resolved) && failedSrc !== resolved;
  const [from, to] = GRADIENTS[hash(name || "?") % GRADIENTS.length];

  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: "50%",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${from}, ${to})`,
        border: ring ? `2.5px solid ${ring}` : undefined,
        color: "#ffffff",
        fontWeight: 900,
        fontSize: Math.round(size * 0.38),
        letterSpacing: 0.5,
        userSelect: "none",
      }}
    >
      {showImage ? (
        <img
          src={resolved}
          alt=""
          referrerPolicy="no-referrer"
          draggable={false}
          onError={() => setFailedSrc(resolved ?? null)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        initialsOf(name)
      )}
    </div>
  );
};
