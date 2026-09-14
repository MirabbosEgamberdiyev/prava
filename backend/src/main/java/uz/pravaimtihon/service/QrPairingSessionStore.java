package uz.pravaimtihon.service;

import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import uz.pravaimtihon.dto.qr.*;
import uz.pravaimtihon.dto.response.AuthResponse;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * High-performance, cryptographically secure thread-safe in-memory store
 * for QR device pairing sessions with atomic lifecycle transitions.
 */
@Service
@Slf4j
public class QrPairingSessionStore {

    public static final long TTL_SECONDS = 90;
    private static final long RETENTION_SECONDS = 180;

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
        private String clientType;
        private String clientVersion;
        private String deviceName;
        private String deviceUuid;
        private Status status;
        private Instant createdAt;
        private Instant expiresAt;
        private Long userId;
        private AuthResponse authResponse;
    }

    private final Map<String, SessionEntry> sessions = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.frontend.url:https://pravaonline.uz}")
    private String frontendUrl;

    /**
     * Create a new pending pairing session for Desktop client
     */
    public QrPairingInitResponse createSession(QrPairingInitRequest request) {
        String sessionId = UUID.randomUUID().toString();
        byte[] challengeBytes = new byte[16];
        secureRandom.nextBytes(challengeBytes);
        String challenge = HexFormat.of().formatHex(challengeBytes);

        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(TTL_SECONDS);

        SessionEntry entry = SessionEntry.builder()
                .sessionId(sessionId)
                .challenge(challenge)
                .clientType(request.getClientType() != null ? request.getClientType() : "DESKTOP")
                .clientVersion(request.getClientVersion() != null ? request.getClientVersion() : "1.0.0")
                .deviceName(request.getDeviceName() != null ? request.getDeviceName() : "PRAVA Desktop (Windows)")
                .deviceUuid(request.getDeviceUuid())
                .status(Status.PENDING)
                .createdAt(now)
                .expiresAt(expiresAt)
                .build();

        sessions.put(sessionId, entry);

        String base = (frontendUrl != null && !frontendUrl.isBlank()) ? frontendUrl.replaceAll("/+$", "") : "https://pravaonline.uz";
        String qrPayload = String.format("%s/auth/pair?sessionId=%s&challenge=%s", base, sessionId, challenge);

        log.info("Initialized QR pairing session {} for device '{}' (TTL: {}s)",
                sessionId, entry.getDeviceName(), TTL_SECONDS);

        return QrPairingInitResponse.builder()
                .sessionId(sessionId)
                .challenge(challenge)
                .qrPayload(qrPayload)
                .expiresIn(TTL_SECONDS)
                .createdAt(now.toEpochMilli())
                .build();
    }

    /**
     * Fetch public session info when scanned by mobile browser
     */
    public QrPairingSessionInfoResponse getSessionInfo(String sessionId, String challenge) {
        SessionEntry entry = sessions.get(sessionId);
        if (entry == null) {
            return null;
        }

        if (!isChallengeValid(entry.getChallenge(), challenge)) {
            log.warn("Invalid challenge supplied for session {}", sessionId);
            return null;
        }

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

    /**
     * Authenticated mobile/web user approves the desktop pairing
     */
    public synchronized boolean approveSession(String sessionId, String challenge, Long userId, AuthResponse authResponse) {
        SessionEntry entry = sessions.get(sessionId);
        if (entry == null) {
            return false;
        }

        if (!isChallengeValid(entry.getChallenge(), challenge)) {
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
        entry.setAuthResponse(authResponse);

        log.info("QR pairing session {} APPROVED by userId={}", sessionId, userId);
        return true;
    }

    /**
     * User rejects the pairing in browser
     */
    public synchronized boolean rejectSession(String sessionId, String challenge) {
        SessionEntry entry = sessions.get(sessionId);
        if (entry == null || !isChallengeValid(entry.getChallenge(), challenge)) {
            return false;
        }

        entry.setStatus(Status.REJECTED);
        log.info("QR pairing session {} REJECTED", sessionId);
        return true;
    }

    /**
     * Desktop cancels the active session
     */
    public void cancelSession(String sessionId) {
        SessionEntry entry = sessions.get(sessionId);
        if (entry != null) {
            entry.setStatus(Status.CANCELLED);
            log.info("QR pairing session {} CANCELLED by client", sessionId);
        }
    }

    /**
     * Desktop polls current pairing status
     */
    public synchronized QrPairingStatusResponse pollStatus(String sessionId) {
        SessionEntry entry = sessions.get(sessionId);
        if (entry == null) {
            return QrPairingStatusResponse.builder()
                    .status(Status.EXPIRED.name())
                    .build();
        }

        Instant now = Instant.now();
        if (now.isAfter(entry.getExpiresAt()) && entry.getStatus() != Status.APPROVED && entry.getStatus() != Status.CONSUMED) {
            entry.setStatus(Status.EXPIRED);
        }

        if (entry.getStatus() == Status.APPROVED) {
            // One-time consumption: tokens handed off, immediately transition to CONSUMED
            AuthResponse auth = entry.getAuthResponse();
            entry.setStatus(Status.CONSUMED);
            entry.setAuthResponse(null); // Clear tokens from memory for security

            log.info("QR pairing tokens CONSUMED by Desktop for session {}", sessionId);

            return QrPairingStatusResponse.builder()
                    .status("APPROVED")
                    .accessToken(auth.getAccessToken())
                    .refreshToken(auth.getRefreshToken())
                    .expiresIn(auth.getExpiresIn())
                    .user(auth.getUser())
                    .build();
        }

        return QrPairingStatusResponse.builder()
                .status(entry.getStatus().name())
                .build();
    }

    private boolean isChallengeValid(String expected, String actual) {
        if (expected == null || actual == null) return false;
        return MessageDigest.isEqual(expected.getBytes(), actual.getBytes());
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
