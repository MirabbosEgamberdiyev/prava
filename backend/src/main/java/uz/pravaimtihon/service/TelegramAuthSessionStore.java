package uz.pravaimtihon.service;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import uz.pravaimtihon.dto.telegram.TelegramSessionInitRequest;
import uz.pravaimtihon.dto.telegram.TelegramSessionInitResponse;
import uz.pravaimtihon.enums.AcceptLanguage;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Telegram orqali "bir bosishda" kirish sessiyalari (Web, Desktop, Mobile uchun yagona oqim), xotirada.
 *
 * <ol>
 *   <li>Klient {@code POST /api/v1/auth/telegram/session/init} — bir martalik {@code token} va {@code pollSecret} oladi.</li>
 *   <li>Klient Telegram'ni {@code tg://resolve?domain=...&start=<token>} (zaxira: {@code https://t.me/...}) orqali ochadi.</li>
 *   <li>Bot qurilma ma'lumotini ko'rsatadi; foydalanuvchi "Tasdiqlash"ni bosgandagina sessiya APPROVED bo'ladi
 *       (avtomatik tasdiqlash yo'q — begona odam yaratgan havolani bosish akkauntni topshirib qo'ymasligi uchun).</li>
 *   <li>Klient {@code GET /status} ni pollSecret bilan so'raydi — tokenlar faqat bir marta beriladi, so'ng CONSUMED.</li>
 * </ol>
 *
 * Token va pollSecret loglarga yozilmaydi (faqat qisqa prefiks), pollSecret constant-time solishtiriladi,
 * sessiyalar soni cheklangan (xotira to'lib ketmasligi uchun).
 */
@Service
@Slf4j
public class TelegramAuthSessionStore {

    public static final long TTL_SECONDS = 300;          // 5 daqiqa
    private static final long RETENTION_SECONDS = 600;   // yakuniy holatlar 10 daqiqagacha saqlanadi
    private static final int TOKEN_BYTES = 24;           // 192 bit; "auth_" + 48 hex = 53 belgi (Telegram /start chegarasi 64)
    private static final int POLL_SECRET_BYTES = 32;     // 256 bit
    static final int MAX_SESSIONS = 5000;
    private static final Set<String> PLATFORMS = Set.of("web", "desktop", "android", "ios", "mobile");

    public enum Status {
        PENDING,
        APPROVED,
        CONSUMED,
        EXPIRED,
        CANCELLED,
        REJECTED
    }

    @Getter
    @Setter
    @Builder
    public static class SessionEntry {
        private String token;
        private String pollSecret;
        private String platform;
        private String deviceName;
        private String redirectPath;
        private String clientIp;
        private String userAgent;
        private Status status;
        private Instant createdAt;
        private Instant expiresAt;
        private Long telegramUserId;
        private String telegramUsername;
        private Long userId;
        private AcceptLanguage language;
    }

    /** Botdagi tasdiq xabarida ko'rsatiladigan tashabbuskor qurilma ma'lumoti. */
    public record DeviceInfo(String platform, String deviceName, String clientIp) {
    }

    public record PollOutcome(Status status, Long userId, Long telegramUserId, AcceptLanguage language,
                              String redirectPath, String clientIp, String userAgent) {
        public static PollOutcome of(Status status) {
            return new PollOutcome(status, null, null, null, null, null, null);
        }

        public boolean approved() {
            return status == Status.APPROVED;
        }
    }

    public static class PollSecretException extends RuntimeException {
        public PollSecretException(String message) {
            super(message);
        }
    }

    public static class CapacityException extends RuntimeException {
        public CapacityException(String message) {
            super(message);
        }
    }

    @Value("${app.telegram.bot-username:pravaonlineuzbot}")
    private String botUsername;

    private final Map<String, SessionEntry> sessions = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();

    /** Logga to'liq token o'rniga faqat qisqa prefiks. */
    static String shortRef(String token) {
        if (token == null) {
            return "null";
        }
        return token.length() > 13 ? token.substring(0, 13) + "…" : token;
    }

    /** Faqat ilova ichidagi nisbiy yo'l (open redirect va sarlavha in'ektsiyasiga yo'l qo'yilmaydi). */
    static String safeRedirect(String path) {
        if (path == null) {
            return null;
        }
        String p = path.trim();
        boolean ok = p.startsWith("/") && !p.startsWith("//") && !p.startsWith("/\\")
                && p.length() <= 200 && !p.contains("\n") && !p.contains("\r");
        return ok ? p : null;
    }

    private static String safeText(String s, int max) {
        if (s == null) {
            return null;
        }
        String t = s.replaceAll("\\p{Cntrl}", "").strip();
        if (t.isEmpty()) {
            return null;
        }
        return t.length() > max ? t.substring(0, max) : t;
    }

    public TelegramSessionInitResponse createSession(TelegramSessionInitRequest request, String clientIp, String userAgent) {
        if (sessions.size() >= MAX_SESSIONS) {
            purgeExpiredSessions();
            if (sessions.size() >= MAX_SESSIONS) {
                throw new CapacityException("Too many pending Telegram login sessions");
            }
        }

        byte[] tokenBytes = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(tokenBytes);
        String token = "auth_" + HexFormat.of().formatHex(tokenBytes);

        byte[] secretBytes = new byte[POLL_SECRET_BYTES];
        secureRandom.nextBytes(secretBytes);
        String pollSecret = Base64.getUrlEncoder().withoutPadding().encodeToString(secretBytes);

        Instant now = Instant.now();
        String rawPlatform = request != null && request.getPlatform() != null
                ? request.getPlatform().trim().toLowerCase() : "web";
        String platform = PLATFORMS.contains(rawPlatform) ? rawPlatform : "web";

        SessionEntry entry = SessionEntry.builder()
                .token(token)
                .pollSecret(pollSecret)
                .platform(platform)
                .deviceName(request != null ? safeText(request.getDeviceName(), 60) : null)
                .redirectPath(request != null ? safeRedirect(request.getRedirectPath()) : null)
                .clientIp(clientIp)
                .userAgent(safeText(userAgent, 300))
                .status(Status.PENDING)
                .createdAt(now)
                .expiresAt(now.plusSeconds(TTL_SECONDS))
                .build();
        sessions.put(token, entry);
        log.info("Initialized Telegram login session {} platform={}", shortRef(token), platform);

        String username = botUsername != null && !botUsername.isBlank() ? botUsername.trim() : "pravaonlineuzbot";
        return TelegramSessionInitResponse.builder()
                .token(token)
                .pollSecret(pollSecret)
                .botUsername(username)
                .botUrl("https://t.me/" + username + "?start=" + token)
                .directAppUrl("tg://resolve?domain=" + username + "&start=" + token)
                .expiresInSeconds(TTL_SECONDS)
                .build();
    }

    /** Faqat kutilayotgan (PENDING, muddati o'tmagan) sessiya uchun qurilma ma'lumoti. */
    public Optional<DeviceInfo> pendingDeviceInfo(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        SessionEntry entry = sessions.get(token.trim());
        if (entry == null || entry.getStatus() != Status.PENDING || Instant.now().isAfter(entry.getExpiresAt())) {
            return Optional.empty();
        }
        return Optional.of(new DeviceInfo(entry.getPlatform(), entry.getDeviceName(), entry.getClientIp()));
    }

    /** Bot "Tasdiqlash" tugmasi. Faqat PENDING sessiya va faqat bir marta tasdiqlanadi. */
    public synchronized boolean approve(String token, Long telegramUserId, String username, Long dbUserId,
                                        AcceptLanguage language) {
        if (token == null || token.isBlank()) {
            return false;
        }
        SessionEntry entry = sessions.get(token.trim());
        if (entry == null) {
            log.warn("Telegram auth session not found for approval: {}", shortRef(token));
            return false;
        }
        if (Instant.now().isAfter(entry.getExpiresAt())) {
            entry.setStatus(Status.EXPIRED);
            log.warn("Telegram auth session expired for approval: {}", shortRef(token));
            return false;
        }
        if (entry.getStatus() != Status.PENDING) {
            log.warn("Telegram auth session status is {} (not PENDING): {}", entry.getStatus(), shortRef(token));
            return false;
        }
        entry.setStatus(Status.APPROVED);
        entry.setTelegramUserId(telegramUserId);
        entry.setTelegramUsername(username);
        entry.setUserId(dbUserId);
        entry.setLanguage(language);
        log.info("Telegram auth session approved: {} tgUserId={} dbUserId={}", shortRef(token), telegramUserId, dbUserId);
        return true;
    }

    /** Bot "Rad etish" tugmasi. */
    public synchronized boolean reject(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        SessionEntry entry = sessions.get(token.trim());
        if (entry == null || entry.getStatus() != Status.PENDING) {
            return false;
        }
        entry.setStatus(Status.REJECTED);
        log.info("Telegram auth session rejected by user: {}", shortRef(token));
        return true;
    }

    private static boolean secretMatches(String provided, String expected) {
        if (provided == null || expected == null) {
            return false;
        }
        return MessageDigest.isEqual(provided.trim().getBytes(StandardCharsets.UTF_8),
                expected.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Tashabbuskor klient so'rovi. APPROVED bo'lsa natija bir marta qaytariladi va sessiya darhol CONSUMED bo'ladi.
     *
     * @throws PollSecretException pollSecret noto'g'ri yoki yo'q bo'lsa
     */
    public synchronized PollOutcome poll(String token, String providedPollSecret) {
        if (token == null || token.isBlank()) {
            return PollOutcome.of(Status.EXPIRED);
        }
        SessionEntry entry = sessions.get(token.trim());
        if (entry == null) {
            return PollOutcome.of(Status.EXPIRED);
        }
        if (!secretMatches(providedPollSecret, entry.getPollSecret())) {
            log.warn("Telegram pollSecret mismatch for session {}", shortRef(token));
            throw new PollSecretException("Invalid or missing pollSecret");
        }
        if (entry.getStatus() == Status.PENDING && Instant.now().isAfter(entry.getExpiresAt())) {
            entry.setStatus(Status.EXPIRED);
        }
        if (entry.getStatus() == Status.APPROVED) {
            entry.setStatus(Status.CONSUMED);
            log.info("Telegram auth session consumed: {} userId={}", shortRef(token), entry.getUserId());
            return new PollOutcome(Status.APPROVED, entry.getUserId(), entry.getTelegramUserId(), entry.getLanguage(),
                    entry.getRedirectPath(), entry.getClientIp(), entry.getUserAgent());
        }
        return PollOutcome.of(entry.getStatus());
    }

    /** Tashabbuskor sessiyani bekor qiladi (oyna yopildi, "Bekor qilish" bosildi). */
    public synchronized boolean cancel(String token, String providedPollSecret) {
        if (token == null || token.isBlank()) {
            return false;
        }
        SessionEntry entry = sessions.get(token.trim());
        if (entry == null) {
            return false;
        }
        if (!secretMatches(providedPollSecret, entry.getPollSecret())) {
            throw new PollSecretException("Invalid pollSecret");
        }
        if (entry.getStatus() != Status.PENDING && entry.getStatus() != Status.APPROVED) {
            return false;
        }
        entry.setStatus(Status.CANCELLED);
        log.info("Telegram auth session cancelled: {}", shortRef(token));
        return true;
    }

    public boolean hasActiveSession(String token) {
        return pendingDeviceInfo(token).isPresent();
    }

    @Scheduled(fixedRate = 30_000)
    public synchronized void purgeExpiredSessions() {
        Instant cutoff = Instant.now().minusSeconds(RETENTION_SECONDS);
        int before = sessions.size();
        sessions.entrySet().removeIf(e -> e.getValue().getCreatedAt().isBefore(cutoff));
        int removed = before - sessions.size();
        if (removed > 0) {
            log.debug("Purged {} expired/retained Telegram auth sessions", removed);
        }
    }
}
