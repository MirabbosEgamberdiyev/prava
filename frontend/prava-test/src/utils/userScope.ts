/**
 * Foydalanuvchiga bog'langan lokal ma'lumotlar (localStorage kalitlari, statistika)
 * uchun ID. Avval sahifalarda `user?.id ? Number(user.id) : 1` ishlatilardi — ya'ni
 * mehmon yoki ID'siz holatda ma'lumotlar haqiqiy 1-foydalanuvchi nomiga yozilardi.
 * Endi mehmon uchun alohida `GUEST_USER_ID` (0) ishlatiladi.
 */
export const GUEST_USER_ID = 0;

export function scopedUserId(user: { id?: unknown } | null | undefined): number {
  const n = Number(user?.id);
  return Number.isFinite(n) && n > 0 ? n : GUEST_USER_ID;
}
