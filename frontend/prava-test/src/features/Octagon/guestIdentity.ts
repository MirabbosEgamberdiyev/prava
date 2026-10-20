/**
 * Oktagon mehmon identifikatsiyasi.
 *
 * Server mehmonga imzolangan token beradi (`g1.<hex>.<imzo>`) — u faqat shu brauzerda saqlanadi va
 * ticket/history/report so'rovlarida guestId sifatida yuboriladi. Boshqa o'yinchilarga faqat ochiq ID
 * (`guest_<hex>`) ko'rinadi. Avvalgi klientda yaratilgan `guest_xxxx` ID'lar endi identifikatsiya emas.
 */
const TOKEN_KEY = "octagon_guest_id";
const PUBLIC_KEY = "octagon_guest_public_id";
const NICK_KEY = "octagon_guest_nickname";

function read(key: string): string | undefined {
  try {
    return localStorage.getItem(key) || undefined;
  } catch {
    return undefined;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // private mode / storage blocked — identity lives for this page only
  }
}

export const OctagonGuest = {
  /** Server bergan token (eski, klientda yaratilgan ID'lar e'tiborga olinmaydi). */
  getToken(): string | undefined {
    const v = read(TOKEN_KEY);
    return v && v.startsWith("g1.") ? v : undefined;
  },
  /** Raqiblar ko'radigan ochiq ID (winnerId bilan solishtirish uchun). */
  getPublicId(): string | undefined {
    return read(PUBLIC_KEY);
  },
  getNickname(): string | undefined {
    return read(NICK_KEY);
  },
  /** Mehmon sifatida o'ynashni tanlaganmi (laqab saqlangan). */
  hasPass(): boolean {
    return Boolean(read(NICK_KEY));
  },
  save(token?: string | null, publicId?: string | null) {
    if (token) write(TOKEN_KEY, token);
    if (publicId) write(PUBLIC_KEY, publicId);
  },
};
