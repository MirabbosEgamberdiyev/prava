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

        String normalized = code.trim().toLowerCase();

        return switch (normalized) {
            case "uzl", "uz-latn", "uz_latn", "uzbek" -> UZL;
            case "uzc", "uz-cyrl", "uz_cyrl" -> UZC;
            case "ru", "ru-ru", "rus", "russian" -> RU;
            case "en", "en-us", "eng", "english" -> EN;
            default -> {
                // Try to match by display name (case-insensitive)
                for (AcceptLanguage lang : values()) {
                    if (lang.displayName.equalsIgnoreCase(code)) {
                        yield lang;
                    }
                }
                yield UZL; // Default fallback
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