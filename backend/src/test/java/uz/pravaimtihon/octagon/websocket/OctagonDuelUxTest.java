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
import uz.pravaimtihon.octagon.entity.OctagonChallenge;
import uz.pravaimtihon.octagon.entity.OctagonProfile;
import uz.pravaimtihon.octagon.enums.OctagonChallengeStatus;
import uz.pravaimtihon.octagon.enums.OctagonGameType;
import uz.pravaimtihon.octagon.enums.OctagonRank;
import uz.pravaimtihon.octagon.service.OctagonBotPersonas;
import uz.pravaimtihon.octagon.service.OctagonService;
import uz.pravaimtihon.repository.QuestionRepository;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.LongStream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Oktagon UX talablari (2026-10-21): raqib kartasi (ism/rasm/ELO/liga, null yo'q), "inson" botlar,
 * havola/kod orqali duel, 30 soniyalik chaqiruv va uni bekor qilish.
 */
@DisplayName("Octagon duel UX: opponent card, bots, invite join, challenge lifecycle")
class OctagonDuelUxTest {

    private static final List<Long> QIDS = LongStream.rangeClosed(1, 10).boxed().toList();

    private OctagonService octagonService;
    private OctagonMatchmaker matchmaker;
    private final ObjectMapper om = new ObjectMapper();

    @BeforeEach
    void setUp() {
        octagonService = mock(OctagonService.class);
        matchmaker = new OctagonMatchmaker(octagonService, mock(QuestionRepository.class), om, new uz.pravaimtihon.octagon.service.OctagonCodeGuard());
        when(octagonService.getRandomQuestionIds(anyInt())).thenReturn(QIDS);
        when(octagonService.getQuestionsByIds(anyList())).thenReturn(List.of());
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

    private void profile(String userId, int elo, String avatar) {
        when(octagonService.getProfileSnapshot(userId)).thenReturn(OctagonProfile.builder()
                .userId(userId).eloRating(elo).rank(OctagonRank.fromElo(elo)).build());
        when(octagonService.resolveAvatarUrl(userId)).thenReturn(avatar);
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

    @Test
    @DisplayName("Opponent card: name never blank, league from ELO, avatar null when missing")
    void opponentCardShape() {
        Map<String, Object> card = OctagonMatchmaker.opponentCard("5", "  ", 520, null);
        assertEquals("Haydovchi", card.get("name"));
        assertEquals("brilliant", card.get("rank"));
        assertEquals("💎", card.get("rankEmoji"));
        assertEquals(520, card.get("elo"));
        assertTrue(card.containsKey("avatar"));
        assertNull(card.get("avatar"));

        Map<String, Object> withPhoto = OctagonMatchmaker.opponentCard("6", "Ali V.", 900, "https://cdn/x.jpg");
        assertEquals("master", withPhoto.get("rank"));
        assertEquals("https://cdn/x.jpg", withPhoto.get("avatar"));
    }

    @Test
    @DisplayName("match_found carries the opponent's real name, photo, ELO and league")
    void matchFoundOpponentIdentity() throws Exception {
        profile("1", 120, "https://photos/1.jpg");
        profile("2", 310, null);
        WebSocketSession w1 = ws(), w2 = ws();
        OctagonSession a = new OctagonSession("1", "Ali V.", w1);
        OctagonSession b = new OctagonSession("2", "+998 90 *** ** 12", w2);
        matchmaker.registerSession(a);
        matchmaker.registerSession(b);
        matchmaker.joinQueue(a, 0, 0);
        matchmaker.joinQueue(b, 0, 0);
        // ELO farqi katta — 15 soniya kutgandan keyin har qanday raqib bilan juftlanadi
        a.setQueuedAt(Instant.now().minusSeconds(16));
        b.setQueuedAt(Instant.now().minusSeconds(16));
        matchmaker.matchmakingTick();

        JsonNode oppForA = events(w1, "match_found").get(0).get("opponent");
        assertEquals("2", oppForA.get("id").asText());
        assertEquals("+998 90 *** ** 12", oppForA.get("name").asText());
        assertEquals(310, oppForA.get("elo").asInt());
        assertEquals("platinum", oppForA.get("rank").asText());
        assertTrue(oppForA.get("avatar").isNull());

        JsonNode oppForB = events(w2, "match_found").get(0).get("opponent");
        assertEquals("Ali V.", oppForB.get("name").asText());
        assertEquals("https://photos/1.jpg", oppForB.get("avatar").asText());
        assertEquals("silver", oppForB.get("rank").asText());
    }

    @Test
    @DisplayName("Bot fallback after 20 s looks like a real player (human name, close ELO)")
    void botLooksHuman() throws Exception {
        profile("1", 200, null);
        WebSocketSession w1 = ws();
        OctagonSession a = new OctagonSession("1", "Ali V.", w1);
        matchmaker.registerSession(a);
        matchmaker.joinQueue(a, 0, 0);
        a.setQueuedAt(Instant.now().minusSeconds(21));
        matchmaker.matchmakingTick();

        JsonNode opp = events(w1, "match_found").get(0).get("opponent");
        String id = opp.get("id").asText();
        assertTrue(OctagonService.isBotId(id));
        assertEquals(OctagonBotPersonas.nameFor(id), opp.get("name").asText());
        assertFalse(opp.get("name").asText().contains("_"));
        int elo = opp.get("elo").asInt();
        assertTrue(Math.abs(elo - 200) <= 30, "bot ELO " + elo);
    }

    private OctagonChallenge invite(String code, String challengerId) {
        OctagonChallenge c = OctagonChallenge.builder()
                .id(UUID.randomUUID()).challengerId(challengerId).inviteCode(code)
                .status(OctagonChallengeStatus.PENDING).createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusHours(1)).build();
        when(octagonService.getChallenge(code)).thenReturn(Optional.of(c));
        return c;
    }

    @Test
    @DisplayName("join_invite: the link/QR/code starts a friend duel with the inviter (not a random search)")
    void joinInviteStartsDuel() throws Exception {
        profile("1", 0, null);
        profile("2", 0, null);
        WebSocketSession w1 = ws(), w2 = ws();
        OctagonSession inviter = new OctagonSession("1", "Ali V.", w1);
        OctagonSession joiner = new OctagonSession("2", "Vali A.", w2);
        matchmaker.registerSession(inviter);
        matchmaker.registerSession(joiner);
        OctagonChallenge c = invite("4821", "1");

        matchmaker.handleJoinInvite(joiner, "4821");

        JsonNode found = events(w2, "match_found").get(0);
        assertEquals("1", found.get("opponent").get("id").asText());
        assertEquals("2", events(w1, "match_found").get(0).get("opponent").get("id").asText());
        ActiveMatch m = matchmaker.findActiveMatch(UUID.fromString(found.get("matchId").asText())).orElseThrow();
        assertEquals(OctagonGameType.DUEL_FRIEND, m.getGameType());
        verify(octagonService).markInviteAccepted(c.getId());
    }

    @Test
    @DisplayName("join_invite: clear errors for unknown code, own invite and offline inviter")
    void joinInviteErrors() throws Exception {
        profile("2", 0, null);
        WebSocketSession w2 = ws();
        OctagonSession joiner = new OctagonSession("2", "Vali A.", w2);
        matchmaker.registerSession(joiner);
        when(octagonService.getChallenge(anyString())).thenReturn(Optional.empty());

        matchmaker.handleJoinInvite(joiner, "NOPE");
        invite("MINE000000", "2");
        matchmaker.handleJoinInvite(joiner, "MINE000000");
        invite("OFFLINE000", "99");
        matchmaker.handleJoinInvite(joiner, "OFFLINE000");

        List<String> codes = events(w2, "challenge_error").stream().map(n -> n.get("code").asText()).toList();
        assertEquals(List.of("INVITE_NOT_FOUND", "OWN_INVITE", "INVITER_OFFLINE"), codes);
        assertTrue(events(w2, "match_found").isEmpty());
        verify(octagonService, never()).markInviteAccepted(any());
    }

    @Test
    @DisplayName("4-digit codes cannot be brute-forced: 10 wrong guesses per user per minute, shared by invites and rooms")
    void codeGuessingIsThrottledPerUser() throws Exception {
        profile("2", 0, null);
        when(octagonService.getChallenge(anyString())).thenReturn(Optional.empty());
        WebSocketSession w2 = ws();
        OctagonSession joiner = new OctagonSession("2", "Vali A.", w2);
        matchmaker.registerSession(joiner);

        for (int i = 0; i < 6; i++) matchmaker.handleJoinInvite(joiner, String.valueOf(1000 + i));
        for (int i = 0; i < 4; i++) matchmaker.handleJoinRoom(joiner, String.valueOf(2000 + i));
        matchmaker.handleJoinInvite(joiner, "3000");
        matchmaker.handleJoinRoom(joiner, "3001");

        List<String> inviteCodes = events(w2, "challenge_error").stream().map(n -> n.get("code").asText()).toList();
        assertEquals(Collections.nCopies(6, "INVITE_NOT_FOUND"), inviteCodes.subList(0, 6));
        assertEquals("RATE_LIMITED", inviteCodes.get(6));
        List<String> roomCodes = events(w2, "room_error").stream().map(n -> n.get("code").asText()).toList();
        assertEquals(List.of("ROOM_NOT_FOUND", "ROOM_NOT_FOUND", "ROOM_NOT_FOUND", "ROOM_NOT_FOUND", "RATE_LIMITED"), roomCodes);

        // Reconnecting (new WebSocket session) does not reset the budget
        WebSocketSession w3 = ws();
        OctagonSession again = new OctagonSession("2", "Vali A.", w3);
        matchmaker.registerSession(again);
        matchmaker.handleJoinInvite(again, "3002");
        assertEquals("RATE_LIMITED", events(w3, "challenge_error").get(0).get("code").asText());
        verify(octagonService, times(6)).getChallenge(anyString());
    }

    @Test
    @DisplayName("opponent_progress tells the rival which question I'm on and when I've finished all questions")
    void opponentProgressCarriesFinishedFlag() throws Exception {
        profile("1", 0, null);
        profile("2", 0, null);
        WebSocketSession w1 = ws(), w2 = ws();
        OctagonSession inviter = new OctagonSession("1", "Ali V.", w1);
        OctagonSession joiner = new OctagonSession("2", "Vali A.", w2);
        matchmaker.registerSession(inviter);
        matchmaker.registerSession(joiner);
        invite("4821", "1");
        matchmaker.handleJoinInvite(joiner, "4821");
        ActiveMatch m = matchmaker.findActiveMatch(
                UUID.fromString(events(w2, "match_found").get(0).get("matchId").asText())).orElseThrow();
        m.setStartedAt(Instant.now().minusSeconds(5));
        m.setDeadlineAt(Instant.now().plusSeconds(300));
        m.setMinAnswerIntervalMs(0);

        for (Long q : QIDS) matchmaker.handleSubmitAnswer(joiner, m.getMatchId(), q, 0, 0);

        List<JsonNode> progress = events(w1, "opponent_progress");
        assertEquals(QIDS.size(), progress.size());
        JsonNode third = progress.get(2);
        assertEquals(2, third.get("questionIndex").asInt());
        assertEquals(3, third.get("answeredCount").asInt());
        assertEquals(10, third.get("totalQuestions").asInt());
        assertFalse(third.get("finished").asBoolean());
        JsonNode last = progress.get(QIDS.size() - 1);
        assertEquals(10, last.get("answeredCount").asInt());
        assertTrue(last.get("finished").asBoolean());
        // the finishing player gets no opponent_progress about himself
        assertTrue(events(w2, "opponent_progress").isEmpty());
    }

    @Test
    @DisplayName("Room codes are 4-digit PINs and unique among open rooms")
    void roomCodesAreFourDigits() {
        Set<String> codes = new HashSet<>();
        for (int i = 0; i < 40; i++) {
            OctagonSession host = new OctagonSession("h" + i, "Host " + i, ws());
            matchmaker.registerSession(host);
            matchmaker.handleCreateRoom(host, 4, true);
            String code = matchmaker.getUserRoomCode("h" + i);
            assertTrue(code.matches("[1-9][0-9]{3}"), code);
            assertTrue(codes.add(code), "duplicate room code " + code);
        }
    }

    @Test
    @DisplayName("Direct challenge: 30 s window, challenger card with avatar, cancel closes the target's prompt")
    void challengeLifecycle() throws Exception {
        profile("1", 160, "https://photos/1.jpg");
        profile("2", 0, null);
        WebSocketSession w1 = ws(), w2 = ws();
        OctagonSession challenger = new OctagonSession("1", "Ali V.", w1);
        OctagonSession target = new OctagonSession("2", "Vali A.", w2);
        matchmaker.registerSession(challenger);
        matchmaker.registerSession(target);

        matchmaker.handleSendChallenge(challenger, "2");

        JsonNode sent = events(w1, "challenge_sent").get(0);
        assertEquals(30, sent.get("expiresInSec").asInt());
        assertEquals("Vali A.", sent.get("targetName").asText());
        JsonNode received = events(w2, "challenge_received").get(0);
        assertEquals("Ali V.", received.get("challenger").get("displayName").asText());
        assertEquals("https://photos/1.jpg", received.get("challenger").get("avatarUrl").asText());
        assertEquals("gold", received.get("challenger").get("rank").asText());

        UUID challengeId = UUID.fromString(sent.get("challengeId").asText());
        matchmaker.handleCancelChallenge(target, challengeId); // only the challenger may cancel
        assertTrue(events(w2, "challenge_cancelled").isEmpty());
        matchmaker.handleCancelChallenge(challenger, challengeId);
        assertEquals("CANCELLED", events(w2, "challenge_cancelled").get(0).get("reason").asText());

        // a cancelled challenge can no longer be accepted
        matchmaker.handleAcceptChallenge(target, challengeId);
        assertEquals("CHALLENGE_EXPIRED", events(w2, "challenge_error").get(0).get("code").asText());
    }

    @Test
    @DisplayName("Bot joins after 7 s without a human (the player is never left waiting)")
    void botAfterSevenSeconds() throws Exception {
        profile("1", 200, null);
        WebSocketSession w1 = ws();
        OctagonSession a = new OctagonSession("1", "Ali V.", w1);
        matchmaker.registerSession(a);
        matchmaker.joinQueue(a, 0, 0);
        a.setQueuedAt(Instant.now().minusSeconds(5));
        matchmaker.matchmakingTick();
        assertTrue(events(w1, "match_found").isEmpty());
        a.setQueuedAt(Instant.now().minusSeconds(8));
        matchmaker.matchmakingTick();
        assertTrue(OctagonService.isBotId(events(w1, "match_found").get(0).get("opponent").get("id").asText()));
    }

    @Test
    @DisplayName("match_ended carries the question count and the new rating for the result screen")
    void matchEndedHasAccuracyAndNewElo() throws Exception {
        profile("1", 150, null);
        profile("2", 150, null);
        WebSocketSession w1 = ws(), w2 = ws();
        OctagonSession inviter = new OctagonSession("1", "Ali V.", w1);
        OctagonSession joiner = new OctagonSession("2", "Vali A.", w2);
        matchmaker.registerSession(inviter);
        matchmaker.registerSession(joiner);
        invite("4821", "1");
        matchmaker.handleJoinInvite(joiner, "4821");
        ActiveMatch m = matchmaker.findActiveMatch(
                UUID.fromString(events(w2, "match_found").get(0).get("matchId").asText())).orElseThrow();
        m.setStartedAt(Instant.now().minusSeconds(5));
        m.setDeadlineAt(Instant.now().plusSeconds(300));
        m.setMinAnswerIntervalMs(0);
        for (Long q : QIDS) {
            matchmaker.handleSubmitAnswer(inviter, m.getMatchId(), q, 0, 0);
            matchmaker.handleSubmitAnswer(joiner, m.getMatchId(), q, 1, 0);
        }

        JsonNode ended = events(w1, "match_ended").get(0);
        assertEquals(10, ended.get("totalQuestions").asInt());
        assertEquals(150, ended.get("myNewElo").asInt());
    }
}
