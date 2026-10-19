package uz.pravaimtihon.octagon;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import uz.pravaimtihon.octagon.service.OctagonTicketService;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Octagon Ticket Service (OWASP CWE-598 Anti-Leak) Unit Tests")
class OctagonTicketServiceTest {

    private OctagonTicketService ticketService;

    @BeforeEach
    void setUp() {
        ticketService = new OctagonTicketService();
    }

    @Test
    @DisplayName("Should generate a unique, non-empty single-use ticket")
    void testCreateTicket() {
        String ticket = ticketService.createTicket("user_123", "Shaxzod");
        assertNotNull(ticket);
        assertFalse(ticket.isBlank());
        assertTrue(ticket.length() >= 32);
    }

    @Test
    @DisplayName("Should consume ticket once and reject second attempt (single-use guarantee)")
    void testSingleUseConsumption() {
        String ticket = ticketService.createTicket("user_456", "Farhod");

        String userId = ticketService.consumeTicketAndGetUserId(ticket);
        assertEquals("user_456", userId);

        // Second consume attempt MUST return null
        String secondAttempt = ticketService.consumeTicketAndGetUserId(ticket);
        assertNull(secondAttempt, "Ticket must not be reusable after consumption");
    }

    @Test
    @DisplayName("Should return null for null, blank, or invalid tickets")
    void testInvalidTickets() {
        assertNull(ticketService.consumeTicket(null));
        assertNull(ticketService.consumeTicket(""));
        assertNull(ticketService.consumeTicket("   "));
        assertNull(ticketService.consumeTicket("non_existent_ticket_123456789"));
        assertNull(ticketService.consumeTicketAndGetUserId("invalid_xyz"));
    }
}
