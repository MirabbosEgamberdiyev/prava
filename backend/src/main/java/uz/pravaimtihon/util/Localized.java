package uz.pravaimtihon.util;

import uz.pravaimtihon.enums.AcceptLanguage;

/**
 * Ko'p tilli matn uchun fallback zanjiri.
 *
 * <p>Avval faqat {@code null → uzl} fallback bor edi: bo'sh satr ("") yo'q deb
 * hisoblanmasdi (foydalanuvchi bo'sh savol ko'rardi), uzl bo'sh bo'lsa esa hech qanday
 * fallback yo'q edi. Endi har bir til uchun eng yaqin mavjud tarjima tanlanadi:
 * <pre>
 *   uzl: uzl → uzc → ru → en
 *   uzc: uzc → uzl → ru → en
 *   ru : ru  → uzl → uzc → en
 *   en : en  → ru  → uzl → uzc
 * </pre>
 */
public final class Localized {

    private Localized() {
    }

    public static String pick(AcceptLanguage language, String uzl, String uzc, String ru, String en) {
        AcceptLanguage lang = language != null ? language : AcceptLanguage.UZL;
        return switch (lang) {
            case UZL -> first(uzl, uzc, ru, en);
            case UZC -> first(uzc, uzl, ru, en);
            case RU -> first(ru, uzl, uzc, en);
            case EN -> first(en, ru, uzl, uzc);
        };
    }

    public static boolean hasText(String s) {
        return s != null && !s.isBlank();
    }

    private static String first(String... values) {
        for (String v : values) {
            if (hasText(v)) return v;
        }
        return values.length > 0 ? values[0] : null;
    }
}
