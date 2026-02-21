package uz.pravaimtihon.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.i18n.AbstractLocaleResolver;
import uz.pravaimtihon.enums.AcceptLanguage;

import java.util.Locale;

@Slf4j
public class CustomLocaleResolver extends AbstractLocaleResolver {

    private static final String ACCEPT_LANGUAGE_HEADER = "Accept-Language";

    @Override
    @NonNull
    public Locale resolveLocale(@NonNull HttpServletRequest request) {
        String langHeader = request.getHeader(ACCEPT_LANGUAGE_HEADER);

        if (langHeader != null && !langHeader.isEmpty()) {
            try {
                AcceptLanguage language = AcceptLanguage.fromCode(langHeader);
                return new Locale(language.getCode());
            } catch (Exception e) {
                log.debug("Invalid language header: {}", langHeader);
            }
        }

        // Default to UZL
        return new Locale(AcceptLanguage.UZL.getCode());
    }

    @Override
    public void setLocale(@NonNull HttpServletRequest request,
                          HttpServletResponse response,
                          Locale locale) {
        // Not needed for header-based locale resolution
    }
}