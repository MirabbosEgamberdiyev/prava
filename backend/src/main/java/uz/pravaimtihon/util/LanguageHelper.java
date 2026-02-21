package uz.pravaimtihon.util;

import jakarta.servlet.http.HttpServletRequest;
import lombok.experimental.UtilityClass;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import uz.pravaimtihon.enums.AcceptLanguage;

/**
 * ? FIXED: Language Helper - Properly resolves language from HTTP header
 */
@Slf4j
@UtilityClass
public class LanguageHelper {

    private static final String LANGUAGE_HEADER = "Accept-Language";
    private static final AcceptLanguage DEFAULT_LANGUAGE = AcceptLanguage.UZL;

    /**
     * Get language from current HTTP request
     * Returns default if request context unavailable
     */
    public static AcceptLanguage getCurrentLanguage() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                String header = request.getHeader(LANGUAGE_HEADER);

                if (header != null && !header.isBlank()) {
                    return AcceptLanguage.fromCode(header.trim());
                }
            }
        } catch (Exception e) {
            log.debug("Could not resolve language from request context: {}", e.getMessage());
        }

        return DEFAULT_LANGUAGE;
    }

    /**
     * Parse language from header string
     * Used in controllers with @RequestHeader
     */
    public static AcceptLanguage fromHeader(String header) {
        if (header == null || header.isBlank()) {
            return DEFAULT_LANGUAGE;
        }

        try {
            return AcceptLanguage.fromCode(header.trim());
        } catch (Exception e) {
            log.warn("Invalid language header: {}", header);
            return DEFAULT_LANGUAGE;
        }
    }

    /**
     * Validate and normalize language code
     */
    public static AcceptLanguage validateLanguage(String code) {
        return AcceptLanguage.fromCode(code);
    }
}
