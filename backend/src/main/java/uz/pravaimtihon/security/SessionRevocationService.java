package uz.pravaimtihon.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import uz.pravaimtihon.repository.RefreshTokenRepository;

import java.time.Duration;
import java.time.LocalDateTime;

/**
 * Access token'dagi {@code sid} (= refresh token family, ya'ni bitta qurilma sessiyasi)
 * hali faolligini tekshiradi.
 *
 * <p>Avval access token (24 soat) hech qanday holatda bekor qilinmasdi: bloklash,
 * "hamma qurilmalardan chiqish" yoki qurilma limiti faqat refresh token'larni o'chirardi.
 * Endi sessiya refresh token'lari revoke qilinsa, uning access token'lari ham
 * ko'pi bilan {@link #CACHE_TTL} ichida rad etiladi.
 */
@Service
@RequiredArgsConstructor
public class SessionRevocationService {

    static final Duration CACHE_TTL = Duration.ofSeconds(30);

    private final RefreshTokenRepository refreshTokenRepository;

    private final Cache<String, Boolean> activeCache = Caffeine.newBuilder()
            .expireAfterWrite(CACHE_TTL)
            .maximumSize(100_000)
            .build();

    public boolean isSessionActive(String sid) {
        return activeCache.get(sid, key ->
                !refreshTokenRepository.findActiveTokensByFamily(key, LocalDateTime.now()).isEmpty());
    }

    /** Sessiya revoke qilinganda chaqiring — o'zgarish darhol kuchga kiradi (shu instansiyada). */
    public void evict(String sid) {
        activeCache.invalidate(sid);
    }

    public void evictAll() {
        activeCache.invalidateAll();
    }
}
