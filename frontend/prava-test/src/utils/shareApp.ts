import i18n from "./i18n";
import { showToast } from "./notificationUtils";

export const APP_SHARE_URL = "https://pravaonline.uz";

/**
 * "Do'stlarga ulashish": tizim ulashish oynasi (telefon brauzeri), bo'lmasa (desktop) matn nusxalanadi.
 * Matn tanlangan tilda va har doim rasmiy havola bilan.
 */
export async function shareApp(): Promise<void> {
  const text = i18n.t("share.appMessage", { url: APP_SHARE_URL });
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  if (nav?.share) {
    try {
      await nav.share({ title: "PRAVA ONLINE", text });
      return;
    } catch (e) {
      if ((e as DOMException)?.name === "AbortError") return;
    }
  }
  try {
    await nav?.clipboard?.writeText(text);
    showToast({ color: "teal", message: i18n.t("share.copied") });
  } catch {
    showToast({ color: "red", message: i18n.t("share.failed") });
  }
}
