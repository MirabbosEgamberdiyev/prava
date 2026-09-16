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

    private record TokenEntry(Long telegramUserId, Instant expiresAt) {}

    /** Active tokens: tokenCode -> TokenEntry */
    private final Map<String, TokenEntry> tokens = new ConcurrentHashMap<>();

    /** Active token mapping for user: telegramUserId -> tokenCode (for immediate invalidation on re-request) */
    private final Map<Long, String> userActiveTokens = new ConcurrentHashMap<>();

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Generates a cryptographically secure 5-digit numeric verification code (00000 - 99999).
     * If an active token already exists for the user, it is immediately invalidated.
     */
    public synchronized String generateToken(Long telegramUserId) {
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
        tokens.put(token, new TokenEntry(telegramUserId, expiresAt));
        userActiveTokens.put(telegramUserId, token);

        log.info("Generated 5-digit verification code for Telegram user {}: {} (TTL: {}m)", telegramUserId, token, TTL_MINUTES);
        return token;
    }

    /**
     * Atomically validates and consumes the one-time verification code.
     * Returns the telegramUserId if valid, or null if invalid / expired / already consumed.
     */
    public synchronized Long validateAndConsume(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }

        String normalizedToken = token.trim();
        TokenEntry entry = tokens.remove(normalizedToken);
        if (entry == null) {
            log.warn("Telegram verification code not found or already consumed: {}", normalizedToken);
            return null;
        }

        userActiveTokens.remove(entry.telegramUserId(), normalizedToken);

        if (Instant.now().isAfter(entry.expiresAt())) {
            log.warn("Telegram verification code expired for user {}", entry.telegramUserId());
            return null;
        }

        log.info("Telegram verification code successfully consumed for user {}", entry.telegramUserId());
        return entry.telegramUserId();
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
                userActiveTokens.remove(e.getValue().telegramUserId(), e.getKey());
            }
            return expired;
        });

        int removed = before - tokens.size();
        if (removed > 0) {
            log.debug("Cleaned {} expired Telegram verification codes", removed);
        }
    }
}
