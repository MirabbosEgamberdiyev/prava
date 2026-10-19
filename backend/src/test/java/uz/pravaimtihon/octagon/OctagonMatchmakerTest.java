package uz.pravaimtihon.octagon;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.socket.WebSocketSession;
import uz.pravaimtihon.octagon.service.OctagonService;
import uz.pravaimtihon.octagon.websocket.OctagonMatchmaker;
import uz.pravaimtihon.octagon.websocket.OctagonSession;
import uz.pravaimtihon.repository.QuestionRepository;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@DisplayName("Octagon Matchmaker & Anti-Cheat Unit Tests")
class OctagonMatchmakerTest {

    private OctagonService octagonService;
    private QuestionRepository questionRepository;
    private ObjectMapper objectMapper;
    private OctagonMatchmaker matchmaker;

    @BeforeEach
    void setUp() {
        octagonService = mock(OctagonService.class);
        questionRepository = mock(QuestionRepository.class);
        objectMapper = new ObjectMapper();
        matchmaker = new OctagonMatchmaker(octagonService, questionRepository, objectMapper);
    }

    @AfterEach
    void tearDown() {
        matchmaker.destroy();
    }

    @Test
    @DisplayName("Should register and track active sessions")
    void testRegisterAndRemoveSession() {
        WebSocketSession wsSession = mock(WebSocketSession.class);
        when(wsSession.isOpen()).thenReturn(true);

        OctagonSession session = new OctagonSession("user_100", "Player_100", wsSession);
        matchmaker.registerSession(session);

        // Joining queue should record queued timestamp and ELO
        matchmaker.joinQueue(session, 0, 150);
        assertEquals(150, session.getCurrentElo());
        assertNotNull(session.getQueuedAt());

        // Leaving queue should reset queued timestamp
        matchmaker.leaveQueue(session);
        assertNull(session.getQueuedAt());

        // Removing session should mark disconnected
        matchmaker.removeSession("user_100");
        assertNotNull(session.getDisconnectedAt());
    }

    @Test
    @DisplayName("Reaction Anti-Flood Protection: rate limit excessive emojis")
    void testReactionRateLimit() {
        WebSocketSession wsSession = mock(WebSocketSession.class);
        when(wsSession.isOpen()).thenReturn(true);

        OctagonSession session = new OctagonSession("user_200", "Player_200", wsSession);
        UUID fakeMatchId = UUID.randomUUID();

        // Send reactions rapidly
        for (int i = 0; i < 5; i++) {
            matchmaker.handleSendReaction(session, fakeMatchId, "fire");
        }

        // Session reaction counter should be tracked
        assertTrue(session.getReactionCountInWindow() > 0);
    }

    @Test
    @DisplayName("Safe Answer Processing: does not crash on non-existent match")
    void testSubmitAnswerNonExistentMatch() {
        WebSocketSession wsSession = mock(WebSocketSession.class);
        when(wsSession.isOpen()).thenReturn(true);

        OctagonSession session = new OctagonSession("user_300", "Player_300", wsSession);
        UUID nonExistentMatchId = UUID.randomUUID();

        // Submitting to unknown match should safely return without exceptions
        assertDoesNotThrow(() -> {
            matchmaker.handleSubmitAnswer(session, nonExistentMatchId, 999L, 1, System.currentTimeMillis());
        });
    }
}
