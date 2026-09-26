package uz.pravaimtihon.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class TelegramTokenStore {

    /** Verification code is valid for exactly 5 minutes */
    private static final long TTL_MINUTES = 5;

    public record TelegramUserData(Long telegramUserId, String firstName, String lastName, String username) {}

    private record TokenEntry(TelegramUserData userData, Instant expiresAt) {}

    /** Active tokens: tokenCode -> TokenEntry */
    private final Map<String, TokenEntry> tokens = new ConcurrentHashMap<>();

    /** Active token mapping for user: telegramUserId -> tokenCode (for immediate invalidation on re-request) */
    private final Map<Long, String> userActiveTokens = new ConcurrentHashMap<>();

    private final SecureRandom secureRandom = new SecureRandom();

    /*
     * SECURITY: 5 xonali kod (100k) — mavjud klientlar (desktop, mobil) aynan shu formatni kutadi.
     * IP bo'yicha limit (RateLimitFilter, 10/min) botnet'ga qarshi yetarli emas, shuning uchun
     * GLOBAL muvaffaqiyatsiz urinishlar soni cheklanadi: 1 daqiqada MAX_GLOBAL_FAILURES dan oshsa,
     * tekshiruv 1 daqiqaga to'xtatiladi (hamma uchun). Keyingi bosqich: uzunroq kod + klient yangilanishi.
     */
    private static final int MAX_GLOBAL_FAILURES = 30;
    private static final long FAILURE_WINDOW_MS = 60_000L;
    private long failureWindowStart = 0L;
    private int failuresInWindow = 0;
    private long circuitOpenUntil = 0L;

    private void registerFailure() {
        long now = System.currentTimeMillis();
        if (now - failureWindowStart > FAILURE_WINDOW_MS) {
            failureWindowStart = now;
            failuresInWindow = 0;
        }
        if (++failuresInWindow >= MAX_GLOBAL_FAILURES) {
            circuitOpenUntil = now + FAILURE_WINDOW_MS;
            failuresInWindow = 0;
            log.error("Telegram code brute-force suspected: validation paused for {} ms", FAILURE_WINDOW_MS);
        }
    }

    private boolean isCircuitOpen() {
        return System.currentTimeMillis() < circuitOpenUntil;
    }

    /**
     * Generates a cryptographically secure 5-digit numeric verification code (00000 - 99999) with user profile.
     * If an active token already exists for the user, it is immediately invalidated.
     */
    public synchronized String generateToken(Long telegramUserId, String firstName, String lastName, String username) {
        // Invalidate previous token for this user if one exists
        String previousToken = userActiveTokens.remove(telegramUserId);
        if (previousToken != null) {
            tokens.remove(previousToken);
            log.info("Invalidated previous Telegram code for user {}", telegramUserId);
        }

        // Generate unique 5-digit numeric code
        String token;
        int attempts = 0;
        do {
            int code = secureRandom.nextInt(100_000);
            token = String.format("%05d", code);
            attempts++;
            if (attempts > 30) {
                // In the rare event of collision saturation, purge expired entries immediately
                cleanExpiredTokens();
            }
        } while (tokens.containsKey(token));

        Instant expiresAt = Instant.now().plusSeconds(TTL_MINUTES * 60);
        TelegramUserData userData = new TelegramUserData(telegramUserId, firstName, lastName, username);
        tokens.put(token, new TokenEntry(userData, expiresAt));
        userActiveTokens.put(telegramUserId, token);

        log.info("Generated Telegram verification code for user {} (TTL: {}m)", telegramUserId, TTL_MINUTES);
        return token;
    }

    public synchronized String generateToken(Long telegramUserId) {
        return generateToken(telegramUserId, null, null, null);
    }

    /**
     * Atomically validates and consumes the one-time verification code.
     * Returns the TelegramUserData if valid, or null if invalid / expired / already consumed.
     */
    public synchronized TelegramUserData validateAndConsume(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }
        if (isCircuitOpen()) {
            log.warn("Telegram code validation temporarily blocked: too many failed attempts globally");
            return null;
        }

        String normalizedToken = token.trim();
        TokenEntry entry = tokens.remove(normalizedToken);
        if (entry == null) {
            registerFailure();
            log.warn("Telegram verification code not found or already consumed");
            return null;
        }

        userActiveTokens.remove(entry.userData().telegramUserId(), normalizedToken);

        if (Instant.now().isAfter(entry.expiresAt())) {
            log.warn("Telegram verification code expired for user {}", entry.userData().telegramUserId());
            return null;
        }

        log.info("Telegram verification code successfully consumed for user {}", entry.userData().telegramUserId());
        return entry.userData();
    }

    /**
     * Periodic cleanup of expired tokens every 30 seconds
     */
    @Scheduled(fixedRate = 30_000)
    public synchronized void cleanExpiredTokens() {
        Instant now = Instant.now();
        int before = tokens.size();

        tokens.entrySet().removeIf(e -> {
            boolean expired = now.isAfter(e.getValue().expiresAt());
            if (expired) {
                userActiveTokens.remove(e.getValue().userData().telegramUserId(), e.getKey());
            }
            return expired;
        });

        int removed = before - tokens.size();
        if (removed > 0) {
            log.debug("Cleaned {} expired Telegram verification codes", removed);
        }
    }
}
