package uz.pravaimtihon.octagon.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * OWASP CWE-598 Mitigation:
 * Generates and validates single-use 30-second tickets for WebSocket authentication,
 * preventing long-lived JWT leakage in WebSocket handshake URLs.
 */
@Service
@Slf4j
public class OctagonTicketService {

    private static final int TICKET_TTL_SECONDS = 30;

    private static class TicketData {
        final String userId;
        final String displayName;
        final Instant expiresAt;

        TicketData(String userId, String displayName, Instant expiresAt) {
            this.userId = userId;
            this.displayName = displayName;
            this.expiresAt = expiresAt;
        }
    }

    private final Map<String, TicketData> inMemoryTicketStore = new ConcurrentHashMap<>();

    /**
     * Generate a new single-use 30-second ticket for the given user.
     */
    public String createTicket(String userId, String displayName) {
        String ticket = UUID.randomUUID().toString().replace("-", "") + Long.toHexString(System.nanoTime());
        Instant expiresAt = Instant.now().plusSeconds(TICKET_TTL_SECONDS);

        // Store ticket
        inMemoryTicketStore.put(ticket, new TicketData(userId, displayName, expiresAt));
        log.debug("Created Octagon one-time ticket for userId={}, expires in {}s", userId, TICKET_TTL_SECONDS);

        // Periodic cleanup
        cleanupExpiredTickets();

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

        if (Instant.now().isAfter(data.expiresAt)) {
            log.warn("Attempt to consume expired Octagon ticket for userId={}", data.userId);
            return null;
        }

        return data;
    }

    public String consumeTicketAndGetUserId(String ticket) {
        TicketData td = consumeTicket(ticket);
        return td != null ? td.userId : null;
    }

    private void cleanupExpiredTickets() {
        if (inMemoryTicketStore.size() > 100) {
            Instant now = Instant.now();
            inMemoryTicketStore.entrySet().removeIf(entry -> now.isAfter(entry.getValue().expiresAt));
        }
    }
}
