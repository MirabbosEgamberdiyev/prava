package uz.pravaimtihon.octagon.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * OWASP CWE-598 Mitigation:
 * Generates and validates single-use 30-second tickets for WebSocket authentication,
 * preventing long-lived JWT leakage in WebSocket handshake URLs.
 */
@Service
@Slf4j
public class OctagonTicketService {

    public static final int TICKET_TTL_SECONDS = 30;
    private static final SecureRandom RANDOM = new SecureRandom();

    /** Ticket bilan bog'langan identifikatsiya (userId + ko'rsatiladigan ism). */
    public record TicketData(String userId, String displayName, Instant expiresAt) {}

    private final Map<String, TicketData> inMemoryTicketStore = new ConcurrentHashMap<>();

    /**
     * Generate a new single-use 30-second ticket for the given user.
     */
    public String createTicket(String userId, String displayName) {
        byte[] raw = new byte[24];
        RANDOM.nextBytes(raw);
        String ticket = HexFormat.of().formatHex(raw);
        Instant expiresAt = Instant.now().plusSeconds(TICKET_TTL_SECONDS);

        cleanupExpiredTickets();
        inMemoryTicketStore.put(ticket, new TicketData(userId, displayName, expiresAt));
        log.debug("Created Octagon one-time ticket for userId={}, expires in {}s", userId, TICKET_TTL_SECONDS);
        return ticket;
    }

    /**
     * Validate and consume (GETDEL) the single-use ticket.
     * Returns the associated TicketData if valid, or null if expired/invalid.
     */
    public TicketData consumeTicket(String ticket) {
        if (ticket == null || ticket.isBlank()) {
            return null;
        }

        TicketData data = inMemoryTicketStore.remove(ticket);
        if (data == null) {
            log.warn("Attempt to consume unknown or already used Octagon ticket");
            return null;
        }

        if (Instant.now().isAfter(data.expiresAt())) {
            log.warn("Attempt to consume expired Octagon ticket for userId={}", data.userId());
            return null;
        }

        return data;
    }

    public String consumeTicketAndGetUserId(String ticket) {
        TicketData td = consumeTicket(ticket);
        return td != null ? td.userId() : null;
    }

    private void cleanupExpiredTickets() {
        if (inMemoryTicketStore.size() > 100) {
            Instant now = Instant.now();
            inMemoryTicketStore.entrySet().removeIf(entry -> now.isAfter(entry.getValue().expiresAt()));
        }
    }
}
