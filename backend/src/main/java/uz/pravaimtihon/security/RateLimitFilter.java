package uz.pravaimtihon.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * In-memory rate limiting filter for auth endpoints.
 * Tracks requests per IP address using a sliding window.
 */
@Component
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    @Value("${app.security.rate-limit.enabled:true}")
    private boolean enabled;

    @Value("${app.security.rate-limit.requests-per-minute:60}")
    private int requestsPerMinute;

    /** Kredensial bilan ishlaydigan endpointlar uchun qattiqroq limit. */
    @Value("${app.security.rate-limit.auth-requests-per-minute:10}")
    private int authRequestsPerMinute;

    /**
     * AUDIT: bu map hech qachon tozalanmasdi. X-Forwarded-For soxtalashtirish
     * bilan (pastga qarang) yoki oddiy IPv6 xilma-xilligi bilan cheksiz o'sib,
     * OutOfMemoryError'ga olib kelishi mumkin edi. Endi hajmi cheklangan va
     * eskirgan bucket'lar davriy ravishda tozalanadi.
     */
    private static final int MAX_TRACKED_KEYS = 50_000;
    private static final long BUCKET_TTL_MS = 10 * 60_000L;

    private final Map<String, TokenBucket> buckets = new ConcurrentHashMap<>();
    private volatile long lastSweep = System.currentTimeMillis();

    /** Parol/token qabul qiladigan, brute-force nishoni bo'lgan endpointlar. */
    private static boolean isCredentialEndpoint(String path) {
        return path.startsWith("/api/v1/auth/login")
                || path.startsWith("/api/v1/auth/register")
                || path.startsWith("/api/v1/auth/forgot-password")
                || path.startsWith("/api/v1/auth/reset-password")
                || path.startsWith("/api/v1/auth/change-password")
                || path.startsWith("/api/v1/auth/google")
                || (path.startsWith("/api/v1/auth/telegram") && !path.startsWith("/api/v1/auth/telegram/session"));
    }

    /** Ochiq (permitAll) rasm fayllari — o'z bucket'iga ega, API limitini sarflamaydi. */
    static boolean isPublicImagePath(String path) {
        return path.startsWith("/api/v1/files/general/")
                || path.startsWith("/api/v1/files/questions/")
                || path.startsWith("/api/v1/files/signs/")
                || path.startsWith("/api/v1/files/markings/")
                || path.startsWith("/api/v1/files/defaults/")
                || path.startsWith("/api/v1/files/profiles/");
    }

    /** Eskirgan bucket'larni tozalash (map cheksiz o'smasligi uchun). */
    private void sweepIfNeeded(long now) {
        if (now - lastSweep < 60_000L && buckets.size() < MAX_TRACKED_KEYS) {
            return;
        }
        lastSweep = now;
        buckets.entrySet().removeIf(e -> now - e.getValue().lastRefillTime > BUCKET_TTL_MS);
        if (buckets.size() >= MAX_TRACKED_KEYS) {
            // Oxirgi chora: bosim juda katta bo'lsa hammasini tashlaymiz —
            // xotira tugab ilova qulashidan ko'ra yaxshiroq.
            log.warn("Rate-limit bucket soni {} ga yetdi — map tozalanmoqda", buckets.size());
            buckets.clear();
        }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {
        if (!enabled) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIp(request);
        String path = request.getRequestURI();

        // AUDIT: avval login/register/forgot-password uchun ham umumiy
        // 200 req/min limiti amal qilardi — bu brute-force uchun deyarli
        // hech qanday to'siq emas edi. Endi kredensial bilan ishlaydigan
        // endpointlar uchun alohida, ancha qattiq bucket bor.
        final int limit;
        final String bucketKey;
        if (path.contains("telegram/token-login")) {
            limit = 10;
            bucketKey = clientIp + ":tg-token-login";
        } else if (path.contains("telegram/webhook")) {
            limit = 30;
            bucketKey = clientIp + ":tg-webhook";
        } else if (path.startsWith("/api/v1/auth/telegram/session/status")) {
            // Telegram tasdig'ini kutayotgan klient ~2 soniyada bir so'raydi; pollSecret (256 bit) himoyalaydi
            limit = 60;
            bucketKey = clientIp + ":tg-session-poll";
        } else if (isCredentialEndpoint(path)) {
            limit = authRequestsPerMinute;
            bucketKey = clientIp + ":auth";
        } else if (path.startsWith("/api/v1/public/guest-exam")) {
            limit = 10;
            bucketKey = clientIp + ":guest-exam";
        } else if (isPublicImagePath(path)) {
            // AUDIT 2026-10-20: savol rasmlari asosan /files/general/ da. Avval ular umumiy (API) bucket'ni
            // ishlatardi — Desktop/Mobile oflayn rasm yuklashi (~750 ta) bir necha daqiqa davomida shu IP'ning
            // oddiy API so'rovlarini (Oktagon ticket, statistika...) 429 bilan bo'g'ib qo'yardi.
            limit = 240;
            bucketKey = clientIp + ":img";
        } else if (path.startsWith("/api/v2/exams/") || path.startsWith("/api/v2/tickets/")) {
            limit = 60;
            bucketKey = clientIp + ":exam";
        } else if (path.startsWith("/api/v1/content/") || path.startsWith("/api/v2/content/")) {
            limit = 120;
            bucketKey = clientIp + ":content";
        } else if (path.startsWith("/api/v1/app/")) {
            limit = 60;
            bucketKey = clientIp + ":app";
        } else {
            limit = requestsPerMinute;
            bucketKey = clientIp;
        }

        sweepIfNeeded(System.currentTimeMillis());

        TokenBucket bucket = buckets.computeIfAbsent(bucketKey, k -> new TokenBucket(limit));

        if (!bucket.tryConsume()) {
            log.warn("Rate limit exceeded for IP: {} on key: {}", clientIp, bucketKey);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(
                    "{\"success\":false,\"message\":\"Too many requests. Please try again later.\"}"
            );
            return;
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        // Faqat /api/** so'rovlari rate-limit qilinadi.
        // Statik fayllar, html, css, js, swagger, actuator filtrlashdan ozod.
        if (!path.startsWith("/api/")) {
            return true;
        }
        return path.startsWith("/api-docs") || path.startsWith("/v3/api-docs");
    }

    /**
     * ⚠️ AUDIT — XAVFSIZLIK: avvalgi implementatsiya `X-Forwarded-For` ning
     * BIRINCHI qiymatini olardi. Nginx `$proxy_add_x_forwarded_for` bilan
     * klient yuborgan header'ga o'zining IP'sini QO'SHIB qo'yadi, ya'ni
     * birinchi element to'liq HUJUMCHI NAZORATIDA bo'ladi. Natijada
     * `X-Forwarded-For: 1.2.3.4` deb yuborib, har bir so'rovda yangi "IP"
     * bilan rate-limit'ni butunlay chetlab o'tish mumkin edi (login
     * brute-force uchun ochiq yo'l) va ayni paytda bucket map'ini shishirib
     * xotirani tugatish ham mumkin edi.
     *
     * Endi:
     *  1) `X-Real-IP` — nginx uni HAR DOIM `$remote_addr` ga qayta yozadi,
     *     shuning uchun ishonchli;
     *  2) aks holda XFF ning OXIRGI elementi (proxy qo'shgan, ishonchli hop);
     *  3) aks holda `remoteAddr`.
     */
    private String getClientIp(HttpServletRequest request) {
        return uz.pravaimtihon.security.ClientIpResolver.resolve(request);
    }

    /**
     * Simple token bucket for rate limiting.
     * Refills tokens based on elapsed time.
     */
    private static class TokenBucket {
        private final int maxTokens;
        private final AtomicInteger tokens;
        private volatile long lastRefillTime;

        TokenBucket(int maxTokens) {
            this.maxTokens = maxTokens;
            this.tokens = new AtomicInteger(maxTokens);
            this.lastRefillTime = System.currentTimeMillis();
        }

        synchronized boolean tryConsume() {
            refill();
            if (tokens.get() > 0) {
                tokens.decrementAndGet();
                return true;
            }
            return false;
        }

        private void refill() {
            long now = System.currentTimeMillis();
            long elapsed = now - lastRefillTime;
            if (elapsed > 60_000) {
                tokens.set(maxTokens);
                lastRefillTime = now;
            } else {
                int tokensToAdd = (int) (elapsed * maxTokens / 60_000);
                if (tokensToAdd > 0) {
                    int newTokens = Math.min(maxTokens, tokens.get() + tokensToAdd);
                    tokens.set(newTokens);
                    lastRefillTime = now;
                }
            }
        }
    }
}
