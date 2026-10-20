package uz.pravaimtihon.octagon.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import uz.pravaimtihon.entity.Question;
import uz.pravaimtihon.octagon.entity.OctagonMatch;
import uz.pravaimtihon.octagon.entity.OctagonProfile;
import uz.pravaimtihon.octagon.enums.OctagonRank;
import uz.pravaimtihon.octagon.service.OctagonService;
import uz.pravaimtihon.repository.QuestionRepository;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.stream.LongStream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Regression tests for the Octagon defects found in the 2026-10-20 audit
 * (client-trusted ELO, unvalidated answers, double finalisation, reconnect race, rematch spam, room codes).
 */
@DisplayName("Octagon match integrity & security (audit 2026-10-20)")
class OctagonMatchSecurityTest {

    private static final List<Long> QIDS = LongStream.rangeClosed(101, 110).boxed().toList();

    private OctagonService octagonService;
    private QuestionRepository questionRepository;
    private OctagonMatchmaker matchmaker;
    private final ObjectMapper om = new ObjectMapper();

    @BeforeEach
    void setUp() {
        octagonService = mock(OctagonService.class);
        questionRepository = mock(QuestionRepository.class);
        matchmaker = new OctagonMatchmaker(octagonService, questionRepository, om);

        when(octagonService.getRandomQuestionIds(anyInt())).thenReturn(QIDS);
        when(octagonService.getQuestionsByIds(anyList())).thenReturn(List.of());
        when(octagonService.resolveDisplayName(anyString())).thenReturn("X");
        List<Question> qs = new ArrayList<>();
        for (Long id : QIDS) {
            Question q = new Question();
            q.setId(id);
            q.setCorrectAnswerIndex(2);
            qs.add(q);
        }
        when(questionRepository.findAllById(anyIterable())).thenReturn(qs);
        when(octagonService.recordMatchResult(any(), anyString(), anyString(), anyInt(), anyInt(), anyList(), anyInt(), any(), any()))
                .thenAnswer(inv -> OctagonMatch.builder().id(inv.getArgument(0)).winnerId(inv.getArgument(1))
                        .isDraw(false).p1EloChange(15).p2EloChange(-15).build());
    }

    @AfterEach
    void tearDown() {
        matchmaker.destroy();
    }

    private static WebSocketSession ws() {
        WebSocketSession ws = mock(WebSocketSession.class);
        when(ws.isOpen()).thenReturn(true);
        return ws;
    }

    private void profile(String userId, int elo) {
        when(octagonService.getProfileSnapshot(userId)).thenReturn(OctagonProfile.builder()
                .userId(userId).eloRating(elo).rank(OctagonRank.fromElo(elo)).build());
    }

    private List<JsonNode> events(WebSocketSession ws, String event) throws Exception {
        ArgumentCaptor<TextMessage> cap = ArgumentCaptor.forClass(TextMessage.class);
        verify(ws, atLeast(0)).sendMessage(cap.capture());
        List<JsonNode> out = new ArrayList<>();
        for (TextMessage m : cap.getAllValues()) {
            JsonNode n = om.readTree(m.getPayload());
            if (event.equals(n.get("event").asText())) out.add(n.get("data"));
        }
        return out;
    }

    /** Navbat orqali ikki o'yinchi jangini yaratadi va uni "boshlangan" holatga keltiradi. */
    private ActiveMatch startedMatch(OctagonSession a, OctagonSession b, WebSocketSession wsA) throws Exception {
        matchmaker.registerSession(a);
        matchmaker.registerSession(b);
        matchmaker.joinQueue(a, 0, 0);
        matchmaker.joinQueue(b, 0, 0);
        matchmaker.matchmakingTick();
        String id = events(wsA, "match_found").get(0).get("matchId").asText();
        ActiveMatch m = matchmaker.findActiveMatch(UUID.fromString(id)).orElseThrow();
        m.setStartedAt(Instant.now());
        m.setDeadlineAt(Instant.now().plusSeconds(300));
        return m;
    }

    @Test
    @DisplayName("Matchmaking uses server ELO; client-sent currentElo is ignored and opponent sees real ELO")
    void clientEloIgnored() throws Exception {
        profile("1", 40);
        profile("2", 60);
        WebSocketSession wsA = ws(), wsB = ws();
        OctagonSession a = new OctagonSession("1", "A", wsA);
        OctagonSession b = new OctagonSession("2", "B", wsB);
        matchmaker.registerSession(a);
        matchmaker.registerSession(b);
        matchmaker.joinQueue(a, 0, 9999);
        matchmaker.joinQueue(b, 0, -500);
        assertEquals(40, a.getCurrentElo());
        assertEquals(60, b.getCurrentElo());

        matchmaker.matchmakingTick();
        JsonNode found = events(wsB, "match_found").get(0);
        assertEquals(40, found.get("opponent").get("score").asInt(), "opponent card must show server ELO");
    }

    @Test
    @DisplayName("Answers are rejected before start, for foreign questions, and on duplicates")
    void answerValidation() throws Exception {
        WebSocketSession wsA = ws(), wsB = ws();
        OctagonSession a = new OctagonSession("1", "A", wsA);
        OctagonSession b = new OctagonSession("2", "B", wsB);
        ActiveMatch m = startedMatch(a, b, wsA);

        // foreign question id (not in this match) — previously counted towards "finished"
        matchmaker.handleSubmitAnswer(a, m.getMatchId(), 999_999L, 2, 0);
        assertEquals(0, m.getPlayer1Answers().size());

        matchmaker.handleSubmitAnswer(a, m.getMatchId(), 101L, 2, 0);
        matchmaker.handleSubmitAnswer(a, m.getMatchId(), 101L, 2, 0); // duplicate
        assertEquals(1, m.getPlayer1Answers().size());
        assertEquals(1, m.getPlayer1Score());

        // the player gets their own verdict, but never the correct option index
        JsonNode res = events(wsA, "answer_result").get(0);
        assertTrue(res.get("isCorrect").asBoolean());
        assertFalse(res.has("correctIndex"));

        // a non-participant cannot submit into somebody else's match
        OctagonSession intruder = new OctagonSession("3", "C", ws());
        matchmaker.handleSubmitAnswer(intruder, m.getMatchId(), 102L, 2, 0);
        assertEquals(0, m.getPlayer2Answers().size());

        // before match_started answers are not accepted
        m.setStartedAt(null);
        matchmaker.handleSubmitAnswer(b, m.getMatchId(), 102L, 2, 0);
        assertEquals(0, m.getPlayer2Answers().size());
    }

    @Test
    @DisplayName("Concurrent finish + timeout records the match exactly once")
    void finalizeExactlyOnce() throws Exception {
        WebSocketSession wsA = ws(), wsB = ws();
        OctagonSession a = new OctagonSession("1", "A", wsA);
        OctagonSession b = new OctagonSession("2", "B", wsB);
        ActiveMatch m = startedMatch(a, b, wsA);
        for (Long q : QIDS) {
            m.recordAnswer("1", q, 2, Instant.now());
            m.recordAnswer("2", q, 1, Instant.now());
        }
        m.setDeadlineAt(Instant.now().minusSeconds(1)); // timeout tick will also try to finalise

        ExecutorService pool = Executors.newFixedThreadPool(8);
        CountDownLatch go = new CountDownLatch(1);
        for (int i = 0; i < 8; i++) {
            final int k = i;
            pool.submit(() -> {
                go.await();
                if (k % 2 == 0) matchmaker.cleanupAndTimeoutTick();
                else matchmaker.handleSubmitAnswer(a, m.getMatchId(), 101L, 2, 0);
                return null;
            });
        }
        go.countDown();
        pool.shutdown();
        assertTrue(pool.awaitTermination(10, TimeUnit.SECONDS));

        verify(octagonService, times(1)).recordMatchResult(any(), anyString(), anyString(), anyInt(), anyInt(), anyList(), anyInt(), any(), any());
        assertEquals(1, events(wsA, "match_ended").size());
    }

    @Test
    @DisplayName("Closing the OLD socket after a reconnect does not drop the new session")
    void reconnectRace() throws Exception {
        WebSocketSession wsOld = ws(), wsNew = ws(), wsB = ws();
        OctagonSession oldS = new OctagonSession("1", "A", wsOld);
        OctagonSession b = new OctagonSession("2", "B", wsB);
        ActiveMatch m = startedMatch(oldS, b, wsOld);

        OctagonSession newS = new OctagonSession("1", "A", wsNew);
        matchmaker.registerSession(newS);          // reconnect arrives first
        matchmaker.removeSession(oldS);            // then the stale socket closes

        assertTrue(matchmaker.isUserOnline("1"));
        assertSame(newS, m.getP1Session());
        JsonNode state = events(wsNew, "game_reconnect").get(0);
        assertEquals(m.getMatchId().toString(), state.get("matchId").asText());
        assertEquals(10, state.get("questionIds").size(), "reconnect must carry the question set");

        // grace-period check must not forfeit a player who is back online
        oldS.setDisconnectedAt(Instant.now().minusSeconds(120));
        matchmaker.cleanupAndTimeoutTick();
        assertFalse(m.isEnded());
    }

    @Test
    @DisplayName("Abandoning player loses by forfeit after the grace period")
    void forfeit() throws Exception {
        WebSocketSession wsA = ws(), wsB = ws();
        OctagonSession a = new OctagonSession("1", "A", wsA);
        OctagonSession b = new OctagonSession("2", "B", wsB);
        ActiveMatch m = startedMatch(a, b, wsA);
        matchmaker.removeSession(a);
        a.setDisconnectedAt(Instant.now().minusSeconds(60));
        matchmaker.cleanupAndTimeoutTick();
        assertTrue(m.isEnded());
        verify(octagonService).recordMatchResult(eq(m.getMatchId()), eq("1"), eq("2"), anyInt(), anyInt(), anyList(), anyInt(), any(), eq("1"));
    }

    @Test
    @DisplayName("Rematch: only after the match ended, only once, only by participants")
    void rematchOnce() throws Exception {
        WebSocketSession wsA = ws(), wsB = ws();
        OctagonSession a = new OctagonSession("1", "A", wsA);
        OctagonSession b = new OctagonSession("2", "B", wsB);
        ActiveMatch m = startedMatch(a, b, wsA);

        matchmaker.handleRequestRevenge(a, m.getMatchId());
        matchmaker.handleRequestRevenge(b, m.getMatchId());
        assertEquals(1, events(wsA, "match_found").size(), "no rematch while the match is still running");

        for (Long q : QIDS) {
            matchmaker.handleSubmitAnswer(a, m.getMatchId(), q, 2, 0);
            matchmaker.handleSubmitAnswer(b, m.getMatchId(), q, 1, 0);
        }
        assertTrue(m.isEnded(), "last answer of both players finalises the match");

        OctagonSession intruder = new OctagonSession("3", "C", ws());
        matchmaker.handleRequestRevenge(intruder, m.getMatchId());
        for (int i = 0; i < 5; i++) {
            matchmaker.handleRequestRevenge(a, m.getMatchId());
            matchmaker.handleRequestRevenge(b, m.getMatchId());
        }
        assertEquals(2, events(wsA, "match_found").size(), "exactly one rematch");
    }

    @Test
    @DisplayName("Questions REST guard only allows question sets of live games")
    void questionGuard() throws Exception {
        WebSocketSession wsA = ws(), wsB = ws();
        startedMatch(new OctagonSession("1", "A", wsA), new OctagonSession("2", "B", wsB), wsA);
        assertTrue(matchmaker.areQuestionsInActiveGame(List.of(101L, 105L)));
        assertFalse(matchmaker.areQuestionsInActiveGame(List.of(101L, 5000L)));
        assertFalse(matchmaker.areQuestionsInActiveGame(List.of()));
    }

    @Test
    @DisplayName("Challenges can only be accepted by their target")
    void challengeAcceptOnlyByTarget() throws Exception {
        WebSocketSession wsA = ws(), wsB = ws(), wsC = ws();
        OctagonSession a = new OctagonSession("1", "A", wsA);
        OctagonSession b = new OctagonSession("2", "B", wsB);
        OctagonSession c = new OctagonSession("3", "C", wsC);
        matchmaker.registerSession(a);
        matchmaker.registerSession(b);
        matchmaker.registerSession(c);
        matchmaker.handleSendChallenge(a, "2");
        UUID id = UUID.fromString(events(wsB, "challenge_received").get(0).get("challengeId").asText());

        matchmaker.handleAcceptChallenge(c, id);
        assertTrue(events(wsC, "match_found").isEmpty());
        matchmaker.handleAcceptChallenge(b, id);
        assertEquals(1, events(wsB, "match_found").size());
    }

    @Test
    @DisplayName("Challenge spam is rate limited")
    void challengeRateLimit() throws Exception {
        WebSocketSession wsA = ws();
        OctagonSession a = new OctagonSession("1", "A", wsA);
        matchmaker.registerSession(a);
        for (int i = 0; i < 20; i++) matchmaker.handleSendChallenge(a, "offline_" + i);
        long limited = events(wsA, "challenge_error").stream().filter(e -> "RATE_LIMITED".equals(e.get("code").asText())).count();
        assertEquals(15, limited);
    }

    @Test
    @DisplayName("Room game cannot be restarted while it is running; room codes are high-entropy")
    void roomRestartBlocked() throws Exception {
        WebSocketSession wsA = ws(), wsB = ws();
        OctagonSession host = new OctagonSession("1", "A", wsA);
        OctagonSession g = new OctagonSession("2", "B", wsB);
        matchmaker.registerSession(host);
        matchmaker.registerSession(g);
        matchmaker.handleCreateRoom(host, 4, false);
        String code = matchmaker.getUserRoomCode("1");
        assertTrue(code.matches("OCT-[A-Z2-9]{6}"));
        matchmaker.handleJoinRoom(g, code);

        matchmaker.handleStartRoomGame(host);
        matchmaker.handleStartRoomGame(host);
        matchmaker.handleStartRoomGame(host);
        verify(octagonService, times(1)).getRandomQuestionIds(anyInt());
    }

    @Test
    @DisplayName("Room code brute force is throttled")
    void roomBruteForce() throws Exception {
        WebSocketSession wsA = ws();
        OctagonSession a = new OctagonSession("1", "A", wsA);
        matchmaker.registerSession(a);
        for (int i = 0; i < 15; i++) matchmaker.handleJoinRoom(a, "OCT-" + (1000 + i));
        assertEquals(10, events(wsA, "room_error").stream().filter(e -> "ROOM_NOT_FOUND".equals(e.get("code").asText())).count());
        assertEquals(5, events(wsA, "room_error").stream().filter(e -> "RATE_LIMITED".equals(e.get("code").asText())).count());
    }

    @Test
    @DisplayName("No fake question IDs: empty question bank aborts the match with match_error")
    void noFakeQuestions() throws Exception {
        when(octagonService.getRandomQuestionIds(anyInt())).thenReturn(List.of());
        WebSocketSession wsA = ws(), wsB = ws();
        OctagonSession a = new OctagonSession("1", "A", wsA);
        OctagonSession b = new OctagonSession("2", "B", wsB);
        matchmaker.registerSession(a);
        matchmaker.registerSession(b);
        matchmaker.joinQueue(a, 0, 0);
        matchmaker.joinQueue(b, 0, 0);
        matchmaker.matchmakingTick();
        assertTrue(events(wsA, "match_found").isEmpty());
        assertEquals(1, events(wsA, "match_error").size());
    }
}
