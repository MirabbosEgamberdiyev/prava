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
        matchmaker = new OctagonMatchmaker(octagonService, questionRepository, objectMapper, new uz.pravaimtihon.octagon.service.OctagonCodeGuard());
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

        // Joining queue records queued timestamp; ELO comes from the server profile, NOT the client (150 is ignored)
        matchmaker.joinQueue(session, 0, 150);
        assertEquals(0, session.getCurrentElo());
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

    @Test
    @DisplayName("User Status & Online Tracking")
    void testUserStatusTracking() {
        WebSocketSession wsSession = mock(WebSocketSession.class);
        when(wsSession.isOpen()).thenReturn(true);

        OctagonSession session = new OctagonSession("user_400", "Player_400", wsSession);
        matchmaker.registerSession(session);

        assertTrue(matchmaker.isUserOnline("user_400"));
        assertEquals("AVAILABLE", matchmaker.getUserStatus("user_400"));

        matchmaker.joinQueue(session, 0, 100);
        assertEquals("IN_QUEUE", matchmaker.getUserStatus("user_400"));

        matchmaker.leaveQueue(session);
        assertEquals("AVAILABLE", matchmaker.getUserStatus("user_400"));

        matchmaker.removeSession("user_400");
        assertFalse(matchmaker.isUserOnline("user_400"));
        assertEquals("OFFLINE", matchmaker.getUserStatus("user_400"));
    }

    @Test
    @DisplayName("Group Room Flow: Create, Join, Ready, Leave")
    void testGroupRoomFlow() {
        WebSocketSession ws1 = mock(WebSocketSession.class);
        when(ws1.isOpen()).thenReturn(true);
        WebSocketSession ws2 = mock(WebSocketSession.class);
        when(ws2.isOpen()).thenReturn(true);

        OctagonSession host = new OctagonSession("host_1", "Host User", ws1);
        OctagonSession guest = new OctagonSession("guest_2", "Guest User", ws2);

        uz.pravaimtihon.octagon.entity.OctagonProfile mockProfile = uz.pravaimtihon.octagon.entity.OctagonProfile.builder()
                .userId("host_1")
                .eloRating(200)
                .rank(uz.pravaimtihon.octagon.enums.OctagonRank.SILVER)
                .build();
        when(octagonService.getOrCreateProfile(anyString())).thenReturn(mockProfile);
        when(octagonService.resolveDisplayName(anyString())).thenReturn("Test User");

        matchmaker.registerSession(host);
        matchmaker.registerSession(guest);

        // Host creates room
        matchmaker.handleCreateRoom(host, 4, false);
        assertEquals("IN_ROOM", matchmaker.getUserStatus("host_1"));

        // Retrieve room
        String roomCode = matchmaker.getUserRoomCode("host_1");
        assertNotNull(roomCode);
        assertTrue(roomCode.matches("[1-9][0-9]{3}"), roomCode);

        // Guest joins room
        matchmaker.handleJoinRoom(guest, roomCode);
        assertEquals("IN_ROOM", matchmaker.getUserStatus("guest_2"));

        var roomDto = matchmaker.getRoomDto(roomCode).orElseThrow();
        assertEquals(2, roomDto.getMembers().size());

        // Guest toggles ready
        matchmaker.handleToggleReady(guest, true);
        var updatedRoom = matchmaker.getRoomDto(roomCode).orElseThrow();
        assertTrue(updatedRoom.getMembers().stream().anyMatch(m -> m.getUserId().equals("guest_2") && m.isReady()));

        // Guest leaves room
        matchmaker.handleLeaveRoom(guest);
        assertEquals("AVAILABLE", matchmaker.getUserStatus("guest_2"));
        assertEquals(1, matchmaker.getRoomDto(roomCode).orElseThrow().getMembers().size());
    }
}
