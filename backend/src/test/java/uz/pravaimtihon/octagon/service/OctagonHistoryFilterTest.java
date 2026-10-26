package uz.pravaimtihon.octagon.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import uz.pravaimtihon.octagon.dto.OctagonDtos.MatchHistoryEntry;
import uz.pravaimtihon.octagon.entity.OctagonMatch;
import uz.pravaimtihon.octagon.repository.OctagonChallengeRepository;
import uz.pravaimtihon.octagon.repository.OctagonMatchRepository;
import uz.pravaimtihon.octagon.repository.OctagonProfileRepository;
import uz.pravaimtihon.octagon.repository.OctagonReportRepository;
import uz.pravaimtihon.repository.QuestionRepository;
import uz.pravaimtihon.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@DisplayName("History filter tabs (all / wins / losses / draws) are applied in the database")
class OctagonHistoryFilterTest {

    private OctagonMatchRepository matches;
    private OctagonService service;

    @BeforeEach
    void setUp() {
        matches = mock(OctagonMatchRepository.class);
        service = new OctagonService(mock(OctagonProfileRepository.class), matches, mock(OctagonChallengeRepository.class),
                mock(OctagonReportRepository.class), mock(QuestionRepository.class), mock(UserRepository.class),
                mock(OctagonEloCalculator.class), mock(uz.pravaimtihon.payment.service.PaymentAccessService.class));
        Page<OctagonMatch> one = new PageImpl<>(List.of(OctagonMatch.builder().id(UUID.randomUUID()).player1Id("7").player2Id("8")
                .player1Score(6).player2Score(4).winnerId("7").isDraw(false).p1EloChange(20).p2EloChange(-12)
                .durationSeconds(140).createdAt(LocalDateTime.now()).build()));
        when(matches.findUserMatches(anyString(), any(Pageable.class))).thenReturn(one);
        when(matches.findUserWins(anyString(), any(Pageable.class))).thenReturn(one);
        when(matches.findUserLosses(anyString(), any(Pageable.class))).thenReturn(Page.empty());
        when(matches.findUserDraws(anyString(), any(Pageable.class))).thenReturn(Page.empty());
    }

    @Test
    @DisplayName("WIN / LOSS / DRAW use their own query; anything else returns all matches")
    void routesFilter() {
        Page<MatchHistoryEntry> wins = service.getUserHistory("7", 0, 10, "win");
        assertEquals("WIN", wins.getContent().get(0).getResult());
        assertEquals(140, wins.getContent().get(0).getDurationSeconds());
        verify(matches).findUserWins(eq("7"), any(Pageable.class));

        assertTrue(service.getUserHistory("7", 0, 10, "LOSS").isEmpty());
        verify(matches).findUserLosses(eq("7"), any(Pageable.class));
        assertTrue(service.getUserHistory("7", 0, 10, "DRAW").isEmpty());
        verify(matches).findUserDraws(eq("7"), any(Pageable.class));

        service.getUserHistory("7", 0, 10, null);
        service.getUserHistory("7", 0, 10, "bogus");
        verify(matches, times(2)).findUserMatches(eq("7"), any(Pageable.class));
    }
}
