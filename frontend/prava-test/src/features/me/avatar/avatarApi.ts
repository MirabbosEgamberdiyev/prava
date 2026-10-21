import api from "../../../api/api";
import type { UserResponse } from "../../../types/auth";

/** Server chegarasi 3 MB; klient rasmni yuborishdan oldin kesib, kichraytiradi. */
export const AVATAR_MAX_BYTES = 3 * 1024 * 1024;
export const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp";
const OUTPUT_SIZE = 512;

export interface AvatarPreset {
  id: string;
  url: string;
}

type Envelope<T> = { data?: T } & Partial<T>;

function unwrap<T>(body: Envelope<T>): T {
  return ((body as { data?: T }).data ?? body) as T;
}

export const avatarApi = {
  async presets(): Promise<AvatarPreset[]> {
    const res = await api.get("/api/v1/public/avatars");
    const list = unwrap<AvatarPreset[]>(res.data);
    return Array.isArray(list) ? list.filter((p) => p && typeof p.url === "string") : [];
  },

  async upload(image: Blob): Promise<UserResponse> {
    const form = new FormData();
    form.append("file", image, image.type === "image/png" ? "avatar.png" : "avatar.jpg");
    const res = await api.post("/api/v1/auth/avatar", form, { headers: { "Content-Type": "multipart/form-data" } });
    return unwrap<UserResponse>(res.data);
  },

  /** Tayyor avatar tanlash; null — avatarni o'chirish (bosh harflarga qaytish). */
  async choose(profileImageUrl: string | null): Promise<UserResponse> {
    const res = await api.patch("/api/v1/auth/me", { profileImageUrl: profileImageUrl ?? "" });
    return unwrap<UserResponse>(res.data);
  },
};

/**
 * Rasmni 1:1 kvadratga (markazdan) kesib, 512 px gacha kichraytiradi va JPEG'ga o'giradi.
 * Natija: kichik fayl (odatda < 150 KB) va EXIF (joylashuv) ma'lumotlarisiz rasm — brauzer chizish
 * paytida EXIF burilishini qo'llaydi, shuning uchun telefon rasmlari ham to'g'ri turadi.
 */
export async function prepareAvatarImage(file: File): Promise<Blob> {
  const bitmap = await loadBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  const target = Math.min(side, OUTPUT_SIZE);

  const canvas = document.createElement("canvas");
  canvas.width = target;
  canvas.height = target;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, target, target);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap.source, sx, sy, side, side, 0, 0, target, target);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  if (!blob) throw new Error("encode");
  return blob;
}

interface LoadedBitmap {
  source: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
}

async function loadBitmap(file: File): Promise<LoadedBitmap> {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch {
      // eski WebView: <img> orqali
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}
