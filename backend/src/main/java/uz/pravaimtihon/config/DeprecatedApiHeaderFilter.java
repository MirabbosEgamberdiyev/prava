package uz.pravaimtihon.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Eskirgan API'larni belgilaydi (RFC 8594 / draft Deprecation header).
 *
 * <p>{@code /api/v1/exams/**} ({@code ExamService}, 669 qator) va {@code /api/v2/exams/**}
 * ({@code ExamServiceV2}) parallel yashayapti — xatolar biri'da tuzatilib, ikkinchisida qolmoqda.
 * Klientlar v2 ga o'tgach v1 o'chiriladi. Header'lar klient loglarida va brauzer
 * DevTools'da ko'rinadi, shuning uchun migratsiya holatini kuzatish oson.
 */
@Component
public class DeprecatedApiHeaderFilter extends OncePerRequestFilter {

    private static final String SUNSET = "Tue, 31 Mar 2027 00:00:00 GMT";

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/v1/exams");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        response.setHeader("Deprecation", "true");
        response.setHeader("Sunset", SUNSET);
        response.setHeader("Link", "</api/v2/exams>; rel=\"successor-version\"");
        chain.doFilter(request, response);
    }
}
