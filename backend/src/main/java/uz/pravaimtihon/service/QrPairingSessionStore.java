package uz.pravaimtihon.service;

import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import uz.pravaimtihon.dto.qr.*;
import uz.pravaimtihon.enums.AcceptLanguage;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * High-performance, cryptographically secure thread-safe in-memory store
 * for QR device pairing sessions with atomic lifecycle transitions.
 *
 * <p>Xavfsizlik (audit B-01/B-13/B-18):
 * <ul>
 *   <li>{@code /init} faqat tashabbuskor (desktop)ga {@code pollSecret} (32 tasodifiy bayt, base64url)
 *       beradi. U QR payload'ga KIRMAYDI — QR'ni ko'rgan/skanerlagan uchinchi shaxs sessionId'ni
 *       bilsa ham tokenlarni "poll" qilib o'g'irlay olmaydi.</li>
 *   <li>Tokenlar tasdiqlash paytida emas, iste'mol (poll) paytida yaratiladi — xotirada tayyor
 *       tokenlar saqlanmaydi va ular tashabbuskor qurilma ma'lumotlari bilan bog'lanadi.</li>
 *   <li>{@code /cancel} challenge yoki pollSecret talab qiladi.</li>
 *   <li>O'tish davri: {@code app.qr.allow-legacy-poll=true} (default) bo'lsa pollSecret'siz poll
 *       hali qabul qilinadi (eski desktop versiyalari). Desktop yangilangach {@code false} qiling.</li>
 * </ul>
 */
@Service
@Slf4j
public class QrPairingSessionStore {

    public static final long TTL_SECONDS = 90;
    private static final long RETENTION_SECONDS = 180;
    private static final int POLL_SECRET_BYTES = 32;

    public enum Status {
        PENDING,
        SCANNED,
        APPROVED,
        CONSUMED,
        EXPIRED,
        REJECTED,
        CANCELLED
    }

    @Data
    @Builder
    public static class SessionEntry {
        private String sessionId;
        private String challenge;
        /** Faqat tashabbuskorga beriladigan poll kaliti (QR'da yo'q). */
        private String pollSecret;
        private String clientType;
        private String clientVersion;
        private String deviceName;
        private String deviceUuid;
        /** /init so'rovidagi tashabbuskor qurilma ma'lumotlari — tokenlar shu qurilmaga bog'lanadi. */
        private String initIp;
        private String initUserAgent;
        private Status status;
        private Instant createdAt;
        private Instant expiresAt;
        private Long userId;
        private AcceptLanguage language;
    }

    /**
     * Poll natijasi. {@code status == APPROVED} bo'lsa sessiya shu chaqiruvda atomik ravishda
     * CONSUMED'ga o'tkazilgan — chaqiruvchi {@code userId} uchun tokenlarni endi yaratishi kerak
     * (bir martalik).
     */
    public record PollOutcome(Status status, Long userId, AcceptLanguage language,
                              String deviceName, String deviceUuid, String initIp, String initUserAgent) {
        static PollOutcome of(Status status) {
            return new PollOutcome(status, null, null, null, null, null, null);
        }

        public boolean approved() {
            return status == Status.APPROVED;
        }
    }

    /** pollSecret yo'q (legacy o'chirilgan) yoki noto'g'ri. */
    public static class PollSecretException extends RuntimeException {
        public PollSecretException(String message) {
            super(message);
        }
    }

    private final Map<String, SessionEntry> sessions = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();

    private final String frontendUrl;
    private final boolean allowLegacyPoll;

    public QrPairingSessionStore(
            @Value("${app.frontend.url:https://pravaonline.uz}") String frontendUrl,
            @Value("${app.qr.allow-legacy-poll:true}") boolean allowLegacyPoll) {
        this.frontendUrl = frontendUrl;
        this.allowLegacyPoll = allowLegacyPoll;
        if (allowLegacyPoll) {
            log.info("QR pairing: legacy polling without pollSecret is ALLOWED (app.qr.allow-legacy-poll=true)");
        }
    }

    public boolean isAllowLegacyPoll() {
        return allowLegacyPoll;
    }

    /** Test/eski chaqiruvlar uchun: tashabbuskor ma'lumotlarisiz. */
    public QrPairingInitResponse createSession(QrPairingInitRequest request) {
        return createSession(request, null, null);
    }

    /**
     * Create a new pending pairing session for Desktop client
     */
    public QrPairingInitResponse createSession(QrPairingInitRequest request, String initIp, String initUserAgent) {
        String sessionId = UUID.randomUUID().toString();
        byte[] challengeBytes = new byte[16];
        secureRandom.nextBytes(challengeBytes);
        String challenge = HexFormat.of().formatHex(challengeBytes);

        byte[] secretBytes = new byte[POLL_SECRET_BYTES];
        secureRandom.nextBytes(secretBytes);
        String pollSecret = Base64.getUrlEncoder().withoutPadding().encodeToString(secretBytes);

        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(TTL_SECONDS);

        SessionEntry entry = SessionEntry.builder()
                .sessionId(sessionId)
                .challenge(challenge)
                .pollSecret(pollSecret)
                .clientType(request.getClientType() != null ? request.getClientType() : "DESKTOP")
                .clientVersion(request.getClientVersion() != null ? request.getClientVersion() : "1.0.0")
                .deviceName(request.getDeviceName() != null ? request.getDeviceName() : "PRAVA Desktop (Windows)")
                .deviceUuid(request.getDeviceUuid())
                .initIp(initIp)
                .initUserAgent(initUserAgent)
                .status(Status.PENDING)
                .createdAt(now)
                .expiresAt(expiresAt)
                .build();

        sessions.put(sessionId, entry);

        String base = (frontendUrl != null && !frontendUrl.isBlank()) ? frontendUrl.replaceAll("/+$", "") : "https://pravaonline.uz";
        // pollSecret QR payload'ga ATAYLAB kiritilmaydi.
        String qrPayload = String.format("%s/auth/pair?sessionId=%s&challenge=%s", base, sessionId, challenge);

        log.info("Initialized QR pairing session {} for device '{}' (TTL: {}s)",
                sessionId, entry.getDeviceName(), TTL_SECONDS);

        return QrPairingInitResponse.builder()
                .sessionId(sessionId)
                .challenge(challenge)
                .qrPayload(qrPayload)
                .expiresIn(TTL_SECONDS)
                .createdAt(now.toEpochMilli())
                .pollSecret(pollSecret)
                .build();
    }

    /**
     * Fetch public session info when scanned by mobile browser
     */
    public QrPairingSessionInfoResponse getSessionInfo(String sessionId, String challenge) {
        SessionEntry entry = sessionId == null ? null : sessions.get(sessionId);
        if (entry == null) {
            return null;
        }

        if (!secretEquals(entry.getChallenge(), challenge)) {
            log.warn("Invalid challenge supplied for session {}", sessionId);
            return null;
        }

        synchronized (this) {
            Instant now = Instant.now();
            boolean isExpired = now.isAfter(entry.getExpiresAt()) || entry.getStatus() == Status.EXPIRED;

            if (isExpired && entry.getStatus() == Status.PENDING) {
                entry.setStatus(Status.EXPIRED);
            }

            // Atomically transition from PENDING to SCANNED
            if (entry.getStatus() == Status.PENDING && !isExpired) {
                entry.setStatus(Status.SCANNED);
                log.info("QR session {} marked as SCANNED", sessionId);
            }

            return QrPairingSessionInfoResponse.builder()
                    .sessionId(sessionId)
                    .deviceName(entry.getDeviceName())
                    .clientType(entry.getClientType())
                    .clientVersion(entry.getClientVersion())
                    .status(entry.getStatus().name())
                    .createdAt(entry.getCreatedAt().toEpochMilli())
                    .expiresAt(entry.getExpiresAt().toEpochMilli())
                    .isExpired(isExpired)
                    .build();
        }
    }

    /**
     * Sessiya tasdiqlanishi mumkinmi (holatni o'zgartirmaydi).
     */
    public synchronized boolean canApprove(String sessionId, String challenge) {
        SessionEntry entry = sessionId == null ? null : sessions.get(sessionId);
        return entry != null
                && secretEquals(entry.getChallenge(), challenge)
                && !Instant.now().isAfter(entry.getExpiresAt())
                && (entry.getStatus() == Status.PENDING || entry.getStatus() == Status.SCANNED);
    }

    /**
     * Authenticated mobile/web user approves the desktop pairing. Tokenlar bu yerda YARATILMAYDI —
     * desktop poll qilganda ({@link #poll}) yaratiladi.
     */
    public synchronized boolean approveSession(String sessionId, String challenge, Long userId, AcceptLanguage language) {
        SessionEntry entry = sessionId == null ? null : sessions.get(sessionId);
        if (entry == null) {
            return false;
        }

        if (!secretEquals(entry.getChallenge(), challenge)) {
            log.warn("Challenge mismatch for session {}", sessionId);
            return false;
        }

        if (Instant.now().isAfter(entry.getExpiresAt()) || entry.getStatus() == Status.EXPIRED) {
            entry.setStatus(Status.EXPIRED);
            log.warn("Attempt to approve expired session {}", sessionId);
            return false;
        }

        if (entry.getStatus() != Status.PENDING && entry.getStatus() != Status.SCANNED) {
            log.warn("Session {} cannot be approved in state {}", sessionId, entry.getStatus());
            return false;
        }

        entry.setStatus(Status.APPROVED);
        entry.setUserId(userId);
        entry.setLanguage(language);

        log.info("QR pairing session {} APPROVED by userId={}", sessionId, userId);
        return true;
    }

    /**
     * User rejects the pairing in browser
     */
    public synchronized boolean rejectSession(String sessionId, String challenge) {
        SessionEntry entry = sessionId == null ? null : sessions.get(sessionId);
        if (entry == null || !secretEquals(entry.getChallenge(), challenge)) {
            return false;
        }
        if (entry.getStatus() == Status.CONSUMED) {
            return false;
        }

        entry.setStatus(Status.REJECTED);
        log.info("QR pairing session {} REJECTED", sessionId);
        return true;
    }

    /**
     * Desktop (yoki QR egasi) sessiyani bekor qiladi — challenge YOKI pollSecret talab qilinadi.
     *
     * @return bekor qilindimi
     */
    public synchronized boolean cancelSession(String sessionId, String challenge, String pollSecret) {
        SessionEntry entry = sessionId == null ? null : sessions.get(sessionId);
        if (entry == null) {
            return false;
        }
        boolean authorized = secretEquals(entry.getChallenge(), challenge)
                || (entry.getPollSecret() != null && secretEquals(entry.getPollSecret(), pollSecret));
        if (!authorized) {
            log.warn("QR pairing cancel rejected for session {}: missing/invalid challenge or pollSecret", sessionId);
            return false;
        }
        if (entry.getStatus() == Status.CONSUMED) {
            return false;
        }
        entry.setStatus(Status.CANCELLED);
        log.info("QR pairing session {} CANCELLED by client", sessionId);
        return true;
    }

    /**
     * Desktop polls current pairing status. APPROVED bo'lsa sessiya atomik ravishda CONSUMED qilinadi
     * va natijada {@code userId} qaytadi — chaqiruvchi tokenlarni yaratadi (bir martalik).
     *
     * @throws PollSecretException pollSecret noto'g'ri, yoki yo'q va legacy poll o'chirilgan
     */
    public synchronized PollOutcome poll(String sessionId, String pollSecret) {
        SessionEntry entry = sessionId == null ? null : sessions.get(sessionId);
        if (entry == null) {
            return PollOutcome.of(Status.EXPIRED);
        }

        verifyPollSecret(entry, pollSecret);

        Instant now = Instant.now();
        if (now.isAfter(entry.getExpiresAt()) && entry.getStatus() != Status.APPROVED && entry.getStatus() != Status.CONSUMED) {
            entry.setStatus(Status.EXPIRED);
        }

        if (entry.getStatus() == Status.APPROVED) {
            // One-time consumption: immediately transition to CONSUMED
            entry.setStatus(Status.CONSUMED);
            log.info("QR pairing CONSUMED by initiator for session {}", sessionId);
            return new PollOutcome(Status.APPROVED, entry.getUserId(), entry.getLanguage(),
                    entry.getDeviceName(), entry.getDeviceUuid(), entry.getInitIp(), entry.getInitUserAgent());
        }

        return PollOutcome.of(entry.getStatus());
    }

    private void verifyPollSecret(SessionEntry entry, String provided) {
        if (entry.getPollSecret() == null) {
            return; // secret'siz yaratilgan sessiya (bo'lmasligi kerak)
        }
        if (provided == null || provided.isBlank()) {
            if (allowLegacyPoll) {
                log.debug("QR session {} polled without pollSecret (legacy client)", entry.getSessionId());
                return;
            }
            throw new PollSecretException("pollSecret required");
        }
        if (!secretEquals(entry.getPollSecret(), provided.trim())) {
            log.warn("Invalid pollSecret supplied for QR session {}", entry.getSessionId());
            throw new PollSecretException("pollSecret invalid");
        }
    }

    private static boolean secretEquals(String expected, String actual) {
        if (expected == null || actual == null) return false;
        return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), actual.getBytes(StandardCharsets.UTF_8));
    }

    /** Test uchun: sessiya yozuvi (faqat o'qish maqsadida). */
    SessionEntry peek(String sessionId) {
        return sessions.get(sessionId);
    }

    /**
     * Periodic cleanup of expired and consumed sessions every 30 seconds
     */
    @Scheduled(fixedRate = 30_000)
    public void cleanExpiredSessions() {
        Instant now = Instant.now();
        int before = sessions.size();

        sessions.entrySet().removeIf(e -> {
            SessionEntry s = e.getValue();
            if (s.getStatus() == Status.CONSUMED || s.getStatus() == Status.CANCELLED || s.getStatus() == Status.REJECTED) {
                return now.isAfter(s.getCreatedAt().plusSeconds(RETENTION_SECONDS));
            }
            return now.isAfter(s.getExpiresAt().plusSeconds(RETENTION_SECONDS));
        });

        int removed = before - sessions.size();
        if (removed > 0) {
            log.debug("Cleaned {} expired/consumed QR pairing sessions", removed);
        }
    }
}
