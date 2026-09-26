package uz.pravaimtihon.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Locale;

/**
 * ✅ FIXED: Multi-language Support Enum with Jackson support
 * Supports: Uzbek Latin, Uzbek Cyrillic, Russian, English
 */
@Getter
@RequiredArgsConstructor
public enum AcceptLanguage {
    UZL("uzl", "O'zbek (Lotin)", "uz"),
    UZC("uzc", "Ўзбек (Кирилл)", "uz_Cyrl"),
    RU("ru", "Русский", "ru"),
    EN("en", "English", "en");

    private final String code;
    private final String displayName;
    private final String localeCode;

    /**
     * ✅ Convert to Java Locale for MessageSource
     */
    public Locale toLocale() {
        return switch (this) {
            case UZL -> new Locale("uzl");
            case UZC -> new Locale("uzc");
            case RU -> new Locale("ru");
            case EN -> new Locale("en");
        };
    }

    /**
     * ✅ Jackson will use this method for serialization (Enum -> JSON)
     * When converting to JSON, use lowercase code
     */
    @JsonValue
    public String getCode() {
        return code;
    }

    /**
     * ✅ Jackson will use this method for deserialization (JSON -> Enum)
     * Parse language from JSON value: "uzl" -> AcceptLanguage.UZL
     */
    @JsonCreator
    public static AcceptLanguage fromCode(String code) {
        if (code == null || code.isBlank()) {
            return UZL; // Default to Uzbek Latin
        }

        // Brauzer header'i: "ru-RU,ru;q=0.9,en;q=0.8" — afzallik (q) bo'yicha birinchi
        // tanilgan tilni tanlaymiz. Avval butun satr bitta kod deb solishtirilardi va
        // rus/kirill foydalanuvchilari har doim o'zbek lotinida javob olardi.
        if (code.indexOf(',') >= 0 || code.indexOf(';') >= 0) {
            AcceptLanguage best = null;
            double bestQ = -1;
            for (String part : code.split(",")) {
                String[] pieces = part.trim().split(";");
                double q = 1.0;
                for (int i = 1; i < pieces.length; i++) {
                    String p = pieces[i].trim();
                    if (p.startsWith("q=")) {
                        try {
                            q = Double.parseDouble(p.substring(2));
                        } catch (NumberFormatException ignored) {
                            q = 0;
                        }
                    }
                }
                AcceptLanguage lang = matchSingle(pieces[0]);
                if (lang != null && q > bestQ) {
                    best = lang;
                    bestQ = q;
                }
            }
            return best != null ? best : UZL;
        }

        AcceptLanguage single = matchSingle(code);
        return single != null ? single : UZL;
    }

    /** Bitta til tegini tanib oladi; tanilmasa null. */
    private static AcceptLanguage matchSingle(String code) {
        if (code == null || code.isBlank()) return null;
        String normalized = code.trim().toLowerCase().replace('_', '-');

        if (normalized.startsWith("uz-cyrl")) return UZC;
        if (normalized.equals("uz") || normalized.startsWith("uz-")) return UZL;
        if (normalized.startsWith("ru-")) return RU;
        if (normalized.startsWith("en-")) return EN;

        return switch (normalized) {
            case "uzl", "uz-latn", "uz_latn", "uzbek" -> UZL;
            case "uzc", "uz-cyrl", "uz_cyrl" -> UZC;
            case "ru", "ru-ru", "rus", "russian" -> RU;
            case "en", "en-us", "eng", "english" -> EN;
            default -> {
                // Try to match by display name (case-insensitive)
                for (AcceptLanguage lang : values()) {
                    if (lang.displayName.equalsIgnoreCase(code.trim())) {
                        yield lang;
                    }
                }
                yield null; // tanilmadi — chaqiruvchi UZL ga tushadi
            }
        };
    }

    /**
     * ✅ Get localized field suffix for database queries
     * Used for: field_uzl, field_uzc, field_ru, field_en
     */
    public String getFieldSuffix() {
        return "_" + code;
    }

    /**
     * Check if language code is valid
     */
    public static boolean isValid(String code) {
        if (code == null || code.isBlank()) {
            return false;
        }
        try {
            fromCode(code);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public String toString() {
        return code;
    }
}