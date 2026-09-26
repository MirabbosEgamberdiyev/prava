import { useMemo, type CSSProperties } from "react";
import DOMPurify from "dompurify";

/*
 * P1-W9: admin panelidan keladigan HTML kontent (YHQ, belgilar, chiziqlar)
 * avval to'g'ridan-to'g'ri `dangerouslySetInnerHTML` bilan render qilinardi.
 * Admin akkaunti buzilsa yoki kontentga zararli HTML tushsa → barcha
 * foydalanuvchilarda stored XSS. Endi DOMPurify orqali tozalanadi:
 * <script>, on* event handler'lar, javascript: URL'lar, iframe/form va h.k.
 * olib tashlanadi; oddiy formatlash (p, b, ul, table, img, a ...) saqlanadi.
 */
const PURIFY_CONFIG = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ["style", "form", "input", "button", "textarea", "select", "iframe", "object", "embed"],
  FORBID_ATTR: ["srcset"],
  ALLOW_DATA_ATTR: false,
};

let hookInstalled = false;
function ensureLinkHook() {
  if (hookInstalled) return;
  hookInstalled = true;
  // Tashqi havolalar yangi oynada va opener'siz ochilsin
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A" && node.getAttribute("href")) {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer");
    }
  });
}

function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";
  ensureLinkHook();
  return DOMPurify.sanitize(html, PURIFY_CONFIG);
}

interface SafeHtmlProps {
  html: string | null | undefined;
  className?: string;
  style?: CSSProperties;
}

const SafeHtml = ({ html, className, style }: SafeHtmlProps) => {
  const clean = useMemo(() => sanitizeHtml(html), [html]);
  return (
    <div
      className={className}
      style={style}
      // Kontent DOMPurify orqali tozalangan
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
};

export default SafeHtml;
