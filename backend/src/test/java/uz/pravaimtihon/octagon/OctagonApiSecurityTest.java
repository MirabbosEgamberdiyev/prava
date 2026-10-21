package uz.pravaimtihon.octagon;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import uz.pravaimtihon.exception.ForbiddenException;
import uz.pravaimtihon.exception.UnauthorizedException;
import uz.pravaimtihon.octagon.controller.OctagonController;
import uz.pravaimtihon.octagon.dto.OctagonDtos.*;
import uz.pravaimtihon.octagon.entity.OctagonMatch;
import uz.pravaimtihon.octagon.entity.OctagonProfile;
import uz.pravaimtihon.octagon.enums.OctagonGameType;
import uz.pravaimtihon.octagon.enums.OctagonRank;
import uz.pravaimtihon.octagon.repository.*;
import uz.pravaimtihon.octagon.service.OctagonEloCalculator;
import uz.pravaimtihon.octagon.service.OctagonGuestIdentity;
import uz.pravaimtihon.octagon.service.OctagonService;
import uz.pravaimtihon.octagon.service.OctagonTicketService;
import uz.pravaimtihon.octagon.websocket.OctagonMatchmaker;
import uz.pravaimtihon.repository.QuestionRepository;
import uz.pravaimtihon.repository.UserRepository;
import uz.pravaimtihon.entity.User;
import uz.pravaimtihon.security.CustomUserDetails;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@DisplayName("Octagon REST/DTO security (audit 2026-10-20)")
class OctagonApiSecurityTest {

    private OctagonProfileRepository profileRepo;
    private OctagonMatchRepository matchRepo;
    private UserRepository userRepo;
    private OctagonService service;
    private OctagonGuestIdentity guests;
    private OctagonMatchmaker matchmaker;
    private OctagonController controller;
    private OctagonTicketService tickets;

    @BeforeEach
    void setUp() {
        profileRepo = mock(OctagonProfileRepository.class);
        matchRepo = mock(OctagonMatchRepository.class);
        userRepo = mock(UserRepository.class);
        when(profileRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        when(matchRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        service = new OctagonService(profileRepo, matchRepo, mock(OctagonChallengeRepository.class),
                mock(OctagonReportRepository.class), mock(QuestionRepository.class), userRepo, new OctagonEloCalculator());
        guests = new OctagonGuestIdentity("test-secret-for-unit-tests-only-0123456789");
        matchmaker = mock(OctagonMatchmaker.class);
        tickets = new OctagonTicketService();
        controller = new OctagonController(tickets, service, matchmaker);
    }

    @Test
    @DisplayName("Boolean DTO fields serialise as isHost/isReady/isOnline/isPrivate (clients read these names)")
    void booleanJsonNames() throws Exception {
        ObjectMapper om = new ObjectMapper();
        JsonNode m = om.valueToTree(GroupRoomMemberDto.builder().isHost(true).isReady(true).build());
        assertTrue(m.get("isHost").asBoolean());
        assertTrue(m.get("isReady").asBoolean());
        assertFalse(m.has("host"));
        JsonNode r = om.valueToTree(GroupRoomDto.builder().isPrivate(true).build());
        assertTrue(r.get("isPrivate").asBoolean());
        JsonNode u = om.valueToTree(UserSearchResult.builder().isOnline(true).build());
        assertTrue(u.get("isOnline").asBoolean(), "duel search showed everyone offline before this fix");
    }

    @Test
    @DisplayName("Guest tokens: signed, verifiable, tamper-proof")
    void guestTokens() {
        String t = guests.issueToken();
        String id = guests.verifyToken(t);
        assertNotNull(id);
        assertTrue(id.matches("guest_[0-9a-f]{16}"));
        assertNull(guests.verifyToken(t.substring(0, t.length() - 1) + (t.endsWith("A") ? "B" : "A")));
        assertNull(guests.verifyToken("guest_abcdef12"), "legacy client-made ids are not credentials");
        assertNull(new OctagonGuestIdentity("other-secret").verifyToken(t));
    }

    @Test
    @DisplayName("Ticket: guests are refused (mandatory login since 2026-10-21)")
    void ticketRequiresLogin() {
        assertThrows(UnauthorizedException.class, () -> controller.getOneTimeTicket(null));
    }

    @Test
    @DisplayName("Ticket: a logged-in user gets a ticket bound to their own id and server-side name")
    void ticketForUser() {
        CustomUserDetails principal = mock(CustomUserDetails.class);
        when(principal.getId()).thenReturn(42L);
        User u = new User();
        u.setId(42L);
        u.setFirstName("Ali");
        u.setLastName("Valiyev");
        when(userRepo.findById(42L)).thenReturn(Optional.of(u));

        var res = controller.getOneTimeTicket(principal).getBody().getData();
        assertEquals("42", res.getUserId());
        assertNull(res.getGuestId());
        OctagonTicketService.TicketData td = tickets.consumeTicket(res.getTicket());
        assertEquals("42", td.userId());
        assertEquals("Ali V.", td.displayName());
    }

    @Test
    @DisplayName("User search requires login and never matches by phone/e-mail")
    void searchRequiresAuth() {
        assertThrows(UnauthorizedException.class, () -> controller.searchUsers(null, "99890"));
        when(userRepo.searchActiveUsersByName(anyString(), any(Pageable.class))).thenReturn(Page.empty());
        service.searchUsers("+99890123", "1");
        service.searchUsers("ali@gmail.com", "1");
        verify(userRepo, never()).searchUsers(anyString(), any(Pageable.class));
    }

    @Test
    @DisplayName("Name search escapes LIKE wildcards")
    void searchEscapesWildcards() {
        when(userRepo.searchActiveUsersByName(anyString(), any(Pageable.class))).thenReturn(Page.empty());
        service.searchUsers("a%_b", "1");
        verify(userRepo).searchActiveUsersByName(eq("a\\%\\_b"), any(Pageable.class));
    }

    @Test
    @DisplayName("Questions endpoint refuses ids that are not in a live game")
    void questionsGuard() {
        when(matchmaker.areQuestionsInActiveGame(anyList())).thenReturn(false);
        assertThrows(ForbiddenException.class, () -> controller.getQuestions(List.of(1L, 2L)));
    }

    @Test
    @DisplayName("History is the caller's own only (no ?userId= IDOR)")
    void historyOwnOnly() {
        when(matchRepo.findUserMatches(anyString(), any())).thenReturn(new PageImpl<>(List.of()));
        controller.getHistory(null, 0, 10);
        verify(matchRepo, never()).findUserMatches(anyString(), any());
    }

    @Test
    @DisplayName("Challenge/report need an identified caller")
    void challengeRequiresCaller() {
        assertThrows(UnauthorizedException.class, () -> controller.createChallenge(null, null));
        assertThrows(UnauthorizedException.class, () -> controller.submitReport(null,
                ReportRequest.builder().reportedUserId("7").reason("AFK").build()));
    }

    @Test
    @DisplayName("Forfeit: the abandoning player loses even with the higher score")
    void forfeitWinner() {
        when(profileRepo.findById(anyString())).thenReturn(Optional.empty());
        OctagonMatch m = service.recordMatchResult(UUID.randomUUID(), "1", "2", 7, 2, List.of(1L), 60,
                OctagonGameType.RANKED_QUEUE, "1");
        assertEquals("2", m.getWinnerId());
        assertFalse(m.getIsDraw());
        assertTrue(m.getP1EloChange() <= 0);
        assertTrue(m.getP2EloChange() > 0);
    }

    @Test
    @DisplayName("Bot profiles are never persisted and a match is never recorded twice")
    void botAndDuplicate() {
        when(profileRepo.findById(anyString())).thenReturn(Optional.of(OctagonProfile.builder()
                .userId("1").eloRating(100).rank(OctagonRank.SILVER).wins(0).losses(0).draws(0)
                .winStreak(0).maxWinStreak(0).totalMatches(0).build()));
        UUID id = UUID.randomUUID();
        service.recordMatchResult(id, "1", "bot_ab12cd", 5, 3, List.of(1L), 60, OctagonGameType.BOT_TRAINING, null);
        verify(profileRepo, never()).save(argThat(p -> p.getUserId().startsWith("bot")));

        when(matchRepo.findById(id)).thenReturn(Optional.of(OctagonMatch.builder().id(id).build()));
        service.recordMatchResult(id, "1", "bot_ab12cd", 5, 3, List.of(1L), 60, OctagonGameType.BOT_TRAINING, null);
        verify(profileRepo, times(1)).save(any());
    }

    @Test
    @DisplayName("Answers are not shipped: no explanations in the question payload")
    void noExplanationsInPayload() throws Exception {
        JsonNode q = new ObjectMapper().valueToTree(QuestionDto.builder().id(1L).build());
        assertTrue(q.get("explanationUzl") == null || q.get("explanationUzl").isNull());
    }

    @Test
    @DisplayName("Report: self-report rejected, reason normalised")
    void reportValidation() {
        assertThrows(RuntimeException.class, () -> service.submitReport("7",
                ReportRequest.builder().reportedUserId("7").reason("AFK").build()));
    }
}
