package uz.pravaimtihon.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.NoSuchMessageException;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import uz.pravaimtihon.enums.AcceptLanguage;

import java.util.Locale;

/**
 * ✅ Enhanced MessageService with AcceptLanguage support
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageSource messageSource;

    // ============================================
    // LOCALE-BASED METHODS (existing)
    // ============================================

    /**
     * Get message using current locale from context
     */
    public String getMessage(String key) {
        return getMessage(key, null, LocaleContextHolder.getLocale());
    }

    /**
     * Get message with args using current locale
     */
    public String getMessage(String key, Object[] args) {
        return getMessage(key, args, LocaleContextHolder.getLocale());
    }

    /**
     * Get message with specific locale
     */
    public String getMessage(String key, Object[] args, Locale locale) {
        try {
            return messageSource.getMessage(key, args, locale);
        } catch (NoSuchMessageException e) {
            log.warn("⚠️ Message not found: key={}, locale={}", key, locale);
            return key; // Fallback to key
        }
    }

    // ============================================
    // ACCEPTLANGUAGE-BASED METHODS (new)
    // ============================================

    /**
     * ✅ Get message using AcceptLanguage enum
     * This is the main method for REST API responses
     */
    public String getMessage(String key, AcceptLanguage language) {
        return getMessage(key, null, language);
    }

    /**
     * ✅ Get message with args using AcceptLanguage enum
     */
    public String getMessage(String key, Object[] args, AcceptLanguage language) {
        if (language == null) {
            language = AcceptLanguage.UZL; // Default
        }
        return getMessage(key, args, language.toLocale());
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Check if message exists for given key and language
     */
    public boolean messageExists(String key, AcceptLanguage language) {
        try {
            messageSource.getMessage(key, null, language.toLocale());
            return true;
        } catch (NoSuchMessageException e) {
            return false;
        }
    }

    /**
     * Get message with fallback to English if not found
     */
    public String getMessageWithFallback(String key, AcceptLanguage language) {
        try {
            return getMessage(key, null, language);
        } catch (Exception e) {
            log.warn("⚠️ Falling back to EN for key: {}", key);
            return getMessage(key, null, AcceptLanguage.EN);
        }
    }
}