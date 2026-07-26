/**
 * Image URL helper
 *
 * Backend LOCAL storage endi relative URL qaytaradi:
 *   /api/v1/files/questions/uuid.jpg
 *
 * S3 / Cloudinary o'z to'liq URL ini qaytaradi:
 *   https://bucket.s3.amazonaws.com/questions/uuid.jpg
 *
 * Bu funksiya ikkalasini ham to'g'ri handle qiladi.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

/**
 * Har qanday imageUrl ni brauzer ko'rsata oladigan to'liq URL ga aylantiradi.
 *
 * @example
 * getImageUrl("/api/v1/files/questions/abc.jpg")
 * // → "http://localhost:8080/api/v1/files/questions/abc.jpg"
 *
 * getImageUrl("https://bucket.s3.amazonaws.com/questions/abc.jpg")
 * // → "https://bucket.s3.amazonaws.com/questions/abc.jpg"  (o'zgarmaydi)
 *
 * getImageUrl(null)
 * // → undefined
 */
export const getImageUrl = (url: string | null | undefined): string | undefined => {
  if (!url || url.trim() === "") return undefined;

  const trimmed = url.trim();

  // XAVFSIZLIK: imageUrl admin qo'lda kiritadigan erkin matn maydoni va bulk
  // JSON import orqali ham keladi. `javascript:`, `data:`, `vbscript:` kabi
  // sxemalarni bloklaymiz — <Image src> uchun ular ishlamasa ham, bu qiymat
  // kelajakda <a href> yoki window.open ga uzatilsa XSS vektoriga aylanadi.
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    const isSafeAbsolute = /^https?:\/\//i.test(trimmed);
    if (!isSafeAbsolute) return undefined;
    // S3, Cloudinary yoki boshqa absolute URL — o'zgartirilmaydi
    return trimmed;
  }

  // Protokolga nisbiy ("//evil.com/x.jpg") ham tashqi manba — bloklanadi
  if (trimmed.startsWith("//")) return undefined;

  // Relative URL — VITE_API_URL prefixi qo'shiladi
  // /api/v1/files/questions/uuid.jpg → http://localhost:8080/api/v1/files/questions/uuid.jpg
  return `${API_BASE_URL}${trimmed}`;
};
