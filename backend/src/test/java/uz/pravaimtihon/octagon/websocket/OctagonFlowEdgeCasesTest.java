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
import uz.pravaimtihon.octagon.enums.OctagonGameType;
import uz.pravaimtihon.octagon.enums.OctagonRank;
import uz.pravaimtihon.octagon.service.OctagonCodeGuard;
import uz.pravaimtihon.octagon.service.OctagonService;
import uz.pravaimtihon.repository.QuestionRepository;

import java.time.Instant;
import java.util.*;
import java.util.stream.LongStream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Oktagon dizayn tizimi bosqichi (2026-10-22): bekor qilish poygasi, o'z ixtiyori bilan tark etish,
 * revansh holatlari, radar uchun ishonchli navbat ma'lumoti va natija ekranidagi vaqt.
 */
@DisplayName("Octagon flows: cancel race, forfeit, rematch availability, radar data, time spent")
class OctagonFlowEdgeCasesTest {

    private static final List<Long> QIDS = LongStream.rangeClosed(101, 110).boxed().toList();

    private OctagonService octagonService;
    private OctagonMatchmaker matchmaker;
    private final ObjectMapper om = new ObjectMapper();

    @BeforeEach
    void setUp() {
        octagonService = mock(OctagonService.class);
        QuestionRepository questionRepository = mock(QuestionRepository.class);
        matchmaker = new OctagonMatchmaker(octagonService, questionRepository, om, new OctagonCodeGuard());
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
        for (String id : List.of("1", "2", "3")) {
            when(octagonService.getProfileSnapshot(id)).thenReturn(OctagonProfile.builder()
                    .userId(id).eloRating(100).rank(OctagonRank.fromElo(100)).build());
        }
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

    /** Navbat orqali juftlangan (hali boshlanmagan) jang. */
    private ActiveMatch queuedMatch(OctagonSession a, OctagonSession b, WebSocketSession wsA) throws Exception {
        matchmaker.registerSession(a);
        matchmaker.registerSession(b);
        matchmaker.joinQueue(a, 0, 0);
        matchmaker.joinQueue(b, 0, 0);
        matchmaker.matchmakingTick();
        String id = events(wsA, "match_found").get(0).get("matchId").asText();
        return matchmaker.findActiveMatch(UUID.fromString(id)).orElseThrow();
    }

    @Test
    @DisplayName("Cancel after pairing (before start): match dropped, no ELO, both told, opponent back in the queue")
    void cancelRaceDropsUnstartedQueueMatch() throws Exception {
        WebSocketSession wsA = ws(), wsB = ws();
        OctagonSession a = new OctagonSession("1", "A", wsA);
        OctagonSession b = new OctagonSession("2", "B", wsB);
        ActiveMatch m = queuedMatch(a, b, wsA);
        assertEquals("RANKED_QUEUE", events(wsA, "match_found").get(0).get("gameType").asText());

        matchmaker.cancelSearch(a);

        assertTrue(m.isEnded());
        assertTrue(matchmaker.findActiveMatch(m.getMatchId()).isEmpty());
        JsonNode mine = events(wsA, "match_cancelled").get(0);
        assertEquals("SEARCH_CANCELLED", mine.get("reason").asText());
        assertFalse(mine.get("requeued").asBoolean());
        JsonNode theirs = events(wsB, "match_cancelled").get(0);
        assertEquals("OPPONENT_CANCELLED", theirs.get("reason").asText());
        assertTrue(theirs.get("requeued").asBoolean());
        assertEquals("IN_QUEUE", matchmaker.getUserStatus("2"));
        assertEquals("AVAILABLE", matchmaker.getUserStatus("1"));
        verify(octagonService, never()).recordMatchResult(any(), anyString(), anyString(), anyInt(), anyInt(), anyList(), anyInt(), any(), any());
    }

    @Test
    @DisplayName("Cancel never touches a started match or a friend duel")
    void cancelLeavesStartedAndFriendMatches() throws Exception {
        WebSocketSession wsA = ws(), wsB = ws();
        OctagonSession a = new OctagonSession("1", "A", wsA);
        OctagonSession b = new OctagonSession("2", "B", wsB);
        ActiveMatch started = queuedMatch(a, b, wsA);
        started.setStartedAt(Instant.now());
        matchmaker.cancelSearch(a);
        assertFalse(started.isEnded());
        assertTrue(events(wsB, "match_cancelled").isEmpty());

        WebSocketSession wsC = ws(), wsD = ws();
        OctagonSession c = new OctagonSession("3", "C", wsC);
        OctagonSession d = new OctagonSession("4", "D", wsD);
        matchmaker.registerSession(c);
        matchmaker.registerSession(d);
        matchmaker.createDirectMatch(c, d, OctagonGameType.DUEL_FRIEND);
        matchmaker.cancelSearch(c);
        assertEquals("IN_MATCH", matchmaker.getUserStatus("3"));
        assertTrue(events(wsD, "match_cancelled").isEmpty());
    }

    @Test
    @DisplayName("Forfeit: the leaver loses immediately, the opponent gets a forfeit result without waiting 45 s")
    void forfeitEndsMatchAtOnce() throws Exception {
        WebSocketSession wsA = ws(), wsB = ws();
        OctagonSession a = new OctagonSession("1", "A", wsA);
        OctagonSession b = new OctagonSession("2", "B", wsB);
        ActiveMatch m = queuedMatch(a, b, wsA);
        m.setStartedAt(Instant.now());

        OctagonSession stranger = new OctagonSession("3", "C", ws());
        matchmaker.registerSession(stranger);
        matchmaker.handleForfeit(stranger, m.getMatchId());
        assertFalse(m.isEnded(), "a non-participant cannot end someone else's match");

        matchmaker.handleForfeit(a, m.getMatchId());
        assertTrue(m.isEnded());
        verify(octagonService).recordMatchResult(eq(m.getMatchId()), eq("1"), eq("2"), anyInt(), anyInt(), anyList(), anyInt(), any(), eq("1"));
        JsonNode ended = events(wsB, "match_ended").get(0);
        assertTrue(ended.get("forfeit").asBoolean());
        assertFalse(ended.get("forfeitByMe").asBoolean(), "the opponent did not leave");
        assertEquals("LEFT", ended.get("forfeitReason").asText(), "explicit leave, not a 45 s timeout");
        JsonNode leaverEnded = events(wsA, "match_ended").get(0);
        assertTrue(leaverEnded.get("forfeitByMe").asBoolean(), "the leaver is told it was their own forfeit");
        assertTrue(ended.has("myTimeSec"));
        assertEquals(10, ended.get("review").size(), "review lists every question once the match is over");
    }

    @Test
    @DisplayName("Review (correct answers) is only revealed after the match has ended")
    void reviewOnlyAfterEnd() throws Exception {
        WebSocketSession wsA = ws(), wsB = ws();
        OctagonSession a = new OctagonSession("1", "A", wsA);
        OctagonSession b = new OctagonSession("2", "B", wsB);
        ActiveMatch m = queuedMatch(a, b, wsA);
        m.setStartedAt(Instant.now());
        m.setMinAnswerIntervalMs(0);
        matchmaker.handleSubmitAnswer(a, m.getMatchId(), 101L, 2, 0);
        matchmaker.handleSubmitAnswer(a, m.getMatchId(), 102L, 1, 0);
        assertTrue(m.reviewFor("1").isEmpty(), "no answer key while the match is live");

        matchmaker.handleForfeit(b, m.getMatchId());
        List<Map<String, Object>> review = m.reviewFor("1");
        assertEquals(10, review.size());
        assertEquals(101L, review.get(0).get("questionId"));
        assertEquals(2, review.get(0).get("myIndex"));
        assertEquals(true, review.get(0).get("correct"));
        assertEquals(1, review.get(1).get("myIndex"));
        assertEquals(false, review.get(1).get("correct"));
        assertEquals(2, review.get(1).get("correctIndex"));
        assertNull(review.get(2).get("myIndex"), "unanswered question");
        assertTrue(m.reviewFor("9").isEmpty());

        JsonNode sent = events(wsA, "match_ended").get(0).get("review");
        assertEquals(2, sent.get(1).get("correctIndex").asInt());
    }

    @Test
    @DisplayName("Rematch: the requester is told at once when the opponent is offline or already playing")
    void rematchUnavailable() throws Exception {
        WebSocketSession wsA = ws(), wsB = ws();
        OctagonSession a = new OctagonSession("1", "A", wsA);
        OctagonSession b = new OctagonSession("2", "B", wsB);
        ActiveMatch m = queuedMatch(a, b, wsA);
        m.setStartedAt(Instant.now());
        matchmaker.handleForfeit(b, m.getMatchId());

        when(wsB.isOpen()).thenReturn(false);
        matchmaker.handleRequestRevenge(a, m.getMatchId());
        assertEquals("OPPONENT_OFFLINE", events(wsA, "revenge_unavailable").get(0).get("reason").asText());
    }

    @Test
    @DisplayName("Rematch: the opponent is asked (revenge_requested) and both accepting creates one new match")
    void rematchRequestedThenAccepted() throws Exception {
        WebSocketSession wsA = ws(), wsB = ws();
        OctagonSession a = new OctagonSession("1", "A", wsA);
        OctagonSession b = new OctagonSession("2", "B", wsB);
        ActiveMatch m = queuedMatch(a, b, wsA);
        m.setStartedAt(Instant.now());
        matchmaker.handleForfeit(b, m.getMatchId());

        matchmaker.handleRequestRevenge(a, m.getMatchId());
        assertEquals(m.getMatchId().toString(), events(wsB, "revenge_requested").get(0).get("matchId").asText());
        matchmaker.handleRequestRevenge(b, m.getMatchId());
        assertEquals(2, events(wsA, "match_found").size(), "exactly one rematch is created");
        assertEquals(2, events(wsB, "match_found").size());
    }

    @Test
    @DisplayName("Radar data mirrors the matchmaking windows: ±30 → ±80 → any, bot after 7 s")
    void queueStatusPayload() {
        OctagonSession s = new OctagonSession("1", "A", ws());
        s.setCurrentElo(420);
        Instant now = Instant.now();
        s.setQueuedAt(now);
        Map<String, Object> p = OctagonMatchmaker.queueStatusPayload(s, 2, 9, now);
        assertEquals(30, p.get("eloRange"));
        assertEquals(420, p.get("elo"));
        assertEquals(7L, p.get("botInSec"));
        assertEquals(2, p.get("searching"));
        assertEquals(9L, p.get("online"));

        s.setQueuedAt(now.minusSeconds(4));
        assertEquals(80, OctagonMatchmaker.queueStatusPayload(s, 0, 1, now).get("eloRange"));
        s.setQueuedAt(now.minusSeconds(6));
        Map<String, Object> wide = OctagonMatchmaker.queueStatusPayload(s, 0, 1, now);
        assertTrue(wide.containsKey("eloRange"));
        assertNull(wide.get("eloRange"));
        assertEquals(1L, wide.get("botInSec"));
    }

    @Test
    @DisplayName("Time spent: until the last answer when all are answered, otherwise until the end")
    void secondsSpent() {
        OctagonSession a = new OctagonSession("1", "A", ws());
        OctagonSession b = new OctagonSession("2", "B", ws());
        ActiveMatch m = new ActiveMatch(UUID.randomUUID(), a, b, "2", "B", 100, false, OctagonGameType.RANKED_QUEUE,
                List.of(1L, 2L), Map.of(1L, 0, 2L, 0));
        assertNull(m.secondsSpent("1", Instant.now()), "not started yet");
        Instant start = Instant.now().minusSeconds(100);
        m.setStartedAt(start);
        m.getPlayer1AnswerTimes().put(1L, start.plusSeconds(20));
        assertEquals(100, m.secondsSpent("1", start.plusSeconds(100)));
        m.getPlayer1AnswerTimes().put(2L, start.plusSeconds(42));
        assertEquals(42, m.secondsSpent("1", start.plusSeconds(100)));
        assertNull(m.secondsSpent("9", Instant.now()));
    }
}
