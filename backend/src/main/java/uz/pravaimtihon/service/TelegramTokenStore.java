package uz.pravaimtihon.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class TelegramTokenStore {

    private static final long TTL_MINUTES = 15;

    private record TokenEntry(Long telegramUserId, Instant expiresAt) {}

    private final Map<String, TokenEntry> tokens = new ConcurrentHashMap<>();

    public String generateToken(Long telegramUserId) {
        String token = UUID.randomUUID().toString();
        tokens.put(token, new TokenEntry(telegramUserId, Instant.now().plusSeconds(TTL_MINUTES * 60)));
        log.info("Generated one-time token for Telegram user {}", telegramUserId);
        return token;
    }

    public Long validateAndConsume(String token) {
        TokenEntry entry = tokens.remove(token);
        if (entry == null) {
            return null;
        }
        if (Instant.now().isAfter(entry.expiresAt())) {
            log.warn("Token expired for Telegram user {}", entry.telegramUserId());
            return null;
        }
        log.info("Token consumed for Telegram user {}", entry.telegramUserId());
        return entry.telegramUserId();
    }

    @Scheduled(fixedRate = 60_000)
    public void cleanExpiredTokens() {
        Instant now = Instant.now();
        int before = tokens.size();
        tokens.entrySet().removeIf(e -> now.isAfter(e.getValue().expiresAt()));
        int removed = before - tokens.size();
        if (removed > 0) {
            log.debug("Cleaned {} expired Telegram tokens", removed);
        }
    }
}
